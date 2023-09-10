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
	return backupData.timestamp;
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
	doSettingsBackup();

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

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const checkStr = "backup_settings";
var backupKeys = [];

for(let key in localStorage) {
	if(key.substring(0, checkStr.length) === checkStr) {
		backupKeys.push(parseInt(key.replace(checkStr, "")));
	}
}

backupKeys.sort(function(a, b) {
	return b - a;
});

function generateBackupOptions() {
	$(".selectedBackup").empty();

	for(let i in backupKeys) {
		let timestamp = backupKeys[i];
		let time = new Date(timestamp);

		let dateStr = `${time.getDate()} ${months[time.getMonth()]} ${time.getFullYear()}`;
		let timeStr = `${time.getHours()}:${time.getMinutes().toString().padStart(2, "0")}`;
		
		let option = $(`<option value="${checkStr}${timestamp}">${dateStr} ${timeStr}</option>`);

		$(".selectedBackup").append(option);
	}
}
generateBackupOptions();

function getSelectedBackup() {
	let key = $(".selectedBackup").val();

	return {
		key: key,
		timestamp: parseInt(key.replace(checkStr, ""))
	};
}

$("#restoreBackupButton").on("mouseup", function(e) {
	e.preventDefault();

	if($(this).text() === "Are you sure?") {
		let selectedBackup = getSelectedBackup();
		restoreFromBackup(selectedBackup.timestamp);

		$(this).text("Restore from Backup");
	} else {
		$(this).text("Are you sure?");
	}

	var elem = $(this); // augh
	resetTimeout = setTimeout(function() {
		elem.text("Restore from Backup");
	}, 5000);
});

$("#deleteBackupButton").on("mouseup", function(e) {
	e.preventDefault();

	if($(this).text() === "Are you sure?") {
		let selectedBackup = getSelectedBackup();
		localStorage.removeItem(selectedBackup.key);

		backupKeys.splice(backupKeys.indexOf(selectedBackup.timestamp), 1);
		generateBackupOptions();
		FancySelect.update($(".selectedBackup")[0]);

		$(this).text("Delete Backup");
	} else {
		$(this).text("Are you sure?");
	}

	var elem = $(this); // augh
	resetTimeout = setTimeout(function() {
		elem.text("Delete Backup");
	}, 5000);
});

$("#generateBackupButton").on("mouseup", function(e) {
	e.preventDefault();

	let timestamp = doSettingsBackup();
	backupKeys.unshift(timestamp);
	generateBackupOptions();
	FancySelect.update($(".selectedBackup")[0]);
});