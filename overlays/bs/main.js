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

function togglePause(state) {
	if(state) {
		console.log("PAUSED");
		if(localStorage.getItem("setting_bs_desaturateOnPause") === "true") {
			$("body").addClass("pause");
		}
	} else {
		console.log("PAUSED");
		if(localStorage.getItem("setting_bs_desaturateOnPause") === "true") {
			$("body").removeClass("pause");
		}		
	}

	isPaused = state;
}

var secondaryTimer;
var songLength = 1;
var currentScene = "Menu";
var oldScene;
var previousState = "";
var activeMap = {};

function setArt() {
	let artData;

	if(!("coverRaw" in activeMap)) {
		artData = "placeholder.png";
	} else {
		if(localStorage.getItem("setting_bs_useRemoteArtURL") === "true") {
			artData = activeMap.remoteCover;
			if(activeMap.hash.toLowerCase().indexOf("wip") !== -1) {
				artData = `data:image/jpg;base64,${activeMap.coverRaw}`;
			}
		} else {
			artData = `data:image/jpg;base64,${activeMap.coverRaw}`;
		}
	}

	rootCSS().setProperty("--art-url", `url('${artData}')`);
	$("#art, #artDoppleganger").attr("src", artData);

	$("#artDoppleganger").on("load", function() {
		$("#artWrapper").removeClass("fadeOut").addClass("fadeIn");
		$("#bgWrapper").removeClass("fadeOut").addClass("fadeInLong");
	});

	if("coverColors" in activeMap) {
		let darkColor = activeMap.coverColors.dark;
		let lightColor = activeMap.coverColors.light;

		if(localStorage.getItem("setting_bs_ensureColorIsBrightEnough") === "true") {
			darkColor = ensureSafeColor(darkColor);
			lightColor = ensureSafeColor(lightColor);
		}

		localStorage.setItem("art_darkColor", darkColor);
		localStorage.setItem("art_lightColor", lightColor);
		$(":root").get(0).style.setProperty("--colorDark", darkColor);
		$(":root").get(0).style.setProperty("--colorLight", lightColor);
	}
}

function updateMarquee() {
	if($("#titleString").text() === "") {
		return;
	}

	console.log("marquee update called");
	$("#titleString").marquee('destroy');

	if(localStorage.getItem("setting_bs_enableMarquee") === "true") {
		let parentWidth = $("#title").width();
		let childWidth = $("#titleString").width();
		let delayAmount = parseFloat(localStorage.getItem("setting_bs_marqueeDelay")) * 1000;

		if(childWidth > parentWidth) {
			$("#titleString").bind('finished', function() {
				$("#titleString").marquee('pause');
				setTimeout(function() {
					$("#titleString").marquee('resume');
				}, delayAmount);
			})
			.marquee({
				speed: parseInt(localStorage.getItem("setting_bs_marqueeSpeed")),
				pauseOnCycle: true,
				startVisible: true,
				delayBeforeStart: delayAmount,
				duplicated: true,
				gap: parseInt(localStorage.getItem("setting_bs_marqueeGap"))
			});
		}
	}
}

const eventFuncs = {
	"state": function(data) {
		elapsed = Math.floor(data.elapsed);

		if(previousState !== data.state) {
			previousState = data.state;
			togglePause(previousState !== "playing");
		}

		if(data.acc === 1 && !hits) {
			$("#acc").text("00.00");
		} else {
			setAcc(data.acc * 100);
		}

		$("#combo").text(data.combo.toLocaleString());

		if(!isNaN(data.score)) {
			setHitMiss(data);
		}

		timerFunction();

		if(data.state === "stopped") {
			$("#miscInfoCell, #hitMissCell, #accCell").removeClass("fadeIn").addClass("fadeOut");
			$("#bgWrapper").removeClass("fadeInLong").addClass("fadeOut");

			$("#title").removeClass("slideIn").addClass("slideOut");
			setTimeout(function() {
				$("#secondary").removeClass("slideIn").addClass("slideOut");
				$("#artWrapper").removeClass("fadeIn").addClass("fadeOut");
			}, 100);
		}
	},

	"map": function(map) {
		$("#miscInfoCell, #hitMissCell, #accCell").removeClass("fadeOut").addClass("fadeIn");

		$("#title").removeClass("slideOut").addClass("slideIn");
		setTimeout(function() {
			$("#secondary").removeClass("slideOut").addClass("slideIn");
			$("#secondary").one("animationend", function() {
				$(this).removeClass("slideIn");
			})
		}, 100);

		activeMap = map;

		switchSecondary(true);
		clearInterval(secondaryTimer);
		secondaryTimer = setInterval(switchSecondary, parseInt(localStorage.getItem("setting_bs_artistMapperCycleDelay")) * 1000);

		setArt();

		$(":root").get(0).style.setProperty("--diffIconURL", `url("icons/${map.characteristic}.svg")`);
		$(":root").get(0).style.setProperty("--currentDiffColor", `var(--color${map.difficulty})`);
		setDiff();

		songLength = Math.ceil(map.duration/1000);
		$("#duration").text(formatTime(songLength));

		$("#titleString").text(map.name + (map.sub_name !== "" ? ` - ${map.sub_name}` : ""));

		updateMarquee();

		$("#artist").text(map.artist);
		$("#mapper").text(map.mapper);
		$("#bsrCode").text(map.BSRKey);

		$("#mapperAvatar").hide();
		if("uploader" in map) {
			if(map.uploader.verifiedMapper) {
				$("#mapperAvatar").show().attr("src", map.uploader.avatar);
			}
		}

		$("#combo").text(0);
		$("#hitValue").text(0);
		$("#FCCell").show();
		$("#missCell").hide();
		oldCombo = 0;
	}
};
function processMessage(data) {
	console.log(data);

	if(data.type in eventFuncs) {
		eventFuncs[data.type](data.data);
	}
}

function switchSecondary(force) {
	if(force) {
		$("#mapperContainer").hide();
		$("#artist").show();
		return;
	}

	if($("#artist").is(":visible")) {
		$("#artist").fadeOut(250, function() {
			$("#mapperContainer").fadeIn(250);
		})
	} else {
		$("#mapperContainer").fadeOut(250, function() {
			$("#artist").fadeIn(250);
		})
	}
}

setInterval(function() {
	if(activeMap.BSRKey === "") {
		$("#codeWrap").hide();
		$("#diffWrap").show();
		return;
	}

	if($("#codeWrap").is(":visible")) {
		$("#codeWrap").fadeOut(250, function() {
			$("#diffWrap").fadeIn(250);
		})
	} else {
		$("#diffWrap").fadeOut(250, function() {
			$("#codeWrap").fadeIn(250);
		})
	}
}, 7000);

var elapsedTimers = [];
var elapsed = 0;
var timerInterval = 500;

function timerFunction() {
	elapsed += timerInterval / 1000;

	let perc = (elapsed / songLength);
	if(perc > 1 || localStorage.getItem("setting_bs_enableArtOutlineProgress") === "false") {
		perc = 1;
	}

	$(":root").get(0).style.setProperty("--currentProgressAngle", `${perc * 360}deg`);

	$("#time").text(formatTime(Math.floor(elapsed)));
}

var finalAcc = 100;
var curAcc = 100;
function setAcc(acc) {
	finalAcc = parseFloat(acc.toFixed(2));

	if(localStorage.getItem("setting_bs_animateAccChanges") === "true") {
		if(!isAnimating) {
			animateAccChange();
		}
	} else {
		curAcc = finalAcc;
		$("#acc").text(finalAcc.toFixed(2));
	}
}

var currentAccInterval = parseInt(localStorage.getItem("setting_bs_animateAccInterval"));
var isAnimating = false;
function animateAccChange() {
	isAnimating = true;

	if(curAcc === finalAcc) {
		isAnimating = false;
		return;
	}

	let toChange = parseFloat((Math.round((finalAcc - curAcc)*100)/100).toFixed(2));
	if(!toChange) {
		isAnimating = false;
		return;
	}

	if(toChange > 0) {
		curAcc += Math.ceil((toChange*100) / 10) / 100;
	} else if(toChange < 0) {
		curAcc += Math.floor((toChange*100) / 10) / 100;
	}

	$("#acc").text(curAcc.toFixed(2));

	setTimeout(animateAccChange, currentAccInterval);
}

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
function setHitMiss(state) {
	$("#missValue").text(state.misses.toLocaleString());
	$("#hitValue").text(state.hits.toLocaleString());

	if(state.misses !== 0) {
		$("#FCCell").hide();
		$("#missCell").show();	
	}

	if(state.combo === oldCombo) {
		return;
	}

	if(state.combo < oldCombo) {
		oldCombo = state.combo;
		return;
	}
	oldCombo = state.combo;

	if(state.hits === state.combo) {
		$("#FCCell").show();
		$("#missCell").hide();	
	} else {
		$("#FCCell").hide();
		$("#missCell").show();
	}
}

rootCSS().setProperty("--background-art-height", `${$("#wrapper").outerHeight(true)}px`);