const settings = require("./settings.json");
const sessionTimestamp = Date.now();

const OBSWebSocket = require('obs-websocket-js').default;
const WebSocket = require("ws");
const fs = require("fs");
const https = require("https");

const obs = new OBSWebSocket();
const bs = new WebSocket(`ws://${settings.bs.ip}:${settings.bs.port}/socket`);
const srv = new WebSocket.WebSocketServer({ port: settings.ws.port });
var srvClients = [];

var db = require("./db.json");
db.safe = db.safe.map(function(x) { return x.toLowerCase(); });
db.unsafe = db.unsafe.map(function(x) { return x.toLowerCase(); });

var remoteDB = {};
function syncRemoteDatabases() {
	if(!settings.databases.sync) {
		console.log("! Not syncing remote databases, disabled in settings");
		return;
	}

	let list = settings.databases.list.reverse();
	for(let i in list) {
		let url = list[i];

		// todo: add the timestamp into the query string properly. gotta do this to prevent any and all caching
		https.get(`${url}?time=${sessionTimestamp}`, function(res) {
			let rawData = "";
			res.setEncoding("utf8");
			res.on("data", function(chunk) {
				rawData += chunk;
			});

			res.on("end", function() {
				let parsed;

				try {
					parsed = JSON.parse(rawData);
				} catch(err) {
					console.error(err);
					return;
				}

				if(!("safe" in parsed)) {
					console.log(`! database from ${url} does not have a safe list`);
					parsed.safe = [];
				}
				if(!("unsafe" in parsed)) {
					console.log(`! database from ${url} does not have an unsafe list`);
					parsed.unsafe = [];
				}

				parsed.safe = parsed.safe.map(function(x) { return x.toLowerCase(); });
				parsed.unsafe = parsed.unsafe.map(function(x) { return x.toLowerCase(); });

				let count = parsed.safe.length + parsed.unsafe.length;

				remoteDB[url] = parsed;
				console.log(`+ synced ${count.toLocaleString()} hashes with ${url}`);
			});
		});
	}
}
syncRemoteDatabases();

function saveDB() {
	fs.writeFile("./db.json", JSON.stringify(db, null, "\t"), function(err) {
		if(err) {
			throw err;
		} else {
			console.log("+ saved database");
		}
	});
}
saveDB();

function logUnknown(map) {
	let filename = `./logs/unknowns-${sessionTimestamp}.txt`;
	let msg = `${map.hash} - ${map.sub_name === "" ? map.name : map.name + " " + map.sub_name} mapped by ${map.mapper}\r\n`;

	try {
		fs.appendFileSync(filename, msg, "utf8");
	} catch(err) {
		console.log("! Could not write to the unknown log");
	}
}

async function connectOBS() {
	try {
		const {
			obsWebSocketVersion,
			negotiatedRpcVersion
		} = await obs.connect(`ws://${settings.obs.ip}:${settings.obs.port}`, settings.obs.password, {
			rpcVersion: 1
		});
		console.log(`Connected to server ${obsWebSocketVersion} (using RPC ${negotiatedRpcVersion})`);

		await toggleVODAudio(0);
	} catch (error) {
		console.error('Failed to connect', error.code, error.message);
	}
}
connectOBS();

async function getAudioTracks() {
	return await obs.call('GetInputAudioTracks', {inputName: settings.obs.sourceName});
}

async function toggleVODAudio(val) {
	if(val) {
		val = true;
	} else {
		val = false;
	}

	let inp = {
		'1': true,
		'2': false,
		'3': false,
		'4': false,
		'5': false,
		'6': false
	}
	inp[settings.obs.vodAudioTrack] = val;

	return await obs.call('SetInputAudioTracks', {
		inputName: settings.obs.sourceName,
		inputAudioTracks: inp
	});
}

bs.on("message", function(raw) {
	const data = JSON.parse(raw);

	if(data._type === "event") {
		processMessage(data);
	}
});

var gameState = "Menu";
var mapInfo;
var eventFuncs = {
	"gameState": async function(data) {
		gameState = data.gameStateChanged;

		if(data.gameStateChanged === "Menu") {
			console.log("Muting VOD audio, in menu");
			await toggleVODAudio(0);
			broadcast(JSON.stringify({event: "gameState", data: "menu"}));
		}
	},

	"mapInfo": async function(data) {
		let map = mapInfo = data.mapInfoChanged;
		map.isVODSafe = 0;
		map.hash = map.level_id.replace("custom_level_", "").toLowerCase();

		console.log(`Song is "${map.name}${(map.sub_name == "" ? "" : " " + map.sub_name)}" by ${map.artist}, mapped by ${map.mapper}`);

		let allow = true;
		let found = "";

		if(db.safe.indexOf(map.hash) !== -1) {
			console.log(`- ${map.hash} is marked safe, unmuting VOD audio`);
			map.isVODSafe = 1;
			found = "local";
		} else if(db.unsafe.indexOf(map.hash) !== -1) {
			console.log(`- ${map.hash} is marked unsafe, muting VOD audio`);
			map.isVODSafe = 2;
			allow = false;
			found = "local";
		} else {
			let presentInRemote = false;

			if(settings.databases.sync) {
				for(let url in remoteDB) {
					let rDB = remoteDB[url];

					if(rDB.safe.indexOf(map.hash) !== -1) {
						presentInRemote = true;

						if(found !== "") {
							if(settings.databases.preferUnsafeOnDuplicateEntries && map.isVODSafe == 2) {
								console.log(`! ${map.hash} conflict found in ${url} with ${found}, leaving marked as unsafe`);
							} else {
								console.log(`! ${map.hash} conflict found in ${url} with ${found}, preferring lowest index array`);
								map.isVODSafe = 1;
							}
						} else {
							console.log(`- ${map.hash} is marked safe in ${url}, unmuting VOD audio`);
							map.isVODSafe = 1;
						}

						found = url;
					} else if(rDB.unsafe.indexOf(map.hash) !== -1) {
						presentInRemote = true;

						console.log(`- ${map.hash} is marked unsafe in ${url}, muting VOD audio`);

						if(found !== "") {
							console.log(`! ${map.hash} conflict found in ${url} with ${found}`);
						}

						map.isVODSafe = 2;
						allow = false;
						found = url;
					}
				}
			}

			if(settings.script.logUnknowns && !presentInRemote) {
				logUnknown(map);
			}

			if(settings.script.autoMuteOnUnknown && !presentInRemote) {
				console.log(`- ${map.hash} is unknown, muting VOD audio out of caution`);
				allow = false;
			} else if(!presentInRemote) {
				console.log(`- ${map.hash} is unknown, letting VOD audio remain`);
			}
		}

		await toggleVODAudio(allow);
		broadcast(JSON.stringify({event: "gameState", data: "playing"}));
		broadcast(JSON.stringify({event: "mapInfo", data: map}));
	}
}

async function processMessage(data) {
	if(data._event in eventFuncs) {
		eventFuncs[data._event](data);
	}
}

function broadcast(data) {
	srv.clients.forEach(function(client) {
		if(client.readyState === WebSocket.OPEN) {
			client.send(data);
		}
	});	
}

var srvFuncs = {
	flag: async function(client, data) {
		if(data.hash !== mapInfo.hash) {
			console.log(`! wanted hash ${data.hash} and cached hash ${mapInfo.hash} do not match`);
			return;
		}

		if(data.flag === "safe") {
			if(db.safe.indexOf(data.hash) !== -1) {
				return;
			}

			if(db.unsafe.indexOf(data.hash) !== -1) {
				db.unsafe.splice(db.unsafe.indexOf(data.hash), 1);
			}

			db.safe.push(data.hash);
			await toggleVODAudio(1);
			console.log(`+ flagged ${data.hash} as safe`);
		} else {
			if(db.unsafe.indexOf(data.hash) !== -1) {
				return;
			}

			if(db.safe.indexOf(data.hash) !== -1) {
				db.safe.splice(db.safe.indexOf(data.hash), 1);
			}

			db.unsafe.push(data.hash);
			await toggleVODAudio(0);
			console.log(`+ flagged ${data.hash} as unsafe`);
		}

		saveDB();

		broadcast(JSON.stringify({
			event: "flagUpdate",
			data: {
				hash: data.hash,
				state: data.flag === "safe" ? 1 : 2
			}
		}));
	},

	toggleVODAudio: async function(client, val) {
		if(val) {
			val = true;
		} else {
			val = false;
		}

		await toggleVODAudio(val);
	}
};

srv.on("connection", function(client) {
	if(gameState === "Playing") {
		client.send(JSON.stringify({event: "gameState", data: "playing"}));
		client.send(JSON.stringify({event: "mapInfo", data: mapInfo}));
	} else {
		client.send(JSON.stringify({event: "gameState", data: "menu"}));
	}

	client.on("message", function(rawData, isBinary) {
		let data = JSON.parse(rawData);
		if(data.event in srvFuncs) {
			srvFuncs[data.event](data.client, data.data);
		} else {
			console.log(data);
		}
	});
});