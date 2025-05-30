const overlayRevision = 29;
const overlayRevisionTimestamp = 1742793980425;

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

function rootCSS() {
	return document.querySelector("html").style;
}

function getSmoothMatrix(size, threshold) {
	let matrix = [];
	let center = Math.floor(size / 2);
	let highest;

	for(let x = 0; x < size; x++) {
		let row = [];

		for(let y = 0; y < size; y++) {
			// distance formula we love the pythagorean theorem
			let val = Math.sqrt(Math.pow(center - x, 2) + Math.pow(center - y, 2));

			if(!highest) {
				// the corners will always be the furthest away from the center, so get it now
				highest = val;
			}

			// we need an inverted percentage of the highest distance as we *don't* want the corners taken into account for the matrix
			// also threshold it
			let perc = Math.abs((val / highest)-1);
			row[y] = (perc > threshold ? 1 : 0);
		}

		matrix.push(row.join(" "));
	}
	return matrix;
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

	enableShadowEffects: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--shadowStuff", "url(#shadowEffect)");
		} else {
			rootCSS().setProperty("--shadowStuff", "url(#blankEffect)");
		}
	},
	enableOutlineEffects: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--outlineStuff", "url(#outlineEffect)");
		} else {
			rootCSS().setProperty("--outlineStuff", "url(#blankEffect)");
		}
	},
	shadowColor: function(value) {
		rootCSS().setProperty("--overlayShadowColor", value);
	},
	shadowXOffset: function(value) {
		$("feDropShadow").attr("dx", value);
	},
	shadowYOffset: function(value) {
		$("feDropShadow").attr("dy", value);
	},
	shadowBlurRadius: function(value) {
		$("feDropShadow").attr("stdDeviation", value);
	},
	outlineColor: function(value) {
		rootCSS().setProperty("--overlayOutlineColor", value);
	},
	outlineDivisor: function(value) {
		$("feConvolveMatrix").attr("divisor", value);
	},
	outlineOrder: function(value) {
		value = parseInt(value);
		let matrix;
		if(value >= 3 && localStorage.getItem("setting_spotify_outlineStripCorners") === "true") {
			matrix = getSmoothMatrix(value, parseFloat(localStorage.getItem("setting_spotify_outlineThreshold")));
		} else {
			matrix = new Array(Math.pow(value, 2)).fill(1);
		}

		$("feConvolveMatrix").attr("order", `${value},${value}`);
		$("feConvolveMatrix").attr("kernelMatrix", matrix.join(" "));
	},
	outlineStripCorners: function() {
		settingUpdaters.outlineOrder(localStorage.getItem("setting_spotify_outlineOrder"));
	},
	overlayOutlineThreshold: function() {
		settingUpdaters.overlayOutlineOrder(localStorage.getItem("setting_spotify_outlineOrder"));
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
		if(localStorage.getItem("setting_mus_overrideSpotify") === "true") {
			return;
		}
		
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
			rootCSS().setProperty("--artist-color", "var(--artist-color-reflected)");
		} else {
			rootCSS().setProperty("--artist-color", "var(--artist-color-static)");
		}
	},

	artistGradient: function(value) {
		if(value === "true") {
			$(".artistName").addClass("artistStringGradient");
			$("#albumString").addClass("artistStringGradient");
			$("#labelString").addClass("artistStringGradient");
			$("#yearString").addClass("artistStringGradient");
		} else {
			$(".artistName").removeClass("artistStringGradient");
			$("#albumString").removeClass("artistStringGradient");
			$("#labelString").removeClass("artistStringGradient");
			$("#yearString").removeClass("artistStringGradient");
		}
	},
	artistGradientColor: function(value) {
		rootCSS().setProperty("--artist-gradient-color", value);
	},
	artistGradientAngle: function(value) {
		rootCSS().setProperty("--artist-gradient-angle", `${value}deg`);
	},

	scannableUsesCustomBGColor: function(value) {
		if(!("colors" in currentSong)) {
			return;
		}

		if(value === "true") {
			rootCSS().setProperty("--scannable-background-color", localStorage.getItem("setting_spotify_scannableCustomBGColor"));
		} else {
			if(currentSong.uri === null) {
				return;
			}

			if(localStorage.getItem("setting_spotify_scannableUseBlack") === "true") {
				rootCSS().setProperty("--scannable-background-color", currentSong.colors.light);
			} else {
				rootCSS().setProperty("--scannable-background-color", currentSong.colors.dark);
			}			
		}

		determineScannableFGColor(currentSong);
	},

	scannableUseBlack: function(value) {
		if(!("colors" in currentSong)) {
			return;
		}

		if(currentSong.uri === null) {
			return;
		}
		if(localStorage.getItem("setting_spotify_scannableUsesCustomBGColor") === "true") {
			return;
		}

		if(value === "true") {
			rootCSS().setProperty("--scannable-background-color", currentSong.colors.light);
		} else {
			rootCSS().setProperty("--scannable-background-color", currentSong.colors.dark);
		}

		determineScannableFGColor(currentSong);
	},

	scannableCustomBGColor: function(value) {
		if(!("colors" in currentSong)) {
			return;
		}

		if(localStorage.getItem("setting_spotify_scannableUsesCustomBGColor") === "false") {
			return;
		}

		rootCSS().setProperty("--scannable-background-color", value);

		determineScannableFGColor(currentSong);
	},

	scannableFGColor: function(value) {
		if(!("colors" in currentSong)) {
			return;
		}

		rootCSS().setProperty("--scannable-foreground-color", value);
		determineScannableFGColor(currentSong);
	},

	artistColorReflectsArtColorDarker: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--artist-color-reflected", "var(--colorDark)");
		} else {
			rootCSS().setProperty("--artist-color-reflected", "var(--colorLight)");
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

		$("#extraStringWrapper").hide();
		$("#artistString").show();
		cycleAlbumArtist("artist");

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
			rootCSS().setProperty("--background-art-mask-side", "100%");
			rootCSS().setProperty("--scroll-direction", "scrollReverse");
		} else {
			$("#wrapper").removeClass("right").addClass("left");
			rootCSS().setProperty("--background-art-mask-side", "0%");
			rootCSS().setProperty("--scroll-direction", "scroll");
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
	},

	enableShadowEffectsScannable: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--shadowStuffScannable", "url(#shadowEffect)");
		} else {
			rootCSS().setProperty("--shadowStuffScannable", "url(#blankEffect)");
		}
	},

	enableOutlineEffectsScannable: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--outlineStuffScannable", "url(#outlineEffectColorReflect)");
		} else {
			rootCSS().setProperty("--outlineStuffScannable", "url(#blankEffect)");
		}
	},

	scannableFGDark: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--scannable-mix-mode", 'multiply');
			if(localStorage.getItem("setting_spotify_outlineColorReflectsScannable") === "true") {
				rootCSS().setProperty("--scannable-filters", 'invert(1) var(--outlineStuffScannable)');
			} else {
				rootCSS().setProperty("--scannable-filters", 'invert(1)');
			}
		} else {
			rootCSS().setProperty("--scannable-mix-mode", 'screen');
			rootCSS().setProperty("--scannable-filters", 'var(--outlineStuffScannable) var(--shadowStuffScannable)');
		}
	},

	enableArtBackground: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--show-background-art", 'block');
		} else {
			rootCSS().setProperty("--show-background-art", 'none');
		}
	},
	artBackgroundMaskWidth: function(value) {
		rootCSS().setProperty("--background-art-mask-width", `${value}%`);
	},
	artBackgroundMaskHeight: function(value) {
		rootCSS().setProperty("--background-art-mask-height", `${value}%`);
	},
	artBackgroundMaskStart: function(value) {
		rootCSS().setProperty("--background-art-start-at", `${value}%`);
	},
	artBackgroundMaskEnd: function(value) {
		rootCSS().setProperty("--background-art-end-at", `${value}%`);
	},
	artBackgroundBlurAmount: function(value) {
		rootCSS().setProperty("--background-art-blur-amount", `${value}px`);
	},
	artBackgroundOpacity: function(value) {
		rootCSS().setProperty("--background-art-opacity", `${value}%`);
	},
	enableArtBackgroundMask: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--background-art-mask-actual", "var(--background-art-mask)");
			rootCSS().setProperty("--wrapper-padding-bottom", "calc(var(--wrapper-margin) * 2)");
		} else {
			rootCSS().setProperty("--background-art-mask-actual", "none");
			rootCSS().setProperty("--wrapper-padding-bottom", "var(--wrapper-margin)");
		}
	},
	useInvertedFGIfNeeded: function(value) {
		if(value === "true") {
			determineScannableFGColor(currentSong);
		} else {
			settingUpdaters["scannableFGDark"](localStorage.getItem("setting_spotify_scannableFGDark"));
		}
	},
	invertFGThreshold: function(value) {
		if(localStorage.getItem("setting_spotify_useInvertedFGIfNeeded") === "false") {
			return;
		}
		determineScannableFGColor(currentSong);
	},

	showLabel: function(value) {
		if(value === "true") {
			if($("#albumString").is(":visible") && currentSong.labels.length) {
				$("#labelString").show();
			} else {
				$("#labelString").hide();
			}
		} else {
			$("#labelString").hide();
		}
	},
	showYear: function(value) {
		if(value === "true") {
			if($("#albumString").is(":visible")) {
				$("#yearString").show();
			} else {
				$("#yearString").hide();
			}
		} else {
			$("#yearString").hide();
		}
	},

	enableScannableOutlines: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--scannable-outline-actual", "var(--scannable-outline)");
			rootCSS().setProperty("--scannable-outline-offset", "calc(var(--scannable-outline-size) * 2)");
		} else {
			rootCSS().setProperty("--scannable-outline-actual", "0px");
			rootCSS().setProperty("--scannable-outline-offset", "0px");
		}
	},
	scannableOutlinesColor: function(value) {
		rootCSS().setProperty("--scannable-outline-color", value);
	},
	scannableOutlinesSize: function(value) {
		rootCSS().setProperty("--scannable-outline-size", `${value}px`);
	},
	scannableOutlinesStyle: function(value) {
		rootCSS().setProperty("--scannable-outline-style", value);
	},

	renderArtLower: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--background-art-offset", "var(--background-art-height)");
		} else {
			rootCSS().setProperty("--background-art-offset", "0px");
		}
	},

	hideOnPause: function(value) {
		if(currentSong.uri !== null) {
			if(!wasPreviouslyPlaying && value === "true") {
				hideStuff();
			} else {
				showStuff();
			}
		}
	},

	outlineColorReflectsScannable: function(value) {
		if(value === "true") {
			$("#changeThisForScannableColorReflect").attr("flood-color", "var(--scannable-background-color)");
		} else {
			$("#changeThisForScannableColorReflect").attr("flood-color", "var(--overlayOutlineColor)");
		}

		settingUpdaters["scannableFGDark"](localStorage.getItem("setting_spotify_scannableFGDark"));
	},

	showArtistImages: function(value) {
		rootCSS().setProperty("--artist-image-display", (value === "true" ? "inline-flex" : "none"));
		updateSecondaryMarquee();
	},
	artistImageSize: function(value) {
		rootCSS().setProperty("--artist-image-size", `${value}em`);
		updateSecondaryMarquee();
	},
	artistImageBorderRadius: function(value) {
		rootCSS().setProperty("--artist-image-border-radius", `${value}px`);
	},
	artistImageZoom: function(value) {
		rootCSS().setProperty("--artist-image-zoom", `${value}%`);
	},
	artistImageXPos: function(value) {
		rootCSS().setProperty("--artist-image-x-pos", `${value}%`);
	},
	artistImageYPos: function(value) {
		rootCSS().setProperty("--artist-image-y-pos", `${value}%`);
	},

	scannableUseAlbum: async function(value) {
		await fetchScannable(currentSong);
	},

	albumDataFromString: function(value) {
		$("#fromStringStyle").remove();
		
		let style = document.head.appendChild(document.createElement("style"));
		style.setAttribute("id", "fromStringStyle");
		style.innerHTML = `:root { --album-from-string: "${value} "; } #albumString:before { content: var(--album-from-string); }`;
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
		rootCSS().setProperty("--background-art-height", `${$("#wrapper").outerHeight(true)}px`);
		rootCSS().setProperty("--background-art-size", `${$('#artBGWrap .artContainer').width()}px`);
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