const overlayRevision = 8;
const overlayRevisionTimestamp = 1702506483275;

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
		rootCSS().setProperty("--outline-effects-size-negative", `-${value}px`);
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
			$("#albumString").addClass("artistStringGradient");
		} else {
			$("#artistString").removeClass("artistStringGradient");
			$("#albumString").removeClass("artistStringGradient");
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
			rootCSS().setProperty("--workingAroundFunnyChromiumBugLolXD", `url('${currentSong.scannable.black}')`);
		} else {
			$("#scannable").attr("src", currentSong.scannable.white);
			rootCSS().setProperty("--workingAroundFunnyChromiumBugLolXD", `url('${currentSong.scannable.white}')`);
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
	},

	enableScannableGradient: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--scannable-gradient-actual", "var(--scannable-gradient)");
		} else {
			rootCSS().setProperty("--scannable-gradient-actual", "none");
		}
	},
	scannableGradientColorStart: function(value) {
		rootCSS().setProperty("--scannable-gradient-color-start", value);
	},
	scannableGradientColorEnd: function(value) {
		rootCSS().setProperty("--scannable-gradient-color-end", value);
	},
	scannableGradientAngle: function(value) {
		rootCSS().setProperty("--scannable-gradient-angle", `${value}deg`);
	},
	scannableGradientPercentStart: function(value) {
		rootCSS().setProperty("--scannable-gradient-percent-start", `${value}%`);
	},
	scannableGradientPercentEnd: function(value) {
		rootCSS().setProperty("--scannable-gradient-percent-end", `${value}%`);
	},
	scannableGradientBlendMode: function(value) {
		rootCSS().setProperty("--scannable-gradient-blend-mode", value);
	},
	scannableBorderRadius: function(value) {
		rootCSS().setProperty("--scannable-border-radius", `${value}px`);
	},
	artBorderRadius: function(value) {
		rootCSS().setProperty("--art-border-radius", `${value}px`);
	},

	enableArtistAlbumCycle: function(value) {
		if(!$("#albumString").is(":visible") && !$("#artistString").is(":visible")) {
			return;
		}

		$("#albumString").hide();
		$("#artistString").show();

		if(value === "true") {
			albumArtistCycleTO = setTimeout(function() {
				cycleAlbumArtist("artist");
			}, parseInt(localStorage.getItem("spotify_artistAlbumCycleDelay")) * 1000);
		} else {
			clearTimeout(albumArtistCycleTO);
		}
	},

	enableAnimations: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--animation-duration", `0.5s`);
		} else {
			rootCSS().setProperty("--animation-duration", `0s`);
		}
	},

	scannableHeight: function(value) {
		const heightRatio = 640/160;
		rootCSS().setProperty("--scannable-height", `${value}px`);
		rootCSS().setProperty("--scannable-width", `${value * heightRatio}px`);
	},

	lineHeight: function(value) {
		rootCSS().setProperty("--details-line-height", `${value}px`);
	},

	useRTL: function(value) {
		if(value === "true") {
			$("#wrapper").removeClass("left").addClass("right");
		} else {
			$("#wrapper").removeClass("right").addClass("left");
		}
	},

	flipDetails: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--details-order", "column-reverse");
		} else {
			rootCSS().setProperty("--details-order", "column");
		}		
	},

	artOutlineBrightness: function(value) {
		rootCSS().setProperty("--art-outline-brightness", `${value}%`);
	},

	showSingleIfSingle: function(value) {
		if(currentSong.uri === null) {
			return;
		}

		$("#albumString").removeClass("isSingle");

		if(currentSong.album.type === "single") {
			if(value === "true") {
				$("#albumString").addClass("isSingle");
			}
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