$.ajaxSetup({ timeout: 7000 });
const obs = new OBSWebSocket();

async function connectOBS() {
	var obsWebSocketVersion;
	var negotiatedRpcVersion;

	try {
		if(localStorage.getItem("setting_obs_usePassword") === "true") {
			details = await obs.connect(`ws://${localStorage.getItem("setting_obs_ip")}:${localStorage.getItem("setting_obs_port")}`, localStorage.getItem("setting_obs_password"), {
				rpcVersion: 1
			});
		} else {
			details = await obs.connect(`ws://${localStorage.getItem("setting_obs_ip")}:${localStorage.getItem("setting_obs_port")}`, {
				rpcVersion: 1
			});
		}
		console.log(`Connected to OBS Websocket Server v${details.obsWebSocketVersion} (using RPC v${details.negotiatedRpcVersion})`);

		//await toggleVODAudio(0);
	} catch (error) {
		console.error('Failed to connect to OBS, retrying in 15 seconds...', error.code, error.message);
		setTimeout(function() {
			connectOBS();
		}, 15000);
	}
}
connectOBS();

function checkIfDoneSyncing() {
	if(localStorage.getItem("setting_bsvodaudio_remoteDBURLs").split("\n").length === Object.keys(remoteDB).length) {
		console.log("done sync'ing remote databases, starting BS+ connection...");
		startWebsocket();
	}
}

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

				checkIfDoneSyncing();
			},

			error: function(response) {
				console.error(response);
			}
		});
	}
}
syncRemoteDatabases();

async function toggleVODAudio(val) {
	// expects a boolean specifically
	val = (val ? true : false);

	let inp = {
		'1': true,
		'2': false,
		'3': false,
		'4': false,
		'5': false,
		'6': false
	};
	inp[localStorage.getItem("setting_bsvodaudio_vodAudioTrack")] = val;

	return await obs.call('SetInputAudioTracks', {
		inputName: localStorage.getItem("setting_bsvodaudio_audioSource"),
		inputAudioTracks: inp
	});
}

/*async function getAudioTracks() {
	return await obs.call('GetInputAudioTracks', {inputName: settings.obs.sourceName});
}*/

var ws;
function startWebsocket() {
	console.log("Starting connection to BS+...");

	let url = `ws://${localStorage.getItem("setting_bsplus_ip")}:${localStorage.getItem("setting_bsplus_port")}/socket`;
	ws = new WebSocket(url);
	ws._init = false;

	ws.addEventListener("message", function(msg) {
		var data = JSON.parse(msg.data);

		if(!ws._init) {
			ws._init = true;
			console.log(`Connected to Beat Saber v${data.gameVersion}`);
		}

		//console.log(data);

		if(data._type === "event") {
			processMessage(data);
		}
	});

	ws.addEventListener("open", function() {
		console.log(`Connected to BS+ websocket at ${url}`);
	});

	ws.addEventListener("close", function() {
		console.log(`Connection to BS+ websocket ${url} failed, retrying in 10 seconds...`);
		setTimeout(startWebsocket, 10000);
	});
}

var gameState = "Menu";
var mapInfo;
var eventFuncs = {
	"gameState": async function(data) {
		gameState = data.gameStateChanged;

		if(data.gameStateChanged === "Menu") {
			if(localStorage.getItem("setting_bsvodaudio_muteOnMenu") === "true") {
				console.log("Muting VOD audio, in menu");
				await toggleVODAudio(0);
			} else {
				console.log("Unmuting VOD audio, in menu");
				await toggleVODAudio(1);				
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

		if(found === "") {
			currentVODAudioState = "Unknown";
		} else {
			if(allow) {
				currentVODAudioState = "Safe";
			} else {
				currentVODAudioState = "Unsafe";
			}
		}
		checkAudioState();

		$(":root").get(0).style.setProperty("--currentHash", `"${map.hash}"`);
		$(":root").get(0).style.setProperty("--currentTitle", `"${map.name}${(map.sub_name == "" ? "" : " " + map.sub_name)}"`);
		$(":root").get(0).style.setProperty("--currentArtist", `"${map.artist}"`);
		$(":root").get(0).style.setProperty("--currentMapper", `"${map.mapper}"`);
		$(":root").get(0).style.setProperty("--currentBSR", `"${map.BSRKey}"`); // this is currently blank as of BS+ v6.0.8
		$(":root").get(0).style.setProperty("--currentArt", `url(data:image/jpeg;base64,${map.coverRaw.trim()})`);

		await toggleVODAudio(allow);
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