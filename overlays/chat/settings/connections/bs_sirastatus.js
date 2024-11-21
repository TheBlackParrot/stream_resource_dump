var siraStatusInit = false;
var siraStatus_ws;
var siraStatusTimeout;

async function parseSiraBeatmapStatus(data) {
	currentBSSong = {
		song: {
			title: data.songName,
			subtitle: data.songSubName || "",
			artist: data.songAuthorName,
			duration: data.length
		},
		map: {
			characteristic: data.characteristic,
			difficulty: data.difficultyEnum,
			hash: (data.songHash ? data.songHash.toLowerCase() : (data.levelID.toLowerCase() || null)),
			author: data.levelAuthorName,
			bsr: null,
			uploaders: [],
			pack: null
		},
		cover: {
			colors: {
				light: localStorage.getItem("setting_bs_artistColor"),
				dark: localStorage.getItem("setting_bs_artistColor")
			},
			internal: {
				image: `data:image/jpeg;base64,${data.songCover}` || null,
			},
			external: {
				image: null,
				url: null
			}
		},
		colors: {
			left: colorArrayToHex(data.color.saberA),
			right: colorArrayToHex(data.color.saberB)
		},
		status: {
			ranked: false,
			qualified: false,
			curated: false,
			verified: false
		}
	};

	currentHandColors = currentBSSong.colors;
	currentBSState.acc = 0;

	await updateBeatSaberMapData();
}

function parseSiraPerformanceStatus(data) {
	currentBSState.acc = data.relativeScore;
	currentBSState.combo = data.combo;
	currentBSState.elapsed = data.currentSongTime;
	currentBSState.hits = data.hitNotes;
	currentBSState.misses = data.missedNotes;
	currentBSState.score = data.score;
	currentBSState.health = data.energy;

	postToBSEventChannel({
		type: "state",
		data: currentBSState
	});
}

function parseSiraNoteCut(data) {
	if(!data.saberTypeOK) {
		// wrong color bad cut
		return;
	}

	if(!data.finalScore) {
		return;
	}

	let hand;
	if(data.saberType === "SaberA") {
		hand = leftHandTotal;
	} else if(data.saberType === "SaberB") {
		hand = rightHandTotal;
	}

	hand[3]++;
	hand[0] += data.beforeCutScore;
	hand[1] += data.afterCutScore;
	hand[2] += data.cutDistanceScore;

	let averages = currentBSState.averages.left;
	if(data.saberType === "SaberB") {
		averages = currentBSState.averages.right;
	}

	if(hand[3]) {
		postToBSEventChannel({
			type: "hand",
			data: (data.saberType === "SaberA" ? "left" : "right")
		});

		// do NOT divide by zero
		averages[0] = hand[0] / hand[3];
		averages[1] = hand[1] / hand[3];
		averages[2] = hand[2] / hand[3];
	}

	postToBSEventChannel({
		type: "state",
		data: currentBSState
	});
}

function setGameSceneSira(scene) {
	currentBSState.scene = (scene === "Song" ? "Playing" : "Menu");

	if(oldScene !== currentBSState.scene) {
		oldHash = null;
		postToBSEventChannel({
			type: "scene",
			data: currentBSState.scene
		});
	} else {
		return;
	}
	oldScene = currentBSState.scene;
}

function setGameStateSira(pauseTimestamp) {
	if(pauseTimestamp) {
		if(currentBSState.scene === "Playing") {
			currentBSState.state = "paused";
		}
	} else {
		if(currentBSState.scene === "Playing") {
			currentBSState.state = "playing";
		} else {
			currentBSState.state = "stopped";
		}
	}
}

const siraStatusFunctions = {
	hello: function(data) {
		console.log(`Connected to Beat Saber v${data.game.gameVersion} (HttpSiraStatus v${data.game.pluginVersion})`);
		changeStatusCircle("BSSiraStatusStatus", "green", `connected (v${data.game.gameVersion.split("_")[0]}, mod v${data.game.pluginVersion})`);

		if("beatmap" in data) {
			setGameSceneSira(data.game.scene);
			if(data.beatmap) {
				setGameStateSira(data.beatmap.paused);
				parseSiraBeatmapStatus(data.beatmap);
			}
		}
		if("performance" in data) { 
			if(data.performance) {
				parseSiraPerformanceStatus(data.performance);
			}
		}
	},

	songStart: function(data) {
		setGameSceneSira("Song");

		if("beatmap" in data) {
			parseSiraBeatmapStatus(data.beatmap);
			setGameStateSira(data.beatmap.paused);
		}
	},

	noteFullyCut: function(data) {
		parseSiraNoteCut(data);
	},

	scoreChanged: function(data) {
		if("performance" in data) { parseSiraPerformanceStatus(data.performance); }
	},

	noteMissed: function(data) {
		if("performance" in data) { parseSiraPerformanceStatus(data.performance); }
	},

	bombCut: function(data) {
		if("performance" in data) { parseSiraPerformanceStatus(data.performance); }
	},

	obstacleEnter: function(data) {
		if("performance" in data) { parseSiraPerformanceStatus(data.performance); }
	},

	obstacleExit: function(data) {
		if("performance" in data) { parseSiraPerformanceStatus(data.performance); }
	},

	pause: function(data) {
		setGameStateSira(data.beatmap.paused);

		postToBSEventChannel({
			type: "state",
			data: currentBSState
		});
	},

	resume: function(data) {
		setGameStateSira(data.beatmap.paused);

		postToBSEventChannel({
			type: "state",
			data: currentBSState
		});
	}
}

function startSiraStatusWebsocket() {
	if(siraStatusInit) {
		return;
	}

	if(localStorage.getItem("setting_beatSaberDataMod") !== "sirastatus") {
		return;
	}

	changeStatusCircle("BSSiraStatusStatus", "red", "disconnected");

	siraStatusInit = true;

	console.log("Starting connection to SiraStatus...");
	let url = `ws://127.0.0.1:${localStorage.getItem("setting_sirastatus_port")}/socket`;

	siraStatus_ws = new WebSocket(url);
	siraStatus_ws.hasSeenFirstMessage = false;

	siraStatus_ws.addEventListener("message", function(msg) {
		var data = JSON.parse(msg.data);

		if(data.event === "beatmapEvent") {
			return;
		}

		if(!siraStatus_ws.hasSeenFirstMessage) {
			siraStatus_ws.hasSeenFirstMessage = true;
			changeStatusCircle("BSSiraStatusStatus", "green", "connected");
		}
		
		if(data.event in siraStatusFunctions) {
			if(data.event === "noteCut") {
				siraStatusFunctions[data.event](data.noteCut);
			} else {
				siraStatusFunctions[data.event](data.status);
			}
		}
	});

	siraStatus_ws.addEventListener("open", function() {
		console.log(`Connected to SiraStatus websocket at ${url}`);
		changeStatusCircle("BSSiraStatusStatus", "green", "connected");

		addNotification("Connected to SiraStatus", {bgColor: "var(--notif-color-success)", duration: 5});
	});

	siraStatus_ws.addEventListener("close", function() {
		siraStatusInit = false;

		console.log(`Connection to SiraStatus websocket ${url} failed, retrying in 20 seconds...`);
		changeStatusCircle("BSSiraStatusStatus", "red", "disconnected");

		clearTimeout(siraStatusTimeout);
		siraStatusTimeout = setTimeout(startSiraStatusWebsocket, 20000);

		addNotification("Disconnected from SiraStatus", {bgColor: "var(--notif-color-fail)", duration: 5});

		delete siraStatus_ws;
	});
}