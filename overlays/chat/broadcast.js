const settingsChannel = new BroadcastChannel("settings_overlay");

function postToSettingsChannel(event, data) {
	let message = {
		event: event
	};
	if(data) {
		message.data = data;
	}

	console.log(message);
	settingsChannel.postMessage(message);
}

currentActiveConversation = 0;
currentActiveConversationMessage = Infinity;
settingsFuncs = {
	reload: function(message) {
		setTimeout(function() {
			location.reload();
		}, 100);
	},

	testChatMessage: function() {
		currentActiveConversationMessage++;

		if(currentActiveConversationMessage >= testMessageConversations[currentActiveConversation].length) {
			currentActiveConversation = Math.floor(Math.random() * testMessageConversations.length);
			currentActiveConversationMessage = 0;

			// do not actually do this to randomize anything important, this is super duper biased and only really meant to just move things around occasionally
			allowedTestMessageOwners.sort(() => .5 - Math.random());
			//allowedTestMessageOwners.map((x) => x.color = getRandomHexColor(3));
		}

		let conversation = testMessageConversations[currentActiveConversation];
		let msg = conversation[currentActiveConversationMessage];
		let testUser = allowedTestMessageOwners[msg.whom];

		let tagsObject = {
			"badges": testUser.badges,
			"username": testUser.login,
			"display-name": testUser.display_name,
			"user-id": testUser['user-id'],
			"is-overlay-message": false,
			"message-type": "system",
			"id": `system-${Date.now()}`,
			"is-test-message": true
		};
		if("emotes" in msg) {
			tagsObject.emotes = msg.emotes;
		}

		prepareMessage(tagsObject, msg.msg, false, false);
	},

	clearChatMessages: function(message) {
		$("#wrapper").empty();
	},

	settingsOverlayLoaded: function() {
		postToSettingsChannel("ChatOverlayExists", {
			version: overlayRevision,
			timestamp: overlayRevisionTimestamp
		});

		setTwitchHelixReachable(twitchHelixReachable);
	},

	settingsKeys: function(message) {
		for(let i in message.data) {
			let setting = message.data[i];
			updateSetting(`setting_${setting}`, localStorage.getItem(`setting_${setting}`));
		}
	},

	refreshEmotes: function(message) {
		initEmoteSet();
		refreshExternalStuff();
	},

	clearAvatars: function(message) {
		for(const userID in twitchUsers) {
			twitchUsers[userID].avatar = null;
			twitchUsers[userID].avatarImage = null;
		}
	}
}

settingsChannel.onmessage = function(message) {
	console.log(message);
	message = message.data;

	if(message.event in settingsFuncs) {
		settingsFuncs[message.event](message);
	}
};