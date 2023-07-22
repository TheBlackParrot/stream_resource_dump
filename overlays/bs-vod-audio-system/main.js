var currentVODAudioState = "Unknown";

function checkAudioState() {
	$("#audioStatus").attr("class", "")
	$("#audioStatus").addClass(`status${currentVODAudioState}`);
}

$("#reloadButton").on("mouseup", function(event) {
	window.location.reload();
});

$("#audioSafeButton").on("mouseup", function(event) {
	if(db.safe.indexOf(mapInfo.hash) !== -1) {
		return;
	}

	if(db.unsafe.indexOf(mapInfo.hash) !== -1) {
		db.unsafe.splice(db.unsafe.indexOf(mapInfo.hash), 1);
	}

	db.safe.push(mapInfo.hash);
	toggleVODAudio(1);

	saveLocalHashes();

	currentVODAudioState = "Safe";
	checkAudioState();
});

$("#audioUnsafeButton").on("mouseup", function(event) {
	if(db.unsafe.indexOf(mapInfo.hash) !== -1) {
		return;
	}

	if(db.safe.indexOf(mapInfo.hash) !== -1) {
		db.safe.splice(db.safe.indexOf(mapInfo.hash), 1);
	}

	db.unsafe.push(mapInfo.hash);
	toggleVODAudio(0);

	saveLocalHashes();

	currentVODAudioState = "Unsafe";
	checkAudioState();
});