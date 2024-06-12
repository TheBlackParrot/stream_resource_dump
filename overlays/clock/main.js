const fixTZCodes = {
	"Philippine Standard Time": "PHT"
};

function setTZ() {
	const dt = luxon.DateTime.local();

	const tz = {
		name: dt.offsetNameLong.split(" "),
		initials: dt.offsetNameShort,
		prefix: "",
		offset: dt.offset / 60
	};

	if(dt.offsetNameLong in fixTZCodes) {
		tz.initials = fixTZCodes[dt.offsetNameLong];
	} else {
		if(!tz.initials) {
			for(const word of tz.name) {
				tz.initials += word[0].toUpperCase();
			}
		} else {
			if(tz.initials.substr(0, 4) === "GMT-" || tz.initials.substr(0, 4) === "GMT+") {
				tz.initials = "";
				for(const word of tz.name) {
					tz.initials += word[0].toUpperCase();
				}
			}
		}
	}

	if(tz.offset < 0) { 
		tz.prefix = "";
	} else if(tz.offset > 0) {
		tz.prefix = "+";
	}

	console.log(tz);

	const replacers = {
		"%zi": tz.initials,
		"%zo": `${tz.prefix}${tz.offset}`,
		"%zn": dt.offsetNameLong
	};

	$(".head").each(function(item) {
		const which = $(this).parent().parent().attr("id");
		let text = localStorage.getItem(`setting_clock_${which}HeaderString`);

		for(const replacer in replacers) {
			text = text.replaceAll(replacer, replacers[replacer]);
		}

		$(this).text(text);
	});
}

function parseTime(val) {
	val = parseInt(val/1000);

	var h = Math.floor(val/60/60).toString();
	var m = (Math.floor(val/60) % 60).toString();
	var s = (val % 60).toString();

	if(localStorage.getItem("setting_clock_ignoreHour") === "true") {
		if(h === "0") {
			h = "";
			if(parseInt(m) < 10 && localStorage.getItem("setting_clock_padHour") === "true") {
				m = m.padStart(2, "0");
			}
		} else {
			if(parseInt(m) < 10) {
				m = m.padStart(2, "0");
			}
		}
	} else {
		if(localStorage.getItem("setting_clock_padHour") === "true") {
			h = h.padStart(2, "0");
		}
		m = m.padStart(2, "0");
	}

	return {
		hour: h,
		minute: m,
		second: s.padStart(2, "0")
	};
}

function doMainClock() {
	const d = new Date();

	let h = d.getHours();
	if(localStorage.getItem("setting_clock_use12Hour") === "true") {
		$("#localTime .meridiem").text(h >= 12 ? " PM" : " AM");
		h = (h > 12 ? h % 12 : h);
		if(!h) { h = 12; }
	} else {
		$("#localTime .meridiem").empty();
	}

	if(localStorage.getItem("setting_clock_padHour") === "true") {
		h = h.toString().padStart(2, "0");
	}

	let m = d.getMinutes().toString().padStart(2, "0");
	let s = d.getSeconds().toString().padStart(2, "0");

	$("#localTime .main").text(`${h}:${m}`);
	$("#localTime .second").text(s);
}

function doUptimeClock() {
	const uptime = Date.now() - new Date(streamData.started_at).getTime();
	const timeString = parseTime(uptime);

	$("#streamUptime .main").text(`${timeString.hour === "" ? "" : `${timeString.hour}:`}${timeString.minute}`);
	$("#streamUptime .second").text(timeString.second);
}

function doAdClock() {
	var timeLeft = nextAdBreak - Date.now();
	if(timeLeft < 0) {
		timeLeft = 0;
	}
	var timeString = parseTime(Math.abs(timeLeft));
	if(timeLeft === 0) {
		$("#nextAd .main").text("NOW");

		$("#nextAd .second").hide();
	} else {
		$("#nextAd .main").text(`${timeString.hour === "" ? "" : `${timeString.hour}:`}${timeString.minute}`);
		$("#nextAd .second").text(timeString.second);

		$("#nextAd .second").show();
	}
}

function doClock() {
	doMainClock();
	doUptimeClock();
	doAdClock();
}

var clocksEnabled = {
	localTime: true,
	streamUptime: false,
	nextAd: false
};

var clockSwitchTO;
var currentClock = -1;
function switchClock() {
	console.log(`switch clock called ${currentClock}`);

	let enabled = [];
	for(const whichClock in clocksEnabled) {
		if(clocksEnabled[whichClock]) {
			enabled.push(whichClock);
		}
	}

	currentClock++;
	if(currentClock >= enabled.length) {
		currentClock = 0;
	}
	let oldActiveClock = $(".activeClock");
	let oldActiveClockHead = $(".activeClock .head");
	let oldActiveClockValue = $(".activeClock .value");
	let newActiveClock = $(`#${enabled[currentClock]}`);
	let newActiveClockHead = $(`#${enabled[currentClock]} .head`);
	let newActiveClockValue = $(`#${enabled[currentClock]} .value`);

	clearTimeout(clockSwitchTO);
	clockSwitchTO = setTimeout(function() {
		switchClock();
	}, parseFloat(localStorage.getItem("setting_clock_showClocksFor")) * 1000);

	if(localStorage.getItem("setting_clock_condenseClocks") === "false") {
		return;
	}

	if(!($(".activeClock").length) && enabled.length) {
		$(".clockElement").removeClass("slideOut").removeClass("slideIn").hide();

		newActiveClock.addClass("activeClock").show();
		newActiveClockHead.removeClass("slideOut").addClass("slideIn").show();
		setTimeout(function() {
			newActiveClockValue.removeClass("slideOut").addClass("slideIn").show();
		}, 100);
		return;
	}

	if(!enabled.length) {
		$(".clockElement").removeClass("slideOut").removeClass("slideIn").hide();
		return;
	}

	if(enabled.length > 1) {
		oldActiveClockHead.removeClass("slideIn").addClass("slideOut").show();

		setTimeout(function() {
			oldActiveClockValue.removeClass("slideIn").addClass("slideOut").show();

			oldActiveClockValue.one("animationend", function() {
				oldActiveClock.removeClass("activeClock").hide();
				oldActiveClockHead.removeClass("slideOut").hide();
				oldActiveClockValue.removeClass("slideOut").hide();

				newActiveClock.addClass("activeClock").show();
				newActiveClockHead.removeClass("slideOut").addClass("slideIn").show();
				newActiveClockValue.hide();
				setTimeout(function() {
					newActiveClockValue.removeClass("slideOut").addClass("slideIn").show();
				}, 100);
			});
		}, 100);
	} else if(enabled.length === 1) {
		$(".clockElement").hide();
		newActiveClock.removeClass("slideIn").removeClass("slideOut").show();
		newActiveClock.children().removeClass("slideIn").removeClass("slideOut").show();
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