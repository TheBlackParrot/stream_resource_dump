const currencySymbols = {
	USD: "$",
	CAD: "CA$",
	HKD: "HK$",
	GBP: "£",
	EUR: "€",
	JPY: "¥",
	INR: "₹",
	RUB: "₽",
	KRW: "₩",
	BRL: "R$",
	ZAR: "R",
	EGP: "£E",
	PHP: "₱",
	TRY: "₺",
	GEL: "₾",
	VND: "₫",
	NZD: "NZ$",
	SGD: "S$",
	TWD: "NT$",
	MXN: "$"
};

const subTiers = {
	"Prime": "Prime",
	"1000": "Tier 1",
	"2000": "Tier 2",
	"3000": "Tier 3"
};

const query = new URLSearchParams(location.search);
var allowedToProceed = true;

const twitchClientId = localStorage.getItem(`setting_twitchClientID`);
const twitchClientSecret = localStorage.getItem(`setting_twitchClientSecret`);
const broadcasterName = localStorage.getItem(`setting_twitchChannel`);

if(!broadcasterName || broadcasterName === "null") {
	allowedToProceed = false;
}

if(twitchClientId === "null" || twitchClientSecret === "null" || !twitchClientId || !twitchClientSecret) {
	allowedToProceed = false;
	console.log(`cached ID: ${twitchClientId}, cached secret: ${twitchClientSecret}`);
}

const streamlabsEventChannel = new BroadcastChannel("streamlabs");
streamlabsEventChannel.onmessage = function(message) {
	console.log(message);
	processStreamlabsEvent(message.data);
};

function processStreamlabsEvent(eventData) {
	console.log(eventData);
	let data = eventData.message[0];

	if(eventData.type === "donation") {
		sendEvent({name: data.from}, {text: `${data.formatted_amount} ${data.currency}`});
		addAlert({name: data.from, showPFP: false, html: `tipped <span class="alertBold alertThing">${data.formatted_amount} ${data.currency}</span> via Streamlabs!`, audio: "positive-game-sound-2.ogg"});
	}

	if(eventData.type === "treat") {
		// TODO: move this to treatstream's actual API in case something happens on streamlabs's side, always good to reduce points of failure.
		// (https://treatstream.com/api/details)
		// streamlabs will do in the meantime

		// worried some treat names might be too long
		// sendEvent({name: data.from}, {text: `SENT A ${data.title.toUpperCase()}`});
		sendEvent({name: data.from}, {text: `SENT A TREAT`});
		addAlert({name: data.from, showPFP: false, html: `sent a <span class="alertBold alertThing">${data.title}</span> via TreatStream!`, audio: "new-message-3.ogg"});
	}
}

const streamelementsEventChannel = new BroadcastChannel("streamelements");
streamelementsEventChannel.onmessage = function(message) {
	console.log(message);
	processStreamElementsEvent(message.data);
};

function processStreamElementsEvent(eventData) {
	console.log(eventData);
	let data = eventData.data;

	if(eventData.type === "tip") {
		let name = data.username;
		if("displayName" in data) {
			name = data.displayName;
		}

		let symbol = "";
		if(data.currency.toUpperCase() in currencySymbols) {
			symbol = currencySymbols[data.currency.toUpperCase()];
		}
		let formatted_amount = `${symbol}${data.amount} ${data.currency}`;
		let alertHtml = `tipped <span class="alertBold alertThing">${formatted_amount}</span> via StreamElements!`;

		sendEvent({name: name}, {text: formatted_amount});
		addAlert({name: name, showPFP: false, html: alertHtml, audio: "positive-game-sound-2.ogg"});
	}

	// using SE for now for follow alerts, i'd have to move to twitch's eventsub thing
	if(eventData.type === "follow") {
		let alertHtml = `Thanks for the follow! <div class="icon" style="background-image: url('icons/rareChar.webp');"><img src="icons/rareChar.webp"/></div>`;
		addAlert({showPFP: false, doTTS: false, html: alertHtml});
	}
}

const tiltifyFunctions = {
	"campaign": function(data) {
		// do nothing
	},

	"donations": function(data) {
		for(let i in data) {
			let donation = data[i];

			let symbol = "";
			let currency = donation.amount.currency.toUpperCase();
			if(currency in currencySymbols) {
				symbol = currencySymbols[currency];
			}
			let formatted_amount = `${symbol}${parseFloat(donation.amount.value).toFixed(2)} ${currency}`;

			let outObject = {
				text: `${formatted_amount}`,
				icon: "tiltify.png"
			}

			sendEvent({name: donation.donor_name}, outObject);
			addAlert({name: donation.donor_name, showPFP: false, doTTS: true, html: `donated <span class="alertBold alertThing">${formatted_amount}</span> to charity via Tiltify!`, audio: "positive-win-game-sound-3.ogg"});			
		}
	}
}

function startTiltifyWebsocket() {
	if(!query.get("useTiltify")) {
		console.log("Not connecting to a custom Tiltify event server, no events from that service");
		return;
	}

	console.log("Starting connection to Tiltify...");

	ws = new WebSocket("ws://127.0.0.1:7117");

	ws.addEventListener("message", function(msg) {
		var data = JSON.parse(msg.data);

		if(data.event in tiltifyFunctions) {
			tiltifyFunctions[data.event](data.data);
		}
	});

	ws.addEventListener("open", function() {
		console.log("Successfully connected to Tiltify");
	});

	ws.addEventListener("close", function() {
		console.log("Disconnected from Tiltify, trying again in 20 seconds...");
		setTimeout(startTiltifyWebsocket, 20000);
	});
}
startTiltifyWebsocket();

var lastAsk = Infinity;
function callTwitch(data, callback) {
	if(!allowedToProceed) {
		console.log("No Client ID or Secret is set.");
		return;
	}

	$.ajax({
		type: "GET",
		url: `https://api.twitch.tv/helix/${data.endpoint}`,
		headers: {
			"Authorization": `Bearer ${localStorage.getItem("twitch_accessToken")}`,
			"Client-Id": twitchClientId
		},

		data: data.args,

		error: function(data) {
			setTwitchHelixReachable(false);
		},

		statusCode: {
			200: function(data) {
				if(typeof callback === "function") {
					callback(data);
				}

				setTwitchHelixReachable(true);				
			},

			401: function() {
				console.log("token unauthorized");

				if(Date.now() < lastAsk) {
					postToTwitchEventChannel("RefreshAuthenticationToken");
					lastAsk = Date.now();
				}

				if(typeof callback === "function") {
					let queueObj = {
						callback: callback
					};

					if(typeof data !== "undefined") {
						queueObj.data = data;
					}

					callTwitchQueue.push(queueObj);
				}
			}
		}
	})	
}

function getBitAttrs(bits) {
	let outObject = {
		icon: "bits1.png",
		color: "#a1a1a1"
	};

	switch(true) {
		case bits >= 100 && bits < 1000: outObject.icon = "bits100.png"; outObject.color = "#d3a3ff"; break;
		case bits >= 1000 && bits < 5000: outObject.icon = "bits1000.png"; outObject.color = "#01f8d9"; break;
		case bits >= 5000 && bits < 10000: outObject.icon = "bits5000.png"; outObject.color = "#5fb2ff"; break;
		case bits >= 10000: outObject.icon = "bits10000.png"; outObject.color = "#ff4e5b"; break;
	}

	return outObject;
}

let previousEventData = {};
let previousMsgIconElem;
let previousMsgTextElem;
function sendEvent(nameData, eventData) {
	if(!("color" in nameData)) { nameData.color = "#FFF"; }

	if(!("color" in eventData)) { eventData.color = "#FFF"; }
	if(!("type" in eventData)) { eventData.type = "standard"; }
	if(!("cumulative" in eventData)) { eventData.cumulative = false; }

	eventData.name = nameData.name;

	//console.log(nameData);
	//console.log(eventData);

	let icon = ("icon" in eventData ? `<div class="icon" style="background-image: url('icons/${eventData.icon}');"><img src="icons/${eventData.icon}"/></div>` : "");

	let eventElem = $(`<div class="eventRow" style="display: none;" data-type="${eventData.type}" data-cumulative="${eventData.cumulative}"></div>`);
	let nameElem = $(`<span class="name" style="background-image: linear-gradient(170deg, #FFF 20%, var(--colorLight) 100%)">${nameData.name}</span>`);

	let msgTextElem = $(`<span class="msg" style="background-color: ${eventData.color};">${eventData.text}</span>`);
	let msgIconElem = $(`${icon}`);

	eventElem.append(nameElem).append(msgIconElem).append(msgTextElem);

	let isCumulative = (eventData.cumulative && eventData.cumulative === previousEventData.cumulative && eventData.type === previousEventData.type && nameData.name === previousEventData.name);
	if(isCumulative) {
		previousEventData.amount += eventData.amount;
		previousMsgTextElem.text(previousEventData.amount.toLocaleString());

		if(eventData.type === "cheer") {
			let newBitAttrs = getBitAttrs(previousEventData.amount);
			previousMsgTextElem.css("background-color", newBitAttrs.color);
			previousMsgIconElem.css("background-image", `url('icons/${newBitAttrs.icon}`);
			previousMsgIconElem.children("img").attr("src", `icons/${newBitAttrs.icon}`);
		}
	}

	if(!isCumulative) {
		$("#wrapper").append(eventElem);
		eventElem.fadeIn(500);
	}

	let eventCount = $(".eventRow").length - 1;
	$(".eventRow").each(function() {
		let e = $(this);

		let opacity = 1 - (eventCount * 0.15);

		if(opacity !== 1) {
			$(this).css("transition", ".5s").css("opacity", opacity);
			if(opacity <= 0) {
				setTimeout(function() {
					e.remove();
				}, 500);
			}
		}

		eventCount--;
	});

	previousEventData = eventData;
	previousMsgTextElem = msgTextElem;
	previousMsgIconElem = msgIconElem;
}

var alertQueue = [];
var processAlertsTO = null;

function addAlert(alertData) {
	//console.log(alertData);

	let nextStep = function() {
		if(!("reverse" in alertData)) { alertData.reverse = false; }
		if(!("doTTS" in alertData)) { alertData.doTTS = true; }

		alertQueue.push(alertData);

		if(processAlertsTO === null) {
			console.log("processing alerts...");
			processAlerts();
		}
	}

	if(alertData.showPFP) {
		callTwitch({
			"endpoint": "users",
			"args": {
				"login": alertData.username
			}
		}, function(rawUserResponse) {
			//console.log(rawUserResponse);
			alertData.pfp = rawUserResponse.data[0].profile_image_url;
			nextStep();
		});		
	} else {
		nextStep();
	}
}

function processAlerts() {
	let _thing = function() {
		processAlertsTO = null;

		if(!alertQueue.length) {
			$("#alert_wrapper").fadeOut(500);
			return;
		}

		doAlert();
	}

	if(!$(".alert").length) { 
		console.log("no previous alerts exist");
		_thing();
	} else {
		console.log("previous alerts exist");
		
		if($(".alertGoOut").length) {
			console.log("alert shouldn't be there, hm. removing it.");
			$(".alertGoOut").remove();
			_thing();
		}

		$(".alert").removeClass("alertComeIn").addClass("alertGoOut").one("animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd", _thing);
	}
}

function doAlert() {
	let alertData = alertQueue.splice(0, 1)[0];
	//console.log(alertData);

	$(".alert").remove();
	processAlertsTO = -1;

	$("#alert_wrapper").fadeIn(250, function() {
		//console.log("faded in");
		let alertParentElem = $('<div class="alert alertComeIn"></div>');
		let alertElem = $('<div class="alertChild alertHover"></div>');
		alertParentElem.append(alertElem);
		let ttsAudioElem = $('<audio id="tts" autoplay style="position: absolute; bottom: -300px;"></audio>');
		alertParentElem.append(ttsAudioElem);

		let alertNameElem = $('<span class="alertName"></span>');
		if("name" in alertData) {
			alertNameElem.append($(`<span class="alertNameStr">${alertData.name === "" ? alertData.username : alertData.name}</span>`));
		}
		if("pfp" in alertData) {
			alertNameElem.prepend($(`<img class="alertPFP" src="${alertData.pfp}"/>`));
		}

		let alertMsgElem = $('<span class="alertMsg"></span>');
		alertMsgElem.html(alertData.html);

		if(alertData.reverse) {
			alertElem.prepend(alertNameElem);
			alertElem.prepend(alertMsgElem);
		} else {
			alertElem.append(alertNameElem);
			alertElem.append(alertMsgElem);				
		}

		$("#alert_wrapper").append(alertParentElem);

		if("audio" in alertData) {
			let alertAudioElem = $(`<audio id="alertAudio" autoplay style="position: absolute; bottom: -300px;" src="sounds/${alertData.audio}"></audio>`);
			alertParentElem.append(alertAudioElem);

			alertAudioElem[0].oncanplaythrough = function(event) {
				alertAudioElem[0].play();
			}
		}

		if(alertData.doTTS) {
			const req = new XMLHttpRequest()
			req.open('POST', `https://tiktok-tts.weilnet.workers.dev/api/generation`, false)
			req.setRequestHeader('Content-Type', 'application/json')
			req.send(JSON.stringify({
				text: `${alertData.name === "" ? alertData.username : alertData.name} ${alertMsgElem.text()}`,
				voice: "en_us_001"
			}));

			let resp = JSON.parse(req.responseText);
			//console.log(resp);

			if(resp.data === null) {
				processAlertsTO = setTimeout(processAlerts, 7000);
			} else {
				ttsAudioElem[0].src = `data:audio/mpeg;base64,${resp.data}`;
				ttsAudioElem[0].volume = 0.67;
				ttsAudioElem[0].oncanplaythrough = function(event) {
					ttsAudioElem[0].play();
					processAlertsTO = -1;
				}
				ttsAudioElem[0].onended = function(event) {
					//console.log("ENDED");
					processAlertsTO = setTimeout(processAlerts, 2500);
				}
			}
		} else {
			processAlertsTO = setTimeout(processAlerts, 7000);
		}
	});
}

// absolutely frick you, twitch
var keepSkippingUntilZero = 0;
var callTwitchQueue = [];

const twitchEventFuncs = {
	cheer: function(data) {
		let channel = data.channel;
		let tags = data.tags;
		let msg = data.msg;

		let name = tags.username;
		if("display-name" in tags) {
			name = tags['display-name'];
		}

		let bits = ~~tags.bits;
		let bitAttrs = getBitAttrs(bits);
		let outObject = {
			type: "cheer",
			cumulative: true,
			amount: bits,
			text: bits.toLocaleString(),
			icon: bitAttrs.icon,
			color: bitAttrs.color
		};

		let alertHtml = `cheered with <div class="icon" style="background-image: url('icons/${outObject.icon.replace("png", "gif")}');"><img src="icons/${outObject.icon.replace("png", "gif")}"/></div> <span class="alertBold" style="background-color: ${outObject.color};">${outObject.text}</span> bits!`;

		sendEvent({name: name}, outObject);
		addAlert({username: tags.username, name: tags['display-name'], showPFP: true, doTTS: true, html: alertHtml, audio: "bits.ogg"});
	},

	resub: function(data) {
		let channel = data.channel;
		let username = data.username;
		let streak = data.streak;
		let message = data.message;
		let tags = data.tags;
		let methods = data.methods;

		let name = username;
		if("display-name" in tags) {
			name = tags['display-name'];
		}

		let months = ~~tags["msg-param-cumulative-months"];
		let plan = subTiers[methods.plan];
		let alertHtml = `resubscribed ${plan === "Prime" ? "with" : "at"} <span class="alertBold alertThing">${plan}</span> for <span class="alertBold alertThing">${months} months</span>!`;

		let outObject = {
			type: "resub",
			cumulative: false,
			text: `RESUB <span style="font-size: 14px;">x</span>${months}`,
			amount: months
		};

		sendEvent({name: name}, outObject);
		addAlert({username: username, name: tags['display-name'], showPFP: true, doTTS: true, html: alertHtml, audio: "new-message-2.ogg"});
	},

	subscription: function(data) {
		let channel = data.channel;
		let username = data.username;
		let message = data.message;
		let tags = data.tags;
		let methods = data.methods;

		let name = username;
		if("display-name" in tags) {
			name = tags['display-name'];
		}

		let plan = subTiers[methods.plan];
		let alertHtml = `subscribed ${plan === "Prime" ? "with" : "at"} <span class="alertBold alertThing">${plan}</span>!`;

		let outObject = {
			type: "sub",
			cumulative: false,
			text: "NEW SUB"
		};

		sendEvent({name: name}, outObject);
		addAlert({username: username, name: tags['display-name'], showPFP: true, doTTS: true, html: alertHtml, audio: "new-message-2.ogg"});
	},

	subgift: function(data) {
		if(keepSkippingUntilZero) {
			keepSkippingUntilZero--;
			return;
		}

		let channel = data.channel;
		let username = data.username;
		let streakMonths = data.streakMonths;
		let recipient = data.recipient;
		let methods = data.methods;
		let tags = data.tags;

		let name = username;
		if("display-name" in tags) {
			name = tags['display-name'];
		}

		let plan = subTiers[methods.plan];

		let recep = recipient;
		if("msg-param-recipient-display-name" in tags) {
			recep = tags["msg-param-recipient-display-name"];
		}

		let amount = 1;
		if("msg-param-gift-months" in tags) {
			amount = ~~tags["msg-param-gift-months"];
		}
		let amountStr = (amount > 1 ? `<span class="alertBold alertThing">${amount} months</span> of ` : "");

		let alertHtml = `gifted ${amountStr}a <span class="alertBold alertThing">${plan} subscription</span> to <span class="alertBold alertThing">${recep}</span>!`;

		let outObject = {
			type: "giftsub_single",
			cumulative: false,
			text: "GIFTED SUB",
			amount: amount
		};

		sendEvent({name: name}, outObject);
		addAlert({username: username, name: tags['display-name'], showPFP: true, doTTS: true, html: alertHtml, audio: "new-message-5.ogg"});
	},

	submysterygift: function(data) {
		let channel = data.channel;
		let username = data.username;
		let numbOfSubs = data.numbOfSubs;
		let methods = data.methods;
		let tags = data.tags;

		let name = username;
		if("display-name" in tags) {
			name = tags['display-name'];
		}

		let plan = subTiers[methods.plan];

		let amountStr = "GIFTED SUB";
		let alertHtml = `gifted a <span class="alertBold alertThing">${plan} subscription</span> to a viewer!`;
		if(numbOfSubs > 1) {
			amountStr = `GIFTED SUB <span style="font-size: 14px;">x</span>${numbOfSubs.toLocaleString()}`;
			alertHtml = `gifted <span class="alertBold alertThing">${numbOfSubs} ${plan} subscriptions</span> to viewers!`;
		}

		keepSkippingUntilZero = numbOfSubs;

		let outObject = {
			type: "giftsub",
			cumulative: true,
			amount: numbOfSubs,
			text: amountStr
		};

		sendEvent({name: name}, outObject);
		addAlert({username: username, name: tags['display-name'], showPFP: true, doTTS: true, html: alertHtml, audio: "new-message-5.ogg"});
	},

	raided: function(data) {
		let channel = data.channel;
		let username = data.username;
		let viewers = data.viewers;
		let tags = data.tags;

		let name = username;
		if("display-name" in tags) {
			name = tags['display-name'];
		}

		let alertHtml = `raided the channel with <span class="alertBold alertThing">${viewers.toLocaleString()} viewer${viewers > 1 ? "s" : ""}</span>!`;

		let outObject = {
			type: "raid",
			cumulative: false,
			amount: viewers,
			text: `RAID <span style="font-size: 14px;">x</span>${viewers.toLocaleString()}`
		};

		sendEvent({name: name}, outObject);
		addAlert({username: username, name: tags['display-name'], showPFP: true, doTTS: true, html: alertHtml, audio: "bonus-2.ogg"});
	},

	message: function(data) {
		let channel = data.channel;
		let message = data.message;
		let self = data.self;
		let tags = data.tags;

		if(self) {
			return;
		}

		let moderator = false;
		if("badges" in tags) {
			let badges = tags.badges;
			if(badges !== null) {
				if("moderator" in badges || "broadcaster" in badges) {
					moderator = true;
				}
			}
		}

		if(moderator) {
			let parts = message.split(" ");
			let cmd = parts[0].substr(1);

			if(cmd in msgFuncs) {
				msgFuncs[cmd]();
				return;
			}
		}

		if(hideAccounts.indexOf(tags.username) !== -1 || seenAccounts.indexOf(tags.username) !== -1) {
			return;
		}
		seenAccounts.push(tags.username);

		let name = tags.username;
		if("display-name" in tags) {
			name = tags['display-name'];
		}

		let showPFP = false;
		if("badges" in tags) {
			let badges = tags.badges;
			if(badges !== null) {
				if("vip" in badges || "moderator" in badges || "subscriber" in badges || "broadcaster" in badges) {
					showPFP = true;
				}
			}
		}

		let alertHtml = `${greetingMessages[Math.floor(Math.random() * greetingMessages.length)]}, `;

		let greetingSound = `greetings/greeting${Math.ceil(Math.random() * greetingSoundAmount)}.mp3`;
		if(tags.username.toLowerCase() in customGreetingSounds) {
			greetingSound = `greetings/customs/${customGreetingSounds[tags.username.toLowerCase()]}`;
		}

		addAlert({username: tags.username, name: name, showPFP: showPFP, html: alertHtml, doTTS: false, reverse: true, audio: greetingSound});
	},

	AccessTokenRefreshed: function(data) {
		lastAsk = Infinity;

		callTwitchQueue = callTwitchQueue.filter(function(queueObj) {
			if(typeof queueObj.callback === "function") {
				if("data" in queueObj) {
					callTwitch(queueObj.data, queueObj.callback);
				} else {
					queueObj.callback();
				}
			}

			return false;
		});
	}
};

const twitchEventChannel = new BroadcastChannel("twitch_chat");

var twitchHelixReachable = false;
function setTwitchHelixReachable(state) {
	twitchHelixReachable = state;
	postToSettingsChannel("TwitchHelixStatus", state);
}

twitchEventChannel.onmessage = function(message) {
	console.log(message);
	message = message.data;

	if(message.event in twitchEventFuncs) {
		if("data" in message) {
			twitchEventFuncs[message.event](message.data);
		} else {
			twitchEventFuncs[message.event]();
		}
	}
};

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

const hideAccounts = [
	"streamlabs",
	"streamelements",
	"kofistreambot",
	"nightbot",
	"nottheblackparrot",
	"moobot",
	"soundalerts",
	"sery_bot",
	"commanderroot",
	"wizebot",
	"fossabot",
	"blerp",
	"revolverlanceobot"
];
var seenAccounts = [];
var greetingMessages = [
	"Hello",
	"Hello there",
	"Hey",
	"Hey there",
	"Hi",
	"Hi there",
	"Welcome in",
	"Welcome on in",
	"Greetings"
];
var customGreetingSounds = {
	"ash_darkfire": "hello_gordon.wav",
	"electricjourney": "adora.wav",
	"swooshycueb": "landback2.ogg",
	"naevisabers": "necoarc.ogg",
	"rx_twit": "xp.ogg",
	"spinvvy": "06_-_Colour_Ringtone.ogg",
	"flaemmchenflame": "flaemmgreetings.ogg",
	"lanargaze": "Hello_-_Adele_Sound_effect.ogg",
	"kaifennec": "ayup.ogg",
	"didacthebiggecko": "GeckoWelcome.ogg",
	"duckenomics": "here_comes_pacman.ogg",
	"djdavid98": "among_us_impostor.ogg",
	"entenschaf": "wonderhoy.ogg",
	"karmageddon000": "is_anybody_at_home.ogg",
	"pasketi": "ur_my_friend_now.ogg",
	"saphirapendragon": "roadrunner_meep_meep.ogg",
	"nebelmonsterchen": "Hello_-_Adele_Sound_effect.ogg",
	"silvereagledev": "bird_up.ogg",
	"latinfoxy": "fox_hehehe.ogg",
	"gabrielhtx": "scout_circles.ogg",
	"dancepunkdragon": "sega_credit.ogg",
	"tormgart": "gnomed.ogg",
	"benny8oo8oo": "Benny_Moan.ogg",
	"empoleonics": "pocha.ogg"
};
var greetingSoundAmount = 11;

var msgFuncs = {
	skipalert: function() {
		clearTimeout(processAlertsTO);
		processAlerts();
	}
}

window.addEventListener("storage", function(event) {
	switch(event.key) {
		case "art_darkColor":
			$(":root").get(0).style.setProperty("--colorDark", event.newValue);
			break;

		case "art_lightColor":
			$(":root").get(0).style.setProperty("--colorLight", event.newValue);
			break;
	}
});
$(":root").get(0).style.setProperty("--colorLight", localStorage.getItem("art_lightColor"));
$(":root").get(0).style.setProperty("--colorDark", localStorage.getItem("art_darkColor"));

// these are sample IRC messages for testing
/*
let msgs = [
	`@badge-info=;badges=staff/1,bits/1000;bits=${Math.ceil(Math.random() * 99)};color=;display-name=ronni;emotes=;id=b34ccfc7-4977-403a-8a94-33c6bac34fb8;mod=0;room-id=12345678;subscriber=0;tmi-sent-ts=1507246572675;turbo=1;user-id=12345678;user-type=staff :ronni!ronni@ronni.tmi.twitch.tv PRIVMSG #ronni :cheer100`,
	`@badge-info=;badges=staff/1,bits/1000;bits=${100 + Math.ceil(Math.random() * 899)};color=;display-name=ronni;emotes=;id=b34ccfc7-4977-403a-8a94-33c6bac34fb8;mod=0;room-id=12345678;subscriber=0;tmi-sent-ts=1507246572675;turbo=1;user-id=12345678;user-type=staff :ronni!ronni@ronni.tmi.twitch.tv PRIVMSG #ronni :cheer100`,
	`@badge-info=;badges=staff/1,bits/1000;bits=${Math.ceil(Math.random() * 99)};color=;display-name=ronni2;emotes=;id=b34ccfc7-4977-403a-8a94-33c6bac34fb8;mod=0;room-id=12345678;subscriber=0;tmi-sent-ts=1507246572675;turbo=1;user-id=12345678;user-type=staff :ronni2!ronni2@ronni2.tmi.twitch.tv PRIVMSG #ronni2 :cheer100`,
	`@badge-info=;badges=staff/1,bits/1000;bits=${100 + Math.ceil(Math.random() * 899)};color=;display-name=ronni2;emotes=;id=b34ccfc7-4977-403a-8a94-33c6bac34fb8;mod=0;room-id=12345678;subscriber=0;tmi-sent-ts=1507246572675;turbo=1;user-id=12345678;user-type=staff :ronni2!ronni@ronni2.tmi.twitch.tv PRIVMSG #ronni2 :cheer100`,
	`@badge-info=;badges=staff/1,bits/1000;bits=${1000 + Math.ceil(Math.random() * 3999)};color=;display-name=ronni;emotes=;id=b34ccfc7-4977-403a-8a94-33c6bac34fb8;mod=0;room-id=12345678;subscriber=0;tmi-sent-ts=1507246572675;turbo=1;user-id=12345678;user-type=staff :ronni!ronni@ronni.tmi.twitch.tv PRIVMSG #ronni :cheer100`,
	`@badge-info=;badges=staff/1,bits/1000;bits=${5000 + Math.ceil(Math.random() * 4999)};color=;display-name=ronni;emotes=;id=b34ccfc7-4977-403a-8a94-33c6bac34fb8;mod=0;room-id=12345678;subscriber=0;tmi-sent-ts=1507246572675;turbo=1;user-id=12345678;user-type=staff :ronni!ronni@ronni.tmi.twitch.tv PRIVMSG #ronni :cheer100`,
	`@badge-info=;badges=staff/1,bits/1000;bits=${10000 + Math.ceil(Math.random() * 89999)};color=;display-name=ronni;emotes=;id=b34ccfc7-4977-403a-8a94-33c6bac34fb8;mod=0;room-id=12345678;subscriber=0;tmi-sent-ts=1507246572675;turbo=1;user-id=12345678;user-type=staff :ronni!ronni@ronni.tmi.twitch.tv PRIVMSG #ronni :cheer100`,

	`@badge-info=;badges=staff/1,broadcaster/1,turbo/1;color=#008000;display-name=ronni;emotes=;id=db25007f-7a18-43eb-9379-80131e44d633;login=ronni;mod=0;msg-id=resub;msg-param-cumulative-months=${Math.ceil(Math.random() * 100)};msg-param-streak-months=2;msg-param-should-share-streak=1;msg-param-sub-plan=Prime;msg-param-sub-plan-name=Prime;room-id=12345678;subscriber=1;system-msg=ronni\shas\ssubscribed\sfor\s6\smonths!;tmi-sent-ts=1507246572675;turbo=1;user-id=87654321;user-type=staff :tmi.twitch.tv USERNOTICE #dallas :Great stream -- keep it up!`,
	`@badge-info=;badges=staff/1,broadcaster/1,turbo/1;color=#008000;display-name=ronni;emotes=;id=db25007f-7a18-43eb-9379-80131e44d633;login=ronni;mod=0;msg-id=sub;msg-param-sub-plan=Prime;msg-param-sub-plan-name=Prime;room-id=12345678;subscriber=1;system-msg=ronni\shas\ssubscribed!;tmi-sent-ts=1507246572675;turbo=1;user-id=87654321;user-type=staff :tmi.twitch.tv USERNOTICE #dallas :Great stream -- keep it up!`,

	`@badge-info=;badges=staff/1,premium/1;color=#0000FF;display-name=TWW2;emotes=;id=e9176cd8-5e22-4684-ad40-ce53c2561c5e;login=tww2;mod=0;msg-id=subgift;msg-param-months=1;msg-param-recipient-display-name=Mr_Woodchuck;msg-param-recipient-id=55554444;msg-param-recipient-name=mr_woodchuck;msg-param-sub-plan-name=House\sof\sNyoro~n;msg-param-sub-plan=1000;room-id=19571752;subscriber=0;system-msg=TWW2\sgifted\sa\sTier\s1\ssub\sto\sMr_Woodchuck!;tmi-sent-ts=1521159445153;turbo=0;user-id=87654321;user-type=staff :tmi.twitch.tv USERNOTICE #forstycup`,

	`@badge-info=;badges=turbo/1;color=#9ACD32;display-name=TestChannel;emotes=;id=3d830f12-795c-447d-af3c-ea05e40fbddb;login=testchannel;mod=0;msg-id=raid;msg-param-displayName=TestChannel;msg-param-login=testchannel;msg-param-viewerCount=15;room-id=33332222;subscriber=0;system-msg=15\sraiders\sfrom\sTestChannel\shave\sjoined\n!;tmi-sent-ts=1507246572675;turbo=1;user-id=123456;user-type= :tmi.twitch.tv USERNOTICE #othertestchannel`,

	"@badge-info=;badges=moderator/1;color=#FF69B4;display-name=NotTheBlackParrot;emotes=;flags=;id=7017cc92-5bdb-4290-ac54-2bad4f702837;login=nottheblackparrot;mod=1;msg-id=raid;msg-param-displayName=NotTheBlackParrot;msg-param-login=nottheblackparrot;msg-param-profileImageURL=https://static-cdn.jtvnw.net/user-default-pictures-uv/cdd517fe-def4-11e9-948e-784f43822e80-profile_image-%s.png;msg-param-viewerCount=1;room-id=43464015;subscriber=0;system-msg=1\sraiders\sfrom\sNotTheBlackParrot\shave\sjoined!;tmi-sent-ts=1687242824156;user-id=738319562;user-type=mod :tmi.twitch.tv USERNOTICE #theblackparrot"
];
*/

/*
setTimeout(function() {
	let msgs = [
		`@badge-info=;badges=staff/1,bits/1000;bits=${Math.ceil(Math.random() * 99)};color=;display-name=ronni;emotes=;id=b34ccfc7-4977-403a-8a94-33c6bac34fb8;mod=0;room-id=12345678;subscriber=0;tmi-sent-ts=1507246572675;turbo=1;user-id=12345678;user-type=staff :ronni!ronni@ronni.tmi.twitch.tv PRIVMSG #ronni :cheer100`,
		`@badge-info=;badges=staff/1,bits/1000;bits=${100 + Math.ceil(Math.random() * 899)};color=;display-name=ronni;emotes=;id=b34ccfc7-4977-403a-8a94-33c6bac34fb8;mod=0;room-id=12345678;subscriber=0;tmi-sent-ts=1507246572675;turbo=1;user-id=12345678;user-type=staff :ronni!ronni@ronni.tmi.twitch.tv PRIVMSG #ronni :cheer100`,
		`@badge-info=;badges=staff/1,bits/1000;bits=${Math.ceil(Math.random() * 99)};color=;display-name=ronni2;emotes=;id=b34ccfc7-4977-403a-8a94-33c6bac34fb8;mod=0;room-id=12345678;subscriber=0;tmi-sent-ts=1507246572675;turbo=1;user-id=12345678;user-type=staff :ronni2!ronni2@ronni2.tmi.twitch.tv PRIVMSG #ronni2 :cheer100`,
		`@badge-info=;badges=staff/1,bits/1000;bits=${100 + Math.ceil(Math.random() * 899)};color=;display-name=ronni2;emotes=;id=b34ccfc7-4977-403a-8a94-33c6bac34fb8;mod=0;room-id=12345678;subscriber=0;tmi-sent-ts=1507246572675;turbo=1;user-id=12345678;user-type=staff :ronni2!ronni@ronni2.tmi.twitch.tv PRIVMSG #ronni2 :cheer100`,
		`@badge-info=;badges=turbo/1;color=#9ACD32;display-name=TestChannel;emotes=;id=3d830f12-795c-447d-af3c-ea05e40fbddb;login=testchannel;mod=0;msg-id=raid;msg-param-displayName=TestChannel;msg-param-login=testchannel;msg-param-viewerCount=15;room-id=33332222;subscriber=0;system-msg=15\sraiders\sfrom\sTestChannel\shave\sjoined\n!;tmi-sent-ts=1507246572675;turbo=1;user-id=123456;user-type= :tmi.twitch.tv USERNOTICE #othertestchannel`
	];

	for(let i = 0; i < msgs.length; i++) {
		let msg = msgs[i];

		setTimeout(function() {
			client._onMessage({
				data: msg
			});
		}, 1000 + (i*5000));
	}
}, 1000);
*/