const overlayRevision = 1;
const overlayRevisionTimestamp = 1727485621896;
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

const settingsFuncs = {
	reload: function(message) {
		setTimeout(function() {
			location.reload();
		}, 100);
	},

	settingsOverlayLoaded: function() {
		postToSettingsChannel("NSOverlayExists", {
			version: overlayRevision,
			timestamp: overlayRevisionTimestamp
		});
	},

	settingsKeysNS: function(message) {
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

const nightscoutEventChannel = new BroadcastChannel("nightscout");
const nsFuncs = {
	value: function(data) {
		console.log(data);

		updateValue(data.value);
		updateTrend(data.trend);
	},

	status: function(data) {
		console.log(data);

		if("units" in data) {
			switch(data.units.toLowerCase()) {
				case "mg/dl":
				case "mg":
					$("#topUnit").text("mg");
					$("#bottomUnit").text("dL");
					break;

				case "mmol/l":
				case "mmol":
					$("#topUnit").text("mmol");
					$("#bottomUnit").text("L");
					break;
			}
		}
	}
};

nightscoutEventChannel.onmessage = function(message) {
	message = message.data;

	if(message.event in nsFuncs) {
		nsFuncs[message.event](message.data);
	}
};