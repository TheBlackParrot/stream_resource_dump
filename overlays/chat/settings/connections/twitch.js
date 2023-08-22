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
});
client.on("disconnected", function() {
	changeStatusCircle("TwitchIRCStatus", "red", "disconnected");
});

var gettingAccessToken = false;
var lastRefresh = 0;
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
	}
};

twitchEventChannel.onmessage = function(message) {
	console.log(message);
	message = message.data;

	if(message.event in twitchFuncs) {
		twitchFuncs[message.event](message);
	}
};

/*
setTimeout(function() {
	client._onMessage({
		data: `@badge-info=;badges=turbo/1;color=#9ACD32;display-name=TestChannel;emotes=;id=3d830f12-795c-447d-af3c-ea05e40fbddb;login=testchannel;mod=0;msg-id=raid;msg-param-displayName=TestChannel;msg-param-login=testchannel;msg-param-viewerCount=15;room-id=33332222;subscriber=0;system-msg=15\sraiders\sfrom\sTestChannel\shave\sjoined\n!;tmi-sent-ts=1507246572675;turbo=1;user-id=123456;user-type= :tmi.twitch.tv USERNOTICE #othertestchannel`
	});
}, 2000);
*/