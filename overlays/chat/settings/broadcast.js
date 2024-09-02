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

$("#clearMessagesButton").on("mouseup", function(e) {
	postToChannel("clearChatMessages");
});

$("#reloadEmotesButton").on("mouseup", function(e) {
	postToChannel("refreshEmotes");
});

$("#clearAvatarCacheButton").on("mouseup", function(e) {
	e.preventDefault();
	caches.delete("avatarCache-v2");

	postToChannel("clearAvatars");

	addNotification("Cached avatars have been cleared.", {duration: 5});
});

$("#clearEmoteCacheButton").on("mouseup", function(e) {
	e.preventDefault();
	caches.delete("emoteCache");

	postToChannel("clearEmotes");

	addNotification("Cached emotes have been cleared. You may need to refresh the chat overlay for fresh data to take precedence.", {duration: 8});
});

broadcastFuncs = {
	BSVodAudioExists: function(data) {
		data = data.data;
		console.log(data);
		if($('.row[data-tab="bsvodaudio"]').is(":visible")) {
			return;
		}

		console.log("BS VOD Audio overlay is active");
		changeStatusCircle("BSVASStatus", "green", `loaded (r${data.version})`);

		showExtraRow("bsvodaudio");

		changeStatusCircle("OBSStatus", "red", "disconnected");

		connectBeatSaber();
		connectOBS();
	},

	ChatOverlayExists: function(data) {
		data = data.data;
		console.log("Chat overlay is active");
		changeStatusCircle("ChatOverlayStatus", "green", `loaded (r${data.version})`);

		showExtraRow("chat");
		$(".isChatThing").show();

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
		changeStatusCircle("BSStatsOverlayStatus", "green", `loaded (r${data.data.version})`);

		let settingsKeys = Object.keys(defaultConfig);
		let settingsKeysBS = settingsKeys.filter((key) => key.substr(0, 3) === "bs_");
		postToChannel("settingsKeysBS", settingsKeysBS);

		showExtraRow("bsinfo");
		connectBeatSaber();

		if(currentBSSong !== null) {
			postToBSEventChannel({
				type: "map",
				data: currentBSSong
			});

			postToBSEventChannel({
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

		showExtraRow("spotify");

		if(localStorage.getItem("setting_mus_overrideSpotify") !== "true") {
			checkToSendSpotifyData();
		} else {
			startMusicWebsocket();
			if(currentSong) {
				if("id" in currentSong) {
					sendOutTrackData(currentSong);
				}
			}
		}
	},

	ClockOverlayExists: function(message) {
		let settingsKeys = Object.keys(defaultConfig);
		let settingsKeysExclude = settingsKeys.filter((key) => key.substr(0, 6) === "clock_");
		postToChannel("settingsKeysClock", settingsKeysExclude);

		console.log("Clock overlay is active");
		changeStatusCircle("ClockOverlayStatus", "green", `loaded (r${message.data.version})`);

		showExtraRow("clock");
	},

	ClipsOverlayExists: function(data) {
		/*
		data = data.data;
		console.log("Clips overlay is active");
		changeStatusCircle("ClipsOverlayStatus", "green", `loaded (r${data.version})`);

		showExtraRow("clips");

		if(allowedToProceed && !isTwitchRunning) {
			isTwitchRunning = true;
			client.connect().catch(console.error);
		}

		let settingsKeys = Object.keys(defaultConfig);
		let settingsKeysExclude = settingsKeys.filter((key) => key.substr(0, 6) === "clips_");
		postToChannel("settingsKeysClips", settingsKeysExclude);
		*/
		addNotification("Clip overlay has been sunsetted until further notice, sorry! Thanks Twitch!", {duration: 10});
	},

	HROverlayExists: function(data) {
		changeStatusCircle("HROverlayStatus", "green", `loaded (r${data.data.version})`);

		let settingsKeys = Object.keys(defaultConfig);
		let settingsKeysHR = settingsKeys.filter((key) => key.substr(0, 3) === "hr_");
		postToChannel("settingsKeysHR", settingsKeysHR);

		showExtraRow("hr");
		startHRWebsocket();

		if("hasSeenFirstMessage" in hr_ws) {
			postToHREventChannel({event: (hr_ws.hasSeenFirstMessage ? "connected" : "disconnected")});
		}
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

var sampleMessageInterval;
function sampleMessageIntervalFunction() {
	clearTimeout(sampleMessageInterval);
	sampleMessageInterval = setTimeout(sampleMessageIntervalFunction, parseInt(localStorage.getItem("setting_sampleMessageInterval")) * 1000);

	if(localStorage.getItem("setting_allowSampleMessages") === "true") {
		postToChannel("testChatMessage");
	}
}