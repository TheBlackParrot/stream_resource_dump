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

		if(!$(".extraHR").length) {
			$("#rows").append($('<hr class="extraHR"/>'));
		}
		$("#rows").append('<div class="row extraRow" data-tab="bsvodaudio"><i class="fas fa-wrench"></i>BS VOD Audio</div>');

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
		let settingsKeysExclude = settingsKeys.filter((key) => key.substr(0, 8) !== "spotify_");
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
		changeStatusCircle("BSStatsOverlayStatus", "green", "loaded");
		startBSPlusWebsocket();
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
		
		if($('.row[data-tab="spotify"]').is(":visible")) {
			return;
		}

		data = data.data;
		console.log("Spotify overlay is active");
		changeStatusCircle("SpotifyOverlayStatus", "green", `loaded (r${data.version})`);

		if(!$(".extraHR").length) {
			$("#rows").append($('<hr class="extraHR"/>'));
		}
		$("#rows").append('<div class="row extraRow" data-tab="spotify"><i class="fab fa-spotify"></i>Now Playing</div>');

		checkToSendSpotifyData();
	}
};

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