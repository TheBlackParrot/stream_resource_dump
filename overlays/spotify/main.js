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
			$("#title").addClass("left");

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
		} else {
			$("#title").removeClass("left");
		}
	}
}

const spotifyFuncs = {
	trackData: function(data) {
		elapsed = data.elapsed;
		lastUpdate = Date.now();

		let enableAnimations = (localStorage.getItem("setting_spotify_enableAnimations") === "true");
		let timespans = {
			small: (enableAnimations ? 100 : 0),
			medium: (enableAnimations ? 250 : 0),
			large: (enableAnimations ? 500 : 0)
		};

		if(data.isPlaying) {
			if(!wasPreviouslyPlaying) {
				startTimers();

				if(localStorage.getItem("setting_spotify_hideOnPause") === "true") {
					updateMarquee();

					$("#detailsWrapper").removeClass("fadeOut").addClass("fadeIn");
					$("#title").removeClass("slideOut").addClass("slideIn");
					setTimeout(function() {
						$("#artist").removeClass("slideOut").addClass("slideIn");
					}, timespans.small);

					setTimeout(function() {
						$("#art, #artBG, #artOutline").fadeIn(timespans.large);
						$("#bgWrapper .artContainer").fadeIn(parseFloat(localStorage.getItem("setting_spotify_artBackgroundFadeInDuration")) * 1000);
					}, timespans.medium);

					setTimeout(function() {
						$("#scannableShadow").fadeIn(timespans.large);
					}, timespans.large);
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
					}, timespans.small);

					setTimeout(function() {
						$("#art, #artBG, #artOutline, #bgWrapper .artContainer").fadeOut(timespans.medium);
					}, timespans.medium);

					setTimeout(function() {
						$("#scannableShadow").fadeOut(timespans.medium);
					}, timespans.large);
				}
			}
			wasPreviouslyPlaying = false;
		}

		if(data.uri === currentSong.uri) {
			return;
		}

		currentSong = data;
		clearTimeout(albumArtistCycleTO);

		stopTimers();

		$("#detailsWrapper").removeClass("fadeIn").addClass("fadeOut");

		$("#title").removeClass("slideIn").addClass("slideOut");
		setTimeout(function() {
			$("#artist").removeClass("slideIn").addClass("slideOut");

			$("#artist").one("animationend", function() {
				$("#titleString").text(data.title);
				$("#artistString").text(data.artists.join(", "));
				$("#albumString").text(data.album.name);

				$(":root").get(0).style.setProperty("--currentProgressAngle", '0deg');
				prevPerc = -1;
				updateProgress();
				startTimers();

				$("#albumString").removeClass("isSingle");
				if(data.album.type === "single") {
					if(localStorage.getItem("setting_spotify_showSingleIfSingle") === "true") {
						$("#albumString").addClass("isSingle");
					}
				}

				$("#albumString").hide();
				$("#artistString").show();

				let darkColor = data.colors.dark;
				let lightColor = data.colors.light;

				if(localStorage.getItem("setting_spotify_ensureColorIsBrightEnough") === "true") {
					darkColor = ensureSafeColor(darkColor);
					lightColor = ensureSafeColor(lightColor);
				}

				localStorage.setItem("art_darkColor", darkColor);
				localStorage.setItem("art_lightColor", lightColor);
				$(":root").get(0).style.setProperty("--colorDark", darkColor);
				$(":root").get(0).style.setProperty("--colorLight", lightColor);

				$("#detailsWrapper").removeClass("fadeOut").addClass("fadeIn");

				$("#title").removeClass("slideOut").addClass("slideIn");
				setTimeout(function() {
					$("#artist").removeClass("slideOut").addClass("slideIn");
					if(localStorage.getItem("setting_spotify_enableArtistAlbumCycle") === "true") {
						albumArtistCycleTO = setTimeout(function() {
							cycleAlbumArtist("album");
						}, parseInt(localStorage.getItem("setting_spotify_artistAlbumCycleDelay")) * 1000);
					}
					updateMarquee();
				}, timespans.small);
			});
		}, timespans.small);

		setTimeout(function() {
			$("#art, #artBG, #artOutline, #bgWrapper .artContainer").fadeOut(timespans.medium, function() {
				$("#art").attr("src", data.art);
				rootCSS().setProperty("--art-url", `url('${data.art}')`);

				$("#art").on("load", function() {
					$("#art, #artBG, #artOutline").fadeIn(timespans.large);
					$("#bgWrapper .artContainer").fadeIn(parseFloat(localStorage.getItem("setting_spotify_artBackgroundFadeInDuration")) * 1000);
				});
			});
		}, timespans.medium);

		setTimeout(function() {
			$("#scannableShadow").fadeOut(timespans.medium, function() {
				let scannableBackgroundColor = "#333333";
				if(localStorage.getItem("setting_spotify_scannableUsesCustomBGColor") === "true") {
					scannableBackgroundColor = localStorage.getItem("setting_spotify_scannableCustomBGColor");
				} else {
					scannableBackgroundColor = (localStorage.getItem("setting_spotify_scannableUseBlack") === "true" ? data.colors.light : data.colors.dark);
				}

				let scannableImage = `https://scannables.scdn.co/uri/plain/jpeg/000000/white/640/${data.uri}`;

				$("#scannable").attr("src", scannableImage);
				rootCSS().setProperty("--workingAroundFunnyChromiumBugLolXD", `url('${scannableImage}')`);
				$("#scannable").on("load", function() {
					rootCSS().setProperty("--scannable-background-color", scannableBackgroundColor);
					$("#scannableShadow").fadeIn(timespans.large);
				});
			});
		}, timespans.large)
	}
};

var elapsedTimers = [];
var timerInterval = parseFloat(localStorage.getItem("setting_spotify_progressInterval")) * 1000;
var prevPerc = -1;

function updateProgress() {
	let perc = ((elapsed + (Date.now() - lastUpdate)) / currentSong.duration);
	if(perc > 1 || localStorage.getItem("setting_spotify_enableArtOutlineProgress") === "false") {
		perc = 1;
	}

	if(perc !== prevPerc) {
		$(":root").get(0).style.setProperty("--currentProgressAngle", `${perc * 360}deg`);
	}
	prevPerc = perc;	
}

function startTimers() {
	stopTimers();
	let elapsedTimer = setInterval(updateProgress, timerInterval);
	elapsedTimers.push(elapsedTimer);
}

function stopTimers() {
	elapsedTimers = elapsedTimers.filter(function(timer) {
		clearInterval(timer);
		return false;
	});
}

var albumArtistCycleTO;
function cycleAlbumArtist(which) {
	clearTimeout(albumArtistCycleTO);

	let fadeDuration = (localStorage.getItem("setting_spotify_enableAnimations") === "true" ? 250 : 0)

	if(which === "artist") {
		$("#albumString").fadeOut(fadeDuration, function() {
			$("#artistString").fadeIn(fadeDuration);
		});
	} else {
		$("#artistString").fadeOut(fadeDuration, function() {
			$("#albumString").fadeIn(fadeDuration);
		});		
	}

	if(localStorage.getItem("setting_spotify_enableArtistAlbumCycle") === "true") {
		let nextCycle = (which === "artist" ? "album" : "artist");

		albumArtistCycleTO = setTimeout(function() {
			cycleAlbumArtist(nextCycle);
		}, parseInt(localStorage.getItem("setting_spotify_artistAlbumCycleDelay")) * 1000);
	}
}

const spotifyChannel = new BroadcastChannel("spotify");

spotifyChannel.onmessage = function(message) {
	message = message.data;
	console.log(message);

	if(message.event in spotifyFuncs) {
		spotifyFuncs[message.event](message.data);
	}
};