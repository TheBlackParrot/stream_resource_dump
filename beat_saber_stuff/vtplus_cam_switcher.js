const bsplus_IP = "127.0.0.1";
const bsplus_Port = 2947;
const vtplus_IP = "127.0.0.1";
const vtplus_Port = 4430;

const PlayingCamera = 2;
const MenuCamera = 1;

const ws = require("ws")

var currentScene = "Menu";

const bsplus = new ws.WebSocket(`ws://${bsplus_IP}:${bsplus_Port}/socket`);
bsplus.on("open", function() {
	console.log("Connected to BS+...");
});

bsplus.on('message', function(data) {
	//console.log(`received: ${data}`);
	let parsed = JSON.parse(data);
	if(parsed._type === "event") {
		if(parsed._event === "gameState") {
			if(currentScene === parsed.gameStateChanged) {
				return;
			} else {
				currentScene = parsed.gameStateChanged;
				console.log(`Scene changed to ${currentScene}`);

				triggerChange();
			}
		}
	}
});

const vtplus = new ws.WebSocket(`ws://${vtplus_IP}:${vtplus_Port}/vtplus`);
vtplus.on("open", function() {
	console.log("Connected to VT+...");
	vtplus.send(`VTP_Camera:${MenuCamera}`);
});

vtplus.on('message', function(data) {
	console.log(`received VT+: ${data}`);
});

function triggerChange() {
	var cam;

	switch(currentScene) {
		case "Playing":
			cam = PlayingCamera;
			break;

		case "Menu":
			cam = MenuCamera;
			break;
	}

	if(cam) {
		vtplus.send(`VTP_Camera:${cam}`);
	}
}