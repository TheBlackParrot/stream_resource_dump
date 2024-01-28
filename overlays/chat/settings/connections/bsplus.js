const bsplusEventChannel = new BroadcastChannel("bsplus");
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

function postToBSPlusEventChannel(data) {
	console.log(data);
	if(data) {
		bsplusEventChannel.postMessage(data);
	}
}

const BSPlusMessageHandlers = {
	"mapInfo": async function(data) {
		_bs_hits = 0;
		_bs_oldCombo = 0;

		currentBSSong = data.mapInfoChanged;
		currentBSSong.hash = currentBSSong.level_id.replace("custom_level_", "");
		currentBSSong.coverColors = {
			light: localStorage.getItem("setting_bs_artistColor"),
			dark: localStorage.getItem("setting_bs_artistColor")
		};

		if(currentBSSong.hash.indexOf("wip") === -1 && currentBSSong.hash.length === 40) {
			let cacheData = sessionStorage.getItem(`_bs_cache_${currentBSSong.hash}`);
			let bsData = null;

			if(cacheData !== null) {
				bsData = JSON.parse(cacheData);
			} else {
				let response = await fetch(`https://api.beatsaver.com/maps/hash/${currentBSSong.hash}`);
				if(response.ok) {
					bsData = await response.json();
					sessionStorage.setItem(`_bs_cache_${currentBSSong.hash}`, JSON.stringify(bsData));
				}
			}

			if(bsData !== null) {
				console.log(bsData);
				currentBSSong.BSRKey = bsData.id;
				currentBSSong.uploader = bsData.uploader;
				currentBSSong.remoteCover = bsData.versions[0].coverURL;
			}

			let art;
			let swatches;
			if(localStorage.getItem("setting_bs_useRemoteArtURL") === "true") {
				art = currentBSSong.remoteCover;
				swatches = await Vibrant.from(art).getSwatches();
			} else {
				art = currentBSSong.coverRaw
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
			currentBSSong.coverColors.dark = `#${colors.dark[0].map(function(x) { return Math.floor(x).toString(16).padStart(2, "0"); }).join("")}`;
			currentBSSong.coverColors.light = `#${colors.light[0].map(function(x) { return Math.floor(x).toString(16).padStart(2, "0"); }).join("")}`;
		}

		postToBSPlusEventChannel({
			type: "map",
			data: currentBSSong
		});
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

		postToBSPlusEventChannel({
			type: "state",
			data: currentBSState
		});
	},

	"pause": function(data) {
		currentBSState.state = "paused";
		currentBSState.elapsed = data.pauseTime;
		currentBSState.timestamp = Date.now();

		postToBSPlusEventChannel({
			type: "state",
			data: currentBSState
		});
	},

	"resume": function(data) {
		currentBSState.state = "playing";
		currentBSState.elapsed = data.resumeTime;
		currentBSState.timestamp = Date.now();

		postToBSPlusEventChannel({
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

		postToBSPlusEventChannel({
			type: "state",
			data: currentBSState
		});

		postToBSPlusEventChannel({
			type: "scene",
			data: currentBSState.scene
		});
	}
}

var bsplusInit = false;
var bsplus_ws;
var stateInterval;
function startBSPlusWebsocket() {
	if(bsplusInit) {
		return;
	}

	bsplusInit = true;

	console.log("Starting connection to BS+...");
	let url = `ws://${localStorage.getItem("setting_bsplus_ip")}:${localStorage.getItem("setting_bsplus_port")}/socket`;

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

					postToBSPlusEventChannel({
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
				postToBSPlusEventChannel({
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
		setTimeout(startBSPlusWebsocket, 20000);

		addNotification("Disconnected from Beat Saber Plus", {bgColor: "var(--notif-color-fail)", duration: 5});

		delete bsplus_ws;
	});
}