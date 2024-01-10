const twitchEventChannel = new BroadcastChannel("twitch_chat");
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

var allowedToProceed = true;
var isTwitchRunning = false;

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

const client = new tmi.Client({
	options: {
		debug: true
	},
	channels: [broadcasterName]
});

client.on('message', function(channel, tags, message, self) {
	postToTwitchEventChannel("message", {
		channel: channel,
		tags: tags,
		message: message,
		self: self
	});

	if(self) { return; }

	let id = tags['user-id'];
	let roomID = tags['room-id'];

	let count = parseInt(localStorage.getItem(`msgCount_${roomID}_${id}`));
	if(isNaN(count)) {
		count = 0;
	}

	localStorage.setItem(`msgCount_${roomID}_${id}`, count + 1);

	if(localStorage.getItem("setting_allowModeratorsToRefresh") === "true") {
		let moderator = false;
		if('badges' in tags) {
			if(tags.badges) {
				let roles = Object.keys(tags.badges);
				if(roles.indexOf("broadcaster") !== -1 || roles.indexOf("moderator") !== -1) {
					moderator = true;
				}
			}
		}

		if(moderator && message.toLowerCase() === `${localStorage.getItem("setting_chatCommandCharacter")}refreshoverlays`) {
			postToChannel("reload");
		}
	}

	if(localStorage.getItem("setting_allowParrotToRefresh") === "true") {
		if(parseInt(id) === 43464015 && message.toLowerCase() === `${localStorage.getItem("setting_chatCommandCharacter")}refreshoverlays`) {
			postToChannel("reload");
		}
	}
});
client.on("cheer", function(channel, tags, message) {
	postToTwitchEventChannel("cheer", {
		channel: channel,
		tags: tags,
		message: message
	});
});
client.on("resub", function(channel, username, months, message, tags, methods) {
	postToTwitchEventChannel("resub", {
		channel: channel,
		username: username,
		months: months,
		message: message,
		tags: tags,
		methods: methods
	});
});
client.on("subscription", function(channel, username, method, message, tags) {
	postToTwitchEventChannel("subscription", {
		channel: channel,
		username: username,
		method: method,
		message: message,
		tags: tags
	});
});

client.on("ban", function(channel, username, reason, tags) {
	postToTwitchEventChannel("ban", {
		channel: channel,
		username: username,
		reason: reason,
		tags: tags
	});
});

client.on("messagedeleted", function(channel, username, deletedMessage, tags) {
	postToTwitchEventChannel("messagedeleted", {
		channel: channel,
		username: username,
		deletedMessage: deletedMessage,
		tags: tags
	});
});

client.on("timeout", function(channel, username, reason, duration, tags) {
	postToTwitchEventChannel("timeout", {
		channel: channel,
		username: username,
		reason: reason,
		duration: duration,
		tags: tags
	});
});

client.on("raided", function(channel, username, viewers, tags) {
	postToTwitchEventChannel("raided", {
		channel: channel,
		username: username,
		viewers: viewers,
		tags: tags
	});
});

client.on("submysterygift", function(channel, username, numbOfSubs, methods, tags) {
	postToTwitchEventChannel("submysterygift", {
		channel: channel,
		username: username,
		numbOfSubs: numbOfSubs,
		methods: methods,
		tags: tags
	});
});

client.on("subgift", function(channel, username, streakMonths, recipient, methods, tags) {
	postToTwitchEventChannel("subgift", {
		channel: channel,
		username: username,
		streakMonths: streakMonths,
		recipient: recipient,
		methods: methods,
		tags: tags
	});
});

client.on("clearchat", function(channel) {
	postToTwitchEventChannel("clearchat");
});

const newNotices = ['announcement', 'viewermilestone'];
client.on("usernotice", function(msgid, channel, tags, msg) {
	if(newNotices.indexOf(tags['msg-id']) === -1) {
		return;
	}

	postToTwitchEventChannel(tags['msg-id'], {
		channel: channel,
		username: tags['username'],
		tags: tags,
		message: msg
	});
});

client.on("raw_message", (messageCloned, message) => {
	if(localStorage.getItem("setting_debugRawMessages") === "false") {
		return;
	}

	let d = new Date();
	let time = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
	console.log(`[RAW] [${time}] ${message.raw}`);
});

client.on("connected", function() {
	changeStatusCircle("TwitchIRCStatus", "green", "connected");
	addNotification(`Connected to Twitch's IRC server (#${broadcasterName})`, {bgColor: "var(--notif-color-success)", duration: 5});
});
client.on("disconnected", function() {
	changeStatusCircle("TwitchIRCStatus", "red", "disconnected");
	addNotification(`Disconnected from Twitch's IRC server`, {bgColor: "var(--notif-color-fail)", duration: 5});
});

var gettingAccessToken = false;
var gettingOAuthAccessToken = false;
var lastRefresh = 0;
var lastOAuthRefresh = 0;
const twitchFuncs = {
	RefreshAuthenticationToken: function() {
		if(!allowedToProceed) {
			console.log("No Client ID or Secret is set.");
			return;
		}

		if(gettingAccessToken) {
			console.log("already fetching a token, hold your horses!!!");
			return;
		}

		if(Date.now() - lastRefresh < 10000) {
			// this is a very hacky way to stop refresh spam but w/e
			console.log("already fetched a token within the last 10 seconds, chill");
			return;
		}

		gettingAccessToken = true;
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
				console.log(parentData);

				if("access_token" in parentData) {
					console.log("got access token...");
					localStorage.setItem("twitch_accessToken", parentData.access_token);

					postToTwitchEventChannel("AccessTokenRefreshed");
				}

				gettingAccessToken = false;
				lastRefresh = Date.now();
			},

			error: function() {
				gettingAccessToken = false;
			}
		});
	},

	RefreshOAuthToken: function() {
		if(gettingOAuthAccessToken) {
			console.log("already fetching a token, hold your horses!!!");
			return;
		}

		if(Date.now() - lastOAuthRefresh < 10000) {
			// this is a very hacky way to stop refresh spam but w/e
			console.log("already fetched a token within the last 10 seconds, chill");
			return;
		}

		gettingAccessToken = true;
		console.log("refreshing oauth access token...");

		regenTwitchCodes();
	}
};

twitchEventChannel.onmessage = function(message) {
	console.log(message);
	message = message.data;

	if(message.event in twitchFuncs) {
		twitchFuncs[message.event](message);
	}
};

$("#connectTwitchButton").on("mouseup", function(e) {
	e.preventDefault();
	sessionStorage.setItem("_oauth_service", "twitch");
	regenTwitchCodes();
});

$("#clearTwitchButton").on("mouseup", function(e) {
	e.preventDefault();

	if($(this).text() === "Are you sure?") {
		localStorage.removeItem("twitch_oauthRefreshToken");
		localStorage.removeItem("twitch_oauthAccessToken");

		addNotification("Cached Twitch OAuth tokens have been cleared, please reconnect to Twitch.", {duration: 10});
		changeButtonText($(this), "Clear Cached Tokens", true);
	}

	changeButtonText($(this), "Are you sure?", false);
	var elem = $(this); // augh
	resetTimeout = setTimeout(function() {
		changeButtonText(elem, "Clear Cached Tokens", true);
	}, 5000);
});

var isTwitchOAuthReady = false;
function onTwitchReady() {
	if(oauthCode) {
		window.history.replaceState({}, document.title, window.location.pathname);
	}

	isTwitchOAuthReady = true;

	addNotification("Successfully connected to Twitch (OAuth)", {bgColor: "var(--notif-color-success)", duration: 5});
	//changeStatusCircle("SpotifyStatus", "green", `connected`);
}

if(localStorage.getItem('twitch_oauthRefreshToken')) {
	regenTwitchCodes();
}

/*
let testData = [
	`@badge-info=;badges=staff/1,bits/1000;bits=100;color=;display-name=ronni;emotes=;id=b34ccfc7-4977-403a-8a94-33c6bac34fb8;mod=0;room-id=12345678;subscriber=0;tmi-sent-ts=1507246572675;turbo=1;user-id=12345678;user-type=staff :ronni!ronni@ronni.tmi.twitch.tv PRIVMSG #ronni :cheer100`,
	`@badge-info=;badges=staff/1,broadcaster/1,turbo/1;color=#008000;display-name=ronni;emotes=;id=db25007f-7a18-43eb-9379-80131e44d633;login=ronni;mod=0;msg-id=resub;msg-param-cumulative-months=6;msg-param-streak-months=2;msg-param-should-share-streak=1;msg-param-sub-plan=Prime;msg-param-sub-plan-name=Prime;room-id=12345678;subscriber=1;system-msg=ronni\shas\ssubscribed\sfor\s6\smonths!;tmi-sent-ts=1507246572675;turbo=1;user-id=87654321;user-type=staff :tmi.twitch.tv USERNOTICE #dallas :Great stream -- keep it up!`,	
	`@badge-info=;badges=staff/1,bits/1000;bits=100;color=;display-name=ronni;emotes=;id=b34ccfc7-4977-403a-8a94-33c6bac34fb8;mod=0;room-id=12345678;subscriber=0;tmi-sent-ts=1507246572675;turbo=1;user-id=12345678;user-type=staff :ronni!ronni@ronni.tmi.twitch.tv PRIVMSG #ronni :cheer100`
];
for(let i in testData) {
	setTimeout(function() {
		client._onMessage({
			data: testData[i]
		});
	}, 2000 + (i * 2000));
}
*/