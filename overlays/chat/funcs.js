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
			systemMessage("Twitch authentication token error, fetching a new one...");

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

async function systemMessage(msg) {
	let tagsObject = {
		"username": "<system>",
		"display-name": `Chat Overlay (r${overlayRevision})`,
		"user-id": "-1",
		"is-overlay-message": true,
		"message-type": "system",
		"emotes": null,
		"id": `system-${Date.now()}`,
		"color": "#ffffff"
	}

	await prepareMessage(tagsObject, msg, false, false);
}

function formatTime(val) {
	let secs = val % 60;
	let mins = Math.floor(val / 60);

	return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function parse7TVColor(color) {
	if(!color) {
		return "#000";
	}

	let red = (color >> 24) & 0xFF;
	let green = (color >> 16) & 0xFF;
	let blue = (color >> 8) & 0xFF;
	let alpha = (color & 0xFF);

	return `rgba(${red}, ${green}, ${blue}, ${alpha/255})`;
}

function parseFFZModifiers(value) {
	let out = [];

	for(let modifier in ffzModifiers) {
		let modValue = ffzModifiers[modifier];
		if((value & modValue) === modValue) {
			out.push(modifier);
		}
	}

	return out;
}

function set7TVPaint(nameBlock, paintID, userID, force) {
	if(!(paintID in sevenTVEntitlements) && !force) {
		return;
	}

	const paint = sevenTVEntitlements[paintID].data;
	let css = "";
	let bgColor = parse7TVColor(paint.color);

	if(paint.image_url !== "") {
		css = `url(${paint.image_url})`;
	} else {
		let stops = [];

		for(const stop of paint.stops) {
			stops.push(`${parse7TVColor(stop.color)} ${stop.at*100}%`);
		}
		
		let func = paint.function.replaceAll("_", "-").toLowerCase();
		if(paint.repeat) {
			func = `repeating-${func}`;
		}

		let angle = `${paint.angle}deg`
		if(paint.function === "RADIAL_GRADIENT") {
			//angle = `${paint.shape} at ${paint.angle}%`;
			angle = `${paint.shape} at center`;
		}

		css = `${func}(${angle}, ${stops.join(",")})`;
	}

	let shadows = "";
	if("shadows" in paint) {
		let shadowsArr = [];
		if(paint.shadows.length) {
			for(const s of paint.shadows) {
				shadowsArr.push(`drop-shadow(${s.x_offset}px ${s.y_offset}px ${s.radius}px ${parse7TVColor(s.color)})`);
			}
			shadows = shadowsArr.join(" ");
		}
	}

	if(paint.color !== null) {
		nameBlock.children().css("background-color", bgColor);
	}

	nameBlock.children().css("background-image", css).css("background-size", "contain");
	nameBlock.children(".displayName").css("filter", `var(--effectFilters) ${shadows}`);
	nameBlock.children(".internationalName").css("filter", `var(--effectFilters) ${shadows} saturate(var(--internationalNameSaturation))`);
}

function linearInterpolate(a, b, val) {
	return a + (b - a) * val;
};

function colorObjectToHex(obj) {
	let r = Math.round(obj.r).toString(16).padStart(2, "0");
	let g = Math.round(obj.g).toString(16).padStart(2, "0");
	let b = Math.round(obj.b).toString(16).padStart(2, "0");
	let a = Math.round(obj.a).toString(16).padStart(2, "0");

	return `#${r}${g}${b}${a}`;
}

function interpolateColor(colorA, colorB, amount) {
	if(colorA[0] !== "#") { return "#FF00FFFF"; }
	if(colorA.length === 7) { colorA = `${colorA}FF`; }
	if(colorB[0] !== "#") { return "#FF00FFFF"; }
	if(colorB.length === 7) { colorB = `${colorB}FF`; }

	amount = parseFloat(amount);
	if(amount < 0) { amount = 0; }
	if(amount > 100) { amount = 100; }

	let colorIntA = parseInt(colorA.replace("#", ""), 16);
	let colorIntB = parseInt(colorB.replace("#", ""), 16);

	let originalA = {
		r: (colorIntA >> 24) & 0xFF,
		g: (colorIntA >> 16) & 0xFF,
		b: (colorIntA >> 8) & 0xFF,
		a: (colorIntA & 0xFF),
	}
	if(amount === 0) { return colorObjectToHex(originalA); }
	let originalB = {
		r: (colorIntB >> 24) & 0xFF,
		g: (colorIntB >> 16) & 0xFF,
		b: (colorIntB >> 8) & 0xFF,
		a: (colorIntB & 0xFF),
	}
	if(amount === 100) { return colorObjectToHex(originalB); }

	let adjusted = {
		r: linearInterpolate(originalA.r, originalB.r, amount / 100),
		g: linearInterpolate(originalA.g, originalB.g, amount / 100),
		b: linearInterpolate(originalA.b, originalB.b, amount / 100),
		a: originalA.a
	};
	return colorObjectToHex(adjusted);
}

function getYIQ(rawColor) {
	if(rawColor[0] !== "#") { return 0; }
	if(rawColor.length > 7) { rawColor = rawColor.substring(0, 7); }

	let colorInt = parseInt(rawColor.replace("#", ""), 16);
	let color = {
		r: (colorInt >> 16) & 0xFF,
		g: (colorInt >> 8) & 0xFF,
		b: (colorInt & 0xFF)
	}

	return ((color.r*299)+(color.g*587)+(color.b*114))/1000;
}

function ensureSafeColor(color) {
	let minBrightness = (parseFloat(localStorage.getItem("setting_nameColorMinBrightness"))/100) * 255;
	let maxBrightness = (parseFloat(localStorage.getItem("setting_nameColorMaxBrightness"))/100) * 255;

	if(color !== "var(--defaultNameColor)") {
		let brightness = getYIQ(color);
		console.log(`brightness for ${color} is ${brightness}`);

		if(brightness < minBrightness) {
			console.log(`${color} is too dark`);
			color = interpolateColor(color, "#FFFFFF", (minBrightness/255)*100);
			console.log(`set to ${color}`);
		} else if(brightness > maxBrightness) {
			console.log(`${color} is too bright`);
			color = interpolateColor("#000000", color, (maxBrightness/255)*100);
			console.log(`set to ${color}`);
		}
	}

	return color;
}

function rootCSS() {
	return document.querySelector("html").style;
}

function randomFloat(min, max) {
	if(typeof min === "undefined") { min = 0; }
	if(typeof max === "undefined") { max = 1; }

	if(min > max) { return NaN; }
	else if(min === max) { return min; }

	return min + (Math.random() * (max - min));
}

function randomInt(min, max) {
	return Math.round(randomFloat(min, max));
}

var manualBotOverrides = {
	add: [],
	remove: []
};
var knownBots = [];
async function getKnownBotsList() {
	console.log("getting known bots list...");

	if(sessionStorage.getItem("cache_knownBots") === null) {
		console.log("known bot list hasn't been cached");

		var url = new URL('https://api.twitchinsights.net/v1/bots/all');
		const fetchResponse = await fetch(url, {
			method: "GET",
			cache: "no-cache"
		});

		if(!fetchResponse.ok) {
			console.log("couldn't fetch known bot list :(");
			return [];
		}

		let data = await fetchResponse.json();
		console.log("fetched known bot list");

		if(!data) {
			return [];
		}
		if(!("bots" in data)) {
			return [];
		}

		// seems like twitch insights is caching, some other account ID? wtf
		// names work though
		knownBots = [];
		for(const bot of data.bots) {
			knownBots.push(bot[0]);
		}

		sessionStorage.setItem("cache_knownBots", JSON.stringify(knownBots));
		return knownBots;
	} else {
		console.log("using cached known bot list");

		knownBots = JSON.parse(sessionStorage.getItem("cache_knownBots"));
		if(knownBots === null) {
			console.log("last known bot cache was empty? uh");
			return [];
		}
		return knownBots;
	}
}

function isUserBot(username) {
	if(knownBots.indexOf(username) !== -1) { 
		if(manualBotOverrides.remove.indexOf(username) === -1) {
			return true;
		} else {
			return false;
		}
	}

	if(manualBotOverrides.add.indexOf(username) !== -1) {
		return true;
	} else {
		return false;
	}
}

function isWordSafe(word) {
	const harsherFilterWords = localStorage.getItem("setting_bigNoNoWords").split("\n").filter(function(word) {
		if(word !== "") {
			return true;
		}
		return false;
	});
	const softerFilterWords = localStorage.getItem("setting_bigNoNoWordsWordSpecific").split("\n").filter(function(word) {
		if(word !== "") {
			return true;
		}
		return false;
	});

	const bigNoNoWords = [].concat(harsherFilterWords, softerFilterWords);
	word = word.trim().toLowerCase().replace(/[\d,!-/,:-@,[-`,{-~]/gi, "");

	if(bigNoNoWords.indexOf(word) !== -1) {
		return false;
	}

	let devolved = word.split("").map(function(char) {
		if(char in characterDevolveMap) {
			return characterDevolveMap[char];
		}
		return char;
	}).join("");

	if(bigNoNoWords.indexOf(devolved) !== -1) {
		console.log(bigNoNoWords.indexOf(devolved));
		return false;
	}

	return true;
}

function isStringSafe(data) {
	const bigNoNoWords = localStorage.getItem("setting_bigNoNoWords").split("\n").filter(function(word) {
		if(word !== "") {
			return true;
		}
		return false;
	});

	let words = data.trim().toLowerCase().replace(/[\d,!-/,:-@,[-`,{-~]/gi, "").split(" ");

	for(const word of words) {
		if(bigNoNoWords.indexOf(word) !== -1) {
			return false;
		}
	}

	let devolved = words.join("").split("").map(function(char) {
		if(char in characterDevolveMap) {
			return characterDevolveMap[char];
		}
		return char;
	}).join("");

	if(bigNoNoWords.indexOf(devolved) !== -1) {
		console.log(bigNoNoWords.indexOf(devolved));
		return false;
	}

	return true;
}

function initEmoteSet() {
	chatEmotes = new GlobalEmoteSet();

	if(localStorage.getItem("setting_chatShowCommonEmotes") === "true") {
		for(let emoteName in commonEmotes) {
			let emote = commonEmotes[emoteName];

			chatEmotes.addEmote(new Emote({
				service: "default",
				emoteName: emoteName,
				urls: {
					high: emote.url,
					low: emote.url
				},
				global: true
			}));
		}
	}
}

async function fetchBlob(url) {
	const controller = new AbortController();
	const timedOutID = setTimeout(() => controller.abort(), parseInt(localStorage.getItem("setting_ajaxTimeout")) * 1000);

	var response;
	try {
		response = await fetch(url, { signal: controller.signal });
	} catch(err) {
		console.log(`failed to fetch ${url}`);
		return null;
	}

	if(!response.ok) {
		console.log(`failed to fetch ${url}, response was not ok`);
		return null;
	}

	const type = response.headers.get("Content-Type");
	const blob = await response.blob();

	return {type: type, blob: blob};
}

async function compressAvatarBlob(blob, size, quality, encode) {
	const bitmap = await createImageBitmap(blob.blob);

	let canvas = document.createElement('canvas');
	let ctx = canvas.getContext('2d');
	
	canvas.height = canvas.width = size;
	ctx.drawImage(bitmap, 0, 0, size, size);

	if(encode) {
		if(blob.type !== "image/png") {
			return {data: canvas.toDataURL("image/jpeg", quality), type: "image/jpeg"};
		} else {
			return {data: canvas.toDataURL("image/png"), type: "image/png"};
		}
	} else {
		if(blob.type !== "image/png") {
			const newBlob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
			return {data: newBlob, type: "image/jpeg"};
		} else {
			const newBlob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
			return {data: newBlob, type: "image/png"};
		}
	}
}

async function getCachedBeatSaverUserData(url) {
	const cacheStorage = await caches.open("beatSaverCache");

	var cachedResponse = await cacheStorage.match(url);
	if(!cachedResponse) {
		const newResponse = await fetch(url);
		if(!newResponse.ok) {
			return {};
		}
		var userData = await newResponse.text();
		var userDataJSON = JSON.parse(userData);

		cachedResponse = new Response(userData, {
			headers: {
				'Content-Type': "application/json",
				'X-Cache-Timestamp': Date.now()
			}
		});
		await cacheStorage.put(`https://api.beatsaver.com/users/id/${userDataJSON.id}`, cachedResponse);		
	} else {
		const cacheTimestamp = parseInt(cachedResponse.headers.get("X-Cache-Timestamp"));
		if(Date.now() - cacheTimestamp > 2592000000) {
			// 30 days has passed since last fetch, refetch
			console.log(`cached user data for ${url} is stale, re-fetching...`);
			cacheStorage.delete(url);
			return await getCachedBeatSaverUserData(url);
		}

		return await cachedResponse.json();
	}

	cachedResponse = await cacheStorage.match(url);
	return await cachedResponse.json();
}

async function getCachedMapData(url) {
	const cacheStorage = await caches.open("beatSaverCache");

	var cachedResponse = await cacheStorage.match(url);
	if(!cachedResponse) {
		const newResponse = await fetch(url);
		if(!newResponse.ok) {
			return {};
		}
		var mapData = await newResponse.json();

		// getting more uploader data since the one in the maps endpoints aren't actually the full uploader response
		mapData.uploader = await getCachedBeatSaverUserData(`https://api.beatsaver.com/users/id/${mapData.uploader.id}`);

		cachedResponse = new Response(JSON.stringify(mapData), {
			headers: {
				'Content-Type': "application/json",
				'X-Cache-Timestamp': Date.now()
			}
		});
		await cacheStorage.put(`https://api.beatsaver.com/maps/hash/${mapData.versions[0].hash}`, await cachedResponse.clone());
		await cacheStorage.put(`https://api.beatsaver.com/maps/id/${mapData.id}`, cachedResponse);
	} else {
		const cacheTimestamp = parseInt(cachedResponse.headers.get("X-Cache-Timestamp"));
		if(Date.now() - cacheTimestamp > 7776000000) {
			// 90 days has passed since last fetch, refetch
			console.log(`cached map data for ${url} is stale, re-fetching...`);
			cacheStorage.delete(url);
			return await getCachedMapData(url);
		}

		return await cachedResponse.json();
	}

	cachedResponse = await cacheStorage.match(url);
	return await cachedResponse.json();
}

function getSmoothMatrix(size, threshold) {
	let matrix = [];
	let center = Math.floor(size / 2);
	let highest;

	for(let x = 0; x < size; x++) {
		let row = [];

		for(let y = 0; y < size; y++) {
			// distance formula we love the pythagorean theorem
			let val = Math.sqrt(Math.pow(center - x, 2) + Math.pow(center - y, 2));

			if(!highest) {
				// the corners will always be the furthest away from the center, so get it now
				highest = val;
			}

			// we need an inverted percentage of the highest distance as we *don't* want the corners taken into account for the matrix
			// also threshold it
			let perc = Math.abs((val / highest)-1);
			row[y] = (perc > threshold ? 1 : 0);
		}

		matrix.push(row.join(" "));
	}
	return matrix;
}

function isEmoteIgnored(emote) {
	const softList = localStorage.getItem("setting_bigNoNoEmotes").split("\n")
						.map(function(x) { return x.trim(); })
						.filter(function(x) { return x.length > 0; });
	const hardList = localStorage.getItem("setting_bigNoNoEmotesEmoteSpecific").split("\n")
						.map(function(x) { return x.trim(); })
						.filter(function(x) { return x.length > 0; });

	for(const check of hardList) {
		if(check === emote) {
			return true;
		}
	}

	for(const check of softList) {
		if(emote.indexOf(check) !== -1) {
			return true;
		}
	}

	return false;
}

function parseComplexTag(tags, tagKey, splA = ",", splB = "/", splC) {
	const raw = tags[tagKey];
	if (raw === void 0) {
		return tags;
	}
	const tagIsString = typeof raw === "string";
	tags[`${tagKey}-raw`] = tagIsString ? raw : null;
	if (raw === true) {
		tags[tagKey] = null;
		return tags;
	}
	tags[tagKey] = {};
	if (tagIsString) {
		const spl = raw.split(splA);
		for (let i = 0; i < spl.length; i++) {
			const parts = spl[i].split(splB);
			let [, val] = parts;
			if (splC !== void 0 && val) {
	  			val = val.split(splC);
			}
			tags[tagKey][parts[0]] = val || null;
		}
	}
	return tags;
}