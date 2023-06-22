const WebSocketServer = require('ws');
var BleHR = require('heartrate');
const settings = require("./settings.json");

const wss = new WebSocketServer.Server(settings.listen);

var wsClients = [];
var reconnectTimeout;
var currentBattery = -1;
var currentHeartRate = 0;

function sendData(data) {
	data = parseInt(data.toString());
	currentHeartRate = data;

	if(settings.vnyan.enabled) {
		try {
			vnyan.send(`HeartRate${data}`);
		} catch(err) {
			// do nothing
		}
	}

	for(let wsIdx in wsClients) {
		let client = wsClients[wsIdx];
		client.send(JSON.stringify({
			heartrate: data,
			ts: Date.now(),
			battery: currentBattery
		}));
	}
}

function broadcastData(data) {
	for(let wsIdx in wsClients) {
		let client = wsClients[wsIdx];
		client.send(JSON.stringify(data));
	}	
}

var disconnected = true;
function startReconnectStuff(stream) {
	clearTimeout(reconnectTimeout);
	reconnectTimeout = setTimeout(function() {
		console.log("assuming connection has been lost, trying again...");
		if(!disconnected) {
			broadcastData({event: "disconnected"});
			disconnected = true;
		}

		if(typeof stream !== "undefined") {
			// ha ha i do a no-no ha ha. calling internal functions ha ha hee hee hoo hoo
			stream._source.initDevice();
		}
		startReconnectStuff(stream);
	}, settings.device.timeout * 1000);
}

function startConnection() {
	console.log("starting connection to device...");
	let stream = new BleHR(settings.device.uuid);

	stream.on("data", function(data) {
		sendData(data);
		startReconnectStuff(stream);
	});

	stream.getBatteryLevel(function(){}); // do nothing, this should be handled in the event
	stream.on("batteryLevel", function(level) {
		console.log(`device has ${level}% battery remaining\r\n`);
		currentBattery = level;

		if(disconnected) {
			broadcastData({event: "connected"});
			disconnected = false;
		}
	});

	startReconnectStuff(stream);
}

if(settings.device.uuid === "") {
	let xd = "-------------------------------------------------------------------------";

	console.log(xd);
	console.log("---| FIND YOUR DEVICE IN THIS LIST AND SET ITS UUID IN settings.json |---");
	console.log(xd);
	console.log("");
	BleHR.list.print();

	setTimeout(function() {
		console.log("");
		console.log(xd);
		process.exit();
	}, 10000);
} else {
	startConnection();
}

wss.on("connection", function(client, req) {
	client.ip = req.socket.remoteAddress;

	console.log(`${client.ip} connected\r\n`);
	wsClients.push(client);

	client.send(JSON.stringify({
		heartrate: currentHeartRate,
		ts: Date.now(),
		battery: currentBattery,
		inital: true
	}));

	client.send(JSON.stringify({
		event: (disconnected ? "disconnected" : "connected")
	}));
 
	client.on("close", function() {
		console.log(`${client.ip} disconnected\r\n`);
		wsClients.splice(wsClients.indexOf(client), 1);
	});

	client.onerror = function() {
		console.log(`${client.ip} did something it probably shouldn't have. wtf\r\n`);
	}
});


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

	vnyan = new WebSocketServer.WebSocket(`ws://${settings.vnyan.host}:${settings.vnyan.port}/vnyan`);

	vnyan.on("open", function() {
		console.log("Connected to VNyan...");
	});

	vnyan.on('close', vnyan_recon);
	vnyan.on('error', vnyan_recon);
}
if(settings.vnyan.enabled) {
	startVNyanConnection();
}