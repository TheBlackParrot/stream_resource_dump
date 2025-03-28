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

	const sourceRoomID = ("source-room-id" in tags ? tags['source-room-id'] : tags['room-id'] || broadcasterData.id);
	userData.createTwitchEntitlementsForRoom(sourceRoomID);

	const userBadgeData = userData.entitlements.twitch.badges[sourceRoomID];

	if("source-room-id" in tags) {
		tags = parseComplexTag(tags, "source-badges");
		tags = parseComplexTag(tags, "source-badge-info");
	}
	const badgeList = ("source-room-id" in tags ? tags['source-badges'] : tags['badges']);
	const badgeInfo = ("source-room-id" in tags ? tags['source-badge-info'] : tags['badge-info']);

	let fixedBadgeKeys = {};

	for(const badgeKey in badgeList) {
		let newBadgeKey = badgeKey;
		switch(badgeKey) {
			case "subscriber":
				newBadgeKey = `subscriber${sourceRoomID}`;
				break;

			case "bits":
				newBadgeKey = `bits${sourceRoomID}`;
				break;
		}
		fixedBadgeKeys[newBadgeKey] = badgeList[badgeKey];

		userBadgeData.list[newBadgeKey] = badgeList[badgeKey];
		if(badgeInfo) {
			if(badgeKey in badgeInfo) {
				userBadgeData.info[newBadgeKey] = badgeInfo[badgeKey];
			}
		}
	}

	if(userBadgeData) { // ...uh
		for(const badgeKey in userBadgeData.list) {
			if(!(badgeKey in fixedBadgeKeys)) {
				if(badgeKey in userBadgeData.info) {
					delete userBadgeData.info[badgeKey];
				}
				delete userBadgeData.list[badgeKey];
			}
		}
	}

	userData.entitlements.twitch.color = tags['color'];

	let isOverlayMessage = false;
	if('is-overlay-message' in tags) {
		isOverlayMessage = tags['is-overlay-message'];
	}

	if(!userData.fetchedCustomSettings && !isOverlayMessage) {
		console.log("waiting for custom settings to set");
		await userData.customSettingsFetchPromise;
	}

	userData.userBlock.initUserSettingsValues();
	
	console.log(userData);

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

	let hasMetThreshold = true;
	let isVIP = false;
	if(localStorage.getItem("setting_chatHideUntilThresholdMet") === "true" && !isOverlayMessage) {
		hasMetThreshold = false;
		
		if(parseInt(localStorage.getItem(`msgCount_${broadcasterData.id}_${userData.id}`)) < parseInt(localStorage.getItem("setting_chatHideThreshold"))) {
			if(userData.moderator) {
				hasMetThreshold = true;
			} else {
				if('badges' in tags) {
					if(tags.badges) {
						let roles = Object.keys(tags.badges);
						if(roles.indexOf("vip") !== -1) {
							isVIP = true;
							hasMetThreshold = true;
						}
					}
				}
			}
		} else {
			hasMetThreshold = true;
		}
	}
	if(!hasMetThreshold) {
		return;
	}

	if(localStorage.getItem("setting_chatHideASCIIArt") === "true") {
		if((userData.moderator && localStorage.getItem("setting_chatModsBypassASCIIArtFilter") === "true") || (isVIP && localStorage.getItem("setting_chatVIPBypassASCIIArtFilter") === "true")) {
			// all good :)
		} else {
			const brailleAmount = (message.match(brailleTest) || []).length;
			const messageLength = message.length;

			if(messageLength <= parseInt(localStorage.getItem("setting_chatMessageLengthASCIIArtFilterMinimum"))) {
				// all good :)
			} else {
				const asciiThreshold = (parseInt(localStorage.getItem("setting_chatHideASCIIArtThreshold")) || 0) / 100;
				if(brailleAmount / messageLength >= asciiThreshold) {
					message = "[REDACTED]";
					tags['emotes'] = null;
					tags['emotes-raw'] = null;
				}
			}
		}
	}

	let gigantified = false;
	if('msg-id' in tags) {
		if(tags['msg-id'] === "gigantified-emote-message") {
			gigantified = true;
		}
	}
	let outObject = {
		message: message,
		isOverlayMessage: isOverlayMessage,
		type: tags['message-type'],
		highlighted: (forceHighlight ? true : false),
		emotes: tags['emotes'],
		uuid: tags['id'],
		parseCheermotes: ('bits' in tags),
		user: userData,
		reply: false,
		roomID: sourceRoomID,
		gigantified: gigantified
	};

	if("reply-parent-msg-id" in tags) {
		if(tags['reply-parent-msg-id']) {
			let repliedUserData = await twitchUsers.getUser(tags['reply-parent-user-id']);

			if(!repliedUserData.fetchedCustomSettings) {
				console.log("waiting for custom settings to set on replied user");
				await repliedUserData.customSettingsFetchPromise;
			}

			repliedUserData.userBlock.initUserSettingsValues();

			outObject.reply = {
				uuid: tags["reply-parent-msg-id"],
				user: repliedUserData,
				message: tags["reply-parent-msg-body"]
			}
		}
	}

	if('first-msg' in tags) {
		if(tags['first-msg']) {
			if(localStorage.getItem("setting_enableEventTagsFirstTimeChat") === "true") {
				outObject.extraInfo = `<div class="firstTimeChatIcon"></div> ${localStorage.getItem("setting_eventTagsFirstTimeChatFormat")}`;
				if(localStorage.getItem("setting_highlightFirstTimeMessages") === "true") {
					outObject.highlighted = true;
				}
			}
		}
	}

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
					outObject.extraInfo = `<div class="announcementIcon"></div>  ${localStorage.getItem("setting_eventTagsAnnouncementFormat")}`;
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
				outObject.extraInfo = '<div class="subIcon"></div> ';
				outObject.extraInfo += localStorage.getItem("setting_eventTagsResubFormat")
					.replaceAll("%amount", tags['msg-param-cumulative-months'])
					.replaceAll("%tier", subTiers[tags['msg-param-sub-plan']]);
			}
			break;

		case "subscription":
			if(localStorage.getItem("setting_enableEventTagsSubs") === "true") {
				outObject.extraInfo = '<div class="subIcon"></div> ';
				outObject.extraInfo += localStorage.getItem("setting_eventTagsNewSubFormat").replaceAll("%tier", subTiers[tags['msg-param-sub-plan']]);
			}
			break;

		case "cheer":
		case "chat":
			if("bits" in tags && localStorage.getItem("setting_enableEventTagsBits") === "true") {
				outObject.extraInfo = '<div class="cheerIcon"></div> ';
				outObject.extraInfo += localStorage.getItem("setting_eventTagsCheerFormat").replaceAll("%amount", parseInt(tags['bits']).toLocaleString());
			}
			break;
	}

	if("source-room-id" in tags) {
		outObject.sourceRoomID = tags['source-room-id'];
	}

	if(userData.avatarImage === null && userData.id !== -1) {
		await userData.cacheAvatar();
	}

	let parseDelay = 0;
	if(!isOverlayMessage) {
		parseDelay = (parseFloat(localStorage.getItem("setting_delayChat")) * 1000) || 0;
	}

	$(".chatBlock").each(function() {
		if(Date.now() > parseInt($(this).attr("data-ensureClear"))) {
			if(parseFloat(localStorage.getItem("setting_chatRemoveMessageDelay")) === 0) {
				$(this).removeAttr("data-ensureClear");
				return;
			}
			
			console.log("message stuck around longer than it should have, force removing");
			if(localStorage.getItem("setting_chatAnimationsOut") === "true") {
				const actuallyThis = $(this);
				actuallyThis.removeClass("slideIn").addClass("slideOut");
				actuallyThis.one("animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd", function() {
					actuallyThis.remove();
				});
			} else {
				actuallyThis.remove();
			}
		}
	});

	userData.userBlock.updateBadgeBlock(sourceRoomID);

	setTimeout(async function() { await parseMessage(outObject); }, parseDelay);
}

var lastSettingsRefresh = [];
const chatFuncs = {
	bsr: async function(data, args, msgElement) {
		if(localStorage.getItem("setting_cmdEnableBSR") !== "true") {
			return;
		}

		if("game_id" in streamData) {
			if(streamData.game_id !== "503116") {
				if(Date.now() - streamData.lastUpdate > 300000) {
					await getTwitchStreamData();
					if(streamData.game_id !== "503116") {
						return;
					}
				} else {
					return;
				}
			}
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
		infoElement.html(`<div class="spinner"></div> <span style="opacity: 0.67; margin-left: 6px;" class="loadingMsg">getting information for <strong>${args[0]}</strong>...</span>`);

		msgElement.append(infoElement);

		const mapData = await getCachedMapData(`https://api.beatsaver.com/maps/id/${args[0].toLowerCase()}`);
		console.log(mapData);

		if(!Object.keys(mapData).length) {
			infoElement.html(`<i class="fas fa-times"></i> <span class="loadingMsg"><strong>(${args[0]})</strong> no map with this key exists!</span>`);
			return;			
		}

		if(funnyBeatSaberMapsToRequestToEverySingleStreamerOnTwitchEverIBetEverySingleOneOfThemWillEnjoyThem.indexOf(mapData.id) !== -1) {
			infoElement.addClass("STREAMER_CAN_YOU_PLAY_REALITY_CHECK_ITS_MY_FAVORITE_MAP");
		}

		let canShowArt = (localStorage.getItem("setting_chatBSRAlwaysShowCoverArt") === "true");
		if(!canShowArt) {
			const checks = [
				(localStorage.getItem("setting_chatBSRShowCoverArtIfRanked") === "true" && (mapData.ranked || mapData.qualified || mapData.blRanked || mapData.blQualified)),
				(localStorage.getItem("setting_chatBSRShowCoverArtIfCurated") === "true" && "curatedAt" in mapData),
				(localStorage.getItem("setting_chatBSRShowCoverArtIfVerified") === "true" && mapData.uploader.verifiedMapper)
			];

			for(const check of checks) {
				if(check) {
					canShowArt = check;
					break;
				}
			}
		}

		let canShowInfo = canShowArt;
		if(!canShowInfo) {
			if(!("uploader" in mapData)) {
				infoElement.html(`<i class="fas fa-times"></i> <span class="loadingMsg"><strong>(${args[0]})</strong> no uploader present in API response</span>`);
				return;
			}
			if(!Object.keys(mapData.uploader).length) {
				infoElement.html(`<i class="fas fa-times"></i> <span class="loadingMsg"><strong>(${args[0]})</strong> uploader doesn't exist according to API response</span>`);
				return;
			}
		}

		let accountIsTooNew = false;
		if("firstUpload" in mapData.uploader.stats && localStorage.getItem("setting_chatBSRHideIfAccountTooNew") === "true") {
			const firstUploadTimestamp = new Date(mapData.uploader.stats.firstUpload).getTime();
			const firstUploadThreshold = parseFloat(localStorage.getItem("setting_chatBSRAccountAgeThreshold")) * 24 * 60 * 60 * 1000;
			if(Date.now() - firstUploadTimestamp < firstUploadThreshold) {
				accountIsTooNew = true;
			}
		}

		let mapIsTooNew = false;
		let dateString;
		for(const checkKey of ["lastPublishedAt", "createdAt", "uploaded"]) {
			if(checkKey in mapData) {
				dateString = mapData[checkKey];

				if(localStorage.getItem("setting_chatBSRHideIfMapTooNew") === "true") {
					const checkTimestamp = new Date(mapData[checkKey]).getTime();
					const checkThreshold = parseFloat(localStorage.getItem("setting_chatBSRMapAgeThreshold")) * 24 * 60 * 60 * 1000;
					if(Date.now() - checkTimestamp < checkThreshold) {
						mapIsTooNew = true;
					}
				}

				break;
			}
		}

		if(accountIsTooNew) {
			infoElement.html(`<i class="fas fa-times"></i> <span class="loadingMsg"><strong>(${args[0]})</strong> mapper's first published map is too recent</span>`);
			return;
		}

		if(mapIsTooNew) {
			infoElement.html(`<i class="fas fa-times"></i> <span class="loadingMsg"><strong>(${args[0]})</strong> map is too new</span>`);
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
		if(localStorage.getItem("setting_chatBSRUseBeatSaverInformation") === "true" && "uploader" in mapData) {
			mapperElement.empty();
			
			let mappers = [mapData.uploader.name];
			if("collaborators" in mapData) {
				for(const collaborator of mapData.collaborators) {
					mappers.push(collaborator.name);
				}
			}

			mappers.map(function(x) {
				if(!isStringSafe(x)) {
					return "[REDACTED]";
				} else {
					return x;
				}
			});

			mapperElement.text(mappers.join(", "));
		}
		metadataElement.append(titleElement).append(artistElement).append(mapperElement);

		let extraDataElement = $(`<div class="bsrExtraInfo"></div>`);
		let idElement = $(`<div class="bsrCode"><span class="bsrCodeValue">${mapData.id}</span></div>`);
		let statsElement = $(`<div class="bsrStats"></div>`);
		statsElement.append($(`<span class="songTime"><i class="fas fa-clock"></i> ${formatTime(mapData.metadata.duration)}</span>`));

		const ageContainer = $(`<span class="songAge" data-dateString="${dateString}"></span>`);
		const ageData = luxon.DateTime.fromISO(dateString);
		var ageString;
		if(localStorage.getItem("setting_chatBSRMapAgeUsePrecise") === "true") {
			ageString = ageData.toFormat(localStorage.getItem("setting_chatBSRMapAgeFormat"));
		} else {
			ageString = ageData.toRelative({unit: ["years", "months", "days", "hours", "minutes"]});
		}
		ageContainer.append(`<i class="fas fa-calendar-days"></i> ${ageString}`);
		statsElement.append(ageContainer);

		const ratingContainer = $(`<span class="songRating"></span>`);
		ratingContainer.append(`<i class="fas fa-thumbs-up"></i> ${mapData.stats.upvotes.toLocaleString()}`);
		ratingContainer.append(`<i class="fas fa-thumbs-down"></i> ${mapData.stats.downvotes.toLocaleString()}`);
		ratingContainer.append(`<i class="songRatingPercentage">(${parseInt(mapData.stats.score * 100)}<i style="font-size: 0.85em;">%</i>)</i>`);
		statsElement.append(ratingContainer);

		extraDataElement.append(idElement);
		extraDataElement.append(statsElement);

		infoElement.empty();
		if(canShowArt) {
			infoElement.append(artElement);
		}
		infoElement.append(metadataElement).append(extraDataElement);

		const statsChildren = statsElement.children();
		if(statsChildren.length) {
			for(let idx = statsChildren.length - 1; extraDataElement.width() > infoElement.width() && idx >= 0; idx--) {
				$(statsChildren[idx]).hide();
			}
		}
	},

	refreshpronouns: async function(data, callback) {
		await data.user.setPronouns();
	},

	refreshpfp: async function(data, args) {
		await data.user.refreshCachedAvatar();
	},

	refreshemotes: function(data, args) {
		if("sourceRoomID" in data) {
			if(data.sourceRoomID !== broadcasterData.id) {
				return;
			}
		}

		if(!data.user.moderator) {
			return;
		}

		console.log("refreshing external emotes...");

		chatEmotes = new GlobalEmoteSet();
		getGlobalChannelEmotes(broadcasterData);
	},

	overlayversion: function(data, args) {
		if("sourceRoomID" in data) {
			if(data.sourceRoomID !== broadcasterData.id) {
				return;
			}
		}

		if(!data.user.moderator) {
			if(parseInt(data.user.id) !== 43464015) {
				return;
			}
		}

		systemMessage(`Streamer is using overlay r${overlayRevision}`);
		checkForUpdate();
	},

	refreshcosettings: async function(data, args) {
		if(lastSettingsRefresh.indexOf(data.user.id) !== -1) {
			if(Date.now() > (lastSettingsRefresh[data.user.id] + 15000)) {
				return false;
			}
		}
		lastSettingsRefresh[data.user.id] = Date.now();

		await data.user.getUserSettings();

		data.message = "New chat settings have applied!";
		return true;
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
var lastRootElement = [];
var lastMessageIdx;
var messageCount = 0;
var combinedCount = 0;
var testNameBlock;
async function getRootElement(data) {
	if(localStorage.getItem("setting_combineMessagesIntoOneBlock") === "true") {
		if($(`.chatBlock[data-rootIdx="${combinedCount}"][data-roomid="${data.roomID}"]`).length) {
			if(lastUser === data.user.id && !lastRootElement[0].hasClass("slideOut")) {
				if(localStorage.getItem("setting_chatRemoveMessageDelay") !== "0") {
					const ensureClear = Date.now() + (parseFloat(localStorage.getItem("setting_chatRemoveMessageDelay")) * 1.5 * 1000);
					lastRootElement[0].attr("data-ensureClear", ensureClear);
				}

				return lastRootElement;
			}
		}
	}

	combinedCount++;
	lastUser = data.user.id;

	let rootElement = $(`<div class="chatBlock slideIn" data-rootIdx="${combinedCount}" data-userID="${data.user.id}" data-roomID="${data.roomID}"></div>`);

	if(localStorage.getItem("setting_chatRemoveMessageDelay") !== "0") {
		const ensureClear = Date.now() + (parseFloat(localStorage.getItem("setting_chatRemoveMessageDelay")) * 1.5 * 1000);
		rootElement.attr("data-ensureClear", ensureClear);
	}
	
	const cornerAlignment = localStorage.getItem("setting_chatCornerAlignment").split(",");
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

	let userBlock = data.user.userBlock.render("sourceRoomID" in data ? data.sourceRoomID : broadcasterData.id);

	if(data.sourceRoomID) {
		const sourceUser = await twitchUsers.getUser(data.sourceRoomID);

		if(sourceUser.avatarImage === null && sourceUser.id !== -1) {
			await sourceUser.cacheAvatar();
		}
		
		if(!sourceUser.fetchedCustomSettings) {
			console.log("waiting for custom settings to set on shared user");
			await sourceUser.customSettingsFetchPromise;
		}

		sourceUser.userBlock.initUserSettingsValues();

		console.log(data.sourceRoomID);
		console.log(sourceUser);

		const sourceAvatarContainer = $(`<div class="sharedChatAvatarWrap"></div>`);
		sourceAvatarContainer.attr("source-room-id", data.sourceRoomID);

		const sourceAvatarImageWrap = $(`<span class="sharedChatAvatarImageWrap"></span>`);
		const sourceAvatar = $(`<img class="sharedChatAvatar" src="${sourceUser.avatarImage}"/>`);
		sourceAvatarImageWrap.append(sourceAvatar);

		if(data.sourceRoomID === broadcasterData.id) {
			sourceAvatarContainer.addClass("sharedChatIsInSameRoom");
		}

		sourceAvatarContainer.append(sourceAvatarImageWrap);

		userBlock.prepend(sourceAvatarContainer);
	}

	let colorToUse = `color_${data.user.id}`;
	if(localStorage.getItem("setting_chatDefaultNameColorForced") === "true") {
		colorToUse = `setting_chatDefaultNameColor`;
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
		overallWrapper.css("border-color", `var(--borderColor${data.user.id})`);
	}
	if(localStorage.getItem("setting_chatBackgroundReflectUserColor") === "true") {
		rootCSS().setProperty(`--bgColor${data.user.id}`, interpolateColor(
			localStorage.getItem("setting_chatBackgroundColor"),
			userColorUsed,
			parseFloat(localStorage.getItem(`setting_chatBackgroundUserColorAmount`)
		)));
		overallWrapper.css("background-color", `var(--bgColor${data.user.id})`);
	}
	if(localStorage.getItem("setting_chatMessageBackgroundReflectUserColor") === "true") {
		rootCSS().setProperty(`--messageBackgroundColor${data.user.id}`, interpolateColor(
			localStorage.getItem("setting_chatMessageBackgroundColor"),
			userColorUsed,
			parseFloat(localStorage.getItem(`setting_chatMessageBackgroundUserColorAmount`)
		)));
		messageWrapper.css("background-color", `var(--messageBackgroundColor${user.id})`);
	}
	if(localStorage.getItem("setting_chatMessageOutlinesReflectUserColor") === "true") {
		rootCSS().setProperty(`--messageOutlineColor${data.user.id}`, interpolateColor(
			localStorage.getItem("setting_chatMessageOutlinesColor"),
			userColorUsed,
			parseFloat(localStorage.getItem(`setting_chatMessageOutlinesUserColorAmount`)
		)));
		messageWrapper.css("border-color", `var(--messageOutlineColor${data.user.id})`);
	}

	const avatarBGBlock = renderAvatarBGBlock(data, rootElement);

	overallWrapper.append(userBlock);
	overallWrapper.append(avatarBGBlock);
	overallWrapper.append(messageWrapper);

	lastRootElement = [rootElement, overallWrapper, messageWrapper];

	if(deleteMessages.indexOf(data.uuid) === -1) {
		$("#wrapper").append(rootElement);
		return [rootElement, overallWrapper, messageWrapper];
	} else {
		console.log("message was deleted, not returning a DOM element");
		return false;
	}
}

function initMessageBlockCustomizations(data, elements) {
	const messageBlock = elements.messageBlock;
	const customSettings = data.user.entitlements.overlay.customSettings;
	if(data.isOverlayMessage) {
		return;
	}

	let customizationOK = (localStorage.getItem("setting_allowUserCustomizations") === "true" && localStorage.getItem("setting_allowSampleMessages") === "false");
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
		messageBlock.css("color", `var(--chatMessageColor${data.user.id})`);
	}

	if(customizationOK && customSettings && localStorage.getItem("setting_allowUserCustomMessageFonts") === "true") {
		if(!customSettings.useDefaultMessageSettings) {
			messageBlock.css("font-family", `var(--msgFont${data.user.id})`);
			messageBlock.css("font-size", `var(--msgSize${data.user.id})`);
			messageBlock.css("letter-spacing", `var(--msgSpacing${data.user.id})`);
			messageBlock.css("font-weight", `var(--msgWeight${data.user.id})`);

			messageBlock.css("-webkit-text-stroke", `var(--msgExtraWeight${data.user.id}) transparent`);
			messageBlock.css("line-height", `var(--msgLineHeight${data.user.id})`);
			messageBlock.css("font-variant", `var(--msgVariant${data.user.id})`);
			messageBlock.css("font-style", `var(--msgStyle${data.user.id})`);
		}
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

function allowedToUseTwitchEmote(name, emoteList) {
	if(!(name in twitchEmotes)) {
		return false; // shouldn't happen
	}

	for(const emoteID in emoteList) {
		if(emoteID in twitchEmotes.emoteByIDs) {
			return true;
		}
	}

	return false;
}

async function renderMessageBlock(data, rootElement, isReply) {
	let messageBlock = $('<div class="message"></div>');

	if(isReply) {
		// twitch doesn't send data on emotes in reply parents, so we gotta clone stuff, honestly probably more efficient to do it anyways
		const wantedMessage = $(`.effectWrapper[data-msguuid="${data.reply.uuid}"]`);
		if(wantedMessage.length) {
			const replyBlock = $('<div class="replyContainer"></div>');

			const nameBlock = data.reply.user.userBlock.nameBlock.clone(true);
			nameBlock.addClass("replyName");

			const clonedMessage = wantedMessage.eq(0).children(".message").clone(true);
			clonedMessage.addClass("reply");
			clonedMessage.attr("style", "");
			clonedMessage.children(".emoteWrapper").children(".bigEmote").removeClass("bigEmote");
			clonedMessage.children(".emoteWrapper").children(".bigEmoji").removeClass("bigEmoji");
			clonedMessage.removeClass("isBigEmoteMode");
			clonedMessage.children(".timestamp").remove();
			clonedMessage.attr("data-msguuid", data.reply.uuid);
			clonedMessage.attr("data-userid", data.reply.user.id);
			clonedMessage.removeClass("highlighted");
			clonedMessage.removeClass("gigantified");

			clonedMessage.waitForImages({
				finished: function() {
					clonedMessage.children(".emoteWrapper").each(function() {
						const wrapper = $(this);
						wrapper.css("width", "");

						wrapper.children(".emote, .emoji").each(function() {
							if($(this).outerWidth() > wrapper.width()) {
								wrapper.css("width", `${$(this).outerWidth()}px`);
							}
						})
					})
				},
				waitForAll: true
			});

			replyBlock.append($(`<i class="fas ${localStorage.getItem("setting_chatReplyIcon")} replyIcon"></i>`));
			replyBlock.append(nameBlock);
			replyBlock.append(clonedMessage);

			return replyBlock;
		}

		data = $.extend(true, {}, data);

		data.message = data.reply.message;
		data.emotes = null;

		data.user = data.reply.user;
		data.uuid = data.reply.uuid;
	} else {
		initMessageBlockCustomizations(data, {
			rootElement: rootElement,
			messageBlock: messageBlock
		});
	}

	const originalMessageRaw = data.message.trim().normalize();
	let originalMessage = Array.from(data.message.trim().normalize());
	// lord
	const fixedMessageForEmoteParsing = originalMessageRaw.replace(emoteParsingTest, "_");

	let hasBigEmotes = false;
	let useLQImages = (localStorage.getItem("setting_useLowQualityImages") === "true");

	if(localStorage.getItem("setting_enableEmotes") === "true" && !data.isOverlayMessage) {
		let checkExternalEmotes = Array.from(data.message.trim().normalize());

		if(data.emotes) {
			for(const emoteID in data.emotes) {
				const spots = data.emotes[emoteID][0].split("-");
				const startAt = parseInt(spots[0]);
				const stopAt = parseInt(spots[1]);

				const emoteName = fixedMessageForEmoteParsing.substr(startAt, stopAt - startAt + 1);

				if(!(emoteName in twitchEmotes)) {
					twitchEmotes.addEmote(new Emote({
						service: "twitch",
						animated: false,
						urls: {
							high: `https://static-cdn.jtvnw.net/emoticons/v2/${emoteID}/default/dark/3.0`,
							low: `https://static-cdn.jtvnw.net/emoticons/v2/${emoteID}/default/dark/1.0`
						},
						emoteID: emoteID,
						emoteName: emoteName,
						isZeroWidth: false,
						global: (isNaN(parseInt(emoteID)) === false)
					}));
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

			const isTwitchEmote = (word in twitchEmotes);
			let isTwitchEmoteAllowed = false;
			if(isTwitchEmote) {
				isTwitchEmoteAllowed = allowedToUseTwitchEmote(word, data.emotes);
			}

			if(word.length > 0) {
				if(!(word in chatEmotes || (isTwitchEmote && isTwitchEmoteAllowed))) {
					eprww.push(eprw[wordIdx]);
				} else {
					if(word in chatEmotes) {
						if(!chatEmotes[word].enabled || isEmoteIgnored(word)) {
							eprww.push(eprw[wordIdx]);
						}
					} else {
						if(isTwitchEmote && isTwitchEmoteAllowed) {
							if(isEmoteIgnored(word)) {
								eprww.push(eprw[wordIdx]);
							}
						}
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
		let skippedMentionInReply = false;
		let lastEmoteWasZeroWidth = false;
		let currentEmoteWrapper = $('<span class="emoteWrapper"></span>');
		let wordsFinal = [];

		const pushEmoteWrapper = function() {
			const count = currentEmoteWrapper.children().length;
			if(count) {
				if(count > 1) {
					currentEmoteWrapper.addClass("hasMultipleEmotes");
				}
				wordsFinal.push(currentEmoteWrapper[0].outerHTML);
			}

			currentEmoteWrapper = $('<span class="emoteWrapper"></span>');
		}

		for(let wordIdx in words) {
			let word = words[wordIdx].trim();

			if(word[0] === "@" && word !== "@") {
				if(data.reply && !skippedMentionInReply && !isReply) {
					skippedMentionInReply = true;
					words[wordIdx] = "";
					eprww[0] = "";
					continue;
				}

				let wordElement = $(`<strong>${word}</strong>`);
				let target = word.substr(1);

				if(target in twitchUsers.usernames && !isReply) {
					const targetUser = twitchUsers.usernames[target];

					if(localStorage.getItem("setting_chatMessageMentionsReflectTargetColor") === "true") {
						let col = `var(--nameColor${targetUser.id})`;

						if(localStorage.getItem("setting_chatMessageMentionsReflectTargetColorFade") === "true") {
							col = localStorage.getItem(`color_${targetUser.id}`);
							if(col === "var(--defaultNameColor)") {
								col = localStorage.getItem("setting_chatDefaultNameColor");
							}
							col = interpolateColor(col, localStorage.getItem("setting_chatMessageMentionsReflectTargetColorFadeColor"), parseFloat(localStorage.getItem("setting_chatMessageMentionsReflectTargetColorFadeAmount")));
						}

						wordElement.attr("data-ignoreStyle", "true");
						wordElement.css("background-color", col);
					}

					if(
						localStorage.getItem("setting_chatMessageMentionsReflectTargetFont") === "true" &&
						localStorage.getItem("setting_allowUserCustomizations") === "true" &&
						localStorage.getItem("setting_allowUserCustomNameFonts") === "true"
					) {
						const customSettings = targetUser.entitlements.overlay.customSettings;

						if(customSettings) {
							if("nameFont" in customSettings) {
								if(!customSettings.useDefaultNameSettings) {
									wordElement.attr("data-ignoreStyle", "true");

									wordElement.css("font-family", `var(--nameFont${targetUser.id})`);
									wordElement.css("font-weight", `var(--nameWeight${targetUser.id})`);
									wordElement.css("letter-spacing", `var(--nameMentionSpacing${targetUser.id})`);
									wordElement.css("text-transform", `var(--nameTransform${targetUser.id})`);
									wordElement.css("font-variant", `var(--nameVariant${targetUser.id})`);
									wordElement.css("-webkit-text-stroke", `var(--nameMentionExtraWeight${targetUser.id}) transparent`);
								}
							}
						}
					}
				}

				if(currentEmoteWrapper.children().length) {
					pushEmoteWrapper();
				}

				wordsFinal.push(wordElement[0].outerHTML);
				continue;
			}

			if(localStorage.getItem("setting_emotesParseToImage") === "true") {
				if(twemoji.test(word)) {
					if(!lastEmoteWasZeroWidth) {
						pushEmoteWrapper();
					}

					currentEmoteWrapper.append(twemoji.parse(word, {
						folder: 'twemoji/svg',
						ext: '.svg'
					}));

					lastEmoteWasZeroWidth = false;
					continue;
				}
			}
			
			if(word in chatEmotes) {
				let externalEmote = chatEmotes[word];

				if(!externalEmote.enabled || isEmoteIgnored(word)) {
					pushEmoteWrapper();
					wordsFinal.push(word);
					continue;
				} else {
					let classes = ["emote"];
					if(externalEmote.isZeroWidth) {
						lastEmoteWasZeroWidth = true;
						classes.push("zeroWidthEmote");
					} else {
						lastEmoteWasZeroWidth = false;
						pushEmoteWrapper();
					}

					emoteObject = await externalEmote.url;
					let emoteElement = $(`<span class="${classes.join(" ")}" style="background-image: url('${emoteObject}');"><img src="${emoteObject}"/></span>`);

					if("modifiers" in externalEmote) {
						if(externalEmote.modifiers.indexOf("Hidden") !== -1) {
							currentEmoteWrapper.addClass("mod_Hidden");
						}
					}

					currentEmoteWrapper.append(emoteElement);
				}
			}

			if(word in twitchEmotes && allowedToUseTwitchEmote(word, data.emotes)) {
				let twtEmote = twitchEmotes[word];

				if(isEmoteIgnored(word)) {
					pushEmoteWrapper();
					wordsFinal.push(word);
					continue;
				} else {
					lastEmoteWasZeroWidth = false;
					pushEmoteWrapper();

					let classes = ["emote"];

					emoteObject = await twtEmote.url;
					let emoteElement = $(`<span class="${classes.join(" ")}" style="background-image: url('${emoteObject}');"><img src="${emoteObject}"/></span>`);

					currentEmoteWrapper.append(emoteElement);
				}
			} else {
				if(!(word in chatEmotes)) {
					pushEmoteWrapper();
					if(!data.parseCheermotes) {
						wordsFinal.push(word);
					}
				}
			}

			if(data.parseCheermotes && localStorage.getItem("setting_chatShowCheermotes") === "true" && !isReply) {
				messageBlock.addClass("highlighted");

				let wasCheermote = false;
				lastEmoteWasZeroWidth = false;

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

						let cheermoteColorString = (localStorage.getItem("setting_chatShowCheermotesColor") === "true" ? ` style="background-color: ${mote.color};"` : "");
						wordsFinal.push(`<span class="cheerWrap"><span class="emoteWrapper"><span class="emote cheermote" style="background-image: url('${mote.images[type]}');"><img src="${mote.images[type]}"/></span></span><span${cheermoteColorString} class="cheerAmount">${amount}</span></span>`);
						wasCheermote = true;
						break;
					}
				}

				// checks are here too as they were pushing the text forms
				if(!wasCheermote && !(word in chatEmotes) && !(word in twitchEmotes && allowedToUseTwitchEmote(word, data.emotes))) {
					wordsFinal.push(word);
				}
			}
		}

		if(currentEmoteWrapper.children().length) {
			pushEmoteWrapper();
		}

		//console.log(` 9: ${words}`);

		words = wordsFinal.map(function(word) {
			if(!isWordSafe(word)) {
				return "[REDACTED]";
			}
			return word;
		});

		// what i'm doing here to fix in-line seamless emotes is stupid but it works yay
		messageBlock.html(words.join(" ").replaceAll("</span> <span", "</span><span"));

		if(data.type === "action" && !isReply) {
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

		hasBigEmotes = (eprww.join("") === "" && localStorage.getItem("setting_chatShowBigEmotes") === "true" && !isReply);
		if(hasBigEmotes) {
			messageBlock.addClass("isBigEmoteMode");

			const emoteWrappers = messageBlock.children(".emoteWrapper");

			emoteWrappers.children(".emote").addClass("bigEmote");
			emoteWrappers.children(".emoji").addClass("bigEmoji");

			let count = 0;
			const maxCount = parseInt(localStorage.getItem("setting_chatMaxBigEmotes"));

			emoteWrappers.each(function() {
				if(count >= maxCount) {
					$(this).remove();
				}
				count++;
			});
		}

		let lastValidEmote = null;
		messageBlock.children(".emoteWrapper").each(function(emoteIdx) {
			const emoteWrap = $(this);
			const emoteMods = (emoteWrap.attr("data-emotemods") ? emoteWrap.attr("data-emotemods").split(" ") : []);

			if(emoteMods.indexOf("Hidden") !== -1) {
				emoteWrap.addClass("mod_Hidden");
			}
		});
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

	messageBlock.waitForImages({
		finished: function() {
			messageBlock.children(".emoteWrapper").each(function() {
				const wrapper = $(this);
				wrapper.css("width", "");

				wrapper.children(".emote, .emoji").each(function() {
					if($(this).outerWidth() > wrapper.width()) {
						wrapper.css("width", `${$(this).outerWidth()}px`);
					}
				})
			})
		},
		waitForAll: true
	});

	if(isReply) {
		const replyBlock = $('<div class="replyContainer"></div>');

		const nameBlock = data.user.userBlock.nameBlock.clone(true);
		nameBlock.addClass("replyName");

		messageBlock.addClass("reply");

		replyBlock.append($(`<i class="fas ${localStorage.getItem("setting_chatReplyIcon")} replyIcon"></i>`));
		replyBlock.append(nameBlock);
		replyBlock.append(messageBlock);

		return replyBlock;
	} else {
		return messageBlock;
	}
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
			continueOn = await wantedCommand(data, wantedArgs);
		}

		if(!continueOn && localStorage.getItem("setting_chatHideCommands") === "true") {
			return;
		}
	}

	messageCount++;
	let rootParts = await getRootElement(data);
	if(!rootParts) {
		return;
	}
	let rootElement = rootParts[0];
	let overallWrapper = rootParts[1];
	let messageWrapper = rootParts[2];

	let wrapperElement = $(`<div class="effectWrapper" data-msgUUID="${data.uuid}"></div>`);
	wrapperElement.attr("data-rootidx", rootElement.attr("data-rootidx"));

	if(localStorage.getItem("setting_chatAnimationsIn") === "true" && messageWrapper.children(".effectWrapper").length) {
		wrapperElement.addClass("slideIn");
	}

	let eventTagBlock = renderEventTagBlock(data, wrapperElement);

	if(data.reply) {
		let replyBlock = await renderMessageBlock(data, rootElement, true);
		if(!replyBlock.find(".message").length) {
			console.log("couldn't find message being replied to?");
			delete data.reply.uuid;
			replyBlock = await renderMessageBlock(data, rootElement, true);
		}

		wrapperElement.append(replyBlock);
	}

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

	if(data.gigantified && localStorage.getItem("setting_enableGigantifiedMessageEffect") === "true") {
		messageBlock.addClass("gigantified");
	}

	setHistoryOpacity();

	if(localStorage.getItem("setting_chatMessageReflectUserColor") === "true" && !data.isOverlayMessage) {
		messageBlock.find('strong[data-ignoreStyle!="true"]').css("background-color", `var(--chatMessageColor${data.user.id})`);
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
				rootElement.removeClass("slideIn");
				rootElement.addClass("slideOut");
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

	if(parseInt(data.user.id) > 0) {
		$("#messageCloneContainer").append(wrapperElement.clone(true).removeClass("slideIn"));

		while($("#messageCloneContainer").children().length > 250) {
			$("#messageCloneContainer").children().eq(0).remove();
		}
	}
}