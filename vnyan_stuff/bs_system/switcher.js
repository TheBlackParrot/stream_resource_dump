const ws = require("ws");
const OBSWebSocket = require('obs-websocket-js').default;
const settings = require("./settings.json");

var state = {
	paused: false,
	scene: "menu",
	misses: Infinity,
	health: 0,
	comboMod: 0
};

function log(message, error) {
	if(settings.main.debug) {
		console.log(`${error ? "!!" : "=="} ${message}`);
	}
}

function sendWarudoData(data) {
	if(settings.warudo.enabled) {
		warudo.send(JSON.stringify(data));
	}
}

function sendVNyanData(data) {
	if(settings.vnyan.enabled) {
		vnyan.send(data);
	}
}

async function changeScene(scene) {
	log(`CHANGE SCENE: ${scene}`);

	if(settings.obs.enabled) {
		try {
			await obs.call("SetCurrentProgramScene", {sceneName: scene});
		} catch(err) {
			console.error(err);
		}
	}

	if(scene === "playing") {
		sendWarudoData({"action": "Paused", "data": false});
	}
}

async function handleMapDataMessage(data) {
	const oldScene = state.scene.substr(0);
	state.scene = (data.InLevel ? "playing" : "menu");

	if(state.scene !== oldScene) {
		console.log(`${data.BSRKey ? `[${data.BSRKey}] ` : ""}[${data.InLevel ? "START" : "END"}] ${data.SongAuthor ? `${data.SongAuthor} - ` : ""}${data.SongName}${data.SongSubName ? ` - ${data.SongSubName}` : ""}${data.Mapper ? ` (${data.Mapper})` : ""}`);
		await changeScene(settings.obs.scenes[state.scene]);
	}

	if(data.LevelFinished && !data.LevelQuit && !data.InLevel) {
		log(`MAP ${data.LevelFailed ? "FAILED" : "PASSED"}`);

		if(data.LevelFailed) {
			sendVNyanData("Failed");
		} else {
			sendVNyanData("Passed");
		}
	}

	const oldPaused = (state.paused === true);
	state.paused = (data.LevelPaused && data.InLevel);

	if(oldPaused !== state.paused) {
		log(state.paused ? "PAUSED" : "RESUMED");

		sendVNyanData(state.paused ? "Paused" : "Resumed");
		sendWarudoData({"action": "Paused", "data": state.paused});
	}
}

function handleLiveDataMessage(data) {
	if(data.Combo && state.comboMod > data.Combo % settings.datapuller.expressOnCombo && data.Misses === state.misses) {
		log(`COMBO HIT: ${data.Combo} (every ${settings.datapuller.expressOnCombo})`);
		sendVNyanData("Joy");
	}
	state.comboMod = data.Combo % settings.datapuller.expressOnCombo;

	if(data.Misses > state.misses && data.PlayerHealth > 0) {
		log(`MISSED: ${data.Misses - state.misses}`);
		sendVNyanData("Angry");
		sendVNyanData(`Miss${data.Misses - state.misses}`);
	}

	state.misses = data.Misses;
	state.health = data.currentHealth;
}

var dataPullerMapDataConnection;
var dataPullerMapDataConnection_reconTO = null;
function dataPullerMapDataConnection_recon() {
	if(dataPullerMapDataConnection_reconTO) { 
		return;
	}

	delete dataPullerMapDataConnection;
	log("Connection to DataPuller (MapData) failed, reconnecting in 15 seconds", true);
	dataPullerMapDataConnection_reconTO = setTimeout(startDataPullerMapDataConnection, 15000);
}

function startDataPullerMapDataConnection() {
	dataPullerMapDataConnection_reconTO = null;
	dataPullerMapDataConnection = new ws.WebSocket(`ws://${settings.datapuller.ip}:${settings.datapuller.port}/BSDataPuller/MapData`);

	dataPullerMapDataConnection.on("open", function() {
		log("Connected to DataPuller (MapData)");
	});

	dataPullerMapDataConnection.on('message', async function(raw) {
		let data = JSON.parse(raw);
		if(settings.datapuller.debug.MapData) {
			console.log(data);
		}

		await handleMapDataMessage(data);
	});

	dataPullerMapDataConnection.on('close', dataPullerMapDataConnection_recon);
	dataPullerMapDataConnection.on('error', dataPullerMapDataConnection_recon);
}

var dataPullerLiveDataConnection;
var dataPullerLiveDataConnection_reconTO = null;
function dataPullerLiveDataConnection_recon() {
	if(dataPullerLiveDataConnection_reconTO) { 
		return;
	}

	delete dataPullerLiveDataConnection;
	log("Connection to DataPuller (LiveData) failed, reconnecting in 15 seconds", true);
	dataPullerLiveDataConnection_reconTO = setTimeout(startDataPullerLiveDataConnection, 15000);
}

function startDataPullerLiveDataConnection() {
	dataPullerLiveDataConnection_reconTO = null;
	dataPullerLiveDataConnection = new ws.WebSocket(`ws://${settings.datapuller.ip}:${settings.datapuller.port}/BSDataPuller/LiveData`);

	dataPullerLiveDataConnection.on("open", function() {
		log("Connected to DataPuller (LiveData)");
	});

	dataPullerLiveDataConnection.on('message', async function(raw) {
		let data = JSON.parse(raw);
		if(settings.datapuller.debug.LiveData) {
			console.log(data);
		}

		handleLiveDataMessage(data);
	});

	dataPullerLiveDataConnection.on('close', dataPullerLiveDataConnection_recon);
	dataPullerLiveDataConnection.on('error', dataPullerLiveDataConnection_recon);
}

try { 
	startDataPullerMapDataConnection();
} catch(err) {
	console.error(err);
}
try { 
	startDataPullerLiveDataConnection();
} catch(err) {
	console.error(err);
}

var vnyan_reconTO = null;
function vnyan_recon() {
	if(vnyan_reconTO) { 
		return;
	}

	log("Connection to VNyan failed, reconnecting in 15 seconds", true);
	vnyan_reconTO = setTimeout(startVNyanConnection, 15000);
}

var vnyan;
function startVNyanConnection() {
	vnyan_reconTO = null;
	vnyan = new ws.WebSocket(`ws://${settings.vnyan.ip}:${settings.vnyan.port}/vnyan`);

	vnyan.on("open", function() {
		log("Connected to VNyan");
	});

	vnyan.on('close', vnyan_recon);
	vnyan.on('error', vnyan_recon);
}
try {
	if(settings.vnyan.enabled) {
		startVNyanConnection();
	}
} catch(err) {
	console.error(err);
}

var warudo_reconTO = null;
function warudo_recon() {
	if(warudo_reconTO) { 
		return;
	}

	log("Connection to warudo failed, reconnecting in 15 seconds", true);
	warudo_reconTO = setTimeout(startWarudoConnection, 15000);
}

var warudo;
function startWarudoConnection() {
	warudo_reconTO = null;
	warudo = new ws.WebSocket(`ws://${settings.warudo.ip}:${settings.warudo.port}`);

	warudo.on("open", function() {
		log("Connected to Warudo");
	});

	warudo.on('close', warudo_recon);
	warudo.on('error', warudo_recon);
}
try { 
	if(settings.warudo.enabled) {
		startWarudoConnection();
	}
} catch(err) {
	console.error(err);
}

async function onSceneTransitionStarted(event) {
	const obsSceneObj = await obs.call('GetCurrentProgramScene');
	const obsScene = obsSceneObj.currentProgramSceneName;
	var cam;

	switch(obsScene) {
		case settings.obs.scenes.playing:
			log(`GAMEPLAY CAMERA ACTIVE`);
			cam = "Playing";
			break;

		case settings.obs.scenes.menu:
			log(`MENU CAMERA ACTIVE`);
			cam = "Menu";
			state.health = 0;
			break;

		case settings.obs.scenes.intermission:
			log(`INTERMISSION CAMERA ACTIVE`);
			cam = "Intermission";
			break;			
	}

	if(cam) {
		setTimeout(function() {
			sendVNyanData(`${cam}Cam`);
		}, settings.vnyan.camSwitchDelay);

		sendWarudoData({"action": "Scene", "data": cam});
	}
}

const obs = new OBSWebSocket();
async function connectOBS() {
	try {
		const {
			obsWebSocketVersion,
			negotiatedRpcVersion
		} = await obs.connect(`ws://${settings.obs.ip}:${settings.obs.port}`, settings.obs.password, {
			rpcVersion: 1
		});
		log(`Connected to OBS WebSocket ${obsWebSocketVersion} (using RPC ${negotiatedRpcVersion})`);
	} catch(error) {
		log("Failed to connect to OBS WebSocket", true);
		console.error('Failed to connect', error.code, error.message);
		setTimeout(connectOBS, 15000);
	}
}
if(settings.obs.enabled) {
	connectOBS();
	obs.on('SceneTransitionStarted', onSceneTransitionStarted);
}