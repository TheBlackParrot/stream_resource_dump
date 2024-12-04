$.ajaxSetup({ timeout: parseInt(localStorage.getItem("setting_ajaxTimeout")) * 1000 || 7000 });
caches.delete("avatarCache"); // old

var allowedToProceed = true;

const twitchClientId = localStorage.getItem(`setting_twitchClientID`);
const twitchClientSecret = localStorage.getItem(`setting_twitchClientSecret`);
const broadcasterName = localStorage.getItem(`setting_twitchChannel`);

if(!broadcasterName || broadcasterName === "null") {
	allowedToProceed = false;
	console.log("No channel is set");
}

if(twitchClientId === "null" || twitchClientSecret === "null" || !twitchClientId || !twitchClientSecret) {
	allowedToProceed = false;
	console.log(`cached ID: ${twitchClientId}, cached secret: ${twitchClientSecret}`);
}

var fonts;
$.get("../shared/assets/fonts/fonts.json", function(data) {
	fonts = data;
});

var broadcasterData = {};
var sharedChatData = {};
var channelData = {};
var streamData = {"started_at": new Date().toISOString()};
var twitchBadges = {};
var cheermotes = {};
var twitchHelixReachable = false;

var chatEmotes;

var channelPointRedeems = {};

function setTwitchHelixReachable(state) {
	twitchHelixReachable = state;
	postToSettingsChannel("TwitchHelixStatus", state);
}

var notActuallyCustomBadges = [];
async function getChannelChatBadges(broadcasterID) {
	console.log(`getting channel chat badges for ${broadcasterID}...`);
	const channelBadgeResponse = await callTwitchAsync({
		"endpoint": "chat/badges",
		"args": {
			"broadcaster_id": broadcasterID
		}		
	});
	console.log(channelBadgeResponse);
	
	// make default copies Just In Case:tm:, we'll overwrite these if need be
	if(!(`bits${broadcasterID}` in twitchBadges)) {
		twitchBadges[`bits${broadcasterID}`] = structuredClone(twitchBadges["bits"]);
		twitchBadges[`bits${broadcasterID}`].set_id = `bits${broadcasterID}`;
		twitchBadges[`bits${broadcasterID}`].is_default = true;

		twitchBadges[`subscriber${broadcasterID}`] = structuredClone(twitchBadges["subscriber"]);
		twitchBadges[`subscriber${broadcasterID}`].set_id = `subscriber${broadcasterID}`;
		twitchBadges[`subscriber${broadcasterID}`].is_default = true;
	}

	for(const badgeSet of channelBadgeResponse.data) {
		if(localStorage.getItem(`setting_enableCustomBadges_${badgeSet.set_id}`) === "true") {
			const oldBadgeSetID = badgeSet.set_id.substr(0);
			const newBadgeSetID = `${oldBadgeSetID}${broadcasterID}`

			if(oldBadgeSetID === "bits") {
				for(const version of badgeSet.versions) {
					if(notActuallyCustomBadges.indexOf(version.image_url_1x) === -1) {
						twitchBadgeTypes[oldBadgeSetID].is_solid = false;
						twitchBadges[newBadgeSetID] = badgeSet;
						twitchBadges[newBadgeSetID].set_id = newBadgeSetID;
						break;
					}
				}
			} else {
				twitchBadges[newBadgeSetID] = badgeSet;
				twitchBadges[newBadgeSetID].set_id = newBadgeSetID;
				twitchBadgeTypes[oldBadgeSetID].is_solid = false;
			}
		}
	}
	console.log(`got channel chat badges for ${broadcasterID}`);
}

async function getStuffReady() {
	console.log(`getting broadcaster information for ${broadcasterName}...`);
	const rawUserResponse = await callTwitchAsync({
		"endpoint": "users",
		"args": {
			"login": broadcasterName
		}
	});
	console.log(rawUserResponse);
	broadcasterData = rawUserResponse.data[0];
	console.log(`got broadcaster information for ${broadcasterData.display_name} (${broadcasterData.id})`);

	console.log("getting global chat badges...");
	refreshExternalStuff();
	const badgeResponse = await callTwitchAsync({
		"endpoint": "chat/badges/global"
	});
	for(const badgeSet of badgeResponse.data) {
		twitchBadges[badgeSet.set_id] = badgeSet;

		// yeah i uh, don't know either
		if(badgeSet.set_id === "bits") {
			for(const version of badgeSet.versions) {
				notActuallyCustomBadges.push(version.image_url_1x);
			}
		}
	}
	console.log("got global chat badges");

	await getChannelChatBadges(broadcasterData.id);

	console.log("getting cheermotes...");
	const cheermoteResponse = await callTwitchAsync({
		"endpoint": "bits/cheermotes",
		"args": {
			"broadcaster_id": broadcasterData.id
		}		
	});
	for(let mote of cheermoteResponse.data) {
		mote.prefix = mote.prefix.toLowerCase();
		
		cheermotes[mote.prefix] = {};

		for(let tier of mote.tiers) {
			let animHighestRes = 0;
			let animHighestResImage = null;
			let staticHighestRes = 0;
			let staticHighestResImage = null;

			for(let k in tier.images.dark.animated) {
				let image = tier.images.dark.animated[k];
				if(k > animHighestRes) {
					animHighestRes = k;
					animHighestResImage = image;
				}
			}

			for(let k in tier.images.dark.static) {
				let image = tier.images.dark.static[k];
				if(k > staticHighestRes) {
					staticHighestRes = k;
					staticHighestResImage = image;
				}
			}

			cheermotes[mote.prefix][tier.min_bits] = {
				color: tier.color,
				images: {
					animated: animHighestResImage,
					static: staticHighestResImage,
				}
			};
		}
	}
	console.log("got cheermotes");

	console.log("getting channel information...");
	const channelResponse = await callTwitchAsync({
		"endpoint": "channels",
		"args": {
			"broadcaster_id": broadcasterData.id
		}
	});
	channelData = channelResponse.data[0];
	systemMessage(`Showing chat for **#${broadcasterData.login}**${broadcasterData.login === broadcasterName.display_name ? "" : ` *(a.k.a. ${broadcasterData.display_name})*`}`);
	console.log("got channel information");

	console.log("getting channel point redeems...");

	const redeemResponse = await callTwitchAsync({
		endpoint: "channel_points/custom_rewards",
		oauth: true,
		args: {
			broadcaster_id: broadcasterData.id
		}
	});
	if("data" in redeemResponse) {
		console.log(redeemResponse.data);

		if(redeemResponse.data.length) {
			for(const redeemData of redeemResponse.data) {
				channelPointRedeems[redeemData.id] = {
					color: redeemData.background_color,
					cost: parseInt(redeemData.cost),
					image: (redeemData.image === null ? redeemData.default_image : redeemData.image),
					enabled: redeemData.is_enabled,
					name: redeemData.title
				};
			}
		}

		console.log("got channel point redeems");
		systemMessage(`Found ${Object.keys(channelPointRedeems).length} channel point redeems`);
	}

	getTwitchStreamData();
}

var streamDataTimeout;
async function getTwitchStreamData() {
	clearTimeout(streamDataTimeout);

	console.log("getting stream information...");
	const streamResponse = await callTwitchAsync({
		"endpoint": "streams",
		"args": {
			"user_id": broadcasterData.id
		}
	});

	console.log(streamResponse);
	if(streamResponse.data.length) {
		streamData = streamResponse.data[0];
		streamData.lastUpdate = Date.now();
	} else {
		console.log("stream is not live, checking again in 30 seconds");
		streamDataTimeout = setTimeout(getTwitchStreamData, 30000);
	}
	console.log("got stream information");
}

async function getGlobalChannelEmotes(broadcasterData) {
	if(!allowedToProceed) {
		console.log("No Client ID or Secret is set.");
		return;
	}

	if(localStorage.getItem("setting_enable7TV") === "true") {
		console.log("getting 7tv global emotes...");

		const response = await fetch("https://7tv.io/v3/emote-sets/global");
		if(response.ok) {
			const data = await response.json();
			console.log("got 7tv global emotes");
			systemMessage("*Fetched global 7TV emotes*");
			console.log(data);

			if(!("emotes" in data)) {
				systemMessage("*Unable to fetch global 7TV emotes - this specific error is 7TV's fault as they didn't actually give us any emotes to parse*");
			} else {
				for(const emote of data.emotes) {
					const emoteData = emote.data;
					const urls = emoteData.host.files;

					chatEmotes.addEmote(new Emote({
						service: "7tv",
						setID: data.id,
						urls: {
							high: `https:${emoteData.host.url}/${urls[urls.length-1].name}`,
							low: `https:${emoteData.host.url}/${urls[0].name}`
						},
						emoteID: emoteData.id,
						emoteName: emote.name || emoteData.name,
						isZeroWidth: ((emoteData.flags & 256) === 256),
						global: true
					}));
				}
			}
		}
	} else {
		console.log("skipping 7tv global emotes, not enabled");
	}

	if(localStorage.getItem("setting_enableBTTV") === "true") {
		console.log("getting bttv global emotes...");

		const response = await fetch("https://api.betterttv.net/3/cached/emotes/global");
		if(response.ok) {
			const data = await response.json();
			console.log("got bttv emotes");
			systemMessage("*Fetched global BetterTTV emotes*");
			console.log(data);

			for(const emote of data) {
				let modifiers = [];
				if(emote.code === "v!") { modifiers = ["Hidden", "FlipV"]; }
				if(emote.code === "h!") { modifiers = ["Hidden", "FlipH"]; }

				chatEmotes.addEmote(new Emote({
					service: "bttv",
					setID: "bttv-global",
					urls: {
						high: `https://cdn.betterttv.net/emote/${emote.id}/3x.###`,
						low: `https://cdn.betterttv.net/emote/${emote.id}/1x.###`
					},
					emoteID: emote.id,
					emoteName: emote.code,
					modifiers: modifiers,
					global: true
				}));
			}
		}
	} else {
		console.log("skipping bttv global emotes, not enabled");
	}

	if(localStorage.getItem("setting_enableFFZ") === "true") {
		console.log("getting ffz global emotes...");

		const response = await fetch("https://api.frankerfacez.com/v1/set/global");
		if(response.ok) {
			const data = await response.json();
			console.log("got ffz emotes");
			systemMessage("*Fetched global FrankerFaceZ emotes*");

			console.log(data);

			for(const setIdx of data.default_sets) {
				const emotes = data.sets[setIdx].emoticons;
				for(const emote of emotes) {
					chatEmotes.addEmote(new Emote({
						service: "ffz",
						setID: setIdx,
						urls: {
							high: (emote.urls[4] || emote.urls[1]),
							low: emote.urls[1]
						},
						emoteID: emote.id,
						emoteName: emote.name,
						modifiers: (emote.modifier ? parseFFZModifiers(emote.modifier_flags) : []),
						global: true
					}));
				}
			}
		}
	} else {
		console.log("skipping ffz global emotes, not enabled");
	}

	getExternalChannelEmotes(broadcasterData);
}

var sevenTVEmoteSetIDs = {};
var allowedSevenTVEmoteSets = [];
async function getExternalChannelEmotes(streamerData, isShared) {
	if(!allowedToProceed) {
		console.log("No Client ID or Secret is set.");
		return;
	}

	const useLQImages = (localStorage.getItem("setting_useLowQualityImages") === "true");

	if(localStorage.getItem("setting_enableBTTV") === "true") {
		console.log("getting bttv channel emotes...");

		const response = await fetch(`https://api.betterttv.net/3/cached/users/twitch/${streamerData.id}?sigh=${Date.now()}`);
		if(response.ok) {
			const data = await response.json();
			console.log("got bttv emotes");
			console.log(data);
			systemMessage(`*Fetched ${(isShared ? streamerData.display_name : "channel")}'s BetterTTV emotes*`);

			// so BTTV provides a set id, but doesn't use it. ok :thumbsup:
			let addEmoteFunction = function(emote) {
				chatEmotes.addEmote(new Emote({
					service: "bttv",
					setID: `twitch:${broadcasterData.id}`,
					animated: emote.animated,
					urls: {
						high: `https://cdn.betterttv.net/emote/${emote.id}/3x.###`,
						low: `https://cdn.betterttv.net/emote/${emote.id}/1x.###`
					},
					emoteID: emote.id,
					emoteName: emote.code,
					modifiers: (emote.modifier ? ["Hidden"] : []),
					global: false
				}));				
			}

			for(const emote of data.sharedEmotes) { addEmoteFunction(emote); }
			for(const emote of data.channelEmotes) { addEmoteFunction(emote); }
		} else {
			console.log("could not fetch bttv channel emotes");
			systemMessage(`*Unable to fetch ${(isShared ? streamerData.display_name : "channel")}'s BetterTTV emotes*`);
		}
	} else {
		console.log("skipping bttv channel emotes, not enabled");
	}

	if(localStorage.getItem("setting_enableFFZ") === "true") {
		console.log("getting ffz channel emotes...");

		const response = await fetch(`https://api.frankerfacez.com/v1/room/id/${streamerData.id}?sigh=${Date.now()}`);
		if(response.ok) {
			const data = await response.json();
			console.log("got ffz emotes");
			console.log(data);
			systemMessage(`*Fetched ${(isShared ? streamerData.display_name : "channel")}'s FrankerFaceZ emotes*`);

			for(let setIdx in data.sets) {
				const emotes = data.sets[setIdx].emoticons;
				for(const emote of emotes) {
					chatEmotes.addEmote(new Emote({
						service: "ffz",
						setID: setIdx,
						animated: ("animated" in emote),
						urls: {
							high: ("animated" in emote ? (emote.animated[4] || emote.animated[1]) : (emote.urls[4] || emote.urls[1])),
							low: ("animated" in emote ? emote.animated[1] : emote.urls[1])
						},
						emoteID: emote.id,
						emoteName: emote.name,
						modifiers: (emote.modifier ? parseFFZModifiers(emote.modifier_flags) : []),
						global: false
					}));
				}
			}
		} else {
			console.log("could not fetch ffz channel emotes");
			systemMessage(`*Unable to fetch ${(isShared ? streamerData.display_name : "channel")}'s FrankerFaceZ emotes*`);
		}
	} else {
		console.log("skipping ffz channel emotes, not enabled");
	}

	// moved to the bottom, service is slowest
	if(localStorage.getItem("setting_enable7TV") === "true") {
		console.log("getting 7tv channel emotes...");

		const response = await fetch(`https://7tv.io/v3/users/twitch/${streamerData.id}?sigh=${Date.now()}`);
		if(response.ok) {
			const data = await response.json();
			console.log("got 7tv emotes");
			systemMessage(`*Fetched ${(isShared ? streamerData.display_name : "channel")}'s 7TV emotes*`);
			console.log(data);

			let isOK = true; // god i hate 7tv

			if(data.emote_set === null) {
				systemMessage(`*Unable to fetch ${(isShared ? streamerData.display_name : "channel")}'s 7TV emotes, active emote set is... empty?*`);
				isOK = false;
			}

			if(isOK) {
				// for fucks sake
				if(!("emotes" in data.emote_set)) {
					systemMessage(`*Unable to fetch ${(isShared ? streamerData.display_name : "channel")}'s 7TV emotes, emotes aren't in the emote set (this is 7TV's fault)*`);
					isOK = false;
				}
			}

			if(isOK) {
				allowedSevenTVEmoteSets.push(data.emote_set.id);
				sevenTVEmoteSetIDs[streamerData.id] = data.emote_set.id;
				subscribe7TV("emote_set.*", streamerData.id, sevenTVEmoteSetIDs[streamerData.id]);

				for(const emote of data.emote_set.emotes) {
					const emoteData = emote.data;
					const urls = emoteData.host.files;

					// 7TV seems to provide all formats at all sizes, so i'm hardcoding 4x/1x and determining file format on the fly now
					chatEmotes.addEmote(new Emote({
						service: "7tv",
						setID: data.emote_set.id,
						animated: emoteData.animated,
						urls: {
							high: `https:${emoteData.host.url}/4x.###`,
							low: `https:${emoteData.host.url}/1x.###`
						},
						emoteID: emoteData.id,
						emoteName: emote.name || emoteData.name,
						isZeroWidth: ((emoteData.flags & 256) === 256),
						global: false
					}));
				}
			}
		} else {
			console.log("could not fetch 7tv channel emotes");
			systemMessage(`*Unable to fetch ${(isShared ? streamerData.display_name : "channel")}'s 7TV emotes*`);
		}
	} else {
		console.log("skipping 7tv channel emotes, not enabled");
	}
}

function getBadgeData(badgeType, badgeID) {
	if(!allowedToProceed) {
		console.log("No Client ID or Secret is set.");
		return;
	}

	for(const setName in twitchBadges) {
		let setData = twitchBadges[setName];

		if(setData.set_id === badgeType) {
			for(let badgeIdx in setData.versions) {
				let badgeData = setData.versions[badgeIdx];
				if(badgeData.id === badgeID) {
					return setData.versions[badgeIdx];
				}
			}
		}
	}
}

async function checkForUpdate() {
	const response = await fetch(`version.json?sigh=${Date.now()}`);
	if(response.ok) {
		const data = await response.json();

		let v_msg = `*(**local:** r${overlayRevision}, **remote:** r${data.revision})*`;
		if(overlayRevision !== data.revision) {
			systemMessage(`⚠️ The chat overlay may be out of date! Please refresh this browser source's cache in the source properties. ${v_msg}`);
		} else {
			systemMessage(`✅ The chat overlay is up to date! ${v_msg}`);
		}
	}
}

function postToTwitchEventChannel(event, data) {
	let message = {
		event: event
	};
	if(data) {
		message.data = data;
	}

	console.log(message);
	twitchEventChannel.postMessage(message);
}

var deleteMessages = [];
const twitchEventFuncs = {
	message: async function(data) {
		if("source-room-id" in data.tags) {
			const sourceUserID = parseInt(data.tags['source-room-id']);

			if(!(sourceUserID in sharedChatData)) {
				console.log(`getting shared broadcaster information for ID ${sourceUserID}...`);

				const rawUserResponse = await callTwitchAsync({
					"endpoint": "users",
					"args": {
						"id": sourceUserID
					}
				});

				console.log(rawUserResponse);
				sharedChatData[sourceUserID] = rawUserResponse.data[0];

				console.log(`got broadcaster information for ${sharedChatData[sourceUserID].display_name} (${sharedChatData[sourceUserID].id})`);

				if(data.tags['source-room-id'] !== broadcasterData.id) {
					await getChannelChatBadges(sourceUserID);
					
					if(localStorage.getItem("setting_sharedChatMergeExternalEmotes") === "true") {
						await getExternalChannelEmotes(sharedChatData[sourceUserID], true);
					}
				}
			}

			if(bttvWS) {
				try {
					if(localStorage.getItem("setting_enableBTTV") === "true" && bttvWS.attemptedJoins.indexOf(sourceUserID) === -1) {
						console.log(`trying to join BTTV channel for ${sharedChatData[sourceUserID].display_name}`);
						bttvWS.attemptedJoins.push(sourceUserID);

						let msg = {
							name: "join_channel",
							data: {
								name: `twitch:${sourceUserID}`
							}
						}

						bttvWS.send(JSON.stringify(msg));
					}
				} catch {
					// do nothing
				}
			}

			if(sevenTVWS) {
				if(localStorage.getItem("setting_enable7TV") === "true" && sevenTVWS.attemptedJoins.indexOf(data.tags['source-room-id']) === -1) {
					console.log(`trying to sub to 7TV entitlements in ${sharedChatData[sourceUserID].display_name}`);
					sevenTVWS.attemptedJoins.push(data.tags['source-room-id']);

					subscribe7TV("cosmetic.*", data.tags['source-room-id']);
					subscribe7TV("entitlement.*", data.tags['source-room-id']);
				}
			}
		}
		
		await prepareMessage(data.tags, data.message, data.self, false);
	},

	cheer: async function(data) {
		await prepareMessage(data.tags, data.message, false, true);
	},

	subscription: async function(data) {
		await prepareMessage(data.tags, data.message, false, true);
		const user = await twitchUsers.getUser(data.tags['user-id']);
		
		if(user) {
			user.userBlock.updateAvatarBlock();
		}
	},

	resub: async function(data) {
		await prepareMessage(data.tags, data.message, false, true);
	},

	ban: function(data) {
		let id = data.tags['target-user-id'];
		$(`.chatBlock[data-userid="${id}"]`).remove();

		$(`.reply[data-userid="${id}"]`).each(function() {
			$(this).text("[message deleted]");
			$(this).addClass("messageDeleted");
		});
		
		setHistoryOpacity();
	},

	messagedeleted: function(data) {
		let id = data.tags['target-msg-id'];
		deleteMessages.push(id);

		$(`.effectWrapper[data-msguuid="${id}"]`).each(function() {
			const elem = $(this);

			if(elem.parent().children(".effectWrapper").length === 1) {
				$(`.chatBlock[data-rootidx="${elem.attr("data-rootidx")}"]`).remove();
			} else {
				elem.remove();
			}
		});

		$(`.reply[data-msguuid="${id}"]`).each(function() {
			$(this).text("[message deleted]");
			$(this).addClass("messageDeleted");
		});
		
		setHistoryOpacity();
	},

	timeout: function(data) {
		let id = data.tags["target-user-id"];
		$(`.chatBlock[data-userid="${id}"]`).remove();

		$(`.reply[data-userid="${id}"]`).each(function() {
			$(this).text("[message deleted]");
			$(this).addClass("messageDeleted");
		});

		setHistoryOpacity();
	},

	clearchat: function(data) {
		$("#wrapper").empty();
		$("#messageCloneContainer").empty();
		lastUser = "-1";
	},

	announcement: async function(data) {
		await prepareMessage(data.tags, data.message, false, true);
	},

	viewermilestone: async function(data) {
		await prepareMessage(data.tags, data.message, false, true);
	},

	AccessTokenRefreshed: function(data) {
		lastAsk = Infinity;
		systemMessage("Twitch authentication token refreshed!");
	}
}

const twitchEventChannel = new BroadcastChannel("twitch_chat");

twitchEventChannel.onmessage = function(message) {
	console.log(message);
	message = message.data;

	if(message.event in twitchEventFuncs) {
		if("data" in message) {
			twitchEventFuncs[message.event](message.data);
		} else {
			twitchEventFuncs[message.event]();
		}
	}
};

$("body").on("animationend", ".userInfoIn", function() {
	console.log("removed userInfoIn class");
	$(this).removeClass("userInfoIn");
})