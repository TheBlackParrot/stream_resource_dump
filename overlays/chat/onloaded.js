window.addEventListener("load", function() {
	getStuffReady();
	getKnownBotsList();

	initSoundMetadata();
	noiseGain.gain.value = (localStorage.getItem("setting_enableConstantNoiseToFixCEFBeingWeird") === "true" ? parseInt(localStorage.getItem("setting_noiseVolume")) / 100 : 0);

	setTimeout(function() {
		postToSettingsChannel("ChatOverlayExists", {
			version: overlayRevision,
			timestamp: overlayRevisionTimestamp
		});
	}, 500);

	startBTTVWebsocket();

	// this is in a deferred script but for some reason it still wants more time
	setTimeout(checkForUpdate, 1000);

	console.log("init stuff done");
});