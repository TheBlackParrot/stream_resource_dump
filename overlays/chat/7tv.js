var sevenTVWS;
function subscribe7TV(type, roomID, objectID) {
	let conditions = {};

	if(objectID) {
		conditions = {
			object_id: objectID
		};
	} else {
		conditions = {
			ctx: 'channel',
			id: roomID,
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
	sevenTVWS.attemptedJoins = [broadcasterData.id];

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

			switch(data.kind) {
				case "BADGE":
					if(user.entitlements.sevenTV.badges.indexOf(data.ref_id) === -1) {
						user.entitlements.sevenTV.badges.push(data.ref_id);
						for(const roomID in user.userBlock.badgeBlock) {
							user.userBlock.updateBadgeBlock(roomID);
						}
					}
					break;

				case "PAINT":
					if(user.allowSevenTVPaint) {
						user.setSevenTVPaint(data.ref_id);
						set7TVPaint($(`.name[data-userid="${user.id}"]`), data.ref_id, user.id);
					}
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

			switch(data.kind) {
				case "BADGE":
					user.entitlements.sevenTV.badges = user.entitlements.sevenTV.badges.filter(function(badge) { 
						return badge !== data.ref_id;
					});
					user.userBlock.updateBadgeBlock();
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
			if(allowedSevenTVEmoteSets.indexOf(data.id) === -1 && localStorage.getItem("setting_enable7TVPersonalEmoteSets") === "false") {
				return;
			}

			if("pushed" in data) {
				for(const objectData of data.pushed) {
					const emoteData = objectData.value.data;
					const urls = emoteData.host.files;

					chatEmotes.addEmote(new Emote({
						service: "7tv",
						setID: data.id,
						animated: emoteData.animated,
						urls: {
							high: `https:${emoteData.host.url}/4x.###`,
							low: `https:${emoteData.host.url}/1x.###`
						},
						emoteID: emoteData.id,
						emoteName: (objectData.value.name || emoteData.name),
						isZeroWidth: ((emoteData.flags & 256) === 256),
						global: false
					}));
				}
			}
			if("pulled" in data) {
				for(const objectData of data.pulled) {
					console.log(objectData);
					const emoteData = objectData.old_value;
					chatEmotes.deleteEmote(emoteData.id, data.id);
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
		sevenTVWS.attemptedJoins = [broadcasterData.id];
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

			subscribe7TV("cosmetic.*", broadcasterData.id);
			subscribe7TV("entitlement.*", broadcasterData.id);
			if(sevenTVEmoteSetIDs[broadcasterData.id]) {
				subscribe7TV("emote_set.*", broadcasterData.id, sevenTVEmoteSetIDs[broadcasterData.id]);
			}
		};
		waitForBroadcasterData();
	});

	sevenTVWS.addEventListener("close", function() {
		console.log("Disconnected from 7TV, trying again in 5 seconds...");
		setTimeout(start7TVWebsocket, 5000);
	});
}