const settings = {
	cache: {
		expireDelay: 604800
	},

	flags: {
		"agender9": "agender9.svg",
		"agender": "agender.svg",
		"ally": "ally.png",
		"straight_ally": "ally.png",
		"aromantic": "aromantic.svg",
		"aro": "aromantic.svg",
		"asexual": "asexual.svg",
		"ace": "asexual.svg",
		"bear": "bear.svg",
		"bigender": "bigender.svg",
		"biromantic": "biromantic.png",
		"bisexual": "bisexual.svg",
		"bi": "bisexual.svg",
		"bxy": "bxy.svg",
		"cisgender": "cisgender.png",
		"cis": "cisgender.png",
		"demiboy": "demiboy.svg",
		"demigirl": "demigirl.svg",
		"demiromantic": "demiromantic.svg",
		"demisexual": "demisexual.svg",
		"demi": "demisexual.svg",
		"doe": "doe.svg",
		"gay": "gay.svg",
		"heteroromantic": "heteroromantic.jpg",
		"homo": "gay.svg",
		"homosexual": "gay.svg",
		"homoromantic": "homoromantic.png",
		"gendercreative": "gendercreative.svg",
		"genderfluid": "genderfluid.svg",
		"genderflux": "genderflux.svg",
		"genderqueer": "genderqueer.svg",
		"gxrl": "gxrl.svg",
		"intersex": "intersex.svg",
		"intersex_trans": "intersex_trans.svg",
		"trans_intersex": "intersex_trans.svg",
		"lesbian_butch": "lesbian_butch.png",
		"lesbian_lipstick": "lesbian_lipstick.svg",
		"lesbian": "lesbian.svg",
		"neutrois": "neutrois.svg",
		"nonbinary": "nonbinary.svg",
		"enby": "nonbinary.svg",
		"nxnbinary": "nxnbinary.svg",
		"pangender": "pangender_white.svg",
		"pangender_yellow": "pangender_yellow.svg",
		"pansexual": "pansexual.svg",
		"pan": "pansexual.svg",
		"plural": "plural.png",
		"polyamorous": "polyamorous.webp",
		"polyam": "polyamorous.webp",
		"polyamorous_heart": "polyamorous_heart.png",
		"polyam_heart": "polyamorous_heart.png",
		"polysexual": "polysexual.svg",
		"polysex": "polysexual.svg",
		"straight": "straight.svg",
		"hetero": "straight.svg",
		"heterosexual": "straight.svg",
		"transgender": "transgender.svg",
		"trans": "transgender.svg",
		"drag_aidf": "drag_aidf.jpg",
		"drag": "drag.jpg",
		"androgynous": "androgynous.png",
		"twink": "twink.png",
		"greyromantic": "greyromantic.png",
		"grayromantic": "greyromantic.png",
		"omnisexual": "omnisexual.png",
		"greysexual": "greysexual.png",
		"graysexual": "greysexual.png",
		"leather": "leather.png",
		"rubber": "rubber.png",
		"mlm": "mlm.png",
		"abrosexual": "abrosexual.png",
		"pony": "pony.png",
		"pony_play": "pony.png",
		"metagender": "metagender.png",
		"polyam_2022": "polyam_2022.png",
		"polyamorous_2022": "polyam_2022.png",
		"wlw": "wlw.png",
		"sapphic": "wlw.png",
		"bdsm": "bdsm.png",
		"puppy": "puppy.png",
		"puppy_play": "puppy.png",
		"abdl": "abdl.png",
		"mask": "mask.png",
		"sneaker": "sneaker.png",
		"progress": "progress.png",
		"progress_pride": "progress.png",
		"otherkin": "otherkin.png",
		"therian": "therian.png",
		"feet": "feet.png",
		"feline": "feline.png",
		"feline_pride": "feline.png",
		"salmacian": "salmacian.png",
		"qvp": "qvp.png",
		"villain": "qvp.png"
	}
};

var hideAccounts = [];
var refreshExternalStuffTimeout;

function refreshExternalStuff() {
	clearTimeout(refreshExternalStuffTimeout);
	refreshExternalStuffTimeout = setTimeout(function() {
		chatEmotes = (localStorage.getItem("setting_chatShowCommonEmotes") === "true" ? Object.create(commonEmotes) : {});
		getGlobalChannelEmotes(broadcasterData);
	}, 10000);
}

function normalizeSettingColors(setting) {
	setting = `setting_${setting}`;
	let rgb = localStorage.getItem(setting);
	let alpha = Math.floor(parseFloat(localStorage.getItem(`${setting}Alpha`)) * 255).toString(16).padStart(2, "0");

	if(alpha === "00") {
		return "transparent";
	}
	return `${rgb}${alpha}`;
}

function setHistoryOpacity() {
	let filtersCheckFor = [
		"chatFadeHistory",
		"chatBlurHistory"
	];

	let transformsCheckFor = [
		"chatScaleHistory"
	];

	let filtersAllFalse = true;
	for(let i in filtersCheckFor) {
		let which = filtersCheckFor[i];

		if(localStorage.getItem(`setting_${which}`) === "true") {
			filtersAllFalse = false;
			break;
		}
	}
	if(filtersAllFalse) {
		$(".chatBlock").each(function() {
			$(this).css("filter", "");
		});
	}

	let transformsAllFalse = true;
	for(let i in transformsCheckFor) {
		let which = transformsCheckFor[i];

		if(localStorage.getItem(`setting_${which}`) === "true") {
			transformsAllFalse = false;
			break;
		}
	}
	if(transformsAllFalse) {
		$(".chatBlock").each(function() {
			$(this).css("transform", "");
		});
	}

	if(filtersAllFalse && transformsAllFalse) {
		return;
	}

	$(".chatBlock").each(function() {
		let filterList = [];
		let transformList = [];

		let thisIdx = parseInt($(this).attr("data-combinedIdx"));
		let startAfter = parseInt(localStorage.getItem("setting_chatHistoryStartAfter"));

		let opacity = 1;
		if(localStorage.getItem("setting_chatFadeHistory") === "true") {
			let step = parseFloat(localStorage.getItem("setting_chatFadeHistoryStep"));

			opacity = 1 - ((combinedCount - thisIdx) - startAfter) * (step / 100);

			if(combinedCount - thisIdx <= startAfter) {
				opacity = 1;
			}

			if(opacity !== 1) {
				filterList.push(`opacity(${opacity})`);
			}
		}

		if(opacity <= 0) {
			console.log("opacity was 0, force removing");
			$(this).remove();
			return;
		}

		if(localStorage.getItem("setting_chatBlurHistory") === "true") {
			let step = parseFloat(localStorage.getItem("setting_chatBlurHistoryStep"));
			let blur = ((combinedCount - thisIdx) - startAfter) * step;
			
			if(combinedCount - thisIdx <= startAfter) {
				blur = 0;
			}

			if(blur !== 0) {
				filterList.push(`blur(${blur}px)`);
			}
		}

		scaling = 1;
		if(localStorage.getItem("setting_chatScaleHistory") === "true") {
			let step = parseFloat(localStorage.getItem("setting_chatScaleHistoryAmount"));
			scaling = 1 + ((combinedCount - thisIdx) - startAfter) * (step / 100);

			if(combinedCount - thisIdx <= startAfter) {
				scaling = 1;
			}

			if(scaling !== 1) {
				transformList.push(`scale(${scaling})`);
			}
		}

		if(scaling <= 0) {
			console.log("scaling was 0, force removing");
			$(this).remove();
			return;
		}

		if($(this).hasClass("highlighted")) {
			filterList.unshift("var(--highlightedEffect)");
		}

		if(filterList.length) {
			$(this).css("filter", filterList.join(" "));
		}
		if(transformList.length) {
			$(this).css("transform", transformList.join(" "));
		}
	});
}

const settingUpdaters = {
	chatHideAccounts: function(value) {
		hideAccounts = [];
		if(value) {
			hideAccounts = value.split("\n");
		}
	},

	enable7TVGlobalEmotes: refreshExternalStuff,
	enable7TVChannelEmotes: refreshExternalStuff,
	enableBTTVGlobalEmotes: refreshExternalStuff,
	enableBTTVChannelEmotes: refreshExternalStuff,
	enableFFZGlobalEmotes: refreshExternalStuff,
	enableFFZChannelEmotes: refreshExternalStuff,

	enable7TV: function(value) {
		sevenTVCosmetics = {};
		sevenTVBadges = [];
		sevenTVPaints = [];

		get7TVBadges();
		refreshExternalStuff();
	},
	enableBTTV: function(value) {
		startBTTVWebsocket();
		refreshExternalStuff();
	},
	enableFFZ: function(value) {
		refreshExternalStuff();	
	},

	chatBackgroundColor: function(value) {
		rootCSS().setProperty("--backgroundColor", value);
	},
	chatHighlightBackgroundColor: function(value) {
		rootCSS().setProperty("--highlightBackgroundColor", value);
		rootCSS().setProperty("--highlightBorderColor", localStorage.getItem("setting_chatHighlightBackgroundColor").substring(0, 7));
	},
	chatDefaultNameColor: function(value) {
		rootCSS().setProperty("--defaultNameColor", value);
	},
	chatMessageColor: function(value) {
		rootCSS().setProperty("--messageColor", value);
	},

	chatNameFont: function(value) {
		rootCSS().setProperty("--nameFont", value);
	},
	chatMessageFont: function(value) {
		rootCSS().setProperty("--messageFont", value);
	},
	chatNameFontSize: function(value) {
		rootCSS().setProperty("--nameFontSize", `${value}pt`);
	},
	chatMessageFontSize: function(value) {
		rootCSS().setProperty("--messageFontSize", `${value}pt`);
	},
	chatNameFontWeight: function(value) {
		rootCSS().setProperty("--nameFontWeight", value);
	},
	chatMessageFontWeight: function(value) {
		rootCSS().setProperty("--messageFontWeight", value);
	},

	chatBlockPaddingVertical: function(value) {
		rootCSS().setProperty("--chatBlockPaddingVertical", `${value}px`);
	},
	chatBlockPaddingHorizontal: function(value) {
		rootCSS().setProperty("--chatBlockPaddingHorizontal", `${value}px`);
	},
	chatBlockIndividualPaddingVertical: function(value) {
		rootCSS().setProperty("--chatBlockIndividualPaddingVertical", `${value}px`);
	},
	chatBlockIndividualPaddingHorizontal: function(value) {
		rootCSS().setProperty("--chatBlockIndividualPaddingHorizontal", `${value}px`);
	},
	chatBlockBorderRadius: function(value) {
		rootCSS().setProperty("--chatBlockBorderRadius", `${value}px`);
	},

	chatOutlines: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--chatBlockOutlineSize", "var(--chatBlockOutlineSizeActual)");
		} else {
			rootCSS().setProperty("--chatBlockOutlineSize", "0px");
		}
	},
	chatOutlinesColor: function(value) {
		rootCSS().setProperty("--chatBlockOutlineColor", value);
	},
	chatOutlinesSize: function(value) {
		rootCSS().setProperty("--chatBlockOutlineSizeActual", `${value}px`);
	},
	chatOutlineStyle: function(value) {
		rootCSS().setProperty("--chatBlockOutlineStyle", value);
	},

	chatShadows: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--shadowStuff", "var(--originalShadowStuff)");
		} else {
			rootCSS().setProperty("--shadowStuff", "drop-shadow(0px 0px 0px transparent)");
		}
	},
	chatOutlinesFilter: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--outlineStuff", "var(--originalOutlineStuff)");
		} else {
			rootCSS().setProperty("--outlineStuff", "drop-shadow(0px 0px 0px transparent)");
		}
	},

	chatFadeHistory: setHistoryOpacity,
	chatFadeHistoryStep: setHistoryOpacity,
	chatBlurHistory: setHistoryOpacity,
	chatBlurHistoryStep: setHistoryOpacity,
	chatScaleHistory: setHistoryOpacity,
	chatScaleHistoryAmount: setHistoryOpacity,
	chatHistoryStartAfter: setHistoryOpacity,

	chatBigEmoteSize: function(value) {
		rootCSS().setProperty("--bigEmoteSize", `${value}pt`);
	},

	chatCornerAlignment: function(value) {
		/*$("#wrapper").css("top", "");
		$("#wrapper").css("bottom", "");
		$("#wrapper").css("left", "");
		$("#wrapper").css("right", "");*/

		let pos = value.split(",");
		if(pos[0] === "top") {
			$("#wrapper").removeClass("bottom").addClass("top");
		} else {
			$("#wrapper").removeClass("top").addClass("bottom");
		}

		if(pos[1] === "left") {
			$("#wrapper").removeClass("right").addClass("left");
			rootCSS().setProperty("--bsrInfoDirection", "ltr");
		} else {
			$("#wrapper").removeClass("left").addClass("right");
			rootCSS().setProperty("--bsrInfoDirection", "rtl");
		}
	},

	chatMessageLineHeight: function(value) {
		rootCSS().setProperty("--messageLineHeight", `${value}px`);
	},

	avatarSize: function(value) {
		rootCSS().setProperty("--avatarSize", `${value}px`);
	},

	chatMessageUserInfoElementSpacing: function(value) {
		rootCSS().setProperty("--messageUserInfoElementSpacing", `${value}px`);
	},

	avatarShape: function(value) {
		switch(value) {
			case "circle": rootCSS().setProperty("--avatarBorderRadius", "100%"); break;
			case "squircle": rootCSS().setProperty("--avatarBorderRadius", "10px"); break;
			case "square": rootCSS().setProperty("--avatarBorderRadius", "0px"); break;
		}
	},

	overlayShadowColor: function(value) {
		rootCSS().setProperty("--overlayShadowColor", value);
	},
	overlayShadowXOffset: function(value) {
		rootCSS().setProperty("--overlayShadowXOffset", `${value}px`);
	},
	overlayShadowYOffset: function(value) {
		rootCSS().setProperty("--overlayShadowYOffset", `${value}px`);
	},
	overlayShadowBlurRadius: function(value) {
		rootCSS().setProperty("--overlayShadowBlurRadius", `${value}px`);
	},
	overlayOutlineColor: function(value) {
		rootCSS().setProperty("--overlayOutlineColor", value);
	},
	overlayOutlineSize: function(value) {
		rootCSS().setProperty("--overlayOutlineSize", `${value}px`);
	},

	pronounsAeAer: function(value) { rootCSS().setProperty("--pronouns_aeaer", `"${value}"`); },
	pronounsAny: function(value) { rootCSS().setProperty("--pronouns_any", `"${value}"`); },
	pronounsEEm: function(value) { rootCSS().setProperty("--pronouns_eem", `"${value}"`); },
	pronounsFaeFaer: function(value) { rootCSS().setProperty("--pronouns_faefaer", `"${value}"`); },
	pronounsHeHim: function(value) { rootCSS().setProperty("--pronouns_hehim", `"${value}"`); },
	pronounsHeShe: function(value) { rootCSS().setProperty("--pronouns_heshe", `"${value}"`); },
	pronounsHeThem: function(value) { rootCSS().setProperty("--pronouns_hethem", `"${value}"`); },
	pronounsItIts: function(value) { rootCSS().setProperty("--pronouns_itits", `"${value}"`); },
	pronounsOther: function(value) { rootCSS().setProperty("--pronouns_other", `"${value}"`); },
	pronounsPerPer: function(value) { rootCSS().setProperty("--pronouns_perper", `"${value}"`); },
	pronounsSheHer: function(value) { rootCSS().setProperty("--pronouns_sheher", `"${value}"`); },
	pronounsSheThem: function(value) { rootCSS().setProperty("--pronouns_shethem", `"${value}"`); },
	pronounsTheyThem: function(value) { rootCSS().setProperty("--pronouns_theythem", `"${value}"`); },
	pronounsVeVer: function(value) { rootCSS().setProperty("--pronouns_vever", `"${value}"`); },
	pronounsXeXem: function(value) { rootCSS().setProperty("--pronouns_xexem", `"${value}"`); },
	pronounsZieHir: function(value) { rootCSS().setProperty("--pronouns_ziehir", `"${value}"`); },

	badgeBorderRadius: function(value) {
		rootCSS().setProperty("--badgeBorderRadius", `${value}px`);
	},
	badgeSpacing: function(value) {
		rootCSS().setProperty("--badgeSpacing", `${value}px`);
	},
	badgeSize: function(value) {
		rootCSS().setProperty("--badgeSize", `${value}px`);
	},
	chatNameFontWeightExtra: function(value) {
		rootCSS().setProperty("--nameFontWeightExtra", `${value}px`);
	},

	chatDefaultNameColorSecondary: function(value) {
		rootCSS().setProperty("--defaultNameColorSecondary", value);
	},
	chatNameGradientAngle: function(value) {
		rootCSS().setProperty("--nameGradientAngle", `${value}deg`);
	},
	chatNameLetterSpacing: function(value) {
		rootCSS().setProperty("--nameLetterSpacing", `${value}px`);
	},
	messageLetterSpacing: function(value) {
		rootCSS().setProperty("--messageLetterSpacing", `${value}px`);
	},

	pronounsColor: function(value) {
		rootCSS().setProperty("--pronounsColor", value);
	},
	pronounsUsesGradient: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--pronounsGradient", "linear-gradient(var(--pronounsGradientAngle), var(--pronounsColorSecondary) -20%, transparent 100%)");
		} else {
			rootCSS().setProperty("--pronounsGradient", "none");
		}
	},
	pronounsColorSecondary: function(value) {
		rootCSS().setProperty("--pronounsColorSecondary", value);
	},
	pronounsGradientAngle: function(value) {
		rootCSS().setProperty("--pronounsGradientAngle", `${value}deg`);
	},
	pronounsFont: function(value) {
		rootCSS().setProperty("--pronounsFont", value);
	},
	pronounsFontSize: function(value) {
		rootCSS().setProperty("--pronounsFontSize", `${value}pt`);
	},
	pronounsFontWeight: function(value) {
		rootCSS().setProperty("--pronounsFontWeight", value);
	},
	pronounsFontWeightExtra: function(value) {
		rootCSS().setProperty("--pronounsFontWeightExtra", `${value}px`);
	},
	pronounsLetterSpacing: function(value) {
		rootCSS().setProperty("--pronounsLetterSpacing", `${value}px`);
	},

	chatNameTransform: function(value) {
		rootCSS().setProperty("--nameTransform", value);
	},
	messageTransform: function(value) {
		rootCSS().setProperty("--messageTransform", value);
	},
	pronounsTransform: function(value) {
		rootCSS().setProperty("--pronounsTransform", value);
	},

	flagsBorderRadius: function(value) {
		rootCSS().setProperty("--flagsBorderRadius", `${value}px`);
	},
	flagsSize: function(value) {
		rootCSS().setProperty("--flagsSize", `${value}px`);
	},
	flagsSpacing: function(value) {
		rootCSS().setProperty("--flagsSpacing", `${value}px`);
	},

	chatBlockSpacing: function(value) {
		rootCSS().setProperty("--chatBlockSpacing", `${value}px`);
	},

	messageBoldAmount: function(value) {
		rootCSS().setProperty("--messageBoldAmount", `${value}px`);
	},

	timestampColor: function(value) {
		rootCSS().setProperty("--timestampColor", value);
	},
	timestampUsesGradient: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--timestampGradient", "linear-gradient(var(--timestampGradientAngle), var(--timestampColorSecondary) -20%, transparent 100%)");
		} else {
			rootCSS().setProperty("--timestampGradient", "none");
		}
	},
	timestampColorSecondary: function(value) {
		rootCSS().setProperty("--timestampColorSecondary", value);
	},
	timestampGradientAngle: function(value) {
		rootCSS().setProperty("--timestampGradientAngle", `${value}deg`);
	},
	timestampFont: function(value) {
		rootCSS().setProperty("--timestampFont", value);
	},
	timestampFontSize: function(value) {
		rootCSS().setProperty("--timestampFontSize", `${value}pt`);
	},
	timestampFontWeight: function(value) {
		rootCSS().setProperty("--timestampFontWeight", value);
	},
	timestampFontWeightExtra: function(value) {
		rootCSS().setProperty("--timestampFontWeightExtra", `${value}px`);
	},
	timestampLetterSpacing: function(value) {
		rootCSS().setProperty("--timestampLetterSpacing", `${value}px`);
	},
	timestampPadding: function(value) {
		rootCSS().setProperty("--timestampPadding", `${value}px`);
	},

	chatMessageUserInfoBackgroundColor: function(value) {
		rootCSS().setProperty("--userInfoBackgroundColor", value);
	},

	chatMessageUserInfoElementPaddingVertical: function(value) {
		rootCSS().setProperty("--userInfoPaddingVertical", `${value}px`);
	},
	chatMessageUserInfoElementPaddingHorizontal: function(value) {
		rootCSS().setProperty("--userInfoPaddingHorizontal", `${value}px`);
	},
	chatMessageUserInfoElementBorderRadius: function(value) {
		rootCSS().setProperty("--userInfoBorderRadius", `${value}px`);
	},
	chatBlockWidth: function(value) {
		rootCSS().setProperty("--chatBlockWidth", value);
	},
	applyBorderRadiusToSubBadges: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--subBadgeBorderRadius", "var(--badgeBorderRadius)");
		} else {
			rootCSS().setProperty("--subBadgeBorderRadius", "0px");
		}
	},

	chatMessageUserInfoOutlines: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--userInfoOutlineSize", "var(--userInfoOutlineSizeActual)");
		} else {
			rootCSS().setProperty("--userInfoOutlineSize", "0px");
		}
	},
	chatMessageUserInfoOutlinesColor: function(value) {
		rootCSS().setProperty("--userInfoOutlineColor", value);
	},
	chatMessageUserInfoOutlinesSize: function(value) {
		rootCSS().setProperty("--userInfoOutlineSizeActual", `${value}px`);
	},
	chatMessageUserInfoOutlineStyle: function(value) {
		rootCSS().setProperty("--userInfoOutlineStyle", value);
	},

	chatMessageUserInfoBottomMargin: function(value) {
		rootCSS().setProperty("--userInfoBottomMargin", `${value}px`);
	},

	emotesBorderRadius: function(value) {
		rootCSS().setProperty("--emoteBorderRadius", `${value}px`);
	},
	chatBigEmoteMargin: function(value) {
		rootCSS().setProperty("--bigEmoteMargin", `${value}px`);
	},
	chatBigEmoteMarginVertical: function(value) {
		rootCSS().setProperty("--bigEmoteMarginVertical", `${value}px`);
	},

	overlayForceWidth: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--overlayWidth", "var(--overlayWidthActual)");
		} else {
			rootCSS().setProperty("--overlayWidth", "100vw");
		}
	},
	overlayWidth: function(value) {
		rootCSS().setProperty("--overlayWidthActual", `${value}px`);
	},

	chatMessageEnableSeparators: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--messageSeparatorWidth", "var(--messageSeparatorWidthActual)");
			rootCSS().setProperty("--messageSeparatorSpacing", "var(--messageSeparatorSpacingActual)");
		} else {
			rootCSS().setProperty("--messageSeparatorWidth", "0px");
			rootCSS().setProperty("--messageSeparatorSpacing", "0px");
		}		
	},
	chatMessageSeparatorColor: function(value) {
		rootCSS().setProperty("--messageSeparatorColor", value);
	},
	chatMessageSeparatorWidth: function(value) {
		rootCSS().setProperty("--messageSeparatorWidthActual", `${value}px`);
	},
	chatMessageSeparatorSpacing: function(value) {
		rootCSS().setProperty("--messageSeparatorSpacingActual", `${value}px`);
	},
	chatMessageSeparatorStyle: function(value) {
		rootCSS().setProperty("--messageSeparatorStyle", value);
	},
	chatHighlightGlowRadius: function(value) {
		rootCSS().setProperty("--highlightGlowRadius", `${value}px`);
	},

	animationsInDuration: function(value) {
		rootCSS().setProperty("--animationsInDuration", `${value}s`);
	},
	animationsOutDuration: function(value) {
		rootCSS().setProperty("--animationsOutDuration", `${value}s`);
	},
	animationsInOriginPoint: function(value) {
		rootCSS().setProperty("--animationsInOriginPoint", value);
	},
	animationsOutOriginPoint: function(value) {
		rootCSS().setProperty("--animationsOutOriginPoint", value);
	},
	animationsInTimingFunc: function(value) {
		rootCSS().setProperty("--animationsInTimingFunc", `var(--timingFunc${value})`);
	},
	animationsOutTimingFunc: function(value) {
		rootCSS().setProperty("--animationsOutTimingFunc", `var(--timingFunc${value})`);
	},
	messageInOpacityStart: function(value) {
		rootCSS().setProperty("--messageInOpacityStart", `${value}%`);
	},
	messageInOpacityEnd: function(value) {
		rootCSS().setProperty("--messageInOpacityEnd", `${value}%`);
	},
	messageInXTransformStart: function(value) {
		rootCSS().setProperty("--messageInXTransformStart", `${value}vw`);
	},
	messageInXTransformEnd: function(value) {
		rootCSS().setProperty("--messageInXTransformEnd", `${value}vw`);
	},
	messageInYTransformStart: function(value) {
		rootCSS().setProperty("--messageInYTransformStart", `${value}vh`);
	},
	messageInYTransformEnd: function(value) {
		rootCSS().setProperty("--messageInYTransformEnd", `${value}vh`);
	},
	messageInBlurStart: function(value) {
		rootCSS().setProperty("--messageInBlurStart", `${value}px`);
	},
	messageInBlurEnd: function(value) {
		rootCSS().setProperty("--messageInBlurEnd", `${value}px`);
	},
	messageInScaleXStart: function(value) {
		rootCSS().setProperty("--messageInScaleXStart", `${value}%`);
	},
	messageInScaleXEnd: function(value) {
		rootCSS().setProperty("--messageInScaleXEnd", `${value}%`);
	},
	messageInScaleYStart: function(value) {
		rootCSS().setProperty("--messageInScaleYStart", `${value}%`);
	},
	messageInScaleYEnd: function(value) {
		rootCSS().setProperty("--messageInScaleYEnd", `${value}%`);
	},
	messageInSkewXStart: function(value) {
		rootCSS().setProperty("--messageInSkewXStart", `${value}deg`);
	},
	messageInSkewXEnd: function(value) {
		rootCSS().setProperty("--messageInSkewXEnd", `${value}deg`);
	},
	messageInSkewYStart: function(value) {
		rootCSS().setProperty("--messageInSkewYStart", `${value}deg`);
	},
	messageInSkewYEnd: function(value) {
		rootCSS().setProperty("--messageInSkewYEnd", `${value}deg`);
	},
	messageInRotateStart: function(value) {
		rootCSS().setProperty("--messageInRotateStart", `${value}deg`);
	},
	messageInRotateEnd: function(value) {
		rootCSS().setProperty("--messageInRotateEnd", `${value}deg`);
	},
	messageInBrightnessStart: function(value) {
		rootCSS().setProperty("--messageInBrightnessStart", `${value}%`);
	},
	messageInBrightnessEnd: function(value) {
		rootCSS().setProperty("--messageInBrightnessEnd", `${value}%`);
	},
	messageInContrastStart: function(value) {
		rootCSS().setProperty("--messageInContrastStart", `${value}%`);
	},
	messageInContrastEnd: function(value) {
		rootCSS().setProperty("--messageInContrastEnd", `${value}%`);
	},
	messageInSaturateStart: function(value) {
		rootCSS().setProperty("--messageInSaturateStart", `${value}%`);
	},
	messageInSaturateEnd: function(value) {
		rootCSS().setProperty("--messageInSaturateEnd", `${value}%`);
	},
	messageInHueRotateStart: function(value) {
		rootCSS().setProperty("--messageInHueRotateStart", `${value}deg`);
	},
	messageInHueRotateEnd: function(value) {
		rootCSS().setProperty("--messageInHueRotateEnd", `${value}deg`);
	},
	messageOutOpacityStart: function(value) {
		rootCSS().setProperty("--messageOutOpacityStart", `${value}%`);
	},
	messageOutOpacityEnd: function(value) {
		rootCSS().setProperty("--messageOutOpacityEnd", `${value}%`);
	},
	messageOutXTransformStart: function(value) {
		rootCSS().setProperty("--messageOutXTransformStart", `${value}vw`);
	},
	messageOutXTransformEnd: function(value) {
		rootCSS().setProperty("--messageOutXTransformEnd", `${value}vw`);
	},
	messageOutYTransformStart: function(value) {
		rootCSS().setProperty("--messageOutYTransformStart", `${value}vh`);
	},
	messageOutYTransformEnd: function(value) {
		rootCSS().setProperty("--messageOutYTransformEnd", `${value}vh`);
	},
	messageOutBlurStart: function(value) {
		rootCSS().setProperty("--messageOutBlurStart", `${value}px`);
	},
	messageOutBlurEnd: function(value) {
		rootCSS().setProperty("--messageOutBlurEnd", `${value}px`);
	},
	messageOutScaleXStart: function(value) {
		rootCSS().setProperty("--messageOutScaleXStart", `${value}%`);
	},
	messageOutScaleXEnd: function(value) {
		rootCSS().setProperty("--messageOutScaleXEnd", `${value}%`);
	},
	messageOutScaleYStart: function(value) {
		rootCSS().setProperty("--messageOutScaleYStart", `${value}%`);
	},
	messageOutScaleYEnd: function(value) {
		rootCSS().setProperty("--messageOutScaleYEnd", `${value}%`);
	},
	messageOutSkewXStart: function(value) {
		rootCSS().setProperty("--messageOutSkewXStart", `${value}deg`);
	},
	messageOutSkewXEnd: function(value) {
		rootCSS().setProperty("--messageOutSkewXEnd", `${value}deg`);
	},
	messageOutSkewYStart: function(value) {
		rootCSS().setProperty("--messageOutSkewYStart", `${value}deg`);
	},
	messageOutSkewYEnd: function(value) {
		rootCSS().setProperty("--messageOutSkewYEnd", `${value}deg`);
	},
	messageOutRotateStart: function(value) {
		rootCSS().setProperty("--messageOutRotateStart", `${value}deg`);
	},
	messageOutRotateEnd: function(value) {
		rootCSS().setProperty("--messageOutRotateEnd", `${value}deg`);
	},
	messageOutBrightnessStart: function(value) {
		rootCSS().setProperty("--messageOutBrightnessStart", `${value}%`);
	},
	messageOutBrightnessEnd: function(value) {
		rootCSS().setProperty("--messageOutBrightnessEnd", `${value}%`);
	},
	messageOutContrastStart: function(value) {
		rootCSS().setProperty("--messageOutContrastStart", `${value}%`);
	},
	messageOutContrastEnd: function(value) {
		rootCSS().setProperty("--messageOutContrastEnd", `${value}%`);
	},
	messageOutSaturateStart: function(value) {
		rootCSS().setProperty("--messageOutSaturateStart", `${value}%`);
	},
	messageOutSaturateEnd: function(value) {
		rootCSS().setProperty("--messageOutSaturateEnd", `${value}%`);
	},
	messageOutHueRotateStart: function(value) {
		rootCSS().setProperty("--messageOutHueRotateStart", `${value}deg`);
	},
	messageOutHueRotateEnd: function(value) {
		rootCSS().setProperty("--messageOutHueRotateEnd", `${value}deg`);
	},
	chatHistoryOriginPoint: function(value) {
		rootCSS().setProperty("--chatHistoryOriginPoint", value);
	},
	chatNameUsesGradient: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--nameBackground", "var(--nameBackgroundDefault)");
		} else {
			rootCSS().setProperty("--nameBackground", "var(--nameBackgroundNoGradientDefault)");
		}		
	},

	sound_newMsg_Volume: function(value) {
		setVolume("newMsg", value);
	},
	sound_newMsg_URL: function(value) {
		if(sounds["newMsg"].value !== value) {
			initSoundMetadata();
		}
	},

	enableConstantNoiseToFixCEFBeingWeird: function(value) {
		if(value === "true") {
			noiseGain.gain.value = parseInt(localStorage.getItem("setting_noiseVolume")) / 100;
		} else {
			noiseGain.gain.value = 0;
		}
	},
	noiseVolume: function(value) {
		noiseGain.gain.value = parseInt(value) / 100;
	},
	noiseLowpassHz: function(value) {
		value = parseInt(value);
		if(value <= 200) {
			value = 200;
		} else if(value > 24000) {
			value = 24000;
		}
		noiseLowPassFilter.frequency.value = value;
	},
	sound_newMsg_CustomURLs: function(value) {
		if(localStorage.getItem("setting_sound_newMsg_URL") === "<use custom>") {
			initSoundMetadata();
		}
	}
};

settingUpdaters["chatHideAccounts"](localStorage.getItem("setting_chatHideAccounts"));

function updateSetting(which, value) {
	if(which.indexOf("setting_") === -1) {
		return;
	}

	let setting = which.substr(8);

	if(setting in settingUpdaters) {
		console.log(`setting ${setting} updated`);
		settingUpdaters[setting](value);
	}
}
window.addEventListener("storage", function(event) {
	updateSetting(event.key, event.newValue);
});