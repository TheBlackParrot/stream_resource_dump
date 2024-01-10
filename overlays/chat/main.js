$.ajaxSetup({ timeout: parseInt(localStorage.getItem("setting_ajaxTimeout")) * 1000 || 7000 });

var allowedToProceed = true;

const twitchClientId = localStorage.getItem(`setting_twitchClientID`)
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
$.get("fonts.json", function(data) {
	fonts = data;
});

var broadcasterData = {};
var channelData = {};
var streamData = {"started_at": new Date().toISOString()};
var twitchBadges = {};
var cheermotes = {};
var twitchHelixReachable = false;

var chatEmotes;
initEmoteSet();

var channelPointRedeems = {};

function setTwitchHelixReachable(state) {
	twitchHelixReachable = state;
	postToSettingsChannel("TwitchHelixStatus", state);
}

async function getStuffReady() {
	console.log(`getting broadcaster information for ${broadcasterName}...`);
	const rawUserResponse = await callTwitchAsync({
		"endpoint": "users",
		"args": {
			"login": broadcasterName
		}
	});
	broadcasterData = rawUserResponse.data[0];
	console.log(`got broadcaster information for ${broadcasterData.display_name} (${broadcasterData.id})`);

	console.log("getting global chat badges...");
	refreshExternalStuff();
	const badgeResponse = await callTwitchAsync({
		"endpoint": "chat/badges/global"
	});
	for(const badgeSet of badgeResponse.data) {
		twitchBadges[badgeSet.set_id] = badgeSet;
	}
	console.log("got global chat badges");

	console.log("getting channel chat badges...");
	const channelBadgeResponse = await callTwitchAsync({
		"endpoint": "chat/badges",
		"args": {
			"broadcaster_id": broadcasterData.id
		}		
	});
	console.log(channelBadgeResponse);
	for(const badgeSet of channelBadgeResponse.data) {
		if(localStorage.getItem(`setting_enableCustomBadges_${badgeSet.set_id}`) === "true") {
			twitchBadges[badgeSet.set_id] = badgeSet;
			twitchBadgeTypes[badgeSet.set_id].is_solid = false;
		}
	}
	console.log("got channel chat badges");

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
	} else {
		console.log("stream is not live, checking again in 30 seconds");
		streamDataTimeout = setTimeout(getTwitchStreamData, 30000);
	}
	console.log("got stream information");
}

function getGlobalChannelEmotes(broadcasterData) {
	if(!allowedToProceed) {
		console.log("No Client ID or Secret is set.");
		return;
	}

	let count = 0;
	const checkIfDone = function() {
		count++;
		if(count >= 3) {
			getExternalChannelEmotes(broadcasterData);
		}
	}

	if(localStorage.getItem("setting_enable7TV") === "true") {
		console.log("getting 7tv global emotes...");
		$.ajax({
			type: "GET",
			url: `https://7tv.io/v3/emote-sets/global`,

			success: function(data) {
				console.log("got 7tv global emotes");
				systemMessage("*Fetched global 7TV emotes*");
				console.log(data);

				if(!("emotes" in data)) {
					systemMessage("*Unable to fetch global 7TV emotes - this specific error is 7TV's fault as they didn't actually give us any emotes to parse. Great service you got here, guys.*");
					checkIfDone();
					return;
				}

				for(const emote of data.emotes) {
					const emoteData = emote.data;
					const urls = emoteData.host.files;

					chatEmotes.addEmote(new Emote({
						service: "7tv",
						urls: {
							high: `https:${emoteData.host.url}/${urls[urls.length-1].name}`,
							low: `https:${emoteData.host.url}/${urls[0].name}`
						},
						emoteID: emoteData.id,
						emoteName: emote.name || emoteData.name,
						isZeroWidth: (emoteData.flags & 256 === 256),
						global: true
					}));
				}

				checkIfDone();
			},

			error: function(err) {
				systemMessage("*Unable to fetch global 7TV emotes*");
				console.log("Unable to fetch global 7TV emotes!");
				checkIfDone();
			}
		});
	} else {
		console.log("skipping 7tv global emotes, not enabled");
		checkIfDone();
	}

	if(localStorage.getItem("setting_enableBTTV") === "true") {
		console.log("getting bttv global emotes...");
		$.ajax({
			type: "GET",
			url: `https://api.betterttv.net/3/cached/emotes/global`,

			success: function(data) {
				console.log("got bttv emotes");
				systemMessage("*Fetched global BetterTTV emotes*");
				console.log(data);

				for(const emote of data) {
					chatEmotes.addEmote(new Emote({
						service: "bttv",
						urls: {
							high: `https://cdn.betterttv.net/emote/${emote.id}/3x.${emote.imageType}`,
							low: `https://cdn.betterttv.net/emote/${emote.id}/1x.${emote.imageType}`
						},
						emoteID: emote.id,
						emoteName: emote.code,
						modifiers: (emote.modifier ? ["Hidden"] : []),
						global: true
					}));
				}

				checkIfDone();
			},

			error: function(err) {
				console.log("could not fetch global BTTV emotes");
				systemMessage("*Unable to fetch global BetterTTV emotes*");
				checkIfDone();
			}
		});
	} else {
		console.log("skipping bttv global emotes, not enabled");
		checkIfDone();
	}

	if(localStorage.getItem("setting_enableFFZ") === "true") {
		console.log("getting ffz global emotes...");
		$.ajax({
			type: "GET",
			url: `https://api.frankerfacez.com/v1/set/global`,

			success: function(data) {
				console.log("got ffz emotes");
				systemMessage("*Fetched global FrankerFaceZ emotes*");

				console.log(data);

				for(const setIdx of data.default_sets) {
					const emotes = data.sets[setIdx].emoticons;
					for(const emote of emotes) {
						chatEmotes.addEmote(new Emote({
							service: "ffz",
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

				checkIfDone();
			},

			error: function(err) {
				console.log("could not fetch ffz global emotes");
				systemMessage("*Unable to fetch global FrankerFaceZ emotes*");
				checkIfDone();
			}
		});
	} else {
		console.log("skipping ffz global emotes, not enabled");
		checkIfDone();		
	}
}

function getExternalChannelEmotes(broadcasterData) {
	if(!allowedToProceed) {
		console.log("No Client ID or Secret is set.");
		return;
	}

	let useLQImages = (localStorage.getItem("setting_useLowQualityImages") === "true");
	if(localStorage.getItem("setting_enable7TV") === "true") {
		console.log("getting 7tv channel emotes...");
		$.ajax({
			type: "GET",
			url: `https://7tv.io/v3/users/twitch/${broadcasterData.id}?sigh=${Date.now()}`,

			success: function(data) {
				console.log("got 7tv emotes");
				systemMessage("*Fetched channel's 7TV emotes*");
				console.log(data);

				if(data.emote_set === null) {
					systemMessage("*Unable to fetch channel's 7TV emotes, active emote set is... empty?*");
					return;
				}

				if(!("emotes" in data.emote_set)) {
					systemMessage("*Unable to fetch channel's 7TV emotes, emotes aren't in the emote set (this is 7TV's fault)*");
					return;
				}

				for(const emote of data.emote_set.emotes) {
					const emoteData = emote.data;
					const urls = emoteData.host.files;

					chatEmotes.addEmote(new Emote({
						service: "7tv",
						urls: {
							high: `https:${emoteData.host.url}/${urls[urls.length-1].name}`,
							low: `https:${emoteData.host.url}/${urls[0].name}`
						},
						emoteID: emoteData.id,
						emoteName: emote.name || emoteData.name,
						isZeroWidth: (emoteData.flags & 256 === 256),
						global: false
					}));
				}
			},

			error: function(err) {
				console.log("could not fetch 7tv channel emotes");
				systemMessage("*Unable to fetch channel's 7TV emotes*");
			}
		});
	} else {
		console.log("skipping 7tv channel emotes, not enabled");
	}

	if(localStorage.getItem("setting_enableBTTV") === "true") {
		console.log("getting bttv channel emotes...");
		$.ajax({
			type: "GET",
			url: `https://api.betterttv.net/3/cached/users/twitch/${broadcasterData.id}?sigh=${Date.now()}`,

			success: function(data) {
				console.log("got bttv emotes");
				systemMessage("*Fetched channel's BetterTTV emotes*");

				let mergedSets = Object.assign(data.sharedEmotes, data.channelEmotes);
				for(const emote of mergedSets) {
					chatEmotes.addEmote(new Emote({
						service: "bttv",
						urls: {
							high: `https://cdn.betterttv.net/emote/${emote.id}/3x.${emote.imageType}`,
							low: `https://cdn.betterttv.net/emote/${emote.id}/1x.${emote.imageType}`
						},
						emoteID: emote.id,
						emoteName: emote.code,
						modifiers: (emote.modifier ? ["Hidden"] : []),
						global: false
					}));
				}
			},

			error: function(err) {
				console.log("could not fetch bttv channel emotes");
				systemMessage("*Unable to fetch channel's BetterTTV emotes*");
			}
		});
	} else {
		console.log("skipping bttv channel emotes, not enabled");
	}

	if(localStorage.getItem("setting_enableFFZ") === "true") {
		console.log("getting ffz channel emotes...");
		$.ajax({
			type: "GET",
			url: `https://api.frankerfacez.com/v1/room/id/${broadcasterData.id}?sigh=${Date.now()}`,

			success: function(data) {
				console.log("got ffz emotes");
				systemMessage("*Fetched channel's FrankerFaceZ emotes*");

				for(let setIdx in data.sets) {
					const emotes = data.sets[setIdx].emoticons;
					for(const emote of emotes) {
						chatEmotes.addEmote(new Emote({
							service: "ffz",
							urls: {
								high: (emote.urls[4] || emote.urls[1]),
								low: emote.urls[1]
							},
							emoteID: emote.id,
							emoteName: emote.name,
							modifiers: (emote.modifier ? parseFFZModifiers(emote.modifier_flags) : []),
							global: false
						}));
					}
				}
			},

			error: function(err) {
				console.log("could not fetch ffz channel emotes");
				systemMessage("*Unable to fetch channel's FrankerFaceZ emotes*");
			}
		});
	} else {
		console.log("skipping ffz channel emotes, not enabled");
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

function checkForUpdate() {
	$.get(`version.json?sigh=${Date.now()}`, function(data) {
		let v_msg = `*(**local:** r${overlayRevision}, **remote:** r${data.revision})*`;
		if(overlayRevision !== data.revision) {
			systemMessage(`⚠️ The chat overlay may be out of date! Please refresh this browser source's cache in the source properties. ${v_msg}`);
		} else {
			systemMessage(`✅ The chat overlay is up to date! ${v_msg}`);
		}
	});
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
		await prepareMessage(data.tags, data.message, data.self, false);
	},

	cheer: async function(data) {
		await prepareMessage(data.tags, data.message, false, true);
	},

	subscription: async function(data) {
		await prepareMessage(data.tags, data.message, false, true);
	},

	resub: async function(data) {
		await prepareMessage(data.tags, data.message, false, true);
	},

	ban: function(data) {
		let id = data.tags['target-user-id'];
		$(`.chatBlock[data-userid="${id}"]`).remove();
		setHistoryOpacity();
	},

	messagedeleted: function(data) {
		let id = data.tags['target-msg-id'];
		let elem = $(`.effectWrapper[data-msguuid="${id}"]`);

		deleteMessages.push(id);

		if(elem.parent().children(".effectWrapper").length === 1) {
			$(`.chatBlock[data-rootidx="${elem.attr("data-rootidx")}"]`).remove();
		} else {
			elem.remove();
		}
		
		setHistoryOpacity();
	},

	timeout: function(data) {
		let id = data.tags["target-user-id"];
		$(`.chatBlock[data-userid="${id}"]`).remove();
		setHistoryOpacity();
	},

	clearchat: function(data) {
		$("#wrapper").empty();
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