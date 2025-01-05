var dataPullerInit_MapInfo = false;
var datapuller_ws_MapInfo;
var dataPullerTimeout_MapInfo;

var dataPullerVersion = [];

function startDataPullerMapInfoWebsocket() {
	if(dataPullerInit_MapInfo) {
		return;
	}

	if(localStorage.getItem("setting_beatSaberDataMod") !== "datapuller") {
		return;
	}

	changeStatusCircle("BSDataPullerMapDataStatus", "red", "MapData disconnected");

	dataPullerInit_MapInfo = true;

	console.log("Starting connection to DataPuller...");
	let url = `ws://127.0.0.1:${localStorage.getItem("setting_datapuller_port")}/BSDataPuller/MapData`;

	datapuller_ws_MapInfo = new WebSocket(url);
	datapuller_ws_MapInfo.hasSeenFirstMessage = false;

	datapuller_ws_MapInfo.addEventListener("message", async function(msg) {
		var data = JSON.parse(msg.data);

		if(!datapuller_ws_MapInfo.hasSeenFirstMessage) {
			datapuller_ws_MapInfo.hasSeenFirstMessage = true;

			console.log(`Connected to Beat Saber v${data.GameVersion} (DataPuller v${data.PluginVersion})`);
			changeStatusCircle("BSDataPullerMapDataStatus", "green", `MapData connected (v${data.GameVersion.split("_")[0]}, mod v${data.PluginVersion})`);

			dataPullerVersion = data.PluginVersion.split(".");

			if(dataPullerVersion[0] >= 2 && dataPullerVersion[1] >= 1 && dataPullerVersion[2] <= 10) {
				setTimeout(function() {
					addNotification(`Combo display will remain stuck at 0 with this version of DataPuller (${data.PluginVersion}), please check DataPuller's GitHub repository (https://github.com/DJDavid98/BSDataPuller) for a version newer than or equal to 2.1.10 to fix this bug.`, {bgColor: "var(--notif-color-warning)", textColor: "#000", duration: 30});
				}, 1000)
			}
		}
		console.log(data);

		if(data.InLevel) {
			currentBSState.state = (data.LevelPaused ? "paused" : "playing");
			currentBSState.scene = "Playing";
		} else {
			currentBSState.state = "stopped";
			currentBSState.scene = "Menu";
		}
		postToBSEventChannel({
			type: "state",
			data: currentBSState
		});
		if(oldScene !== currentBSState.scene) {
			postToBSEventChannel({
				type: "scene",
				data: currentBSState.scene
			});
		} else {
			return;
		}
		oldScene = currentBSState.scene;

		if(!data.InLevel) { return; }

		var hash = (data.Hash ? data.Hash.toLowerCase() : null);
		if(!hash) {
			if("LevelID" in data) {
				hash = data.LevelID.toLowerCase();
			} else {
				hash = data.SongName.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
			}
		}

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
				hash: hash,
				author: data.Mapper,
				bsr: null,
				uploaders: [],
				pack: null,
				modifiers: {
					DA: data.Modifiers.DisappearingArrows,
					FS: data.Modifiers.FasterSong,
					BE: data.Modifiers.FourLives,
					GN: data.Modifiers.GhostNotes,
					NA: data.Modifiers.NoArrows,
					NB: data.Modifiers.NoBombs,
					NF: data.Modifiers.NoFailOn0Energy,
					NO: data.Modifiers.NoWalls,
					IF: data.Modifiers.OneLife,
					PM: data.Modifiers.ProMode,
					SS: data.Modifiers.SlowerSong,
					SC: data.Modifiers.SmallNotes,
					SA: data.Modifiers.StrictAngles,
					SF: data.Modifiers.SuperFastSong
				}
			},
			cover: {
				colors: {
					light: localStorage.getItem("setting_bs_artistColor"),
					dark: localStorage.getItem("setting_bs_artistColor")
				},
				internal: {
					image: data.CoverImage || null,
				},
				external: {
					image: null,
					url: data.CoverImage
				}
			},
			status: {
				ranked: false,
				qualified: false,
				curated: false,
				verified: false
			}
		};

		if(dataPullerVersion[0] >= 2 && dataPullerVersion[1] >= 1 && dataPullerVersion[2] >= 9) {
			currentBSSong.colors = {
				left: data.ColorScheme.SaberAColor.HexCode,
				right: data.ColorScheme.SaberBColor.HexCode				
			}
		}

		await updateBeatSaberMapData();
	});

	datapuller_ws_MapInfo.addEventListener("open", function() {
		console.log(`Connected to DataPuller websocket at ${url}`);
		changeStatusCircle("BSDataPullerMapDataStatus", "green", "MapData connected");

		addNotification("Connected to DataPuller (MapData)", {bgColor: "var(--notif-color-success)", duration: 5});
	});

	datapuller_ws_MapInfo.addEventListener("close", function() {
		dataPullerInit_MapInfo = false;

		console.log(`Connection to DataPuller websocket ${url} failed, retrying in 20 seconds...`);
		changeStatusCircle("BSDataPullerMapDataStatus", "red", "MapData disconnected");

		clearTimeout(dataPullerTimeout_MapInfo);
		dataPullerTimeout_MapInfo = setTimeout(startDataPullerMapInfoWebsocket, 20000);

		addNotification("Disconnected from DataPuller (MapData)", {bgColor: "var(--notif-color-fail)", duration: 5});

		delete datapuller_ws_MapInfo;
	});
}

var dataPullerInit_LiveData = false;
var datapuller_ws_LiveData;
var dataPullerTimeout_LiveData;
const liveDataEventTriggers = {
	Unknown: 0,
	TimerElapsed: 1,
	NoteMissed: 2,
	EnergyChange: 3,
	ScoreChange: 4
};
function startDataPullerLiveDataWebsocket() {
	if(dataPullerInit_LiveData) {
		return;
	}

	if(localStorage.getItem("setting_beatSaberDataMod") !== "datapuller") {
		return;
	}

	changeStatusCircle("BSDataPullerLiveDataStatus", "red", "LiveData disconnected");

	dataPullerInit_LiveData = true;

	console.log("Starting connection to DataPuller...");
	let url = `ws://127.0.0.1:${localStorage.getItem("setting_datapuller_port")}/BSDataPuller/LiveData`;

	datapuller_ws_LiveData = new WebSocket(url);

	datapuller_ws_LiveData.addEventListener("message", function(msg) {
		var data = JSON.parse(msg.data);

		currentBSState.acc = data.Accuracy / 100;
		currentBSState.combo = data.Combo;
		currentBSState.elapsed = data.TimeElapsed;
		currentBSState.hits = (data.FullCombo ? data.Combo : data.NotesSpawned - data.Misses);
		currentBSState.misses = data.Misses;
		currentBSState.scene = (currentBSState.state === "playing" ? "Playing" : "Menu");
		currentBSState.score = data.Score;
		currentBSState.health = data.PlayerHealth / 100;

		if(data.FullCombo) {
			currentBSState.fcacc = currentBSState.acc;
		} else {
			currentBSState.fcacc = data.Score / data.MaxScore;
		}

		if(data.EventTrigger === liveDataEventTriggers.ScoreChange) {
			let hand;
			if(data.ColorType === 0) {
				hand = leftHandTotal;
			} else if(data.ColorType === 1) {
				hand = rightHandTotal;
			}

			if(typeof hand !== "undefined" && data.BlockHitScore.PreSwing && data.BlockHitScore.PostSwing) {
				// i have no way to check for chains, sorry! just swing all the way through lol
				hand[3]++;
				hand[0] += data.BlockHitScore.PreSwing;
				hand[1] += data.BlockHitScore.PostSwing;
				hand[2] += data.BlockHitScore.CenterSwing;

				let averages = currentBSState.averages.left;
				if(data.ColorType === 1) {
					averages = currentBSState.averages.right;
				}

				if(hand[3]) {
					postToBSEventChannel({
						type: "hand",
						data: (data.ColorType ? "right" : "left")
					});

					// do NOT divide by zero
					averages[0] = hand[0] / hand[3];
					averages[1] = hand[1] / hand[3];
					averages[2] = hand[2] / hand[3];
				}
			}
		}

		postToBSEventChannel({
			type: "state",
			data: currentBSState
		});
	});

	datapuller_ws_LiveData.addEventListener("open", function() {
		console.log(`Connected to DataPuller websocket at ${url}`);
		changeStatusCircle("BSDataPullerLiveDataStatus", "green", "LiveData connected");

		addNotification("Connected to DataPuller (LiveData)", {bgColor: "var(--notif-color-success)", duration: 5});
	});

	datapuller_ws_LiveData.addEventListener("close", function() {
		dataPullerInit_LiveData = false;

		console.log(`Connection to DataPuller websocket ${url} failed, retrying in 20 seconds...`);
		changeStatusCircle("BSDataPullerLiveDataStatus", "red", "LiveData disconnected");

		clearTimeout(dataPullerTimeout_LiveData);
		dataPullerTimeout_LiveData = setTimeout(startDataPullerLiveDataWebsocket, 20000);

		addNotification("Disconnected from DataPuller (LiveData)", {bgColor: "var(--notif-color-fail)", duration: 5});

		delete datapuller_ws_LiveData;
	});
}