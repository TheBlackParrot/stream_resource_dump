const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const scopes = ["user-read-playback-state", "user-read-currently-playing"];
const clientId = localStorage.getItem("setting_spotifyClientID");
const redirectUri = `${window.location.origin}${window.location.pathname}`;

function getRandomString(length) {
	let rand = [];

	for(let i = 0; i < length; i++) {
		let char = characters.charAt(Math.floor(Math.random() * characters.length));
		rand.push(char);
	}

	return rand.join("");
}

async function generateCodeChallenge(codeVerifier) {
	const encoder = new TextEncoder();
	const data = encoder.encode(codeVerifier);
	const digest = await window.crypto.subtle.digest('SHA-256', data);

	return btoa(String.fromCharCode.apply(null, new Uint8Array(digest))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const codeVerifier = getRandomString(128);

const params = new URLSearchParams(window.location.search);
const code = params.get('code');

function regenCodes() {
	if(!clientId) {
		console.log("Please set your Spotify App Client ID in the overlay settings panel.");
		return;
	}

	let refreshToken = localStorage.getItem("spotify_refreshToken");

	if(refreshToken) {
		let body = new URLSearchParams({
			grant_type: 'refresh_token',
			refresh_token: refreshToken,
			client_id: clientId
		});

		const response = fetch('https://accounts.spotify.com/api/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: body
		}).then(response => {
			if(!response.ok) {
				throw new Error('HTTP status ' + response.status);
				localStorage.removeItem("spotify_refreshToken");
				regenCodes();
			}

			return response.json();
		}).then(data => {
			localStorage.setItem('spotify_accessToken', data.access_token);
			localStorage.setItem('spotify_refreshToken', data.refresh_token);
			onSpotifyReady();
		}).catch(error => {
			console.error('Error:', error);
			localStorage.removeItem("spotify_refreshToken");
		});
	} else {
		generateCodeChallenge(codeVerifier).then(codeChallenge => {
			let state = getRandomString(16);

			localStorage.setItem('spotify_codeVerifier', codeVerifier);

			let args = new URLSearchParams({
				response_type: 'code',
				client_id: clientId,
				scope: scopes.join(" "),
				redirect_uri: redirectUri,
				state: state,
				code_challenge_method: 'S256',
				code_challenge: codeChallenge
			});

			window.location = 'https://accounts.spotify.com/authorize?' + args;
		});
	}
}

if(!code) {
	regenCodes();
} else {
	let codeVerifier = localStorage.getItem('spotify_codeVerifier');

	let body = new URLSearchParams({
		grant_type: 'authorization_code',
		code: code,
		redirect_uri: redirectUri,
		client_id: clientId,
		code_verifier: codeVerifier
	});

	const response = fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: body
	}).then(response => {
		if(!response.ok) {
			throw new Error('HTTP status ' + response.status);
			regenCodes();
		}

		return response.json();
	}).then(data => {
		localStorage.setItem('spotify_accessToken', data.access_token);
		localStorage.setItem('spotify_refreshToken', data.refresh_token);
		onSpotifyReady();
	}).catch(error => {
		console.error('Error:', error);
	});
}