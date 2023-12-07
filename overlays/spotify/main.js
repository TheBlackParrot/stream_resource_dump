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
					}, timespans.medium);

					setTimeout(function() {
						$("#scannable, #scannableActual").fadeIn(timespans.large);
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
						$("#art, #artBG, #artOutline").fadeOut(timespans.medium);
					}, timespans.medium);

					setTimeout(function() {
						$("#scannable, #scannableActual").fadeOut(timespans.medium);
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

		$("#detailsWrapper").removeClass("fadeIn").addClass("fadeOut");

		$("#title").removeClass("slideIn").addClass("slideOut");
		setTimeout(function() {
			$("#artist").removeClass("slideIn").addClass("slideOut");

			$("#artist").one("animationend", function() {
				$("#titleString").text(data.title);
				$("#artistString").text(data.artists.join(", "));
				$("#albumString").text(data.album.name);

				if(data.album.type === "single") {
					$("#albumString").addClass("isSingle");
				} else {
					$("#albumString").removeClass("isSingle");
				}

				$("#albumString").hide();
				$("#artistString").show();

				updateMarquee();

				localStorage.setItem("art_darkColor", data.colors.dark);
				localStorage.setItem("art_lightColor", data.colors.light);
				$(":root").get(0).style.setProperty("--colorDark", `${data.colors.dark}`);
				$(":root").get(0).style.setProperty("--colorLight", `${data.colors.light}`);

				$("#detailsWrapper").removeClass("fadeOut").addClass("fadeIn");

				$("#title").removeClass("slideOut").addClass("slideIn");
				setTimeout(function() {
					$("#artist").removeClass("slideOut").addClass("slideIn");
					if(localStorage.getItem("setting_spotify_enableArtistAlbumCycle") === "true") {
						albumArtistCycleTO = setTimeout(function() {
							cycleAlbumArtist("album");
						}, parseInt(localStorage.getItem("setting_spotify_artistAlbumCycleDelay")) * 1000);
					}
				}, timespans.small);
			});
		}, timespans.small);

		setTimeout(function() {
			$("#art, #artBG, #artOutline").fadeOut(timespans.medium, function() {
				$("#art, #artBG, #artOutline").attr("src", data.art);

				$("#art").on("load", function() {
					$("#art, #artBG, #artOutline").fadeIn(timespans.large);
				});
			});
		}, timespans.medium);

		setTimeout(function() {
			$("#scannable, #scannableActual").fadeOut(timespans.medium, function() {
				let scannableImage = data.scannable[(localStorage.getItem("setting_spotify_scannableUseBlack") === "true" ? "black" : "white")];

				$("#scannable").attr("src", scannableImage);
				//$("#scannableActual").css("background-image", `url(${scannableImage})`);
				//document.getElementById("scannableActual").style.backgroundImage = `url('${scannableImage}')`;
				rootCSS().setProperty("--workingAroundFunnyChromiumBugLolXD", `url('${scannableImage}')`);
				$("#scannable").on("load", function() {
					$("#scannable, #scannableActual").fadeIn(timespans.large);
				});
			});
		}, timespans.large)
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