const oauthCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const oauthRedirectUri = `${window.location.origin}${window.location.pathname}`;

const delay = ms => new Promise(res => setTimeout(res, ms));

function getRandomString(length) {
	let rand = [];

	for(let i = 0; i < length; i++) {
		let char = oauthCharacters.charAt(Math.floor(Math.random() * oauthCharacters.length));
		rand.push(char);
	}

	return rand.join("");
}

async function generateCodeChallenge(codeVerifier) {
	let out;

	if(typeof window.crypto.subtle === "undefined") {
		let md = forge.md.sha256.create();
		md.update(codeVerifier);
		out = btoa(md.digest().data);
	} else {
		const encoder = new TextEncoder();
		const data = encoder.encode(codeVerifier);
		const digest = await window.crypto.subtle.digest('SHA-256', data);
		out = btoa(String.fromCharCode.apply(null, new Uint8Array(digest)));
	}

	return out.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

var spotifyCodeVerifier = getRandomString(128);

const spotifyScopes = ["user-read-playback-state", "user-read-currently-playing"];
const twitchScopes = ["channel:read:ads", "channel:read:redemptions", "bits:read"];

const oauthParams = new URLSearchParams(window.location.search);
const oauthCode = oauthParams.get('code');
const oauthState = oauthParams.get('state');

async function regenSpotifyCodes() {
	let spotifyClientID = localStorage.getItem("setting_spotifyClientID");

	if(!spotifyClientID) {
		console.log("Please set your Spotify App Client ID in the overlay settings panel.");
		return;
	}

	let refreshToken = localStorage.getItem("spotify_refreshToken");

	if(refreshToken) {
		let body = new URLSearchParams({
			grant_type: 'refresh_token',
			refresh_token: refreshToken,
			client_id: spotifyClientID
		});

		const response = await fetch('https://accounts.spotify.com/api/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: body
		});

		if(!response.ok) {
			localStorage.removeItem("spotify_refreshToken");
			await regenSpotifyCodes();
			return;
		}

		const data = await response.json();

		localStorage.setItem('spotify_accessToken', data.access_token);
		localStorage.setItem('spotify_refreshToken', data.refresh_token);
		onSpotifyReady();
	} else {
		generateCodeChallenge(spotifyCodeVerifier).then(codeChallenge => {
			let state = getRandomString(16);

			localStorage.setItem('spotify_codeVerifier', spotifyCodeVerifier);

			let args = new URLSearchParams({
				response_type: 'code',
				client_id: spotifyClientID,
				scope: spotifyScopes.join(" "),
				redirect_uri: oauthRedirectUri,
				state: state,
				code_challenge_method: 'S256',
				code_challenge: codeChallenge
			});

			window.location = 'https://accounts.spotify.com/authorize?' + args;
		});
	}
}

async function setSpotifyTokens() {
	let codeVerifier = localStorage.getItem('spotify_codeVerifier');
	let spotifyClientID = localStorage.getItem("setting_spotifyClientID");

	let body = new URLSearchParams({
		grant_type: 'authorization_code',
		code: oauthCode,
		redirect_uri: oauthRedirectUri,
		client_id: spotifyClientID,
		code_verifier: codeVerifier
	});

	const response = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: body
	});

	if(!response.ok) {
		await regenSpotifyCodes();
		return;
	}

	const data = await response.json();

	localStorage.setItem('spotify_accessToken', data.access_token);
	localStorage.setItem('spotify_refreshToken', data.refresh_token);
	onSpotifyReady();
}

async function regenTwitchCodes() {
	const twitchClientID = localStorage.getItem("setting_twitchClientID");
	const twitchClientSecret = localStorage.getItem("setting_twitchClientSecret");

	if(!twitchClientID || !twitchClientSecret) {
		return;
	}

	let refreshToken = localStorage.getItem("twitch_oauthRefreshToken");

	if(refreshToken) {
		console.log("twitch oauth refresh token present, using it...");

		let body = new URLSearchParams({
			client_id: twitchClientID,
			client_secret: twitchClientSecret,
			grant_type: 'refresh_token',
			refresh_token: refreshToken
		});

		const response = await fetch('https://id.twitch.tv/oauth2/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: body
		});

		if(!response.ok) {
			console.log("twitch oauth refresh token was bad");
			localStorage.removeItem("twitch_oauthAccessToken");
			localStorage.removeItem("twitch_oauthRefreshToken");
			await regenTwitchCodes();
			return;
		}
		console.log("twitch oauth refresh token was good");

		const data = await response.json();

		localStorage.setItem('twitch_oauthAccessToken', data.access_token);
		localStorage.setItem('twitch_oauthRefreshToken', data.refresh_token);

		postToTwitchEventChannel("OAuthTokenRefreshed");
		lastOAuthRefresh = Date.now();

		onTwitchReady();
	} else {
		let state = getRandomString(16);
		sessionStorage.setItem("_oauth_state", state);

		let args = new URLSearchParams({
			response_type: 'code',
			client_id: twitchClientID,
			scope: twitchScopes.join(" "),
			redirect_uri: oauthRedirectUri,
			state: state,
			force_verify: true
		});

		window.location = 'https://id.twitch.tv/oauth2/authorize?' + args;
	}
}

async function setTwitchTokens() {
	const stateCheck = sessionStorage.getItem("_oauth_state");
	if(oauthState !== stateCheck) {
		console.log("states do not match, ignoring");
		return;
	}

	const twitchClientID = localStorage.getItem("setting_twitchClientID");
	const twitchClientSecret = localStorage.getItem("setting_twitchClientSecret");

	const body = new URLSearchParams({
		grant_type: 'authorization_code',
		code: oauthCode,
		redirect_uri: oauthRedirectUri,
		client_id: twitchClientID,
		client_secret: twitchClientSecret
	});

	const response = await fetch('https://id.twitch.tv/oauth2/token', {
		method: 'POST',
		cache: "no-cache",
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: body
	});

	if(!response.ok) {
		console.log("couldn't get twitch tokens");
		await regenTwitchCodes();
		return;
	}

	const data = await response.json();

	console.log("got twitch tokens");
	localStorage.setItem('twitch_oauthAccessToken', data.access_token);
	localStorage.setItem('twitch_oauthRefreshToken', data.refresh_token);
	onTwitchReady();
}

if(oauthCode) {
	const service = sessionStorage.getItem("_oauth_service");

	switch(service) {
		case "spotify":
			sessionStorage.removeItem("_oauth_service");
			setSpotifyTokens();
			break;

		case "twitch":
			sessionStorage.removeItem("_oauth_service");
			setTwitchTokens();
			break;
	}
}

$("#ohFuckOhShit").on("mouseup", function(e) {
	e.preventDefault();

	localStorage.removeItem("twitch_oauthRefreshToken");
	localStorage.removeItem("twitch_oauthAccessToken");
	localStorage.removeItem('spotify_accessToken');
	localStorage.removeItem('spotify_refreshToken');

	sessionStorage.setItem("_tokens_were_cleared", "true");

	postToChannel("reload");
	location.reload();
});

$(document).ready(function() {
	const check = sessionStorage.getItem("_tokens_were_cleared");

	if(check === "true") {
		addNotification("Cached Twitch and Spotify authentication tokens have been cleared, please reconnect to any services you were previously using.", {duration: 20});
	}

	sessionStorage.removeItem("_tokens_were_cleared");
})