const ws = require("ws");
const OBSWebSocket = require('obs-websocket-js').default;
const settings = require("./settings.json");

var currentScene = "Menu";
var oldMiss = Infinity;
var oldHealth = 0;
var oldComboMod = 0;
var isPaused = false;

var eventFuncs = {
	"gameState": function(data) {
		if(currentScene === data.gameStateChanged) {
			return;
		} else {
			if(oldHealth > 0 && !isPaused && data.gameStateChanged === "Menu") {
				setTimeout(function() {
					vnyan.send("Passed");
				}, 100);
			}

			currentScene = data.gameStateChanged;
			oldMiss = Infinity;
			oldHealth = 0;
		}		
	},

	"score": function(data) {
		let scoreData = data.scoreEvent;

		if(scoreData.combo && oldComboMod > scoreData.combo % settings.bsplus.expressOnCombo && scoreData.missCount === oldMiss) {
			vnyan.send("Joy");
		}
		oldComboMod = scoreData.combo % settings.bsplus.expressOnCombo;

		if(!isNaN(scoreData.score)) {
			if(scoreData.missCount > oldMiss && scoreData.currentHealth > 0) {
				vnyan.send("Angry");
				vnyan.send(`Miss${scoreData.missCount - oldMiss}`);
			}
			oldMiss = scoreData.missCount;
		}

		oldHealth = scoreData.currentHealth;
		isPaused = false;
	},

	"pause": function(data) {
		vnyan.send("Paused");
		isPaused = true;
	},

	"resume": function(data) {
		vnyan.send("Resumed");
		isPaused = false;
	},

	"mapInfo": function(data) {
		isPaused = false;
	}
};

async function onSceneTransitionStarted(event) {
	var currentScene = await obs.call('GetCurrentProgramScene');
	var cam;
	console.log(currentScene.currentProgramSceneName);

	switch(currentScene.currentProgramSceneName) {
		case settings.obs.scenes.playing:
			console.log("playing camera");
			cam = "Playing";
			break;

		case settings.obs.scenes.menu:
			console.log("menu camera");
			cam = "Menu";
			oldHealth = 0;
			break;

		case settings.obs.scenes.intermission:
			console.log("intermission camera");
			cam = "Intermission";
			break;			
	}

	if(cam) {
		setTimeout(function() {
			vnyan.send(`${cam}Cam`);
		}, settings.vnyan.camSwitchDelay);
	}
}

var vnyan_reconTO = null;
function vnyan_recon() {
	if(vnyan_reconTO) { 
		return;
	}

	console.log("Connection to VNyan failed, reconnecting in 15 seconds...");
	vnyan_reconTO = setTimeout(startVNyanConnection, 15000);
}

var vnyan;
function startVNyanConnection() {
	vnyan_reconTO = null;
	vnyan = new ws.WebSocket(`ws://${settings.vnyan.ip}:${settings.vnyan.port}/vnyan`);

	vnyan.on("open", function() {
		console.log("Connected to VNyan...");
	});

	vnyan.on('close', vnyan_recon);
	vnyan.on('error', vnyan_recon);
}
try { 
	startVNyanConnection();
} catch(err) {
	console.error(err);
}

var bsplus_reconTO = null;
function bsplus_recon() {
	if(bsplus_reconTO) { 
		return;
	}

	console.log("Connection to BS+ failed, reconnecting in 15 seconds...");
	bsplus_reconTO = setTimeout(startBSPlusConnection, 15000);
}

var bsplus;
function startBSPlusConnection() {
	bsplus_reconTO = null;
	bsplus = new ws.WebSocket(`ws://${settings.bsplus.ip}:${settings.bsplus.port}/socket`);

	bsplus.on("open", function() {
		console.log("Connected to BS+...");
	});

	bsplus.on('message', function(data) {
		let parsed = JSON.parse(data);

		if(parsed._type === "event") {
			if(parsed._event in eventFuncs) {
				eventFuncs[parsed._event](parsed);
			}
		}
	});

	bsplus.on('close', bsplus_recon);
	bsplus.on('error', bsplus_recon);
}
try { 
	startBSPlusConnection();
} catch(err) {
	console.error(err);
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
		console.log(`Connected to server ${obsWebSocketVersion} (using RPC ${negotiatedRpcVersion})`);
	} catch(error) {
		console.error('Failed to connect', error.code, error.message);
		console.log("Trying again in 15 seconds...");
		setTimeout(connectOBS, 15000);
	}
}
connectOBS();
obs.on('SceneTransitionStarted', onSceneTransitionStarted);