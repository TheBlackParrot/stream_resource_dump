const streamlabsEventChannel = new BroadcastChannel("streamlabs");
function postToStreamlabsEventChannel(data) {
	console.log(data);
	if(data) {
		streamlabsEventChannel.postMessage(data);
	}
}

const streamlabsSocketToken = localStorage.getItem("setting_streamlabsSocketToken");

var streamlabsSeenEventIDs = [];
var isStreamlabsConnected = false;

function startSLWebsocket() {
	if(!streamlabsSocketToken || streamlabsSocketToken === "null") {
		console.log("No token set for Streamlabs, not connecting to it.");
		changeStatusCircle("StreamlabsStatus", "red", "disconnected");
		return;
	}

	if(isStreamlabsConnected) {
		return;
	}

	console.log("Starting connection to Streamlabs...");

	const socket = io(`https://sockets.streamlabs.com?token=${streamlabsSocketToken}`, {transports: ['websocket']});

	socket.on("connect", function() {
		console.log("Successfully connected to Streamlabs");
		isStreamlabsConnected = true;
		changeStatusCircle("StreamlabsStatus", "green", "connected");
	});

	socket.on("disconnect", function() {
		changeStatusCircle("StreamlabsStatus", "red", "disconnected");
		isStreamlabsConnected = false;

		if(reason === "io server disconnect") {
			console.log("Disconnected from Streamlabs, trying again in 20 seconds...");
			setTimeout(startSLWebsocket, 20000);
		} else {
			console.log("Disconnected from Streamlabs");
		}
	});

	socket.on('event', function(eventData) {
		console.log(eventData);
		if(eventData.for !== "streamlabs") { return; }

		if(streamlabsSeenEventIDs.indexOf(eventData.event_id) !== -1) {
			console.log("Event already triggered, ignoring");
			return;
		}
		streamlabsSeenEventIDs.push(eventData.event_id);

		postToStreamlabsEventChannel(eventData);
	});
}