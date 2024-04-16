var remoteDB = {};
var db = {
	safe: [],
	unsafe: []
};
if(localStorage.getItem("bsvodaudio_safeHashes")) { db.safe = JSON.parse(localStorage.getItem("bsvodaudio_safeHashes")); }
if(localStorage.getItem("bsvodaudio_unsafeHashes")) { db.unsafe = JSON.parse(localStorage.getItem("bsvodaudio_unsafeHashes")); }

async function syncRemoteDatabases() {
	if(localStorage.getItem("setting_bsvodaudio_syncRemoteDBs") !== "true") {
		console.log("Not syncing remote databases, disabled in settings");
		return;
	}

	let list = localStorage.getItem("setting_bsvodaudio_remoteDBURLs").split("\n");
	for(let i in list) {
		let dbURLString = list[i].trim();
		console.log(`grabbing remote database ${dbURLString}...`);

		const dbURL = new URL(dbURLString);
		dbURL.searchParams.append("time", Date.now());

		const response = await fetch(dbURL);
		if(!response.ok) {
			console.log(`could not grab database from URL ${dbURL.href}`);
			continue;
		}
		var data = await response.json();
		console.log(data);

		if(!("safe" in data)) {
			console.log(`database from ${dbURL.href} does not have a safe list`);
			data.safe = [];
		}
		if(!("unsafe" in data)) {
			console.log(`database from ${dbURL.href} does not have an unsafe list`);
			data.unsafe = [];
		}

		data.safe = data.safe.map(function(x) { return x.toLowerCase(); });
		data.unsafe = data.unsafe.map(function(x) { return x.toLowerCase(); });

		let count = data.safe.length + data.unsafe.length;

		remoteDB[dbURL.href] = data;
		console.log(`synced ${count.toLocaleString()} hashes with ${dbURL.href}`);
	}
}
syncRemoteDatabases();

const obsEventChannel = new BroadcastChannel("obs");
const bsEventChannel = new BroadcastChannel("bs");

function postToOBSEventChannel(event, data) {
	let message = {
		event: event
	};
	if(typeof data !== "undefined") {
		message.data = data;
	}

	console.log(message);
	obsEventChannel.postMessage(message);
}

bsEventChannel.onmessage = function(message) {
	console.log(message);
	data = message.data;

	processMessage(data);
};

var gameState = "Menu";
var mapInfo;
var eventFuncs = {
	"scene": async function(data) {
		gameState = data.data;

		if(gameState === "Menu") {
			if(localStorage.getItem("setting_bsvodaudio_muteOnMenu") === "true") {
				console.log("Muting VOD audio, in menu");
				postToOBSEventChannel("toggleVODAudio", false);
			} else {
				console.log("Unmuting VOD audio, in menu");
				postToOBSEventChannel("toggleVODAudio", true);
			}
		}
	},

	"map": async function(data) {
		let map = mapInfo = data.data;
		map.isVODSafe = 0;

		console.log(`Song is "${map.song.title}${(map.song.subtitle == "" ? "" : " " + map.song.subtitle)}" by ${map.song.artist}, mapped by ${map.map.author}`);

		let allow = true;
		let found = "";

		if(map.map.hash.indexOf("wip") !== -1) {
			console.log(`${map.map.hash} is a WIP map, muting VOD audio`);
			map.isVODSafe = 2;
			allow = false;
			found = "local";
		} else {
			if(db.safe.indexOf(map.map.hash) !== -1) {
				console.log(`${map.map.hash} is marked safe, unmuting VOD audio`);
				map.isVODSafe = 1;
				found = "local";
			} else if(db.unsafe.indexOf(map.map.hash) !== -1) {
				console.log(`${map.map.hash} is marked unsafe, muting VOD audio`);
				map.isVODSafe = 2;
				allow = false;
				found = "local";
			} else {
				let presentInRemote = false;

				if(localStorage.getItem("setting_bsvodaudio_syncRemoteDBs") === "true") {
					for(let url in remoteDB) {
						let rDB = remoteDB[url];

						if(rDB.safe.indexOf(map.map.hash) !== -1) {
							presentInRemote = true;

							if(found !== "") {
								if(localStorage.getItem("setting_bsvodaudio_muteOnConflict") === "true" && map.isVODSafe == 2) {
									console.log(`${map.map.hash} conflict found in ${url} with ${found}, leaving marked as unsafe`);
								} else {
									console.log(`${map.map.hash} conflict found in ${url} with ${found}, preferring lowest index array`);
									map.isVODSafe = 1;
								}
							} else {
								console.log(`${map.map.hash} is marked safe in ${url}, unmuting VOD audio`);
								map.isVODSafe = 1;
							}

							found = url;
						} else if(rDB.unsafe.indexOf(map.map.hash) !== -1) {
							presentInRemote = true;

							console.log(`${map.map.hash} is marked unsafe in ${url}, muting VOD audio`);

							if(found !== "") {
								console.log(`${map.map.hash} conflict found in ${url} with ${found}`);
							}

							map.isVODSafe = 2;
							allow = false;
							found = url;
						}
					}
				}

				if(!presentInRemote) {
					if(localStorage.getItem("setting_bsvodaudio_muteOnUnknown")) {
						console.log(`${map.map.hash} is unknown, muting VOD audio out of caution`);
						allow = false;
					} else {
						console.log(`${map.map.hash} is unknown, letting VOD audio remain`);
						allow = true;
					}
				}
			}
		}

		currentVODAudioState = "Unknown";
		if(map.isVODSafe) {
			currentVODAudioState = (map.isVODSafe === 1 ? "Safe" : "Unsafe");
		}
		checkAudioState();

		$(":root").get(0).style.setProperty("--currentHash", `"${map.map.hash}"`);
		$(":root").get(0).style.setProperty("--currentTitle", `"${map.song.title}${(map.song.subtitle == "" ? "" : " " + map.song.subtitle)}"`);
		$(":root").get(0).style.setProperty("--currentArtist", `"${map.song.artist}"`);
		$(":root").get(0).style.setProperty("--currentMapper", `"${map.map.author}"`);
		$(":root").get(0).style.setProperty("--currentBSR", `"${map.map.bsr}"`);
		if(map.cover.internal.image === null) {
			$(":root").get(0).style.setProperty("--currentArt", `url(data:image/jpeg;base64,${map.cover.external.image})`);
		} else {
			$(":root").get(0).style.setProperty("--currentArt", `url(data:image/jpeg;base64,${map.cover.internal.image})`);
		}

		postToOBSEventChannel("toggleVODAudio", allow);
	}
}

async function processMessage(data) {
	if(data.type in eventFuncs) {
		eventFuncs[data.type](data);
	}
}

function saveLocalHashes() {
	localStorage.setItem("bsvodaudio_safeHashes", JSON.stringify(db.safe));
	localStorage.setItem("bsvodaudio_unsafeHashes", JSON.stringify(db.unsafe));
	console.log("saved local map hash database");
}