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

	if(user.entitlements.bttv.badge !== null) {
		return;
	}

	user.entitlements.bttv.badge = {
		high: data.badge.url,
		low: data.badge.url
	};

	for(const roomID in user.userBlock.badgeBlock) {
		user.userBlock.updateBadgeBlock(roomID);
	}
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
		animated: emote.animated,
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
		bttvWS.attemptedJoins = [];
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