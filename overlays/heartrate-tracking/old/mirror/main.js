const WebSocketServer = require('ws');
const wss = new WebSocketServer.Server({
	host: "127.0.0.1",
	port: 2753
});

var wsClients = [];
var lastRate = new ArrayBuffer(2);
wss.on("connection", function(client, req) {
	client.ip = req.socket.remoteAddress;

	console.log(`${client.ip} connected\r\n`);
	wsClients.push(client);

	client.send(lastRate);
 
	client.on("close", function() {
		console.log(`${client.ip} disconnected\r\n`);
		wsClients.splice(wsClients.indexOf(client), 1);
	});

	client.onerror = function() {
		console.log(`${client.ip} did something it probably shouldn't have. wtf\r\n`);
	}
});

var main_reconTO = null;
function mainReconnect() {
	if(main_reconTO) { 
		return;
	}

	console.log("Connection to the heart rate monitoring server failed, reconnecting in 10 seconds...");
	main_reconTO = setTimeout(startHRMConnection, 10000);
}

function parseMessage(data) {
	data = JSON.parse(data.toString());

	if(!("heartrate" in data)) {
		return;
	}

	const rate = Math.max(Math.min(data.heartrate, 255), 0);
	console.log(`raw: ${rate}`);

	const uint8 = new Uint8Array(new ArrayBuffer(2));
	uint8.set([0, rate]);
	lastRate = uint8;
	console.log(uint8);

	for(let client of wsClients) {
		client.send(uint8);
	}
}

var mainHRM;
function startHRMConnection() {
	main_reconTO = null;

	mainHRM = new WebSocketServer.WebSocket(`ws://192.168.1.218:2753`);

	mainHRM.on("open", function() {
		console.log("Connected to the heart rate monitoring server...");
	});

	mainHRM.on('close', mainReconnect);
	mainHRM.on('error', mainReconnect);

	mainHRM.on('message', parseMessage)
}
startHRMConnection();