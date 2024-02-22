const settingsChannel = new BroadcastChannel("settings_overlay");

function postToChannel(event, data) {
	let message = {
		event: event
	};
	if(data) {
		message.data = data;
	}

	console.log(message);
	settingsChannel.postMessage(message);
}

$("#reloadOverlayButton").on("mouseup", function(e) {
	postToChannel("reload");
});

$("#sendTestButton").on("mouseup", function(e) {
	postToChannel("testChatMessage");
});

$("#clearMessagesButton").on("mouseup", function(e) {
	postToChannel("clearChatMessages");
});

$("#reloadEmotesButton").on("mouseup", function(e) {
	postToChannel("refreshEmotes");
});

broadcastFuncs = {
	BSVodAudioExists: function(message) {
		if($('.row[data-tab="bsvodaudio"]').is(":visible")) {
			return;
		}

		console.log("BS VOD Audio overlay is active");
		changeStatusCircle("BSVASStatus", "green", "loaded");

		addExtraRow("bsvodaudio", "BS VOD Audio", "icon bs");

		changeStatusCircle("BSPlusStatus", "red", "disconnected");
		changeStatusCircle("OBSStatus", "red", "disconnected");

		startBSPlusWebsocket();
		connectOBS();
	},

	ChatOverlayExists: function(data) {
		data = data.data;
		console.log("Chat overlay is active");
		changeStatusCircle("ChatOverlayStatus", "green", `loaded (r${data.version})`);

		if(allowedToProceed && !isTwitchRunning) {
			isTwitchRunning = true;
			client.connect().catch(console.error);
		}

		let settingsKeys = Object.keys(defaultConfig);
		const excludes = ["spotify", "bs", "obs", "bsvodaudio", "bsplus", "clock", "panel"];
		let settingsKeysExclude = settingsKeys.filter(function(key) {
			const parts = key.split("_");
			return excludes.indexOf(parts[0]) === -1;
		});
		postToChannel("settingsKeys", settingsKeysExclude);
	},

	TwitchHelixStatus: function(state) {
		if(state) {
			changeStatusCircle("TwitchHelixStatus", "green", "reachable");
		} else {
			changeStatusCircle("TwitchHelixStatus", "red", "unreachable");
		}
	},

	AlertsOverlayExists: function(data) {
		console.log("Alerts overlay is active");
		changeStatusCircle("AlertsOverlayStatus", "green", `loaded`);

		startSLWebsocket();
		startSEWebsocket();

		if(allowedToProceed && !isTwitchRunning) {
			isTwitchRunning = true;
			client.connect().catch(console.error);
		}
	},

	BSStatsOverlayExists: function(data) {
		changeStatusCircle("BSPlusStatus", "red", "disconnected");
		changeStatusCircle("BSStatsOverlayStatus", "green", `loaded (r${data.data.version})`);

		let settingsKeys = Object.keys(defaultConfig);
		let settingsKeysBS = settingsKeys.filter((key) => key.substr(0, 3) === "bs_");
		postToChannel("settingsKeysBS", settingsKeysBS);

		addExtraRow("bsinfo", "Beat Saber Overlay", "icon bs");
		startBSPlusWebsocket();

		if(currentBSSong !== null) {
			postToBSPlusEventChannel({
				type: "map",
				data: currentBSSong
			});

			postToBSPlusEventChannel({
				type: "state",
				data: currentBSState
			});
		}
	},

	GoalTrackingOverlayExists: function(data) {
		data = data.data;
		console.log("Goal tracking overlay is active");
		changeStatusCircle("GoalsOverlayStatus", "green", `loaded`);

		if(allowedToProceed && !isTwitchRunning) {
			isTwitchRunning = true;
			client.connect().catch(console.error);
		}
	},

	SpotifyOverlayExists: function(data) {
		let settingsKeys = Object.keys(defaultConfig);
		let settingsKeysSpotify = settingsKeys.filter((key) => key.substr(0, 8) === "spotify_");
		postToChannel("settingsKeysSpotify", settingsKeysSpotify);

		data = data.data;
		console.log("Spotify overlay is active");
		changeStatusCircle("SpotifyOverlayStatus", "green", `loaded (r${data.version})`);

		addExtraRow("spotify", "Now Playing", "fab fa-spotify");

		checkToSendSpotifyData();
	},

	ClockOverlayExists: function(message) {
		let settingsKeys = Object.keys(defaultConfig);
		let settingsKeysExclude = settingsKeys.filter((key) => key.substr(0, 6) === "clock_");
		postToChannel("settingsKeysClock", settingsKeysExclude);

		console.log("Clock overlay is active");
		changeStatusCircle("ClockOverlayStatus", "green", `loaded (r${message.data.version})`);

		addExtraRow("clock", "Clock", "fas fa-clock");
	}
};

var isSpotifyReady = false;
function checkToSendSpotifyData() {
	if(isSpotifyReady) {
		updateTrack();
	} else {
		setTimeout(checkToSendSpotifyData, 1000);
	}
}

settingsChannel.onmessage = function(message) {
	console.log(message);
	message = message.data;

	if(message.event in broadcastFuncs) {
		broadcastFuncs[message.event](message);
	}
};

postToChannel("settingsOverlayLoaded");