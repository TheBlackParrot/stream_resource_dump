const settings = require("./settings.json");
const URLVerificationString = "https://open.spotify.com/track/";

const spawn = require('child_process').spawn;
const fetch = require('fetch').fetchUrl;
const cheerio = require('cheerio');

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
	spotifyURL = data.toString().trim();
	console.log(spotifyURL);

	if(spotifyURL.substring(0, 31) !== URLVerificationString) {
		console.log("URL doesn't appear to be correct, ignoring");
		return;
	}

	console.log("getting track data...");
	fetch(spotifyURL, function(err, meta, rawBody) {
		console.log("got track data");
		
		let $ = cheerio.load(rawBody.toString());
		let rawScriptData = $("#initial-state").text();

		let scriptData = new Buffer.from(rawScriptData, "base64").toString("utf8");
		let rawJSONData = JSON.parse(scriptData);

		let rawSongData;
		if("entities" in rawJSONData) {
			if("items" in rawJSONData.entities) {
				let keys = Object.keys(rawJSONData.entities.items);
				if(keys.length) {
					rawSongData = rawJSONData.entities.items[keys[0]];
				}
			}
		}

		if(!rawSongData) {
			return;
		}

		currentlyPlaying = {
			title: rawSongData.name,
			artists: [],
			art: "",
			colors: {
				dark: rawSongData.albumOfTrack.coverArt.extractedColors.colorDark.hex,
				light: rawSongData.albumOfTrack.coverArt.extractedColors.colorDark.hex,
			},
			duration: rawSongData.duration.totalMilliseconds/1000,
			startedAt: Date.now(),
			id: rawSongData.id,
			scannable: {
				color: {
					light: `https://scannables.scdn.co/uri/plain/jpeg/${rawSongData.albumOfTrack.coverArt.extractedColors.colorDark.hex.replace("#", "")}/black/640/${rawSongData.uri}`,
					dark: `https://scannables.scdn.co/uri/plain/jpeg/${rawSongData.albumOfTrack.coverArt.extractedColors.colorDark.hex.replace("#", "")}/white/640/${rawSongData.uri}`,
				},
				monochrome: {
					light: `https://scannables.scdn.co/uri/plain/jpeg/FFFFFF/black/640/${rawSongData.uri}`,
					dark: `https://scannables.scdn.co/uri/plain/jpeg/000000/white/640/${rawSongData.uri}`
				}
			}
		}

		for(let i in rawSongData.firstArtist.items) {
			let artist = rawSongData.firstArtist.items[i];
			currentlyPlaying.artists.push(artist.profile.name);
		}
		if("otherArtists" in rawSongData) {
			for(let i in rawSongData.otherArtists.items) {
				let artist = rawSongData.otherArtists.items[i];
				currentlyPlaying.artists.push(artist.profile.name);
			}
		}

		let oldMax = 0;
		for(let i in rawSongData.albumOfTrack.coverArt.sources) {
			let src = rawSongData.albumOfTrack.coverArt.sources[i];
			if(src.width > oldMax) {
				currentlyPlaying.art = src.url;
				oldMax = src.width;
			}
		}

		console.log(currentlyPlaying);
		sendData(currentlyPlaying);
	});
});

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