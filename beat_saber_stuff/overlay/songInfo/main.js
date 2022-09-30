var ws;

var currentScene = "Menu";
var isPaused = false;

const diffColors = {
	Easy: "#008055",
	Normal: "#1268a1",
	Hard: "#bd5500",
	Expert: "#b52a1c",
	ExpertPlus: "#454088"
};

function formatTime(val) {
	let secs = val % 60;
	let mins = Math.floor(val / 60);

	return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getHTTP(url, callback) {
	let xH = new XMLHttpRequest();

	xH.onreadystatechange = function() {
		if(xH.readyState === 4 && xH.status === 200) {
			callback(xH.responseText);
		}
	}

	xH.open("GET", url, true);
	xH.send(null);
}

function startWebsocket() {
	console.log("Starting connection to BS+...");

	let url = `ws://${ip}:${port}/socket`;
	ws = new WebSocket(url);
	ws._init = false;

	ws.addEventListener("message", function(msg) {
		var data = JSON.parse(msg.data);

		if(!ws._init) {
			ws._init = true;
			console.log(`%cBeat Saber v${data.gameVersion}`, 'font-weight: 700');
		}

		//console.log(data);

		if(data._type === "event") {
			processMessage(data);
		}
	});

	ws.addEventListener("open", function() {
		console.log(`%cConnected to server at ${url}`, 'background-color: #484; color: #fff');
	});

	ws.addEventListener("close", function() {
		console.log(`%cConnection to ${url} failed, retrying in 5 seconds...`, 'background-color: #a55; color: #fff');
		setTimeout(startWebsocket, 5000);
	});
}
startWebsocket();

function showStuff() {
	if(disableMovement) {
		$("body").show();
	} else {
		$("body").removeClass("hide");
	}
}
function hideStuff() {
	if(disableMovement) {
		$("body").hide();
	} else {
		$("body").addClass("hide");
	}

	stopTimers();
}
function pauseStuff() {
	$("body").addClass("pause");
	stopTimers();
}
function resumeStuff() {
	$("body").removeClass("pause");
	startTimers();
}

var curDiff;
var elapsed = 0;
var songLength = 0;
var eventFuncs = {
	"gameState": function(data) {
		oldScene = currentScene;
		console.log(data);

		if(data.gameStateChanged === "Playing") {
			currentScene = "Game";
		} else {
			currentScene = "Menu";
		}

		if(oldScene !== currentScene) {
			if(currentScene === "Game") {
				showStuff();
			} else {
				$("body").removeClass("pause");
				hideStuff();
			}
		}
	},

	"pause": function(data) {
		console.log("PAUSED");
		pauseStuff();
		isPaused = true;
	},

	"resume": function(data) {
		console.log("RESUMED");
		resumeStuff();
		isPaused = false;
	},

	"mapInfo": function(data) {
		let map = data.mapInfoChanged;
		map.hash = map.level_id.replace("custom_level_", "");

		switchSubHeads();
		toggleSubHeads(0);

		console.log(data);

		loadImage(`data:image/jpg;base64,${map.coverRaw}`);
		
		$("#title").text(map.name);
		if(map.sub_name !== "") {
			$("#subtitle").show();
			$("#subtitle").text(map.sub_name);
		} else {
			$("#subtitle").hide();
		}

		$("#artist").text(map.artist);
		$("#mapperName").text(map.mapper === "" ? "N/A" : map.mapper);

		$("#titleWrapTheSecond").removeClass("scroll");
		let titleWidth = $("#titleWrap").width();
		let checkWidth = $(window).width() - parseInt($("#titleWrap").css("left"));
		if(titleWidth > checkWidth) {
			setTimeout(function() {
				$("#titleWrapTheSecond").addClass("scroll");
			}, 10)
			$(":root").get(0).style.setProperty("--titleScrollAmount", `-${titleWidth-checkWidth+32}px`);
		}

		$("#artistWrapTheSecond").removeClass("artist-scroll");
		let artistWidth = $("#artistWrap").width();
		checkWidth = $(window).width() - parseInt($("#artistWrap").css("left"));
		if(artistWidth > checkWidth) {
			setTimeout(function() {
				$("#artistWrapTheSecond").addClass("artist-scroll");
			}, 10)
			$(":root").get(0).style.setProperty("--artistScrollAmount", `-${artistWidth-checkWidth+32}px`);
		}

		$("#mapperWrapTheSecond").removeClass("mapper-scroll");
		let mapperWidth = $("#mapperWrap").width();
		checkWidth = $(window).width() - parseInt($("#mapperWrap").css("left"));
		if(mapperWidth > checkWidth) {
			setTimeout(function() {
				$("#mapperWrapTheSecond").addClass("mapper-scroll");
			}, 10)
			$(":root").get(0).style.setProperty("--mapperScrollAmount", `-${mapperWidth-checkWidth+276}px`);
		}

		songLength = Math.floor(map.duration/1000)
		$("#duration").text(formatTime(songLength));

		$("#tempo").text(map.BPM);

		$("#bsrCode").text("N/A");
		$("#bloqs").text("???");
		$("#nps").text("???");
		$("#njs").text("???");
		$("#ssStars").text("Unranked");
		$("#ssStars").removeClass("isRanked");
		$("#blStars").text("Unranked");
		$("#blStars").removeClass("isRanked");

		$("#avatar").hide();

		getHTTP(`https://api.beatsaver.com/maps/hash/${map.hash}`, function(response) {
			let bsData = JSON.parse(response);
			console.log(bsData);

			let chartData = [];
			for(let i in bsData.versions[0].diffs) {
				let d = bsData.versions[0].diffs[i];
				if(d.characteristic === map.characteristic && d.difficulty === map.difficulty) {
					chartData = d;
				}
			}

			$("#bsrCode").text(bsData.id);
			if(chartData.length) {
				$("#bloqs").text(chartData.notes.toLocaleString());
				$("#nps").text(chartData.nps.toFixed(2));
				$("#njs").text(chartData.njs);
			}

			if(bsData.ranked && chartData.length) {
				$("#ssStars").html(`${chartData.stars.toFixed(2)} <i class="fas fa-star fa-fw"></i>`);
				$("#ssStars").addClass("isRanked");
			} else {
				$("#ssStars").text("Unranked");
				$("#ssStars").removeClass("isRanked");
			}

			let verified = bsData.uploader.verifiedMapper;
			if(!disableAvatars && (verified || showAllAvatars)) {
				$("#avatar").attr("src", bsData.uploader.avatar);
				$("#avatar").show();
			}
		});

		// .......yaaaaaaaay more proxies we love proxies yaaaaaaay
		//getHTTP(`https://api.beatleader.xyz/map/hash/${map.hash}`, function(response) {
		getHTTP(`./bl_proxy.php?hash=${map.hash}`, function(response) {
			let _d = JSON.parse(response);
			let blData = _d.data;
			console.log(blData);

			let chartData;
			for(let i in blData.difficulties) {
				let d = blData.difficulties[i];
				if(d.modeName === map.characteristic && d.difficultyName === map.difficulty) {
					chartData = d;
				}
			}

			if(typeof chartData !== "undefined") {
				if(chartData.stars) {
					$("#blStars").html(`${chartData.stars.toFixed(2)} <i class="fas fa-star fa-fw"></i>`);
					$("#blStars").addClass("isRanked");
				} else {
					$("#blStars").text("Unranked");
					$("#blStars").removeClass("isRanked");
				}
			}
		})

		$("#difficulty").text(map.difficulty.replace("Plus", "+"));
		curDiff = map.difficulty;

		elapsed = 0;

		$("body").css("filter", "");

		$("#mode").attr("src", `../icons/${map.characteristic}.svg`);
	},

	"score": function() {
		// do nothing
	}
}

function processMessage(data) {
	if(data._event in eventFuncs) {
		eventFuncs[data._event](data);
	} else {
		console.log(data);
	}
}

function brightness(c) {
	return Math.sqrt(
		c[0] * c[0] * .241 + 
		c[1] * c[1] * .691 + 
		c[2] * c[2] * .068
	);
}

function interp(var1, var2, weight) {
	return (1 - weight) * var1 + (weight * var2);
}

function loadImage(url) {
	$("#art").attr("src", url);
	$("#artBehind").attr("src", url);
	$("#artBG").css("background-image", `url('${url}')`);
}

var codeBGColor;
$("#art").on("load", async function() {
	if(disableAutoColoring) {
		codeBGColor = [72, 72, 72];
		return;
	}

	let swatches = await Vibrant.from($(this).attr("src")).getSwatches();
	console.log(swatches);
	
	let paletteRaw = [
		[72, 72, 72],
		[72, 72, 72]
	]

	let checks = ["LightVibrant", "DarkVibrant", "Muted", "LightMuted", "DarkMuted"];
	for(let i in checks) {
		let check = checks[i];
		if(check in swatches) {
			if(swatches[check] !== null) {
				paletteRaw.push(swatches[check].getRgb());
			}
		}
	}

	let palette = [];

	for(let i in paletteRaw) {
		let color = paletteRaw[i];
		palette.push({
			brightness: brightness(color),
			color: color
		});
	}

	palette.sort(function(a, b) {
		return b.brightness - a.brightness;
	});

	console.log(palette);

	let darkestIgnoringDefaults = 0;
	let darkestBrightness = 255;
	for(let i in palette) {
		let color = palette[i];
		if(color.brightness < darkestBrightness && color.brightness !== 72) {
			darkestIgnoringDefaults = i;
			darkestBrightness = color.brightness;
		}
	}

	let rawVibrantColor = vibrantColor = [255, 255, 255];
	if(swatches.Vibrant !== null) {
		rawVibrantColor = vibrantColor = swatches.Vibrant.getRgb();
	}
	if(brightness(rawVibrantColor) < 125) {
		console.log("brightness less than 125");
		console.log(rawVibrantColor);
		let p = 25;
		vibrantColor = rawVibrantColor.map(function(x) { 
			return interp(x, 255, 0.45);
		});
		console.log(vibrantColor);
	}

	$(":root").get(0).style.setProperty("--vibrantColor", `rgb(${vibrantColor.join(",")})`);
	$(":root").get(0).style.setProperty("--darkestColor", `rgb(${palette[darkestIgnoringDefaults].color.join(",")})`);
	if(swatches.Vibrant !== null) {
		$(":root").get(0).style.setProperty("--lightestColor", `rgb(${palette[0].color.join(",")})`);
	} else {
		$(":root").get(0).style.setProperty("--lightestColor", `rgb(255, 255, 255)`);
	}

	codeBGColor = palette[darkestIgnoringDefaults];
});

var subHeadSwitchInt;
function switchSubHeads() {
	clearInterval(subHeadSwitchInt);

	subHeadSwitchInt = setInterval(function() {
		toggleSubHeads();
	}, swapDelay);
}
switchSubHeads();

let currentRow = 0;
function toggleSubHeads(which = null) {
	const rows = ["#artistWrap", "#mapperWrap", "#statsWrap"];

	let nextRow = currentRow+1;
	if(which === null) {
		if(nextRow > rows.length-1) {
			nextRow = 0;
		}
	} else {
		nextRow = which;
	}

	for(let i = 0; i < rows.length; i++) {
		let r = rows[i];
		if(i !== nextRow) {
			$(r.slice(0)).fadeOut(150);
		} else {
			setTimeout(function() { $(r.slice(0)).fadeIn(150); }, 150);
		}
	}

	console.log(currentRow, nextRow);
	currentRow = nextRow;
}
toggleSubHeads(0);

var codeBlockInt;
function switchCodeBlocks() {
	clearInterval(codeBlockInt);

	codeBlockInt = setInterval(function() {
		toggleCodeBlocks();
	}, codeSwapDelay);
}
switchCodeBlocks();

function toggleCodeBlocks(which = null) {
	let delay = 0;

	if(which === null) {
		delay = 150;
		which = $("#bsrCode").is(":visible");
	}

	let elem = (which ? "#bsrCode" : "#diffWrap");
	let otherElem = (which ? "#diffWrap" : "#bsrCode");

	$(elem).fadeOut(delay, function() {
		$(otherElem).fadeIn(delay);
	});

	if(elem === "#bsrCode") {
		$("#codeWrap").css("background-color", diffColors[curDiff]);
	} else {
		try {
			$("#codeWrap").css("background-color", `rgba(${codeBGColor.color.join(",")})`);
		} catch {
			// do nothing
		}
	}
}
toggleCodeBlocks(0);

var elapsedTimer;
function startTimers() {
	elapsedTimer = setInterval(function() {
		elapsed++;
		$("#elapsed").text(formatTime(elapsed));

		let perc = (elapsed / songLength);
		if(perc > 1) {
			perc = 1;
		}

		$("#progress").css("width", `${perc*100}%`);
	}, 1000);
}

function stopTimers() {
	clearInterval(elapsedTimer);
}