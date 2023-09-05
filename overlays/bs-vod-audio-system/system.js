$.ajaxSetup({ timeout: 10000 });

var remoteDB = {};
var db = {
	safe: [],
	unsafe: []
};
if(localStorage.getItem("bsvodaudio_safeHashes")) { db.safe = JSON.parse(localStorage.getItem("bsvodaudio_safeHashes")); }
if(localStorage.getItem("bsvodaudio_unsafeHashes")) { db.unsafe = JSON.parse(localStorage.getItem("bsvodaudio_unsafeHashes")); }

function syncRemoteDatabases() {
	if(localStorage.getItem("setting_bsvodaudio_syncRemoteDBs") !== "true") {
		console.log("Not syncing remote databases, disabled in settings");
		startWebsocket();
		return;
	}

	let list = localStorage.getItem("setting_bsvodaudio_remoteDBURLs").split("\n");
	for(let i in list) {
		let dbURL = list[i].trim();
		console.log(`grabbing remote database ${dbURL}...`);
		$.ajax({
			type: "GET",
			dataType: "json",

			url: dbURL,
			data: {
				time: Date.now()
			},

			success: function(response) {
				console.log(`got remote database ${dbURL}`);
				console.log(response);

				if(!("safe" in response)) {
					console.log(`database from ${dbURL} does not have a safe list`);
					response.safe = [];
				}
				if(!("unsafe" in response)) {
					console.log(`database from ${dbURL} does not have an unsafe list`);
					response.unsafe = [];
				}

				response.safe = response.safe.map(function(x) { return x.toLowerCase(); });
				response.unsafe = response.unsafe.map(function(x) { return x.toLowerCase(); });

				let count = response.safe.length + response.unsafe.length;

				remoteDB[dbURL] = response;
				console.log(`synced ${count.toLocaleString()} hashes with ${dbURL}`);
			},

			error: function(response) {
				console.error(response);
			}
		});
	}
}
syncRemoteDatabases();

const obsEventChannel = new BroadcastChannel("obs");
const bsplusEventChannel = new BroadcastChannel("bsplus");

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

bsplusEventChannel.onmessage = function(message) {
	console.log(message);
	data = message.data;

	processMessage(data);
};

var gameState = "Menu";
var mapInfo;
var eventFuncs = {
	"gameState": async function(data) {
		gameState = data.gameStateChanged;

		if(data.gameStateChanged === "Menu") {
			if(localStorage.getItem("setting_bsvodaudio_muteOnMenu") === "true") {
				console.log("Muting VOD audio, in menu");
				postToOBSEventChannel("toggleVODAudio", false);
			} else {
				console.log("Unmuting VOD audio, in menu");
				postToOBSEventChannel("toggleVODAudio", true);
			}
		}
	},

	"mapInfo": async function(data) {
		let map = mapInfo = data.mapInfoChanged;
		map.isVODSafe = 0;
		map.hash = map.level_id.replace("custom_level_", "").toLowerCase();

		console.log(`Song is "${map.name}${(map.sub_name == "" ? "" : " " + map.sub_name)}" by ${map.artist}, mapped by ${map.mapper}`);

		let allow = true;
		let found = "";

		if(map.hash.indexOf("wip") !== -1) {
			console.log(`${map.hash} is a WIP map, muting VOD audio`);
			map.isVODSafe = 2;
			allow = false;
			found = "local";
		} else {
			if(db.safe.indexOf(map.hash) !== -1) {
				console.log(`${map.hash} is marked safe, unmuting VOD audio`);
				map.isVODSafe = 1;
				found = "local";
			} else if(db.unsafe.indexOf(map.hash) !== -1) {
				console.log(`${map.hash} is marked unsafe, muting VOD audio`);
				map.isVODSafe = 2;
				allow = false;
				found = "local";
			} else {
				let presentInRemote = false;

				if(localStorage.getItem("setting_bsvodaudio_syncRemoteDBs") === "true") {
					for(let url in remoteDB) {
						let rDB = remoteDB[url];

						if(rDB.safe.indexOf(map.hash) !== -1) {
							presentInRemote = true;

							if(found !== "") {
								if(localStorage.getItem("setting_bsvodaudio_muteOnConflict") === "true" && map.isVODSafe == 2) {
									console.log(`${map.hash} conflict found in ${url} with ${found}, leaving marked as unsafe`);
								} else {
									console.log(`${map.hash} conflict found in ${url} with ${found}, preferring lowest index array`);
									map.isVODSafe = 1;
								}
							} else {
								console.log(`${map.hash} is marked safe in ${url}, unmuting VOD audio`);
								map.isVODSafe = 1;
							}

							found = url;
						} else if(rDB.unsafe.indexOf(map.hash) !== -1) {
							presentInRemote = true;

							console.log(`${map.hash} is marked unsafe in ${url}, muting VOD audio`);

							if(found !== "") {
								console.log(`${map.hash} conflict found in ${url} with ${found}`);
							}

							map.isVODSafe = 2;
							allow = false;
							found = url;
						}
					}
				}

				if(!presentInRemote) {
					if(localStorage.getItem("setting_bsvodaudio_muteOnUnknown")) {
						console.log(`${map.hash} is unknown, muting VOD audio out of caution`);
						allow = false;
					} else {
						console.log(`${map.hash} is unknown, letting VOD audio remain`);
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

		$(":root").get(0).style.setProperty("--currentHash", `"${map.hash}"`);
		$(":root").get(0).style.setProperty("--currentTitle", `"${map.name}${(map.sub_name == "" ? "" : " " + map.sub_name)}"`);
		$(":root").get(0).style.setProperty("--currentArtist", `"${map.artist}"`);
		$(":root").get(0).style.setProperty("--currentMapper", `"${map.mapper}"`);
		$(":root").get(0).style.setProperty("--currentBSR", `"${map.BSRKey}"`); // this is currently blank as of BS+ v6.0.8
		$(":root").get(0).style.setProperty("--currentArt", `url(data:image/jpeg;base64,${map.coverRaw.trim()})`);

		postToOBSEventChannel("toggleVODAudio", allow);
	}
}

async function processMessage(data) {
	if(data._event in eventFuncs) {
		eventFuncs[data._event](data);
	}
}

function saveLocalHashes() {
	localStorage.setItem("bsvodaudio_safeHashes", JSON.stringify(db.safe));
	localStorage.setItem("bsvodaudio_unsafeHashes", JSON.stringify(db.unsafe));
	console.log("saved local map hash database");
}