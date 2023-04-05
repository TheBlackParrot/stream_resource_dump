const WebSocketServer = require('ws');
var BleHR = require('heartrate');
const settings = require("./settings.json");

const wss = new WebSocketServer.Server(settings.listen);

var wsClients = [];
var reconnectTimeout;
var currentBattery = -1;

function sendData(data) {
	data = parseInt(data.toString());

	for(let wsIdx in wsClients) {
		let client = wsClients[wsIdx];
		client.send(JSON.stringify({
			heartrate: data,
			ts: Date.now(),
			battery: currentBattery
		}));
	}
}

function startReconnectStuff(stream) {
	clearTimeout(reconnectTimeout);
	reconnectTimeout = setTimeout(function() {
		console.log("assuming connection has been lost, trying again...");
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
		heartrate: 0,
		ts: Date.now(),
		battery: currentBattery,
		inital: true
	}));
 
	client.on("close", function() {
		console.log(`${client.ip} disconnected\r\n`);
		wsClients.splice(wsClients.indexOf(client), 1);
	});

	client.onerror = function() {
		console.log(`${client.ip} did something it probably shouldn't have. wtf\r\n`);
	}
});