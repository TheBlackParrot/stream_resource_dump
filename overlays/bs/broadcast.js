const bsEventChannel = new BroadcastChannel("bs");

function postToBSEventChannel(event, data) {
	let message = {
		event: event
	};
	if(data) {
		message.data = data;
	}

	console.log(message);
	bsEventChannel.postMessage(message);
}

bsEventChannel.onmessage = function(message) {
	console.log(message);
	data = message.data;

	processMessage(data);
};

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
		postToSettingsEventChannel("BSStatsOverlayExists", {version: overlayRevision});
	},

	settingsKeysBS: function(message) {
		for(let i in message.data) {
			let setting = message.data[i];
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

postToSettingsEventChannel("BSStatsOverlayExists", {version: overlayRevision});