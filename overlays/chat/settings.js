const settings = {
	chat: {
		secondsVisible: 45,
		alwaysShowPFP: false,
		opacityDecreaseStep: 0.07,
		commandCharacter: "!",
		hideAccounts: [
			"streamlabs",
			"streamelements",
			"kofistreambot",
			"nightbot",
			"nottheblackparrot",
			"moobot",
			"soundalerts",
			"sery_bot",
			"commanderroot",
			"wizebot",
			"fossabot",
			"blerp",
			"revolverlanceobot"
		],
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