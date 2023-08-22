const obsEventChannel = new BroadcastChannel("obs");
function postToOBSEventChannel(data) {
	console.log(data);
	if(data) {
		obsEventChannel.postMessage(data);
	}
}

const obs = new OBSWebSocket();

async function connectOBS() {
	var obsWebSocketVersion;
	var negotiatedRpcVersion;

	try {
		if(localStorage.getItem("setting_obs_usePassword") === "true") {
			details = await obs.connect(`ws://${localStorage.getItem("setting_obs_ip")}:${localStorage.getItem("setting_obs_port")}`, localStorage.getItem("setting_obs_password"), {
				rpcVersion: 1
			});
		} else {
			details = await obs.connect(`ws://${localStorage.getItem("setting_obs_ip")}:${localStorage.getItem("setting_obs_port")}`, {
				rpcVersion: 1
			});
		}

		console.log(`Connected to OBS Websocket Server v${details.obsWebSocketVersion} (using RPC v${details.negotiatedRpcVersion})`);
		changeStatusCircle("OBSStatus", "green", `connected (v${details.obsWebSocketVersion}; RPC v${details.negotiatedRpcVersion})`);
	} catch (error) {
		console.error('Failed to connect to OBS, retrying in 15 seconds...', error.code, error.message);
		changeStatusCircle("OBSStatus", "red", "disconnected");

		setTimeout(function() {
			connectOBS();
		}, 15000);
	}
}

obsFuncs = {
	toggleVODAudio: async function(val) {
		// expects a boolean specifically
		val = (val ? true : false);

		let inp = {
			'1': true,
			'2': false,
			'3': false,
			'4': false,
			'5': false,
			'6': false
		};
		inp[localStorage.getItem("setting_bsvodaudio_vodAudioTrack")] = val;

		return await obs.call('SetInputAudioTracks', {
			inputName: localStorage.getItem("setting_bsvodaudio_audioSource"),
			inputAudioTracks: inp
		});
	}
}

obsEventChannel.onmessage = async function(message) {
	console.log(message);
	data = message.data;

	if(data.event in obsFuncs) {
		console.log(`${data.event} in obsFuncs`);
		await obsFuncs[data.event](data.data);
	} else {
		console.log(`${data.event} not in obsFuncs`);
	}
};