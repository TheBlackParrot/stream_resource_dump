async function getState() {
	let accessToken = localStorage.getItem("spotify_accessToken");

	const response = await fetch("https://api.spotify.com/v1/me/player", {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});
	
	if(!response.ok) {
		regenSpotifyCodes();
	}

	const data = await response.json();
	return data;
}

var updateTrackTO;
var currentSong;
var lastUpdateDelay = -1;

const spotifyEventChannel = new BroadcastChannel("spotify");
function postToSpotifyEventChannel(data) {
	console.log(data);
	if(data) {
		spotifyEventChannel.postMessage(data);
	}
}

async function updateTrack() {
	const defaultUpdateDelay = parseFloat(localStorage.getItem("setting_spotify_refreshInterval")) * 1000;

	getState().then(async function(response) {
		if(response.item !== null) {
			currentSong = response.item;

			let artists = [];
			for(let i in response.item.artists) {
				let artistItem = response.item.artists[i];
				artists.push(artistItem.name);
			}

			let art = response.item.album.images[Math.ceil(response.item.album.images.length / 2) - 1].url;
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
			let darkColor = colors.dark[0].map(function(x) { return Math.floor(x).toString(16).padStart(2, "0"); }).join("");
			let lightColor = colors.light[0].map(function(x) { return Math.floor(x).toString(16).padStart(2, "0"); }).join("");

			// ignore response.item.album.album_type, spotify will always fill this in with "single"
			postToSpotifyEventChannel({event: "trackData", data: {
				title: response.item.name,
				artists: artists,
				album: {
					name: response.item.album.name,
					type: (response.item.album.total_tracks > 2 ? "album" : "single")
				},
				art: art,
				colors: {
					dark: `#${darkColor}`,
					light: `#${lightColor}`
				},
				uri: response.item.uri,
				elapsed: response.progress_ms,
				duration: response.item.duration_ms,
				isPlaying: response.is_playing
			}});

			const delay = parseFloat(localStorage.getItem("setting_spotify_waitCheck") * 1000) + (response.item.duration_ms - response.progress_ms);

			if(response.item.duration_ms - response.progress_ms < defaultUpdateDelay && delay !== lastUpdateDelay) {
				console.log(`triggering early state fetching (${delay}ms remains)`);
				clearTimeout(updateTrackTO);
				updateTrackTO = setTimeout(updateTrack, delay);
			} else {
				console.log(`not triggering early state fetching (${delay}ms remains)`);
				clearTimeout(updateTrackTO);
				updateTrackTO = setTimeout(updateTrack, defaultUpdateDelay);
			}

			lastUpdateDelay = delay;
		} else {
			clearTimeout(updateTrackTO);
			updateTrackTO = setTimeout(updateTrack, defaultUpdateDelay);
		}
	}).catch(async function() {
		console.log("error thrown, retriggering");
		await delay(15000);
		if(localStorage.getItem('spotify_accessToken')) {
			updateTrack();
		}
	});
}

if(localStorage.getItem('spotify_refreshToken')) {
	regenSpotifyCodes();
}

$("#connectSpotifyButton").on("mouseup", function(e) {
	e.preventDefault();
	sessionStorage.setItem("_oauth_service", "spotify");
	regenSpotifyCodes();
});

var isSpotifyReady = false;
function onSpotifyReady() {
	if(oauthCode) {
		window.history.replaceState({}, document.title, window.location.pathname)
	}

	isSpotifyReady = true;

	addNotification("Successfully connected to Spotify", {bgColor: "var(--notif-color-success)", duration: 5});
	changeStatusCircle("SpotifyStatus", "green", `connected`);
}