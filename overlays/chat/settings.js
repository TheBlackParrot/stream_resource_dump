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

/*
		let opacity = 1;
		let count = combinedCount - parseInt($(this).attr("data-combinedIdx")) - parseInt(localStorage.getItem("setting_chatHistoryStartAfter"));

		if(localStorage.getItem("setting_chatFadeHistory") === "true") {
			opacity = (1 - count) * (parseFloat(localStorage.getItem("setting_chatFadeHistoryStep")) / 100);
			if(opacity < 0) {
				opacity = 0;
			}
		}

		let blur = 0;
		if(localStorage.getItem("setting_chatBlurHistory") === "true") {
			blur = count * parseFloat(localStorage.getItem("setting_chatBlurHistoryStep"));
		}

		if(!opacity) {
			$(this).remove();
		}

		$(this).css("filter", `opacity(${opacity})${blur === 0 ? "" : `blur(${blur}px)`}`);
*/

function setHistoryOpacity() {
	$(".chatBlock").each(function() {
		let opacity = 1;
		if(localStorage.getItem("setting_chatFadeHistory") === "true") {
			opacity = 1 - ((combinedCount - parseInt($(this).attr("data-combinedIdx")) - parseInt(localStorage.getItem("setting_chatHistoryStartAfter")) + 1) * (parseFloat(localStorage.getItem("setting_chatFadeHistoryStep")) / 100));
			if(opacity < 0) {
				opacity = 0;
			}
		}

		let blur = 0;
		if(localStorage.getItem("setting_chatBlurHistory") === "true") {
			blur = (combinedCount - parseInt($(this).attr("data-combinedIdx")) - parseInt(localStorage.getItem("setting_chatHistoryStartAfter")) + 1) * parseFloat(localStorage.getItem("setting_chatBlurHistoryStep"));
		}

		if(!opacity) {
			$(this).remove();
		}

		$(this).css("filter", `opacity(${opacity})${blur === 0 ? "" : `blur(${blur}px)`}`);
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
	windowReload: function(value) {
		setTimeout(function() {
			location.reload();
		}, 100);
	},

	chatBackgroundColor: function(value) {
		$(":root").get(0).style.setProperty("--backgroundColor", value);
	},
	chatHighlightBackgroundColor: function(value) {
		$(":root").get(0).style.setProperty("--highlightBackgroundColor", value);
		$(":root").get(0).style.setProperty("--highlightBorderColor", localStorage.getItem("setting_chatHighlightBackgroundColor").substring(0, 7));
	},
	chatDefaultNameColor: function(value) {
		$(":root").get(0).style.setProperty("--defaultNameColor", value);
	},
	chatMessageColor: function(value) {
		$(":root").get(0).style.setProperty("--messageColor", value);
	},

	chatNameFont: function(value) {
		$(":root").get(0).style.setProperty("--nameFont", value);
	},
	chatMessageFont: function(value) {
		$(":root").get(0).style.setProperty("--messageFont", value);
	},
	chatNameFontSize: function(value) {
		$(":root").get(0).style.setProperty("--nameFontSize", `${value}pt`);
	},
	chatMessageFontSize: function(value) {
		$(":root").get(0).style.setProperty("--messageFontSize", `${value}pt`);
	},
	chatNameFontWeight: function(value) {
		$(":root").get(0).style.setProperty("--nameFontWeight", value);
	},
	chatMessageFontWeight: function(value) {
		$(":root").get(0).style.setProperty("--messageFontWeight", value);
	},

	chatBlockPadding: function(value) {
		$(":root").get(0).style.setProperty("--chatBlockPadding", `${value}px`);
	},
	chatBlockIndividualPadding: function(value) {
		$(":root").get(0).style.setProperty("--chatBlockIndividualPadding", `${value}px`);
	},
	chatBlockBorderRadius: function(value) {
		$(":root").get(0).style.setProperty("--chatBlockBorderRadius", `${value}px`);
	},

	chatOutlines: function(value) {
		if(value === "true") {
			$(":root").get(0).style.setProperty("--chatBlockOutline", "var(--chatBlockOutlineSize) var(--chatBlockOutlineStyle) var(--chatBlockOutlineColor)");
		} else {
			$(":root").get(0).style.setProperty("--chatBlockOutline", "none");
		}
	},
	chatOutlinesColor: function(value) {
		$(":root").get(0).style.setProperty("--chatBlockOutlineColor", value);
	},
	chatOutlinesSize: function(value) {
		$(":root").get(0).style.setProperty("--chatBlockOutlineSize", `${value}px`);
	},
	chatOutlineStyle: function(value) {
		$(":root").get(0).style.setProperty("--chatBlockOutlineStyle", value);
	},

	chatShadows: function(value) {
		if(value === "true") {
			$(":root").get(0).style.setProperty("--shadowStuff", "var(--originalShadowStuff)");
		} else {
			$(":root").get(0).style.setProperty("--shadowStuff", "drop-shadow(0px 0px 0px transparent)");
		}
	},
	chatOutlinesFilter: function(value) {
		if(value === "true") {
			$(":root").get(0).style.setProperty("--outlineStuff", "var(--originalOutlineStuff)");
		} else {
			$(":root").get(0).style.setProperty("--outlineStuff", "drop-shadow(0px 0px 0px transparent)");
		}
	},

	chatFadeHistory: setHistoryOpacity,
	chatFadeHistoryStep: setHistoryOpacity,
	chatBlurHistory: setHistoryOpacity,
	chatBlurHistoryStep: setHistoryOpacity,
	chatHistoryStartAfter: setHistoryOpacity,

	chatAnimationsInDuration: function(value) {
		$(":root").get(0).style.setProperty("--animationsInDuration", `${value}s`);
	},

	chatAnimationsOutDuration: function(value) {
		$(":root").get(0).style.setProperty("--animationsOutDuration", `${value}s`);
	},

	chatBigEmoteSize: function(value) {
		$(":root").get(0).style.setProperty("--bigEmoteSize", `${value}pt`);
	},

	testMessage: function(value) {
		let col = Math.floor(Math.random() * 16777216);
		let r = ((col >> 16) & 0xFF).toString(16).padStart(2, "0");
		let g = ((col >> 8) & 0xFF).toString(16).padStart(2, "0");
		let b = (col & 0xFF).toString(16).padStart(2, "0");

		//info=subscriber/25;badges=broadcaster/1,subscriber/3024;client-nonce=d101a84203af3f39502904e6a317672c;color=#8A2BE2;display-name=TheBlackParrot;emotes=305954156:11-18/25:5-9;first-msg=0;flags=;id=7f097686-fb53-4a0a-97d6-ee90ff0d3a05;mod=0;returning-chatter=0;room-id=43464015;subscriber=1;tmi-sent-ts=1689412906804;turbo=0;user-id=43464015;user-type= :theblackparrot!theblackparrot@theblackparrot.tmi.twitch.tv PRIVMSG #theblackparrot :test Kappa PogChamp

		let exMsg = "Hello there! This is a fake message so that you can see what your chat settings look like! Have fun! AaBbCcDd EeFfGgHh IiJjKkLl MmNnOoPp QqRrSsTt UuVvWwXx YyZz 0123456789 Also, look! Emotes! Kappa PogChamp catJAM";
		let msg = `@badge-info=;badges=broadcaster/1;client-nonce=balls;display-name=${broadcasterData.display_name};emotes=305954156:197-204/25:191-195;first-msg=0;flags=;id=1234-abcd;mod=0;returning-chatter=0;room-id=${broadcasterData.id};subscriber=0;tmi-sent-ts=${Date.now()};turbo=0;user-id=-1;user-type=;color=#${r}${g}${b} :${broadcasterData.login}!${broadcasterData.login}@${broadcasterData.login}.tmi.twitch.tv PRIVMSG #${broadcasterData.login} :${exMsg}`;
		client._onMessage({
			data: msg
		});
	},

	chatCornerAlignment: function(value) {
		$("#wrapper").css("top", "");
		$("#wrapper").css("bottom", "");
		$("#wrapper").css("left", "");
		$("#wrapper").css("right", "");

		let pos = value.split(",");
		if(pos[0] === "top") {
			$("#wrapper").css("top", "0px");
		} else {
			$("#wrapper").css("bottom", "0px");
		}

		if(pos[1] === "left") {
			$("#wrapper").removeClass("right").addClass("left");
			$(":root").get(0).style.setProperty("--bsrInfoDirection", "ltr");
		} else {
			$("#wrapper").removeClass("left").addClass("right");
			$(":root").get(0).style.setProperty("--bsrInfoDirection", "rtl");
		}
	},

	chatMessageLineHeight: function(value) {
		$(":root").get(0).style.setProperty("--messageLineHeight", `${value}px`);
	},

	avatarSize: function(value) {
		$(":root").get(0).style.setProperty("--avatarSize", `${value}px`);
	},

	chatMessageUserInfoElementSpacing: function(value) {
		$(":root").get(0).style.setProperty("--messageUserInfoElementSpacing", `${value}px`);
	},

	chatAnimationInName: function(value) {
		$(":root").get(0).style.setProperty("--animationsInName", value);
	},
	chatAnimationOutName: function(value) {
		$(":root").get(0).style.setProperty("--animationsOutName", value);
	},

	avatarShape: function(value) {
		switch(value) {
			case "circle": $(":root").get(0).style.setProperty("--avatarBorderRadius", "100%"); break;
			case "squircle": $(":root").get(0).style.setProperty("--avatarBorderRadius", "10px"); break;
			case "square": $(":root").get(0).style.setProperty("--avatarBorderRadius", "0px"); break;
		}
	},

	overlayShadowColor: function(value) {
		$(":root").get(0).style.setProperty("--overlayShadowColor", value);
	},
	overlayShadowXOffset: function(value) {
		$(":root").get(0).style.setProperty("--overlayShadowXOffset", `${value}px`);
	},
	overlayShadowYOffset: function(value) {
		$(":root").get(0).style.setProperty("--overlayShadowYOffset", `${value}px`);
	},
	overlayShadowBlurRadius: function(value) {
		$(":root").get(0).style.setProperty("--overlayShadowBlurRadius", `${value}px`);
	},
	overlayOutlineColor: function(value) {
		$(":root").get(0).style.setProperty("--overlayOutlineColor", value);
	},
	overlayOutlineSize: function(value) {
		$(":root").get(0).style.setProperty("--overlayOutlineSize", `${value}px`);
	},

	pronounsAeAer: function(value) { $(":root").get(0).style.setProperty("--pronouns_aeaer", `"${value}"`); },
	pronounsAny: function(value) { $(":root").get(0).style.setProperty("--pronouns_any", `"${value}"`); },
	pronounsEEm: function(value) { $(":root").get(0).style.setProperty("--pronouns_eem", `"${value}"`); },
	pronounsFaeFaer: function(value) { $(":root").get(0).style.setProperty("--pronouns_faefaer", `"${value}"`); },
	pronounsHeHim: function(value) { $(":root").get(0).style.setProperty("--pronouns_hehim", `"${value}"`); },
	pronounsHeShe: function(value) { $(":root").get(0).style.setProperty("--pronouns_heshe", `"${value}"`); },
	pronounsHeThem: function(value) { $(":root").get(0).style.setProperty("--pronouns_hethem", `"${value}"`); },
	pronounsItIts: function(value) { $(":root").get(0).style.setProperty("--pronouns_itits", `"${value}"`); },
	pronounsOther: function(value) { $(":root").get(0).style.setProperty("--pronouns_other", `"${value}"`); },
	pronounsPerPer: function(value) { $(":root").get(0).style.setProperty("--pronouns_perper", `"${value}"`); },
	pronounsSheHer: function(value) { $(":root").get(0).style.setProperty("--pronouns_sheher", `"${value}"`); },
	pronounsSheThem: function(value) { $(":root").get(0).style.setProperty("--pronouns_shethem", `"${value}"`); },
	pronounsTheyThem: function(value) { $(":root").get(0).style.setProperty("--pronouns_theythem", `"${value}"`); },
	pronounsVeVer: function(value) { $(":root").get(0).style.setProperty("--pronouns_vever", `"${value}"`); },
	pronounsXeXem: function(value) { $(":root").get(0).style.setProperty("--pronouns_xexem", `"${value}"`); },
	pronounsZieHir: function(value) { $(":root").get(0).style.setProperty("--pronouns_ziehir", `"${value}"`); },

	chatAnimationInOriginPoint: function(value) {
		$(":root").get(0).style.setProperty("--animationsInOriginPoint", value);
	},
	chatAnimationOutOriginPoint: function(value) {
		$(":root").get(0).style.setProperty("--animationsOutOriginPoint", value);
	},
	chatAnimationInTimingFunction: function(value) {
		$(":root").get(0).style.setProperty("--animationsInTimingFunc", `var(--timingFunc${value})`);
	},
	chatAnimationOutTimingFunction: function(value) {
		$(":root").get(0).style.setProperty("--animationsOutTimingFunc", `var(--timingFunc${value})`);
	},

	badgeBorderRadius: function(value) {
		$(":root").get(0).style.setProperty("--badgeBorderRadius", `${value}px`);
	},
	badgeSpacing: function(value) {
		$(":root").get(0).style.setProperty("--badgeSpacing", `${value}px`);
	},
	badgeSize: function(value) {
		$(":root").get(0).style.setProperty("--badgeSize", `${value}px`);
	},
	chatNameFontWeightExtra: function(value) {
		$(":root").get(0).style.setProperty("--nameFontWeightExtra", `${value}px`);
	},

	chatDefaultNameColorSecondary: function(value) {
		$(":root").get(0).style.setProperty("--defaultNameColorSecondary", value);
	},
	chatNameGradientAngle: function(value) {
		$(":root").get(0).style.setProperty("--nameGradientAngle", `${value}deg`);
	},
	chatNameLetterSpacing: function(value) {
		$(":root").get(0).style.setProperty("--nameLetterSpacing", `${value}px`);
	},
	messageLetterSpacing: function(value) {
		$(":root").get(0).style.setProperty("--messageLetterSpacing", `${value}px`);
	},

	pronounsColor: function(value) {
		$(":root").get(0).style.setProperty("--pronounsColor", value);
	},
	pronounsUsesGradient: function(value) {
		if(value === "true") {
			$(":root").get(0).style.setProperty("--pronounsGradient", "linear-gradient(var(--pronounsGradientAngle), var(--pronounsColorSecondary) -20%, transparent 100%)");
		} else {
			$(":root").get(0).style.setProperty("--pronounsGradient", "none");
		}
	},
	pronounsColorSecondary: function(value) {
		$(":root").get(0).style.setProperty("--pronounsColorSecondary", value);
	},
	pronounsGradientAngle: function(value) {
		$(":root").get(0).style.setProperty("--pronounsGradientAngle", `${value}deg`);
	},
	pronounsFont: function(value) {
		$(":root").get(0).style.setProperty("--pronounsFont", value);
	},
	pronounsFontSize: function(value) {
		$(":root").get(0).style.setProperty("--pronounsFontSize", `${value}pt`);
	},
	pronounsFontWeight: function(value) {
		$(":root").get(0).style.setProperty("--pronounsFontWeight", value);
	},
	pronounsFontWeightExtra: function(value) {
		$(":root").get(0).style.setProperty("--pronounsFontWeightExtra", `${value}px`);
	},
	pronounsLetterSpacing: function(value) {
		$(":root").get(0).style.setProperty("--pronounsLetterSpacing", `${value}px`);
	},

	chatNameTransform: function(value) {
		$(":root").get(0).style.setProperty("--nameTransform", value);
	},
	messageTransform: function(value) {
		$(":root").get(0).style.setProperty("--messageTransform", value);
	},
	pronounsTransform: function(value) {
		$(":root").get(0).style.setProperty("--pronounsTransform", value);
	},

	flagsBorderRadius: function(value) {
		$(":root").get(0).style.setProperty("--flagsBorderRadius", `${value}px`);
	},
	flagsSize: function(value) {
		$(":root").get(0).style.setProperty("--flagsSize", `${value}px`);
	},
	flagsSpacing: function(value) {
		$(":root").get(0).style.setProperty("--flagsSpacing", `${value}px`);
	},

	chatBlockSpacing: function(value) {
		$(":root").get(0).style.setProperty("--chatBlockSpacing", `${value}px`);
	},

	messageBoldAmount: function(value) {
		$(":root").get(0).style.setProperty("--messageBoldAmount", `${value}px`);
	},

	timestampColor: function(value) {
		$(":root").get(0).style.setProperty("--timestampColor", value);
	},
	timestampUsesGradient: function(value) {
		if(value === "true") {
			$(":root").get(0).style.setProperty("--timestampGradient", "linear-gradient(var(--timestampGradientAngle), var(--timestampColorSecondary) -20%, transparent 100%)");
		} else {
			$(":root").get(0).style.setProperty("--timestampGradient", "none");
		}
	},
	timestampColorSecondary: function(value) {
		$(":root").get(0).style.setProperty("--timestampColorSecondary", value);
	},
	timestampGradientAngle: function(value) {
		$(":root").get(0).style.setProperty("--timestampGradientAngle", `${value}deg`);
	},
	timestampFont: function(value) {
		$(":root").get(0).style.setProperty("--timestampFont", value);
	},
	timestampFontSize: function(value) {
		$(":root").get(0).style.setProperty("--timestampFontSize", `${value}pt`);
	},
	timestampFontWeight: function(value) {
		$(":root").get(0).style.setProperty("--timestampFontWeight", value);
	},
	timestampFontWeightExtra: function(value) {
		$(":root").get(0).style.setProperty("--timestampFontWeightExtra", `${value}px`);
	},
	timestampLetterSpacing: function(value) {
		$(":root").get(0).style.setProperty("--timestampLetterSpacing", `${value}px`);
	},
	timestampPadding: function(value) {
		$(":root").get(0).style.setProperty("--timestampPadding", `${value}px`);
	},

	chatMessageUserInfoBackgroundColor: function(value) {
		$(":root").get(0).style.setProperty("--userInfoBackgroundColor", value);
	},

	chatMessageUserInfoElementPadding: function(value) {
		$(":root").get(0).style.setProperty("--userInfoPadding", `${value}px`);
	},
	chatMessageUserInfoElementBorderRadius: function(value) {
		$(":root").get(0).style.setProperty("--userInfoBorderRadius", `${value}px`);
	},
	chatBlockWidth: function(value) {
		$(":root").get(0).style.setProperty("--chatBlockWidth", value);
	},
	applyBorderRadiusToSubBadges: function(value) {
		if(value === "true") {
			$(":root").get(0).style.setProperty("--subBadgeBorderRadius", "var(--badgeBorderRadius)");
		} else {
			$(":root").get(0).style.setProperty("--subBadgeBorderRadius", "0px");
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