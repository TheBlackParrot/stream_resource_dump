async function compressImage(url) {
	let size = parseInt(localStorage.getItem("setting_spotify_artSize")) * 2;
	console.log(`compressing image ${url} to ${size}x${size}`);

	const controller = new AbortController();
	const timedOutID = setTimeout(() => controller.abort(), parseInt(localStorage.getItem("setting_ajaxTimeout")) * 1000);

	var response;
	try {
		response = await fetch(url, { signal: controller.signal });
	} catch(err) {
		console.log("failed to fetch image");
		return "placeholder.png";
	}

	if(!response.ok) {
		console.log("failed to fetch image");
		return "placeholder.png";
	}

	const blob = await response.blob();
	const bitmap = await createImageBitmap(blob);

	let canvas = document.createElement('canvas');
	let ctx = canvas.getContext('2d');

	canvas.height = canvas.width = size;

	ctx.drawImage(bitmap, 0, 0, size, size);
	return canvas.toDataURL("image/jpeg", 0.8);
}

async function getState() {
	let accessToken = localStorage.getItem("spotify_accessToken");

	const response = await fetch("https://api.spotify.com/v1/me/player", {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});

	if(response.status === 204) {
		// no active players
		await delay(15000);
		return getState();
	}
	
	if(!response.ok) {
		await regenSpotifyCodes();
		await delay(15000);
		return getState();
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

var oldID = null;
var persistentData = {
	colors: {
		light: null,
		dark: null
	},
	labels: [],
	isrc: null,
	art: null
};
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

			if(oldID !== response.item.id) {
				persistentData = {
					colors: {
						light: localStorage.getItem("setting_spotify_scannableCustomBGColor"),
						dark: localStorage.getItem("setting_spotify_scannableCustomBGColor")
					},

					labels: [],
					isrc: null,
					art: await compressImage(art)
				};

				if(persistentData.art !== "placeholder.png") {
					try {
						let swatches = await Vibrant.from(persistentData.art).getSwatches();
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
						persistentData.colors.dark = `#${colors.dark[0].map(function(x) { return Math.floor(x).toString(16).padStart(2, "0"); }).join("")}`;
						persistentData.colors.light = `#${colors.light[0].map(function(x) { return Math.floor(x).toString(16).padStart(2, "0"); }).join("")}`;
					} catch(err) {
						throw err;
					}
				}

				if("external_ids" in response.item) {
					if("isrc" in response.item.external_ids) {
						persistentData.isrc = response.item.external_ids.isrc;

						// chrome doesn't allow user agent spoofing but you can't say i didn't try :(
						// https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting
						const headers = new Headers({
							"User-Agent": `TBPSpotifyOverlay/${overlayRevision} ( https://theblackparrot.me/overlays )`
						});

						const isrcController = new AbortController();
						const isrcTimedOutID = setTimeout(() => isrcController.abort(), parseInt(localStorage.getItem("setting_ajaxTimeout")) * 1000);
						var isrcResponse = {ok: false};
						try {
							isrcResponse = await fetch(`https://musicbrainz.org/ws/2/isrc/${response.item.external_ids.isrc}?fmt=xml&inc=releases&status=official`, { signal: isrcController.signal, headers: headers });
						} catch(err) {
							console.log("failed to fetch musicbrainz isrc request");
						}

						if(isrcResponse.ok) {
							console.log("musicbrainz isrc request was ok");
							const isrcText = await isrcResponse.text();

							let isrcParser = new DOMParser();
							let isrcDOM = isrcParser.parseFromString(isrcText, "text/xml");
							const releases = isrcDOM.getElementsByTagName("release");
							var release = releases[0];
							let oldestDate = Infinity;

							for(const check of releases) {
								let timestamp = new Date(check.getElementsByTagName("date")[0]);
								if(timestamp < oldestDate) {
									oldestDate = timestamp;
									release = check;
								}
							}

							const labelController = new AbortController();
							const labelTimedOutID = setTimeout(() => labelController.abort(), parseInt(localStorage.getItem("setting_ajaxTimeout")) * 1000);
							var labelResponse = {ok: false};
							try {
								labelResponse = await fetch(`https://musicbrainz.org/ws/2/label?release=${release.id}`, { signal: labelController.signal, headers: headers });
							} catch(err) {
								console.log("failed to fetch musicbrainz label request");
							}

							if(labelResponse.ok) {
								const labelText = await labelResponse.text();

								let labelParser = new DOMParser();
								let labelDOM = labelParser.parseFromString(labelText, "text/xml");
								
								for(const label of labelDOM.getElementsByTagName("name")) {
									if(label.parentNode.nodeName.toLowerCase() === "label") {
										if(label.textContent === "[no label]") {
											// is a self-publish
											continue;
										}

										if(persistentData.labels.indexOf(label.textContent) === -1) {
											persistentData.labels.push(label.textContent);
										}
									}
								}
							}
						}
					}
				}
			}
			oldID = response.item.id;

			var trackData = {
				title: response.item.name,
				artists: artists,
				album: {
					name: response.item.album.name,
					type: (response.item.album.total_tracks > 2 ? "album" : "single")
				},
				art: persistentData.art,
				artURL: art,
				colors: persistentData.colors,
				uri: response.item.uri,
				elapsed: response.progress_ms,
				duration: response.item.duration_ms,
				isPlaying: response.is_playing,
				isrc: persistentData.isrc,
				labels: persistentData.labels,
			};

			// ignore response.item.album.album_type, spotify will always fill this in with "single"
			postToSpotifyEventChannel({event: "trackData", data: trackData});

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
	}).catch(async function(err) {
		throw err;
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