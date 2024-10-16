var isPaused = false;

function formatTime(val) {
	let secs = val % 60;
	let mins = Math.floor(val / 60);

	return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function togglePause(state) {
	if(localStorage.getItem("setting_bs_desaturateOnPause") === "true") {
		if(state) {
			console.log("PAUSED");
			$("body").addClass("pause");
		} else {
			console.log("RESUMED");
			$("body").removeClass("pause");
		}
	} else {
		$("body").removeClass("pause");
	}

	isPaused = state;
}

var songLength = 1;
var currentScene = "Menu";
var oldScene;
var previousState = "";
var activeMap = {};

function setArt() {
	let artData;

	if(!("cover" in activeMap)) {
		return;
	}

	if(localStorage.getItem("setting_bs_useRemoteArtURL") === "true" || localStorage.getItem("setting_beatSaberDataMod") === "datapuller") {
		artData = activeMap.cover.external.image;
		if(activeMap.cover.external.image === null && activeMap.cover.internal.image !== null) {
			artData = activeMap.cover.internal.image;
		}
	} else {
		artData = activeMap.cover.internal.image;
	}

	if(artData === null) {
		artData = 'placeholder.png';
	}

	rootCSS().setProperty("--art-url", `url('${artData}')`);
	$("#art, #artDoppleganger").attr("src", artData);

	$("#artDoppleganger").on("load", function() {
		$("#artWrapper").removeClass("fadeOut").addClass("fadeIn");
		$("#bgWrapper").removeClass("fadeOut").addClass("fadeInLong");
	});

	let darkColor = activeMap.cover.colors.dark;
	let lightColor = activeMap.cover.colors.light;

	if(localStorage.getItem("setting_bs_ensureColorIsBrightEnough") === "true") {
		let minBrightness = (parseFloat(localStorage.getItem("setting_bs_colorMinBrightness"))/100) * 255;
		let maxBrightness = (parseFloat(localStorage.getItem("setting_bs_colorMaxBrightness"))/100) * 255;

		darkColor = ensureSafeColor(darkColor, minBrightness, maxBrightness);
		lightColor = ensureSafeColor(lightColor, minBrightness, maxBrightness);
	}

	localStorage.setItem("art_darkColor", darkColor);
	localStorage.setItem("art_lightColor", lightColor);
	$(":root").get(0).style.setProperty("--colorDark", darkColor);
	$(":root").get(0).style.setProperty("--colorLight", lightColor);
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
			rootCSS().setProperty("--titleAlignment", "start");
		} else {
			rootCSS().setProperty("--titleAlignment", "var(--metadataAlignment)");
		}
	} else {
		rootCSS().setProperty("--titleAlignment", "var(--metadataAlignment)");
	}
}

function updateSecondaryMarquee() {
	let childElement = ($("#mapperContainer").is(":visible") ? $("#mapperContainer") : $("#artist"));
	let parentElement = childElement.parent();
	let childWidth = childElement.width();
	let parentWidth = parentElement.width();

	parentElement.children().removeClass("cssScroll");
	parentElement.removeClass("cssScrollClippingWorkaround").removeClass("slideIn");

	if(localStorage.getItem("setting_bs_enableMarquee") === "false") {
		secondaryTimer = setTimeout(switchSecondary, parseInt(localStorage.getItem("setting_bs_artistMapperCycleDelay")) * 1000);
		return;
	}

	if(childWidth > parentWidth) {
		console.log(`${childWidth} > ${parentWidth}`);

		const extra = childWidth - parentWidth;
		const speed = extra / (parseInt(localStorage.getItem("setting_bs_marqueeSpeed")) * 2);
		rootCSS().setProperty("--cssScrollAmount", `-${extra}px`);
		rootCSS().setProperty("--cssScrollDuration", `${speed}s`);

		console.log(`amount: ${extra}px, speed: ${speed}s`);

		childElement.addClass("cssScroll");
		parentElement.addClass("cssScrollClippingWorkaround");
		secondaryTimer = setTimeout(switchSecondary, (parseInt(localStorage.getItem("setting_bs_artistMapperCycleDelay")) * 1333) + (speed * 1000)); // yeah idk either
	} else {
		console.log(`${childWidth} < ${parentWidth}`);
		secondaryTimer = setTimeout(switchSecondary, parseInt(localStorage.getItem("setting_bs_artistMapperCycleDelay")) * 1000);
	}
}

function toggleOverlay(show) {
	if(localStorage.getItem("setting_bs_hideOnMenu") === "false") {
		show = true;
	}

	if(show) {
		$("#miscInfoCell, #hitMissCell, #accCell, #ppCell").removeClass("fadeOut").addClass("fadeIn");
		$("#bgWrapper").removeClass("fadeOut").addClass("fadeInLong");
		$("#title").removeClass("slideOut").addClass("slideIn");

		setTimeout(function() {
			$("#secondaryWrap").addClass("slideIn").removeClass("slideOut");
			$("#artWrapper").removeClass("fadeOut").addClass("fadeIn");
		}, 100);
	} else {
		$("#miscInfoCell, #hitMissCell, #accCell, #ppCell").removeClass("fadeIn").addClass("fadeOut");
		$("#bgWrapper").removeClass("fadeInLong").addClass("fadeOut");
		$("#title").removeClass("slideIn").addClass("slideOut");

		setTimeout(function() {
			$("#secondaryWrap").addClass("slideOut").removeClass("slideIn");
			$("#artWrapper").removeClass("fadeIn").addClass("fadeOut");
		}, 100);
	}
}

currentState = {};
const eventFuncs = {
	"state": function(data) {
		elapsed = Math.floor(data.elapsed);
		currentState = data;

		if(previousState !== data.state) {
			previousState = data.state;
			togglePause(previousState !== "playing");
		}

		if(data.acc === 1 && !data.hits) {
			let precision = parseInt(localStorage.getItem("setting_bs_accPrecision"));
			$("#acc").text(`00${precision ? `.${"".padStart(parseInt(precision), "0")}` : ""}`);
			$("#fcAcc").text(`00${precision ? `.${"".padStart(parseInt(precision), "0")}` : ""}`);

			setHandAverages({
				left: [0, 0, 0],
				right: [0, 0, 0]
			});
		} else {
			setAcc(data.acc * 100);

			if(!isNaN(data.fcacc)) {
				$("#fcAcc").text((data.fcacc * 100).toFixed(parseInt(localStorage.getItem("setting_bs_accPrecision"))));

				if(localStorage.getItem("setting_bs_showFCAccIfNotFC") === "true" && data.misses) {
					$("#comboWrap").hide();
					$("#fcAccWrap").show();
				}
			}

			setHandAverages({
				left: data.averages.left,
				right: data.averages.right
			});

			updatePPValues(data.acc);
		}

		$("#combo").text(data.combo.toLocaleString());

		if(!isNaN(data.score)) {
			setHitMiss(data);
		}

		timerFunction();

		if(data.state === "stopped") {
			toggleOverlay(false);
		}
	},

	"hash": function(hash) {
		toggleOverlay(true);
		switchSecondary(true);

		rootCSS().setProperty("--art-url", `url('placeholder.png')`);
		$("#art, #artDoppleganger").attr("src", "placeholder.png");

		songLength = 0;
		$("#duration").text("0:00");

		$("#titleString").text("loading...");
		$("#artist").text("please wait...");
		$("#mapperContainer").empty();

		hideMiscInfoDisplayElements();

		$("#combo").text(0);
		$("#hitValue").text(0);
		$("#FCCell").show();
		$("#missCell").hide();
		$("#fcAccWrap").hide();
		$("#comboWrap").show();
	},

	"map": async function(map) {
		activeMap = map;

		setArt();

		$(":root").get(0).style.setProperty("--diffIconURL", `url("icons/${map.map.characteristic}.svg")`);
		$(":root").get(0).style.setProperty("--currentDiffColor", `var(--color${map.map.difficulty})`);
		setDiff();

		songLength = Math.ceil(map.song.duration/1000);
		$("#duration").text(formatTime(songLength));

		$("#titleString").text(map.song.title + (map.song.subtitle !== "" ? ` - ${map.song.subtitle}` : ""));

		updateMarquee();

		$("#artist").text(map.song.artist);
		if(map.map.bsr) {
			$("#bsrCode").text(map.map.bsr);
		}

		hideMiscInfoDisplayElements();
		changeMiscInfoDisplay();

		$("#mapperContainer").empty();
		if(localStorage.getItem("setting_bs_forceBeatSaverData") === "true") {
			if(map.map.uploaders.length) {
				for(const mapper of map.map.uploaders) {
					let mapperElement = $(`<div class="mapper showComma"></div>`);
					if(mapper.avatar) {
						mapperElement.append($(`<img class="mapperAvatar" src="${mapper.avatar}"/>`))
					}
					mapperElement.append(mapper.name);
					$("#mapperContainer").append(mapperElement);				
				}
				$(".mapper:last-child").removeClass("showComma");
			} else {
				// fallback to internal data, probably a base game map
				$("#mapperContainer").append($(`<div class="mapper">${map.map.author}</div>`));
			}
		} else {
			let mapperElement = $(`<div class="mapper"></div>`);
			if(map.map.uploaders.length) {
				if(map.map.uploaders[0].avatar) {
					mapperElement.append($(`<img class="mapperAvatar" src="${map.map.uploaders[0].avatar}"/>`))
				}
			}
			mapperElement.append(map.map.author);
			$("#mapperContainer").append(mapperElement);
		}

		if(map.map.pack) {
			$("#mapperContainer").append($(`<div class="basePack">${map.map.pack}</div>`));
		}

		updateSecondaryMarquee();
		refreshLeaderboardData(map.map.difficulty, map.map.characteristic, map.map.hash);

		checkCustomColors();
	},

	"hand": function(hand) {
		if(localStorage.getItem("setting_bs_handsFlashOnHit") === "false") {
			return;
		}

		let element;
		let className;

		if(hand === "left") {
			element = $("#handValueCellLeft");
			className = "flashLeft";
		} else if(hand === "right") {
			element = $("#handValueCellRight");
			className = "flashRight";
		}

		element.addClass(className);

		element[0].style.animation = 'none';
		element[0].offsetHeight;
		element[0].style.animation = null; 
	}
};
function processMessage(data) {
	if(data.type in eventFuncs) {
		eventFuncs[data.type](data.data);
	} else {
		console.log(data);
	}
}

var secondaryTimer;
function switchSecondary(force) {
	clearTimeout(secondaryTimer);

	if(force) {
		$("#mapperContainer").hide();
		$("#artist").show();

		updateSecondaryMarquee();
		return;
	}

	if(localStorage.getItem("setting_bs_enableArtistMapperCycle") === "true") {
		if($("#artist").is(":visible")) {
			$("#artist").fadeOut(250, function() {
				$("#mapperContainer").fadeIn(250);
				updateSecondaryMarquee();
			})
		} else {
			$("#mapperContainer").fadeOut(250, function() {
				$("#artist").fadeIn(250);
				updateSecondaryMarquee();
			})
		}
	}
}

var miscInfoDisplayTO;
var currentMiscInfoIndex = 0;
const miscInfoWrapElements = [
	"#diffWrap",
	"#codeWrap",
	"#ssStarsWrap",
	"#blStarsWrap"
];

function hideMiscInfoDisplayElements() {
	for(const which of miscInfoWrapElements) {
		$(which).hide();
	}
	currentMiscInfoIndex = 0;
}
function changeMiscInfoDisplay() {
	clearTimeout(miscInfoDisplayTO);
	miscInfoDisplayTO = setTimeout(changeMiscInfoDisplay, parseFloat(localStorage.getItem("setting_bs_miscInfoRotationInterval")) * 1000);

	let allowedToDisplay = [
		(localStorage.getItem("setting_bs_miscInfoShowDifficulty") === "true"),
		(localStorage.getItem("setting_bs_miscInfoShowBSR") === "true"),
		(localStorage.getItem("setting_bs_miscInfoShowScoreSaberStars") === "true"),
		(localStorage.getItem("setting_bs_miscInfoShowBeatLeaderStars") === "true")
	]

	if("map" in activeMap) {
		if(!activeMap.map.bsr) {
			allowedToDisplay[1] = false;
			allowedToDisplay[2] = false;
			allowedToDisplay[3] = false;
		} else {
			if(leaderboardData.ScoreSaber) {
				if(!leaderboardData.ScoreSaber.ranked || activeMap.map.hash !== leaderboardData.hash) {
					allowedToDisplay[2] = false;
				}
			} else {
				allowedToDisplay[2] = false;
			}

			if(leaderboardData.BeatLeader) {
				if(!leaderboardData.BeatLeader.ranked || activeMap.map.hash !== leaderboardData.hash) {
					allowedToDisplay[3] = false;
				}
			} else {
				allowedToDisplay[3] = false;
			}
		}
	}

	let partsDisplaying = 0;
	for(let bool of allowedToDisplay) {
		if(bool === true) {
			partsDisplaying++;
		}
	}

	if(!partsDisplaying) {
		for(const which of miscInfoWrapElements) {
			$(which).hide();
		}
		return;
	}

	if(partsDisplaying === 1) {
		for(let idx in allowedToDisplay) {
			let bool = allowedToDisplay[idx];
			if(bool === true) {
				$(miscInfoWrapElements[idx]).fadeIn(250);
				currentMiscInfoIndex = idx;
			} else {
				$(miscInfoWrapElements[idx]).hide();
			}
		}
		return;
	}

	for(let idx = 0; idx < miscInfoWrapElements.length; idx++) {
		if(idx !== currentMiscInfoIndex) {
			$(miscInfoWrapElements[idx]).hide();
		}
	}

	$(miscInfoWrapElements[currentMiscInfoIndex]).fadeOut(250, function() {
		currentMiscInfoIndex++;
		if(currentMiscInfoIndex >= miscInfoWrapElements.length) {
			currentMiscInfoIndex = 0;
		}

		while(allowedToDisplay[currentMiscInfoIndex] === false) {
			currentMiscInfoIndex++;
			if(currentMiscInfoIndex >= miscInfoWrapElements.length) {
				currentMiscInfoIndex = 0;
			}
		}

		$(miscInfoWrapElements[currentMiscInfoIndex]).fadeIn(250);
	});
}

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
	const decimalPlaces = parseInt(localStorage.getItem("setting_bs_accPrecision"));
	const factor = Math.pow(10, decimalPlaces);

	acc = Math.floor(factor * acc) / factor;
	
	finalAcc = parseFloat(acc.toFixed(decimalPlaces));

	if(localStorage.getItem("setting_bs_animateAccChanges") === "true") {
		if(!isAnimating) {
			animateAccChange();
		}
	} else {
		curAcc = finalAcc;
		$("#acc").text(finalAcc.toFixed(decimalPlaces));
	}
}

var currentAccInterval = parseInt(localStorage.getItem("setting_bs_animateAccInterval"));
var isAnimating = false;
function animateAccChange() {
	isAnimating = true;

	const decimalPlaces = parseInt(localStorage.getItem("setting_bs_accPrecision"));

	if(curAcc === finalAcc) {
		isAnimating = false;
		$("#acc").text(finalAcc.toFixed(decimalPlaces));
		return;
	}

	const divisor = Math.max(parseInt(localStorage.getItem("setting_bs_accAnimationDivisor")), 1);
	const factor = Math.pow(divisor, decimalPlaces);

	let toChange = parseFloat((Math.round((finalAcc - curAcc) * factor) / factor).toFixed(decimalPlaces));
	if(!toChange) {
		isAnimating = false;
		$("#acc").text(finalAcc.toFixed(decimalPlaces));
		return;
	}

	if(toChange > 0) {
		curAcc += Math.ceil((toChange * factor) / divisor) / factor;
	} else if(toChange < 0) {
		curAcc += Math.floor((toChange * factor) / divisor) / factor;
	}

	$("#acc").text(curAcc.toFixed(decimalPlaces));

	setTimeout(animateAccChange, currentAccInterval);
}

function setHitMiss(state) {
	$("#missValue").text(state.misses.toLocaleString());
	$("#hitValue").text(state.hits.toLocaleString());

	if(state.misses !== 0) {
		$("#FCCell").hide();
		$("#missCell").show();
	} else {
		$("#FCCell").show();
		$("#missCell").hide();
	}
}

function setHandAverages(averages) {
	if(!averages) {
		return;
	}

	const precision = parseInt(localStorage.getItem("setting_bs_handsPrecision"));
	$("#preSwingCellLeft").text(averages.left[0].toFixed(precision))
	$("#postSwingCellLeft").text(averages.left[1].toFixed(precision))
	$("#swingAccuracyCellLeft").text(averages.left[2].toFixed(precision))
	$("#preSwingCellRight").text(averages.right[0].toFixed(precision))
	$("#postSwingCellRight").text(averages.right[1].toFixed(precision))
	$("#swingAccuracyCellRight").text(averages.right[2].toFixed(precision))
}