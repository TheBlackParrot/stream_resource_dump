const hrEventChannel = new BroadcastChannel("hr");
function postToHREventChannel(data) {
	//console.log(data);
	if(data) {
		hrEventChannel.postMessage(data);
	}
}

var hrDisconnectTimeout;
function resetHRTimeout() {
	clearTimeout(hrDisconnectTimeout);
	hrDisconnectTimeout = setTimeout(function() {
		postToHREventChannel({
			event: "disconnected"
		});
	}, parseFloat(localStorage.getItem("setting_hr_timeoutWait")) * 1000);
}

var hrInit = false;
var hr_ws;
var hrTimeout;
function startHRWebsocket() {
	if(hrInit) {
		return;
	}

	hrInit = true;

	console.log("Starting connection to HeartRateBroadcaster...");
	const url = `ws://${localStorage.getItem("setting_hr_ip")}:${localStorage.getItem("setting_hr_port")}/heartrate`;

	hr_ws = new WebSocket(url);
	hr_ws.hasSeenFirstMessage = false;

	hr_ws.addEventListener("message", function(msg) {
		hr_ws.hasSeenFirstMessage = true;

		new Response(msg.data).arrayBuffer().then(function(arrayBuf) {
			if(localStorage.getItem("setting_hr_timeoutFunctionUseUpdates") === "true") {
				resetHRTimeout();
			}

			const value = new DataView(arrayBuf);

			postToHREventChannel({
				event: "update",
				data: {
					flags: value.getUint8(0),
					rate: value.getUint8(1)
				}
			});
		});
	});

	hr_ws.addEventListener("open", function() {
		console.log(`Connected to HeartRateBroadcaster websocket at ${url}`);
		changeStatusCircle("HRBStatus", "green", "connected");

		addNotification("Connected to HeartRateBroadcaster", {bgColor: "var(--notif-color-success)", duration: 5});

		if(localStorage.getItem("setting_hr_timeoutFunctionUseUpdates") === "false") {
			postToHREventChannel({
				event: "connected"
			});
		}
	});

	hr_ws.addEventListener("close", function() {
		hrInit = false;

		console.log(`Connection to HeartRateBroadcaster websocket ${url} failed, retrying in 10 seconds...`);
		changeStatusCircle("HRBStatus", "red", "disconnected");

		clearTimeout(hrTimeout);
		hrTimeout = setTimeout(startHRWebsocket, 10000);

		addNotification("Disconnected from HeartRateBroadcaster", {bgColor: "var(--notif-color-fail)", duration: 5});

		postToHREventChannel({
			event: "disconnected"
		});

		delete hr_ws;
	});
}