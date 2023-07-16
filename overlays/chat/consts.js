const overlayRevision = 8;

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
		setting: "enableTwitchRoleBadges"
	},
	staff: {
		badges: ["admin", "global_mod", "staff", "twitchbot", "user-anniversary"],
		setting: "enableTwitchStaffBadges"
	},
	partner: {
		badges: ["ambassador", "partner"],
		setting: "enableTwitchPartnerBadges"
	},
	bits: {
		badges: ["anonymous-cheerer", "bits", "bits-charity"],
		setting: "enableTwitchBitsBadges"
	},
	leaderboard: {
		badges: ["bits-leader", "clip-champ", "sub-gift-leader"],
		setting: "enableTwitchLeaderboardBadges"
	},
	founder: {
		badges: ["founder"],
		setting: "enableTwitchFounderBadges"
	},
	charity: {
		badges: ["glhf-pledge"],
		setting: "enableTwitchCharityBadges"
	},
	convention: {
		badges: ["glitchcon2020", "twitchcon2017", "twitchcon2018", "twitchconAmsterdam2020", "twitchconEU2019", 
				 "twitchconEU2022", "twitchconEU2023", "twitchconNA2019", "twitchconNA2020", "twitchconNA2022",
				 "superultracombo-2023"],
		setting: "enableTwitchConBadges"
	},
	hypetrain: {
		badges: ["hype-train"],
		setting: "enableTwitchHypeTrainBadges"
	},
	moments: {
		badges: ["moments"],
		setting: "enableTwitchMomentsBadges"
	},
	status: {
		badges: ["no_audio", "no_video"],
		setting: "enableTwitchStatusBadges"
	},
	predictions: {
		badges: ["predictions"],
		setting: "enableTwitchPredictionsBadges"
	},
	prime: {
		badges: ["premium"],
		setting: "enableTwitchPrimeGamingBadges",
	},
	gifter: {
		badges: ["sub-gifter"],
		setting: "enableTwitchSubGiftsBadges"
	},
	subscriber: {
		badges: ["subscriber"],
		setting: "enableTwitchSubscriberBadges"
	},
	turbo: {
		badges: ["turbo"],
		setting: "enableTwitchTurboBadges"
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