const codeEnums = {
	200: "OK",
	401: "Unauthorized",
	404: "Not Found",
	422: "Unprocessable Entity"
};

const WebSocketServer = require('ws');
const https = require('https');
const settings = require("./settings.json");

const wss = new WebSocketServer.Server(settings.listen);

var wsClients = [];

wss.on("connection", function(client, req) {
	client.ip = req.socket.remoteAddress;

	console.log(`${client.ip} connected`);
	wsClients.push(client);

	client.send(JSON.stringify({
		event: "campaign",
		data: campaignData
	}));
 
	client.on("close", function() {
		console.log(`${client.ip} disconnected`);
		wsClients.splice(wsClients.indexOf(client), 1);
	});

	client.onerror = function() {
		console.log(`${client.ip} did something it probably shouldn't have. wtf`);
	}
});

var accessToken;
var pollInterval;
var campaignData;
function getTiltifyToken(callback) {
	const reqData = JSON.stringify({
		"client_id": settings.auth.id,
		"client_secret": settings.auth.secret,
		"grant_type": "client_credentials",
		"scope": "public"
	});

	const options = {
		method: 'POST',
		hostname: 'v5api.tiltify.com',
		path: '/oauth/token',
		headers: {
			'Content-Type': 'application/json',
			'Content-Length': reqData.length
		}
	};

	const req = https.request(options, function(response) {
		let data = "";

		console.log(`tiltify responded with code ${response.statusCode} ${(response.statusCode in codeEnums ? codeEnums[response.statusCode] : "Unknown")}`);

		response.on("data", function(chunk) {
			data += chunk;
		});

		response.on("end", function() {
			let parsed = JSON.parse(data);

			accessToken = parsed.access_token;

			if(pollInterval) {
				clearInterval(pollInterval);
			}
			pollInterval = setInterval(pollTiltify, settings.poll_interval * 1000);

			if(typeof callback === "function") {
				callback();
			}
		});

	}).on("error", function(err) {
		console.error(err.message);
	});

	req.write(reqData);
	req.end();
}
getTiltifyToken(function() {
	const args = {
		endpoint: `/api/public/campaigns/${settings.campaign_id}`
	}

	callTiltify(args, function(response) {
		if(!("data" in response)) {
			return;
		}

		// >:(
		response.data.amount_raised.value = parseFloat(response.data.amount_raised.value.toString().replace(",", ""));
		response.data.total_amount_raised.value = parseFloat(response.data.total_amount_raised.value.toString().replace(",", ""));

		campaignData = response.data;

		broadcast("campaign", response.data);
	});
});

function callTiltify(inputData, callback) {
	if(!accessToken) {
		return;
	}

	const options = {
		method: "GET",
		hostname: "v5api.tiltify.com",
		path: inputData.endpoint,
		headers: {
			"Authorization": `Bearer ${accessToken}`
		},
	};

	const req = https.request(options, function(response) {
		let data = "";

		console.log(`tiltify responded with code ${response.statusCode} ${(response.statusCode in codeEnums ? codeEnums[response.statusCode] : "Unknown")}`);

		if(parseInt(response.statusCode) === 401) {
			setTimeout(function() {
				getTiltifyToken(function() {
					callTiltify(inputData, callback);
				});
			}, 1000); // stunlocks are scary
			return;
		}

		if(parseInt(response.statusCode) === 422) {
			console.log(response);
		}

		response.on("data", function(chunk) {
			data += chunk;
		});

		response.on("end", function() {
			if(typeof callback === "function") {
				callback(JSON.parse(data));
			}
		});

	}).on("error", function(err) {
		console.error(err.message);
	});

	req.end();
}

function broadcast(event, data) {
	for(let wsIdx in wsClients) {
		let client = wsClients[wsIdx];
		client.send(JSON.stringify({event: event, data: data}));
	}	
}

var lastPoll = new Date();
//var lastPoll = new Date(new Date()-600000000);

function pollTiltify() {
	console.log("polling tiltify...");

	// this api is... something, alright
	const args = {
		endpoint: `/api/public/campaigns/${settings.campaign_id}/donations?limit=100&completed_after=${encodeURIComponent(lastPoll.toISOString())}`
	}

	callTiltify(args, function(response) {
		if(!("data" in response)) {
			return;
		}

		console.log(`${response.data.length} new donations`);

		lastPoll = new Date();

		if(response.data.length) {
			broadcast("donations", response.data);
			for(let i in response.data) {
				// why are you a string
				let donation = response.data[i];
				let amount = parseFloat(donation.amount.value.toString().replace(",", ""));

				// why are there two of you what even
				campaignData.amount_raised.value += amount;
				campaignData.total_amount_raised.value += amount;

				console.log(`campaign total is now ${campaignData.amount_raised.value} ${campaignData.amount_raised.currency}`);
			}
		}
	})
}