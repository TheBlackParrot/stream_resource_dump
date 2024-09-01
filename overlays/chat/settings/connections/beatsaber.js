var currentBSSong = null;
var currentBSState = {
	state: "stopped",
	elapsed: 0,
	timestamp: Date.now(),
	acc: 1,
	fcacc: NaN,
	averages: {
		left: [0, 0, 0],
		right: [0, 0, 0]
	},
	combo: 0,
	hits: 0,
	misses: 0,
	score: 0,
	scene: "Menu"
};
var oldScene;
var currentHandColors = {
	left: "#ffffff",
	right: "#ffffff"
};
var leftHandTotal = [0, 0, 0, 0];
var rightHandTotal = [0, 0, 0, 0];

var mapPacks = {};
async function getMapPacks() {
	const response = await fetch(`./connections/beatsaber_packs.json?sigh=${Date.now()}`);
	if(!response.ok) {
		console.log("failed to fetch beat saber map pack data");
		return;
	}

	mapPacks = await response.json();
}

const bsEventChannel = new BroadcastChannel("bs");
function postToBSEventChannel(data) {
	if(data) {
		bsEventChannel.postMessage(data);
	}
}

async function getCachedBeatSaverUserData(url) {
	const cacheStorage = await caches.open("beatSaverCache");

	var cachedResponse = await cacheStorage.match(url);
	if(!cachedResponse) {
		const newResponse = await fetch(url);
		if(!newResponse.ok) {
			return {};
		}
		var userData = await newResponse.text();
		var userDataJSON = JSON.parse(userData);

		cachedResponse = new Response(userData, {
			headers: {
				'Content-Type': "application/json",
				'X-Cache-Timestamp': Date.now()
			}
		});
		await cacheStorage.put(`https://api.beatsaver.com/users/id/${userDataJSON.id}`, cachedResponse);		
	} else {
		const cacheTimestamp = parseInt(cachedResponse.headers.get("X-Cache-Timestamp"));
		const staleThreshold = parseFloat(localStorage.getItem("setting_bsUserCacheExpiryDelay")) * 24 * 60 * 60 * 1000;
		if(Date.now() - cacheTimestamp > staleThreshold) {
			console.log(`cached user data for ${url} is stale, re-fetching...`);
			cacheStorage.delete(url);
			return await getCachedBeatSaverUserData(url);
		}

		return await cachedResponse.json();
	}

	cachedResponse = await cacheStorage.match(url);
	return await cachedResponse.json();
}

async function getCachedMapData(url) {
	const cacheStorage = await caches.open("beatSaverCache");

	var cachedResponse = await cacheStorage.match(url);
	if(!cachedResponse) {
		const newResponse = await fetch(url);
		if(!newResponse.ok) {
			return {};
		}
		var mapData = await newResponse.json();

		// getting more uploader data since the one in the maps endpoints aren't actually the full uploader response
		mapData.uploader = await getCachedBeatSaverUserData(`https://api.beatsaver.com/users/id/${mapData.uploader.id}`);

		cachedResponse = new Response(JSON.stringify(mapData), {
			headers: {
				'Content-Type': "application/json",
				'X-Cache-Timestamp': Date.now()
			}
		});
		await cacheStorage.put(`https://api.beatsaver.com/maps/hash/${mapData.versions[0].hash}`, await cachedResponse.clone());
		await cacheStorage.put(`https://api.beatsaver.com/maps/id/${mapData.id}`, cachedResponse);
	} else {
		const cacheTimestamp = parseInt(cachedResponse.headers.get("X-Cache-Timestamp"));
		const staleThreshold = parseFloat(localStorage.getItem("setting_bsMapCacheExpiryDelay")) * 24 * 60 * 60 * 1000;
		if(Date.now() - cacheTimestamp > staleThreshold) {
			console.log(`cached map data for ${url} is stale, re-fetching...`);
			cacheStorage.delete(url);
			return await getCachedMapData(url);
		}

		return await cachedResponse.json();
	}

	cachedResponse = await cacheStorage.match(url);
	try {
		return await cachedResponse.json();
	} catch(err) {
		return null;
	}
}

var oldHash;
async function updateBeatSaberMapData() {
	const curHash = `${currentBSSong.map.hash}.${currentBSSong.song.title}`;
	if(oldHash === curHash) {
		console.log(`old hash is current hash, not updating map data (old: ${oldHash}, new: ${curHash})`);
		return;
	} else {
		console.log(`old hash is not current hash, updating map data (old: ${oldHash}, new: ${curHash})`);
	}
	oldHash = curHash;

	leftHandTotal = [0, 0, 0, 0];
	rightHandTotal = [0, 0, 0, 0];
	currentBSState.averages = {
		left: [0, 0, 0],
		right: [0, 0, 0]
	};

	if(!currentBSSong.song.title) { currentBSSong.song.title = '(no title)'; }
	if(!currentBSSong.song.artist) { currentBSSong.song.artist = '(no artist)'; }
	if(!currentBSSong.map.author) { currentBSSong.map.author = '(unknown mapper)'; }

	if(currentBSSong.map.hash === null) {
		postToBSEventChannel({
			type: "map",
			data: currentBSSong
		});
		return;
	} else {
		postToBSEventChannel({
			type: "hash",
			data: currentBSSong.map.hash
		});

		for(const packName in mapPacks) {
			const pack = mapPacks[packName];
			if(pack.indexOf(currentBSSong.map.hash) !== -1) {
				currentBSSong.map.pack = packName;
				break;
			}
		}
	}

	let bsData = null;
	if(currentBSSong.map.hash.indexOf("wip") === -1 && currentBSSong.map.hash.length === 40) {
		bsData = await getCachedMapData(`https://api.beatsaver.com/maps/hash/${currentBSSong.map.hash}`);
	}

	if(bsData !== null) {
		console.log(bsData);
		if(!("verifiedMapper" in bsData.uploader)) { bsData.uploader.verifiedMapper = false; }

		const showAvatar = (bsData.uploader.curator || bsData.uploader.seniorCurator || bsData.uploader.verifiedMapper || bsData.ranked || bsData.qualified || "curator" in bsData);

		currentBSSong.map.bsr = bsData.id;
		currentBSSong.map.uploaders = [{
			name: bsData.uploader.name,
			avatar: (showAvatar && !("suspendedAt" in bsData.uploader) ? bsData.uploader.avatar : null)
		}];

		currentBSSong.cover.external.url = bsData.versions[0].coverURL;
		if(sessionStorage.getItem(`_bs_cache_art_${currentBSSong.map.hash}`)) {
			currentBSSong.cover.external.image = sessionStorage.getItem(`_bs_cache_art_${currentBSSong.map.hash}`);
		} else {
			currentBSSong.cover.external.image = await compressImage(bsData.versions[0].coverURL, parseInt(localStorage.getItem("setting_bs_artSize")) * 2, 0.8);
			sessionStorage.setItem(`_bs_cache_art_${currentBSSong.map.hash}`, currentBSSong.cover.external.image);
		}

		if("collaborators" in bsData) {
			const maxCollaborators = (parseInt(localStorage.getItem("setting_bs_maxCollaborators")) || 5);

			for(const collaborator of bsData.collaborators) {
				if(currentBSSong.map.uploaders.length >= maxCollaborators) {
					currentBSSong.map.uploaders.push({
						name: `and ${(bsData.collaborators.length+1) - maxCollaborators} more...`,
						avatar: null
					});
					break;
				}

				const showCollaboratorAvatar = (collaborator.curator || collaborator.seniorCurator || collaborator.verifiedMapper);
				currentBSSong.map.uploaders.push({
					name: collaborator.name,
					avatar: (showCollaboratorAvatar && !("suspendedAt" in collaborator) ? collaborator.avatar : null)
				});
			}
		}
	}

	let art;
	let swatches;
	// DataPuller doesn't ever send raw image data, it's always remote
	if(localStorage.getItem("setting_bs_useRemoteArtURL") === "true" || localStorage.getItem("setting_beatSaberDataMod") === "datapuller") {
		art = currentBSSong.cover.external.image;
		if(art === null && currentBSSong.cover.internal.image !== null) {
			art = currentBSSong.cover.internal.image;
		}
	} else {
		art = currentBSSong.cover.internal.image;
	}
	if(art !== null) {
		$("#bsplusImageContainer").attr("src", art);
		swatches = await Vibrant.from($("#bsplusImageContainer")[0]).getSwatches();

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
		currentBSSong.cover.colors.dark = `#${colors.dark[0].map(function(x) { return Math.floor(x).toString(16).padStart(2, "0"); }).join("")}`;
		currentBSSong.cover.colors.light = `#${colors.light[0].map(function(x) { return Math.floor(x).toString(16).padStart(2, "0"); }).join("")}`;
	}

	postToBSEventChannel({
		type: "map",
		data: currentBSSong
	});
}

function connectBeatSaber() {
	switch(localStorage.getItem("setting_beatSaberDataMod")) {
		case "bsplus":
			startBSPlusWebsocket();
			break;

		case "datapuller":
			startDataPullerMapInfoWebsocket();
			startDataPullerLiveDataWebsocket();
			break;

		case "sirastatus":
			startSiraStatusWebsocket();
			break;
	}
}