const query = new URLSearchParams(location.search);
var allowedToProceed = true;

if(!localStorage.getItem(`twitch_clientID`) || localStorage.getItem(`twitch_clientID`) === "null" || query.get("clientID") !== null) {
	localStorage.setItem(`twitch_clientID`, query.get("clientID"));
}
if(!localStorage.getItem(`twitch_clientSecret`) || localStorage.getItem(`twitch_clientSecret`) === "null" || query.get("clientSecret") !== null) {
	localStorage.setItem(`twitch_clientSecret`, query.get("clientSecret"));
}

const twitchClientId = localStorage.getItem(`twitch_clientID`)
const twitchClientSecret = localStorage.getItem(`twitch_clientSecret`);
const broadcasterName = query.get("channel").toLowerCase();

if(!broadcasterName || broadcasterName === "null") {
	allowedToProceed = false;
	console.log("No channel is set, use ?channel=channel in your URL");
}

if(twitchClientId === "null" || twitchClientSecret === "null" || !twitchClientId || !twitchClientSecret) {
	allowedToProceed = false;
	console.log(`cached ID: ${twitchClientId}, cached secret: ${twitchClientSecret}`);
}

const client = new tmi.Client({
	options: {
		debug: true
	},
	channels: [broadcasterName]
});
if(allowedToProceed) {
	client.connect().catch(console.error);
}

var twitchAccessToken;
var broadcasterData = {};
var channelData = {};
var twitchBadges = [];
var chatEmotes = {};

function setTwitchAccessToken() {
	if(!allowedToProceed) {
		console.log("No Client ID or Secret is set.");
		return;
	}

	console.log("getting access token...");

	$.ajax({
		type: "POST",
		url: "https://id.twitch.tv/oauth2/token",
		
		data: {
			"client_id": twitchClientId,
			"client_secret": twitchClientSecret,
			"grant_type": "client_credentials"
		},

		success: function(parentData) {
			if("access_token" in parentData) {
				console.log("got access token...");
				twitchAccessToken = parentData.access_token;

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

					getGlobalChannelEmotes(broadcasterData);

					console.log("getting channel information...");
					callTwitch({
						"endpoint": "channels",
						"args": {
							"broadcaster_id": broadcasterData.id
						}
					}, function(channelResponse) {
						console.log("got channel information");
						channelData = channelResponse.data[0];
					})
				})
			} else {
				console.log(data);
			}
		}
	});
}
setTwitchAccessToken();

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

	console.log("getting 7tv global emotes...");
	$.ajax({
		type: "GET",
		url: `https://7tv.io/v3/emote-sets/global`,

		success: function(data) {
			console.log("got 7tv global emotes");
			console.log(data);

			for(let i in data.emotes) {
				let emote = data.emotes[i];
				let urls = emote.data.host.files;
				chatEmotes[emote.name] = {
					service: "7tv",
					url: `https:${emote.data.host.url}/${urls[urls.length-1].name}`
				}
			}

			checkIfDone();
		},

		error: function(err) {
			console.log("could not fetch 7tv global emotes");
			checkIfDone();
		}
	});

	console.log("getting bttv global emotes...");
	$.ajax({
		type: "GET",
		url: `https://api.betterttv.net/3/cached/emotes/global`,

		success: function(data) {
			console.log("got bttv emotes");
			console.log(data);

			for(let idx in data) {
				let emote = data[idx];
				chatEmotes[emote.code] = {
					service: "bttv",
					url: `https://cdn.betterttv.net/emote/${emote.id}/3x.${emote.imageType}`,
					id: emote.id
				}
			}

			checkIfDone();
		},

		error: function(err) {
			console.log("could not fetch bttv channel emotes");
			checkIfDone();
		}
	});

	console.log("getting ffz global emotes...");
	$.ajax({
		type: "GET",
		url: `https://api.frankerfacez.com/v1/set/global`,

		success: function(data) {
			console.log("got ffz emotes");
			for(let setIdx in data.sets) {
				let emotes = data.sets[setIdx].emoticons;

				for(let idx in emotes) {
					let emote = emotes[idx];
					let url = emote.urls[4] || emote.urls[1];

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
			checkIfDone();
		}
	});
}

function getExternalChannelEmotes(broadcasterData) {
	if(!allowedToProceed) {
		console.log("No Client ID or Secret is set.");
		return;
	}

	console.log("getting 7tv channel emotes...");
	$.ajax({
		type: "GET",
		url: `https://7tv.io/v3/users/twitch/${broadcasterData.id}`,

		success: function(data) {
			console.log("got 7tv emotes");
			console.log(data);

			for(let i in data.emote_set.emotes) {
				let emote = data.emote_set.emotes[i];
				let urls = emote.data.host.files;
				chatEmotes[emote.name] = {
					service: "7tv",
					url: `https:${emote.data.host.url}/${urls[urls.length-1].name}`
				}
			}
		},

		error: function(err) {
			console.log("could not fetch 7tv channel emotes");
		}
	});

	console.log("getting bttv channel emotes...");
	$.ajax({
		type: "GET",
		url: `https://api.betterttv.net/3/cached/users/twitch/${broadcasterData.id}`,

		success: function(data) {
			console.log("got bttv emotes");

			for(let idx in data.sharedEmotes) {
				let emote = data.sharedEmotes[idx];
				chatEmotes[emote.code] = {
					service: "bttv",
					url: `https://cdn.betterttv.net/emote/${emote.id}/3x.${emote.imageType}`,
					id: emote.id
				}
			}
		},

		error: function(err) {
			console.log("could not fetch bttv channel emotes");
		}
	});

	console.log("getting ffz channel emotes...");
	$.ajax({
		type: "GET",
		url: `https://api.frankerfacez.com/v1/room/id/${broadcasterData.id}`,

		success: function(data) {
			console.log("got ffz emotes");
			for(let setIdx in data.sets) {
				let emotes = data.sets[setIdx].emoticons;

				for(let idx in emotes) {
					let emote = emotes[idx];
					let url = emote.urls[4] || emote.urls[1];

					chatEmotes[emote.name] = {
						service: "ffz",
						url: url
					}
				}
			}
		},

		error: function(err) {
			console.log("could not fetch ffz channel emotes");
		}
	});
}

function callTwitch(data, callback) {
	if(!allowedToProceed) {
		console.log("No Client ID or Secret is set.");
		return;
	}

	$.ajax({
		type: "GET",
		url: `https://api.twitch.tv/helix/${data.endpoint}`,
		headers: {
			"Authorization": `Bearer ${twitchAccessToken}`,
			"Client-Id": twitchClientId
		},

		data: data.args,

		success: function(data) {
			if(typeof callback === "function") {
				callback(data);
			}
		}
	})	
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