const defaultConfig = {
	"obs_ip": "127.0.0.1",
	"obs_port": "4455",
	"obs_password": "",
	"obs_usePassword": "false",
	"bsvodaudio_audioSource": "",
	"bsvodaudio_vodAudioTrack": "2",
	"bsvodaudio_syncRemoteDBs": "true",
	"bsvodaudio_remoteDBURLs": "https://gist.githubusercontent.com/TheBlackParrot/ea2126f4f2af4f47455cd072d2e975e5/raw/db.json",
	"bsplus_ip": "127.0.0.1",
	"bsplus_port": "2947",
	"bsvodaudio_muteOnConflict": "true",
	"bsvodaudio_muteOnUnknown": "true",
	"bsvodaudio_muteOnMenu": "true"
};

for(let setting in defaultConfig) {
	if(!localStorage.getItem(`setting_${setting}`)) {
		console.log(`saving default value for setting ${setting}`);
		localStorage.setItem(`setting_${setting}`, defaultConfig[setting]);
	}
}

window.addEventListener("storage", function(event) {
	if(event.key === "_checkPresent_bsvodaudio") {
		localStorage.setItem("_isPresent_bsvodaudio", Date.now());
	}
});