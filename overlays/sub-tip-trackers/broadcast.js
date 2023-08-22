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

const broadcastFuncs = {
	reload: function(message) {
		setTimeout(function() {
			location.reload();
		}, 100);
	},

	settingsOverlayLoaded: function(message) {
		postToSettingsChannel("GoalTrackingOverlayExists");
	}
};

settingsChannel.onmessage = function(message) {
	console.log(message);
	message = message.data;

	if(message.event in broadcastFuncs) {
		broadcastFuncs[message.event](message);
	}
};

postToSettingsChannel("GoalTrackingOverlayExists");