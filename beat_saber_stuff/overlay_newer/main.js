const query = new URLSearchParams(location.search);

// IP/Port of BS+'s websocket library
const ip = query.get("ip") || "127.0.0.1";
const port = query.get("port") || 2947;

var ws;

var isPaused = false;

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
		console.log(`%cConnection to ${url} failed, retrying in 10 seconds...`, 'background-color: #a55; color: #fff');
		setTimeout(startWebsocket, 10000);
	});
}
startWebsocket();

function pauseStuff() {
	$("body").addClass("pause");
	stopTimers();
}
function resumeStuff() {
	$("body").removeClass("pause");
	startTimers();
}

var secondary = [
	"Toby Fox",
	"Joshabi & Olaf"
];
var mapperAvatar;

var secondaryTimer;
var songLength = 1;
var currentScene = "Menu";
var oldScene;
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
				// do nothing for now
			} else {
				$("body").removeClass("pause");
				stopTimers();
			}
		}
	},

	"pause": function(data) {
		elapsed = Math.floor(data.pauseTime);

		console.log("PAUSED");
		pauseStuff();
		isPaused = true;
	},

	"resume": function(data) {
		elapsed = Math.floor(data.resumeTime);

		console.log("RESUMED");
		resumeStuff();
		isPaused = false;
	},

	"mapInfo": function(data) {
		mapperAvatar = undefined;

		switchSecondary(0);
		clearInterval(secondaryTimer);
		secondaryTimer = setInterval(switchSecondary, 7000);

		console.log(data);

		let map = data.mapInfoChanged;
		map.hash = map.level_id.replace("custom_level_", "");

		switchArt(`data:image/jpg;base64,${map.coverRaw}`);
		$(":root").get(0).style.setProperty("--diffIconURL", `url("icons/${map.characteristic}.svg")`);
		$(":root").get(0).style.setProperty("--currentDiffColor", `var(--color${map.difficulty})`);
		$("#diff").text(map.difficulty.replace("Plus", "+"));

		songLength = Math.ceil(map.duration/1000);
		$("#duration").text(formatTime(songLength));

		$("#titleString").text(map.name + (map.sub_name !== "" ? ` - ${map.sub_name}` : ""));

		let parentWidth = $("#title").width();
		let childWidth = $("#titleString").width();
		$("#titleString").marquee('destroy');

		if(childWidth > parentWidth) {
			$("#titleString").bind('finished', function() {
				$("#titleString").marquee('pause');
				setTimeout(function() {
					$("#titleString").marquee('resume');
				}, 7000);
			})
			.marquee({
				speed: 65,
				pauseOnCycle: true,
				startVisible: true,
				delayBeforeStart: 7000,
				duplicated: true,
				gap: 50
			});
		} else {
			$("#titleString").marquee('destroy');
		}

		secondary[0] = map.artist;
		secondary[1] = map.mapper;

		getHTTP(`https://api.beatsaver.com/maps/hash/${map.hash}`, function(response) {
			let bsData = JSON.parse(response);
			console.log(bsData);

			$("#bsrCode").text(bsData.id);

			let verified = bsData.uploader.verifiedMapper;
			if(verified) {
				mapperAvatar = bsData.uploader.avatar;
			}
		});

		setCombo(0);
		setHitMiss(0, 0);
		$("#hitValue").text(0);
		$("#bloqsFC").show();
		$(".fa-star").show();
		$("#bloqsMissed").hide();
		$(".fa-times").hide();
		oldcombo = 0;
		hits = 0;
	},

	"score": function(data) {
		let scoreData = data.scoreEvent;
		console.log(scoreData);

		setAcc(scoreData.accuracy*100);
		setCombo(scoreData.combo);
		//setHealth(scoreData.currentHealth);

		if(!isNaN(scoreData.score)) {
			setHitMiss(scoreData.combo, scoreData.missCount);
			//setHealth(scoreData.currentHealth);
		}
	}
}

function processMessage(data) {
	if(data._event in eventFuncs) {
		eventFuncs[data._event](data);
	} else {
		console.log(data);
	}
}

var curSecondary = 0;
function switchSecondary(val) {
	if(typeof val === "number") {
		curSecondary = val % secondary.length;
	} else {
		curSecondary++;
		if(curSecondary >= secondary.length) {
			curSecondary = 0;
		}
	}

	$("#secondary").fadeOut(100, function() {
		switch(curSecondary) {
			case 1:
				let stuff = [`<span class="secondaryDarker">mapped by</span>`, ``, `<span class="secondaryNormal mapper"></span>`];
				if(mapperAvatar) {
					stuff[1] = `<img id="mapperAvatar" src="${mapperAvatar}"/>`;
				}

				$("#secondary").html(stuff.join(" "));
				$(".mapper").text(secondary[1]);
				break;

			default:
				$("#secondary").html(`<span class="secondaryNormal artist"></span>`)
				$(".artist").text(secondary[0]);
		}

		$(this).fadeIn(100);
	});
}

setInterval(function() {
	if($("#codeWrap").is(":visible")) {
		$("#codeWrap").fadeOut(100, function() {
			$("#diffWrap").fadeIn(100);
		})
	} else {
		$("#diffWrap").fadeOut(100, function() {
			$("#codeWrap").fadeIn(100);
		})
	}
}, 7000);

function switchArt(url) {
	$("#art").attr("src", url);
	$("#artOutline").attr("src", url);
	$("#artBG").attr("src", url);
}

var elapsedTimer;
var elapsed = 0;

function startTimers() {
	elapsedTimer = setInterval(function() {
		elapsed += 0.5;
		$("#elapsed").text(formatTime(elapsed));

		let perc = (elapsed / songLength);
		if(perc > 1) {
			perc = 1;
		}

		$(":root").get(0).style.setProperty("--currentProgressAngle", `${perc * 360}deg`);

		$("#time").text(formatTime(Math.floor(elapsed)));
	}, 500);
}

function stopTimers() {
	clearInterval(elapsedTimer);
}

var finalNums = [null, null, null, null];
var currentNums = [0, 0, 0, 0];

function splitAcc(acc) {
	return [
		(acc - (acc % 10))/10 | 0, 
		Math.floor(acc % 10) | 0,
		Math.floor((acc*10) % 10) | 0,
		Math.floor((acc*100) % 10) | 0
	];
}

var curAcc = 0;
var finalAcc = 0;
var animatingAccChange = false;
function setAcc(acc) {
	finalAcc = acc;

	if(acc === 100 || acc === 0) {
		finalNums = [null, null, null, null];
		currentNums = [0, 0, 0, 0];
		
		$("#accNum0").text("0");
		$("#accNum1").text("0");
		$("#accNum2").text("0");
		$("#accNum3").text("0");

		return;
	}

	if(!animatingAccChange) {
		animateAccChange();
	}
}

var accChangeTO;
var currentNums;
function animateAccChange() {
	animatingAccChange = true;
	clearTimeout(accChangeTO);

	if(curAcc === finalAcc) {
		return;
	}

	let toChange = Math.round((finalAcc - curAcc)*100)/100;

	if(!toChange) {
		animatingAccChange = false;
		return;
	}

	if(toChange > 0) {
		curAcc += Math.ceil((toChange*100) / 10) / 100;
	} else if(toChange < 0) {
		curAcc += Math.floor((toChange*100) / 10) / 100;
	}

	let oldNums = currentNums.slice(0);
	currentNums = splitAcc(curAcc);

	let samesies = 0;
	for(let i = 0; i < 4; i++) {
		if(oldNums[i] === currentNums[i]) {
			samesies++;
			continue;
		}

		$(`#accNum${i}`).text(currentNums[i]);
	}

	if(samesies === 4) {
		animatingAccChange = false;
	}

	accChangeTO = setTimeout(animateAccChange, 5);
}

var currentComboSpans = 1;
function setCombo(combo) {
	let comboStr = combo.toString();
	let len = comboStr.length;

	for(let i = 0; i < len; i++) {
		if(i >= currentComboSpans) {
			$("#comboNums").append($(`<span class="comboNum" id="comboNum${i}">`));
			currentComboSpans++;
		}

		$(`#comboNum${i}`).text(comboStr[i]);
	}

	for(let i = currentComboSpans-1; i >= len; i--) {
		$(`#comboNum${i}`).remove();
		currentComboSpans--;
	}
}

var oldCombo = 0;
var hits = 0;
function setHitMiss(combo, missCount) {
	$("#missValue").text(missCount.toLocaleString());

	if(missCount !== 0) {
		$("#bloqsFC").hide();
		$(".fa-star").hide();
		$("#bloqsMissed").show();
		$(".fa-times").show();		
	}

	if(combo === oldCombo) {
		return;
	}

	if(combo < oldCombo) {
		oldCombo = combo;
		return;
	}
	
	hits += combo - oldCombo;
	$("#hitValue").text(hits.toLocaleString());

	oldCombo = combo;

	//if(!missCount) {
	if(hits === combo) {
		$("#bloqsFC").show();
		$(".fa-star").show();
		$("#bloqsMissed").hide();
		$(".fa-times").hide();
	}
	if(hits !== combo || missCount !== 0) {
		$("#bloqsFC").hide();
		$(".fa-star").hide();
		$("#bloqsMissed").show();
		$(".fa-times").show();
	}
}