var currentVODAudioState = "Unknown";

function checkAudioState() {
	$("#audioStatus").attr("class", "")
	$("#audioStatus").addClass(`status${currentVODAudioState}`);
}

$("#reloadButton").on("mouseup", function(event) {
	window.location.reload();
});

$("#audioSafeButton").on("mouseup", function(event) {
	if(db.safe.indexOf(mapInfo.map.hash) !== -1) {
		return;
	}

	if(db.unsafe.indexOf(mapInfo.map.hash) !== -1) {
		db.unsafe.splice(db.unsafe.indexOf(mapInfo.map.hash), 1);
	}

	db.safe.push(mapInfo.map.hash);
	postToOBSEventChannel("toggleVODAudio", true);

	saveLocalHashes();

	currentVODAudioState = "Safe";
	checkAudioState();
});

$("#audioUnsafeButton").on("mouseup", function(event) {
	if(db.unsafe.indexOf(mapInfo.map.hash) !== -1) {
		return;
	}

	if(db.safe.indexOf(mapInfo.map.hash) !== -1) {
		db.safe.splice(db.safe.indexOf(mapInfo.map.hash), 1);
	}

	db.unsafe.push(mapInfo.map.hash);
	postToOBSEventChannel("toggleVODAudio", false);

	saveLocalHashes();

	currentVODAudioState = "Unsafe";
	checkAudioState();
});