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

	if(response.status === 401) {
		// invalid tokens? try again
		await regenSpotifyCodes();
		await delay(3000);
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

async function getArtistInfos(id_arr) {
	let accessToken = localStorage.getItem("spotify_accessToken");

	const artistIDs = new URLSearchParams({
		ids: id_arr.join(",")
	});

	const response = await fetch(`https://api.spotify.com/v1/artists?${artistIDs.toString()}`, {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});

	const data = await response.json();
	return data;
}

async function getTrackDataFromISRC(isrc) {
	const accessToken = localStorage.getItem("spotify_accessToken");

	const params = new URLSearchParams({
		q: `isrc:${isrc}`,
		type: "track",
		limit: 1
	});

	console.log(`getting spotify information for ISRC ${isrc}...`);

	const response = await fetch(`https://api.spotify.com/v1/search?${params.toString()}`, {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});

	const data = await response.json();
	console.log(data);
	return data;
}

async function parseArtistInfo(artistList) {
	let artists = [];
	let artistIDs = [];

	for(let i in artistList) {
		if(i >= 50) {
			// API parameter limit
			continue;
		}

		artistIDs.push(artistList[i].id);
	}

	const artistInfos = await getArtistInfos(artistIDs);
	console.log(artistInfos);
	if(artistInfos) {
		for(let i in artistInfos.artists) {
			let artist = artistInfos.artists[i];

			let image = null;
			if(artist.images.length) {
				let size = ((parseInt(localStorage.getItem("setting_spotify_lineHeight")) * 2) || 32);

				let selectedImageURL = artist.images[artist.images.length - 1].url;
				for(let imageIdx in artist.images) {
					let checkingImage = artist.images[imageIdx];

					if(checkingImage.width < size) {
						continue;
					}
					selectedImageURL = checkingImage.url;
				}

				image = await compressImage(selectedImageURL, size, parseInt(localStorage.getItem("setting_spotify_artImageQuality")) / 100, "spotify", 30);
			}

			artists.push({
				name: artist.name,
				image: image
			});
		}
	}

	return artists;
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
	art: null,
	year: null
};
async function fetchMusicBrainz(isrc) {
	persistentData.isrc = isrc;

	// chrome doesn't allow user agent spoofing but you can't say i didn't try :(
	// https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting
	const headers = new Headers({
		"User-Agent": `TBPSpotifyOverlay/${overlayRevision} ( https://theblackparrot.me/overlays )`
	});

	const isrcController = new AbortController();
	const isrcTimedOutID = setTimeout(() => isrcController.abort(), parseFloat(localStorage.getItem("setting_ajaxTimeout")) * 1000);
	var isrcResponse = {ok: false};
	try {
		isrcResponse = await fetch(`https://musicbrainz.org/ws/2/isrc/${isrc}?fmt=xml&inc=releases&status=official`, { signal: isrcController.signal, headers: headers });
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
			let dates = check.getElementsByTagName("date");
			if(dates.length) {
				let timestamp = new Date(dates[0].innerHTML);
				if(timestamp.getTime() < oldestDate) {
					oldestDate = timestamp;
					release = check;
					persistentData.year = timestamp.getUTCFullYear();
					console.log(`year should be ${persistentData.year}`);
				}
			}
		}

		const labelController = new AbortController();
		const labelTimedOutID = setTimeout(() => labelController.abort(), parseFloat(localStorage.getItem("setting_ajaxTimeout")) * 1000);
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
async function updateArtColors(art) {
	try {
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
		persistentData.colors.dark = `#${colors.dark[0].map(function(x) { return Math.floor(x).toString(16).padStart(2, "0"); }).join("")}`;
		persistentData.colors.light = `#${colors.light[0].map(function(x) { return Math.floor(x).toString(16).padStart(2, "0"); }).join("")}`;
		
		localStorage.setItem("art_darkColor", persistentData.colors.dark);
		localStorage.setItem("art_lightColor", persistentData.colors.light);
	} catch(err) {
		throw err;
	}
}
async function updateTrack() {
	const defaultUpdateDelay = parseFloat(localStorage.getItem("setting_spotify_refreshInterval")) * 1000;

	getState().then(async function(response) {
		if(response.item !== null) {
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
			
			currentSong = response.item;

			let art = response.item.album.images[Math.ceil(response.item.album.images.length / 2) - 1].url;

			if(oldID !== response.item.id) {
				let artists = await parseArtistInfo(response.item.artists);

				persistentData = {
					artists: artists,

					colors: {
						light: localStorage.getItem("setting_spotify_scannableCustomBGColor"),
						dark: localStorage.getItem("setting_spotify_scannableCustomBGColor")
					},

					labels: [],
					isrc: null,
					art: await compressImage(art, parseInt(localStorage.getItem("setting_spotify_artImageSize")), parseInt(localStorage.getItem("setting_spotify_artImageQuality")) / 100, "spotify", 180),
					year: null
				};

				if(persistentData.art !== "placeholder.png") {
					await updateArtColors(persistentData.art)
				}

				if("external_ids" in response.item) {
					await fetchMusicBrainz(response.item.external_ids.isrc);
				}
			}
			oldID = response.item.id;

			var trackData = {
				title: response.item.name,
				artists: persistentData.artists,
				album: {
					name: response.item.album.name,
					type: (response.item.album.total_tracks > 2 ? "album" : "single"),
					released: (persistentData.year ? persistentData.year : new Date(response.item.album.release_date).getUTCFullYear()),
					uri: response.item.album.uri
				},
				art: persistentData.art,
				artURL: art,
				colors: persistentData.colors,
				uri: response.item.uri,
				elapsed: response.progress_ms,
				duration: response.item.duration_ms,
				isPlaying: response.is_playing,
				isrc: persistentData.isrc,
				labels: persistentData.labels
			};

			// ignore response.item.album.album_type, spotify will always fill this in with "single"
			postToSpotifyEventChannel({event: "trackData", data: trackData});
		} else {
			clearTimeout(updateTrackTO);
			updateTrackTO = setTimeout(updateTrack, defaultUpdateDelay);
		}
	}).catch(async function(err) {
		throw err;
		console.log("error thrown, retriggering");
		await delay(5000);
		if(localStorage.getItem('spotify_accessToken')) {
			updateTrack();
		}
	});
}

async function getCachedSpotifyImage(url, expireDaysAfter) {
	const cacheStorage = await caches.open("spotifyCache");

	var cachedResponse = await cacheStorage.match(url);
	if(!cachedResponse) {
		console.log("cache not hit");
		const newResponse = await fetch(url);
		if(!newResponse.ok) {
			return null;
		}

		cachedResponse = new Response(await newResponse.blob(), {
			headers: {
				'X-Cache-Timestamp': Date.now()
			}
		});
		await cacheStorage.put(url, cachedResponse);
	} else {
		console.log("cache hit");
		const cacheTimestamp = parseInt(cachedResponse.headers.get("X-Cache-Timestamp"));
		const staleThreshold = expireDaysAfter * 24 * 60 * 60 * 1000;
		if(Date.now() - cacheTimestamp > staleThreshold) {
			console.log(`cached image for ${url} is stale, re-fetching...`);
			cacheStorage.delete(url);
			return await getCachedSpotifyImage(url, expireDaysAfter);
		}
	}

	response = await cacheStorage.match(url);
	return response;
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