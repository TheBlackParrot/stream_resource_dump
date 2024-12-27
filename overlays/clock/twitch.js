const delay = ms => new Promise(res => setTimeout(res, ms));

async function callTwitchAsync(data) {
	const twitchClientId = localStorage.getItem("setting_twitchClientID");

	var token = localStorage.getItem("twitch_accessToken");
	if(data.oauth) {
		token = localStorage.getItem("twitch_oauthAccessToken");
	}

	if(!twitchClientId || !token) {
		return {};
	}

	if(data.oauth) {
		if(localStorage.getItem("setting_channelIsOwn") === "false") {
			console.log("cannot fetch data requiring an oauth token from other channels");
			return {};
		}
	}

	var url = new URL(`https://api.twitch.tv/helix/${data.endpoint}`);
	if("args" in data) {
		url.search = new URLSearchParams(data.args).toString();
	}

	const fetchResponse = await fetch(url, {
		method: "GET",
		cache: "no-cache",
		headers: {
			"Authorization": `Bearer ${token}`,
			"Client-Id": twitchClientId
		}
	});

	switch(fetchResponse.status) {
		case 200:
			break;

		case 401:
			console.log("token unauthorized");
			if(data.oauth) {
				postToTwitchEventChannel("RefreshOAuthToken");
			}
			break;
	}

	return await fetchResponse.json();
}

var broadcasterData;
var streamData = {"started_at": new Date().toISOString()};

async function getBroadcasterData() {
	const broadcasterName = localStorage.getItem(`setting_twitchChannel`);

	var rawUserResponse;
	if(localStorage.getItem("setting_channelIsOwn") === "true") {
		rawUserResponse = await callTwitchAsync({
			endpoint: "users",
			oauth: true
		});
	} else {
		rawUserResponse = await callTwitchAsync({
			endpoint: "users",
			args: {
				login: broadcasterName
			}
		});
	}

	broadcasterData = rawUserResponse.data[0];
	if(!("data" in broadcasterData)) {
		// erm
		await delay(1000);
		return await getBroadcasterData();
	}
	return broadcasterData;
}

var nextAdBreak = Date.now();
async function setNextAdBreak() {
	console.log("updating time to next ad break");

	if(typeof broadcasterData === "undefined") {
		await getBroadcasterData();
	}

	const adData = await callTwitchAsync({
		endpoint: "channels/ads",
		oauth: true,
		args: {
			broadcaster_id: broadcasterData.id
		}
	});

	console.log(adData);

	if(!adData.data) {
		console.log("ad data blank, probably not authorized");
		return;
	}

	if(!adData.data.length) {
		console.log("ad data blank, probably not authorized");
		return;
	}

	const data = adData.data[0];
	nextAdBreak = (parseInt(data.next_ad_at) || 0) * 1000;
}

var adTimerTO;
async function adTimer() {
	clearTimeout(adTimerTO);
	await setNextAdBreak();

	adTimerTO = setTimeout(adTimer, 15000);
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