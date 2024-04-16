const overlayRevision = 4;
const overlayRevisionTimestamp = 1713293906193;

const broadcastChannel = new BroadcastChannel("settings_overlay");

function postToChannel(event, data) {
	let message = {
		event: event
	};
	if(data) {
		message.data = data;
	}

	console.log(message);
	broadcastChannel.postMessage(message);
}

broadcastFuncs = {
	reload: function(message) {
		setTimeout(function() {
			location.reload();
		}, 100);
	},

	settingsOverlayLoaded: function(message) {
		postToChannel("BSVodAudioExists", {version: overlayRevision});
	}
}

broadcastChannel.onmessage = function(message) {
	console.log(message);
	message = message.data;

	if(message.event in broadcastFuncs) {
		broadcastFuncs[message.event](message);
	}
};

postToChannel("BSVodAudioExists", {version: overlayRevision});