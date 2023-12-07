const overlayRevision = 1;
const overlayRevisionTimestamp = 1701910291177;

const settingsEventChannel = new BroadcastChannel("settings_overlay");

function postToSettingsEventChannel(event, data) {
	let message = {
		event: event
	};
	if(data) {
		message.data = data;
	}

	console.log(message);
	settingsEventChannel.postMessage(message);
}

broadcastFuncs = {
	reload: function(message) {
		setTimeout(function() {
			location.reload();
		}, 100);
	},

	settingsOverlayLoaded: function(message) {
		postToSettingsEventChannel("ClockOverlayExists", {version: overlayRevision});
	},

	settingsKeysClock: function(message) {
		for(const setting of message.data) {
			updateSetting(`setting_${setting}`, localStorage.getItem(`setting_${setting}`));
		}
	}
}

settingsEventChannel.onmessage = function(message) {
	console.log(message);
	message = message.data;

	if(message.event in broadcastFuncs) {
		broadcastFuncs[message.event](message);
	}
};

postToSettingsEventChannel("ClockOverlayExists");