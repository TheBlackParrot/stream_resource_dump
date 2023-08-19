function doSettingsBackup() {
	console.log("backing up...");

	let backupData = {
		timestamp: Date.now(),
		settingsPanelRevision: overlayRevision,
		data: {}
	};

	for(let setting in defaultConfig) {
		let value = localStorage.getItem(`setting_${setting}`);

		if(value !== null) {
			backupData.data[setting] = value;
		}
	}

	localStorage.setItem(`backup_settings${backupData.timestamp}`, JSON.stringify(backupData));

	console.log(`backed up -- backup_settings${backupData.timestamp}`);
}

function checkToDoAutoBackup() {
	if(loadingInit) {
		if(sessionStorage.getItem("autoBackupCheck") === null) {
			console.log("ready, automatically making a backup...");
			sessionStorage.setItem("autoBackupCheck", Date.now());
			doSettingsBackup();
		}
	} else {
		console.log("not quite ready yet...");
		setTimeout(checkToDoAutoBackup, 1000);
	}
}
checkToDoAutoBackup();

function restoreFromBackup(timestamp) {
	let rawData = localStorage.getItem(`backup_settings${timestamp}`);

	if(rawData === null) {
		console.log(`backup for ${timestamp} doesn't exist, doing nothing`);
		return;
	}

	let data = JSON.parse(rawData).data;
	for(let setting in data) {
		let value = data[setting];

		console.log(`restored ${setting} to ${value}`);
		localStorage.setItem(`setting_${setting}`, value);
	}

	setTimeout(function() {
		postToChannel("reload");
		location.reload();
	}, 100);
}