const settings = {
	cache: {
		expireDelay: 604800
	}
};

var identityFlags = {};
async function grabFlags() {
	const response = await fetch("../chat-customizer/api/lib/flags.json");
	if(!response.ok) {
		return;
	}

	identityFlags = await response.json();
}

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
		} else {
			$(this).children(".overallWrapper").css("filter", "opacity(1)");
		}
		if(transformList.length) {
			$(this).children(".overallWrapper").css("transform", transformList.join(" "));
		} else {
			$(this).children(".overallWrapper").css("transform", "unset");
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
		rootElem.show();

		let badgesArePresent = false;

		rootElem.children(".badgeWrap").each(function(badgeIdx) {
			let badgeElem = $(this);

			if(badgeElem.is(":visible")) {
				badgesArePresent = true;
				rootElem.show();
			}
		});

		if(badgesArePresent) {
			rootElem.show();
		} else {
			rootElem.hide();
		}
	});
}

var LQImageCheck = false;
const settingUpdaters = {
	chatHideAccounts: function(value) {
		hideAccounts = [];
		if(value) {
			hideAccounts = value.toLowerCase().split("\n");
		}
	},

	enable7TV: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--display7TVBadges", (localStorage.getItem("setting_enable7TVBadges") === "true" ? "initial" : "none"));
		} else {
			rootCSS().setProperty("--display7TVBadges", "none");
		}

		checkIfBadgesVisible();
	},
	enableBTTV: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--displayBTTVBadges", (localStorage.getItem("setting_enableBTTVBadges") === "true" ? "initial" : "none"));
		} else {
			rootCSS().setProperty("--displayBTTVBadges", "none");
		}

		checkIfBadgesVisible();
	},
	enableFFZ: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--displayFFZBadges", (localStorage.getItem("setting_enableFFZBadges") === "true" ? "initial" : "none"));
		} else {
			rootCSS().setProperty("--displayFFZBadges", "none");
		}

		checkIfBadgesVisible();
	},
	enable7TVBadges: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--display7TVBadges", (localStorage.getItem("setting_enable7TV") === "true" ? "initial" : "none"));
		} else {
			rootCSS().setProperty("--display7TVBadges", "none");
		}

		checkIfBadgesVisible();
	},
	enableBTTVBadges: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--displayBTTVBadges", (localStorage.getItem("setting_enableBTTV") === "true" ? "initial" : "none"));
		} else {
			rootCSS().setProperty("--displayBTTVBadges", "none");
		}

		checkIfBadgesVisible();
	},
	enableFFZBadges: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--displayFFZBadges", (localStorage.getItem("setting_enableFFZ") === "true" ? "initial" : "none"));
		} else {
			rootCSS().setProperty("--displayFFZBadges", "none");
		}

		checkIfBadgesVisible();
	},
	enableBotBadges: function(value) {
		rootCSS().setProperty("--displayBotBadges", (value === "true" ? "initial" : "none"));
		checkIfBadgesVisible();
	},
	enableAffiliateBadges: function(value) {
		rootCSS().setProperty("--displayAffiliateBadges", (value === "true" ? "initial" : "none"));
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
		rootCSS().setProperty("--nameFontSizeNum", value);
		rootCSS().setProperty("--nameFontSize", `${value}pt`);
	},
	chatMessageFontSize: function(value) {
		rootCSS().setProperty("--messageFontSizeNum", value);
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
		rootCSS().setProperty("--chatBlockOutlineSize", (value === "true" ? "var(--chatBlockOutlineSizeActual)" : "0px"));
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
		rootCSS().setProperty("--shadowStuff", (value === "true" ? "url(#shadowEffect)" : "url(#blankEffect)"));
	},
	chatOutlinesFilter: function(value) {
		rootCSS().setProperty("--outlineStuff", (value === "true" ? "url(#outlineEffect)" : "url(#blankEffect)"));
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
		let pos = value.split(",");

		if(pos[0] === "top") {
			$("#wrapper").removeClass("bottom").addClass("top");
		} else {
			$("#wrapper").removeClass("top").addClass("bottom");
		}

		$(".chatBlock").removeClass("left").removeClass("right")

		if(localStorage.getItem("setting_alternateCornerAlignment") === "true") {
			const order = [pos[1], (pos[1] === "left" ? "right" : "left")];

			$(".chatBlock").each(function() {
				let idx = parseInt($(this).attr("data-rootidx"));
				$(this).addClass(order[idx % 2]);
			});
		} else {
			if(pos[1] === "left") {
				$(".chatBlock").addClass("left");
				rootCSS().setProperty("--bsrInfoDirection", "ltr");
				rootCSS().setProperty("--elementFlowHorizontalAlignmentValue", "row");
			} else {
				$(".chatBlock").addClass("right");
				rootCSS().setProperty("--bsrInfoDirection", "rtl");
				rootCSS().setProperty("--elementFlowHorizontalAlignmentValue", "row-reverse");
			}
		}
	},

	alternateCornerAlignment: function(value) {
		settingUpdaters.chatCornerAlignment(localStorage.getItem("setting_chatCornerAlignment"));
	},

	chatMessageLineHeight: function(value) {
		rootCSS().setProperty("--messageLineHeightNum", value);
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
			case "circle": rootCSS().setProperty("--avatarBorderRadius", "50%"); break;
			case "squircle": rootCSS().setProperty("--avatarBorderRadius", "30%"); break;
			case "square": rootCSS().setProperty("--avatarBorderRadius", "0%"); break;
		}
	},

	overlayShadowColor: function(value) {
		rootCSS().setProperty("--overlayShadowColor", value);
	},
	overlayShadowXOffset: function(value) {
		$("feDropShadow").attr("dx", value);
	},
	overlayShadowYOffset: function(value) {
		$("feDropShadow").attr("dy", value);
	},
	overlayShadowBlurRadius: function(value) {
		$("feDropShadow").attr("stdDeviation", value);
	},
	overlayOutlineColor: function(value) {
		rootCSS().setProperty("--overlayOutlineColor", value);
	},
	overlayOutlineDivisor: function(value) {
		$("feConvolveMatrix").attr("divisor", value);
	},
	overlayOutlineOrder: function(value) {
		value = parseInt(value);
		let matrix;
		if(value >= 3 && localStorage.getItem("setting_overlayOutlineStripCorners") === "true") {
			matrix = getSmoothMatrix(value, parseFloat(localStorage.getItem("setting_overlayOutlineThreshold")));
		} else {
			matrix = new Array(Math.pow(value, 2)).fill(1);
		}

		$("feConvolveMatrix").attr("order", `${value},${value}`);
		$("feConvolveMatrix").attr("kernelMatrix", matrix.join(" "));
	},
	overlayOutlineStripCorners: function() {
		settingUpdaters.overlayOutlineOrder(localStorage.getItem("setting_overlayOutlineOrder"));
	},
	overlayOutlineThreshold: function() {
		settingUpdaters.overlayOutlineOrder(localStorage.getItem("setting_overlayOutlineOrder"));
	},

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
		rootCSS().setProperty("--pronounsGradient", (value === "true" ? "linear-gradient(var(--pronounsGradientAngle), var(--pronounsColorSecondary) -20%, transparent 100%)" : "none"));
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
		rootCSS().setProperty("--messageBoldAmountNum", `${value}`);
		rootCSS().setProperty("--messageBoldAmount", `${value}px`);
	},

	timestampColor: function(value) {
		rootCSS().setProperty("--timestampColor", value);
	},
	timestampUsesGradient: function(value) {
		rootCSS().setProperty("--timestampGradient", (value === "true" ? "linear-gradient(var(--timestampGradientAngle), var(--timestampColorSecondary) -20%, transparent 100%)" : "none"));
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
		rootCSS().setProperty("--subBadgeBorderRadius", (value === "true" ? "var(--badgeBorderRadius)" : "0px"));
	},

	chatMessageUserInfoOutlines: function(value) {
		rootCSS().setProperty("--userInfoOutlineSize", (value === "true" ? "var(--userInfoOutlineSizeActual)" : "0px"));
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
		rootCSS().setProperty("--overlayWidth", (value === "true" ? "var(--overlayWidthActual)" : "100vw"));
	},
	overlayWidth: function(value) {
		rootCSS().setProperty("--overlayWidthActual", `${value}px`);
	},

	chatMessageEnableSeparators: function(value) {
		rootCSS().setProperty("--messageSeparatorWidth", (value === "true" ? "var(--messageSeparatorWidthActual)" : "0px"));
		rootCSS().setProperty("--messageSeparatorSpacing", (value === "true" ? "var(--messageSeparatorSpacingActual)" : "0px"));
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
		rootCSS().setProperty("--nameBackground", (value === "true" ? "var(--nameBackgroundDefault)" : "var(--nameBackgroundNoGradientDefault)"));	
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
			try {
				noise.stop();
				noise = new AudioBufferSourceNode(context, {
					buffer: noiseBuffer,
					loop: true
				});
				noise.connect(noiseGain).connect(noiseLowPassFilter).connect(context.destination);
				noise.start();
			} catch {}
		} else {
			noiseGain.gain.value = 0;
			try {
				noise.stop();
			} catch {}
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
	avatarsBGBlurAmount: function(value) {
		rootCSS().setProperty("--avatarsBGBlurAmount", `${value}px`);
	},

	applyGradientToBadges: function(value) {
		rootCSS().setProperty("--badgeGradientDisplay", (value === "true" ? "block" : "none"));
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
		const browserVersion = parseInt(navigator.userAgent.substring(navigator.userAgent.indexOf("Chrome")+7));
		if(browserVersion < 100 && value === "plus-lighter") {
			value = "screen";
		}
		
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
		let which = (value === "true" ? 3 : 2);

		rootCSS().setProperty("--currentMessageInTranslateFunctionStart", `var(--messageInTranslate${which}dFunctionStart)`);
		rootCSS().setProperty("--currentMessageInTranslateFunctionEnd", `var(--messageInTranslate${which}dFunctionEnd)`);
		rootCSS().setProperty("--currentMessageOutTranslateFunctionStart", `var(--messageOutTranslate${which}dFunctionStart)`);
		rootCSS().setProperty("--currentMessageOutTranslateFunctionEnd", `var(--messageOutTranslate${which}dFunctionEnd)`);
	},

	avatarsBGBorder: function(value) {
		rootCSS().setProperty("--avatarsBGBorderSize", (value === "true" ? "var(--avatarsBGBorderSizeActual)" : "0px"));
		rootCSS().setProperty("--avatarsBGBorderOffset", (value === "true" ? "calc(var(--avatarsBGBorderSizeActual) * -1)" : "0px"));
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
		rootCSS().setProperty("--messageBlockDirection", (value === "true" ? "column-reverse" : "column"));
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
		rootCSS().setProperty("--nameFontStyle", (value === "true" ? "italic" : "normal"));
	},
	chatMessageFontItalic: function(value) {
		rootCSS().setProperty("--messageFontStyle", (value === "true" ? "italic" : "normal"));
	},
	eventTagsFontItalic: function(value) {
		rootCSS().setProperty("--eventTagsFontStyle", (value === "true" ? "italic" : "normal"));
	},
	pronounsFontItalic: function(value) {
		rootCSS().setProperty("--pronounsFontStyle", (value === "true" ? "italic" : "normal"));
	},
	timestampFontItalic: function(value) {
		rootCSS().setProperty("--timestampFontStyle", (value === "true" ? "italic" : "normal"));
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
		rootCSS().setProperty("--messageOutlineSize", (value === "true" ? "var(--messageOutlineSizeActual)" : "0px"));
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
		rootCSS().setProperty("--badgeBorderSize", (value === "true" ? "var(--badgeBorderSizeActual)" : "0px"));	
	},
	badgeBorderSize: function(value) {
		rootCSS().setProperty("--badgeBorderSizeActual", `${value}px`);
	},
	badgeBorderColor: function(value) {
		rootCSS().setProperty("--badgeBorderColor", value);
	},
	badgeBorderStyle: function(value) {
		rootCSS().setProperty("--badgeBorderStyle", value);
	},
	pronounsSeparator: function(value) {
		twitchUsers.refreshPronounStrings();
	},
	enableAvatarsAsBackground: function(value) {
		checkAvatarPermissions();
	},
	chatUsersThatAreBots: function(value) {
		manualBotOverrides.add = value.split("\n").map((account) => { return account.trim().toLowerCase();}).filter((account) => { return account.length > 0; });
		twitchUsers.refreshBotFlags();
	},
	chatUsersThatAreNotBots: function(value) {
		manualBotOverrides.remove = value.split("\n").map((account) => { return account.trim().toLowerCase();}).filter((account) => { return account.length > 0; });
		twitchUsers.refreshBotFlags();
	},

	chatReplyOpacity: function(value) {
		rootCSS().setProperty("--replyOpacity", parseFloat(value) / 100);
	},
	chatReplyScale: function(value) {
		rootCSS().setProperty("--replyScale", parseFloat(value) / 100);
	},
	chatReplyElementSpacing: function(value) {
		rootCSS().setProperty("--replyElementSpacing", `${value}px`);
	},
	chatReplyBlockSpacing: function(value) {
		rootCSS().setProperty("--replyBlockSpacing", `${value}px`);
	},
	chatReplyIconSpacing: function(value) {
		rootCSS().setProperty("--replyIconSpacing", `${value}px`);
	},
	chatReplyIndentation: function(value) {
		rootCSS().setProperty("--replyIndentation", `${value}px`);
	},
	chatReplyItalicize: function(value) {
		rootCSS().setProperty("--replyFontStyle", (value === "true" ? "italic" : "normal"));
	},
	chatReplyIcon: function(value) {
		$(".replyIcon").attr("class", `fas ${value} replyIcon`);
	},
	chatReplyIconVerticalOffset: function(value) {
		rootCSS().setProperty("--replyIconVerticalOffset", `${value}px`);
	},

	chatRemoveMessageDelay: function(value) {
		if(parseInt(value) === 0) {
			for(const rootKey in messageDecayTimeouts) {
				const timerHandle = messageDecayTimeouts[rootKey];
				clearTimeout(timerHandle);
			}
		}
	},

	chatBSRShowDuration: function(value) {
		rootCSS().setProperty("--BSRDurationVisibility", (value === "true" ? "inline-block" : "none"));
	},
	chatBSRShowAge: function(value) {
		rootCSS().setProperty("--BSRAgeVisibility", (value === "true" ? "inline-block" : "none"));
	},
	chatBSRShowRating: function(value) {
		rootCSS().setProperty("--BSRRatingVisibility", (value === "true" ? "inline-block" : "none"));
	},
	chatBSRShowRatingPercentage: function(value) {
		rootCSS().setProperty("--BSRRatingPercentageVisibility", (value === "true" ? "inline" : "none"));
	},
	chatBSRShowStatsPanel: function(value) {
		rootCSS().setProperty("--BSRStatsPanelVisibility", (value === "true" ? "flex" : "none"));
	},
	chatBSRShowCode: function(value) {
		rootCSS().setProperty("--BSRCodeVisibility", (value === "true" ? "inline-block" : "none"));
	},
	chatBSRMapAgeFormat: function(value) {
		if(localStorage.getItem("setting_chatBSRMapAgeUsePrecise") === "true") {
			$(".songAge").each(function(idx) {
				const timestamp = $(this).attr("data-dateString");
				const ageData = luxon.DateTime.fromISO(timestamp);

				$(this).empty();
				$(this).append(`<i class="fas fa-calendar-days"></i> ${ageData.toFormat(value)}`);
			});
		}
	},
	chatBSRMapAgeUsePrecise: function(value) {
		$(".songAge").each(function(idx) {
			const timestamp = $(this).attr("data-dateString");
			const ageData = luxon.DateTime.fromISO(timestamp);
			const dateString = (value === "true" ? ageData.toFormat(localStorage.getItem("setting_chatBSRMapAgeFormat")) : ageData.toRelative({unit: ["years", "months", "days", "hours", "minutes"]}));

			$(this).empty();
			$(this).append(`<i class="fas fa-calendar-days"></i> ${dateString}`);
		});
	},
	chatBSRUseTabularNumsInStatsPanel: function(value) {
		rootCSS().setProperty("--BSRStatsPanelFontVariant", (value === "true" ? "tabular-nums" : "normal"));
	},

	enabledSharedChatAvatar: function(value) {
		rootCSS().setProperty("--sharedChatAvatarDisplay", (value === "true" ? "flex" : "none"));
	},

	sharedChatAvatarSize: function(value) {
		rootCSS().setProperty("--sharedChatAvatarSize", `${value}px`);
	},
	sharedChatAvatarBorderRadius: function(value) {
		rootCSS().setProperty("--sharedChatAvatarBorderRadius", `${value}px`);
	},
	sharedChatAvatarOffset: function(value) {
		rootCSS().setProperty("--sharedChatAvatarOffset", `${value}px`);
	},

	sharedChatAvatarBrightness: function(value) {
		rootCSS().setProperty("--sharedChatAvatarBrightness", `${value}%`);
		checkSharedChatAvatarFilters();
	},
	sharedChatAvatarContrast: function(value) {
		rootCSS().setProperty("--sharedChatAvatarContrast", `${value}%`);
		checkSharedChatAvatarFilters();
	},
	sharedChatAvatarSaturation: function(value) {
		rootCSS().setProperty("--sharedChatAvatarSaturation", `${value}%`);
		checkSharedChatAvatarFilters();
	},

	sharedChatSameRoomBorderSize: function(value) {
		rootCSS().setProperty("--sharedChatSameRoomBorderSize", `${value}px`);
	},
	sharedChatSameRoomBorderStyle: function(value) {
		rootCSS().setProperty("--sharedChatSameRoomBorderStyle", value);
	},
	sharedChatSameRoomBorderColor: function(value) {
		rootCSS().setProperty("--sharedChatSameRoomBorderColor", value);
	},
	sharedChatSameRoomBorderOffset: function(value) {
		rootCSS().setProperty("--sharedChatSameRoomBorderOffset", `${value}px`);
	},

	enableSharedChatAvatarBorderIfSameRoom: function(value) {
		rootCSS().setProperty("--sharedChatSameRoomBorderSizeActual", (value === "true" ? "var(--sharedChatSameRoomBorderSize)" : "0px"));
	},
	sharedChatAvatarHideIfSameRoom: function(value) {
		rootCSS().setProperty("--sharedChatAvatarSameRoomDisplay", (value === "true" ? "none" : "var(--sharedChatAvatarDisplay)"));
	},

	reverseChatMessageUserInfo: function(value) {
		if(value === "true") {
			$(".userInfo").addClass("userInfoBackwards").removeClass("userInfoForwards");

			rootCSS().setProperty("--userInfoElementDirection", "row-reverse");

			rootCSS().setProperty("--messageUserInfoElementSpacingForwards", "0px");
			rootCSS().setProperty("--messageUserInfoElementSpacingBackwards", "var(--messageUserInfoElementSpacing)");
		} else {
			$(".userInfo").addClass("userInfoForwards").removeClass("userInfoBackwards");

			rootCSS().setProperty("--userInfoElementDirection", "row");

			rootCSS().setProperty("--messageUserInfoElementSpacingForwards", "var(--messageUserInfoElementSpacing)");
			rootCSS().setProperty("--messageUserInfoElementSpacingBackwards", "0px");
		}

		twitchUsers.refreshUserInfoBlockDirections();
	},

	chatMaxBigEmoteLines: function(value) {
		rootCSS().setProperty("--bigEmoteMaxLines", `${value}em`);
	},
	chatReplyMaxWidth: function(value) {
		rootCSS().setProperty("--replyMaxWidth", `${value}px`);
	},
	useLowQualityImages: function(value) {
		if(!LQImageCheck) {
			LQImageCheck = true;
			return;
		}

		twitchEmotes.clearCacheObjects();
		chatEmotes.clearCacheObjects();
	},
	emotesInlineVerticalOffset: function(value) {
		rootCSS().setProperty("--emoteInlineVerticalOffset", `${value}em`);
	},
	emotesGigantifiedScale: function(value) {
		value = parseFloat(value) / 100;
		rootCSS().setProperty("--gigantifiedScalar", value);
	},

	chatShiftPerspective: function(value) {
		rootCSS().setProperty("--chatPerspectiveTransform", (value === "true" ? "var(--chatPerspectiveTransformActual)" : "none"));
	},
	chatPerspectiveDistance: function(value) {
		rootCSS().setProperty("--chatPerspectiveDistance", `${value}cm`);
	},
	chatPerspectiveOriginPointX: function(value) {
		rootCSS().setProperty("--chatPerspectiveOriginPointX", value);
	},
	chatPerspectiveOriginPointY: function(value) {
		rootCSS().setProperty("--chatPerspectiveOriginPointY", value);
	},
	chatPerspectiveRotX: function(value) {
		rootCSS().setProperty("--chatPerspectiveRotX", `${value}deg`);
	},
	chatPerspectiveRotY: function(value) {
		rootCSS().setProperty("--chatPerspectiveRotY", `${value}deg`);
	},
	chatPerspectiveRotZ: function(value) {
		rootCSS().setProperty("--chatPerspectiveRotZ", `${value}deg`);
	},
	chatPerspectivePreTranslateX: function(value) {
		rootCSS().setProperty("--chatPerspectivePreTranslateX", `${value}mm`);
	},
	chatPerspectivePreTranslateY: function(value) {
		rootCSS().setProperty("--chatPerspectivePreTranslateY", `${value}mm`);
	},
	chatPerspectivePostTranslateX: function(value) {
		rootCSS().setProperty("--chatPerspectivePostTranslateX", `${value}mm`);
	},
	chatPerspectivePostTranslateY: function(value) {
		rootCSS().setProperty("--chatPerspectivePostTranslateY", `${value}mm`);
	},
	chatPerspectivePostTranslateZ: function(value) {
		rootCSS().setProperty("--chatPerspectivePostTranslateZ", `${value}mm`);
	},
	chatOverlayIsTraditional: function(value) {
		rootCSS().setProperty("--elementFlowDisplay", (value === "true" ? "flex" : "block"));
		rootCSS().setProperty("--elementFlowUserBlockFlexValue", (value === "true" ? "unset" : 1));
		rootCSS().setProperty("--elementFlowMessageSpacing", (value === "true" ? "var(--elementFlowMessageSpacingValue)" : "unset"));
		rootCSS().setProperty("--elementFlowViewerInfoVerticalAlignment", (value === "true" ? "var(--elementFlowViewerInfoVerticalAlignmentValue)" : "unset"));
		rootCSS().setProperty("--elementFlowHorizontalAlignment", (value === "true" ? "var(--elementFlowHorizontalAlignmentValue)" : "unset"));
		rootCSS().setProperty("--BSRInfoElementsWidth", (value === "true" ? "unset" : "var(--BSRInfoElementsWidthValue)"));

		settingUpdaters.elementFlowForceMoreTradition(localStorage.getItem("setting_elementFlowForceMoreTradition"));
	},
	horizontalMessageSpacing: function(value) {
		rootCSS().setProperty("--elementFlowMessageSpacingValue", `${value}px`);
	},
	elementFlowForceMoreTradition: function(value) {
		const isTraditional = (localStorage.getItem("setting_chatOverlayIsTraditional") === "true");
		rootCSS().setProperty("--elementFlowViewerInfoWidth", (value === "true" && isTraditional ? "var(--elementFlowViewerInfoWidthValue)" : "unset"));
		rootCSS().setProperty("--elementFlowViewerInfoAlignment", (value === "true" && isTraditional ? "end" : "unset"));
		rootCSS().setProperty("--elementFlowViewerInfoAlignmentOpposite", (value === "true" && isTraditional ? "start" : "unset"));
	},
	chatOverlayViewerInfoWidth: function(value) {
		rootCSS().setProperty("--elementFlowViewerInfoWidthValue", `${value}px`);
	},
	chatOverlayViewerInfoVerticalAlignment: function(value) {
		rootCSS().setProperty("--elementFlowViewerInfoVerticalAlignmentValue", value);
	},
	enableFlags: function(value) {
		rootCSS().setProperty("--flagsContainerDisplay", (value === "true" ? "flex" : "none"));
	},
	chatBSRMapArtBorderRadius: function(value) {
		rootCSS().setProperty("--BSRMapArtBorderRadius", `${value}px`);
	},
	chatBSRMapCodeBorderRadius: function(value) {
		rootCSS().setProperty("--BSRMapCodeBorderRadius", `${value}px`);
	},
	chatBSRMapCodeBGAngle: function(value) {
		rootCSS().setProperty("--BSRMapCodeBGAngle", `${value}deg`);
	},
	chatBSRMapCodeBGColor1: function(value) {
		rootCSS().setProperty("--BSRMapCodeBGColor1", value);
	},
	chatBSRMapCodeBGColor2: function(value) {
		rootCSS().setProperty("--BSRMapCodeBGColor2", value);
	},
	chatBSRMapCodeFGColor: function(value) {
		rootCSS().setProperty("--BSRMapCodeFGColor", value);
	},
	chatBSREnableCoverArt: function(value) {
		rootCSS().setProperty("--BSRMapCoverArtDisplay", (value === "true" ? "inline-block" : "none"));
	},
	chatBSRMapCodeFontUsesMessageSettings: function(value) {
		rootCSS().setProperty("--BSRMapCodeFontActual", (value === "true" ? "inherit" : "var(--BSRMapCodeFont)"));
		rootCSS().setProperty("--BSRMapCodeFontStyleActual", (value === "true" ? "inherit" : "var(--BSRMapCodeFontStyle)"));
		rootCSS().setProperty("--BSRMapCodeFontVariantActual", (value === "true" ? "inherit" : "var(--BSRMapCodeFontVariant)"));
		rootCSS().setProperty("--BSRMapCodeFontSizeActual", (value === "true" ? "inherit" : "var(--BSRMapCodeFontSize)"));
		rootCSS().setProperty("--BSRMapCodeFontWeightActual", (value === "true" ? "inherit" : "var(--BSRMapCodeFontWeight)"));
		rootCSS().setProperty("--BSRMapCodeCharacterSpacingActual", (value === "true" ? "inherit" : "var(--BSRMapCodeCharacterSpacing)"));
		rootCSS().setProperty("--BSRMapCodeFontWeightExtraActual", (value === "true" ? "inherit" : "var(--BSRMapCodeFontWeightExtra)"));
	},
	chatBSRMapCodeFont: function(value) {
		rootCSS().setProperty("--BSRMapCodeFont", value);
	},
	chatBSRMapCodeFontItalic: function(value) {
		rootCSS().setProperty("--BSRMapCodeFontStyle", (value === "true" ? "italic" : "normal"));
	},
	chatBSRUseTabularNumsInMapCode: function(value) {
		rootCSS().setProperty("--BSRMapCodeFontVariant", (value === "true" ? "tabular-nums" : "normal"));
	},
	chatBSRMapCodeFontSize: function(value) {
		rootCSS().setProperty("--BSRMapCodeFontSize", `${value}pt`);
	},
	chatBSRMapCodeFontWeight: function(value) {
		rootCSS().setProperty("--BSRMapCodeFontWeight", value);
	},
	chatBSRMapCodeCharacterSpacing: function(value) {
		rootCSS().setProperty("--BSRMapCodeCharacterSpacing", `${value}px`);
	},
	chatBSRMapCodeFontWeightExtra: function(value) {
		rootCSS().setProperty("--BSRMapCodeFontWeightExtra", `${value}px`);
	},
	chatBSRMapCodeVerticalOffset: function(value) {
		rootCSS().setProperty("--BSRMapCodeVerticalOffset", `${value}px`);
	}
};
settingUpdaters["chatHideAccounts"](localStorage.getItem("setting_chatHideAccounts"));

function checkSharedChatAvatarFilters() {
	const contrast = parseFloat(localStorage.getItem("setting_sharedChatAvatarContrast"));
	const brightness = parseFloat(localStorage.getItem("setting_sharedChatAvatarBrightness"));
	const saturation = parseFloat(localStorage.getItem("setting_sharedChatAvatarSaturation"));

	let out = [];

	if(contrast !== 100) { out.push(`contrast(var(--sharedChatAvatarContrast))`); }
	if(brightness !== 100) { out.push(`brightness(var(--sharedChatAvatarBrightness))`); }
	if(saturation !== 100) { out.push(`saturate(var(--sharedChatAvatarSaturation))`); }

	if(out.length) {
		rootCSS().setProperty("--sharedChatAvatarFilters", out.join(" "));
	} else {
		rootCSS().setProperty("--sharedChatAvatarFilters", "none");
	}
}

function checkAvatarPermissions() {
	for(const id in twitchUsers) {
		if(id === -1) {
			continue;
		}

		const user = twitchUsers[id];

		if(user.avatarEnabled) {
			$(`.chatBlock[data-userid="${id}"] .pfp`).show();
			if(localStorage.getItem("setting_enableAvatarsAsBackground") === "true") {
				$(`.chatBlock[data-userid="${id}"] .avatarBGWrapper`).show();
			} else {
				$(`.chatBlock[data-userid="${id}"] .avatarBGWrapper`).hide();
			}
		} else {
			$(`.chatBlock[data-userid="${id}"] .pfp`).hide();
			$(`.chatBlock[data-userid="${id}"] .avatarBGWrapper`).hide();
		}
	}
}

function updateSetting(which, value, oldValue) {
	if(which.indexOf("setting_") === -1) {
		return;
	}

	let setting = which.substr(8);

	if(setting in settingUpdaters) {
		console.log(`setting ${setting} updated`);
		settingUpdaters[setting](value, oldValue);
	}

	if(setting.indexOf("avatarAllowed") !== -1) {
		checkAvatarPermissions();
	}
}
window.addEventListener("storage", function(event) {
	updateSetting(event.key, event.newValue, event.oldValue);
});