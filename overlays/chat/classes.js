class GlobalEmoteSet {
	#emoteByIDs = {};

	constructor() {
	}

	addEmote(emote) {
		if(!(emote instanceof Emote)) {
			return false;
		}

		this[emote.emoteName] = emote;
		this.#emoteByIDs[emote.emoteID] = emote;

		return true;
	}

	deleteEmote(id) {
		if(!(id in this.#emoteByIDs)) {
			return false;
		}

		let emote = this.#emoteByIDs[id];

		delete this[emote.emoteName];
		delete this.#emoteByIDs[id];

		return true;
	}

	updateEmote(id, newName) {
		if(!(id in this.#emoteByIDs)) {
			return false;
		}

		let emote = this.#emoteByIDs[id];
		delete this[emote.emoteName];

		emote.emoteName = newName;
		this[newName] = emote;

		return true;
	}
}

class Emote {
	constructor(opts) {
		if(typeof opts === "undefined") {
			return false;
		}
		if(!("urls" in opts) || !("emoteName" in opts)) {
			return false;
		}

		this.urls = opts.urls;
		this.emoteName = opts.emoteName;

		this.emoteID = ("emoteID" in opts ? opts.emoteID : null);
		this.service = ("service" in opts ? opts.service : null);
		this.isZeroWidth = ("isZeroWidth" in opts ? opts.isZeroWidth : false);
		this.modifiers = ("modifiers" in opts ? opts.modifiers : []);
		this.global = opts.global || false;

		return this;
	}

	get url() {
		return this.urls[(localStorage.getItem("setting_useLowQualityImages") === "true" ? "low" : "high")];
	}

	get enabled() {
		if(localStorage.getItem(`setting_enable${this.service.toUpperCase()}`) === "false") {
			return false;
		}
		if(localStorage.getItem(`setting_enable${this.service.toUpperCase()}${this.global ? "Global" : "Channel"}Emotes`) === "false") {
			return false;
		}

		return true;
	}
}

class User {
	constructor(opts) {
		this.id = opts.id;
		this.displayName = opts.name;
		this.username = opts.username;
		this.moderator = opts.moderator || null;
		this.avatar = opts.avatar;
		this.broadcasterType = opts.broadcasterType;
		this.created = new Date(opts.created).getTime();
		this.bot = isUserBot(opts.username);

		this.entitlements = {
			twitch: {
				badges: {
					list: {},
					info: []
				},
				color: opts.color || null
			},
			sevenTV: {
				badges: [],
				paint: null
			},
			ffz: {
				badges: []
			},
			bttv: {
				badge: null
			},
			overlay: {
				badges: [],
				prominentColor: "var(--defaultNameColor)",
				checkedForProminentColor: false
			},
			pronouns: {
				value: null
			}
		};

		if(this.bot) {
			this.entitlements.overlay.badges.push({
				urls: {
					high: "icons/gear.png",
					low: "icons/gear.png"
				},
				color: "var(--botBadgeColor)",
				type: "bot"
			});
		}
		if(this.broadcasterType === "affiliate") {
			this.entitlements.overlay.badges.push({
				urls: {
					high: "icons/seedling.png",
					low: "icons/seedling.png"
				},
				color: "var(--affiliateBadgeColor)",
				type: "affiliate"
			});
		}

		if(this.id !== "-1") {
			this.setPronouns();
			this.#setFFZBadges();
		} else {
			this.entitlements.pronouns.value = "any";
		}
	}

	setSevenTVPaint(ref_id) {
		this.entitlements.sevenTV.paint = ref_id;
	}

	getProminentColor() {
		// calling this in a very specific spot in messages.js because i can't await in a constructor, grrr
		let argh = this;

		return new Promise(function(resolve, reject) {
			if(parseInt(argh.id) === -1) {
				resolve("var(--defaultNameColor)");
				return;
			}

			if(argh.entitlements.overlay.checkedForProminentColor) {
				resolve(argh.entitlements.overlay.prominentColor);
				return;
			}

			Vibrant.from(argh.avatar).maxDimension(120).maxColorCount(80).getPalette().then(function(swatches) {
				console.log(swatches);

				let wantedSwatch = swatches["Vibrant"];
				if(wantedSwatch._population === 0) {
					let maxPop = 0;

					for(let swatch of swatches) {
						if(!swatch._population) {
							continue;
						}

						if(swatch._population > maxPop) {
							wantedSwatch = swatch;
						}
					}
				}

				resolve(wantedSwatch.getHex());
			}).catch(function() {
				resolve("var(--defaultNameColor)");
			});

			argh.entitlements.overlay.checkedForProminentColor = true;
		});
	}

	async setPronouns() {
		const fetchResponse = await fetch(`https://pronouns.alejo.io/api/users/${this.username}`);

		if(!fetchResponse.ok) {
			return;
		}

		const data = await fetchResponse.json();

		console.log(data);

		if(data.length) {
			let oldValue = this.entitlements.pronouns.value;
			this.entitlements.pronouns.value = data[0].pronoun_id;
			this.#updatePronounBlocks(oldValue);
		}
	}

	#updatePronounBlocks(oldValue) {
		if(oldValue) {
			$(`.chatBlock[data-userid="${this.id}"] .pronouns`).removeClass(`pronouns_${oldValue}`);
		}
		$(`.chatBlock[data-userid="${this.id}"] .pronouns`).addClass(`pronouns_${this.entitlements.pronouns.value}`).show();
	}

	async #setFFZBadges() {
		const fetchResponse = await fetch(`https://api.frankerfacez.com/v1/user/id/${this.id}`);

		if(!fetchResponse.ok) {
			return;
		}

		const response = await fetchResponse.json();

		console.log(response);

		if(!("status" in response)) {
			let badges = response.badges;
			for(let i in badges) {
				let badge = badges[i];
				if(badge.name === "bot") {
					continue;
				}

				this.entitlements.ffz.badges.push(new FFZBadge({high: badge.urls[4 in badge.urls ? 4 : 1], low: badge.urls[1]}, badge.color));
			}
		}

		renderFFZBadges(this, $(`.chatBlock[data-userid="${this.id}"] .badges`));
	}

	async updateAvatar() {
		let response = await callTwitchAsync({
			endpoint: "users",
			args: {
				id: this.id
			}
		});
		let userDataRaw = response.data[0];

		let oldAvatar = this.avatar.substring(0);
		this.avatar = userDataRaw.profile_image_url;

		$(`.pfp[src="${oldAvatar}"]`).fadeOut(250, function() {
			$(`.pfp[src="${oldAvatar}"]`).attr("src", userDataRaw.profile_image_url).fadeIn(250);
		});
	}

	get avatarEnabled() {
		if(!localStorage.getItem(`showpfp_${this.id}`)) {
			localStorage.setItem(`showpfp_${this.id}`, "yes");
		}

		if(localStorage.getItem(`showpfp_${this.id}`) === "no") {
			return false;
		}
		if(localStorage.getItem("setting_hideDefaultAvatars") === "true" && this.avatar.indexOf("user-default-pictures") !== -1) {
			return false;
		}
		if(localStorage.getItem("setting_avatarAllowedEveryone") === "true") {
			return true;
		}

		if(localStorage.getItem("setting_avatarAllowedIncludeTotalMessages") === "true") {
			let count = parseInt(localStorage.getItem(`msgCount_${broadcasterData.id}_${this.id}`));
			let maxCount = parseInt(localStorage.getItem("setting_avatarAllowedMessageThreshold"));

			if(count > maxCount) {
				return true;
			}
		}

		if(localStorage.getItem("setting_avatarAllowedAffiliates") === "true" && this.broadcasterType === "affiliate") {
			return true;
		}

		let badges = this.entitlements.twitch.badges;

		if(typeof badges.list !== "object" || badges.list === null) {
			return false;
		}

		if(localStorage.getItem("setting_avatarAllowedModerators") === "true" && ("broadcaster" in badges.list || "moderator" in badges.list)) {
			return true;
		} else if(localStorage.getItem("setting_avatarAllowedVIPs") === "true" && "vip" in badges.list) {
			return true;
		} else if(localStorage.getItem("setting_avatarAllowedSubscribers") === "true" && ("subscriber" in badges.list || "founder" in badges.list)) {
			return true;
		} else if(localStorage.getItem("setting_avatarAllowedTurbo") === "true" && "turbo" in badges.list) {
			return true;
		} else if(localStorage.getItem("setting_avatarAllowedPrime") === "true" && "premium" in badges.list) {
			return true;
		} else if(localStorage.getItem("setting_avatarAllowedArtist") === "true" && "artist-badge" in badges.list) {
			return true;
		} else if(localStorage.getItem("setting_avatarAllowedPartner") === "true" && (this.broadcasterType === "partner" || this.broadcasterType === "ambassador")) {
			return true;
		} else if(localStorage.getItem("setting_avatarAllowedStaff") === "true" && ("staff" in badges.list || "admin" in badges.list || "global_mod" in badges.list)) {
			return true;
		} else if(localStorage.getItem("setting_avatarAllowedIncludeBits") === "true" && ("bits" in badges.list || "bits-leader" in badges.list)) {
			if("bits-leader" in badges.list) {
				return true;
			} else if("bits" in badges.list) {
				let bitAmount = parseInt(badges.list.bits);
				if(bitAmount >= parseInt(localStorage.getItem("setting_avatarAllowedBitsMinimum"))) {
					return true;
				}
			}
		} else if(localStorage.getItem("setting_avatarAllowedIncludeGifts") === "true" && ("sub-gifter" in badges.list || "sub-gift-leader" in badges.list)) {
			if("sub-gift-leader" in badges.list) {
				return true;
			} else if("sub-gifter" in badges.list) {
				let giftAmount = parseInt(badges.list['sub-gifter']);
				if(giftAmount >= parseInt(localStorage.getItem("setting_avatarAllowedGiftsMinimum"))) {
					return true;
				}
			}
		}

		return false;
	}
}

class UserSet {
	constructor() {
	}

	async getUser(id) {
		if(id in this) {
			return this[id];
		} else {
			this[id] = null;
		}

		console.log(`creating new user object for ${id}`);

		let userDataRaw;
		if(id !== "-1") {
			let response = await callTwitchAsync({
				endpoint: "users",
				args: {
					id: id
				}
			});

			userDataRaw = response.data[0];
			console.log(userDataRaw);
		} else {
			userDataRaw = {
				display_name: `Chat Overlay (r${overlayRevision})`,
				login: "<system>",
				profile_image_url: `twemoji/svg/${(0x1f300 + Math.ceil(Math.random() * 8)).toString(16)}.svg`,
				broadcaster_type: null,
				created_at: Date.now()
			}
		}

		this[id] = new User({
			id: id,
			name: (userDataRaw.display_name || userDataRaw.login),
			username: userDataRaw.login,
			avatar: userDataRaw.profile_image_url,
			broadcasterType: userDataRaw.broadcaster_type,
			created: userDataRaw.created_at
		});

		return this[id];
	}
}

class SevenTVEntitlements {
	constructor() {
	}

	getBadge(id) {
		if(id in this) {
			return this[id];
		}

		this[id] = new SevenTVBadge(id);
		return this[id];
	}

	getPaint(id) {
		if(id in this) {
			return this[id];
		}

		return null;
	}

	createPaint(id, data) {
		if(!(id in this)) {
			this[id] = new SevenTVPaint(id, data);
		}
		return this[id];
	}
}

class SevenTVBadge {
	id = null;
	urls = {};

	constructor(id) {
		this.id = id;
		this.urls = {
			high: `https://cdn.7tv.app/badge/${id}/3x`,
			low: `https://cdn.7tv.app/badge/${id}/1x`
		}
	}
}

class SevenTVPaint {
	id = null;
	data = {};

	constructor(id, data) {
		this.id = id;
		this.data = data;
	}
}

class FFZBadge {
	urls = {};
	color = null;

	constructor(urls, color) {
		this.urls = urls;
		this.color = color;
	}
}