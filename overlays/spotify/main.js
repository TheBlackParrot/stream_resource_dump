async function getState() {
	let accessToken = localStorage.getItem("spotify_accessToken");

	const response = await fetch("https://api.spotify.com/v1/me/player", {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});

	const data = await response.json();
	return data;
}

var currentSong = {
	uri: null
};
function setNewSongData(data) {
	if(data.uri === currentSong.uri) {
		return;
	}

	currentSong = data;

	$("#titleString").text(data.title);
	$("#artistString").text(data.artists.join(", "));

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

	$("#art").on("load", function() {
		$("#art, #artBG, #artShadow, #artOutline").fadeIn(500);
	}).attr("src", data.art);
	$("#artBG, #artOutline").attr("src", data.art);

	$("#scannable").attr("src", data.scannable);

	localStorage.setItem("art_darkColor", data.colors.dark);
	localStorage.setItem("art_lightColor", data.colors.light);
	$(":root").get(0).style.setProperty("--colorDark", `${data.colors.dark}`);
	$(":root").get(0).style.setProperty("--colorLight", `${data.colors.light}`);

	$("#title").removeClass("fadeOut").addClass("fadeIn");
	setTimeout(function() {
		$("#artist").removeClass("fadeOut").addClass("fadeIn");
	}, 100);

	setTimeout(function() {
		$("#scannable, #scannableShadow").fadeIn(500);
	}, 100);
}

var updateTrackTO;
var elapsed = 0;
var lastUpdate = Date.now();
var wasPreviouslyPlaying = false;

async function updateTrack() {
	getState().then(function(response) {
		console.log(response);
		elapsed = response.progress_ms;
		lastUpdate = Date.now();

		if(response.is_playing) {
			if(!wasPreviouslyPlaying) {
				startTimers();
			}
			wasPreviouslyPlaying = true;
		} else {
			if(wasPreviouslyPlaying) {
				stopTimers();
			}
			wasPreviouslyPlaying = false;
		}

		if(currentSong.uri !== response.item.uri) {
			let artists = [];
			for(let i in response.item.artists) {
				let artistItem = response.item.artists[i];
				artists.push(artistItem.name);
			}
			let art = response.item.album.images[Math.ceil(response.item.album.images.length / 2) - 1].url;

			$("#title").removeClass("fadeIn").addClass("fadeOut");
			setTimeout(function() {
				$("#artist").removeClass("fadeIn").addClass("fadeOut");
				$("#artist").one("animationend", async function() {
					let swatches = await Vibrant.from(art).getSwatches();
					let colors = {
						light: [],
						dark: []
					};
					const checks = {
						light: ["LightVibrant", "Vibrant", "LightMuted", "Muted"],
						dark: ["DarkVibrant", "DarkMuted", "Muted", "Vibrant"]
					};

					for(let shade in checks) {
						for(let i in checks[shade]) {
							let check = checks[shade][i];
							if(check in swatches) {
								if(swatches[check] !== null) {
									colors[shade].push(swatches[check].getRgb());
								}
							}
						}
					}
					console.log(colors);
					let darkColor = colors.dark[0].map(function(x) { return Math.floor(x).toString(16).padStart(2, "0"); }).join("");
					let lightColor = colors.light[0].map(function(x) { return Math.floor(x).toString(16).padStart(2, "0"); }).join("");

					setNewSongData({
						title: response.item.name,
						artists: artists,
						art: art,
						colors: {
							dark: `#${darkColor}`,
							light: `#${lightColor}`
						},
						scannable: `https://scannables.scdn.co/uri/plain/jpeg/${darkColor}/white/640/${response.item.uri}`,
						uri: response.item.uri,
						duration: response.item.duration_ms
					});
				})
			}, 100);

			$("#scannable, #scannableShadow").fadeOut(500);
			$("#art, #artBG, #artShadow, #artOutline").fadeOut(400);		
		}

		clearTimeout(updateTrackTO);
		updateTrackTO = setTimeout(updateTrack, 5000);
	});
}

var elapsedTimers = [];
var timerInterval = 500;

function startTimers() {
	stopTimers();

	let elapsedTimer = setInterval(function() {
		let perc = ((elapsed + (Date.now() - lastUpdate)) / currentSong.duration);
		if(perc > 1) {
			perc = 1;
		}

		$(":root").get(0).style.setProperty("--currentProgressAngle", `${perc * 360}deg`);
	}, timerInterval);

	elapsedTimers.push(elapsedTimer);
}

function stopTimers() {
	elapsedTimers = elapsedTimers.filter(function(timer) {
		clearInterval(timer);
		return false;
	});
}

async function onSpotifyReady() {
	updateTrack();
}