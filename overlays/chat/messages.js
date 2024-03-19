// https://github.com/tmijs/docs/blob/gh-pages/_posts/v1.4.2/2019-03-03-Events.md
var md = window.markdownit({html: true})
	.disable(['link', 'image', 'linkify', 'table', 'fence', 'blockquote', 'hr',
			  'list', 'reference', 'heading', 'lheading', 'paragraph',
			  'newline', 'escape', 'autolink']);

async function prepareMessage(tags, message, self, forceHighlight) {
	if(self || message === null) {
		return;
	}

	if(!allowedToProceed) {
		console.log("No Client ID or Secret is set.");
		return;
	}

	console.log(tags);

	let userData = await twitchUsers.getUser(tags['user-id']);
	console.log(userData);
	if(userData === null) {
		console.log("we're going too fast wtf");
		await delay(500);
		return prepareMessage(tags, message, self, forceHighlight);
	}

	if(hideAccounts.indexOf(userData.username) !== -1) {
		return;
	}
	if(localStorage.getItem("setting_autoHideAllKnownBots") === "true" && userData.bot) {
		return;
	}

	if(localStorage.getItem("setting_hideCustomRewardMessages") === "true" && "custom-reward-id" in tags) {
		return;
	}

	if(userData.moderator === null) {
		userData.moderator = false;
		if('badges' in tags) {
			if(tags.badges) {
				let roles = Object.keys(tags.badges);
				if(roles.indexOf("broadcaster") !== -1 || roles.indexOf("moderator") !== -1) {
					userData.moderator = true;
				}
			}
		}
	}

	userData.entitlements.twitch.badges.list = tags['badges'];
	userData.entitlements.twitch.badges.info = tags['badge-info'];
	userData.entitlements.twitch.color = tags['color'];

	let isOverlayMessage = false;
	if('is-overlay-message' in tags) {
		isOverlayMessage = tags['is-overlay-message'];
	}

	let outObject = {
		message: message,
		isOverlayMessage: isOverlayMessage,
		type: tags['message-type'],
		highlighted: false,
		emotes: tags['emotes'],
		uuid: tags['id'],
		parseCheermotes: ('bits' in tags),
		user: userData
	};

	outObject.highlighted = (forceHighlight ? true : false);
	if('msg-id' in tags) {
		switch(tags['msg-id']) {
			case "highlighted-message":
				outObject.highlighted = true;
				break;

			case "viewermilestone":
				if(localStorage.getItem("setting_enableEventTagsWatchStreaks") === "true") {
					outObject.extraInfo = localStorage.getItem("setting_eventTagsWatchStreakFormat")
						.replaceAll("%amount", `<div class="watchStreakIcon"></div> ${parseInt(tags['msg-param-value']).toLocaleString()}`)
						.replaceAll("%reward", `<div class="pointRedeemIcon"></div> +${parseInt(tags['msg-param-copoReward']).toLocaleString()}`);
				}
				break;

			case "announcement":
				if(localStorage.getItem("setting_enableEventTagsAnnouncements") === "true") {
					outObject.extraInfo = localStorage.getItem("setting_eventTagsAnnouncementFormat");
				}
				break;
		}
	}

	if("custom-reward-id" in tags) {
		if(tags["custom-reward-id"] in channelPointRedeems && localStorage.getItem("setting_enableEventTagsChannelPoints") === "true") {
			outObject.redeem = tags["custom-reward-id"];
			const redeemData = channelPointRedeems[tags["custom-reward-id"]];

			outObject.extraInfo = localStorage.getItem("setting_eventTagsChannelPointFormat")
				.replaceAll("%amount", `<div class="pointRedeemIcon"></div> ${redeemData.cost.toLocaleString()}`)
				.replaceAll("%name", redeemData.name);
		}
	}

	switch(outObject.type) {
		case "resub":
			if(localStorage.getItem("setting_enableEventTagsSubs") === "true") {
				outObject.extraInfo = localStorage.getItem("setting_eventTagsResubFormat")
					.replaceAll("%amount", tags['msg-param-cumulative-months'])
					.replaceAll("%tier", subTiers[tags['msg-param-sub-plan']]);
			}
			break;

		case "subscription":
			if(localStorage.getItem("setting_enableEventTagsSubs") === "true") {
				outObject.extraInfo = localStorage.getItem("setting_eventTagsNewSubFormat").replaceAll("%tier", subTiers[tags['msg-param-sub-plan']]);
			}
			break;

		case "cheer":
		case "chat":
			if("bits" in tags && localStorage.getItem("setting_enableEventTagsBits") === "true") {
				outObject.extraInfo = localStorage.getItem("setting_eventTagsCheerFormat").replaceAll("%amount", parseInt(tags['bits']).toLocaleString());
			}
			break;
	}

	if(userData.avatarImage === null && userData.id !== -1) {
		await userData.cacheAvatar();
	}

	let parseDelay = 0;
	if(!isOverlayMessage) {
		parseDelay = (parseFloat(localStorage.getItem("setting_delayChat")) * 1000) || 0;
	}

	setTimeout(async function() { await parseMessage(outObject); }, parseDelay);
}

const chatFuncs = {
	namecolor: function(data, args) {
		let color = args[0].replace("#", "");
		if(!(/^([0-9a-f]{3}){1,2}$/i).test(color)) {
			return;
		}

		if(localStorage.getItem("setting_ensureNameColorsAreBrightEnough") === "true") {
			color = ensureSafeColor(`#${color}`).replace("#", "");
		}

		console.log(`set color for ${data.user.username} to #${color}`)
		localStorage.setItem(`color_${data.user.id}`, `#${color}`);
		rootCSS().setProperty(`--nameColor${data.user.id}`, `#${color}`);
	},

	namesecondarycolor: function(data, args) {
		let color = args[0].replace("#", "");
		if(!(/^([0-9a-f]{3}){1,2}$/i).test(color)) {
			return;
		}

		if(localStorage.getItem("setting_ensureNameColorsAreBrightEnough") === "true") {
			color = ensureSafeColor(`#${color}`).replace("#", "");
		}

		console.log(`set 2nd color for ${data.user.username} to #${color}`)
		localStorage.setItem(`color2_${data.user.id}`, `#${color}`);
		rootCSS().setProperty(`--nameColorSecondary${data.user.id}`, `#${color}`);

		if(localStorage.getItem("setting_chatDefaultNameColorForced") !== "true") {
			if(localStorage.getItem("setting_allowUserCustomizations") === "true") {
				$(`.name[data-userid="${data.user.id}"]`).children().css("background-image", `linear-gradient(var(--nameAngle${data.user.id}), var(--nameColorSecondary${data.user.id}) 0%, transparent 75%)`);
			}
		}
	},

	namefont: function(data, args) {
		let fontName = args.join(" ");
		if(Object.keys(fonts).indexOf(fontName) === -1) { return; }
		if(!fonts[fontName].allowed.names) { return; }

		console.log(`set name font for ${data.user.username} to ${fontName}`)
		localStorage.setItem(`namefont_${data.user.id}`, fontName);
		rootCSS().setProperty(`--nameFont${data.user.id}`, fontName);
	},

	nameweight: function(data, args) {
		let weight = args.join("").toLowerCase();
		if(weight in enums.weight) {
			weight = enums.weight[weight];
		} else {
			weight = parseInt(weight);
			if(isNaN(weight)) { weight = 700; }

			weight = Math.max(Math.min(weight - weight % 100, 900), 100);
		}

		console.log(`set name weight for ${data.user.username} to ${weight}`)
		localStorage.setItem(`nameweight_${data.user.id}`, weight);
		rootCSS().setProperty(`--nameWeight${data.user.id}`, weight);
	},

	namesize: function(data, args) {
		let hardcodedDefaults = {
			min: 14,
			max: 18
		};
		let size = 16;

		if(!isNaN(parseFloat(args[0]))) {
			size = Math.max(Math.min(parseFloat(args[0]), hardcodedDefaults.max), hardcodedDefaults.min);
		}

		console.log(`set name size for ${data.user.username} to ${size}pt`)
		localStorage.setItem(`namesize_${data.user.id}`, `${size}pt`);
		rootCSS().setProperty(`--nameSize${data.user.id}`, `${size}pt`);
	},

	nameitalic: function(data, args) {
		let which = (args[0].toLowerCase() === "yes" ? "italic" : "normal");

		console.log(`set name italics for ${data.user.username} to ${which}`);
		localStorage.setItem(`namestyle_${data.user.id}`, which);
		rootCSS().setProperty(`--nameStyle${data.user.id}`, which);
	},

	namespacing: function(data, args) {
		let hardcodedDefaults = {
			min: -4,
			max: 5
		};
		let val = 1;

		if(!isNaN(parseFloat(args[0]))) {
			val = Math.max(Math.min(parseFloat(args[0]), hardcodedDefaults.max), hardcodedDefaults.min);
		}

		console.log(`set name character spacing for ${data.user.username} to ${val}px`)
		localStorage.setItem(`namespacing_${data.user.id}`, `${val}px`);
		rootCSS().setProperty(`--nameSpacing${data.user.id}`, `${val}px`);
	},

	msgfont: function(data, args) {
		let fontName = args.join(" ");

		if(Object.keys(fonts).indexOf(fontName) === -1) { return; }
		if(!fonts[fontName].allowed.messages) { return; }

		console.log(`set message font for ${data.user.username} to ${fontName}`)
		localStorage.setItem(`msgfont_${data.user.id}`, fontName);
		rootCSS().setProperty(`--msgFont${data.user.id}`, fontName);
	},

	msgsize: function(data, args) {
		let hardcodedDefaults = {
			min: 14,
			max: 18
		};
		let size = 16;

		if(!isNaN(parseFloat(args[0]))) {
			size = Math.max(Math.min(parseFloat(args[0]), hardcodedDefaults.max), hardcodedDefaults.min);
		}

		console.log(`set message size for ${data.user.username} to ${size}pt`)
		localStorage.setItem(`msgsize_${data.user.id}`, `${size}pt`);
		rootCSS().setProperty(`--msgSize${data.user.id}`, `${size}pt`);
	},

	msgspacing: function(data, args) {
		let hardcodedDefaults = {
			min: -2,
			max: 2
		};
		let val = 0;

		if(!isNaN(parseFloat(args[0]))) {
			val = Math.max(Math.min(parseFloat(args[0]), hardcodedDefaults.max), hardcodedDefaults.min);
		}

		console.log(`set message character spacing for ${data.user.username} to ${val}px`)
		localStorage.setItem(`msgspacing_${data.user.id}`, `${val}px`);
		rootCSS().setProperty(`--msgSpacing${data.user.id}`, `${val}px`);
	},

	msgweight: function(data, args) {
		let weight = args.join("").toLowerCase();
		if(weight in enums.weight) {
			weight = enums.weight[weight];
		} else {
			weight = parseInt(weight);
			if(isNaN(weight)) { weight = 700; }
		}

		weight = Math.max(Math.min(weight - weight % 100, 900), 400);

		console.log(`set message weight for ${data.user.username} to ${weight}`)
		localStorage.setItem(`msgweight_${data.user.id}`, weight);
		rootCSS().setProperty(`--msgWeight${data.user.id}`, weight);
	},

	nametransform: function(data, args) {
		let valid = ["none", "lowercase", "uppercase"];
		let chosen = valid[0];

		if(!(isNaN(parseInt(args[0])))) {
			let c = Math.max(Math.min(parseInt(args[0]), 2), 0);
			chosen = valid[c];
		} else {
			if(valid.indexOf(args[0]) !== -1) {
				chosen = args[0];
			}
		}

		console.log(`set name transform for ${data.user.username} to ${chosen}`)
		localStorage.setItem(`nametransform_${data.user.id}`, chosen);
		rootCSS().setProperty(`--nameTransform${data.user.id}`, chosen);
	},

	namevariant: function(data, args) {
		let valid = ["normal", "small-caps", "unicase"];
		let chosen = valid[0];

		if(!(isNaN(parseInt(args[0])))) {
			let c = Math.max(Math.min(parseInt(args[0]), 2), 0);
			chosen = valid[c];
		} else {
			if(valid.indexOf(args[0]) !== -1) {
				chosen = args[0];
			}
		}

		console.log(`set name variant for ${data.user.username} to ${chosen}`)
		localStorage.setItem(`namevariant_${data.user.id}`, chosen);
		rootCSS().setProperty(`--nameVariant${data.user.id}`, chosen);
	},

	nameangle: function(data, args) {
		let angle = 170;
		if(!isNaN(parseFloat(args[0]))) {
			angle = Math.max(Math.min(parseFloat(args[0]), 360), 0);
		}

		console.log(`set name angle for ${data.user.username} to ${angle}deg`)
		localStorage.setItem(`nameangle_${data.user.id}`, `${angle}deg`);
		rootCSS().setProperty(`--nameAngle${data.user.id}`, `${angle}deg`);
	},

	chatsettings: function(data, args) {
		if(args.length !== 19) {
			console.log("args not correct length");
			return;
		}

		chatFuncs["namecolor"](data, [args[0]]);
		chatFuncs["namefont"](data, args[1].split("_"));
		chatFuncs["namesize"](data, [args[2]]);
		chatFuncs["nameitalic"](data, [args[3]]);
		chatFuncs["nameweight"](data, [args[4]]);
		chatFuncs["nametransform"](data, [args[5]]);
		chatFuncs["namevariant"](data, [args[6]]);
		chatFuncs["namespacing"](data, [args[7]]);
		chatFuncs["msgfont"](data, args[8].split("_"));
		chatFuncs["msgsize"](data, [args[9]]);
		chatFuncs["msgweight"](data, [args[10]]);
		chatFuncs["msgspacing"](data, [args[11]]);
		chatFuncs["namesecondarycolor"](data, [args[12]]);
		chatFuncs["nameangle"](data, [args[13]]);
		chatFuncs["showpfp"](data, [args[14]]);
		chatFuncs["useusername"](data, [args[15]]);
		chatFuncs["pfpshape"](data, [args[16]]);
		chatFuncs["use7tvpaint"](data, [args[17]]);
		chatFuncs["nameshadow"](data, [args[18]]);

		data.message = "New chat settings have applied!"
	},

	flags: function(data, args) {
		let flags = [];
		for(let idx = 0; idx < args.length; idx++) {
			if(flags.length >= parseInt(localStorage.getItem("setting_maxFlagCount"))) {
				break;
			}

			let flag = args[idx];
			if(!(flag in settings.flags)) {
				continue;
			}

			flags.push(flag);
		}

		flags = flags.join(",");

		console.log(`set flag badges for ${data.user.username} to ${flags}`)
		localStorage.setItem(`flags_${data.user.id}`, flags);
	},
	flag: function(data, args) { chatFuncs["flags"](data, args); },

	bsr: async function(data, args, msgElement) {
		if(localStorage.getItem("setting_cmdEnableBSR") !== "true") {
			return;
		}
		
		if(channelData.game_id !== "503116") {
			return;
		}

		if(!args.length) {
			return;
		}

		if(args[0].length > 5) {
			return;
		}

		args[0] = args[0].toLowerCase();
		if(!(/^[0-9a-f]+$/i).test(args[0])) {
			return;
		}

		if(!msgElement) {
			// god i need to refactor this system
			return true;
		}

		msgElement.children(".message").remove();

		let infoElement = $(`<div class="bsrInfo loading"></div>`);
		infoElement.html(`<i class="fas fa-spinner fa-pulse"></i> <span style="opacity: 0.67; margin-left: 6px;" class="loadingMsg">getting information for <strong>${args[0]}</strong>...</span>`);

		msgElement.append(infoElement);

		const mapResponse = await fetch(`https://api.beatsaver.com/maps/id/${args[0]}`);

		if(!mapResponse.ok) {
			return;
		}

		const mapData = await mapResponse.json();
		console.log(mapData);

		if(funnyBeatSaberMapsToRequestToEverySingleStreamerOnTwitchEverIBetEverySingleOneOfThemWillEnjoyThem.indexOf(mapData.id) !== -1) {
			infoElement.addClass("STREAMER_CAN_YOU_PLAY_REALITY_CHECK_ITS_MY_FAVORITE_MAP");
		}

		const uploaderResponse = await fetch(`https://api.beatsaver.com/users/id/${mapData.uploader.id}`);

		if(!uploaderResponse.ok) {
			return;
		}

		const uploaderData = await uploaderResponse.json();
		console.log(uploaderData);

		let canShowArt = (mapData.ranked || mapData.qualified || mapData.uploader.verifiedMapper || "curatedAt" in mapData);

		let canShowInfo = canShowArt;
		if(!canShowInfo) {
			if("firstUpload" in uploaderData.stats) {
				let firstUploadTimestamp = new Date(uploaderData.stats.firstUpload).getTime();
				if(Date.now() - firstUploadTimestamp > (10518984*1000)) {
					canShowInfo = true;
				}
			}
		}

		if(!canShowInfo) {
			infoElement.html(`<i class="fas fa-times"></i> <span class="loadingMsg">could not show information for ${mapData.id}, BeatSaver account is too new</span>`);
			return;
		}

		infoElement.removeClass("loading");

		for(const toCheck of ["songName", "songAuthorName", "songSubName", "levelAuthorName"]) {
			if(!isStringSafe(mapData.metadata[toCheck])) {
				mapData.metadata[toCheck] = "[REDACTED]";
			}
		}

		let artElement = $(`<div class="bsrArt"></div>`);
		if(canShowArt) {
			let e = $(`<img src="${mapData.versions[0].coverURL}"/>`);
			artElement.append(e);
		}

		let metadataElement = $(`<div class="bsrMapInfo"></div>`);
		let titleElement = $(`<div class="songTitle">${mapData.metadata.songName}${mapData.metadata.songSubName === "" ? "" : ` - ${mapData.metadata.songSubName}`}</div>`);
		let artistElement = $(`<div class="songArtist">${mapData.metadata.songAuthorName}</div>`);
		let mapperElement = $(`<div class="mapper">${mapData.metadata.levelAuthorName}</div>`);
		metadataElement.append(titleElement).append(artistElement).append(mapperElement);

		let extraDataElement = $(`<div class="bsrExtraInfo"></div>`);
		let idElement = $(`<div class="bsrCode">${mapData.id}</div>`);
		let statsElement = $(`<div class="bsrStats"></div>`);
		statsElement.append($(`<span class="songTime"><i class="fas fa-clock"></i> ${formatTime(mapData.metadata.duration)}</span>`));
		statsElement.append($(`<span class="songRating"><i class="fas fa-thumbs-up"></i> ${mapData.stats.upvotes.toLocaleString()} <i class="fas fa-thumbs-down"></i> ${mapData.stats.downvotes.toLocaleString()}</span>`));
		extraDataElement.append(idElement).append(statsElement);

		infoElement.empty();
		if(canShowArt) {
			infoElement.append(artElement);
		}
		infoElement.append(metadataElement).append(extraDataElement);
	},

	refreshpronouns: async function(data, callback) {
		await data.user.setPronouns();
	},

	showpfp: function(data, args) {
		if(!args.length) { return; }
		let show = (args[0] === "yes" ? "yes" : "no");

		console.log(`show pfp for ${data.user.username} is now ${show}`);
		localStorage.setItem(`showpfp_${data.user.id}`, show);
	},

	useusername: function(data, args) {
		if(!args.length) { return; }
		let which = (args[0] === "yes" ? "username" : "name");

		console.log(`name for ${data.user.username} is now ${which}`);
		localStorage.setItem(`usename_${data.user.id}`, which);
	},

	pfpshape: function(data, args) {
		if(!args.length) { return; }

		let val = "10px";
		switch(args[0]) {
			case "square": val = "0px"; break;
			case "squircle": val = "10px"; break;
			case "circle": val = "100%"; break;
		}

		console.log(`pfp shape for ${data.user.username} is now ${val}`);
		localStorage.setItem(`pfpShape_${data.user.id}`, val);
		rootCSS().setProperty(`--pfpShape${data.user.id}`, val);
	},

	refreshpfp: async function(data, args) {
		await data.user.refreshCachedAvatar();
	},

	refreshemotes: function(data, args) {
		if(!data.user.moderator) {
			return;
		}

		console.log("refreshing external emotes...");

		chatEmotes = new GlobalEmoteSet();
		getGlobalChannelEmotes(broadcasterData);
	},

	use7tvpaint: function(data, args) {
		if(!args.length) { return; }
		let which = (args[0] === "yes" ? "yes" : "no");

		console.log(`7tv paint for ${data.user.username} is now ${which} (only if available)`);
		localStorage.setItem(`use7tvpaint_${data.user.id}`, which);
	},

	nameshadow: function(data, args) {
		if(!args.length) { return; }
		let show = (args[0] === "yes" ? "yes" : "no");

		console.log(`name shadow for ${data.user.username} is now ${show}`);
		localStorage.setItem(`nameshadow_${data.user.id}`, show);
		rootCSS().setProperty(`--nameShadow${data.user.id}`, (show === "yes" ? "var(--shadowStuff)" : ""));
	},

	nameoutline: function(data, args) {
		if(!args.length) { return; }
		let show = (args[0] === "yes" ? "yes" : "no");

		console.log(`name outline for ${data.user.username} is now ${show}`);
		localStorage.setItem(`nameoutline_${data.user.id}`, show);
		rootCSS().setProperty(`--nameOutline${data.user.id}`, (show === "yes" ? "var(--outlineStuff)" : ""));		
	},

	resetchat: function(data, args) {
		localStorage.removeItem(`namesize_${data.user.id}`);
		localStorage.removeItem(`nametransform_${data.user.id}`);
		localStorage.removeItem(`namestyle_${data.user.id}`);
		localStorage.removeItem(`namespacing_${data.user.id}`);
		localStorage.removeItem(`namevariant_${data.user.id}`);
		localStorage.removeItem(`nameangle_${data.user.id}`);
		localStorage.removeItem(`nameweight_${data.user.id}`);
		localStorage.removeItem(`namefont_${data.user.id}`);
		localStorage.removeItem(`nameshadow_${data.user.id}`);
		localStorage.removeItem(`nameoutline_${data.user.id}`);

		localStorage.removeItem(`msgsize_${data.user.id}`);
		localStorage.removeItem(`msgweight_${data.user.id}`);
		localStorage.removeItem(`msgspacing_${data.user.id}`);
		localStorage.removeItem(`msgfont_${data.user.id}`);

		localStorage.removeItem(`color_${data.user.id}`);
		localStorage.removeItem(`color2_${data.user.id}`);

		localStorage.removeItem(`pfpShape_${data.user.id}`);
		localStorage.setItem(`pfp_${data.user.id}_expiry`, "0");
		localStorage.removeItem(`showpfp_${data.user.id}`);

		localStorage.removeItem(`flags_${data.user.id}`);

		localStorage.setItem(`pn_${data.user.id}_expiry`, "0");
		localStorage.removeItem(`usename_${data.user.id}`);
		localStorage.removeItem(`use7tvpaint_${data.user.id}`);

		rootCSS().removeProperty(`--pfpShape${data.user.id}`);
		rootCSS().removeProperty(`--nameColor${data.user.id}`);
		rootCSS().removeProperty(`--nameColorSecondary${data.user.id}`);
		rootCSS().removeProperty(`--nameAngle${data.user.id}`);
		rootCSS().removeProperty(`--nameSize${data.user.id}`);
		rootCSS().removeProperty(`--nameSpacing${data.user.id}`);
		rootCSS().removeProperty(`--nameWeight${data.user.id}`);
		rootCSS().removeProperty(`--nameStyle${data.user.id}`);
		rootCSS().removeProperty(`--nameTransform${data.user.id}`);
		rootCSS().removeProperty(`--nameVariant${data.user.id}`);
		rootCSS().removeProperty(`--nameShadow${data.user.id}`);
		rootCSS().removeProperty(`--nameOutline${data.user.id}`);
		rootCSS().removeProperty(`--nameEffects${data.user.id}`);
		rootCSS().removeProperty(`--chatMessageColor${data.user.id}`);
		rootCSS().removeProperty(`--msgSize${data.user.id}`);
		rootCSS().removeProperty(`--nameFont${data.user.id}`);
		rootCSS().removeProperty(`--msgFont${data.user.id}`);
		rootCSS().removeProperty(`--msgWeight${data.user.id}`);
		rootCSS().removeProperty(`--msgSpacing${data.user.id}`);

		initUserSettingValues(data);

		data.message = "Chat settings have been reset!"

		$(`.name[data-userid="${data.user.id}"]`).children().css("background-image", "var(--nameBackground)");
		$(`.chatBlock[data-userid="${data.user.id}"] .message`).attr("style", "");
		$(`.chatBlock[data-userid="${data.user.id}"] .pfp`).attr("style", "");
	},

	overlayversion: function(data, args) {
		if(!data.user.moderator) {
			if(parseInt(data.user.id) !== 43464015) {
				return;
			}
		}

		systemMessage(`Streamer is using overlay r${overlayRevision}`);
		checkForUpdate();
	}
}

function widthTest(rootElement, userBlock) {
	$("#testWrapper").append(rootElement);

	let elementWidth = userBlock.width();
	let parentWidth = $("#wrapper").innerWidth();
	
	if(elementWidth > parentWidth) {
		return true;
	} else {
		return false;
	}
}

function renderAvatarBGBlock(data, rootElement) {
	let avatarBGWrapperElement = $('<div class="avatarBGWrapper"></div>');
	let avatarBGElement = $(`<div class="avatarBG" style="background-image: url('${data.user.avatarImage}');"/>`);
	avatarBGWrapperElement.append(avatarBGElement)

	if(data.user.avatarEnabled && localStorage.getItem("setting_enableAvatarsAsBackground") === "true") {
		avatarBGWrapperElement.css("display", "block");

		if(localStorage.getItem("setting_avatarsBGAnimateAppearance") === "true") {
			avatarBGElement.addClass("zoomAvatarBGOut");
		}
	}

	return avatarBGWrapperElement;
}

var lastUser;
var lastRootElement;
var lastMessageIdx;
var messageCount = 0;
var combinedCount = 0;
var testNameBlock;
function getRootElement(data) {
	if($(`.chatBlock[data-rootIdx="${combinedCount}"]`).length) {
		if(lastUser === data.user.id) {
			return lastRootElement;
		}
	}

	combinedCount++;
	lastUser = data.user.id;

	const cornerAlignment = localStorage.getItem("setting_chatCornerAlignment").split(",");
	let rootElement = $(`<div class="chatBlock slideIn" data-rootIdx="${combinedCount}" data-userID="${data.user.id}"></div>`);
	if(localStorage.getItem("setting_alternateCornerAlignment") === "true") {
		const order = [cornerAlignment[1], (cornerAlignment[1] === "left" ? "right" : "left")];
		rootElement.addClass(order[combinedCount % 2]);
	} else {
		rootElement.addClass(cornerAlignment[1]);
	}

	let overallWrapper = $(`<div class="overallWrapper"></div>`);
	rootElement.append(overallWrapper);

	rootElement.one("animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd", function() {
		setTimeout(function() {
			rootElement.removeClass("slideIn");
		}, 250); // what the absolute shit
	});

	let messageWrapper = $('<div class="messageWrapper"></div>');
	let userBlockElements = renderUserBlock(data, rootElement, overallWrapper, messageWrapper);
	let userBlock = userBlockElements[0];
	let avatarBGBlock = renderAvatarBGBlock(data, rootElement);

	overallWrapper.append(userBlock);
	overallWrapper.append(avatarBGBlock);
	overallWrapper.append(messageWrapper);

	lastRootElement = [rootElement, overallWrapper, messageWrapper];

	userBlock.waitForImages(function() {
		// [userBlock, badgeBlock, flagBlock, pronounsBlock, pfpBlock, nameBlock];
		let elementChecks = [userBlockElements[2], userBlockElements[1], userBlockElements[4], userBlockElements[3]];
		//                   flags,                badges,               pfp,                  pronouns
		for(let testAgainst of elementChecks) {
			if(widthTest(rootElement, userBlock)) {
				testAgainst.hide();
			}
		}
		if(widthTest(rootElement, userBlock)) { userBlockElements[5].children().addClass("clip"); }
		$("#wrapper").append(rootElement);
	});

	$("#wrapper").append(rootElement);
	return [rootElement, overallWrapper, messageWrapper];
}

function renderBadgeBlock(data, rootElement, userBlock) {
	let badgeBlock = $('<div class="badges" style="display: none;"></div>');
	let badges = data.user.entitlements.twitch.badges;

	if(localStorage.getItem("setting_enableTwitchBadges") === "true" && !data.isOverlayMessage) {
		if(localStorage.getItem("setting_enableTwitchSubscriberBadges") === "true" && localStorage.getItem(`setting_enableTwitchFounderBadges`) === "false" && badges.list) {
			if("founder" in badges.list) {
				let monthPoss = [1, 1, 2, 3, 3, 3, 6, 6, 6, 9, 9, 9];
				let founderInt = parseInt(badges.info.founder);
				if(founderInt > monthPoss.length) {
					founderInt -= founderInt % 6;
				}

				badges.list["subscriber"] = founderInt.toString();			
			}
		}

		let useLQImages = (localStorage.getItem("setting_useLowQualityImages") === "true");
		for(let badgeType in badges.list) {
			let showBadge = true;
			let foundBadge = false;
			let addGradient = false;

			for(let checkAgainst in twitchBadgeTypes) {
				let badgeTypeData = twitchBadgeTypes[checkAgainst];
				if(badgeTypeData.badges.indexOf(badgeType) !== -1) {
					foundBadge = true;
					if(localStorage.getItem(`setting_${badgeTypeData.setting}`) === "false") {
						showBadge = false;
						break;
					}

					if(badgeTypeData.is_solid) {
						addGradient = true;
					}
				}
			}

			if(!foundBadge) {
				// assume it's a game-related badge
				if(localStorage.getItem("setting_enableTwitchGameBadges") === "false") {
					showBadge = false;
				}
			}

			if(!showBadge) {
				continue;
			}

			let badgeData = getBadgeData(badgeType, badges.list[badgeType]);
			let url;

			if(!badgeData) {
				// uh, wtf
				continue;
			}
			
			if(typeof badgeData === "undefined" && badges.info) {
				// this should only trigger on channels that have founders badges off, and do not have custom sub badges set
				// twitch ID's these differently compared to custom sub badges
				const monthInt = parseInt(badges.info.subscriber);
				var chosenDefaultLength = 0;
				for(const lengthIdx in defaultSubBadgeLengths) {
					if(monthInt >= defaultSubBadgeLengths[lengthIdx]) {
						chosenDefaultLength = lengthIdx;
					} else {
						break;
					}
				}

				if(useLQImages) {
					url = twitchBadges["subscriber"].versions[chosenDefaultLength].image_url_1x;
				} else {
					url = twitchBadges["subscriber"].versions[chosenDefaultLength].image_url_4x;
					if(typeof url === "undefined") {
						url = twitchBadges["subscriber"].versions[chosenDefaultLength].image_url_1x;
					}
				}
			} else {
				if(useLQImages) {
					url = badgeData.image_url_1x;
				} else {
					url = badgeData.image_url_4x;
					if(typeof url === "undefined") {
						url = badgeData.image_url_1x;
					}
				}
			}

			let badgeElem = $(`<span class="badgeWrap"></span>`);
			badgeElem.css("background-image", `url('${url}')`);
			if(badgeType === "subscriber") {
				badgeElem.addClass("sub_badge");
			} else {
				badgeElem.addClass("normal_badge");
				if(addGradient) {
					badgeElem.addClass("badgeGradient");
				}
			}

			badgeBlock.append(badgeElem);
			badgeBlock.show();
		}
	}

	const entitlements = data.user.entitlements;

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

			badgeBlock.prepend(badgeElem);
			if(badgeElem.is(":visible")) {
				badgeBlock.show();
			}
		}	
	}

	renderExternalBadges(data.user, badgeBlock);

	return badgeBlock;
}

function renderFlagBlock(data) {
	let flagBlock = $('<div class="flags" style="display: none;"></div>');

	if(!localStorage.getItem(`flags_${data.user.id}`)) { localStorage.setItem(`flags_${data.user.id}`, ""); }
	if(localStorage.getItem("setting_enableFlags") === "true" && !data.isOverlayMessage) {
		let flags = localStorage.getItem(`flags_${data.user.id}`).split(",");

		if(flags.length) {
			for(let flag of flags) {
				if(!flag) {
					continue;
				}

				let filename = settings.flags[flag];

				flagBlock.append($(`<span class="flag${flag} flag" style="background-image: url('flags/${filename}'); display: inline-block;"></div>`));
				flagBlock.show();
			}
		}
	}

	return flagBlock;
}

function renderPronounsBlock(data) {
	let pronounsBlock = $('<div class="pronouns" style="display: none;"></div>');

	if(localStorage.getItem("setting_enablePronouns") === "true" && !data.isOverlayMessage) {
		if(data.user.entitlements.pronouns.string !== null) {
			pronounsBlock.text(data.user.entitlements.pronouns.string).show();
		}
	}

	return pronounsBlock;
}

function renderAvatarBlock(data) {
	let pfpBlock = $('<img class="pfp" src="" style="display: none;"/>');

	if(localStorage.getItem("setting_enableAvatars") === "false" || data.isOverlayMessage) {
		return pfpBlock;
	}

	if(!data.user.avatar) {
		return pfpBlock;
	}

	pfpBlock.attr("src", data.user.avatarImage);

	if(!localStorage.getItem(`pfpShape_${data.user.id}`)) { localStorage.setItem(`pfpShape_${data.user.id}`, "var(--avatarBorderRadius)"); }
	rootCSS().setProperty(`--pfpShape${data.user.id}`, localStorage.getItem(`pfpShape_${data.user.id}`));
	pfpBlock.css("border-radius", `var(--pfpShape${data.user.id})`);

	if(data.user.avatarEnabled) {
		pfpBlock.show();
	} else {
		pfpBlock.hide();
	}

	return pfpBlock;
}

function initUserSettingValues(data) {
	let customizationOK = (localStorage.getItem("setting_allowUserCustomizations") === "true");

	if(!localStorage.getItem(`color_${data.user.id}`)) {
		let col = data.user.entitlements.twitch.color;
		if(!col) {
			if(localStorage.getItem("setting_chatNameUsesProminentColorAsFallback") === "true") {
				col = data.user.entitlements.overlay.prominentColor;
			} else {
				col = "var(--defaultNameColor)";
			}
		}

		if(localStorage.getItem("setting_chatNameUsesProminentColor") === "true") {
			col = data.user.entitlements.overlay.prominentColor;
		}

		localStorage.setItem(`color_${data.user.id}`, col);
	}
	if(!localStorage.getItem(`color2_${data.user.id}`)) { localStorage.setItem(`color2_${data.user.id}`, "var(--defaultNameColorSecondary)"); }
	if(!localStorage.getItem(`nameangle_${data.user.id}`)) { localStorage.setItem(`nameangle_${data.user.id}`, "var(--nameGradientAngle)"); }
	if(customizationOK) {
		if(!localStorage.getItem(`namefont_${data.user.id}`)) { localStorage.setItem(`namefont_${data.user.id}`, "var(--nameFont)"); }
		if(!localStorage.getItem(`nameweight_${data.user.id}`)) { localStorage.setItem(`nameweight_${data.user.id}`, "var(--nameFontWeight)"); }
		if(!localStorage.getItem(`namesize_${data.user.id}`)) { localStorage.setItem(`namesize_${data.user.id}`, "var(--nameFontSize)"); }
		if(!localStorage.getItem(`namestyle_${data.user.id}`)) { localStorage.setItem(`namestyle_${data.user.id}`, "var(--nameFontStyle)"); }
		if(!localStorage.getItem(`namespacing_${data.user.id}`)) { localStorage.setItem(`namespacing_${data.user.id}`, "var(--nameLetterSpacing)"); }
		if(!localStorage.getItem(`nametransform_${data.user.id}`)) { localStorage.setItem(`nametransform_${data.user.id}`, "var(--nameTransform)"); }
		if(!localStorage.getItem(`namevariant_${data.user.id}`)) { localStorage.setItem(`namevariant_${data.user.id}`, "var(--nameVariant)"); }
		if(!localStorage.getItem(`use7tvpaint_${data.user.id}`)) { localStorage.setItem(`use7tvpaint_${data.user.id}`, "yes"); }
		if(!localStorage.getItem(`nameshadow_${data.user.id}`)) { localStorage.setItem(`nameshadow_${data.user.id}`, "yes"); }
		if(!localStorage.getItem(`nameoutline_${data.user.id}`)) { localStorage.setItem(`nameoutline_${data.user.id}`, "yes"); }

		if(!localStorage.getItem(`msgfont_${data.user.id}`)) { localStorage.setItem(`msgfont_${data.user.id}`, "var(--messageFont)"); }
		if(!localStorage.getItem(`msgsize_${data.user.id}`)) { localStorage.setItem(`msgsize_${data.user.id}`, "var(--messageFontSize)"); }
		if(!localStorage.getItem(`msgspacing_${data.user.id}`)) { localStorage.setItem(`msgspacing_${data.user.id}`, "var(--messageLetterSpacing)"); }
		if(!localStorage.getItem(`msgweight_${data.user.id}`)) { localStorage.setItem(`msgweight_${data.user.id}`, "var(--messageFontWeight)"); }

		if(!data.isOverlayMessage) {
			rootCSS().setProperty(`--nameSize${data.user.id}`, localStorage.getItem(`namesize_${data.user.id}`));
			if(localStorage.getItem("setting_chatNameFontSize") !== "16") {
				let scale = parseFloat(localStorage.getItem("setting_chatNameFontSize")) / 16;
				if(localStorage.getItem(`namesize_${data.user.id}`) !== "var(--nameFontSize)") {
					rootCSS().setProperty(`--nameSize${data.user.id}`, `calc(${localStorage.getItem(`namesize_${data.user.id}`)} * ${scale})`);
				}
			}

			rootCSS().setProperty(`--nameSpacing${data.user.id}`, localStorage.getItem(`namespacing_${data.user.id}`));
			if(localStorage.getItem("setting_chatNameLetterSpacing") !== "1") {
				let scale = parseFloat(localStorage.getItem("setting_chatNameLetterSpacing"));
				if(localStorage.getItem(`namespacing_${data.user.id}`) !== "var(--nameLetterSpacing)") {
					rootCSS().setProperty(`--nameSpacing${data.user.id}`, `calc(${localStorage.getItem(`namespacing_${data.user.id}`)} * ${scale})`);
				}
			}

			rootCSS().setProperty(`--nameFont${data.user.id}`, localStorage.getItem(`namefont_${data.user.id}`));
			rootCSS().setProperty(`--nameWeight${data.user.id}`, localStorage.getItem(`nameweight_${data.user.id}`));
			rootCSS().setProperty(`--nameStyle${data.user.id}`, localStorage.getItem(`namestyle_${data.user.id}`));
			rootCSS().setProperty(`--nameTransform${data.user.id}`, localStorage.getItem(`nametransform_${data.user.id}`));
			rootCSS().setProperty(`--nameVariant${data.user.id}`, localStorage.getItem(`namevariant_${data.user.id}`));
			rootCSS().setProperty(`--nameShadow${data.user.id}`, localStorage.getItem(`nameshadow_${data.user.id}`) === "yes" ? `var(--shadowStuff)` : "");
			rootCSS().setProperty(`--nameOutline${data.user.id}`, localStorage.getItem(`nameoutline_${data.user.id}`) === "yes" ? `var(--outlineStuff)` : "");
			rootCSS().setProperty(`--nameEffects${data.user.id}`, `var(--nameOutline${data.user.id})var(--nameShadow${data.user.id})`);
		}
	}

	let usesCustomColor = true;
	if(localStorage.getItem(`color2_${data.user.id}`) === "var(--defaultNameColorSecondary)" || !customizationOK) {
		// (user hasn't set custom colors, double check twitch colors are up to date)
		let col;
		if(localStorage.getItem("setting_chatNameUsesProminentColor") === "true") {
			col = data.user.entitlements.overlay.prominentColor;
		} else {
			col = data.user.entitlements.twitch.color;
		}

		if(!col) {
			if(localStorage.getItem("setting_chatNameUsesProminentColorAsFallback") === "true") {
				col = data.user.entitlements.overlay.prominentColor;
			}
		}

		if(col) {
			if(localStorage.getItem("setting_ensureNameColorsAreBrightEnough") === "true") {
				localStorage.setItem(`color_${data.user.id}`, ensureSafeColor(col));
			} else {
				localStorage.setItem(`color_${data.user.id}`, col);
			}
		}

		usesCustomColor = false;
	}

	rootCSS().setProperty(`--nameColor${data.user.id}`, localStorage.getItem(`color_${data.user.id}`));
	rootCSS().setProperty(`--nameColorSecondary${data.user.id}`, localStorage.getItem(`color2_${data.user.id}`));
	if(customizationOK) {
		rootCSS().setProperty(`--nameAngle${data.user.id}`, localStorage.getItem(`nameangle_${data.user.id}`));
	} else {
		rootCSS().setProperty(`--nameAngle${data.user.id}`, "var(--nameGradientAngle)");
	}

	return usesCustomColor;
}

function initUserBlockCustomizations(data, elements) {
	if(data.isOverlayMessage) {
		return;
	}

	let customizationOK = (localStorage.getItem("setting_allowUserCustomizations") === "true");
	let usesCustomColor = initUserSettingValues(data);

	let allNameElements = elements.nameBlock.children();
	let displayNameElement = elements.nameBlock.children(".displayName");
	let internationalNameElement = elements.nameBlock.children(".internationalName");

	let colorToUse = `color_${data.user.id}`;
	if(localStorage.getItem("setting_chatDefaultNameColorForced") === "true") {
		allNameElements.css("background-color", "var(--nameBackgroundNoGradientDefault)");
		colorToUse = `setting_chatDefaultNameColor`;
	} else {
		allNameElements.css("background-color", `var(--nameColor${data.user.id})`);

		if(localStorage.getItem("setting_chatNameUsesGradient") === "true" && usesCustomColor) {
			allNameElements.css("background-image", `linear-gradient(var(--nameAngle${data.user.id}), var(--nameColorSecondary${data.user.id}) 0%, transparent 75%)`);
		}
	}

	let userColorUsed = localStorage.getItem(colorToUse);
	if(!userColorUsed || userColorUsed === "var(--defaultNameColor)") {
		userColorUsed = localStorage.getItem("setting_chatDefaultNameColor");
	}

	if(localStorage.getItem("setting_chatOutlinesReflectUserColor") === "true") {
		rootCSS().setProperty(`--borderColor${data.user.id}`, interpolateColor(
			localStorage.getItem("setting_chatOutlinesColor"),
			userColorUsed,
			parseFloat(localStorage.getItem(`setting_chatOutlinesUserColorAmount`)
		)));
		elements.overallWrapper.css("border-color", `var(--borderColor${data.user.id})`);
	}
	if(localStorage.getItem("setting_chatBackgroundReflectUserColor") === "true") {
		rootCSS().setProperty(`--bgColor${data.user.id}`, interpolateColor(
			localStorage.getItem("setting_chatBackgroundColor"),
			userColorUsed,
			parseFloat(localStorage.getItem(`setting_chatBackgroundUserColorAmount`)
		)));
		elements.overallWrapper.css("background-color", `var(--bgColor${data.user.id})`);
	}
	if(localStorage.getItem("setting_chatMessageUserInfoBackgroundReflectUserColor") === "true") {
		rootCSS().setProperty(`--userInfoBGColor${data.user.id}`, interpolateColor(
			localStorage.getItem("setting_chatMessageUserInfoBackgroundColor"),
			userColorUsed,
			parseFloat(localStorage.getItem(`setting_chatMessageUserInfoBackgroundUserColorAmount`)
		)));
		elements.userBlock.css("background-color", `var(--userInfoBGColor${data.user.id})`);
	}
	if(localStorage.getItem("setting_chatMessageUserInfoOutlinesReflectUserColor") === "true") {
		rootCSS().setProperty(`--userOutlineColor${data.user.id}`, interpolateColor(
			localStorage.getItem("setting_chatMessageUserInfoOutlinesColor"),
			userColorUsed,
			parseFloat(localStorage.getItem(`setting_chatMessageUserInfoOutlinesUserColorAmount`)
		)));
		elements.userBlock.css("border-color", `var(--userOutlineColor${data.user.id})`);
	}
	if(localStorage.getItem("setting_pronounsReflectUserColor") === "true") {
		rootCSS().setProperty(`--pronounsColor${data.user.id}`, interpolateColor(
			localStorage.getItem("setting_pronounsColor"),
			userColorUsed,
			parseFloat(localStorage.getItem(`setting_pronounsUserColorAmount`)
		)));
		elements.pronounsBlock.css("background-color", `var(--pronounsColor${data.user.id})`);
	}
	if(localStorage.getItem("setting_chatMessageBackgroundReflectUserColor") === "true") {
		rootCSS().setProperty(`--messageBackgroundColor${data.user.id}`, interpolateColor(
			localStorage.getItem("setting_chatMessageBackgroundColor"),
			userColorUsed,
			parseFloat(localStorage.getItem(`setting_chatMessageBackgroundUserColorAmount`)
		)));
		elements.messageWrapper.css("background-color", `var(--messageBackgroundColor${data.user.id})`);
	}
	if(localStorage.getItem("setting_chatMessageOutlinesReflectUserColor") === "true") {
		rootCSS().setProperty(`--messageOutlineColor${data.user.id}`, interpolateColor(
			localStorage.getItem("setting_chatMessageOutlinesColor"),
			userColorUsed,
			parseFloat(localStorage.getItem(`setting_chatMessageOutlinesUserColorAmount`)
		)));
		elements.messageWrapper.css("border-color", `var(--messageOutlineColor${data.user.id})`);
	}

	if(customizationOK && !data.isOverlayMessage) {
		elements.nameBlock.css("font-family", `var(--nameFont${data.user.id})`);
		elements.nameBlock.css("font-weight", `var(--nameWeight${data.user.id})`);
		elements.nameBlock.css("font-size", `var(--nameSize${data.user.id})`);
		allNameElements.css("font-style", `var(--nameStyle${data.user.id})`);
		allNameElements.css("letter-spacing", `var(--nameSpacing${data.user.id})`);
		allNameElements.css("text-transform", `var(--nameTransform${data.user.id})`);
		allNameElements.css("font-variant", `var(--nameVariant${data.user.id})`);
		displayNameElement.css("filter", `var(--nameEffects${data.user.id})`);
		internationalNameElement.css("filter", `var(--nameEffects${data.user.id}) saturate(var(--internationalNameSaturation))`);

		if(localStorage.getItem(`namestyle_${data.user.id}`) === "italic") {
			allNameElements.css("padding-right", "4px");
		}
	}
}

function renderNameBlock(data) {
	if(!localStorage.getItem(`usename_${data.user.id}`)) { localStorage.setItem(`usename_${data.user.id}`, "name"); }

	// username = all latin
	// name = anything
	let internationalNameBlock = null;
	let name = data.user.username;
	if(localStorage.getItem(`usename_${data.user.id}`) === "name") {
		name = data.user.displayName;
		let nameTest = name.replace(/[\x00-\xFF]/ug, "");

		if(nameTest.length) {
			internationalNameBlock = $(`<span class="internationalName">${data.user.username}</span>`);
		}
	}

	let nameBlock = $(`<div class="name" data-userid="${data.user.id}"><span class="displayName">${name}</span></div>`);
	if(internationalNameBlock !== null) {
		nameBlock.append(internationalNameBlock);
	}

	testNameBlock = nameBlock;
	return nameBlock;
}

function renderUserBlock(data, rootElement, overallWrapper, messageWrapper) {
	let userBlock = $('<div class="userInfo"></div>');
	if(localStorage.getItem("setting_chatAnimationsIn") === "true") {
		userBlock.addClass("userInfoIn");
	}

	let badgeBlock = renderBadgeBlock(data, rootElement, userBlock);
	let flagBlock = renderFlagBlock(data);
	let pronounsBlock = renderPronounsBlock(data);
	let pfpBlock = renderAvatarBlock(data);
	let nameBlock = renderNameBlock(data);
	userBlock.append(badgeBlock);
	userBlock.append(flagBlock);
	userBlock.append(pronounsBlock);
	userBlock.append(pfpBlock);
	userBlock.append(nameBlock);

	if(data.user.id !== -1) {
		initUserBlockCustomizations(data, {
			rootElement: rootElement,
			overallWrapper: overallWrapper,
			userBlock: userBlock,
			badgeBlock: badgeBlock,
			flagBlock: flagBlock,
			pronounsBlock: pronounsBlock,
			pfpBlock: pfpBlock,
			nameBlock: nameBlock,
			messageWrapper: messageWrapper
		});
	}

	if(localStorage.getItem(`use7tvpaint_${data.user.id}`) === "yes" && !data.isOverlayMessage && data.user.entitlements.sevenTV.paint) {
		set7TVPaint(nameBlock, data.user.entitlements.sevenTV.paint, data.user.id);
	}

	return [userBlock, badgeBlock, flagBlock, pronounsBlock, pfpBlock, nameBlock];
}

function initMessageBlockCustomizations(data, elements) {
	if(data.isOverlayMessage) {
		return;
	}

	let customizationOK = (localStorage.getItem("setting_allowUserCustomizations") === "true");
	let colorToUse = (localStorage.getItem("setting_chatDefaultNameColorForced") === "true" ? "setting_chatDefaultNameColor" : `color_${data.user.id}`);

	let userColorUsed = localStorage.getItem(colorToUse);
	if(!userColorUsed || userColorUsed === "var(--defaultNameColor)") {
		userColorUsed = localStorage.getItem("setting_chatDefaultNameColor");
	}

	if(localStorage.getItem("setting_chatMessageReflectUserColor") === "true") {
		rootCSS().setProperty(`--chatMessageColor${data.user.id}`, interpolateColor(
			localStorage.getItem("setting_chatMessageColor"),
			userColorUsed,
			parseFloat(localStorage.getItem(`setting_chatMessageUserColorAmount`)
		)));
		elements.messageBlock.css("color", `var(--chatMessageColor${data.user.id})`);
	}

	if(customizationOK) {
		rootCSS().setProperty(`--msgFont${data.user.id}`, localStorage.getItem(`msgfont_${data.user.id}`));
		rootCSS().setProperty(`--msgWeight${data.user.id}`, localStorage.getItem(`msgweight_${data.user.id}`));

		rootCSS().setProperty(`--msgSize${data.user.id}`, localStorage.getItem(`msgsize_${data.user.id}`));
		if(localStorage.getItem("setting_chatMessageFontSize") !== "16") {
			let scale = parseFloat(localStorage.getItem("setting_chatMessageFontSize")) / 16;
			if(localStorage.getItem(`msgsize_${data.user.id}`) !== "var(--messageFontSize)") {
				rootCSS().setProperty(`--msgSize${data.user.id}`, `calc(${localStorage.getItem(`msgsize_${data.user.id}`)} * ${scale})`);
			}
		}

		rootCSS().setProperty(`--msgSpacing${data.user.id}`, localStorage.getItem(`msgspacing_${data.user.id}`));
		if(localStorage.getItem("setting_messageLetterSpacing") !== "0") {
			let scale = parseFloat(localStorage.getItem("setting_messageLetterSpacing"));
			if(localStorage.getItem(`msgspacing_${data.user.id}`) !== "var(--messageLetterSpacing)") {
				rootCSS().setProperty(`--msgSpacing${data.user.id}`, `calc(${localStorage.getItem(`msgspacing_${data.user.id}`)} * ${scale})`);
			}
		}

		elements.messageBlock.css("font-family", `var(--msgFont${data.user.id})`);
		elements.messageBlock.css("font-size", `var(--msgSize${data.user.id})`);
		elements.messageBlock.css("letter-spacing", `var(--msgSpacing${data.user.id})`);
		elements.messageBlock.css("font-weight", `var(--msgWeight${data.user.id})`);
	}
}

twitchEmoteCache = {};
async function cacheEmote(url) {
	if(url in twitchEmoteCache) {
		return twitchEmoteCache[url];
	}

	const cacheStorage = await caches.open("emoteCache");

	var cachedResponse = await cacheStorage.match(url);
	if(!cachedResponse) {
		await cacheStorage.add(url);
		cachedResponse = await cacheStorage.match(url);
	}

	const blob = await cachedResponse.blob();
	twitchEmoteCache[url] = URL.createObjectURL(blob);
	return twitchEmoteCache[url];
}

async function renderMessageBlock(data, rootElement) {
	let messageBlock = $('<div class="message"></div>');

	initMessageBlockCustomizations(data, {
		rootElement: rootElement,
		messageBlock: messageBlock
	});

	let originalMessage = Array.from(data.message.trim().normalize());

	let hasBigEmotes = false;
	let useLQImages = (localStorage.getItem("setting_useLowQualityImages") === "true");
	if(localStorage.getItem("setting_enableEmotes") === "true") {
		let checkExternalEmotes = Array.from(data.message.trim().normalize());

		if(data.emotes) {
			for(let emoteID in data.emotes) {
				const emoteURL = `https://static-cdn.jtvnw.net/emoticons/v2/${emoteID}/default/dark/${useLQImages ? "1.0" : "3.0"}`;
				const emoteObject = await cacheEmote(emoteURL);

				for(let i in data.emotes[emoteID]) {
					let spots = data.emotes[emoteID][i].split("-");
					let startAt = parseInt(spots[0]);
					let stopAt = parseInt(spots[1]);

					for(let charIdx = startAt; charIdx <= stopAt; charIdx++) {
						originalMessage[charIdx] = "";
						checkExternalEmotes[charIdx] = "";
					}

					originalMessage[startAt] = `<span class="emote" style="background-image: url('${emoteObject}');"><img src="${emoteObject}"/></span>`;
				}
			}
		}

		//console.log(` 3: ${originalMessage}`);

		let externalPostRemoval = [];
		for(let char of checkExternalEmotes) {
			if(char !== "") {
				externalPostRemoval.push(char);
			}
		}
		//console.log(` 4: ${externalPostRemoval}`);
		let re;
		if(localStorage.getItem("setting_useNewerEmojiRegex") === "true") {
			re = new RegExp("\\p{RGI_Emoji}+", "vg");
		} else {
			//re = new RegExp("[\\p{Extended_Pictographic}\?\!\.]", "ug");
			re = new RegExp("\\p{Extended_Pictographic}", "ug");
		}
		externalPostRemoval = externalPostRemoval.join("").replace(re, '');

		//console.log(` 5: ${externalPostRemoval}`);

		let eprw = externalPostRemoval.split(" ");
		let eprww = [];
		for(let wordIdx in eprw) {
			let word = eprw[wordIdx].trim();

			if(word.length > 0) {
				if(!(word in chatEmotes)) {
					eprww.push(eprw[wordIdx]);
				} else {
					if(!chatEmotes[word].enabled) {
						eprww.push(eprw[wordIdx]);
					}
				}
			}
		}
		//console.log(` 6: ${eprww} (${eprww.length})`);

		let parsedMessage = [];

		for(let charIdx in originalMessage) {
			if(!originalMessage[charIdx]) {
				continue;
			}

			if(originalMessage[charIdx] in entityMap) {
				parsedMessage.push(entityMap[originalMessage[charIdx]]);
			} else {
				parsedMessage.push(originalMessage[charIdx]);
			}
		}
		//console.log(` 7: ${parsedMessage}`);

		let stuff;
		if(localStorage.getItem("setting_chatParseMarkdown") === "true") {
			stuff = md.renderInline(parsedMessage.join(""));
		} else {
			stuff = parsedMessage.join("");
		}
		//console.log(` 8: ${stuff}`);

		let words = stuff.split(" ");

		let cheermotePrefixes = Object.keys(cheermotes);
		let lastWordWasEmote = false;
		for(let wordIdx in words) {
			let word = words[wordIdx];
			
			if(word in chatEmotes) {
				let externalEmote = chatEmotes[word];
				let modifiers = [];

				if(!externalEmote.enabled) {
					lastWordWasEmote = false;
				} else {
					if("modifiers" in externalEmote) {
						modifiers = externalEmote.modifiers;
					}

					let classes = ["emote"];
					if(externalEmote.isZeroWidth) {
						if(lastWordWasEmote) {
							classes.push("zeroWidthEmote");
						}
					}

					emoteObject = await externalEmote.url;
					words[wordIdx] = `<span class="${classes.join(" ")}" style="background-image: url('${emoteObject}');"${modifiers.length ? `data-emotemods="${modifiers.join(" ")}"` : ""}><img src="${emoteObject}"/></span>`;

					if(lastWordWasEmote) {
						if(externalEmote.isZeroWidth) {
							let tempEmote = $(words[wordIdx - 1]).append(words[wordIdx]);
							words[wordIdx - 1] = tempEmote.prop('outerHTML');
							words[wordIdx] = "";
							lastWordWasEmote = false;
						}
					} else {
						lastWordWasEmote = true;
					}
				}
			} else {
				lastWordWasEmote = false;
			}

			if(word[0] === "@") {
				words[wordIdx] = `<strong>${word}</strong>`;
			}

			if(data.parseCheermotes && localStorage.getItem("setting_chatShowCheermotes") === "true") {
				messageBlock.addClass("highlighted");

				for(let prefix of cheermotePrefixes) {
					if(word.toLowerCase().substring(0, prefix.length) === prefix) {
						let amount = parseInt(word.substring(prefix.length));
						if(isNaN(amount)) {
							// not actually a cheer
							continue;
						}

						let cheermote = cheermotes[prefix];

						let tiers = Object.keys(cheermote).sort(function(a, b) { return a - b; }).reverse();
						let reachedTier = 1;
						for(let tier of tiers) {
							if(amount >= tier) {
								reachedTier = tier;
								break;
							}
						}

						let mote = cheermote[reachedTier];
						let type = (localStorage.getItem("setting_chatShowCheermotesAnimated") === "true" ? "animated" : "static");

						let cheermoteColorString = (localStorage.getItem("setting_chatShowCheermotesColor") === "true" ? ` style="color: ${mote.color};"` : "");
						words[wordIdx] = `<span class="emote cheermote" style="background-image: url('${mote.images[type]}');"><img src="${mote.images[type]}"/></span><span${cheermoteColorString}>${amount}</span>`;
					}
				}
			}
		}

		//console.log(` 9: ${words}`);

		words = words.map(function(word) {
			if(!isWordSafe(word)) {
				return "[REDACTED]";
			}
			return word;
		});

		// what i'm doing here to fix in-line seamless emotes is stupid but it works yay
		messageBlock.html(words.join(" ").replaceAll("</span> <span", "</span><span"));

		if(data.type === "action") {
			let col;
			if(localStorage.getItem("setting_chatNameUsesProminentColor") === "true") {
				col = data.user.entitlements.overlay.prominentColor;
			} else {
				col = data.user.color;
			}

			if(!col) {
				if(localStorage.getItem("setting_chatNameUsesProminentColorAsFallback") === "true") {
					col = data.user.entitlements.overlay.prominentColor;
				} else {
					col = "var(--defaultNameColor)";
				}
			}

			messageBlock.addClass("actionMessage");
			messageBlock.css("background-image", `linear-gradient(170deg, #fff -50%, ${col} 150%)`);
		}

		if(localStorage.getItem("setting_emotesParseToImage") === "true") {
			messageBlock = $(twemoji.parse(messageBlock[0], {
				folder: 'svg',
				ext: '.svg'
			}));
		}

		hasBigEmotes = (eprww.join("") === "" && localStorage.getItem("setting_chatShowBigEmotes") === "true");
		if(hasBigEmotes) {
			messageBlock.addClass("isBigEmoteMode");
			messageBlock.children(".emote").addClass("bigEmote");
			messageBlock.children(".emoji").addClass("bigEmoji");

			let count = 0;
			let maxCount = parseInt(localStorage.getItem("setting_chatMaxBigEmotes"));
			messageBlock.children(".emote,.emoji").each(function() {
				if(count >= maxCount) {
					$(this).remove();
				}
				count++;
			});

			/*let htmlStuff = messageBlock.html().split(">").map(function(part) {
				if(part[0] === "<") {
					return part;
				}
				return part.trim().substring(0, 3);
			});
			console.log(htmlStuff);
			messageBlock.html(htmlStuff.join(">"));*/
		}

		let emoteChildren = messageBlock.children(".emote");
		let lastValidEmote = null;
		if(emoteChildren.length) {
			for(let i in emoteChildren) {
				let emote = emoteChildren.eq(i); // what the fuck
				let emoteMods = emote.attr("data-emotemods");

				if(typeof emoteMods === "undefined") {
					lastValidEmote = emote;
					continue;
				}

				emoteMods = emoteMods.split(" ");
				if(emoteMods.indexOf("Hidden") !== -1) {
					emote.addClass("mod_Hidden");
				}

				if(lastValidEmote === null) {
					continue;
				}

				for(let mod of emoteMods) {
					if(mod === "Hidden") {
						continue;
					}

					lastValidEmote.addClass(`mod_${mod}`);
				}
			}
		}
	} else {
		let parsedMessage = [];

		for(let charIdx in originalMessage) {
			if(!originalMessage[charIdx]) {
				continue;
			}

			if(originalMessage[charIdx] in entityMap) {
				parsedMessage.push(entityMap[originalMessage[charIdx]]);
			} else {
				parsedMessage.push(originalMessage[charIdx]);
			}
		}

		let stuff;
		if(localStorage.getItem("setting_chatParseMarkdown") === "true") {
			stuff = md.renderInline(parsedMessage.join(""));
		} else {
			stuff = parsedMessage.join("");
		}

		let words = stuff.split(" ");

		words = words.map(function(word) {
			if(!isWordSafe(word)) {
				return "[REDACTED]";
			}
			return word;
		});

		if(!isStringSafe(words.join(" "))) {
			words = ["[REDACTED]"];
		}

		for(let wordIdx in words) {
			let word = words[wordIdx];
			if(word[0] === "@") {
				words[wordIdx] = `<strong>${word}</strong>`;
			}
		}

		messageBlock.html(words.join(" "));
	}

	return messageBlock;
}

function renderEventTagBlock(data, wrapperElement) {
	if(!("extraInfo" in data)) {
		return;
	}

	let extraInfoBlock = $(`<div class="extraInfo">${data.extraInfo}</div>`);
	wrapperElement.append(extraInfoBlock);

	return extraInfoBlock;
}

var messageDecayTimeouts = {};

async function parseMessage(data) {
	if(!allowedToProceed) {
		console.log("No Client ID or Secret is set.");
		return;
	}

	console.log(data);

	if(deleteMessages.indexOf(data.uuid) !== -1) {
		deleteMessages.splice(deleteMessages.indexOf(data.uuid), 1);
		console.log("message was removed, not rendering");
		return;
	}

	if(localStorage.getItem("setting_debugFreezeChat") === "true" || data.message === null) {
		return;
	}

	let wantedCommand;
	let wantedArgs;
	if(data.message[0] === localStorage.getItem("setting_chatCommandCharacter")) {
		let parts = data.message.substr(1).split(" ");
		
		let cmd = parts[0].toLowerCase();
		wantedArgs = parts.slice(1);

		if(cmd in chatFuncs) {
			wantedCommand = chatFuncs[cmd];
		}

		let continueOn = false;
		if(typeof wantedCommand === "function") {
			continueOn = wantedCommand(data, wantedArgs);
		}

		if(!continueOn && localStorage.getItem("setting_chatHideCommands") === "true") {
			return;
		}
	}

	messageCount++;
	let rootParts = getRootElement(data);
	let rootElement = rootParts[0];
	let overallWrapper = rootParts[1];
	let messageWrapper = rootParts[2];

	let wrapperElement = $(`<div class="effectWrapper" data-msgUUID="${data.uuid}"></div>`);
	wrapperElement.attr("data-rootidx", rootElement.attr("data-rootidx"));

	if(localStorage.getItem("setting_chatAnimationsIn") === "true" && messageWrapper.children(".effectWrapper").length) {
		wrapperElement.addClass("slideIn");
	}

	let eventTagBlock = renderEventTagBlock(data, wrapperElement);

	let messageBlock = await renderMessageBlock(data, rootElement);
	wrapperElement.append(messageBlock);

	messageWrapper.append(wrapperElement);

	let messageCap = parseInt(localStorage.getItem("setting_chatMessagesHardCap"));
	while($(".chatBlock").length > messageCap) {
		$(".chatBlock")[0].remove();
	}

	if(data.highlighted) {
		messageBlock.addClass("highlighted");
		messageBlock.css("filter", "var(--effectFilters) var(--highlightedEffect)");
		if(eventTagBlock) {
			eventTagBlock.css("filter", "var(--effectFilters) var(--highlightedEffect)");
		}
	}

	setHistoryOpacity();

	if(localStorage.getItem("setting_chatMessageReflectUserColor") === "true" && !data.isOverlayMessage) {
		messageBlock.find("strong").css("background-color", `var(--chatMessageColor${data.user.id})`);
	}

	let hasBigEmotes = messageBlock.hasClass("isBigEmoteMode");

	if(typeof wantedCommand === "function") {
		wantedCommand(data, wantedArgs, wrapperElement);
	} else {
		let addTimestamp = false;

		if(localStorage.getItem("setting_enableMessageTimestamps") === "true") {
			if(hasBigEmotes) {
				if(localStorage.getItem("setting_hideTimestampsOnBigEmotes") === "false") {
					addTimestamp = true;
				}
			} else {
				addTimestamp = true;
			}
		}

		if(addTimestamp) {
			let timeObj = undefined;
			if(localStorage.getItem("setting_timestampTracksUptime") === "true") {
				timeObj = luxon.DateTime.now().diff(luxon.DateTime.fromISO(streamData.started_at));
			} else {
				timeObj = luxon.DateTime.now();
			}
			let timestampBlock = $(`<div class="timestamp">${timeObj.toFormat(localStorage.getItem("setting_timestampFormat"))}</div>`);
			messageBlock.prepend(timestampBlock);
		}
	}

	let secsVisible = parseFloat(localStorage.getItem("setting_chatRemoveMessageDelay"));
	if(parseInt(data.user.id) < 0) {
		secsVisible = parseFloat(localStorage.getItem("setting_chatRemoveSystemMessageDelay"));
	}

	if(secsVisible) {
		clearTimeout(messageDecayTimeouts[combinedCount]);

		messageDecayTimeouts[combinedCount] = setTimeout(function() {
			if(localStorage.getItem("setting_chatAnimationsOut") === "true") {
				rootElement.removeClass("slideIn").addClass("slideOut");
				rootElement.one("animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd", function() {
					$(rootElement).remove();
				});
			} else {
				rootElement.remove();
			}
		}, secsVisible * 1000);
	}

	let doSound = true;
	if(data.isOverlayMessage && localStorage.getItem("setting_playSoundOnSystemMessages") === "false") {
		doSound = false;
	}
	if(hasBigEmotes && localStorage.getItem("setting_playSoundOnEmoteOnlyMessages") === "false") {
		doSound = false;
	}
	if(doSound) {
		playSound("newMsg");
	}

	/*const emoteBlocks = messageBlock.find(".emote img").toArray();
	for(const block of emoteBlocks) {
		if("src" in block.dataset) {
			block.onload = function() {
				if(this.src.substr(0, 4) === "blob") {
					console.log(`revoking blob object, we're done (${this.src})`);
					URL.revokeObjectURL(this.src);
				}
			}
			setTimeout(function() {
				block.src = block.dataset.src;
			}, 33); // sigh
		}
	}*/
}

function render7TVBadges(user, badgeBlock) {
	const entitlements = user.entitlements;

	if(entitlements.sevenTV.badges.length) {
		for(let i in entitlements.sevenTV.badges) {
			let badge = sevenTVEntitlements.getBadge(entitlements.sevenTV.badges[i]);

			let badgeElem = $(`<span class="badgeWrap normal_badge badgeGradient sevenTVBadge" data-badgeid="${badge.id}"></span>`);
			if(localStorage.getItem("setting_useLowQualityImages") === "true") {
				badgeElem.css("background-image", `url('${badge.urls.low}')`);
			} else {
				badgeElem.css("background-image", `url('${badge.urls.high}')`);
			}

			badgeBlock.append(badgeElem);

			if(!badgeElem.is(":visible")) {
				badgeBlock.show();
			}
		}
	}	
}

function renderFFZBadges(user, badgeBlock) {
	const entitlements = user.entitlements;

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

			badgeBlock.append(badgeElem);

			if(badgeElem.is(":visible")) {
				badgeBlock.show();
			}
		}
	}
}

function renderBTTVBadges(user, badgeBlock) {
	const entitlements = user.entitlements;

	if(entitlements.bttv.badge) {
		let badge = entitlements.bttv.badge;

		let badgeElem = $(`<span class="badgeWrap normal_badge badgeGradient bttvBadge"></span>`);
		if(localStorage.getItem("setting_useLowQualityImages") === "true") {
			badgeElem.css("background-image", `url('${badge.low}')`);
		} else {
			badgeElem.css("background-image", `url('${badge.high}')`);
		}

		badgeBlock.append(badgeElem);
		if(badgeElem.is(":visible")) {
			badgeBlock.show();
		}
	}
}

function renderExternalBadges(user, badgeBlock) {
	if(!badgeBlock) {
		console.log("no badge block?");
		return;
	}

	if(parseInt(user.id) === -1) {
		return;
	}

	render7TVBadges(user, badgeBlock);
	renderFFZBadges(user, badgeBlock);
	renderBTTVBadges(user, badgeBlock);
}

async function bttvBadge(data, userData) {
	console.log(`getting bttv badge data for ${data.name}...`);

	if(!("badge" in data)) {
		console.log("no badge object");
		return;
	}
	if(data.badge === null) {
		// wtf
		return;
	}
	if(!Object.keys(data.badge).length) {
		console.log("badge object empty");
		return;
	}

	console.log(data);

	let user = await twitchUsers.getUser(data.providerId);

	if(user === null) {
		await delay(500);
		return bttvBadge(data, userData);
	}

	if(user.entitlements.bttv.badge !== null) {
		return;
	}

	user.entitlements.bttv.badge = {
		high: data.badge.url,
		low: data.badge.url
	};

	renderBTTVBadges(user, $(`.chatBlock[data-userid="${user.id}"] .badges`));
}

function updateBTTVEmote(data) {
	let newEmote = data.emote
	chatEmotes.updateEmote(newEmote.id, newEmote.code);
}

function deleteBTTVEmote(data) {
	chatEmotes.deleteEmote(data.emoteId)
}

function addBTTVEmote(data) {
	let emote = data.emote;

	chatEmotes.addEmote(new Emote({
		service: "bttv",
		urls: {
			high: `https://cdn.betterttv.net/emote/${emote.id}/3x.${emote.imageType}`,
			low: `https://cdn.betterttv.net/emote/${emote.id}/1x.${emote.imageType}`
		},
		emoteID: emote.id,
		emoteName: emote.code,
		modifiers: (emote.modifier ? ["Hidden"] : [])
	}));

	console.log(`added emote ${emote.code}`);
}

var bttvWS;
function startBTTVWebsocket() {
	console.log("Starting connection to BTTV...");
	if(localStorage.getItem("setting_enableBTTV") === "false") {
		try {
			bttvWS.close();
		} catch {
			// do nothing
		}
		console.log("BTTV is disabled");
		return;
	}

	if(typeof bttvWS === "undefined") {
		bttvWS = new WebSocket("wss://sockets.betterttv.net/ws");
	} else {
		try {
			bttvWS.close();
		} catch {
			// do nothing
		}		
	}

	bttvWS.addEventListener("message", async function(msg) {
		let data = JSON.parse(msg.data);
		console.log(data);

		switch(data.name) {
			case "lookup_user":
				if(localStorage.getItem("setting_enableBTTVBadges") === "true") {
					await bttvBadge(data.data);
				}
				break;

			case "emote_update":
				if(localStorage.getItem("setting_enableBTTVChannelEmotes") === "true") {
					updateBTTVEmote(data.data);
				}
				break;

			case "emote_delete":
				if(localStorage.getItem("setting_enableBTTVChannelEmotes") === "true") {
					deleteBTTVEmote(data.data);
				}
				break;

			case "emote_create":
				if(localStorage.getItem("setting_enableBTTVChannelEmotes") === "true") {
					addBTTVEmote(data.data);
				}
				break;
		}
	});

	bttvWS.addEventListener("open", function() {
		console.log("Successfully connected to BTTV");

		let waitForBroadcasterData = function() {
			if(!("id" in broadcasterData)) {
				console.log("no broadcaster data yet...");
				setTimeout(waitForBroadcasterData, 1000);
				return;
			} else {
				console.log("broadcaster data is present, joining BTTV channel...");
			}

			let msg = {
				name: "join_channel",
				data: {
					name: `twitch:${broadcasterData.id}`
				}
			}

			bttvWS.send(JSON.stringify(msg));
		};
		setTimeout(waitForBroadcasterData, 1000);
	});

	bttvWS.addEventListener("close", function() {
		console.log("Disconnected from BTTV, trying again in 20 seconds...");
		setTimeout(startBTTVWebsocket, 20000);
	});
}

var sevenTVWS;
function subscribe7TV(type, objectID) {
	let conditions = {};

	if(objectID) {
		conditions = {
			object_id: objectID
		};
	} else {
		conditions = {
			ctx: 'channel',
			id: broadcasterData.id,
			platform: 'TWITCH'	
		};
	}

	let msg = {
		op: 35,
		d: {
			type: type,
			condition: conditions
		}
	};

	if(sevenTVWS) {
		if(sevenTVWS.readyState === 1) {
			sevenTVWS.send(JSON.stringify(msg));
		}
	}
}
function start7TVWebsocket() {
	console.log("Starting connection to 7TV...");
	if(localStorage.getItem("setting_enable7TV") === "false") {
		console.log("7TV is disabled");
		return;
	}

	sevenTVWS = new WebSocket('wss://events.7tv.io/v3');

	const dispatchFuncs = {
		"entitlement.create": async function(data) {
			if(data.kind !== "BADGE" && data.kind !== "PAINT") {
				return;
			}

			let user;
			for(const connection of data.user.connections) {
				if(connection.platform !== "TWITCH") {
					continue;
				}

				user = await twitchUsers.getUser(connection.id);
				break;
			}

			if(!user) {
				console.log("we're going too fast wtf");
				await delay(500);
				return dispatchFuncs["entitlement.create"](data);
			}

			switch(data.kind) {
				case "BADGE":
					if(user.entitlements.sevenTV.badges.indexOf(data.ref_id) === -1) {
						user.entitlements.sevenTV.badges.push(data.ref_id);
						render7TVBadges(user, $(`.chatBlock[data-userid="${user.id}"] .badges`));
					}
					break;

				case "PAINT":
					user.setSevenTVPaint(data.ref_id);
					console.log(user);
					set7TVPaint($(`.name[data-userid="${user.id}"]`), data.ref_id, user.id);
					break;
			}
		},

		"entitlement.delete": async function(data) {
			if(data.kind !== "BADGE" && data.kind !== "PAINT") {
				return;
			}

			let user;
			for(const connection of data.user.connections) {
				if(connection.platform !== "TWITCH") {
					continue;
				}

				user = await twitchUsers.getUser(connection.id);
				break;
			}

			if(!user) {
				console.log("we're going too fast wtf");
				await delay(500);
				return dispatchFuncs["entitlement.delete"](data);
			}

			switch(data.kind) {
				case "BADGE":
					user.entitlements.sevenTV.badges = user.entitlements.sevenTV.badges.filter(function(badge) { 
						return badge.id !== data.ref_id;
					});
					break;

				case "PAINT":
					if(user.entitlements.sevenTV.paint === data.ref_id) {
						user.setSevenTVPaint(null);
					}
					break;
			}
		},

		"cosmetic.create": function(data) {
			if(data.kind !== "PAINT") {
				return;
			}

			sevenTVEntitlements.createPaint(data.id, data.data);
		},

		"emote_set.update": function(data) {
			if("pushed" in data) {
				for(const objectData of data.pushed) {
					const emoteData = objectData.value.data;
					const urls = emoteData.host.files;

					chatEmotes.addEmote(new Emote({
						service: "7tv",
						urls: {
							high: `https:${emoteData.host.url}/${urls[urls.length-1].name}`,
							low: `https:${emoteData.host.url}/${urls[0].name}`
						},
						emoteID: emoteData.id,
						emoteName: emoteData.name,
						isZeroWidth: (emoteData.flags & 256 === 256),
						global: false
					}));
				}
			}
			if("pulled" in data) {
				for(const objectData of data.pulled) {
					console.log(objectData);
					const emoteData = objectData.old_value;
					chatEmotes.deleteEmote(emoteData.id);
				}
			}
		}
	};

	let dispatch = function(data) {
		if(data.type in dispatchFuncs) {
			if(data.type === "emote_set.update") {
				dispatchFuncs[data.type](data.body)
			} else {
				dispatchFuncs[data.type](data.body.object)
			}
		}
	}

	sevenTVWS.addEventListener("message", function(msg) {
		let data = JSON.parse(msg.data);
		console.log(data);

		switch(data.op) {
			case 0:
				dispatch(data.d);
				break;

			case 1:
				/*if(!sevenTVSessionID) {
					sevenTVSessionID = data.d.session_id;
				}*/
				break;

			case 2:
				// ok what is 37 supposed to be
				// sevenTVWS.send(JSON.stringify({op: 37}));
				break;

			case 4:
				sevenTVWS.close();
				break;
		}
	});

	sevenTVWS.addEventListener("open", function() {
		console.log("Successfully connected to 7TV");

		let waitForBroadcasterData = function() {
			if(!("id" in broadcasterData)) {
				console.log("no broadcaster data yet...");
				setTimeout(waitForBroadcasterData, 1000);
				return;
			} else {
				console.log("broadcaster data is present, doing 7TV subscriptions...");
			}

			// 7tv's v3 API is unfinished, in case you're wondering why no one's using opcode 34/RESUME
			// it's because there's nothing there. it's commented out. it will *always return a failure*, the FFZ 7tv addon also just restarts the connection
			/*if(sevenTVSessionID) {
				let msg = {
					op: 34,
					d: {
						session_id: sevenTVSessionID
					}
				};
				sevenTVWS.send(JSON.stringify(msg));
			} else {
				subscribe("cosmetic.*");
				subscribe("entitlement.*");
			}*/

			subscribe7TV("cosmetic.*");
			subscribe7TV("entitlement.*");
			if(sevenTVEmoteSetID) {
				subscribe7TV("emote_set.*", sevenTVEmoteSetID);
			}
		};
		waitForBroadcasterData();
	});

	sevenTVWS.addEventListener("close", function() {
		console.log("Disconnected from 7TV, trying again in 5 seconds...");
		setTimeout(start7TVWebsocket, 5000);
	});
}