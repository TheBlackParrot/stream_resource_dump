function getAllSettings(includeNonPublic) {
	let data = {
		timestamp: Date.now(),
		settingsPanelRevision: overlayRevision,
		settingsVersion: parseInt(localStorage.getItem("setting_version")),
		data: {}
	};

	for(let setting in defaultConfig) {
		let value = localStorage.getItem(`setting_${setting}`);

		if(!includeNonPublic) {
			if(nonPublicSettings.indexOf(setting) !== -1) {
				continue;
			}
		}

		if(value !== null) {
			data.data[setting] = value;
		}
	}

	return data;
}

function doSettingsBackup() {
	console.log("backing up...");

	let backupData = getAllSettings(true);

	localStorage.setItem(`backup_settings${backupData.timestamp}`, JSON.stringify(backupData));

	console.log(`backed up -- backup_settings${backupData.timestamp}`);
	addNotification("Backed settings up successfully", {bgColor: "var(--notif-color-success)", duration: 5});
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

function generateBackupOptions() {
	backupKeys = [];

	for(let key in localStorage) {
		if(key.substring(0, checkStr.length) === checkStr) {
			backupKeys.push(parseInt(key.replace(checkStr, "")));
		}
	}

	backupKeys.sort(function(a, b) {
		return b - a;
	});

	let backupCap = parseInt(localStorage.getItem("setting_keepAmountOfBackups")) || 999999; // surely
	if(backupKeys.length > backupCap) {
		console.log(`clearing out old backups... ${backupKeys.length} > ${backupCap}`);

		for(let i = backupKeys.length - 1; i >= backupCap; i--) {
			let tsKey = backupKeys[i];
			let key = `${checkStr}${tsKey}`;

			localStorage.removeItem(key);
			backupKeys = backupKeys.slice(0, i);
		}

		console.log(`${backupKeys.length} backups remain`);
	}

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

		$(this).html($(this).attr("temp-previousHTML"));
	} else {
		$(this).attr("temp-previousHTML", $(this).html());
		$(this).text("Are you sure?");
	}

	var elem = $(this); // augh
	resetTimeout = setTimeout(function() {
		elem.html(elem.attr("temp-previousHTML"));
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

		$(this).html($(this).attr("temp-previousHTML"));
	} else {
		$(this).attr("temp-previousHTML", $(this).html());
		$(this).text("Are you sure?");
	}

	var elem = $(this); // augh
	resetTimeout = setTimeout(function() {
		elem.html(elem.attr("temp-previousHTML"));
	}, 5000);
});

$("#generateBackupButton").on("mouseup", function(e) {
	e.preventDefault();

	let timestamp = doSettingsBackup();
	backupKeys.unshift(timestamp);
	generateBackupOptions();
	FancySelect.update($(".selectedBackup")[0]);
});

$("#exportNonCriticalSettingsButton").on("mouseup", function(e) {
	e.preventDefault();

	let data = getAllSettings();
	$("#settingImportArea").val(JSON.stringify(data, null, "\t"));

	addNotification("Settings have been exported to the text area above the buttons.");
});

$("#exportAllSettingsButton").on("mouseup", function(e) {
	e.preventDefault();

	if($(this).text() === "Are you sure?") {
		let data = getAllSettings(true);
		$("#settingImportArea").val(JSON.stringify(data, null, "\t"));

		addNotification("Settings have been exported to the text area above the buttons. THIS EXPORT CONTAINS SENSITIVE INFORMATION, DO NOT SHARE IT WITH OTHERS!");

		$(this).html($(this).attr("temp-previousHTML"));
	} else {
		$(this).attr("temp-previousHTML", $(this).html());
		$(this).text("Are you sure?");
	}

	var elem = $(this); // augh
	resetTimeout = setTimeout(function() {
		elem.html(elem.attr("temp-previousHTML"));
	}, 5000);
});

$("#importSettingsButton").on("mouseup", function(e) {
	e.preventDefault();

	if($(this).text() === "Are you sure?") {
		$(this).html($(this).attr("temp-previousHTML"));

		let rawData = $("#settingImportArea").val();

		if(rawData === "") {
			console.log("Nothing to import, doing nothing");
			return;
		}

		let parsedData;
		try {
			parsedData = JSON.parse(rawData);
		} catch(err) {
			console.log("Invalid JSON present, doing nothing");
			addNotification("Settings import failed, invalid JSON present in import field", {bgColor: "var(--notif-color-fail)", duration: 10});
			return;
		}

		doSettingsBackup();

		let data = JSON.parse(rawData).data;
		for(let setting in data) {
			let value = data[setting];

			console.log(`set ${setting} to ${value}`);
			localStorage.setItem(`setting_${setting}`, value);
		}

		setTimeout(function() {
			postToChannel("reload");
			location.reload();
		}, 100);
	} else {
		$(this).attr("temp-previousHTML", $(this).html());
		$(this).text("Are you sure?");
	}

	var elem = $(this); // augh
	resetTimeout = setTimeout(function() {
		elem.html(elem.attr("temp-previousHTML"));
	}, 5000);
});