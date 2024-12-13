import { writeFile, copyFile } from 'node:fs/promises';
import * as ws from "ws";
import { OBSWebSocket } from 'obs-websocket-js';
import * as say from "say";
import * as settingsData from "./settings.json" with { type: "json" };
const settings = settingsData.default;

var dataPullerConnections = {
	MapData: null,
	LiveData: null
};

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

var oldHash;
var oldSubmittedHash;
var oldKey;
var oldAcc = 0;
var oldTimePlayedID = 0;
async function handleMapDataMessage(data) {
	const oldScene = state.scene.substr(0);
	state.scene = (data.InLevel ? "playing" : "menu");

	const hashChanged = (data.Hash !== oldHash);
	const olderHash = (oldHash ? oldHash.substr(0) : false);
	oldHash = data.Hash;

	let keyChanged = false;
	if(data.BSRKey) {
		if(data.BSRKey !== oldKey) {
			keyChanged = true;
		}
	}
	if(data.LevelID) {
		if(data.LevelID !== oldKey) {
			keyChanged = true;
		}		
	}
	oldKey = (data.BSRKey ? data.BSRKey : data.LevelID);

	const sceneChanged = (state.scene !== oldScene);

	const oldPaused = (state.paused === true);
	state.paused = (data.LevelPaused && data.InLevel);

	if(data.LevelFinished && !data.LevelQuit && !data.InLevel) {
		log(`MAP ${data.LevelFailed ? "FAILED" : "PASSED"}`);

		if(data.LevelFailed) {
			sendVNyanData("Failed");
		} else {
			oldSubmittedHash = null;
			sendVNyanData("Passed");
		}
	}

	if(oldPaused !== state.paused) {
		log(state.paused ? "PAUSED" : "RESUMED");

		sendVNyanData(state.paused ? "Paused" : "Resumed");
		sendWarudoData({"action": "Paused", "data": state.paused});
	}

	if(sceneChanged && ((data.LevelQuit || data.LevelFinished) || (!data.LevelQuit && !data.LevelFinished && data.InLevel))) {
		console.log(`${data.BSRKey ? `[${data.BSRKey}] ` : ""}[${data.InLevel ? "START" : "END"}] ${data.SongAuthor ? `${data.SongAuthor} - ` : ""}${data.SongName}${data.SongSubName ? ` - ${data.SongSubName}` : ""}${data.Mapper ? ` (${data.Mapper})` : ""}`);
		await changeScene(settings.obs.scenes[state.scene]);

		if(!data.InLevel && settings.remotequeue.enabled) {
			const queueResponse = await fetch(`${settings.remotequeue.URL}/getEntireQueue.php`, {
				method: "GET",
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				}
			});
			if(!queueResponse.ok) {
				log(`FAILED TO GET CURRENT REQUEST QUEUE`, true);
			}

			const queueResponseJSON = await queueResponse.json();

			let sayWords = settings.remotequeue.tts.say.formatString.split(" ");
			const isPlural = (queueResponseJSON.songs.length !== 1 ? 1 : 0);
			for(let idx in sayWords) {
				let word = sayWords[idx];
				switch(word) {
					case "(irreg)":
						sayWords[idx] = settings.remotequeue.tts.say.replacers.irreg[isPlural];
						break;

					case "(word)":
						sayWords[idx] = settings.remotequeue.tts.say.replacers.word[isPlural];
						break;

					case "###":
						sayWords[idx] = queueResponseJSON.songs.length;
						break;
				}
			}

			let ttsIsActive = true;
			if(settings.remotequeue.remainSilentOnEmptyQueue && !queueResponseJSON.songs.length) {
				ttsIsActive = false;
			}
			if(ttsIsActive) {
				log(`TTS: "${sayWords.join(" ")}"`);
				say.default.speak(sayWords.join(" "), settings.remotequeue.tts.voice, settings.remotequeue.tts.speed);
			}
		}

		if(settings.remotesession.enabled && !data.InLevel && !data.LevelQuit && olderHash) {
			console.log(olderHash, oldAcc);
			const accUpdateResponse = await fetch(`${settings.remotesession.URL}/updateAccuracy.php`, {
				method: "POST",
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					'accessKey': settings.remotesession.accessKey,
					'hash': olderHash,
					'accuracy': oldAcc
				})
			});
			if(!accUpdateResponse.ok) {
				log(`FAILED TO UPDATE PREVIOUS MAP'S ACCURACY VALUE, BAD RESPONSE`, true);
			}

			const accUpdateResponseJSON = await accUpdateResponse.json();

			if(accUpdateResponseJSON.OK) {
				log("UPDATED PREVIOUS MAP'S ACCURACY VALUE");
			}
		}

		if(settings.remotesession.enabled && data.InLevel) {
			let doSubmission = true;
			if(!settings.remotesession.submitOnRestart) {
				if(data.Hash === oldSubmittedHash) {
					doSubmission = false;
				}
			}

			if(doSubmission) {
				const response = await fetch(`${settings.remotesession.URL}/addToSession.php`, {
					method: "POST",
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						'accessKey': settings.remotesession.accessKey,
						'hash': data.Hash
					})
				});
				if(!response.ok) {
					log(`FAILED TO ADD MAP TO SESSION TRACKING, BAD RESPONSE`, true);
				}

				const responseJSON = await response.json();

				if(responseJSON.OK) {
					log("ADDED MAP TO SESSION TRACKING");
					oldTimePlayedID = responseJSON.timePlayedValue;
					oldSubmittedHash = data.Hash;
				}
			}
		}
	}

	if(settings.mapdetails.enabled) {
		if(keyChanged) {
			try {
				if(settings.mapdetails.writePreviousMap) {
					try {
						await copyFile(settings.mapdetails.path, settings.mapdetails.previousPath);
					} catch(err) {
						log(`FAILED TO COPY PREVIOUS MAP DETAILS FROM ${settings.mapdetails.path} TO ${settings.mapdetails.previousPath}`, true);
						console.error(err);
					} finally {
						log(`COPIED PREVIOUS MAP DETAILS TO ${settings.mapdetails.previousPath}`);
					}
				}

				await writeFile(settings.mapdetails.path, JSON.stringify(data, null, "\t"));
			} catch(err) {
				log(`FAILED TO WRITE MAP DETAILS TO ${settings.mapdetails.path}`, true);
				console.error(err);
			} finally {
				log(`WROTE MAP DETAILS TO ${settings.mapdetails.path}`);
			}
		}
	}
}

function handleLiveDataMessage(data) {
	if(data.Combo && state.comboMod > data.Combo % settings.datapuller.expressOnCombo && data.Misses === state.misses) {
		log(`COMBO HIT: ${data.Combo} (every ${settings.datapuller.expressOnCombo})`);
		sendVNyanData("Joy");
	}
	state.comboMod = data.Combo % settings.datapuller.expressOnCombo;

	if(data.Misses > state.misses && (data.PlayerHealth > 0 || !settings.vnyan.stopMissEventsIfDead)) {
		log(`MISSED: ${data.Misses - state.misses}`);
		sendVNyanData("Angry");
		sendVNyanData(`Miss${data.Misses - state.misses}`);
	}

	state.misses = data.Misses;
	state.health = data.currentHealth;

	oldAcc = data.Accuracy;
}

var dataPullerMapDataConnection_reconTO = null;
function dataPullerMapDataConnection_recon() {
	if(dataPullerMapDataConnection_reconTO) { 
		return;
	}

	delete dataPullerConnections.MapData;
	log("Connection to DataPuller (MapData) failed, reconnecting in 15 seconds", true);
	dataPullerMapDataConnection_reconTO = setTimeout(startDataPullerMapDataConnection, 15000);
}

function startDataPullerMapDataConnection() {
	dataPullerMapDataConnection_reconTO = null;
	dataPullerConnections.MapData = new ws.WebSocket(`ws://${settings.datapuller.ip}:${settings.datapuller.port}/BSDataPuller/MapData`);

	dataPullerConnections.MapData.on("open", function() {
		log("Connected to DataPuller (MapData)");
	});

	dataPullerConnections.MapData.on('message', async function(raw) {
		let data = JSON.parse(raw);
		if("CoverImage" in data) {
			delete data.CoverImage;
		}

		if(settings.datapuller.debug.MapData) {
			console.log(data);
		}

		await handleMapDataMessage(data);
	});

	dataPullerConnections.MapData.on('close', dataPullerMapDataConnection_recon);
	dataPullerConnections.MapData.on('error', dataPullerMapDataConnection_recon);
}

var dataPullerLiveDataConnection_reconTO = null;
function dataPullerLiveDataConnection_recon() {
	if(dataPullerLiveDataConnection_reconTO) { 
		return;
	}

	delete dataPullerConnections.LiveData;
	log("Connection to DataPuller (LiveData) failed, reconnecting in 15 seconds", true);
	dataPullerLiveDataConnection_reconTO = setTimeout(startDataPullerLiveDataConnection, 15000);
}

function startDataPullerLiveDataConnection() {
	dataPullerLiveDataConnection_reconTO = null;
	dataPullerConnections.LiveData = new ws.WebSocket(`ws://${settings.datapuller.ip}:${settings.datapuller.port}/BSDataPuller/LiveData`);

	dataPullerConnections.LiveData.on("open", function() {
		log("Connected to DataPuller (LiveData)");
	});

	dataPullerConnections.LiveData.on('message', async function(raw) {
		let data = JSON.parse(raw);
		if(settings.datapuller.debug.LiveData) {
			console.log(data);
		}

		handleLiveDataMessage(data);
	});

	dataPullerConnections.LiveData.on('close', dataPullerLiveDataConnection_recon);
	dataPullerConnections.LiveData.on('error', dataPullerLiveDataConnection_recon);
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