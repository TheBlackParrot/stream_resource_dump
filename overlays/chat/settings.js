const settings = {
	chat: {
		secondsVisible: 45,
		alwaysShowPFP: false,
		opacityDecreaseStep: 0.07,
		commandCharacter: "!"
	},

	cache: {
		expireDelay: 604800
	},

	limits: {
		bigEmoji: {
			max: 10
		},

		flags: {
			max: 6
		},

		names: {
			size: {
				min: 14,
				max: 18,
				default: 16
			},

			spacing: {
				min: -4,
				max: 5,
				default: 1
			},

			gradAngle: {
				min: 0,
				max: 360,
				default: 170
			}
		},

		messages: {
			size: {
				min: 14,
				max: 18,
				default: 16
			},

			spacing: {
				min: -2,
				max: 2,
				default: 1
			}			
		}
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

const enums = {
	weight: {
		thin: 100,
		exlight: 200,
		extralight: 200,
		ultlight: 200,
		ultralight: 200,
		light: 300,
		regular: 400,
		normal: 400,
		default: 400,
		medium: 500,
		semibold: 600,
		demibold: 600,
		bold: 700,
		exbold: 800,
		extrabold: 800,
		ultbold: 800,
		ultrabold: 800,
		black: 900,
		heavy: 900
	}
}

var hideAccounts = [];
var refreshExternalStuffTimeout;

function refreshExternalStuff() {
	clearTimeout(refreshExternalStuffTimeout);
	refreshExternalStuffTimeout = setTimeout(function() {
		chatEmotes = {};
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
	$(".chatBlock").each(function() {
		let opacity = 1;
		if(localStorage.getItem("setting_chatFadeHistory") === "true") {
			opacity = 1 - ((combinedCount - parseInt($(this).attr("data-combinedIdx"))) * (parseFloat(localStorage.getItem("setting_chatFadeHistoryStep")) / 100));
			if(opacity < 0) {
				opacity = 0;
			}
		}

		if(!opacity) {
			$(this).remove();
		}

		//$(this).css("opacity", "");
		//$(this).attr("style", function(i, s) { return (s || '') + `opacity: ${opacity};` });
		$(this).css("filter", `opacity(${opacity})`);
	});
}

const settingUpdaters = {
	chatHideAccounts: function(value) {
		hideAccounts = value.split("\n");
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
		location.reload();
	},

	chatBackgroundColorAlpha: function(value) {
		$(":root").get(0).style.setProperty("--backgroundColor", normalizeSettingColors("chatBackgroundColor"));
	},
	chatHighlightBackgroundColorAlpha: function(value) {
		$(":root").get(0).style.setProperty("--highlightBackgroundColor", normalizeSettingColors("chatHighlightBackgroundColor"));
		$(":root").get(0).style.setProperty("--highlightBorderColor", localStorage.getItem("setting_chatHighlightBackgroundColor"));
	},
	chatDefaultNameColorAlpha: function(value) {
		$(":root").get(0).style.setProperty("--defaultNameColor", normalizeSettingColors("chatDefaultNameColor"));
	},
	chatMessageColorAlpha: function(value) {
		$(":root").get(0).style.setProperty("--messageColor", normalizeSettingColors("chatMessageColor"));
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
	chatOutlinesColorAlpha: function(value) {
		$(":root").get(0).style.setProperty("--chatBlockOutlineColor", normalizeSettingColors("chatOutlinesColor"));
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
		let exMsg = "Hello there! This is a fake message so that you can see what your chat settings look like! Have fun! AaBbCcDd EeFfGgHh IiJjKkLl MmNnOoPp QqRrSsTt UuVvWwXx YyZz 0123456789";
		let msg = `@badge-info=;badges=broadcaster/1;client-nonce=balls;display-name=${broadcasterData.display_name};emotes=;first-msg=0;flags=;id=1234-abcd;mod=0;returning-chatter=0;room-id=${broadcasterData.id};subscriber=0;tmi-sent-ts=${Date.now()};turbo=0;user-id=${broadcasterData.id};user-type= :${broadcasterData.login}!${broadcasterData.login}@${broadcasterData.login}.tmi.twitch.tv PRIVMSG #${broadcasterData.login} :${exMsg}`;
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
			$("#wrapper").css("left", "0px");
			$("#wrapper").css("text-align", "left");
			$(":root").get(0).style.setProperty("--bsrInfoDirection", "ltr");
		} else {
			$("#wrapper").css("right", "0px");
			$("#wrapper").css("text-align", "right");
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

	overlayShadowColorAlpha: function(value) {
		$(":root").get(0).style.setProperty("--overlayShadowColor", normalizeSettingColors("overlayShadowColor"));
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
	overlayOutlineColorAlpha: function(value) {
		$(":root").get(0).style.setProperty("--overlayOutlineColor", normalizeSettingColors("overlayOutlineColor"));
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

	chatDefaultNameColorSecondaryAlpha: function(value) {
		$(":root").get(0).style.setProperty("--defaultNameColorSecondary", normalizeSettingColors("chatDefaultNameColorSecondary"));
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

	pronounsColorAlpha: function(value) {
		$(":root").get(0).style.setProperty("--pronounsColor", normalizeSettingColors("pronounsColor"));
	},
	pronounsUsesGradient: function(value) {
		if(value === "true") {
			$(":root").get(0).style.setProperty("--pronounsGradient", "linear-gradient(var(--pronounsGradientAngle), var(--pronounsColorSecondary) -20%, transparent 100%)");
		} else {
			$(":root").get(0).style.setProperty("--pronounsGradient", "none");
		}
	},
	pronounsColorSecondaryAlpha: function(value) {
		$(":root").get(0).style.setProperty("--pronounsColorSecondary", normalizeSettingColors("pronounsColorSecondary"));
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
	}
};
settingUpdaters.chatBackgroundColor = settingUpdaters.chatBackgroundColorAlpha;
settingUpdaters.chatHighlightBackgroundColor = settingUpdaters.chatHighlightBackgroundColorAlpha;
settingUpdaters.chatDefaultNameColor = settingUpdaters.chatDefaultNameColorAlpha;
settingUpdaters.chatMessageColor = settingUpdaters.chatMessageColorAlpha;
settingUpdaters.chatOutlinesColor = settingUpdaters.chatOutlinesColorAlpha;
settingUpdaters.overlayShadowColor = settingUpdaters.overlayShadowColorAlpha;
settingUpdaters.overlayOutlineColor = settingUpdaters.overlayOutlineColorAlpha;
settingUpdaters.chatDefaultNameColorSecondary = settingUpdaters.chatDefaultNameColorSecondaryAlpha;
settingUpdaters.pronounsColor = settingUpdaters.pronounsColorAlpha;
settingUpdaters.pronounsColorSecondary = settingUpdaters.pronounsColorSecondaryAlpha;

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