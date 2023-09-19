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
var twitchBadges = [];
var chatEmotes = (localStorage.getItem("setting_chatShowCommonEmotes") === "true" ? Object.create(commonEmotes) : {});
var cheermotes = {};
var twitchHelixReachable = false;

function setTwitchHelixReachable(state) {
	twitchHelixReachable = state;
	postToSettingsChannel("TwitchHelixStatus", state);
}

function getStuffReady() {
	console.log(`getting broadcaster information for ${broadcasterName}...`);

	callTwitch({
		"endpoint": "users",
		"args": {
			"login": broadcasterName
		}
	}, function(rawUserResponse) {
		broadcasterData = rawUserResponse.data[0];
		console.log(`got broadcaster information for ${broadcasterData.display_name} (${broadcasterData.id})`);
		console.log("getting chat badges...");

		refreshExternalStuff();

		callTwitch({
			"endpoint": "chat/badges/global"
		}, function(badgeResponse) {
			console.log("got global chat badges");

			let subBlock = -1;
			for(let i in badgeResponse.data) {
				if(badgeResponse.data[i].set_id === "subscriber") {
					subBlock = i;
				}

				twitchBadges.push(badgeResponse.data[i]);
			}

			callTwitch({
				"endpoint": "chat/badges",
				"args": {
					"broadcaster_id": broadcasterData.id
				}
			}, function(channelBadgeResponse) {
				console.log("got channel chat badges");
				for(let i in channelBadgeResponse.data) {
					let badge = channelBadgeResponse.data[i];

					if(badge.set_id === "subscriber") {
						for(let j in badge.versions) {
							let badgeData = badge.versions[j];
							let foundOldBadge = false;

							for(let k in twitchBadges[subBlock].versions) {
								let oldBadgeData = twitchBadges[subBlock].versions[k];

								if(oldBadgeData.id === badgeData.id) {
									twitchBadges[subBlock].versions[k] = badgeData;
									foundOldBadge = true;
								}
							}
							if(!foundOldBadge) {
								twitchBadges[subBlock].versions.push(badge.versions[j]);
							}
						}
					} else {
						twitchBadges.push(badge);
					}
				}
			});
		});

		console.log("getting cheermotes...");
		callTwitch({
			"endpoint": "bits/cheermotes",
			"args": {
				"broadcaster_id": broadcasterData.id
			}
		}, function(cheermoteResponse) {
			console.log("got cheermotes");
			for(let i in cheermoteResponse.data) {
				let mote = cheermoteResponse.data[i];
				mote.prefix = mote.prefix.toLowerCase();
				
				cheermotes[mote.prefix] = {};

				for(let j in mote.tiers) {
					let tier = mote.tiers[j];

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
		});

		//getGlobalChannelEmotes(broadcasterData);

		console.log("getting channel information...");
		callTwitch({
			"endpoint": "channels",
			"args": {
				"broadcaster_id": broadcasterData.id
			}
		}, function(channelResponse) {
			console.log("got channel information");
			channelData = channelResponse.data[0];
			systemMessage(`Showing chat for **#${broadcasterData.login}**${broadcasterData.login === broadcasterName.display_name ? "" : ` *(a.k.a. ${broadcasterData.display_name})*`}`);

			getTwitchStreamData();
		});
	});
}

var streamDataTimeout;
function getTwitchStreamData() {
	clearTimeout(streamDataTimeout);

	callTwitch({
		"endpoint": "streams",
		"args": {
			"user_id": broadcasterData.id
		}
	}, function(streamResponse) {
		console.log("got stream information");
		console.log(streamResponse);
		if(streamResponse.data.length) {
			streamData = streamResponse.data[0];
		} else {
			console.log("stream is not live, checking again in 30 seconds");
			streamDataTimeout = setTimeout(getTwitchStreamData, 30000);
		}
	});
}

function getGlobalChannelEmotes(broadcasterData) {
	if(!allowedToProceed) {
		console.log("No Client ID or Secret is set.");
		return;
	}

	let count = 0;
	let checkIfDone = function() {
		count++;
		if(count >= 3) {
			getExternalChannelEmotes(broadcasterData);
		}
	}

	let useLQImages = (localStorage.getItem("setting_useLowQualityImages") === "true");
	if(localStorage.getItem("setting_enable7TVGlobalEmotes") === "true" && localStorage.getItem("setting_enable7TV") === "true") {
		console.log("getting 7tv global emotes...");
		$.ajax({
			type: "GET",
			url: `https://7tv.io/v3/emote-sets/global`,

			success: function(data) {
				console.log("got 7tv global emotes");
				systemMessage("*Fetched global 7TV emotes*");
				console.log(data);

				for(let i in data.emotes) {
					let emote = data.emotes[i];
					let urls = emote.data.host.files;
					chatEmotes[emote.name] = {
						service: "7tv",
						url: `https:${emote.data.host.url}/${urls[(useLQImages ? 0 : urls.length-1)].name}`
					}
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

	if(localStorage.getItem("setting_enableBTTVGlobalEmotes") === "true" && localStorage.getItem("setting_enableBTTV") === "true") {
		console.log("getting bttv global emotes...");
		$.ajax({
			type: "GET",
			url: `https://api.betterttv.net/3/cached/emotes/global`,

			success: function(data) {
				console.log("got bttv emotes");
				systemMessage("*Fetched global BetterTTV emotes*");
				console.log(data);

				for(let idx in data) {
					let emote = data[idx];
					chatEmotes[emote.code] = {
						service: "bttv",
						url: `https://cdn.betterttv.net/emote/${emote.id}/${useLQImages ? 1 : 3}x.${emote.imageType}`,
						id: emote.id
					}
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

	if(localStorage.getItem("setting_enableFFZGlobalEmotes") === "true" && localStorage.getItem("setting_enableFFZ") === "true") {
		console.log("getting ffz global emotes...");
		$.ajax({
			type: "GET",
			url: `https://api.frankerfacez.com/v1/set/global`,

			success: function(data) {
				console.log("got ffz emotes");
				systemMessage("*Fetched global FrankerFaceZ emotes*");

				for(let setIdx in data.sets) {
					let emotes = data.sets[setIdx].emoticons;

					for(let idx in emotes) {
						let emote = emotes[idx];
						let url;
						if(useLQImages) {
							url = emote.urls[1];
						} else {
							url = emote.urls[4] || emote.urls[1];
						}

						chatEmotes[emote.name] = {
							service: "ffz",
							url: url
						}
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
	if(localStorage.getItem("setting_enable7TVChannelEmotes") === "true" && localStorage.getItem("setting_enable7TV") === "true") {
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
					systemMessage("*Unable to fetch channel's 7TV emotes, required JS object isn't present?*");
					return;
				}

				for(let i in data.emote_set.emotes) {
					let emote = data.emote_set.emotes[i];
					let urls = emote.data.host.files;
					chatEmotes[emote.name] = {
						service: "7tv",
						url: `https:${emote.data.host.url}/${urls[(useLQImages ? 0 : urls.length-1)].name}`
					}
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

	if(localStorage.getItem("setting_enableBTTVChannelEmotes") === "true" && localStorage.getItem("setting_enableBTTV") === "true") {
		console.log("getting bttv channel emotes...");
		$.ajax({
			type: "GET",
			url: `https://api.betterttv.net/3/cached/users/twitch/${broadcasterData.id}?sigh=${Date.now()}`,

			success: function(data) {
				console.log("got bttv emotes");
				systemMessage("*Fetched channel's BetterTTV emotes*");

				for(let idx in data.sharedEmotes) {
					let emote = data.sharedEmotes[idx];
					chatEmotes[emote.code] = {
						service: "bttv",
						url: `https://cdn.betterttv.net/emote/${emote.id}/${useLQImages ? 1 : 3}x.${emote.imageType}`,
						id: emote.id
					}
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

	if(localStorage.getItem("setting_enableFFZChannelEmotes") === "true" && localStorage.getItem("setting_enableFFZ") === "true") {
		console.log("getting ffz channel emotes...");
		$.ajax({
			type: "GET",
			url: `https://api.frankerfacez.com/v1/room/id/${broadcasterData.id}?sigh=${Date.now()}`,

			success: function(data) {
				console.log("got ffz emotes");
				systemMessage("*Fetched channel's FrankerFaceZ emotes*");

				for(let setIdx in data.sets) {
					let emotes = data.sets[setIdx].emoticons;

					for(let idx in emotes) {
						let emote = emotes[idx];
						let url;
						if(useLQImages) {
							url = emote.urls[1];
						} else {
							url = emote.urls[4] || emote.urls[1];
						}

						chatEmotes[emote.name] = {
							service: "ffz",
							url: url
						}
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

	for(let setIdx in twitchBadges) {
		let setData = twitchBadges[setIdx];

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
			systemMessage(`⚠️ Overlay may be out of date! Please refresh your browser source's cache. ${v_msg}`);
		} else {
			systemMessage(`✅ Overlay is up to date. ${v_msg}`);
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

const twitchEventFuncs = {
	message: function(data) {
		prepareMessage(data.tags, data.message, data.self, false);
	},

	cheer: function(data) {
		prepareMessage(data.tags, data.message, false, true);
	},

	subscription: function(data) {
		prepareMessage(data.tags, data.message, false, true);
	},

	resub: function(data) {
		prepareMessage(data.tags, data.message, false, true);
	},

	ban: function(data) {
		let id = data.tags['target-user-id'];
		$(`.chatBlock[data-userid="${id}"]`).remove();
		setHistoryOpacity();
	},

	messagedeleted: function(data) {
		let id = data.tags['target-msg-id'];
		let elem = $(`.effectWrapper[data-msguuid="${id}"]`);

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

	AccessTokenRefreshed: function(data) {
		lastAsk = Infinity;

		systemMessage("Twitch authentication token refreshed!");

		callTwitchQueue = callTwitchQueue.filter(function(queueObj) {
			if(typeof queueObj.callback === "function") {
				if("data" in queueObj) {
					callTwitch(queueObj.data, queueObj.callback);
				} else {
					queueObj.callback();
				}
			}

			return false;
		});
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