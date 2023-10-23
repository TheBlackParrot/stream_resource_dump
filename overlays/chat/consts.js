const overlayRevision = 29;
const overlayRevisionTimestamp = 1698013033778;

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

const entityMap = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;',
	'`': '&#x60;',
	'=': '&#x3D;'
};

const twitchBadgeTypes = {
	role: {
		badges: ["artist-badge", "broadcaster", "extension", "moderator", "vip"],
		setting: "enableTwitchRoleBadges",
		is_solid: true
	},
	staff: {
		badges: ["admin", "global_mod", "staff", "twitchbot", "user-anniversary"],
		setting: "enableTwitchStaffBadges",
		is_solid: true
	},
	partner: {
		badges: ["ambassador", "partner"],
		setting: "enableTwitchPartnerBadges",
		is_solid: true
	},
	bits: {
		badges: ["anonymous-cheerer", "bits"],
		setting: "enableTwitchBitsBadges",
		is_solid: true
	},
	leaderboard: {
		badges: ["bits-leader", "clip-champ", "sub-gift-leader"],
		setting: "enableTwitchLeaderboardBadges",
		is_solid: false
	},
	founder: {
		badges: ["founder"],
		setting: "enableTwitchFounderBadges",
		is_solid: false
	},
	charity: {
		badges: ["glhf-pledge", "bits-charity"],
		setting: "enableTwitchCharityBadges",
		is_solid: false
	},
	convention: {
		badges: ["glitchcon2020", "twitchcon2017", "twitchcon2018", "twitchconAmsterdam2020", "twitchconEU2019", 
				 "twitchconEU2022", "twitchconEU2023", "twitchconNA2019", "twitchconNA2020", "twitchconNA2022",
				 "superultracombo-2023"],
		setting: "enableTwitchConBadges",
		is_solid: false
	},
	hypetrain: {
		badges: ["hype-train"],
		setting: "enableTwitchHypeTrainBadges",
		is_solid: false
	},
	moments: {
		badges: ["moments"],
		setting: "enableTwitchMomentsBadges",
		is_solid: false
	},
	status: {
		badges: ["no_audio", "no_video"],
		setting: "enableTwitchStatusBadges",
		is_solid: true
	},
	predictions: {
		badges: ["predictions"],
		setting: "enableTwitchPredictionsBadges",
		is_solid: false
	},
	prime: {
		badges: ["premium"],
		setting: "enableTwitchPrimeGamingBadges",
		is_solid: true
	},
	gifter: {
		badges: ["sub-gifter"],
		setting: "enableTwitchSubGiftsBadges",
		is_solid: false
	},
	subscriber: {
		badges: ["subscriber"],
		setting: "enableTwitchSubscriberBadges",
		is_solid: false
	},
	turbo: {
		badges: ["turbo"],
		setting: "enableTwitchTurboBadges",
		is_solid: true
	}
};

const commonEmotes = {
	"catJAM": {service: "default", url: "emotes/catJAM/3x.gif"},
	"Clap": {service: "default", url: "emotes/Clap/3x.gif"},
	"DonoWall": {service: "default", url: "emotes/DonoWall/3x.gif"},
	"HUH": {service: "default", url: "emotes/HUH/3x.webp"},
	"KEKW": {service: "default", url: "emotes/KEKW/3x.png"},
	"modCheck": {service: "default", url: "emotes/modCheck/3x.gif"},
	"OMEGALUL": {service: "default", url: "emotes/OMEGALUL/3x.png"},
	"SourPls": {service: "default", url: "emotes/SourPls/3x.gif"},
	"WAYTOODANK": {service: "default", url: "emotes/WAYTOODANK/3x.webp"}
};

twemoji.base = "twemoji/";

const funnyBeatSaberMapsToRequestToEverySingleStreamerOnTwitchEverIBetEverySingleOneOfThemWillEnjoyThem = [
	"25f", "d1cc", "b", "c32d", "922f", "871a", "10c9b", "1e99", "1eb9", "2a121", "24188", "46d4", "24b58", "557f", "1f89a", "335c", "e621", "2c2f4", "11cf8"
];

const animationFilterFunctions = {
	Contrast: {
		incoming: {
			start: "contrast(var(--messageInContrastStart))",
			end: "contrast(var(--messageInContrastEnd))"
		},
		outgoing: {
			start: "contrast(var(--messageOutContrastStart))",
			end: "contrast(var(--messageOutContrastEnd))"				
		}
	},
	Brightness: {
		incoming: {
			start: "brightness(var(--messageInBrightnessStart))",
			end: "brightness(var(--messageInBrightnessEnd))"
		},
		outgoing: {
			start: "brightness(var(--messageOutBrightnessStart))",
			end: "brightness(var(--messageOutBrightnessEnd))"
		}
	},
	HueRotate: {
		incoming: {
			start: "hue-rotate(var(--messageInHueRotateStart))",
			end: "hue-rotate(var(--messageInHueRotateEnd))"
		},
		outgoing: {
			start: "hue-rotate(var(--messageOutHueRotateStart))",
			end: "hue-rotate(var(--messageOutHueRotateEnd))"
		}
	},
	Saturate: {
		incoming: {
			start: "saturate(var(--messageInSaturateStart))",
			end: "saturate(var(--messageInSaturateEnd))"
		},
		outgoing: {
			start: "saturate(var(--messageOutSaturateStart))",
			end: "saturate(var(--messageOutSaturateEnd))"
		}
	},
	Blur: {
		incoming: {
			start: "blur(var(--messageInBlurStart))",
			end: "blur(var(--messageInBlurEnd))"
		},
		outgoing: {
			start: "blur(var(--messageOutBlurStart))",
			end: "blur(var(--messageOutBlurEnd))"
		}
	}
};

const ffzModifiers = {
	Hidden: 1,
	FlipX: 2,
	FlipY: 4,
	GrowX: 8,
	Rainbow: 2048,
	HyperRed: 4096,
	HyperShake: 8192,
	Cursed: 16384,
	Jam: 32768,
	Bounce: 65536
};