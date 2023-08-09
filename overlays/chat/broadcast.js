const broadcastChannel = new BroadcastChannel("settings_overlay");

function postToChannel(event, data) {
	let message = {
		event: event
	};
	if(data) {
		message.data = data;
	}

	console.log(message);
	broadcastChannel.postMessage(message);
}

broadcastFuncs = {
	reload: function(message) {
		setTimeout(function() {
			location.reload();
		}, 100);
	},

	testChatMessage: function(message) {
		lastUser = -69; // nice
		let col = Math.floor(Math.random() * 16777216);
		let r = ((col >> 16) & 0xFF).toString(16).padStart(2, "0");
		let g = ((col >> 8) & 0xFF).toString(16).padStart(2, "0");
		let b = (col & 0xFF).toString(16).padStart(2, "0");

		//info=subscriber/25;badges=broadcaster/1,subscriber/3024;client-nonce=d101a84203af3f39502904e6a317672c;color=#8A2BE2;display-name=TheBlackParrot;emotes=305954156:11-18/25:5-9;first-msg=0;flags=;id=7f097686-fb53-4a0a-97d6-ee90ff0d3a05;mod=0;returning-chatter=0;room-id=43464015;subscriber=1;tmi-sent-ts=1689412906804;turbo=0;user-id=43464015;user-type= :theblackparrot!theblackparrot@theblackparrot.tmi.twitch.tv PRIVMSG #theblackparrot :test Kappa PogChamp

		let exMsg = "Hello there! This is a *fake message* so that you can see what your *chat settings* look like! **Have fun!** AaBbCcDd EeFfGgHh IiJjKkLl MmNnOoPp QqRrSsTt UuVvWwXx YyZz 0123456789 Also, look! Emotes! Kappa PogChamp catJAM ~~sarcastic text~~";
		let msg = `@badge-info=;badges=broadcaster/1;client-nonce=balls;display-name=${broadcasterData.display_name};emotes=305954156:205-212/25:199-203;first-msg=0;flags=;id=1234-abcd;mod=0;returning-chatter=0;room-id=${broadcasterData.id};subscriber=0;tmi-sent-ts=${Date.now()};turbo=0;user-id=-1;user-type=;color=#${r}${g}${b} :${broadcasterData.login}!${broadcasterData.login}@${broadcasterData.login}.tmi.twitch.tv PRIVMSG #${broadcasterData.login} :${exMsg}`;
		client._onMessage({
			data: msg
		});
	},

	clearChatMessages: function(message) {
		$("#wrapper").empty();
	}
}

broadcastChannel.onmessage = function(message) {
	console.log(message);
	message = message.data;

	if(message.event in broadcastFuncs) {
		broadcastFuncs[message.event](message);
	}
};