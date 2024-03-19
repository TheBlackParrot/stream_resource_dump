// extend the height of the iframe so that the important stuff resides outside the bounds of the parent wrapper
// add a trap function to prevent any accidental API spam on callTwitch calls, check to see if an endpoint request is already in progress, and if it is, just return it
const overlayRevision = 1;
const overlayRevisionTimestamp = Date.now();

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

var twitchHelixReachable = false;
function setTwitchHelixReachable(state) {
	twitchHelixReachable = state;
	postToSettingsChannel("TwitchHelixStatus", state);
}

settingsFuncs = {
	reload: function(message) {
		setTimeout(function() {
			location.reload();
		}, 100);
	},

	settingsOverlayLoaded: function() {
		postToSettingsChannel("ClipsOverlayExists", {
			version: overlayRevision,
			timestamp: overlayRevisionTimestamp
		});

		setTwitchHelixReachable(twitchHelixReachable);
	},

	settingsKeysClips: function(message) {
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

const twitchEventChannel = new BroadcastChannel("twitch_chat");

function postToTwitchEventChannel(event, data) {
	let message = {
		event: event
	};
	if(data) {
		message.data = data;
	}

	console.log(message);
	twitchEventChannel.postMessage(message);
}

const twitchEventFuncs = {
	message: async function(data) {
		console.log(data);

		const channel = data.channel;
		const tags = data.tags;
		const message = data.message;
		const self = data.self;

		if(self) {
			return;
		}

		if("badges" in tags) {
			const badges = tags.badges;
			if(badges !== null) {
				if(!("moderator" in badges || "broadcaster" in badges)) {
					return;
				}
			} else {
				return;
			}
		} else {
			return;
		}

		const parts = data.message.split(" ");

		if(parts.length <= 1) {
			return;
		}

		const targetLogin = parts[1].toLowerCase().replaceAll(/[^a-zA-Z0-9]/g, "").substr(0, 25);

		var wantedClip = -1;
		if(parts.length >= 3) {
			wantedClip = parseInt(parts[2]);
			if(isNaN(wantedClip)) {
				wantedClip = -1;
			}
		}

		switch(parts[0]) {
			case localStorage.getItem("setting_clips_triggerCommand"):
				await setClip(targetLogin, wantedClip);
				break;
		}
	},

	AccessTokenRefreshed: function(data) {
		lastAsk = Infinity;
		console.log("auth token refreshed");
	}
}

twitchEventChannel.onmessage = function(message) {
	message = message.data;

	if(message.event in twitchEventFuncs) {
		if("data" in message) {
			twitchEventFuncs[message.event](message.data);
		} else {
			twitchEventFuncs[message.event]();
		}
	}
};