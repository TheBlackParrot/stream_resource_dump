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

	for(let campaignName in settings.campaigns) {
		client.send(JSON.stringify({
			event: "campaign",
			campaign: campaignName,
			data: campaignData[campaignName]
		}));
	}
 
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
var campaignData = {};
for(let campaignName in settings.campaigns) {
	campaignData[campaignName] = {};
}
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
	for(let campaignName in settings.campaigns) {
		let campaignID = settings.campaigns[campaignName];
		const args = {
			endpoint: `/api/public/campaigns/${campaignID}`
		}

		callTiltify(args, function(response) {
			if(!("data" in response)) {
				return;
			}

			// >:(
			response.data.amount_raised.value = parseFloat(response.data.amount_raised.value.toString().replace(",", ""));
			response.data.total_amount_raised.value = parseFloat(response.data.total_amount_raised.value.toString().replace(",", ""));

			campaignData[campaignName] = response.data;

			broadcast("campaign", campaignName, response.data);
		});
	}
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

function broadcast(event, campaign, data) {
	for(let wsIdx in wsClients) {
		let client = wsClients[wsIdx];
		client.send(JSON.stringify({event: event, campaign: campaign, data: data}));
	}	
}

function pollTiltify() {
	console.log("polling tiltify...");
	let now = new Date().getTime();

	for(let campaignName in settings.campaigns) {
		let campaignID = settings.campaigns[campaignName];

		const args = {
			endpoint: `/api/public/campaigns/${campaignID}/donations?limit=100&completed_after=${encodeURIComponent(new Date(now - (settings.poll_interval*1000)).toISOString())}`
		}

		callTiltify(args, function(response) {
			if(!("data" in response)) {
				return;
			}

			console.log(`[${campaignName}] ${response.data.length} new donations`);

			if(response.data.length) {
				for(let i in response.data) {
					let donation = response.data[i];
					donation.amount.value = parseFloat(donation.amount.value.toString().replace(",", ""));
				}
				broadcast("donations", campaignName, response.data);

				for(let i in response.data) {
					let donation = response.data[i];
					let amount = parseFloat(donation.amount.value.toString().replace(",", ""));

					campaignData[campaignName].amount_raised.value += amount;
					campaignData[campaignName].total_amount_raised.value += amount;

					console.log(`[${campaignName}] total is now ${campaignData[campaignName].amount_raised.value} ${campaignData[campaignName].amount_raised.currency}`);
				}
			}
		})
	}
}