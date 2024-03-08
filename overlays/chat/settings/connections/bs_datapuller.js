var dataPullerInit_MapInfo = false;
var datapuller_ws_MapInfo;
var dataPullerTimeout_MapInfo;
var oldScene;
function startDataPullerMapInfoWebsocket() {
	if(dataPullerInit_MapInfo) {
		return;
	}

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
			oldHash = null;
			postToBSEventChannel({
				type: "scene",
				data: currentBSState.scene
			});
		} else {
			return;
		}
		oldScene = currentBSState.scene;

		if(!data.InLevel) { return; }

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
				hash: (data.Hash ? data.Hash.toLowerCase() : (data.LevelID.toLowerCase() || null)),
				author: data.Mapper,
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
					image: data.CoverImage || null,
				},
				external: {
					image: null,
					url: data.CoverImage
				}
			}
		};

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
function startDataPullerLiveDataWebsocket() {
	if(dataPullerInit_LiveData) {
		return;
	}

	dataPullerInit_LiveData = true;

	console.log("Starting connection to DataPuller...");
	let url = `ws://127.0.0.1:${localStorage.getItem("setting_datapuller_port")}/BSDataPuller/LiveData`;

	datapuller_ws_LiveData = new WebSocket(url);

	datapuller_ws_LiveData.addEventListener("message", function(msg) {
		var data = JSON.parse(msg.data);

		console.log(data);

		currentBSState.acc = data.Accuracy / 100;
		currentBSState.combo = data.Combo;
		currentBSState.elapsed = data.TimeElapsed;
		currentBSState.hits = (data.FullCombo ? data.Combo : data.NotesSpawned - data.Misses);
		currentBSState.misses = data.Misses;
		currentBSState.scene = (currentBSState.state === "playing" ? "Playing" : "Menu");
		currentBSState.score = data.Score;

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