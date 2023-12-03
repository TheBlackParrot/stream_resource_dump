var currentSong = {
	uri: null
};
var updateTrackTO;
var elapsed = 0;
var lastUpdate = Date.now();
var wasPreviouslyPlaying = false;

function updateMarquee() {
	if($("#titleString").text() === "") {
		return;
	}

	console.log("marquee update called");
	$("#titleString").marquee('destroy');

	if(localStorage.getItem("setting_spotify_enableMarquee") === "true") {
		let parentWidth = $("#title").width();
		let childWidth = $("#titleString").width();
		let delayAmount = parseFloat(localStorage.getItem("setting_spotify_marqueeDelay")) * 1000;

		if(childWidth > parentWidth) {
			$("#titleString").bind('finished', function() {
				$("#titleString").marquee('pause');
				setTimeout(function() {
					$("#titleString").marquee('resume');
				}, delayAmount);
			})
			.marquee({
				speed: parseInt(localStorage.getItem("setting_spotify_marqueeSpeed")),
				pauseOnCycle: true,
				startVisible: true,
				delayBeforeStart: delayAmount,
				duplicated: true,
				gap: parseInt(localStorage.getItem("setting_spotify_marqueeGap"))
			});
		}
	}
}

const spotifyFuncs = {
	trackData: function(data) {
		elapsed = data.elapsed;
		lastUpdate = Date.now();

		if(data.isPlaying) {
			if(!wasPreviouslyPlaying) {
				startTimers();

				if(localStorage.getItem("setting_spotify_hideOnPause") === "true") {
					updateMarquee();

					$("#detailsWrapper").removeClass("fadeOut").addClass("fadeIn");
					$("#title").removeClass("slideOut").addClass("slideIn");
					setTimeout(function() {
						$("#artist").removeClass("slideOut").addClass("slideIn");
					}, 100);

					setTimeout(function() {
						$("#art, #artBG, #artOutline").fadeIn(500);
					}, 250);

					setTimeout(function() {
						$("#scannable, #scannableActual").fadeIn(500);
					}, 500);
				}
			}
			wasPreviouslyPlaying = true;
		} else {
			if(wasPreviouslyPlaying) {
				stopTimers();

				if(localStorage.getItem("setting_spotify_hideOnPause") === "true") {
					$("#detailsWrapper").removeClass("fadeIn").addClass("fadeOut");
					$("#title").removeClass("slideIn").addClass("slideOut");
					setTimeout(function() {
						$("#artist").removeClass("slideIn").addClass("slideOut");
					}, 100);

					setTimeout(function() {
						$("#art, #artBG, #artOutline").fadeOut(250);
					}, 250);

					setTimeout(function() {
						$("#scannable, #scannableActual").fadeOut(250);
					}, 500);
				}
			}
			wasPreviouslyPlaying = false;
		}

		if(data.uri === currentSong.uri) {
			return;
		}

		currentSong = data;

		$("#detailsWrapper").removeClass("fadeIn").addClass("fadeOut");

		$("#title").removeClass("slideIn").addClass("slideOut");
		setTimeout(function() {
			$("#artist").removeClass("slideIn").addClass("slideOut");

			$("#artist").one("animationend", function() {
				$("#titleString").text(data.title);
				$("#artistString").text(data.artists.join(", "));

				updateMarquee();

				localStorage.setItem("art_darkColor", data.colors.dark);
				localStorage.setItem("art_lightColor", data.colors.light);
				$(":root").get(0).style.setProperty("--colorDark", `${data.colors.dark}`);
				$(":root").get(0).style.setProperty("--colorLight", `${data.colors.light}`);

				$("#detailsWrapper").removeClass("fadeOut").addClass("fadeIn");

				$("#title").removeClass("slideOut").addClass("slideIn");
				setTimeout(function() {
					$("#artist").removeClass("slideOut").addClass("slideIn");
				}, 100);
			});
		}, 100);

		setTimeout(function() {
			$("#art, #artBG, #artOutline").fadeOut(250, function() {
				$("#art, #artBG, #artOutline").attr("src", data.art);

				$("#art").on("load", function() {
					$("#art, #artBG, #artOutline").fadeIn(500);
				});
			});
		}, 250);

		setTimeout(function() {
			$("#scannable, #scannableActual").fadeOut(250, function() {
				let scannableImage = data.scannable[(localStorage.getItem("setting_spotify_scannableUseBlack") === "true" ? "black" : "white")];

				$("#scannable").attr("src", scannableImage);
				//$("#scannableActual").css("background-image", `url(${scannableImage})`);
				//document.getElementById("scannableActual").style.backgroundImage = `url('${scannableImage}')`;
				rootCSS().setProperty("--workingAroundFunnyChromiumBugLolXD", `url('${scannableImage}')`);
				$("#scannable").on("load", function() {
					$("#scannable, #scannableActual").fadeIn(500);
				});
			});
		}, 500)
	}
};

var elapsedTimers = [];
var timerInterval = parseFloat(localStorage.getItem("setting_spotify_progressInterval")) * 1000;
var prevPerc = -1;

function startTimers() {
	stopTimers();

	let elapsedTimer = setInterval(function() {
		let perc = ((elapsed + (Date.now() - lastUpdate)) / currentSong.duration);
		if(perc > 1 || localStorage.getItem("setting_spotify_enableArtOutlineProgress") === "false") {
			perc = 1;
		}

		if(perc !== prevPerc) {
			$(":root").get(0).style.setProperty("--currentProgressAngle", `${perc * 360}deg`);
		}
		prevPerc = perc;
	}, timerInterval);

	elapsedTimers.push(elapsedTimer);
}

function stopTimers() {
	elapsedTimers = elapsedTimers.filter(function(timer) {
		clearInterval(timer);
		return false;
	});
}

const spotifyChannel = new BroadcastChannel("spotify");

spotifyChannel.onmessage = function(message) {
	message = message.data;
	console.log(message);

	if(message.event in spotifyFuncs) {
		spotifyFuncs[message.event](message.data);
	}
};