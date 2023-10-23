const overlayRevision = 3;
const overlayRevisionTimestamp = 1698020507248;

const settingsChannel = new BroadcastChannel("settings_overlay");

function postToSettingsChannel(event, data) {
	let message = {
		event: event
	};
	if(data) {
		message.data = data;
	}

	console.log(message);
	settingsChannel.postMessage(message);
}

postToSettingsChannel("SpotifyOverlayExists", {
	version: overlayRevision,
	timestamp: overlayRevisionTimestamp
});

function rootCSS() {
	return document.querySelector("html").style;
}

const settingUpdaters = {
	enableScannable: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--show-scannable", "flex");
		} else {
			rootCSS().setProperty("--show-scannable", "none");
		}
	},

	scannableSize: function(value) {
		rootCSS().setProperty("--scannable-width", `${value}px`);
	},

	enableArt: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--show-art", "block");
		} else {
			rootCSS().setProperty("--show-art", "none");
		}
	},

	artSize: function(value) {
		rootCSS().setProperty("--art-size", `${value}px`);
	},

	enableArtOutline: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--show-art-outline", "block");

			if(localStorage.getItem("setting_spotify_enableBoxShadowEffects") === "true") {
				$("#art").removeClass("showBoxShadow");
				$("#artBG").addClass("showBoxShadow");
			}
		} else {
			rootCSS().setProperty("--show-art-outline", "none");

			if(localStorage.getItem("setting_spotify_enableBoxShadowEffects") === "true") {
				$("#artBG").removeClass("showBoxShadow");
				$("#art").addClass("showBoxShadow");
			}
		}
	},

	artOutlineSize: function(value) {
		rootCSS().setProperty("--art-outline-size", `${value}px`);
	},

	overlayMargin: function(value) {
		rootCSS().setProperty("--wrapper-margin", `${value}px`);
	},
	elementSpacing: function(value) {
		rootCSS().setProperty("--element-spacing", `${value}px`);
	},

	titleFontFamily: function(value) {
		rootCSS().setProperty("--title-font-family", value);
	},
	titleFontSize: function(value) {
		rootCSS().setProperty("--title-font-size", `${value}pt`);
	},
	titleFontWeight: function(value) {
		rootCSS().setProperty("--title-font-weight", parseInt(value));
	},
	titleAdditionalFontWeight: function(value) {
		rootCSS().setProperty("--title-additional-weight", `${value}px`);
	},
	titleLineHeight: function(value) {
		rootCSS().setProperty("--title-line-height", `${value}px`);
	},
	titleTransform: function(value) {
		rootCSS().setProperty("--title-transform", value);
	},

	artistFontFamily: function(value) {
		rootCSS().setProperty("--artist-font-family", value);
	},
	artistFontSize: function(value) {
		rootCSS().setProperty("--artist-font-size", `${value}pt`);
	},
	artistFontWeight: function(value) {
		rootCSS().setProperty("--artist-font-weight", parseInt(value));
	},
	artistAdditionalFontWeight: function(value) {
		rootCSS().setProperty("--artist-additional-weight", `${value}px`);
	},
	artistLineHeight: function(value) {
		rootCSS().setProperty("--artist-line-height", `${value}px`);
	},
	artistTransform: function(value) {
		rootCSS().setProperty("--artist-transform", value);
	},

	enableOutlineEffects: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--outline-effects-actual", "var(--outline-effects)");
		} else {
			rootCSS().setProperty("--outline-effects-actual", "drop-shadow(0px 0px 0px transparent)");
		}
	},
	outlineColor: function(value) {
		rootCSS().setProperty("--outline-effects-color", value);
	},
	outlineSize: function(value) {
		rootCSS().setProperty("--outline-effects-size", `${value}px`);
	},

	enableShadowEffects: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--shadow-effects-actual", "var(--shadow-effects)");
		} else {
			rootCSS().setProperty("--shadow-effects-actual", "drop-shadow(0px 0px 0px transparent)");
		}
	},
	shadowColor: function(value) {
		rootCSS().setProperty("--shadow-effects-color", value);
	},
	shadowXOffset: function(value) {
		rootCSS().setProperty("--shadow-effects-offset-x", `${value}px`);
	},
	shadowYOffset: function(value) {
		rootCSS().setProperty("--shadow-effects-offset-y", `${value}px`);
	},
	shadowBlurRadius: function(value) {
		rootCSS().setProperty("--shadow-effects-blur-radius", `${value}px`);
	},

	enableBoxShadowEffects: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--box-shadow-effects-actual", "var(--box-shadow-effects)");
		} else {
			rootCSS().setProperty("--box-shadow-effects-actual", "none");
		}
	},
	boxShadowColor: function(value) {
		rootCSS().setProperty("--box-shadow-effects-color", value);
	},
	boxShadowXOffset: function(value) {
		rootCSS().setProperty("--box-shadow-effects-offset-x", `${value}px`);
	},
	boxShadowYOffset: function(value) {
		rootCSS().setProperty("--box-shadow-effects-offset-y", `${value}px`);
	},
	boxShadowBlurRadius: function(value) {
		rootCSS().setProperty("--box-shadow-effects-blur-radius", `${value}px`);
	},
	boxShadowBlurInset: function(value) {
		rootCSS().setProperty("--box-shadow-effects-inset", `${value}px`);
	},
	progressInterval: function(value) {
		stopTimers();
		timerInterval = parseFloat(value) * 1000;
		startTimers();
	},

	titleColor: function(value) {
		rootCSS().setProperty("--title-color", value);
	},
	artistColor: function(value) {
		rootCSS().setProperty("--artist-color-static", value);
	},
	artistColorReflectsArtColor: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--artist-color", "var(--colorLight)");
		} else {
			rootCSS().setProperty("--artist-color", "var(--artist-color-static)");
		}
	},

	artistGradient: function(value) {
		if(value === "true") {
			$("#artistString").addClass("artistStringGradient");
		} else {
			$("#artistString").removeClass("artistStringGradient");
		}
	},
	artistGradientColor: function(value) {
		rootCSS().setProperty("--artist-gradient-color", value);
	},
	artistGradientAngle: function(value) {
		rootCSS().setProperty("--artist-gradient-angle", `${value}deg`);
	},

	scannableUseBlack: function(value) {
		if(!("scannable" in currentSong)) {
			return;
		}

		if(value === "true") {
			$("#scannable").attr("src", currentSong.scannable.black);
		} else {
			$("#scannable").attr("src", currentSong.scannable.white);
		}
	},

	artistColorReflectsArtColorDarker: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--artist-color", "var(--colorDark)");
		} else {
			rootCSS().setProperty("--artist-color", "var(--colorLight)");
		}
	},

	titleFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--title-font-style", "italic");
		} else {
			rootCSS().setProperty("--title-font-style", "normal");
		}
	},
	artistFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--artist-font-style", "italic");
		} else {
			rootCSS().setProperty("--artist-font-style", "normal");
		}
	}
};

function updateSetting(which, value, oldValue) {
	if(which.indexOf("setting_spotify_") === -1) {
		return;
	}

	let setting = which.substr(16);

	if(setting in settingUpdaters) {
		console.log(`setting ${setting} updated`);
		settingUpdaters[setting](value, oldValue);

		updateMarquee();
	}
}
window.addEventListener("storage", function(event) {
	updateSetting(event.key, event.newValue, event.oldValue);
});

broadcastFuncs = {
	settingsOverlayLoaded: function() {
		postToSettingsChannel("SpotifyOverlayExists", {
			version: overlayRevision,
			timestamp: overlayRevisionTimestamp
		});		
	},

	settingsKeysSpotify: function(message) {
		for(let i in message.data) {
			let setting = message.data[i];
			updateSetting(`setting_${setting}`, localStorage.getItem(`setting_${setting}`));
		}
	}
}

settingsChannel.onmessage = function(message) {
	console.log(message);
	message = message.data;

	if(message.event in broadcastFuncs) {
		broadcastFuncs[message.event](message);
	}
};