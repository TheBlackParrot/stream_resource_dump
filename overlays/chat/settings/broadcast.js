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

$("#reloadOverlayButton").on("mouseup", function(e) {
	postToChannel("reload");
});

$("#sendTestButton").on("mouseup", function(e) {
	postToChannel("testChatMessage");
});

$("#clearMessagesButton").on("mouseup", function(e) {
	postToChannel("clearChatMessages");
});

broadcastFuncs = {
	BSVodAudioExists: function(message) {
		if($('.row[data-tab="bsvodaudio"]').is(":visible")) {
			return;
		}

		console.log("BS VOD Audio overlay is active");

		if(!$(".extraHR").length) {
			$("#rows").append($('<hr class="extraHR"/>'));
		}
		$("#rows").append('<div class="row extraRow" data-tab="bsvodaudio"><i class="fas fa-wrench"></i>BS VOD Audio</div>');		
	}
};

broadcastChannel.onmessage = function(message) {
	console.log(message);
	message = message.data;

	if(message.event in broadcastFuncs) {
		broadcastFuncs[message.event](message);
	}
};

postToChannel("settingsOverlayLoaded");