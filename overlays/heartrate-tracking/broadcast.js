const overlayRevision = 1;
const overlayRevisionTimestamp = 1715904368165;
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
postToSettingsChannel("HROverlayExists", {version: overlayRevision});

const settingsFuncs = {
	reload: function(message) {
		setTimeout(function() {
			location.reload();
		}, 100);
	},

	settingsOverlayLoaded: function() {
		postToSettingsChannel("HROverlayExists", {
			version: overlayRevision,
			timestamp: overlayRevisionTimestamp
		});
	},

	settingsKeysHR: function(message) {
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

const hrEventChannel = new BroadcastChannel("hr");
const hrFuncs = {
	update: function(data) {
		//console.log(data);

		$("body").css("opacity", 1);
		updateHR(data.rate);
	},
	
	disconnected: function(data) {
		$("body").css("opacity", "var(--fadeOutOpacity)");
	},

	connected: function(data) {
		$("body").css("opacity", 1);
	}
};

hrEventChannel.onmessage = function(message) {
	message = message.data;

	if(message.event in hrFuncs) {
		hrFuncs[message.event](message.data);
	}
};

const bsEventChannel = new BroadcastChannel("bs");
var previousState;
const bsFuncs = {
	"state": function(data) {
		if(previousState !== data.state) {
			previousState = data.state;
			showMapHighest = (previousState !== "playing" && localStorage.getItem("setting_hr_showBSPeak") === "true");
		}

		if(data.state === "stopped") {
			showMapHighest = false;
		}
	},
	
	"map": function(data) {
		mapHighestPeak = 0;
		showMapHighest = (localStorage.getItem("setting_hr_showBSPeak") === "true");
	}
};

bsEventChannel.onmessage = function(message) {
	console.log(message);
	data = message.data;

	if(data.type in bsFuncs) {
		bsFuncs[data.type](data.data);
	}
};