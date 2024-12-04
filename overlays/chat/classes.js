class GlobalEmoteSet {
	emoteByIDs = {};

	constructor() {
	}

	addEmote(emote) {
		if(!(emote instanceof Emote)) {
			return false;
		}

		const encodedElement = document.createElement("p");
		encodedElement.textContent = emote.emoteName;
		const encoded = encodedElement.innerHTML.substr(0);
		encodedElement.remove();

		this[emote.emoteName] = emote;
		if(emote.emoteName !== encoded) {
			this[encoded] = emote;
		}
		this.emoteByIDs[emote.emoteID] = emote;

		return true;
	}

	deleteEmote(id, setID) {
		if(!(id in this.emoteByIDs)) {
			return false;
		}

		let emote = this.emoteByIDs[id];

		console.log(setID, emote.setID);

		if(setID === emote.setID) {
			delete this[emote.emoteName];
			delete this.emoteByIDs[id];
		}

		return true;
	}

	updateEmote(id, newName) {
		if(!(id in this.emoteByIDs)) {
			return false;
		}

		let emote = this.emoteByIDs[id];
		delete this[emote.emoteName];

		emote.emoteName = newName;
		this[newName] = emote;

		return true;
	}

	clearCacheObjects() {
		for(const emoteName in this) {
			// tHiS iS nOt ItErAbLe
			const emote = this[emoteName];
			delete emote.cacheObject;
		}
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
		this.setID = ("setID" in opts ? opts.setID : null);
		this.service = ("service" in opts ? opts.service : null);
		this.isZeroWidth = ("isZeroWidth" in opts ? opts.isZeroWidth : false);
		this.modifiers = ("modifiers" in opts ? opts.modifiers : []);
		this.global = opts.global || false;
		this.animated = opts.animated || false;

		return this;
	}

	get url() {
		const argh = this;
		const url = this.urls[(localStorage.getItem("setting_useLowQualityImages") === "true" ? "low" : "high")];

		return new Promise(async function(resolve, reject) {
			if(argh.cacheObject) {
				return resolve(argh.cacheObject);
			}

			if(argh.service === "bttv") {
				if(argh.animated) {
					return resolve(url.replace(".###", `.${localStorage.getItem("setting_emoteFormatBTTV")}`));
				} else {
					let format = localStorage.getItem("setting_emoteFormatBTTV");
					if(format === "gif") {
						format = "png";
					}

					return resolve(url.replace(".###", `.${format}`));
				}
			}

			if(argh.service === "7tv") {
				if(argh.animated) {
					return resolve(url.replace(".###", `.${localStorage.getItem("setting_emoteFormat7TV")}`));
				} else {
					let format = localStorage.getItem("setting_emoteFormat7TV");
					if(format === "gif") {
						format = "png";
					}

					return resolve(url.replace(".###", `.${format}`));
				}
			}

			const cacheStorage = await caches.open("emoteCache");

			var cachedResponse = await cacheStorage.match(url);
			if(!cachedResponse) {
				await cacheStorage.add(url);
				cachedResponse = await cacheStorage.match(url);
			}

			const blob = await cachedResponse.blob();
			argh.cacheObject = URL.createObjectURL(blob);
			resolve(argh.cacheObject);
		});
	}

	get enabled() {
		if(this.service === "twitch") {
			return true;
		}

		if(localStorage.getItem(`setting_enable${this.service.toUpperCase()}`) === "false") {
			return false;
		}
		if(localStorage.getItem(`setting_enable${this.service.toUpperCase()}${this.global ? "Global" : "Channel"}Emotes`) === "false") {
			return false;
		}

		return true;
	}
}

function widthTest(user, roomID, callback) {
	console.log("width test called");
	const veryTraditional = (localStorage.getItem("setting_elementFlowForceMoreTradition") === "true" && localStorage.getItem("setting_chatOverlayIsTraditional") === "true");
	const parentWidth = (veryTraditional ? parseInt(localStorage.getItem("setting_chatOverlayViewerInfoWidth")) : $("#wrapper").innerWidth());

	const testIdentifier = `testRoot-${Date.now()}`;
	const testRoot = user.userBlock.render(roomID);
	testRoot.find(".forceHide").removeClass("forceHide");
	const testChatBlock = $(`<div class="chatBlock ${testIdentifier}"></div>`);
	testChatBlock.append(testRoot);
	$("#testWrapper").append(testChatBlock);

	const originalBlocks = user.userBlock;
	const badgeBlock = testRoot.children(".badges");
	const flagBlock = testRoot.children(".flags");
	const pronounsBlock = testRoot.children(".pronouns");
	const pfpBlock = testRoot.children(".pfp");
	const nameBlock = testRoot.children(".name");

	testRoot.waitForImages({
		finished: function() {
			console.log("render: images loaded");

			badgesArePresent = false;
			badgeBlock.children(".badgeWrap").each(function(badgeIdx) {
				let badgeElem = $(this);
				if(badgeElem.is(":visible")) {
					badgesArePresent = true;
				}
			});

			if(!badgesArePresent) {
				badgeBlock.hide();
				originalBlocks.badgeBlock[roomID].hide();
			}

			if(testRoot.width() > parentWidth) {
				flagBlock.addClass("forceHide");
				originalBlocks.flagBlock.addClass("forceHide");
			} else {
				flagBlock.removeClass("forceHide");
				badgeBlock.removeClass("forceHide");
				badgeBlock.children(".badgeWrap").removeClass("forceHide");
				pfpBlock.removeClass("forceHide");
				pronounsBlock.removeClass("forceHide");
				nameBlock.children().removeClass("clip");

				originalBlocks.flagBlock.removeClass("forceHide");
				originalBlocks.badgeBlock[roomID].removeClass("forceHide");
				originalBlocks.badgeBlock[roomID].children(".badgeWrap").removeClass("forceHide");
				originalBlocks.pfpBlock.removeClass("forceHide");
				originalBlocks.pronounsBlock.removeClass("forceHide");
				originalBlocks.displayNameBlock.removeClass("clip");
				originalBlocks.internationalNameBlock.removeClass("clip");
			}

			if(testRoot.width() > parentWidth) {
				const badges = [];
				const originalBadges = [];

				badgeBlock.children(".badgeWrap").each(function(idx) {
					badges.push($(this));
				});
				originalBlocks.badgeBlock[roomID].children(".badgeWrap").each(function(idx) {
					originalBadges.push($(this));
				});

				for(let idx = badges.length - 1; idx >= 0; idx--) {
					if(testRoot.width() > parentWidth) {
						const badge = badges[idx];
						const originalBadge = originalBadges[idx];

						badge.addClass("forceHide");
						originalBadge.addClass("forceHide");
					} else {
						break;
					}
				}

				if(!badgeBlock.children(":visible").length) {
					badgeBlock.addClass("forceHide");
					originalBlocks.badgeBlock[roomID].addClass("forceHide");
				}
			} else {
				badgeBlock.removeClass("forceHide");
				badgeBlock.children(".badgeWrap").removeClass("forceHide");
				pfpBlock.removeClass("forceHide");
				pronounsBlock.removeClass("forceHide");
				nameBlock.children().removeClass("clip");

				originalBlocks.badgeBlock[roomID].removeClass("forceHide");
				originalBlocks.badgeBlock[roomID].children(".badgeWrap").removeClass("forceHide");
				originalBlocks.pfpBlock.removeClass("forceHide");
				originalBlocks.pronounsBlock.removeClass("forceHide");
				originalBlocks.displayNameBlock.removeClass("clip");
				originalBlocks.internationalNameBlock.removeClass("clip");
			}

			if(testRoot.width() > parentWidth) {
				pfpBlock.addClass("forceHide");
				originalBlocks.pfpBlock.addClass("forceHide");
			} else {
				pfpBlock.removeClass("forceHide");
				pronounsBlock.removeClass("forceHide");
				nameBlock.children().removeClass("clip");

				originalBlocks.pfpBlock.removeClass("forceHide");
				originalBlocks.pronounsBlock.removeClass("forceHide");
				originalBlocks.displayNameBlock.removeClass("clip");
				originalBlocks.internationalNameBlock.removeClass("clip");
			}

			if(testRoot.width() > parentWidth) {
				pronounsBlock.addClass("forceHide");
				originalBlocks.pronounsBlock.addClass("forceHide");
			} else {
				pronounsBlock.removeClass("forceHide");
				nameBlock.children().removeClass("clip");

				originalBlocks.pronounsBlock.removeClass("forceHide");
				originalBlocks.displayNameBlock.removeClass("clip");
				originalBlocks.internationalNameBlock.removeClass("clip");
			}

			if(testRoot.width() > parentWidth) {
				nameBlock.children().addClass("clip");
				originalBlocks.displayNameBlock.addClass("clip");
				originalBlocks.internationalNameBlock.addClass("clip");
			} else {
				nameBlock.children().removeClass("clip");

				originalBlocks.displayNameBlock.removeClass("clip");
				originalBlocks.internationalNameBlock.removeClass("clip");
			}

			$(`.chatBlock[data-userid="${user.id}"] .userInfo`).each(function() {
				const root = $(this);
				const _badgeBlock = root.children(".badges");
				const _badges = _badgeBlock.children(".badgeWrap");
				const _flagBlock = root.children(".flags");
				const _pronounsBlock = root.children(".pronouns");
				const _pfpBlock = root.children(".pfp");
				const _displayNameBlock = root.children(".displayName");
				const _internationalNameBlock = root.children(".internationalName");

				if(originalBlocks.badgeBlock[roomID].hasClass("forceHide")) { _badgeBlock.addClass("forceHide"); }
				originalBlocks.badgeBlock[roomID].children(".badgeWrap").each(function(idx) {
					if($(this).hasClass("forceHide")) {
						$(_badges[idx]).addClass("forceHide");
					}
				})
				if(originalBlocks.flagBlock.hasClass("forceHide")) { _flagBlock.addClass("forceHide"); }
				if(originalBlocks.pronounsBlock.hasClass("forceHide")) { _pronounsBlock.addClass("forceHide"); }
				if(originalBlocks.pfpBlock.hasClass("forceHide")) { _pfpBlock.addClass("forceHide"); }
				if(originalBlocks.displayNameBlock.hasClass("clip")) { _displayNameBlock.addClass("clip"); }
				if(originalBlocks.internationalNameBlock.hasClass("clip")) { _internationalNameBlock.addClass("clip"); }
			});

			$(`.${testIdentifier}`).remove();

			if(typeof callback === "function") {
				callback();
			}
		},
		waitForAll: true
	});
}

class UserBlock {
	constructor(opts) {
		this.user = opts.user;
		this.rootBlock = $('<div class="userInfo"></div>');
		this.badgeBlock = {};
		this.badgeBlock[broadcasterData.id] = $('<div class="badges" style="display: none;"></div>');
		this.flagBlock = $('<div class="flags" style="display: none;"></div>');
		this.pronounsBlock = $('<div class="pronouns" style="display: none;"></div>');
		this.pfpBlock = $('<img class="pfp" src="" style="display: none;"/>');
		this.displayNameBlock = $(`<span class="displayName">${this.user.displayName}</span>`);
		this.internationalNameBlock = $(`<span class="internationalName">${this.user.username}</span>`);
		this.nameBlock = $(`<div class="name" data-userid="${this.user.id}"></div>`);

		this.initUserBlockCustomizations();
		this.updateUserInfoBlock();
	}

	updateUserInfoBlockDirection() {
		this.rootBlock.removeClass("userInfoBackwards");
		this.rootBlock.removeClass("userInfoForwards");
		
		this.rootBlock.addClass((localStorage.getItem("setting_reverseChatMessageUserInfo") === "true" ? "userInfoBackwards" : "userInfoForwards"));
	}

	async updateUserInfoBlock() {
		await this.user.customSettingsFetchPromise;

		this.rootBlock.empty();

		if(localStorage.getItem("setting_chatAnimationsIn") === "true") {
			this.rootBlock.addClass("userInfoIn");
		} else {
			this.rootBlock.removeClass("userInfoIn");
		}

		this.updateUserInfoBlockDirection();

		this.updateNameBlock();
	}

	updateBadgeBlock(roomID) {
		this.user.createTwitchEntitlementsForRoom(roomID);
		let badges = this.user.entitlements.twitch.badges[roomID];

		if(!(roomID in this.badgeBlock)) {
			this.badgeBlock[roomID] = $('<div class="badges" style="display: none;"></div>');
		}

		this.badgeBlock[roomID].empty();
		this.badgeBlock[roomID].hide();

		if(this.user.id === "-1") {
			return;
		}

		if(localStorage.getItem("setting_enableTwitchBadges") === "true") {
			if(localStorage.getItem("setting_enableTwitchSubscriberBadges") === "true" && localStorage.getItem(`setting_enableTwitchFounderBadges`) === "false" && badges.list) {
				if("founder" in badges.list) {
					let monthPoss = [1, 1, 2, 3, 3, 3, 6, 6, 6, 9, 9, 9];
					let founderInt = parseInt(badges.info.founder);
					if(founderInt > monthPoss.length) {
						founderInt -= founderInt % 6;
					}

					badges.list[`subscriber${roomID}`] = founderInt.toString();
				}
			}

			let useLQImages = (localStorage.getItem("setting_useLowQualityImages") === "true");
			for(let badgeType in badges.list) {
				let badgeTypeRaw = badgeType.substr(0);
				if(badgeType === `subscriber${roomID}` || badgeType === `bits${roomID}`) {
					badgeType = badgeType.replace(/[0-9]/g, "");
				}

				let foundBadge = false;

				let badgeElem = $(`<span class="badgeWrap"></span>`);

				for(let checkAgainst in twitchBadgeTypes) {
					let badgeTypeData = twitchBadgeTypes[checkAgainst];
					if(badgeTypeData.badges.indexOf(badgeType) !== -1) {
						foundBadge = true;

						badgeElem.addClass(`${checkAgainst}_badge`);
						if(badgeTypeData.is_solid) {
							badgeElem.addClass("badgeGradient");
						}

						if(badgeTypeRaw in twitchBadges) { // wtf
							if("is_default" in twitchBadges[badgeTypeRaw]) {
								if(twitchBadges[badgeTypeRaw].is_default) {
									badgeElem.addClass("normal_badge");
								}
							}
						}
					}
				}

				if(!foundBadge) {
					// assume it's a game-related badge
					badgeElem.addClass("game_badge");
				}

				let badgeData = getBadgeData(badgeTypeRaw, badges.list[badgeTypeRaw]);
				let url;

				if(!badgeData) {
					// uh, wtf
					continue;
				}

				if(twitchBadges[badgeTypeRaw].is_default && badgeType === "subscriber") {
					var chosenDefaultLength = 0;

					if(localStorage.getItem("setting_forceDefaultSubBadgeToFirstTier") === "false") {
						const monthInt = parseInt(badges.info[badgeTypeRaw]);
						
						for(const lengthIdx in defaultSubBadgeLengths) {
							if(monthInt >= defaultSubBadgeLengths[lengthIdx]) {
								chosenDefaultLength = lengthIdx;
							} else {
								break;
							}
						}
					}

					badgeData = twitchBadges[badgeTypeRaw].versions[chosenDefaultLength];
				}

				if(useLQImages) {
					url = badgeData.image_url_1x;
				} else {
					url = badgeData.image_url_4x;
					if(typeof url === "undefined") {
						url = badgeData.image_url_1x;
					}
				}

				let order = 0;
				if(badgeType in badgeOrder) {
					order = badgeOrder[badgeType];
				}

				badgeElem.css("background-image", `url('${url}')`);
				badgeElem.css("order", order);

				switch(badgeType) {
					case "subscriber":
						badgeElem.addClass("sub_badge");
						break;

					case "bits":
						badgeElem.addClass("bits_badge");
						break;

					default:
						badgeElem.addClass("normal_badge");
						break;
				}

				this.badgeBlock[roomID].append(badgeElem);
				this.badgeBlock[roomID].show();
			}
		}

		const entitlements = this.user.entitlements;

		if(entitlements.overlay.badges.length) {
			for(let i in entitlements.overlay.badges) {
				let badge = entitlements.overlay.badges[i];

				let badgeElem = $(`<span class="badgeWrap normal_badge badgeGradient ${badge.type}Badge"></span>`);
				if(localStorage.getItem("setting_useLowQualityImages") === "true") {
					badgeElem.css("background-image", `url('${badge.urls.low}')`);
				} else {
					badgeElem.css("background-image", `url('${badge.urls.high}')`);
				}

				if("color" in badge) {
					badgeElem.css("background-color", badge.color);
				}

				if(badge.type in badgeOrder) {
					badgeElem.css("order", badgeOrder[badge.type]);
				}

				this.badgeBlock[roomID].prepend(badgeElem);
				if(badgeElem.is(":visible")) {
					this.badgeBlock[roomID].show();
				}
			}	
		}

		this.check7TV(roomID);
		this.checkBTTV(roomID);
		this.checkFFZ(roomID);

		widthTest(this.user, roomID, () => {
			$(`.chatBlock[data-userid="${this.user.id}"][data-roomid="${roomID}"] .badges`).replaceWith(this.badgeBlock[roomID].clone(true));
		});
	}

	check7TV(roomID) {
		const entitlements = this.user.entitlements;
		const customSettings = entitlements.overlay.customSettings;

		if(customSettings) {
			if(customSettings.hide7TVBadge) {
				return;
			}
		}

		if(entitlements.sevenTV.badges.length) {
			for(let i in entitlements.sevenTV.badges) {
				let badge = sevenTVEntitlements.getBadge(entitlements.sevenTV.badges[i]);

				let badgeElem = $(`<span class="badgeWrap normal_badge badgeGradient sevenTVBadge" data-badgeid="${badge.id}"></span>`);
				if(localStorage.getItem("setting_useLowQualityImages") === "true") {
					badgeElem.css("background-image", `url('${badge.urls.low}')`);
				} else {
					badgeElem.css("background-image", `url('${badge.urls.high}')`);
				}

				badgeElem.css("order", badgeOrder.seventv);

				this.badgeBlock[roomID].prepend(badgeElem);
				if(badgeElem.is(":visible")) {
					this.badgeBlock[roomID].show();
				}
			}
		}
	}

	checkBTTV(roomID) {
		const entitlements = this.user.entitlements;
		const customSettings = entitlements.overlay.customSettings;

		if(customSettings) {
			if(customSettings.hideBTTVBadge) {
				return;
			}
		}

		if(entitlements.bttv.badge) {
			let badge = entitlements.bttv.badge;

			let badgeElem = $(`<span class="badgeWrap normal_badge badgeGradient bttvBadge"></span>`);
			if(localStorage.getItem("setting_useLowQualityImages") === "true") {
				badgeElem.css("background-image", `url('${badge.low}')`);
			} else {
				badgeElem.css("background-image", `url('${badge.high}')`);
			}

			badgeElem.css("order", badgeOrder.bttv);

			this.badgeBlock[roomID].prepend(badgeElem);
			if(badgeElem.is(":visible")) {
				this.badgeBlock[roomID].show();
			}
		}
	}

	checkFFZ(roomID) {
		const entitlements = this.user.entitlements;
		const customSettings = entitlements.overlay.customSettings;

		if(customSettings) {
			if(customSettings.hideFFZBadge) {
				return;
			}
		}

		if(entitlements.ffz.badges.length) {
			for(let i in entitlements.ffz.badges) {
				let badge = entitlements.ffz.badges[i];

				let badgeElem = $(`<span class="badgeWrap normal_badge badgeGradient ffzBadge"></span>`);
				if(localStorage.getItem("setting_useLowQualityImages") === "true") {
					badgeElem.css("background-image", `url('${badge.urls.low}')`);
				} else {
					badgeElem.css("background-image", `url('${badge.urls.high}')`);
				}

				if("color" in badge) {
					badgeElem.css("background-color", badge.color);
				}

				badgeElem.css("order", badgeOrder.ffz);

				this.badgeBlock[roomID].prepend(badgeElem);
				if(badgeElem.is(":visible")) {
					this.badgeBlock[roomID].show();
				}
			}
		}
	}

	updateFlagBlock() {
		const customSettings = this.user.entitlements.overlay.customSettings;

		this.flagBlock.hide();
		this.flagBlock.empty();

		if(localStorage.getItem("setting_enableFlags") === "false" || !customSettings) {
			return;
		}

		let flags = customSettings.flags;
		if(!flags.length) {
			return;
		}

		for(let flag of flags) {
			if(!flag) {
				continue;
			}

			let filename = identityFlags[flag];

			this.flagBlock.append($(`<span class="flag${flag} flag" style="background-image: url('flags/${filename}'); display: inline-block;"></div>`));
			this.flagBlock.show();
		}

		$(`.chatBlock[data-userid="${this.user.id}"] .flags`).replaceWith(this.flagBlock.clone(true));
	}

	updatePronounsBlock() {
		this.pronounsBlock.hide();
		this.pronounsBlock.empty();

		if(localStorage.getItem("setting_enablePronouns") === "true") {
			if(this.user.entitlements.pronouns.string !== null) {
				this.pronounsBlock.text(this.user.entitlements.pronouns.string).show();
			}
		}

		for(const roomID in this.badgeBlock) {
			widthTest(this.user, roomID, () => {
				$(`.chatBlock[data-userid="${this.user.id}"] .pronouns`).replaceWith(this.pronounsBlock.clone(true));
			});
		}
	}

	updateAvatarBlock() {
		const customSettings = this.user.entitlements.overlay.customSettings;

		this.pfpBlock.hide();
		this.pfpBlock.empty();

		if(localStorage.getItem("setting_enableAvatars") === "false") {
			return;
		}

		if(!this.user.avatar) {
			return;
		}

		this.pfpBlock.attr("src", this.user.avatarImage);

		if(customSettings && localStorage.getItem("setting_allowUserCustomizations") === "true" && localStorage.getItem("setting_allowUserAvatarShape") === "true" && localStorage.getItem("setting_allowSampleMessages") === "false") {
			if(!customSettings.useDefaultAvatarBorderRadius) {
				this.pfpBlock.css("border-radius", `var(--pfpShape${this.user.id})`);
			}
		}

		console.log(this.user);
		if(this.user.avatarEnabled) {
			console.log("avatar is allowed");
			this.pfpBlock.show();
		} else {
			console.log("avatar is not allowed");
			this.pfpBlock.hide();
		}

		$(`.chatBlock[data-userid="${this.user.id}"] .pfp`).replaceWith(this.pfpBlock.clone(true));
	}

	updateNameBlock() {
		const entitlements = this.user.entitlements;
		const customSettings = entitlements.overlay.customSettings;

		this.internationalNameBlock.hide();

		let useDisplayName = true;
		if(customSettings.useUsername) {
			useDisplayName = false;
		}

		let showInternationalNameBlock = false;
		let name = this.user.username;
		if(useDisplayName) {
			name = this.user.displayName;
			let nameTest = name.replace(/[\x00-\xFF]/ug, "");

			if(nameTest.length) {
				this.internationalNameBlock.show();
			}
		}

		this.displayNameBlock.text(name);
		this.internationalNameBlock.text(this.user.username);

		var use7TVPaint = true;
		if(customSettings) {
			if((!customSettings.use7TVPaint || !entitlements.sevenTV.paint) && customSettings.nameGlowEnabled && localStorage.getItem("setting_allowUserCustomizations") === "true" && localStorage.getItem("setting_allowSampleMessages") === "false" && localStorage.getItem("setting_allowUserNameGlow") === "true" && !customSettings.useDefaultNameSettings) {
				// jfc this is a long conditional LMAO
				this.displayNameBlock.css("filter", `var(--effectFilters) var(--nameGlow${this.user.id})`);
				this.internationalNameBlock.css("filter", `var(--effectFilters) var(--nameGlow${this.user.id}) saturate(var(--internationalNameSaturation))`);

				use7TVPaint = false;
			}
		}

		if(entitlements.sevenTV.paint && use7TVPaint) {
			set7TVPaint(this.nameBlock, entitlements.sevenTV.paint, this.user.id);
		}

		this.nameBlock.append(this.displayNameBlock);
		this.nameBlock.append(this.internationalNameBlock);

		$(`.chatBlock[data-userid="${this.user.id}"] .name`).replaceWith(this.nameBlock.clone(true));
	}

	initUserSettingsValues() {
		const user = this.user;
		const customizationOK = (localStorage.getItem("setting_allowUserCustomizations") === "true" && localStorage.getItem("setting_allowSampleMessages") === "false");

		if(!localStorage.getItem(`color_${user.id}`)) {
			let col = user.entitlements.twitch.color;
			if(!col) {
				if(localStorage.getItem("setting_chatNameUsesProminentColorAsFallback") === "true") {
					col = user.entitlements.overlay.prominentColor;
				} else {
					col = "var(--defaultNameColor)";
				}
			}

			if(localStorage.getItem("setting_chatNameUsesProminentColor") === "true") {
				col = user.entitlements.overlay.prominentColor;
			}

			localStorage.setItem(`color_${user.id}`, col);
		}
		if(!localStorage.getItem(`color2_${user.id}`)) {
			localStorage.setItem(`color2_${user.id}`, "var(--defaultNameColorSecondary)");
		}

		let usesCustomColor = true;
		if(localStorage.getItem(`color2_${user.id}`) === "var(--defaultNameColorSecondary)" || !customizationOK) {
			// (user hasn't set custom colors, double check twitch colors are up to date)
			let col;
			if(localStorage.getItem("setting_chatNameUsesProminentColor") === "true") {
				col = user.entitlements.overlay.prominentColor;
			} else {
				col = user.entitlements.twitch.color;
			}

			if(!col) {
				if(localStorage.getItem("setting_chatNameUsesProminentColorAsFallback") === "true") {
					col = user.entitlements.overlay.prominentColor;
				}
			}

			if(col) {
				if(localStorage.getItem("setting_ensureNameColorsAreBrightEnough") === "true") {
					localStorage.setItem(`color_${user.id}`, ensureSafeColor(col));
				} else {
					localStorage.setItem(`color_${user.id}`, col);
				}
			}

			usesCustomColor = false;
		}

		rootCSS().setProperty(`--nameColor${user.id}`, localStorage.getItem(`color_${user.id}`));
		rootCSS().setProperty(`--nameColorSecondary${user.id}`, localStorage.getItem(`color2_${user.id}`));

		return usesCustomColor;
	}

	async initUserBlockCustomizations() {
		await this.user.customSettingsFetchPromise;

		const user = this.user;
		const customSettings = user.entitlements.overlay.customSettings;

		const customizationOK = (localStorage.getItem("setting_allowUserCustomizations") === "true" && localStorage.getItem("setting_allowSampleMessages") === "false");
		const usesCustomColor = this.initUserSettingsValues();

		let allNameElements = this.nameBlock.children();
		let displayNameElement = this.displayNameBlock;
		let internationalNameElement = this.internationalNameBlock;

		let colorToUse = `color_${user.id}`;
		if(localStorage.getItem("setting_chatDefaultNameColorForced") === "true") {
			allNameElements.css("background-color", "var(--nameBackgroundNoGradientDefault)");
			colorToUse = `setting_chatDefaultNameColor`;
		} else {
			allNameElements.css("background-color", `var(--nameColor${user.id})`);

			if(localStorage.getItem("setting_chatNameUsesGradient") === "true" && usesCustomColor && !customSettings) {
				allNameElements.css("background-image", `linear-gradient(var(--nameAngle${user.id}), var(--nameColorSecondary${user.id}) 0%, transparent 75%)`);
			}
		}

		let userColorUsed = localStorage.getItem(colorToUse);
		if(!userColorUsed || userColorUsed === "var(--defaultNameColor)") {
			userColorUsed = localStorage.getItem("setting_chatDefaultNameColor");
		}

		if(localStorage.getItem("setting_chatMessageUserInfoBackgroundReflectUserColor") === "true") {
			rootCSS().setProperty(`--userInfoBGColor${user.id}`, interpolateColor(
				localStorage.getItem("setting_chatMessageUserInfoBackgroundColor"),
				userColorUsed,
				parseFloat(localStorage.getItem(`setting_chatMessageUserInfoBackgroundUserColorAmount`)
			)));
			this.rootBlock.css("background-color", `var(--userInfoBGColor${user.id})`);
		}
		if(localStorage.getItem("setting_chatMessageUserInfoOutlinesReflectUserColor") === "true") {
			rootCSS().setProperty(`--userOutlineColor${user.id}`, interpolateColor(
				localStorage.getItem("setting_chatMessageUserInfoOutlinesColor"),
				userColorUsed,
				parseFloat(localStorage.getItem(`setting_chatMessageUserInfoOutlinesUserColorAmount`)
			)));
			this.rootBlock.css("border-color", `var(--userOutlineColor${user.id})`);
		}
		if(localStorage.getItem("setting_pronounsReflectUserColor") === "true") {
			rootCSS().setProperty(`--pronounsColor${user.id}`, interpolateColor(
				localStorage.getItem("setting_pronounsColor"),
				userColorUsed,
				parseFloat(localStorage.getItem(`setting_pronounsUserColorAmount`)
			)));
			this.pronounsBlock.css("background-color", `var(--pronounsColor${user.id})`);
		}

		if(customSettings && customizationOK) {
			if(!customSettings.useDefaultNameSettings) {
				if(localStorage.getItem("setting_allowUserCustomNameFonts") === "true") {
					this.nameBlock.css("font-family", `var(--nameFont${user.id})`);
					this.nameBlock.css("font-weight", `var(--nameWeight${user.id})`);
					this.nameBlock.css("font-size", `var(--nameSize${user.id})`);
					allNameElements.css("font-style", `var(--nameStyle${user.id})`);
					allNameElements.css("letter-spacing", `var(--nameSpacing${user.id})`);
					allNameElements.css("text-transform", `var(--nameTransform${user.id})`);
					allNameElements.css("font-variant", `var(--nameVariant${user.id})`);
					allNameElements.css("-webkit-text-stroke", `var(--nameExtraWeight${user.id}) transparent`);
				}

				if(localStorage.getItem("setting_allowUserCustomNameColors") === "true") {
					allNameElements.css("background-image", `var(--nameGradient${user.id})`);
				}

				if(localStorage.getItem("setting_allowUserNameTransforms") === "true") {
					this.nameBlock.css("transform", `var(--nameTransforms${user.id})`);
				}
			}
		}
	}

	render(roomID) {
		const root = this.rootBlock.clone(true);

		const badgeBlock = this.badgeBlock[roomID].clone(true);
		const flagBlock = this.flagBlock.clone(true);
		const pronounsBlock = this.pronounsBlock.clone(true);
		const pfpBlock = this.pfpBlock.clone(true);
		const nameBlock = this.nameBlock.clone(true);

		root.append(badgeBlock);
		root.append(flagBlock);
		root.append(pronounsBlock);
		root.append(pfpBlock);
		root.append(nameBlock);

		return root;
	}
}

class User {
	constructor(opts) {
		this.id = opts.id;
		this.displayName = opts.name;
		this.username = opts.username;
		this.moderator = opts.moderator || null;
		this.avatar = opts.avatar;
		this.avatarImage = null;
		this.avatarBroken = false;
		this.broadcasterType = opts.broadcasterType;
		this.created = new Date(opts.created).getTime();
		this.bot = isUserBot(opts.username);
		this.userBlock = new UserBlock({user: this});

		this.customSettingsFetchPromise = new Promise(async (resolve, reject) => {
			const state = await this.getUserSettings();
			this.fetchedCustomSettings = true;

			if(state) {
				resolve();
			} else {
				reject("getUserSettings didn't apply");
			}
		}).catch(function(msg) {
			console.warn(msg);
		});

		this.entitlements = {
			twitch: {
				badges: {},
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
				checkedForProminentColor: false,
				customSettings: false,
				fetchedCustomSettings: false
			},
			pronouns: {
				primary: null,
				secondary: null,
				string: null
			}
		};

		this.entitlements.twitch.badges[broadcasterData.id] = {
			list: {},
			info: []
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
		}
	}

	get allowSevenTVPaint() {
		if(localStorage.getItem("setting_enable7TVUserPaints") === "false") {
			return false;
		}

		if(localStorage.getItem("setting_allowUserCustomizations") === "true") {
			if(localStorage.getItem("setting_allowUserCustomNameColors") === "true") {
				if(this.entitlements.overlay.customSettings) {
					if("use7TVPaint" in this.entitlements.overlay.customSettings) {
						if(!this.entitlements.overlay.customSettings.use7TVPaint) {
							return false;
						}
					}
				}
			}
		}

		return true;
	}

	setSevenTVPaint(ref_id) {
		this.entitlements.sevenTV.paint = ref_id;
		set7TVPaint(this.userBlock.nameBlock, ref_id, this.id);
		this.userBlock.updateNameBlock();
	}

	async refreshProminentColor() {
		const cacheStorage = await caches.open("avatarCache-v2");
		var response = await cacheStorage.match(this.avatar);

		if(!response.ok) {
			this.avatarBroken = true;
			return new Promise(async function(resolve, reject) {
				resolve("var(--defaultNameColor)");
			});
		}

		return new Promise(async (resolve, reject) => {
			if(parseInt(this.id) === -1) {
				return resolve("var(--defaultNameColor)");
			}

			if(this.entitlements.overlay.checkedForProminentColor) {
				return resolve(this.entitlements.overlay.prominentColor);
			}

			// hacky workaround as vibrant doesn't support loading from blob objects
			const blob = await response.blob();
			const bitmap = await createImageBitmap(blob);
			let canvas = document.createElement('canvas');
			let ctx = canvas.getContext('2d');
			ctx.drawImage(bitmap, 0, 0);

			Vibrant.from(canvas.toDataURL("image/png")).maxColorCount(80).getPalette().then((swatches) => {
				console.log(swatches);

				let wantedSwatch = swatches["Vibrant"];
				if(wantedSwatch._population === 0) {
					let maxPop = 0;

					for(let swatchIdx in swatches) {
						let swatch = swatches[swatchIdx];
						if(!swatch._population) {
							continue;
						}

						if(swatch._population > maxPop) {
							wantedSwatch = swatch;
						}
					}
				}

				this.entitlements.overlay.prominentColor = wantedSwatch.getHex();
				resolve(this.entitlements.overlay.prominentColor);
			}).catch(function(error) {
				console.warn(error);
				resolve("var(--defaultNameColor)");
			});

			this.entitlements.overlay.checkedForProminentColor = true;
		});
	}

	async setPronouns() {
		const fetchResponse = await fetch(`https://api.pronouns.alejo.io/v1/users/${this.username}`);

		if(!fetchResponse.ok) {
			console.log(`failed to fetch pronouns for ${this.username}`);
			return;
		}

		const data = await fetchResponse.json();
		console.log(`fetched pronouns for ${this.username}`);
		console.log(data);

		this.entitlements.pronouns.primary = data.pronoun_id;
		this.entitlements.pronouns.secondary = data.alt_pronoun_id;
		this.entitlements.pronouns.string = this.pronounString();
		this.updatePronounBlocks();

		await this.userBlock.updatePronounsBlock();
	}

	pronounString() {
		let tags = this.entitlements.pronouns;
		if(tags.primary === null) {
			return null;
		}

		let separator = localStorage.getItem("setting_pronounsSeparator");
		if(typeof separator === "undefined") {
			separator = " / ";
		}

		if(pronounTags[tags.primary].singular) {
			return pronounTags[tags.primary].subject;
		}
		return [pronounTags[tags.primary].subject, (tags.secondary ? pronounTags[tags.secondary].subject : pronounTags[tags.primary].object)].join(separator);
	}

	updatePronounBlocks() {
		this.entitlements.pronouns.string = this.pronounString();
		this.userBlock.updatePronounsBlock();
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

		for(const roomID in this.userBlock.badgeBlock) {
			await this.userBlock.updateBadgeBlock(roomID);
		}
	}

	async refreshCachedAvatar() {
		const cacheStorage = await caches.open("avatarCache-v2");
		await cacheStorage.delete(this.avatar);
		if(this.avatarImage) {
			URL.revokeObjectURL(this.avatarImage);
		}

		// in case the URL for the user's avatar also changes
		const response = await callTwitchAsync({
			endpoint: "users",
			args: {
				id: this.id
			}
		});

		let data = response.data[0];
		this.avatar = data.profile_image_url;

		const success = await this.cacheAvatar();
		if(success) {
			let user = this;
			$(`.chatBlock[data-userid="${user.id}"] .pfp`).fadeOut(250, function() {
				$(this).attr("src", user.avatarImage).fadeIn(250);
			});
		}

		await this.userBlock.updateAvatarBlock();
	}

	async cacheAvatar() {
		if(this.avatarBroken) {
			return false;
		}

		if(!this.avatar) {
			console.log(`avatar field on ${this.id} was empty, re-fetching`);
			const response = await callTwitchAsync({
				endpoint: "users",
				args: {
					id: this.id
				}
			});

			let data = response.data[0];
			this.avatar = data.profile_image_url;
		}

		const cacheStorage = await caches.open("avatarCache-v2");
		var cachedResponse = await cacheStorage.match(this.avatar);

		if(!cachedResponse) {
			console.log(`caching avatar for ${this.username}`);

			const blob = await fetchBlob(this.avatar);
			if(!blob) {
				this.avatarBroken = true;
				return false;
			}
			const size = parseInt(localStorage.getItem("setting_avatarSize")) * 2;
			const compressed = await compressAvatarBlob(blob, size, 0.8, false);
			const response = new Response(compressed.data, {
				headers: {
					'Content-Type': compressed.type,
					'X-Cache-Timestamp': Date.now(),
					'X-Cache-Image-Size': size
				}
			});
			await cacheStorage.put(this.avatar, response);

			this.avatarImage = URL.createObjectURL(compressed.data);
			await this.refreshProminentColor();
		} else {
			if(!cachedResponse.ok) { return false; }

			const timestamp = parseInt(cachedResponse.headers.get("X-Cache-Timestamp"));
			const size = parseInt(localStorage.getItem("setting_avatarSize")) * 2;
			const oldSize = parseInt(cachedResponse.headers.get("X-Cache-Image-Size"));

			if(Date.now() - timestamp > 604800000 || size !== oldSize) {
				// 1 week, refetch
				console.log(`cached avatar for ${this.username} is stale, re-fetching...`);
				cacheStorage.delete(this.avatar);
				URL.revokeObjectURL(this.avatarImage);
				return await this.cacheAvatar();
			} else {
				const blob = await cachedResponse.blob();
				this.avatarImage = URL.createObjectURL(blob);
			}

			await this.refreshProminentColor();
		}

		await this.userBlock.updateAvatarBlock();
		this.userBlock.initUserBlockCustomizations();

		return true;
	}

	get avatarEnabled() {
		if(this.avatarBroken) {
			return false;
		}

		if(this.id === "-1") {
			return false;
		}

		if(this.customSettings) {
			if(!this.customSettings.showAvatar) {
				return false;
			}
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

		for(const mainRoomID in this.userBlock.badgeBlock) {
			const badges = this.entitlements.twitch.badges[mainRoomID];

			if(typeof badges.list !== "object" || badges.list === null) {
				return false;
			}

			if(localStorage.getItem("setting_avatarAllowedModerators") === "true" && ("broadcaster" in badges.list || "moderator" in badges.list)) {
				return true;
			}
			if(localStorage.getItem("setting_avatarAllowedVIPs") === "true" && "vip" in badges.list) {
				return true;
			}
			if(localStorage.getItem("setting_avatarAllowedSubscribers") === "true") {
				if("founder" in badges.list) {
					return true;
				}

				if(`subscriber${mainRoomID}` in badges.list) {
					return true;
				}
			}
			if(localStorage.getItem("setting_avatarAllowedTurbo") === "true" && "turbo" in badges.list) {
				return true;
			}
			if(localStorage.getItem("setting_avatarAllowedPrime") === "true" && "premium" in badges.list) {
				return true;
			}
			if(localStorage.getItem("setting_avatarAllowedArtist") === "true" && "artist-badge" in badges.list) {
				return true;
			}
			if(localStorage.getItem("setting_avatarAllowedPartner") === "true" && (this.broadcasterType === "partner" || this.broadcasterType === "ambassador")) {
				return true;
			}
			if(localStorage.getItem("setting_avatarAllowedStaff") === "true" && ("staff" in badges.list || "admin" in badges.list || "global_mod" in badges.list)) {
				return true;
			}
			if(localStorage.getItem("setting_avatarAllowedIncludeBits") === "true" && (`bits${mainRoomID}` in badges.list || "bits-leader" in badges.list)) {
				if("bits-leader" in badges.list) {
					return true;
				} else if(`bits${mainRoomID}` in badges.list) {
					let bitAmount = parseInt(badges.list[`bits${mainRoomID}`]);
					if(bitAmount >= parseInt(localStorage.getItem("setting_avatarAllowedBitsMinimum"))) {
						return true;
					}
				}
			}
			if(localStorage.getItem("setting_avatarAllowedIncludeGifts") === "true" && ("sub-gifter" in badges.list || "sub-gift-leader" in badges.list)) {
				if("sub-gift-leader" in badges.list) {
					return true;
				} else if("sub-gifter" in badges.list) {
					let giftAmount = parseInt(badges.list['sub-gifter']);
					if(giftAmount >= parseInt(localStorage.getItem("setting_avatarAllowedGiftsMinimum"))) {
						return true;
					}
				}
			}
		}

		return false;
	}

	async getUserSettings() {
		if(parseInt(this.id) === -1) {
			return false;
		}

		const response = await fetch(`../chat-customizer/api/getSettings.php?id=${this.id}`);
		if(!response.ok) {
			return false;
		}

		var data = await response.json();
		if(!Object.keys(data).length) {
			return false;
		}

		data.flags = [];
		data.stops = [];

		for(let i = 1; i <= 9; i++) {
			if(data[`identityFlag${i}`] !== "" && data[`identityFlag${i}`] !== null && data[`identityFlag${i}`] !== undefined) {
				data.flags.push(data[`identityFlag${i}`]);
			}

			if(i > data.nameColorStops) {
				continue;
			}

			data.stops.push({
				color: `#${data[`nameColorStop${i}_color`].toString(16).padStart(6, "0")}`,
				percentage: data[`nameColorStop${i}_percentage`],
				hard: (data[`nameColorStop${i}_isHard`] === 1)
			});
		}

		data.nameGlowColor = `#${data.nameGlowColor.toString(16).padStart(8, "0")}`;

		this.entitlements.overlay.customSettings = data;

		this.setUserGradient();
		rootCSS().setProperty(`--nameFont${this.id}`, data.nameFont);
		rootCSS().setProperty(`--nameWeight${this.id}`, data.nameWeight);
		rootCSS().setProperty(`--nameScalar${this.id}`, "(var(--nameFontSizeNum) / 16)");
		rootCSS().setProperty(`--nameExtraWeight${this.id}`, `calc(${data.nameExtraWeight}px * var(--nameScalar${this.id}))`);
		rootCSS().setProperty(`--nameSize${this.id}`, `calc(${data.nameSize}pt * var(--nameScalar${this.id}))`);
		rootCSS().setProperty(`--nameStyle${this.id}`, (data.nameItalic ? "italic" : "normal"));
		rootCSS().setProperty(`--nameSpacing${this.id}`, `calc(${data.nameCharSpacing}px * var(--nameScalar${this.id}))`);
		rootCSS().setProperty(`--nameTransform${this.id}`, data.nameTransform);
		rootCSS().setProperty(`--nameVariant${this.id}`, data.nameVariant);
		if(data.nameGlowEnabled) {
			rootCSS().setProperty(`--nameGlow${this.id}`, `drop-shadow(0px 0px ${data.nameGlowAmount}px ${data.nameGlowColor})`);
		} else {
			rootCSS().setProperty(`--nameGlow${this.id}`, `opacity(1)`);
		}
		rootCSS().setProperty(`--namePerspectiveShift${this.id}`, `matrix3d(1, 0, 0, 0, 0, 1, 0, calc(${data.namePerspectiveShift} / 10000), 0, 0, 1, 0, 0, 0, 0, 1)`);
		rootCSS().setProperty(`--nameSkew${this.id}`, `skewX(${data.nameSkew}deg)`);
		let transforms = [];
		if(data.namePerspectiveShift) {
			transforms.push(`var(--namePerspectiveShift${this.id})`);
		}
		if(data.nameSkew) {
			transforms.push(`var(--nameSkew${this.id})`);
		}
		rootCSS().setProperty(`--nameTransforms${this.id}`, transforms.length ? transforms.join(" ") : "none");

		rootCSS().setProperty(`--msgFont${this.id}`, data.messageFont);
		rootCSS().setProperty(`--msgWeight${this.id}`, data.messageWeight);
		rootCSS().setProperty(`--msgScalar${this.id}`, "(var(--messageFontSizeNum) / 15)");
		rootCSS().setProperty(`--msgExtraWeight${this.id}`, `calc(${data.messageExtraWeight}px * var(--msgScalar${this.id}))`);
		rootCSS().setProperty(`--msgSize${this.id}`, `calc(${data.messageSize}pt * var(--msgScalar${this.id}))`);
		rootCSS().setProperty(`--msgSpacing${this.id}`, `calc(${data.messageCharSpacing}px * var(--msgScalar${this.id}))`);
		rootCSS().setProperty(`--msgLineHeight${this.id}`, `calc(${data.messageLineHeight}px * (var(--messageLineHeightNum) / 24))`);
		rootCSS().setProperty(`--msgVariant${this.id}`, data.messageVariant);
		rootCSS().setProperty(`--msgStyle${this.id}`, (data.messageItalic ? "italic" : "normal"));

		rootCSS().setProperty(`--pfpShape${this.id}`, `${data.avatarBorderRadius}%`);

		rootCSS().setProperty(`--nameSizeRaw${this.id}`, `${data.nameSize}`);
		if(data.useDefaultMessageSettings) {
			rootCSS().setProperty(`--nameMentionScalar${this.id}`, `calc(var(--messageFontSizeNum) / var(--nameSizeRaw${this.id}))`);
		} else {
			rootCSS().setProperty(`--nameMentionScalar${this.id}`, `calc(${data.messageSize} / var(--nameSizeRaw${this.id}))`);
		}
		rootCSS().setProperty(`--nameMentionSpacing${this.id}`, `calc(var(--nameSpacing${this.id}) * var(--nameMentionScalar${this.id}))`);
		rootCSS().setProperty(`--nameMentionExtraWeight${this.id}`, `calc(var(--nameExtraWeight${this.id}) * var(--nameMentionScalar${this.id}))`);

		this.userBlock.initUserBlockCustomizations();
		this.userBlock.updateFlagBlock();
		this.userBlock.updateNameBlock();

		return true;
	}

	setUserGradient() {
		const ensureBrightness = (localStorage.getItem("setting_ensureNameColorsAreBrightEnough") === "true");
		const settings = this.entitlements.overlay.customSettings;

		let amount = settings.nameColorStops;
		let type = settings.nameGradientType;
		let repeats = (settings.nameGradientRepeats === 1);
		let stops = settings.stops;
		let colors = stops.map(function(stop) {
			return (ensureBrightness ? ensureSafeColor(stop.color) : stop.color);
		});

		if(stops.length === 1) {
			rootCSS().setProperty(`--nameGradient${this.id}`, '');
			if(ensureBrightness) {
				rootCSS().setProperty(`--nameColor${this.id}`, ensureSafeColor(stops[0].color));
			} else {
				rootCSS().setProperty(`--nameColor${this.id}`, stops[0].color);
			}
			return;
		}

		let gradientOut = [];
		for(let i = 0; i < stops.length; i++) {
			let prevIdx = Math.max(0, i-1);

			let color = colors[i];
			let prevColor = colors[prevIdx];
			let percentage = `${stops[i].percentage}%`;
			let prevPercentage = `${stops[prevIdx].percentage}%`;

			if(stops[i].hard) {
				gradientOut.push(`${prevColor} ${percentage}`);
				gradientOut.push(`${color} ${percentage}`);
				if(i === stops.length - 1) {
					gradientOut.push(`${color} calc(${percentage} + (${percentage} - ${prevPercentage}))`);
				}
			} else {
				gradientOut.push(`${color} ${percentage}`);
			}
		}

		console.log(gradientOut);

		let initialPart = "";
		switch(type) {
			case "linear":
				initialPart = `${settings.nameGradientAngle}deg, `;
				break;

			case "radial":
				initialPart = `at ${settings.nameGradientXPos}% ${settings.nameGradientYPos}%, `;
				break;

			case "conic":
				initialPart = `from ${settings.nameGradientAngle}deg at ${settings.nameGradientXPos}% ${settings.nameGradientYPos}%, `;
				break;
		}
		rootCSS().setProperty(`--nameGradient${this.id}`, `${repeats ? "repeating-" : ""}${type}-gradient(${initialPart}${gradientOut.join(", ")})`);

		if(localStorage.getItem("setting_allowUserCustomizations") === "true" && !settings.useDefaultNameSettings) {
			$(`.name[data-userid="${this.id}"]`).children().css("background-image", `--nameGradient${this.id}`);
		}
	}

	createTwitchEntitlementsForRoom(roomID) {
		if(!(roomID in this.entitlements.twitch.badges)) {
			this.entitlements.twitch.badges[roomID] = {
				list: {},
				info: []
			}
		}
	}
}

class UserSet {
	constructor() {
		this.promises = {};
		this.usernames = {};
	}

	async getUser(id) {
		if(id in this) {
			return this[id];
		}
		if(id in this.promises) {
			await this.promises[id];
			return this[id];
		}

		this.promises[id] = new Promise(async (resolve) => {
			if(id in this) {
				return resolve(this[id]);
			} else {
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
					// profile_image_url: `twemoji/svg/${(0x1f300 + Math.ceil(Math.random() * 8)).toString(16)}.svg`,
					userDataRaw = {
						display_name: `Chat Overlay (r${overlayRevision})`,
						login: "<system>",
						profile_image_url: `icons/1f9e9.png`,
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

				this.usernames[userDataRaw.login] = this[id];
				if(userDataRaw.display_name) {
					this.usernames[userDataRaw.display_name] = this[id];
				}

				resolve(this[id]);
			}
		});

		await this.promises[id];
		return this[id];
	}

	refreshPronounStrings() {
		for(const idx in this) {
			const user = this[idx];

			if(!("entitlements" in user)) {
				continue;
			}
			if(user.entitlements === undefined) {
				continue;
			}

			user.updatePronounBlocks();
		}
	}

	refreshBotFlags() {
		for(const idx in this) {
			const user = this[idx];
			if(user.entitlements === undefined) {
				continue;
			}
			
			user.bot = isUserBot(user.username);

			if(user.bot) {
				let hasBadgeAlready = false;
				for(const badge of user.entitlements.overlay.badges) {
					if(badge.type === "bot") {
						hasBadgeAlready = true;
					}
				}

				if(!hasBadgeAlready) {
					user.entitlements.overlay.badges.push({
						urls: {
							high: "icons/gear.png",
							low: "icons/gear.png"
						},
						color: "var(--botBadgeColor)",
						type: "bot"
					});
				}
			} else {
				user.entitlements.overlay.badges = user.entitlements.overlay.badges.filter(function(badge) {
					return badge.type !== "bot";
				});
			}
		}
	}

	refreshUserInfoBlockDirections() {
		for(const idx in this) {
			const user = this[idx];
			if(user.userBlock) {
				user.userBlock.updateUserInfoBlockDirection();
			}
		}
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