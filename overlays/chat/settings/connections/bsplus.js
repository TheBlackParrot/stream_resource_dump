var _bs_oldCombo = 0;
var _bs_hits = 0;
function setHits(combo) {
	if(combo === _bs_oldCombo) {
		return;
	}

	if(combo < _bs_oldCombo) {
		_bs_oldCombo = combo;
		return;
	}
	
	_bs_hits += combo - _bs_oldCombo;
	_bs_oldCombo = combo;
}

/*
		currentBSSong = {
			song: {
				title: data.SongName,
				subtitle: data.SongSubName,
				artist: data.SongAuthor,
				duration: data.Duration * 1000
			},
			map: {
				characteristic: data.MapType,
				difficulty: data.Difficulty,
				hash: data.Hash.toLowerCase(),
				author: data.Mapper,
				bsr: null,
				uploader: {}
			},
			cover: {
				colors: {},
				raw: "placeholder.png",
				url: data.CoverImage
			}
		};
*/

const BSPlusMessageHandlers = {
	"mapInfo": async function(data) {
		_bs_hits = 0;
		_bs_oldCombo = 0;

		data = data.mapInfoChanged;

		currentBSSong = {
			song: {
				title: data.name,
				subtitle: data.sub_name,
				artist: data.artist,
				duration: data.duration
			},
			map: {
				characteristic: data.characteristic,
				difficulty: data.difficulty,
				hash: data.level_id.replace("custom_level_", "").toLowerCase(),
				author: data.mapper,
				bsr: null,
				uploaders: []
			},
			cover: {
				colors: {},
				raw: data.coverRaw,
				url: null
			}
		};

		oldHash = null;

		await updateBeatSaberMapData();
	},

	"score": function(data) {
		setHits(data.scoreEvent.combo);
		currentBSState.hits = _bs_hits;
		currentBSState.acc = data.scoreEvent.accuracy;
		currentBSState.combo = data.scoreEvent.combo;
		currentBSState.misses = data.scoreEvent.missCount;
		currentBSState.elapsed = data.scoreEvent.time;
		currentBSState.score = data.scoreEvent.score;
		currentBSState.timestamp = Date.now();

		postToBSEventChannel({
			type: "state",
			data: currentBSState
		});
	},

	"pause": function(data) {
		currentBSState.state = "paused";
		currentBSState.elapsed = data.pauseTime;
		currentBSState.timestamp = Date.now();

		postToBSEventChannel({
			type: "state",
			data: currentBSState
		});
	},

	"resume": function(data) {
		currentBSState.state = "playing";
		currentBSState.elapsed = data.resumeTime;
		currentBSState.timestamp = Date.now();

		postToBSEventChannel({
			type: "state",
			data: currentBSState
		});
	},

	"gameState": function(data) {
		if(data.gameStateChanged === "Playing") {
			currentBSState.state = "playing";
		} else {
			currentBSState.state = "stopped";
		}

		currentBSState.scene = data.gameStateChanged;

		postToBSEventChannel({
			type: "state",
			data: currentBSState
		});

		postToBSEventChannel({
			type: "scene",
			data: currentBSState.scene
		});
	}
}

var bsplusInit = false;
var bsplus_ws;
var stateInterval;
var bsplusTimeout;
function startBSPlusWebsocket() {
	if(bsplusInit) {
		return;
	}

	bsplusInit = true;

	console.log("Starting connection to BS+...");
	let url = `ws://127.0.0.1:${localStorage.getItem("setting_bsplus_port")}/socket`;

	bsplus_ws = new WebSocket(url);
	bsplus_ws.hasSeenFirstMessage = false;

	bsplus_ws.addEventListener("message", async function(msg) {
		var data = JSON.parse(msg.data);

		if(!bsplus_ws.hasSeenFirstMessage) {
			bsplus_ws.hasSeenFirstMessage = true;
			console.log(data);
			console.log(`Connected to Beat Saber v${data.gameVersion}`);
			changeStatusCircle("BSPlusStatus", "green", `connected (v${data.gameVersion.split("_")[0]})`);

			clearInterval(stateInterval);
			stateInterval = setInterval(function() {
				if(currentBSState.state === "playing" && Date.now() - currentBSState.timestamp >= 500) {
					currentBSState.elapsed++;

					postToBSEventChannel({
						type: "state",
						data: currentBSState
					});
				}
			}, 1000);
		}

		if(data._type === "event") {
			if(data._event in BSPlusMessageHandlers) {
				BSPlusMessageHandlers[data._event](data);
			} else {
				postToBSEventChannel({
					type: "unknown",
					data: data
				});
			}
		}
	});

	bsplus_ws.addEventListener("open", function() {
		console.log(`Connected to BS+ websocket at ${url}`);
		changeStatusCircle("BSPlusStatus", "green", "connected");

		addNotification("Connected to Beat Saber Plus", {bgColor: "var(--notif-color-success)", duration: 5});
	});

	bsplus_ws.addEventListener("close", function() {
		bsplusInit = false;

		console.log(`Connection to BS+ websocket ${url} failed, retrying in 20 seconds...`);
		changeStatusCircle("BSPlusStatus", "red", "disconnected");

		clearTimeout(bsplusTimeout);
		bsplusTimeout = setTimeout(startBSPlusWebsocket, 20000);

		addNotification("Disconnected from Beat Saber Plus", {bgColor: "var(--notif-color-fail)", duration: 5});

		delete bsplus_ws;
	});
}