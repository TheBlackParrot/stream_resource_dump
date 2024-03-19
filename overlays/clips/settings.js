const widthHeightRatio = (16/9);

const settingUpdaters = {
	videoHeight: function(height) {
		rootCSS().setProperty("--videoWidth", `${parseInt(height) * widthHeightRatio}px`);
		rootCSS().setProperty("--videoHeight", `${height}px`);
	}
};

function updateSetting(which, value, oldValue) {
	if(which.indexOf("setting_clips_") === -1) {
		return;
	}

	let setting = which.substr(14);

	if(setting in settingUpdaters) {
		console.log(`setting ${setting} updated`);
		settingUpdaters[setting](value, oldValue);
	}
}
window.addEventListener("storage", function(event) {
	updateSetting(event.key, event.newValue, event.oldValue);
});