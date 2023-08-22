var goals = {
	subs: {
		title: "New and Gifted Subs (Monthly)",
		goal: 25,
		type: "value"
	},

	tips: {
		title: "Ensure I'm safe to move out",
		goal: 1000,
		type: "currency",
		charity: false
	}
};

for(let goal in goals) {
	goals[goal].current = parseFloat(localStorage.getItem(`current_${goal}`)) || 0;
}

const query = new URLSearchParams(location.search);
if(!localStorage.getItem(`sl_socketToken`) || localStorage.getItem(`sl_socketToken`) === "null" || query.get("streamlabsToken") !== null) {
	localStorage.setItem(`sl_socketToken`, query.get("streamlabsToken"));
}

const tiltifyFunctions = {
	"campaign": function(data) {
		if(!(data.campaign in goals)) {
			return;
		}

		setTracker(data.campaign, parseFloat(data.data.amount_raised.value));
	},

	"donations": function(data) {
		let addAmount = 0;

		if(!(data.campaign in goals)) {
			return;
		}

		let donos = data.data;
		for(let i in donos) {
			addAmount += parseFloat(donos[i].amount.value);
		}

		if(addAmount) {
			setTracker(data.campaign, goals[data.campaign].current + addAmount);
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

		console.log(data);

		if(data.event in tiltifyFunctions) {
			tiltifyFunctions[data.event](data);
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

function getPaddedCurrency(value) {
	return value % 1 !== 0 ? value.toFixed(2) : value;
}

function setFields(which) {
	let goal = goals[which];

	$("#goalTitle").text(goal.title);
	$("#goalCurrent").text(goal.type === "currency" ? getPaddedCurrency(goal.current) : goal.current);
	$("#goalGoal").text(goal.type === "currency" ? getPaddedCurrency(goal.goal) : goal.goal);

	if(goal.type === "currency") {
		$("#goalCurrent, #goalGoal").addClass("currency");
	} else {
		$("#goalCurrent, #goalGoal").removeClass("currency");
	}

	$("#goalBar").css("width", `${Math.min((goal.current / goal.goal)*100, 100)}%`);
}

var activeTracker;
var trackerShowTO;
function showTracker(which) {
	clearTimeout(trackerShowTO);

	let goal = goals[which];
	activeTracker = which;

	$("#wrapper").fadeOut(300, function() {
		setFields(which);

		$("#wrapper").fadeIn(300, function() {
			trackerShowTO = setTimeout(function() {
				let keys = Object.keys(goals);

				let curIdx = keys.indexOf(which);
				let maxIdx = keys.length - 1;
				let nextIdx = curIdx + 1;

				if(curIdx === maxIdx) {
					nextIdx = 0;
				}

				showTracker(keys[nextIdx]);
			}, 15000);
		});
	});
}
showTracker(Object.keys(goals)[0]);

function setTracker(which, value) {
	if(!(which in goals)) { return; }

	goals[which].current = value;
	localStorage.setItem(`current_${which}`, value);

	if(which === activeTracker) {
		setFields(which);
	}
}

const broadcasterName = localStorage.getItem(`setting_twitchChannel`);
var allowedToProceed = true;

if(!broadcasterName || broadcasterName === "null") {
	allowedToProceed = false;
	console.log("No channel is set, use ?channel=channel in your URL");
}

var twitchHelixReachable = false;
function setTwitchHelixReachable(state) {
	twitchHelixReachable = state;
	postToSettingsChannel("TwitchHelixStatus", state);
}

var keepSkippingUntilZero = 0;
const twitchEventFuncs = {
	subscription: function(data) {
		setTracker("subs", goals.subs.current + 1);
	},

	subgift: function(data) {
		if(keepSkippingUntilZero) {
			keepSkippingUntilZero--;
			return;
		}

		setTracker("subs", goals.subs.current + 1);
	},

	submysterygift: function(data) {
		keepSkippingUntilZero = data.numbOfSubs;
		setTracker("subs", goals.subs.current + data.numbOfSubs);
	},

	message: function(data) {
		let channel = data.channel;
		let tags = data.tags;
		let message = data.message;
		let self = data.self;

		if(self) {
			return;
		}

		if("badges" in tags) {
			let badges = tags.badges;
			if(badges !== null) {
				if(!("moderator" in badges || "broadcaster" in badges)) {
					return;
				}
			} else {
				return;
			}
		} else {
			return;
		}

		let parts = message.split(" ");
		switch(parts[0]) {
			case "!goalset":
				if(parts[1] in goals) {
					let value = 0;
					if(parts.length === 3) {
						if(!isNaN(parseFloat(parts[2]))) {
							setTracker(parts[1], parseFloat(parts[2]));
						}
					}
				}
				break;

			case "!goaladd":
				if(parts[1] in goals) {
					let value = 0;
					if(parts.length === 3) {
						if(!isNaN(parseFloat(parts[2]))) {
							setTracker(parts[1], goals[parts[1]].current + parseFloat(parts[2]));
						}
					}
				}
				break;
		}
	}
};

const twitchEventChannel = new BroadcastChannel("twitch_chat");

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