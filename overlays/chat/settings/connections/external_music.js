const musicEventChannel = new BroadcastChannel("music");
function postToMusicEventChannel(data) {
	//console.log(data);
	if(data) {
		musicEventChannel.postMessage(data);
	}
}

var currentMusicState = {
	playing: false,
	elapsed: 0
};
function sendOutTrackData(data) {
	postToMusicEventChannel({
		event: "track",
		data: {
			title: data.title,
			artists: data.artists,
			album: {
				name: data.album.name,
				year: (persistentData.year ? persistentData.year : data.album.year),
				art: {
					data: data.art.compressed,
					colors: persistentData.colors
				}
			},
			duration: data.duration,
			isrc: data.isrc,
			labels: persistentData.labels
		}
	});
}
const musicFuncs = {
	track: async function(data) {
		if(data.art.data) {
			data.art.compressed = await compressImage(`data:${data.art.type};base64,${data.art.data}`, parseInt(localStorage.getItem("setting_spotify_artImageSize")), parseInt(localStorage.getItem("setting_spotify_artImageQuality")) / 100);
			$("#musicImageContainer").attr("src", data.art.compressed);

			await updateArtColors(data.art.compressed);
		} else {
			data.art.compressed = "placeholder.png";
			persistentData.colors.dark = localStorage.getItem("setting_spotify_artistColor");
			persistentData.colors.light = localStorage.getItem("setting_spotify_artistColor");

			$("#musicImageContainer").attr("src", "connections/placeholder.png");
		}

		persistentData.labels = [];
		persistentData.year = null;
		if(data.isrc) {
			await fetchMusicBrainz(data.isrc);
		}

		currentSong = data;
		sendOutTrackData(data);
	},

	state: function(data) {
		currentMusicState = data;

		postToMusicEventChannel({
			event: "state",
			data: data
		});
	}
}

var musInit = false;
var mus_ws;
var musTimeout;
var musDisconnectTimeout;
function startMusicWebsocket() {
	if(musInit) {
		return;
	}

	musInit = true;

	console.log("Starting connection to external music player...");
	const url = `ws://${localStorage.getItem("setting_mus_ip")}:${localStorage.getItem("setting_mus_port")}`;

	mus_ws = new WebSocket(url);
	mus_ws.hasSeenFirstMessage = false;

	mus_ws.addEventListener("message", function(msg) {
		mus_ws.hasSeenFirstMessage = true;
		const data = JSON.parse(msg.data);

		if("event" in data) {
			if(data.event in musicFuncs) {
				musicFuncs[data.event](data.data);
			}
		}
	});

	mus_ws.addEventListener("open", function() {
		console.log(`Connected to external music player websocket at ${url}`);
		changeStatusCircle("MusicStatus", "green", "connected");

		addNotification("Connected to external music player", {bgColor: "var(--notif-color-success)", duration: 5});

		postToMusicEventChannel({
			event: "connected"
		});
	});

	mus_ws.addEventListener("close", function() {
		musInit = false;

		console.log(`Connection to external music player websocket ${url} failed, retrying in 10 seconds...`);
		changeStatusCircle("MusicStatus", "red", "disconnected");

		clearTimeout(musTimeout);
		musTimeout = setTimeout(startMusicWebsocket, 10000);

		addNotification("Disconnected from external music player", {bgColor: "var(--notif-color-fail)", duration: 5});

		postToMusicEventChannel({
			event: "disconnected"
		});

		delete mus_ws;
	});
}