const overlayRevision = 9;
const overlayRevisionTimestamp = 1718225179008;

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

const elementMap = {
	"miscInfoCell": ["misc", "info", "miscinfo", "diff", "code", "difficulty", "time", "elapsed"],
	"artCell": ["art", "cover", "coverart", "pic", "picture", "img", "image"],
	"metadataCell": ["meta", "metadata", "song", "map", "track", "title", "which", "data"],
	"hitMissCell": ["hit", "miss", "hitmiss", "hits", "misses", "correct", "wrong", "errors", "error"],
	"accCell": ["acc", "accuracy", "combo", "percent", "percentage", "score"],
	"ppCell": ["pp", "rank", "ranked", "points", "rankpoints", "rankedpoints", "performancepoints", "rankpp"]
};

const diffMap = {
	"Easy": "Easy",
	"Normal": "Normal",
	"Hard": "Hard",
	"Expert": "Expert",
	"ExpertPlus": "Expert+"
};

function setDiff() {
	if(!("map" in activeMap)) {
		return;
	}
	$("#diff").text(diffMap[activeMap.map.difficulty]);
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
	easyDiffName: function(value) {
		diffMap["Easy"] = value;
		setDiff();
	},
	normalDiffName: function(value) {
		diffMap["Normal"] = value;
		setDiff();
	},
	hardDiffName: function(value) {
		diffMap["Hard"] = value;
		setDiff();
	},
	expertDiffName: function(value) {
		diffMap["Expert"] = value;
		setDiff();
	},
	expertPlusDiffName: function(value) {
		diffMap["ExpertPlus"] = value;
		setDiff();
	},

	easyDiffColor: function(value) { rootCSS().setProperty("--colorEasy", value); },
	normalDiffColor: function(value) { rootCSS().setProperty("--colorNormal", value); },
	hardDiffColor: function(value) { rootCSS().setProperty("--colorHard", value); },
	expertDiffColor: function(value) { rootCSS().setProperty("--colorExpert", value); },
	expertPlusDiffColor: function(value) { rootCSS().setProperty("--colorExpertPlus", value); },

	elementOrder: function(value) {
		/* remove `.attr("style", "")` after OBS updates CEF to a recent chrome version */
		$(".cell").attr("data-enabled", "false");
		$(".cell").attr("style", "").hide();
		value = value.toLowerCase();

		const wanted = value.split(",").map((v) => v.trim());

		for(const key of wanted) {
			var foundElement;

			for(const element in elementMap) {
				const valid = elementMap[element];

				if(valid.indexOf(key) === -1) {
					continue;
				} else {
					foundElement = element;
					break;
				}
			}

			if(foundElement) {
				$("#wrapper").append($(`#${foundElement}`))
				$(`#${foundElement}`).attr("data-enabled", "true");
				$(`#${foundElement}`).show();
			}
		}

		/* remove after OBS updates CEF to a recent chrome version */
		$(".cell:first").css("padding-left", "0px");
		$(".cell:last").css("padding-right", "0px");
	},
	elementSpacing: function(value) {
		rootCSS().setProperty("--elementSpacing", `${value}px`);
	},

	overlayMarginHorizontal: function(value) {
		rootCSS().setProperty("--overlayMarginHorizontal", `${value}px`);
	},
	overlayMarginVertical: function(value) {
		rootCSS().setProperty("--overlayMarginVertical", `${value}px`);
	},
	overlayHeight: function(value) {
		rootCSS().setProperty("--overlayHeight", `${value}px`);
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
			rootCSS().setProperty("--wrapper-padding-bottom", "calc(var(--overlayMarginVertical) * 4)");
		} else {
			rootCSS().setProperty("--background-art-mask-actual", "none");
			rootCSS().setProperty("--wrapper-padding-bottom", "var(--overlayMarginVertical)");
		}
	},
	artOutlineBrightness: function(value) {
		rootCSS().setProperty("--art-outline-brightness", `${value}%`);
	},
	artBorderRadius: function(value) {
		rootCSS().setProperty("--art-border-radius", `${value}px`);
	},
	artSize: function(value) {
		rootCSS().setProperty("--art-size", `${value}px`);
	},
	enableArtOutline: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--show-art-outline", "block");

			if(localStorage.getItem("setting_bs_enableBoxShadowEffects") === "true") {
				$("#art").removeClass("showBoxShadow");
				$("#artBG").addClass("showBoxShadow");
			}
		} else {
			rootCSS().setProperty("--show-art-outline", "none");

			if(localStorage.getItem("setting_bs_enableBoxShadowEffects") === "true") {
				$("#artBG").removeClass("showBoxShadow");
				$("#art").addClass("showBoxShadow");
			}
		}
	},
	artOutlineSize: function(value) {
		rootCSS().setProperty("--art-outline-size", `${value}px`);
	},
	enableArtOutlineProgress: function(value) {
		timerFunction();
	},
	artBackgroundFadeInDuration: function(value) {
		rootCSS().setProperty("--fadeInDurationLong", `${value}s`);
	},
	flipMetadataDetails: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--metadataVerticalAlignment", "column-reverse");
			rootCSS().setProperty("--fixWeirdMetadataAlignmentIssue", "-1px");
		} else {
			rootCSS().setProperty("--metadataVerticalAlignment", "column");
			rootCSS().setProperty("--fixWeirdMetadataAlignmentIssue", "1px");
		}
	},
	flipMiscInfoDetails: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--miscInfoVerticalAlignment", "column-reverse");
		} else {
			rootCSS().setProperty("--miscInfoVerticalAlignment", "column");
		}
	},
	useRemoteArtURL: function(value) {
		setArt();
	},

	titleFontFamily: function(value) {
		rootCSS().setProperty("--titleFontFamily", value);
	},
	titleFontSize: function(value) {
		rootCSS().setProperty("--titleFontSize", `${value}pt`);
	},
	titleFontWeight: function(value) {
		rootCSS().setProperty("--titleFontWeight", parseInt(value));
	},
	titleAdditionalFontWeight: function(value) {
		rootCSS().setProperty("--titleAdditionalWeight", `${value}px`);
	},
	titleTransform: function(value) {
		rootCSS().setProperty("--titleTransform", value);
	},
	titleColor: function(value) {
		rootCSS().setProperty("--titleColor", value);
	},
	titleFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--titleFontStyle", "italic");
		} else {
			rootCSS().setProperty("--titleFontStyle", "normal");
		}
	},

	artistFontFamily: function(value) {
		rootCSS().setProperty("--secondaryFontFamily", value);
	},
	artistFontSize: function(value) {
		rootCSS().setProperty("--secondaryFontSize", `${value}pt`);
	},
	artistFontWeight: function(value) {
		rootCSS().setProperty("--secondaryFontWeight", parseInt(value));
	},
	artistAdditionalFontWeight: function(value) {
		rootCSS().setProperty("--secondaryAdditionalWeight", `${value}px`);
	},
	artistTransform: function(value) {
		rootCSS().setProperty("--secondaryTransform", value);
	},
	artistFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--secondaryFontStyle", "italic");
		} else {
			rootCSS().setProperty("--secondaryFontStyle", "normal");
		}
	},
	artistColor: function(value) {
		rootCSS().setProperty("--secondaryColorStatic", value);
	},
	artistColorReflectsArtColor: function(value) {
		if(value === "true") {
			if(localStorage.getItem("setting_bs_artistColorReflectsArtColorDarker") === "true") {
				rootCSS().setProperty("--secondaryColor", "var(--colorDark)");
			} else {
				rootCSS().setProperty("--secondaryColor", "var(--colorLight)");
			}
		} else {
			rootCSS().setProperty("--secondaryColor", "var(--secondaryColorStatic)");
		}
	},
	/*
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
	*/
	artistColorReflectsArtColorDarker: function(value) {
		if(localStorage.getItem("setting_bs_artistColorReflectsArtColor") === "false") {
			return;
		}

		if(value === "true") {
			rootCSS().setProperty("--secondaryColor", "var(--colorDark)");
		} else {
			rootCSS().setProperty("--secondaryColor", "var(--colorLight)");
		}
	},
	enableArtistMapperCycle: function(value) {
		switchSecondary(true);
	},

	miscInfoWidth: function(value) {
		rootCSS().setProperty("--miscInfoWidth", `${value}px`);
	},
	hitMissWidth: function(value) {
		rootCSS().setProperty("--hitMissWidth", `${value}px`);
	},
	accWidth: function(value) {
		rootCSS().setProperty("--accWidth", `${value}px`);
	},
	flipHitMissDetails: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--hitMissVerticalAlignment", "column-reverse");
		} else {
			rootCSS().setProperty("--hitMissVerticalAlignment", "column");
		}
	},
	flipAccDetails: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--accVerticalAlignment", "column-reverse");
		} else {
			rootCSS().setProperty("--accVerticalAlignment", "column");
		}
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

	diffFontSize: function(value) {
		rootCSS().setProperty("--miscInfoFontSize", `${value}pt`);
	},
	timeFontSize: function(value) {
		rootCSS().setProperty("--timeFontSize", `${value}pt`);
	},
	miscInfoColor: function(value) {
		rootCSS().setProperty("--miscInfoColor", value);
	},
	miscInfoFontFamily: function(value) {
		rootCSS().setProperty("--miscInfoFontFamily", value);
	},
	miscInfoFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--miscInfoFontStyle", "italic");
		} else {
			rootCSS().setProperty("--miscInfoFontStyle", "normal");
		}
	},

	hitMissFontFamily: function(value) {
		rootCSS().setProperty("--hitMissFontFamily", value);
	},
	hitMissFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--hitMissFontStyle", "italic");
		} else {
			rootCSS().setProperty("--hitMissFontStyle", "normal");
		}
	},
	hitMissFontWeight: function(value) {
		rootCSS().setProperty("--hitMissFontWeight", value);
	},
	hitMissFontSize: function(value) {
		rootCSS().setProperty("--hitMissFontSize", `${value}pt`);
	},
	hitMissColor: function(value) {
		rootCSS().setProperty("--hitMissColor", value);
	},
	hitIconColor: function(value) {
		rootCSS().setProperty("--hitIconColor", value);
	},
	missIconColor: function(value) {
		rootCSS().setProperty("--missIconColor", value);
	},
	FCIconColor: function(value) {
		rootCSS().setProperty("--FCIconColor", value);
	},

	accColor: function(value) {
		rootCSS().setProperty("--accColor", value);
	},
	accFontFamily: function(value) {
		rootCSS().setProperty("--accFontFamily", value);
	},
	accFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--accFontStyle", "italic");
		} else {
			rootCSS().setProperty("--accFontStyle", "normal");
		}
	},
	accFontSize: function(value) {
		rootCSS().setProperty("--accFontSize", `${value}pt`);
	},
	accFontWeight: function(value) {
		rootCSS().setProperty("--accFontWeight", value);
	},
	accFontAdditionalWeight: function(value) {
		rootCSS().setProperty("--accFontAdditionalWeight", `${value}px`);
	},
	accLetterSpacing: function(value) {
		rootCSS().setProperty("--accCharacterSpacing", `${value}px`);
	},
	comboColor: function(value) {
		rootCSS().setProperty("--comboColor", value);
	},
	comboFontFamily: function(value) {
		rootCSS().setProperty("--comboFontFamily", value);
	},
	comboFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--comboFontStyle", "italic");
		} else {
			rootCSS().setProperty("--comboFontStyle", "normal");
		}
	},
	comboFontSize: function(value) {
		rootCSS().setProperty("--comboFontSize", `${value}pt`);
	},
	comboFontWeight: function(value) {
		rootCSS().setProperty("--comboFontWeight", value);
	},
	animateAccInterval: function(value) {
		currentAccInterval = parseInt(localStorage.getItem("setting_bs_animateAccInterval"));
	},

	desaturateOnPause: function(value) {
		if(value === "false") {
			$("body").removeClass("pause");
			return;
		}

		togglePause(previousState !== "playing");
	},
	desaturateAmount: function(value) {
		rootCSS().setProperty("--desaturateAmount", `${value}%`);
	},
	desaturateFadeInDuration: function(value) {
		rootCSS().setProperty("--desaturateFadeInDuration", `${value}s`);
	},
	desaturateFadeOutDuration: function(value) {
		rootCSS().setProperty("--desaturateFadeOutDuration", `${value}s`);
	},
	hideOnMenu: function(value) {
		toggleOverlay(value === "false");
	},

	miscInfoAlignment: function(value) {
		rootCSS().setProperty("--miscInfoAlignment", value);
		updateMarquee();
	},
	metadataAlignment: function(value) {
		rootCSS().setProperty("--metadataAlignment", value);
		updateMarquee();
	},
	hitMissAlignment: function(value) {
		rootCSS().setProperty("--hitMissAlignment", value);
		if(value === "left" || value === "center") {
			rootCSS().setProperty("--hitMissAlignmentDirection", "ltr");
		} else {
			rootCSS().setProperty("--hitMissAlignmentDirection", "rtl");
		}
		updateMarquee();
	},
	accAlignment: function(value) {
		rootCSS().setProperty("--accAlignment", value);
		updateMarquee();
	},

	miscInfoFontWeight: function(value) {
		rootCSS().setProperty("--miscInfoFontWeight", value);
	},
	hitMissFontAdditionalWeight: function(value) {
		rootCSS().setProperty("--hitMissFontAdditionalWeight", `${value}px`);
	},
	comboFontAdditionalWeight: function(value) {
		rootCSS().setProperty("--comboFontAdditionalWeight", `${value}px`);
	},
	secondaryGradient: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--secondaryGradientActual", `var(--secondaryGradient)`);
		} else {
			rootCSS().setProperty("--secondaryGradientActual", `var(--secondaryColor)`);
		}
	},
	secondaryGradientColor: function(value) {
		rootCSS().setProperty("--secondaryGradientColor", value);
	},
	secondaryGradientAngle: function(value) {
		rootCSS().setProperty("--secondaryGradientAngle", `${value}deg`);
	},

	renderArtLower: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--background-art-offset", "var(--background-art-height)");
		} else {
			rootCSS().setProperty("--background-art-offset", "0px");
		}
	},

	metadataLineHeight: function(value) {
		rootCSS().setProperty("--metadataLineHeight", `${value}px`);
	},
	miscInfoLineHeight: function(value) {
		rootCSS().setProperty("--miscInfoLineHeight", `${value}px`);
	},
	hitMissLineHeight: function(value) {
		rootCSS().setProperty("--hitMissLineHeight", `${value}px`);
	},
	accLineHeight: function(value) {
		rootCSS().setProperty("--accLineHeight", `${value}px`);
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
		if(value >= 3 && localStorage.getItem("setting_bs_outlineStripCorners") === "true") {
			matrix = getSmoothMatrix(value, parseFloat(localStorage.getItem("setting_bs_outlineThreshold")));
		} else {
			matrix = new Array(Math.pow(value, 2)).fill(1);
		}

		$("feConvolveMatrix").attr("order", `${value},${value}`);
		$("feConvolveMatrix").attr("kernelMatrix", matrix.join(" "));
	},
	outlineStripCorners: function() {
		settingUpdaters.outlineOrder(localStorage.getItem("setting_bs_outlineOrder"));
	},
	overlayOutlineThreshold: function() {
		settingUpdaters.overlayOutlineOrder(localStorage.getItem("setting_bs_outlineOrder"));
	},
	accPrecision: function(value) {
		value = parseInt(value);

		curAcc = 0;
		if(!currentState.acc) {
			finalAcc = 0;
		} else {
			curAcc = 100;
			finalAcc = parseFloat((currentState.acc * 100).toFixed(value));
		}

		if(currentState.scene === "Playing") {
			setAcc(finalAcc);
		} else {
			$("#acc").text(`00${value ? `.${"".padStart(parseInt(value), "0")}` : ""}`);
		}
	},
	ppWidth: function(value) {
		rootCSS().setProperty("--ppWidth", `${value}px`);
	},
	flipPPDetails: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--ppVerticalAlignment", "column-reverse");
		} else {
			rootCSS().setProperty("--ppVerticalAlignment", "column");
		}
	},
	ppFontFamily: function(value) {
		rootCSS().setProperty("--ppFontFamily", value);
	},
	ppFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--ppFontStyle", "italic");
		} else {
			rootCSS().setProperty("--ppFontStyle", "normal");
		}
	},
	ppFontWeight: function(value) {
		rootCSS().setProperty("--ppFontWeight", value);
	},
	ppFontSize: function(value) {
		rootCSS().setProperty("--ppFontSize", `${value}pt`);
	},
	ppColor: function(value) {
		rootCSS().setProperty("--ppColor", value);
	},
	ppAlignment: function(value) {
		rootCSS().setProperty("--ppAlignment", value);
		if(value === "left" || value === "center") {
			rootCSS().setProperty("--ppAlignmentDirection", "ltr");
		} else {
			rootCSS().setProperty("--ppAlignmentDirection", "rtl");
		}
		updateMarquee();
	},
	ppFontAdditionalWeight: function(value) {
		rootCSS().setProperty("--ppFontAdditionalWeight", `${value}px`);
	},
	ppLineHeight: function(value) {
		rootCSS().setProperty("--ppLineHeight", `${value}px`);
	},
	ppPrecision: function(value) {
		ppDecimalPrecision = parseInt(value);
		updatePPValues(currentState.acc);
	}
};

function updateSetting(which, value, oldValue) {
	if(which.indexOf("setting_bs_") === -1) {
		return;
	}

	let setting = which.substr(11);

	if(setting in settingUpdaters) {
		console.log(`setting ${setting} updated`);
		settingUpdaters[setting](value, oldValue);

		rootCSS().setProperty("--background-art-height", `${$("#wrapper").outerHeight(true)}px`);
		rootCSS().setProperty("--background-art-size", `${$('#artBGWrap .artContainer').width()}px`);
	}

	if(setting.toLowerCase().indexOf("marquee") !== -1) {
		updateMarquee();
	}
}
window.addEventListener("storage", function(event) {
	updateSetting(event.key, event.newValue, event.oldValue);
});