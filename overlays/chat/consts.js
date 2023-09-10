const overlayRevision = 23;
const overlayRevisionTimestamp = 1694364941668;

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
		badges: ["anonymous-cheerer", "bits", "bits-charity"],
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
		badges: ["glhf-pledge"],
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