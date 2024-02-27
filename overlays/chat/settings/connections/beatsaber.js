const bsEventChannel = new BroadcastChannel("bs");
var currentBSSong = null;
var currentBSState = {
	state: "stopped",
	elapsed: 0,
	timestamp: Date.now(),
	acc: 1,
	combo: 0,
	hits: 0,
	misses: 0,
	score: 0,
	scene: "Menu"
};

function postToBSEventChannel(data) {
	console.log(data);
	if(data) {
		bsEventChannel.postMessage(data);
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

	currentBSSong.cover.colors = {
		light: localStorage.getItem("setting_bs_artistColor"),
		dark: localStorage.getItem("setting_bs_artistColor")
	};
	console.log(currentBSSong.cover.colors);

	if(!currentBSSong.song.title) { currentBSSong.song.title = '(no title)'; }
	if(!currentBSSong.song.artist) { currentBSSong.song.artist = '(no artist)'; }
	if(!currentBSSong.map.author) { currentBSSong.map.author = '(unknown mapper)'; }

	if(currentBSSong.map.hash === null) {
		postToBSEventChannel({
			type: "map",
			data: currentBSSong
		});
		return;
	}

	if(currentBSSong.map.hash.indexOf("wip") === -1 && currentBSSong.map.hash.length === 40) {
		let cacheData = sessionStorage.getItem(`_bs_cache_${currentBSSong.map.hash}`);
		let bsData = null;

		if(cacheData !== null) {
			bsData = JSON.parse(cacheData);
		} else {
			let response = await fetch(`https://api.beatsaver.com/maps/hash/${currentBSSong.map.hash}`);
			if(response.ok) {
				bsData = await response.json();
				if(!("collaborators" in bsData)) { // TEMP SOLUTION REMOVE LATER
					let responseID = await fetch(`https://api.beatsaver.com/maps/id/${bsData.id}`);
					if(responseID.ok) {
						bsData = await responseID.json();
					}
				}
				sessionStorage.setItem(`_bs_cache_${currentBSSong.map.hash}`, JSON.stringify(bsData));
			}
		}

		if(bsData !== null) {
			console.log(bsData);
			if(!("verifiedMapper" in bsData.uploader)) { bsData.uploader.verifiedMapper = false; }

			const showAvatar = (bsData.uploader.curator || bsData.uploader.seniorCurator || bsData.uploader.verifiedMapper || bsData.ranked || bsData.qualified || "curator" in bsData);

			currentBSSong.map.bsr = bsData.id;
			currentBSSong.map.uploaders = [{
				name: bsData.uploader.name,
				avatar: (showAvatar ? bsData.uploader.avatar : null)
			}];
			currentBSSong.cover.url = bsData.versions[0].coverURL;

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
						avatar: (showCollaboratorAvatar ? collaborator.avatar : null)
					});
				}
			}
		}

		if(currentBSSong.cover.raw === "placeholder.png" && currentBSSong.cover.url === "placeholder.png") {
			postToBSEventChannel({
				type: "map",
				data: currentBSSong
			});
			return;
		}

		let art;
		let swatches;
		// DataPuller doesn't ever send raw image data, it's always remote
		if(localStorage.getItem("setting_bs_useRemoteArtURL") === "true" || localStorage.getItem("setting_beatSaberDataMod") === "datapuller") {
			art = currentBSSong.cover.url;
			swatches = await Vibrant.from(art).getSwatches();
		} else {
			art = currentBSSong.cover.raw;
			$("#bsplusImageContainer").attr("src", `data:image/jpg;base64,${art}`);
			swatches = await Vibrant.from($("#bsplusImageContainer")[0]).getSwatches();
		}

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