const settings = require("./settings.json");
const MPD = require('mpd-api');
const WebSocketServer = require('ws');
const mm = require('music-metadata');

const delay = ms => new Promise(res => setTimeout(res, ms));

const wss = new WebSocketServer.Server(settings.ws);
var wsClients = [];

wss.on("connection", function(socket, req) {
	socket.ip = req.socket.remoteAddress;

	console.log(`${socket.ip} connected`);
	wsClients.push(socket);

	const broadcastObject = {
		event: "track",
		data: getSongObject()
	};
	socket.send(JSON.stringify(broadcastObject))
 
	socket.on("close", function() {
		console.log(`${socket.ip} disconnected`);
		wsClients.splice(wsClients.indexOf(socket), 1);
	});

	socket.onerror = function() {
		console.log(`${socket.ip} did something it probably shouldn't have. wtf`);
	}
});

var currentState = {
	"song": {},
	"status": {
		song: undefined
	}
};

async function setState() {
	if(!client) {
		await delay(1000);
		return setState();
	}

	const status = await client.api.status.get();

	if(status.songid !== currentState.status.songid) {
		const song = await client.api.status.currentsong();
		currentState.song = song;

		console.log(`song is now ${song.artist} - ${song.title}`);

		const file = await mm.parseFile(`${settings.musicDirectory}/${song.file}`);
		if("isrc" in file.common) {
			currentState.song.isrc = file.common.isrc[0];
		}
		if(!song.duration) {
			song.duration = file.format.duration; // wtf
		}

		const cover = await mm.selectCover(file.common.picture);
		currentState.song.art = cover;

		const broadcastObject = {
			event: "track",
			data: getSongObject()
		};
		for(const socket of wsClients) {
			socket.send(JSON.stringify(broadcastObject))
		}
	}

	currentState.status = status;

	const broadcastObject = {
		event: "state",
		data: {
			playing: (status.state === "play" ? true : false),
			elapsed: (status.elapsed ? status.elapsed * 1000 : 0)
		}
	};
	for(const socket of wsClients) {
		socket.send(JSON.stringify(broadcastObject))
	}
}

function getSongObject() {
	const metadata = currentState.song;

	/*
	{
		id: unique identifier, can be anything (if no unique identifier is given through your player, you could md5/sha hash the title/artist/album together maybe)
		title: song title
		artists: [song artist, song artist, song artist, ...]
		duration: song duration in milliseconds
		album: {
			name: album name
			year: ISO date string, or something javascript can parse idk. null if not present
		}
		art: {
			type: image mime type, or null if not present
			data: base64 encoded image binary, or null if not present
		}
		isrc: song ISRC code, or null if not present
	}
	*/

	return {
		id: currentState.song.id,
		title: (metadata.title ? metadata.title : metadata.file),
		artists: [metadata.artist],
		duration: metadata.duration * 1000,
		album: {
			name: (metadata.album ? metadata.album : "Unknown Album"),
			year: (metadata.date ? new Date(metadata.date).getUTCFullYear() : null)
		},
		art: {
			type: (metadata.art === null ? null : metadata.art.format),
			data: (metadata.art === null ? null : metadata.art.data.toString('base64'))
		},
		comment: metadata.comment ? metadata.comment : null,
		isrc: ("isrc" in currentState.song ? currentState.song.isrc : null)
	}
}

async function mainLoop() {
	await delay(1000);
	await setState();
	mainLoop();
}

async function connectMPD() {
	try {
		client = await MPD.connect(settings.mpd);
		setState();
		mainLoop();
	} catch(err) {
		console.log("Error with connecting to MPD:");
		console.log(err);
		console.log(`reconnecting in ${settings.retrySeconds} seconds...`);
		await delay(settings.retrySeconds * 1000);
		connectMPD();
	}
}
connectMPD();