var lastAsk = Infinity;

const delay = ms => new Promise(res => setTimeout(res, ms));

async function callTwitchAsync(data) {
	var token = localStorage.getItem("twitch_accessToken");
	if(data.oauth && broadcasterData) {
		token = localStorage.getItem("twitch_oauthAccessToken");
	}

	if(!twitchClientId) {
		return {};
	}

	if(!token && data.oauth) {
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
			setTwitchHelixReachable(true);
			break;

		case 401:
			console.log("token unauthorized");

			if(data.oauth) {
				postToTwitchEventChannel("RefreshOAuthToken");
			} else {
				if(Date.now() < lastAsk) {
					postToTwitchEventChannel("RefreshAuthenticationToken");
					lastAsk = Date.now();
				}
			}

			await delay(5000);
			return await callTwitchAsync(data);
			break;
	}

	return await fetchResponse.json();
}

function rootCSS() {
	return document.querySelector("html").style;
}