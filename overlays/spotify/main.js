$.ajaxSetup({ timeout: parseInt(localStorage.getItem("setting_ajaxTimeout")) * 1000 || 7000 });

var currentSong = {
	uri: null,
	labels: []
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

function determineScannableFGColor(data) {
	if(currentSong.uri === null) {
		return;
	}
	
	let scannableBackgroundColor = "#333333";
	let usingBlack = (localStorage.getItem("setting_spotify_scannableUseBlack") === "true");

	if(localStorage.getItem("setting_spotify_scannableUsesCustomBGColor") === "true") {
		scannableBackgroundColor = localStorage.getItem("setting_spotify_scannableCustomBGColor");
	} else {
		scannableBackgroundColor = (usingBlack ? data.colors.light : data.colors.dark);
	}

	if(localStorage.getItem("setting_spotify_useInvertedFGIfNeeded") === "true") {
		let brightness = (getYIQ(scannableBackgroundColor) / 255) * 100;
		let maxBrightness = parseInt(localStorage.getItem("setting_spotify_invertFGThreshold"));

		console.log(`scannable brightness: ${brightness}, max: ${maxBrightness}`);

		if(brightness > maxBrightness) {
			settingUpdaters["scannableFGDark"]("true");
		} else {
			settingUpdaters["scannableFGDark"]("false");
		}
	}

	rootCSS().setProperty("--scannable-background-color", scannableBackgroundColor);
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

		if(localStorage.getItem("setting_spotify_enableScannable") === "true") { $("#scannableWrapper").show(); }
		if(localStorage.getItem("setting_spotify_enableArt") === "true") { $("#artWrapper").show(); }

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

				if(data.labels.length) {
					$("#labelString").text(data.labels.join(", "));
				}

				$("#forceLeft").hide();
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
				$("#art, #artLoader").attr("src", data.art);
				rootCSS().setProperty("--art-url", `url('${data.art}')`);

				$("#artLoader").one({
					load: function() {
						$("#art, #artBG, #artOutline").fadeIn(timespans.large);
						$("#bgWrapper .artContainer").fadeIn(parseFloat(localStorage.getItem("setting_spotify_artBackgroundFadeInDuration")) * 1000);
					},
					error: function() {
						$("#art, #artLoader").attr("src", "placeholder.png");
						rootCSS().setProperty("--art-url", `url('placeholder.png')`);
					}
				});
			});
		}, timespans.medium);

		setTimeout(async function() {
			$("#scannableShadow").fadeOut(timespans.medium, async function() {
				let scannableImage = `https://scannables.scdn.co/uri/plain/svg/000000/white/400/${data.uri}`;

				const controller = new AbortController();
				const timedOutID = setTimeout(() => controller.abort(), parseInt(localStorage.getItem("setting_ajaxTimeout")) * 1000);

				var response;
				try {
					response = await fetch(scannableImage, { signal: controller.signal });
				} catch(err) {
					console.log("failed to fetch scannable");
					$("#scannableWrapper").hide();
					return;
				}

				if(!response.ok) {
					$("#scannableWrapper").hide();
					return;					
				}

				var initialSVG = await response.text();
				let parser = new DOMParser();
				let svgDOM = parser.parseFromString(initialSVG, "image/svg+xml");
				svgDOM.getElementsByTagName("rect")[0].style.fill = "transparent";

				const serializer = new XMLSerializer();
				const svg = btoa(serializer.serializeToString(svgDOM));

				$("#scannable")[0].setAttribute("src", `data:image/svg+xml;base64,${svg}`);
				rootCSS().setProperty("--scannable-image", `url('data:image/svg+xml;base64,${svg}')`);

				$("#scannable").one({
					load: function() {
						determineScannableFGColor(data);
						$("#scannableShadow").fadeIn(timespans.large);
					},
					error: function() {
						$("#scannableWrapper").hide();
					}
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
		$("#forceLeft").fadeOut(fadeDuration, function() {
			$("#artistString").fadeIn(fadeDuration);
		});
	} else {
		$("#artistString").fadeOut(fadeDuration, function() {
			$("#forceLeft").fadeIn(fadeDuration);
			if(localStorage.getItem("setting_spotify_showLabel") === "true" && currentSong.labels.length) {
				$("#labelString").show();
			} else {
				$("#labelString").hide();
			}
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