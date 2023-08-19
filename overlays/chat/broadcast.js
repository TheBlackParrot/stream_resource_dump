const settingsChannel = new BroadcastChannel("settings_overlay");

function postToSettingsChannel(event, data) {
	let message = {
		event: event
	};
	if(data) {
		message.data = data;
	}

	console.log(message);
	settingsChannel.postMessage(message);
}
postToSettingsChannel("ChatOverlayExists", {
	version: overlayRevision,
	timestamp: overlayRevisionTimestamp
});

settingsFuncs = {
	reload: function(message) {
		setTimeout(function() {
			location.reload();
		}, 100);
	},

	testChatMessage: function() {
		lastUser = -69; // nice
		let col = Math.floor(Math.random() * 16777216);
		let r = ((col >> 16) & 0xFF).toString(16).padStart(2, "0");
		let g = ((col >> 8) & 0xFF).toString(16).padStart(2, "0");
		let b = (col & 0xFF).toString(16).padStart(2, "0");

		let tagsObject = {
			"badges": {
				"broadcaster": "1"
			},
			"username": broadcasterData.login,
			"display-name": broadcasterData.display_name,
			"user-id": "-1",
			"is-overlay-message": false,
			"message-type": "system",
			"emotes": {
				305954156: ['205-212'],
				25: ['199-203']
			},
			"id": `system-${Date.now()}`,
			"color": `#${r}${g}${b}`
		}

		prepareMessage(tagsObject, "Hello there! This is a *fake message* so that you can see what your *chat settings* look like! **Have fun!** AaBbCcDd EeFfGgHh IiJjKkLl MmNnOoPp QqRrSsTt UuVvWwXx YyZz 0123456789 Also, look! Emotes! Kappa PogChamp catJAM ~~sarcastic text~~", false, false);
	},

	clearChatMessages: function(message) {
		$("#wrapper").empty();
	},

	settingsOverlayLoaded: function() {
		postToSettingsChannel("ChatOverlayExists", {
			version: overlayRevision,
			timestamp: overlayRevisionTimestamp
		});

		setTwitchHelixReachable(twitchHelixReachable);
	},

	settingsKeys: function(message) {
		for(let i in message.data) {
			let setting = message.data[i];
			updateSetting(`setting_${setting}`, localStorage.getItem(`setting_${setting}`));
		}
	}
}

settingsChannel.onmessage = function(message) {
	console.log(message);
	message = message.data;

	if(message.event in settingsFuncs) {
		settingsFuncs[message.event](message);
	}
};