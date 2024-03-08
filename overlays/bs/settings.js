const overlayRevision = 5;
const overlayRevisionTimestamp = 1709870431919;

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
	"accCell": ["acc", "accuracy", "combo", "percent", "percentage", "score"]
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