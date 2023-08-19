const streamelementsEventChannel = new BroadcastChannel("streamelements");
function postToStreamElementsEventChannel(data) {
	console.log(data);
	if(data) {
		streamelementsEventChannel.postMessage(data);
	}
}

const streamelementsJWTToken = localStorage.getItem("setting_streamelementsJWTToken");

var streamelementsSeenEventIDs = [];
var isStreamElementsConnected = false;

function checkBeforeSendingSE(eventData) {
	if(streamelementsSeenEventIDs.indexOf(eventData._id) !== -1) {
		console.log("Event already triggered, ignoring");
		return;
	}
	streamelementsSeenEventIDs.push(eventData._id);

	postToStreamElementsEventChannel(eventData);	
}

function startSEWebsocket() {
	if(!streamelementsJWTToken || streamelementsJWTToken === "null") {
		console.log("No JWT token set for StreamElements, not connecting to it.");
		return;
	}

	if(isStreamElementsConnected) {
		return;
	}

	console.log("Starting connection to StreamElements...");

	const socket = io('https://realtime.streamelements.com', {transports: ['websocket']});

	socket.on("connect", function() {
		socket.emit('authenticate', {method: 'jwt', token: streamelementsJWTToken});
	});

	socket.on("authenticated", function() {
		console.log("Successfully connected to StreamElements");
		isStreamElementsConnected = true;
		changeStatusCircle("StreamElementsStatus", "green", "connected");
	});

	socket.on('unauthorized', function(error) {
		console.error(error);
		changeStatusCircle("StreamElementsStatus", "red", "unauthorized");
		socket.disconnect();
	});

	socket.on("disconnect", function(reason) {
		changeStatusCircle("StreamElementsStatus", "red", "disconnected");
		isStreamElementsConnected = false;

		if(reason === "io server disconnect") {
			console.log("Disconnected from StreamElements, trying again in 20 seconds...");
			setTimeout(startSEWebsocket, 20000);
		} else {
			console.log("Disconnected from StreamElements");
		}
	});

	socket.on('event', function(eventData) { 
		checkBeforeSendingSE(eventData);
	});
	socket.on('event:test', function(eventData) {
		checkBeforeSendingSE(eventData);
	});
}