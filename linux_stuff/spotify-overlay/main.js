const settings = require("./settings.json");

const spawn = require('child_process').spawn;

const fetch = require('isomorphic-unfetch'); // i don't know why this was needed, but whatever
const { getData, getPreview, getTracks, getDetails } = require('spotify-url-info')(fetch)

const WebSocketServer = require('ws');
const wss = new WebSocketServer.Server(settings.listen);

var wsClients = [];
var currentlyPlaying = {
	title: "",
	artists: [],
	art: "",
	colors: {},
	duration: "",
	startedAt: Date.now(),
	id: "",
	scannable: ""
};

var playerctl = spawn('playerctl', ['-p', 'spotify', 'metadata', '"xesam:url"', '--follow'], {
	shell: true
});
playerctl.stdout.on('data', function(data) {
	getData(data).then(function(response) {
		currentlyPlaying = {
			title: response.title,
			artists: [],
			art: "",
			colors: {
				dark: response.coverArt.extractedColors.colorDark.hex,
				light: response.coverArt.extractedColors.colorLight.hex,
			},
			duration: Math.floor(response.duration/1000),
			startedAt: Date.now(),
			id: response.id,
			scannable: {
				color: {
					light: `https://scannables.scdn.co/uri/plain/jpeg/${response.coverArt.extractedColors.colorLight.hex.replace("#", "")}/black/640/${response.uri}`,
					dark: `https://scannables.scdn.co/uri/plain/jpeg/${response.coverArt.extractedColors.colorDark.hex.replace("#", "")}/white/640/${response.uri}`,
				},
				monochrome: {
					light: `https://scannables.scdn.co/uri/plain/jpeg/FFFFFF/black/640/${response.uri}`,
					dark: `https://scannables.scdn.co/uri/plain/jpeg/000000/white/640/${response.uri}`
				}
			}
		}

		for(let i in response.artists) {
			let artist = response.artists[i];
			currentlyPlaying.artists.push(artist.name);
		}

		let oldMax = 0;
		for(let i in response.coverArt.sources) {
			let src = response.coverArt.sources[i];
			if(src.width > oldMax) {
				currentlyPlaying.art = src.url;
				oldMax = src.width;
			}
		}

		sendData(currentlyPlaying);
	})
})

function sendData(data) {
	for(let wsIdx in wsClients) {
		let client = wsClients[wsIdx];
		client.send(JSON.stringify(data));
	}
}

wss.on("connection", function(client, req) {
	client.ip = req.socket.remoteAddress;

	client.send(JSON.stringify(currentlyPlaying));

	console.log(`${client.ip} connected\n`);
	wsClients.push(client);

	client.on("close", function() {
		console.log(`${client.ip} disconnected\n`);
		wsClients.splice(wsClients.indexOf(client), 1);
	});

	client.onerror = function() {
		console.log(`${client.ip} did something it probably shouldn't have. wtf\n`);
	}
});