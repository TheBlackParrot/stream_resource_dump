const EventSource = require('eventsource');
const http = require('http');
const WebSocketServer = require('ws');

const settings = require('./settings.json');
var tagSchema = {};
for(const key in settings.schema) {
	tagSchema[settings.schema[key].tag] = key;
}

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

function getSongObject() {
	return {
		id: `${state.playlistId}-${state.activeItemIndex}`,
		title: (settings.preferFilename ? state.track.filename : (state.track.title ? state.track.title : state.track.filename)),
		artists: [state.track.artist],
		duration: parseInt(state.track.duration * 1000),
		album: {
			name: (state.track.album ? state.track.album : "Unknown Album"),
			year: state.track.year
		},
		art: {
			type: (state.track.art === null ? null : state.track.art.type),
			data: (state.track.art === null ? null : state.track.art.data.toString("base64"))
		},
		isrc: state.track.isrc
	}
}

function broadcast(event, data) {
	if(event !== "state") {
		console.dir(data, {depth: 0});
	}

	for(const socket of wsClients) {
		socket.send(JSON.stringify({
			event: event,
			data: data
		}));
	}
}

const statusURL = `http://${settings.player.ip}:${settings.player.port}/api/query/updates?player=true`;

const state = {
	playlistId: null,
	playing: false,
	activeItemIndex: null,
	track: {}
};

function formatTagResponse(data, tag) {
	if(!(tag in settings.schema)) {
		return data;
	}

	switch(settings.schema[tag].type) {
		case "string":
			return data;
			break;

		case "date":
			return new Date(data).getUTCFullYear();
			break;

		case "number":
			return parseInt(data);
			break;

		case "float":
			return parseFloat(data);
			break;

		default:
			return data;
	}
}

const statusSource = new EventSource(statusURL);
statusSource.onmessage = function(message) {
	const data = JSON.parse(message.data);
	if(!Object.keys(data).length) {
		return;
	}

	const player = data.player;
	const active = player.activeItem;

	state.playing = (player.playbackState === "playing" ? true : false);
	state.elapsed = parseInt(active.position * 1000);

	broadcast("state", {
		playing: state.playing,
		elapsed: state.elapsed
	});

	if(state.activeItemIndex !== active.index || state.playlistId !== active.playlistId) {
		// track has changed
		const columns = [];
		for(const key in settings.schema) {
			columns.push(settings.schema[key].tag);
		}

		http.get({
			hostname: settings.player.ip,
			port: settings.player.port,
			path: `/api/playlists/${active.playlistId}/items/${active.index}:1?columns=%${columns.join("%,%")}%`
		}, function(response) {
			if(response.statusCode !== 200) {
				console.warn(`erm... status not 200: ${response.statusCode}`);
				return;
			}

			response.setEncoding("utf8");

			response.on("data", function(trackResponse) {
				const trackDataRoot = JSON.parse(trackResponse);
				const trackData = trackDataRoot.playlistItems.items[0].columns;

				state.track = {
					art: null
				};

				for(const idx in columns) {
					const tag = columns[idx];
					state.track[tagSchema[tag]] = (trackData[idx] === "?" ? null : formatTagResponse(trackData[idx], tagSchema[tag]));
				}

				http.get({
					hostname: settings.player.ip,
					port: settings.player.port,
					path: `/api/artwork/${active.playlistId}/${active.index}`
				}, function(artResponse) {
					if(artResponse.statusCode !== 200) {
						// no art probably

						broadcast("track", getSongObject());

						console.warn(`art response was not 200: ${artResponse.statusCode}`);
						return;
					}

					let artChunks = [];

					artResponse.on("data", function(artData) {
						artChunks.push(Buffer.from(artData));
					}).on("end", function() {
						state.track.art = {
							data: Buffer.concat(artChunks),
							type: artResponse.headers['content-type']
						};

						broadcast("track", getSongObject());
					});
				});
			});
		});
	}

	state.playlistId = active.playlistId;
	state.activeItemIndex = active.index;
};

var lastElapsedUpdate = Date.now();
function updateElapsed() {
	// shrug
	if(state.playing) {
		state.elapsed += Date.now() - lastElapsedUpdate;
	}
	lastElapsedUpdate = Date.now();

	broadcast("state", {
		playing: state.playing,
		elapsed: state.elapsed
	});
}
setInterval(updateElapsed, parseInt(settings.stateUpdateIntervalSeconds * 1000));