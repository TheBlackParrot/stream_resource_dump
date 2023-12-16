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
	if(!chatEmotes) {
		initEmoteSet();
	}
	getGlobalChannelEmotes(broadcasterData);
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
	if(localStorage.getItem("setting_debugFreezeChat") === "true") {
		return;
	}

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
			$(this).css("filter", "opacity(1)"); // this fixes a... height issue? what the fuck
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

		let thisIdx = parseInt($(this).attr("data-rootIdx"));
		let startAfter = parseInt(localStorage.getItem("setting_chatHistoryStartAfter"));

		let opacity = 1;
		if(localStorage.getItem("setting_chatFadeHistory") === "true") {
			let step = parseFloat(localStorage.getItem("setting_chatFadeHistoryStep"));

			opacity = 1 - ((combinedCount - thisIdx) - startAfter) * (step / 100);

			if(combinedCount - thisIdx <= startAfter) {
				opacity = 1;
			}

			filterList.push(`opacity(${opacity})`);
		} else {
			filterList.push(`opacity(1)`);
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
			$(this).children(".overallWrapper").css("filter", filterList.join(" "));
		}
		if(transformList.length) {
			$(this).children(".overallWrapper").css("transform", transformList.join(" "));
		}
	});
}

function checkFilterAnimationSettings() {
	let settingChecks = Object.keys(animationFilterFunctions);

	let allowIn = {
		start: [],
		end: []
	};
	let allowOut = {
		start: [],
		end: []
	};

	for(let i in settingChecks) {
		let set = settingChecks[i];

		if(localStorage.getItem(`setting_messageIn${set}Start`) !== localStorage.getItem(`setting_messageIn${set}End`)) {
			allowIn.start.push(animationFilterFunctions[set].incoming.start);
			allowIn.end.push(animationFilterFunctions[set].incoming.end);
		}
		if(localStorage.getItem(`setting_messageOut${set}Start`) !== localStorage.getItem(`setting_messageOut${set}End`)) {
			allowOut.start.push(animationFilterFunctions[set].outgoing.start);
			allowOut.end.push(animationFilterFunctions[set].outgoing.end);
		}
	}

	rootCSS().setProperty("--messageInFilterFunctionsStart", allowIn.start.join(" "));
	rootCSS().setProperty("--messageInFilterFunctionsEnd", allowIn.end.join(" "));
	rootCSS().setProperty("--messageOutFilterFunctionsStart", allowOut.start.join(" "));
	rootCSS().setProperty("--messageOutFilterFunctionsEnd", allowOut.end.join(" "));
}

function checkTransformAnimationSettings() {
	let allowIn = {
		start: [],
		end: []
	};
	let allowOut = {
		start: [],
		end: []
	};

	let directions = ["In", "Out"];
	for(let i in directions) {
		let direction = directions[i];
		let allowObject = (direction === "In" ? allowIn : allowOut);

		if(localStorage.getItem(`setting_message${direction}XTransformStart`) !== localStorage.getItem(`setting_message${direction}XTransformEnd`)
		   || localStorage.getItem(`setting_message${direction}YTransformStart`) !== localStorage.getItem(`setting_message${direction}YTransformEnd`)) {
			allowObject.start.push(`var(--currentMessage${direction}TranslateFunctionStart)`);
			allowObject.end.push(`var(--currentMessage${direction}TranslateFunctionEnd)`);
		}

		if(localStorage.getItem(`setting_message${direction}ScaleXStart`) !== localStorage.getItem(`setting_message${direction}ScaleXEnd`)
		   || localStorage.getItem(`setting_message${direction}ScaleYStart`) !== localStorage.getItem(`setting_message${direction}ScaleYEnd`)) {
			allowObject.start.push(`scale(var(--message${direction}ScaleXStart), var(--message${direction}ScaleYStart))`);
			allowObject.end.push(`scale(var(--message${direction}ScaleXEnd), var(--message${direction}ScaleYEnd))`);
		}

		if(localStorage.getItem(`setting_message${direction}SkewXStart`) !== localStorage.getItem(`setting_message${direction}SkewXEnd`)
		   || localStorage.getItem(`setting_message${direction}SkewYStart`) !== localStorage.getItem(`setting_message${direction}SkewYEnd`)) {
			allowObject.start.push(`skew(var(--message${direction}SkewXStart), var(--message${direction}SkewYStart))`);
			allowObject.end.push(`skew(var(--message${direction}SkewXEnd), var(--message${direction}SkewYEnd))`);
		}

		if(localStorage.getItem(`setting_message${direction}RotateStart`) !== localStorage.getItem(`setting_message${direction}RotateEnd`)) {
			allowObject.start.push(`rotate(var(--message${direction}RotateStart))`);
			allowObject.end.push(`rotate(var(--message${direction}RotateEnd))`);
		}
	}

	rootCSS().setProperty("--messageInTransformFunctionsStart", allowIn.start.join(" "));
	rootCSS().setProperty("--messageInTransformFunctionsEnd", allowIn.end.join(" "));
	rootCSS().setProperty("--messageOutTransformFunctionsStart", allowOut.start.join(" "));
	rootCSS().setProperty("--messageOutTransformFunctionsEnd", allowOut.end.join(" "));
}

var consoleHolder = console;
var hasInitConsoleOverride = false;

var subTiers = {
	"Prime": "Twitch Prime",
	"1000": "Tier 1",
	"2000": "Tier 2",
	"3000": "Tier 3"
};

function checkIfBadgesVisible() {
	$(".badges").each(function(rootIdx) {
		let rootElem = $(this);

		rootElem.children(".badgeWrap").each(function(badgeIdx) {
			let badgeElem = $(this);

			if(badgeElem.is(":visible")) {
				rootElem.show();
			}
		});
	});
}

const settingUpdaters = {
	chatHideAccounts: function(value) {
		hideAccounts = [];
		if(value) {
			hideAccounts = value.toLowerCase().split("\n");
		}
	},

	enable7TV: function(value) {
		if(value === "true") {
			if(localStorage.getItem("setting_enable7TVBadges") === "true") {
				rootCSS().setProperty("--display7TVBadges", "initial");
			} else {
				rootCSS().setProperty("--display7TVBadges", "none");
			}
		} else {
			rootCSS().setProperty("--display7TVBadges", "none");
		}

		checkIfBadgesVisible();
	},
	enableBTTV: function(value) {
		if(value === "true") {
			if(localStorage.getItem("setting_enableBTTVBadges") === "true") {
				rootCSS().setProperty("--displayBTTVBadges", "initial");
			} else {
				rootCSS().setProperty("--displayBTTVBadges", "none");
			}
		} else {
			rootCSS().setProperty("--displayBTTVBadges", "none");
		}

		checkIfBadgesVisible();
	},
	enableFFZ: function(value) {
		if(value === "true") {
			if(localStorage.getItem("setting_enableFFZBadges") === "true") {
				rootCSS().setProperty("--displayFFZBadges", "initial");
			} else {
				rootCSS().setProperty("--displayFFZBadges", "none");
			}
		} else {
			rootCSS().setProperty("--displayFFZBadges", "none");
		}

		checkIfBadgesVisible();
	},
	enable7TVBadges: function(value) {
		if(value === "true") {
			if(localStorage.getItem("setting_enable7TV") === "true") {
				rootCSS().setProperty("--display7TVBadges", "initial");
			} else {
				rootCSS().setProperty("--display7TVBadges", "none");
			}
		} else {
			rootCSS().setProperty("--display7TVBadges", "none");
		}

		checkIfBadgesVisible();
	},
	enableBTTVBadges: function(value) {
		if(value === "true") {
			if(localStorage.getItem("setting_enableBTTV") === "true") {
				rootCSS().setProperty("--displayBTTVBadges", "initial");
			} else {
				rootCSS().setProperty("--displayBTTVBadges", "none");
			}
		} else {
			rootCSS().setProperty("--displayBTTVBadges", "none");
		}

		checkIfBadgesVisible();
	},
	enableFFZBadges: function(value) {
		if(value === "true") {
			if(localStorage.getItem("setting_enableFFZ") === "true") {
				rootCSS().setProperty("--displayFFZBadges", "initial");
			} else {
				rootCSS().setProperty("--displayFFZBadges", "none");
			}
		} else {
			rootCSS().setProperty("--displayFFZBadges", "none");
		}

		checkIfBadgesVisible();
	},
	enableBotBadges: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--displayBotBadges", "initial");
		} else {
			rootCSS().setProperty("--displayBotBadges", "none");
		}

		checkIfBadgesVisible();
	},
	enableAffiliateBadges: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--displayAffiliateBadges", "initial");
		} else {
			rootCSS().setProperty("--displayAffiliateBadges", "none");
		}

		checkIfBadgesVisible();
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
		rootCSS().setProperty("--overlayOutlineSizeNegative", `-${value}px`);
		rootCSS().setProperty("--overlayOutlineBlurRadius", `${parseFloat(value)-1}px`);
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
		checkTransformAnimationSettings();
	},
	messageInXTransformEnd: function(value) {
		rootCSS().setProperty("--messageInXTransformEnd", `${value}vw`);
		checkTransformAnimationSettings();
	},
	messageInYTransformStart: function(value) {
		rootCSS().setProperty("--messageInYTransformStart", `${value}vh`);
		checkTransformAnimationSettings();
	},
	messageInYTransformEnd: function(value) {
		rootCSS().setProperty("--messageInYTransformEnd", `${value}vh`);
		checkTransformAnimationSettings();
	},
	messageInBlurStart: function(value) {
		rootCSS().setProperty("--messageInBlurStart", `${value}px`);
		checkFilterAnimationSettings();
	},
	messageInBlurEnd: function(value) {
		rootCSS().setProperty("--messageInBlurEnd", `${value}px`);
		checkFilterAnimationSettings();
	},
	messageInScaleXStart: function(value) {
		rootCSS().setProperty("--messageInScaleXStart", `${value}%`);
		checkTransformAnimationSettings();
	},
	messageInScaleXEnd: function(value) {
		rootCSS().setProperty("--messageInScaleXEnd", `${value}%`);
		checkTransformAnimationSettings();
	},
	messageInScaleYStart: function(value) {
		rootCSS().setProperty("--messageInScaleYStart", `${value}%`);
		checkTransformAnimationSettings();
	},
	messageInScaleYEnd: function(value) {
		rootCSS().setProperty("--messageInScaleYEnd", `${value}%`);
		checkTransformAnimationSettings();
	},
	messageInSkewXStart: function(value) {
		rootCSS().setProperty("--messageInSkewXStart", `${value}deg`);
		checkTransformAnimationSettings();
	},
	messageInSkewXEnd: function(value) {
		rootCSS().setProperty("--messageInSkewXEnd", `${value}deg`);
		checkTransformAnimationSettings();
	},
	messageInSkewYStart: function(value) {
		rootCSS().setProperty("--messageInSkewYStart", `${value}deg`);
		checkTransformAnimationSettings();
	},
	messageInSkewYEnd: function(value) {
		rootCSS().setProperty("--messageInSkewYEnd", `${value}deg`);
		checkTransformAnimationSettings();
	},
	messageInRotateStart: function(value) {
		rootCSS().setProperty("--messageInRotateStart", `${value}deg`);
		checkTransformAnimationSettings();
	},
	messageInRotateEnd: function(value) {
		rootCSS().setProperty("--messageInRotateEnd", `${value}deg`);
		checkTransformAnimationSettings();
	},
	messageInBrightnessStart: function(value) {
		rootCSS().setProperty("--messageInBrightnessStart", `${value}%`);
		checkFilterAnimationSettings();
	},
	messageInBrightnessEnd: function(value) {
		rootCSS().setProperty("--messageInBrightnessEnd", `${value}%`);
		checkFilterAnimationSettings();
	},
	messageInContrastStart: function(value) {
		rootCSS().setProperty("--messageInContrastStart", `${value}%`);
		checkFilterAnimationSettings();
	},
	messageInContrastEnd: function(value) {
		rootCSS().setProperty("--messageInContrastEnd", `${value}%`);
		checkFilterAnimationSettings();
	},
	messageInSaturateStart: function(value) {
		rootCSS().setProperty("--messageInSaturateStart", `${value}%`);
		checkFilterAnimationSettings();
	},
	messageInSaturateEnd: function(value) {
		rootCSS().setProperty("--messageInSaturateEnd", `${value}%`);
		checkFilterAnimationSettings();
	},
	messageInHueRotateStart: function(value) {
		rootCSS().setProperty("--messageInHueRotateStart", `${value}deg`);
		checkFilterAnimationSettings();
	},
	messageInHueRotateEnd: function(value) {
		rootCSS().setProperty("--messageInHueRotateEnd", `${value}deg`);
		checkFilterAnimationSettings();
	},
	messageOutOpacityStart: function(value) {
		rootCSS().setProperty("--messageOutOpacityStart", `${value}%`);
	},
	messageOutOpacityEnd: function(value) {
		rootCSS().setProperty("--messageOutOpacityEnd", `${value}%`);
	},
	messageOutXTransformStart: function(value) {
		rootCSS().setProperty("--messageOutXTransformStart", `${value}vw`);
		checkTransformAnimationSettings();
	},
	messageOutXTransformEnd: function(value) {
		rootCSS().setProperty("--messageOutXTransformEnd", `${value}vw`);
		checkTransformAnimationSettings();
	},
	messageOutYTransformStart: function(value) {
		rootCSS().setProperty("--messageOutYTransformStart", `${value}vh`);
		checkTransformAnimationSettings();
	},
	messageOutYTransformEnd: function(value) {
		rootCSS().setProperty("--messageOutYTransformEnd", `${value}vh`);
		checkTransformAnimationSettings();
	},
	messageOutBlurStart: function(value) {
		rootCSS().setProperty("--messageOutBlurStart", `${value}px`);
		checkFilterAnimationSettings();
	},
	messageOutBlurEnd: function(value) {
		rootCSS().setProperty("--messageOutBlurEnd", `${value}px`);
		checkFilterAnimationSettings();
	},
	messageOutScaleXStart: function(value) {
		rootCSS().setProperty("--messageOutScaleXStart", `${value}%`);
		checkTransformAnimationSettings();
	},
	messageOutScaleXEnd: function(value) {
		rootCSS().setProperty("--messageOutScaleXEnd", `${value}%`);
		checkTransformAnimationSettings();
	},
	messageOutScaleYStart: function(value) {
		rootCSS().setProperty("--messageOutScaleYStart", `${value}%`);
		checkTransformAnimationSettings();
	},
	messageOutScaleYEnd: function(value) {
		rootCSS().setProperty("--messageOutScaleYEnd", `${value}%`);
		checkTransformAnimationSettings();
	},
	messageOutSkewXStart: function(value) {
		rootCSS().setProperty("--messageOutSkewXStart", `${value}deg`);
		checkTransformAnimationSettings();
	},
	messageOutSkewXEnd: function(value) {
		rootCSS().setProperty("--messageOutSkewXEnd", `${value}deg`);
		checkTransformAnimationSettings();
	},
	messageOutSkewYStart: function(value) {
		rootCSS().setProperty("--messageOutSkewYStart", `${value}deg`);
		checkTransformAnimationSettings();
	},
	messageOutSkewYEnd: function(value) {
		rootCSS().setProperty("--messageOutSkewYEnd", `${value}deg`);
		checkTransformAnimationSettings();
	},
	messageOutRotateStart: function(value) {
		rootCSS().setProperty("--messageOutRotateStart", `${value}deg`);
		checkTransformAnimationSettings();
	},
	messageOutRotateEnd: function(value) {
		rootCSS().setProperty("--messageOutRotateEnd", `${value}deg`);
		checkTransformAnimationSettings();
	},
	messageOutBrightnessStart: function(value) {
		rootCSS().setProperty("--messageOutBrightnessStart", `${value}%`);
		checkFilterAnimationSettings();
	},
	messageOutBrightnessEnd: function(value) {
		rootCSS().setProperty("--messageOutBrightnessEnd", `${value}%`);
		checkFilterAnimationSettings();
	},
	messageOutContrastStart: function(value) {
		rootCSS().setProperty("--messageOutContrastStart", `${value}%`);
		checkFilterAnimationSettings();
	},
	messageOutContrastEnd: function(value) {
		rootCSS().setProperty("--messageOutContrastEnd", `${value}%`);
		checkFilterAnimationSettings();
	},
	messageOutSaturateStart: function(value) {
		rootCSS().setProperty("--messageOutSaturateStart", `${value}%`);
		checkFilterAnimationSettings();
	},
	messageOutSaturateEnd: function(value) {
		rootCSS().setProperty("--messageOutSaturateEnd", `${value}%`);
		checkFilterAnimationSettings();
	},
	messageOutHueRotateStart: function(value) {
		rootCSS().setProperty("--messageOutHueRotateStart", `${value}deg`);
		checkFilterAnimationSettings();
	},
	messageOutHueRotateEnd: function(value) {
		rootCSS().setProperty("--messageOutHueRotateEnd", `${value}deg`);
		checkFilterAnimationSettings();
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
		if("newMsg" in sounds) {
			if(sounds["newMsg"].value !== value) {
				initSoundMetadata();
			}
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
	},

	avatarsBGSize: function(value) {
		rootCSS().setProperty("--avatarsBGSize", `${value}px`);
	},
	avatarsBGHorizontalPadding: function(value) {
		rootCSS().setProperty("--avatarsBGHorizontalPadding", `${value}px`);
	},
	avatarsBGVerticalPadding: function(value) {
		rootCSS().setProperty("--avatarsBGVerticalPadding", `${value}px`);
	},
	avatarsBGBorderRadius: function(value) {
		rootCSS().setProperty("--avatarsBGBorderRadius", `${value}px`);
	},
	avatarsBGMagnification: function(value) {
		rootCSS().setProperty("--avatarsBGMagnification", `${value}%`);
	},
	avatarsBGStartOpacity: function(value) {
		rootCSS().setProperty("--avatarsBGStartOpacity", value/100);
	},
	avatarsBGEndOpacity: function(value) {
		rootCSS().setProperty("--avatarsBGEndOpacity", value/100);
	},
	avatarsBGStartFadeAt: function(value) {
		rootCSS().setProperty("--avatarsBGStartFadeAt", `${value}%`);
	},
	avatarsBGEndFadeAt: function(value) {
		rootCSS().setProperty("--avatarsBGEndFadeAt", `${value}%`);
	},
	avatarsBGFadeAngle: function(value) {
		rootCSS().setProperty("--avatarsBGFadeAngle", `${value}deg`);
		rootCSS().setProperty("--avatarsBGFadeAngleNegative", `-${value}deg`);
	},
	enableAvatarsBGShadow: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--shadowStuffAvatarBG", "var(--originalShadowStuff)");
		} else {
			rootCSS().setProperty("--shadowStuffAvatarBG", "drop-shadow(0px 0px 0px transparent)");
		}
	},
	enableAvatarsBGOutline: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--outlineStuffAvatarBG", "var(--originalOutlineStuff)");
		} else {
			rootCSS().setProperty("--outlineStuffAvatarBG", "drop-shadow(0px 0px 0px transparent)");
		}
	},
	avatarsBGBlurAmount: function(value) {
		rootCSS().setProperty("--avatarsBGBlurAmount", `${value}px`);
	},

	applyGradientToBadges: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--badgeGradientDisplay", "block");
		} else {
			rootCSS().setProperty("--badgeGradientDisplay", "none");
		}
	},
	badgeGradientColorStart: function(value) {
		rootCSS().setProperty("--badgeGradientColorStart", value);
	},
	badgeGradientColorEnd: function(value) {
		rootCSS().setProperty("--badgeGradientColorEnd", value);
	},
	badgeGradientAngle: function(value) {
		rootCSS().setProperty("--badgeGradientAngle", `${value}deg`);
	},
	badgeGradientStart: function(value) {
		rootCSS().setProperty("--badgeGradientStart", `${value}%`);
	},
	badgeGradientEnd: function(value) {
		rootCSS().setProperty("--badgeGradientEnd", `${value}%`);
	},
	badgeGradientBlendMode: function(value) {
		rootCSS().setProperty("--badgeGradientBlendMode", value);
	},

	eventTagsColor: function(value) {
		rootCSS().setProperty("--eventTagsColor", value);
	},
	eventTagsFont: function(value) {
		rootCSS().setProperty("--eventTagsFont", value);
	},
	eventTagsFontSize: function(value) {
		rootCSS().setProperty("--eventTagsFontSize", `${value}pt`);
	},
	eventTagsFontWeight: function(value) {
		rootCSS().setProperty("--eventTagsFontWeight", value);
	},
	eventTagsFontWeightExtra: function(value) {
		rootCSS().setProperty("--eventTagsFontWeightExtra", `${value}px`);
	},
	eventTagsLetterSpacing: function(value) {
		rootCSS().setProperty("--eventTagsLetterSpacing", `${value}px`);
	},
	eventTagsTransform: function(value) {
		rootCSS().setProperty("--eventTagsTransform", value);
	},
	eventTagsLineHeight: function(value) {
		rootCSS().setProperty("--eventTagsLineHeight", `${value}px`);
	},

	avatarsBGAnimationDuration: function(value) {
		rootCSS().setProperty("--avatarsBGAnimationDuration", `${value}s`);
	},
	avatarsBGAnimationDelay: function(value) {
		rootCSS().setProperty("--avatarsBGAnimationDelay", `${value}s`);
	},
	avatarsBGAnimationTimingFunc: function(value) {
		rootCSS().setProperty("--avatarsBGAnimationTimingFunc", `var(--timingFunc${value})`);
	},

	use3dTransformsOnAnimations: function(value) {
		let which = 2;
		if(value === "true") {
			which = 3;
		}

		rootCSS().setProperty("--currentMessageInTranslateFunctionStart", `var(--messageInTranslate${which}dFunctionStart)`);
		rootCSS().setProperty("--currentMessageInTranslateFunctionEnd", `var(--messageInTranslate${which}dFunctionEnd)`);
		rootCSS().setProperty("--currentMessageOutTranslateFunctionStart", `var(--messageOutTranslate${which}dFunctionStart)`);
		rootCSS().setProperty("--currentMessageOutTranslateFunctionEnd", `var(--messageOutTranslate${which}dFunctionEnd)`);
	},

	avatarsBGBorder: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--avatarsBGBorderSize", "var(--avatarsBGBorderSizeActual)");
			rootCSS().setProperty("--avatarsBGBorderOffset", "calc(var(--avatarsBGBorderSizeActual) * -1)");
		} else {
			rootCSS().setProperty("--avatarsBGBorderSize", "0px");
			rootCSS().setProperty("--avatarsBGBorderOffset", "0px");
		}
	},
	avatarsBGBorderColor: function(value) {
		rootCSS().setProperty("--avatarsBGBorderColor", value);
	},
	avatarsBGBorderSize: function(value) {
		rootCSS().setProperty("--avatarsBGBorderSizeActual", `${value}px`);
	},
	avatarsBGBorderStyle: function(value) {
		rootCSS().setProperty("--avatarsBGBorderStyle", value);
	},

	allowConsoleMessages: function(value, oldValue) {
		if(hasInitConsoleOverride && value === oldValue) {
			return;
		}
		hasInitConsoleOverride = true;

		if(value === "false") {
			consoleHolder = console;
			console = {};
			Object.keys(consoleHolder).forEach(function(key) {
				console[key] = function(){};
			});
		} else {
			console = consoleHolder;
		}
	},

	internationalNameSaturation: function(value) {
		rootCSS().setProperty("--internationalNameSaturation", `${value}%`);
	},
	internationalNameMargin: function(value) {
		rootCSS().setProperty("--internationalNameMargin", `${value}px`);
	},
	internationalNameSize: function(value) {
		rootCSS().setProperty("--internationalNameSize", `${value}%`);
	},
	internationalNameWeightScaling: function(value) {
		rootCSS().setProperty("--internationalNameWeightScaling", `${parseFloat(value)/100}`);
	},

	gradientFadeMaskEnabled: function(value) {
		if(value === "true") {
			$("#maskWrapper").addClass("maskEnabled");
		} else {
			$("#maskWrapper").removeClass("maskEnabled");
		}
	},
	gradientFadeMaskAngle: function(value) {
		rootCSS().setProperty("--gradientFadeMaskAngle", `${value}deg`);
	},
	gradientFadeMaskStart: function(value) {
		rootCSS().setProperty("--gradientFadeMaskStart", `${value}%`);
	},
	gradientFadeMaskEnd: function(value) {
		rootCSS().setProperty("--gradientFadeMaskEnd", `${value}%`);
	},

	messageBlockDirection: function(value) {
		let which = "column";
		
		if(value === "true") {
			which = "column-reverse";
		}

		rootCSS().setProperty("--messageBlockDirection", which);
	},

	eventTagsPlanNamePrime: function(value) { subTiers["Prime"] = value; },
	eventTagsPlanNameTier1: function(value) { subTiers["1000"] = value; },
	eventTagsPlanNameTier2: function(value) { subTiers["2000"] = value; },
	eventTagsPlanNameTier3: function(value) { subTiers["3000"] = value; },

	messageOffsetVertical: function(value) {
		rootCSS().setProperty("--messageOffsetVertical", `${value}px`);
	},
	messageOffsetHorizontal: function(value) {
		rootCSS().setProperty("--messageOffsetHorizontal", `${value}px`);
	},
	userInfoOffsetVertical: function(value) {
		rootCSS().setProperty("--userInfoOffsetVertical", `${value}px`);
	},
	userInfoOffsetHorizontal: function(value) {
		rootCSS().setProperty("--userInfoOffsetHorizontal", `${value}px`);
	},

	chatNameFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--nameFontStyle", "italic");
		} else {
			rootCSS().setProperty("--nameFontStyle", "normal");
		}
	},
	chatMessageFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--messageFontStyle", "italic");
		} else {
			rootCSS().setProperty("--messageFontStyle", "normal");
		}
	},
	eventTagsFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--eventTagsFontStyle", "italic");
		} else {
			rootCSS().setProperty("--eventTagsFontStyle", "normal");
		}
	},
	pronounsFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--pronounsFontStyle", "italic");
		} else {
			rootCSS().setProperty("--pronounsFontStyle", "normal");
		}
	},
	timestampFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--timestampFontStyle", "italic");
		} else {
			rootCSS().setProperty("--timestampFontStyle", "normal");
		}
	},
	chatMessageBackgroundColor: function(value) {
		rootCSS().setProperty("--messageBackgroundColor", value);
	},

	chatMessagePaddingVertical: function(value) {
		rootCSS().setProperty("--messagePaddingVertical", `${value}px`);
	},
	chatMessagePaddingHorizontal: function(value) {
		rootCSS().setProperty("--messagePaddingHorizontal", `${value}px`);
	},
	chatMessageBorderRadius: function(value) {
		rootCSS().setProperty("--messageBorderRadius", `${value}px`);
	},

	chatMessageOutlines: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--messageOutlineSize", "var(--messageOutlineSizeActual)");
		} else {
			rootCSS().setProperty("--messageOutlineSize", "0px");
		}
	},
	chatMessageOutlinesColor: function(value) {
		rootCSS().setProperty("--messageOutlineColor", value);
	},
	chatMessageOutlinesSize: function(value) {
		rootCSS().setProperty("--messageOutlineSizeActual", `${value}px`);
	},
	chatMessageOutlinesStyle: function(value) {
		rootCSS().setProperty("--messageOutlineStyle", value);
	},

	enableBadgeBorder: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--badgeBorderSize", "var(--badgeBorderSizeActual)");
		} else {
			rootCSS().setProperty("--badgeBorderSize", "0px");
		}		
	},
	badgeBorderSize: function(value) {
		rootCSS().setProperty("--badgeBorderSizeActual", `${value}px`);
	},
	badgeBorderColor: function(value) {
		rootCSS().setProperty("--badgeBorderColor", value);
	},
	badgeBorderStyle: function(value) {
		rootCSS().setProperty("--badgeBorderStyle", value);
	}
};
settingUpdaters["chatHideAccounts"](localStorage.getItem("setting_chatHideAccounts"));

function updateSetting(which, value, oldValue) {
	if(which.indexOf("setting_") === -1) {
		return;
	}

	let setting = which.substr(8);

	if(setting in settingUpdaters) {
		console.log(`setting ${setting} updated`);
		settingUpdaters[setting](value, oldValue);
	}
}
window.addEventListener("storage", function(event) {
	updateSetting(event.key, event.newValue, event.oldValue);
});