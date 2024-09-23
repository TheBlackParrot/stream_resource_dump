const nightscoutEventChannel = new BroadcastChannel("nightscout");
function postToNightscoutEventChannel(data) {
	if(data) {
		nightscoutEventChannel.postMessage(data);
	}
}

async function getNightscoutState() {
	const accessToken = localStorage.getItem("setting_ns_token");
	const instanceURL = localStorage.getItem("setting_ns_url");

	const response = await fetch(`${instanceURL}/api/v1/entries.json?token=${accessToken}&count=1`);

	if(response.status === 401) {
		// invalid token?
		changeStatusCircle("NightscoutStatus", "red", `authentication failed`);
		return {};
	}
	
	if(!response.ok) {
		changeStatusCircle("NightscoutStatus", "red", `bad HTTP response ${response.status}`);
		return {};
	}

	const data = await response.json();

	if(!data.length) {
		changeStatusCircle("NightscoutStatus", "yellow", `no data`);
		return {};
	}

	changeStatusCircle("NightscoutStatus", "green", `reachable`);
	return data[0];
}

async function getNightscoutSettings() {
	const accessToken = localStorage.getItem("setting_ns_token");
	const instanceURL = localStorage.getItem("setting_ns_url");

	const response = await fetch(`${instanceURL}/api/v1/status.json?token=${accessToken}`);

	if(response.status === 401) {
		// invalid token?
		changeStatusCircle("NightscoutStatus", "red", `authentication failed`);
		return {};
	}
	
	if(!response.ok) {
		changeStatusCircle("NightscoutStatus", "red", `bad HTTP response ${response.status}`);
		return {};
	}

	const data = await response.json();

	changeStatusCircle("NightscoutStatus", "green", `reachable`);
	return data;
}

var currentNightscoutState;
var updateNightscoutTO;
async function updateNightscout() {
	const updateDelay = parseFloat(localStorage.getItem("setting_ns_updateInterval")) * 60 * 1000;

	currentNightscoutState = await getNightscoutState();

	postToNightscoutEventChannel({
		event: "value",
		data: {
			trend: currentNightscoutState.direction,
			value: currentNightscoutState.sgv
		}
	});

	clearTimeout(updateNightscoutTO);
	updateNightscoutTO = setTimeout(updateNightscout, updateDelay);
}

var currentNightscoutSettings;
async function updateNightscoutSettings() {
	currentNightscoutSettings = await getNightscoutSettings();

	postToNightscoutEventChannel({
		event: "status",
		data: {
			units: currentNightscoutSettings.settings.units,
			thresholds: currentNightscoutSettings.settings.thresholds
		}
	});
}