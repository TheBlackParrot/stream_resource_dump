const overlayRevision = 4;
const overlayRevisionTimestamp = 1717969899625;

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

		const parts = data.message.split(" ");
		var urlCheck = null;

		if(parts[0] !== localStorage.getItem("setting_clips_triggerCommand")) {
			return;
		}

		if(self) {
			return;
		}

		var targetLogin = data.tags.username || data.tags.login;
		if(parts.length >= 2) {
			try {
				urlCheck = new URL(parts[1]);
			} catch(err) {
				// must be a name
				targetLogin = parts[1].toLowerCase().replaceAll(/[^a-zA-Z0-9\_]/g, "").substr(0, 25);
			}
		}

		if(allowedUsers.indexOf(targetLogin) === -1 || localStorage.getItem("setting_clips_allowRaidersToUse") === "false") {
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
		}

		if(parts.length >= 2) {
			if(urlCheck) {
				await setClip(targetLogin, null, parts[1]);
			} else {
				var wantedClip = -1;
				if(parts.length >= 3) {
					wantedClip = parseInt(parts[2]);
					if(isNaN(wantedClip)) {
						wantedClip = -1;
					}
				}
				await setClip(targetLogin, wantedClip, null);
			}

			return;
		}

		await setClip(targetLogin, -1, null);
	},

	raided: function(data) {
		if(localStorage.getItem("setting_clips_allowRaidersToUse") === "false") {
			return;
		}
		
		const tags = data.tags;
		const name = tags.username || tags.login;

		if(allowedUsers.indexOf(name) !== -1) {
			return;
		}
		allowedUsers.push(name.toLowerCase());
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