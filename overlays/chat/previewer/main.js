var loadingInit = false;

function loadSettings() {
	if(loadingInit) {
		return;
	}

	let settings = $.find("input, select, textarea");

	for(let i in settings) {
		let element = $(settings[i]);

		if(element.attr("data-coloris") === "") {
			continue;
		}

		if(element.attr("id").substr(0, 4) === "clr-") {
			continue; // guh
		}

		if(element.attr("data-ignoreSetting") === "true") {
			continue;
		}

		let setting = element.attr("id");
		let val = null;

		switch(element.attr("type")) {
			case "checkbox":
				val = element.is(":checked");
				break;

			case "range":
				val = element.val();

				element[0].addEventListener("input", function(event) {
					element.parent().children(".rangeValue").text(event.target.value);

					value = event.target.value;
					max = parseInt(element.attr("max"));
					element.css("background-size", `${(value / max) * 100}% 100%`);
				});
				break;

			default:
				val = element.val();
		}

		if(setting && val !== null) {
			let storedVal = localStorage.getItem(`clientSetting_${setting}`);

			if(storedVal !== null) {
				switch(element.attr("type")) {
					case "checkbox":
						element.prop("checked", storedVal === "true").trigger("change");
						break;

					case "range":
						element.val(storedVal).trigger("update");
						break;

					default:
						element.val(storedVal);
				}
				updateSetting(`clientSetting_${setting}`, storedVal);
			} else {
				localStorage.setItem(`clientSetting_${setting}`, val);
			}
		} else {
			console.log(`something went wrong: ${setting}, ${val}`);
		}
	}

	loadingInit = true;
}

$('.settingValue input[type="range"]').on("update", function(e) {
	value = $(this).val();
	max = parseInt($(this).attr("max"));

	$(this).parent().children(".rangeValue").text(value);
	$(this).css("background-size", `${(value / max) * 100}% 100%`);
});

function setNameGradient() {
	let amount = parseInt(localStorage.getItem("clientSetting_nameColorStops"));
	let type = localStorage.getItem("clientSetting_nameGradientType");
	let repeats = (localStorage.getItem("clientSetting_nameGradientRepeats") === "true");

	if(amount < 1) { amount = 1; }
	else if(amount > 9) { amount = 9; }

	if(isNaN(amount)) { amount = 2; }

	console.log(`user wants ${amount} color stops`);

	let list = $('.setting[data-multi-slot-list="nameColorStops"]');
	for(element of list) {
		element = $(element);
		if(parseInt(element.attr("data-multi-slot")) > amount) {
			element.hide();
		} else {
			element.show();
		}
	}

	if(amount === 1) {
		rootCSS().setProperty("--name-gradient", 'unset');
		rootCSS().setProperty("--name-color", 'var(--name-color-1)');
		return;
	} else {
		rootCSS().setProperty("--name-color", 'unset');
	}

	let stops = [];
	for(let i = 1; i <= amount; i++) {
		let isHard = localStorage.getItem(`clientSetting_nameColorStop${i}_isHard`);
		let prevIdx = Math.max(1, i-1);

		if(isHard === "true") {
			stops.push(`var(--name-color-${prevIdx}) var(--name-color-${i}-percentage)`);
			stops.push(`var(--name-color-${i}) var(--name-color-${i}-percentage)`);
			if(i === amount) {
				stops.push(`var(--name-color-${i}) calc(var(--name-color-${i}-percentage) + (var(--name-color-${i}-percentage) - var(--name-color-${prevIdx}-percentage)))`);
			}
		} else {
			stops.push(`var(--name-color-${i}) var(--name-color-${i}-percentage)`);
		}
	}

	let initialPart = "";
	switch(type) {
		case "linear":
			initialPart = "var(--name-gradient-direction), ";
			break;

		case "radial":
			initialPart = "at var(--name-gradient-x-pos) var(--name-gradient-y-pos), ";
			break;

		case "conic":
			initialPart = "from var(--name-gradient-direction) at var(--name-gradient-x-pos) var(--name-gradient-y-pos), ";
			break;
	}
	rootCSS().setProperty("--name-gradient", `${repeats ? "repeating-" : ""}${type}-gradient(${initialPart}${stops.join(", ")})`);
}

$("input, select, textarea").on("change", function(e) {
	if($(this).attr("data-ignoreSetting") === "true") {
		return;
	}
	
	let value = null;
	let setting = $(this).attr("id");

	switch($(this).attr("type")) {
		case "checkbox":
			value = $(this).is(":checked");
			break;

		default:
			value = $(this).val();
			break;
	}

	if(value !== null && setting) {
		if($(this).attr("type") === "number") {
			const min = parseFloat($(this).attr("min"));
			const max = parseFloat($(this).attr("max"));
			value = parseFloat(value);

			if(!isNaN(min)) {
				if(value < min) {
					value = min;
					$(this).val(min);
				}
			}

			if(!isNaN(max)) {
				if(value > max) {
					value = max;
					$(this).val(max);
				}
			}
		}

		if(loadingInit) {
			let oldValue = localStorage.getItem(`clientSetting_${setting}`);

			console.log(`setting ${setting} is now ${value}`);
			localStorage.setItem(`clientSetting_${setting}`, value);

			updateSetting(`clientSetting_${setting}`, value, oldValue);
		}
	}
});

var fontData;
var userData;
var flagsData;
var initialSettings;
const weightEnums = {
	"100": "Thin",
	"200": "Extra Light",
	"300": "Light",
	"400": "Regular",
	"500": "Medium",
	"600": "Semi-Bold",
	"700": "Bold",
	"800": "Extra Bold",
	"900": "Black"
};

window.addEventListener("load", async function(event) {
	loadSettings();

	const cookieParts = document.cookie.split("; ")
	const cookieValue = cookieParts.find((key) => key.startsWith("access="))?.split("=")[1];
	var isSignedIn = false;

	var firstInit = false;
	if(!localStorage.getItem("_clientSetting_hasInitBefore")) {
		localStorage.setItem("_clientSetting_hasInitBefore", "yes");
		firstInit = true;
	}

	const fontResponse = await fetch(`api/lib/fonts.json`);
	if(fontResponse.ok) {
		fontData = await fontResponse.json();

		let fonts = Object.keys(fontData);
		fonts.sort();
		fonts.reverse();
		
		for(let fontIdx in fonts) {
			let fontName = fonts[fontIdx];
			let font = fontData[fontName];

			if(font.allowed.names) {
				$("#nameFont").prepend($("<option>", { value: fontName, text: fontName }));
			}

			if(font.allowed.messages) {
				$("#messageFont").prepend($("<option>", { value: fontName, text: fontName }));
			}
		}

		if(firstInit) {
			localStorage.setItem("clientSetting_nameFont", "Manrope");
			localStorage.setItem("clientSetting_messageFont", "Manrope");
			localStorage.setItem("clientSetting_nameWeight", "900");
			localStorage.setItem("clientSetting_messageWeight", "700");
		}

		$("#nameFont").val(localStorage.getItem("clientSetting_nameFont"));
		$("#messageFont").val(localStorage.getItem("clientSetting_messageFont"));
		$("#nameFont, #messageFont").trigger("change");
	}

	const flagsResponse = await fetch(`api/lib/flags.json`);
	if(flagsResponse.ok) {
		flagsData = await flagsResponse.json();

		let flags = Object.keys(flagsData);
		flags.sort();

		for(let flag of flags) {
			let flagElement = $(`<div class="flag" data-flag="${flag}"></div>`);

			let flagIconContainer = $(`<div class="flagIconContainer"></div>`);
			flagIconContainer.append($(`<div class="flagOutline" style="background-image: url('flags/${flagsData[flag]}');"></div>`));
			flagIconContainer.append($(`<div class="flagIcon" style="background-image: url('flags/${flagsData[flag]}');"></div>`));
			flagElement.append(flagIconContainer);

			flagElement.append($(`<span class="flagName">${flag}</span>`));
			$("#identityFlags").append(flagElement);
		}

		for(let i = 1; i <= 5; i++) {
			const flag = localStorage.getItem(`clientSetting_identityFlag${i}`);

			if(flag === "null" || flag === "" || flag === undefined) {
				continue;
			}

			$(`.flag[data-flag="${flag}"]`).trigger("click");
		}
	}

	if(cookieValue) {
		const response = await fetch('api/getUser.php');
		if(!response.ok) {
			$("#signInButton").show();
			$(".footer").hide();
			$("#loader").fadeOut(250);
			sendNotification("Could not authenticate, please sign in again", 7, "error");
			return;
		}

		data = await response.json();
		userData = data['user'];
		initialSettings = data['settings'];
		rootCSS().setProperty("--user-avatar", `url('${userData.profile_image_url}')`);
		$("#signedInUser_name").text(userData.display_name);
		$("#signedInUser").fadeIn(250);

		for(const setting in initialSettings) {
			const value = initialSettings[setting];
			sessionStorage.setItem(`clientSetting_${setting}`, value);
		}

		// this is so hacky but it works so w/e
		$(".discardButton").each(function() {
			discardSettings($(this).parent().attr("data-buttons-affect"), true);
		});

		$("#namePreviewValue").fadeOut(250, function() {
			settingUpdaters.useUsername(localStorage.getItem("clientSetting_useUsername"));
			$("#namePreviewValue").fadeIn(250);
		});

		sendNotification(`Authenticated as ${userData.login}`, 5, "success");
		isSignedIn = true;
	} else {
		$("#signInButton").show();
		$(".footer").hide();
		$("#loader").fadeOut(250);
	}

	if(isSignedIn) {
		setTimeout(function() {
			$("#loader").fadeOut(250, function() {
				$(".footer").fadeIn(250);
			});
		}, 250);
	}

	const paletteNames = Object.keys(gradientPresets).sort();

	for(const presetName of paletteNames) {
		const presetData = gradientPresets[presetName];

		const option = $(`<option value="${presetName}">${presetName}</option>`);
		$("#nameGradientPreset").append(option);
	}

	setNameGradient();
});

$("#nameGradientPreset").on("change", function(event) {
	const presetData = gradientPresets[this.value];

	localStorage.setItem("clientSetting_nameGradientType", presetData.type);
	$("#nameGradientType").val(presetData.type).trigger("update").trigger("change");
	
	localStorage.setItem("clientSetting_nameGradientRepeats", (presetData.repeats ? "true" : "false"));
	$("#nameGradientRepeats").prop("checked", presetData.repeats).trigger("update").trigger("change");

	localStorage.setItem("clientSetting_nameColorStops", presetData.gradient.length);
	$("#nameColorStops").val(presetData.gradient.length).trigger("update").trigger("change");

	for(const which in presetData.options) {
		switch(which) {
			case "x":
				localStorage.setItem("clientSetting_nameGradientXPos", presetData.options.x);
				$("#nameGradientXPos").val(presetData.options.x).trigger("update").trigger("change");
				break;

			case "y":
				localStorage.setItem("clientSetting_nameGradientYPos", presetData.options.y);
				$("#nameGradientYPos").val(presetData.options.y).trigger("update").trigger("change");
				break;

			case "angle":
				localStorage.setItem("clientSetting_nameGradientAngle", presetData.options.angle);
				$("#nameGradientAngle").val(presetData.options.angle).trigger("update").trigger("change");
				break;
		}
	}

	for(let idx = 0; idx < presetData.gradient.length; idx++) {
		localStorage.setItem(`clientSetting_nameColorStop${idx+1}_color`, presetData.gradient[idx][0]);
		localStorage.setItem(`clientSetting_nameColorStop${idx+1}_percentage`, presetData.gradient[idx][1]);
		localStorage.setItem(`clientSetting_nameColorStop${idx+1}_isHard`, (presetData.gradient[idx][2] ? "true" : "false"));

		$(`#nameColorStop${idx+1}_color`).val(presetData.gradient[idx][0]).trigger("update").trigger("change");
		$(`#nameColorStop${idx+1}_percentage`).val(presetData.gradient[idx][1]).trigger("update").trigger("change");
		$(`#nameColorStop${idx+1}_isHard`).prop("checked", presetData.gradient[idx][2]).trigger("update").trigger("change");

		$(`#nameColorStop${idx+1}_color`)[0].dispatchEvent(new Event('input', { bubbles: true }));
	}
});

$("#nameFont, #messageFont").on("change", function(event) {
	let which = (event.target.getAttribute("id") === "nameFont" ? "name" : "message");
	let font = this.value;

	$(`#${which}Weight`).empty();

	let weights = Object.keys(fontData[font]);
	if(!("700" in fontData[font])) {
		weights.push("700");
	}
	weights.sort();

	let oldWeight = parseInt(localStorage.getItem(`clientSetting_${which}Weight`));
	let lastDiff = 1000;
	let wantedWeight = 100;

	for(let weightIdx in weights) {
		let weight = weights[weightIdx];

		if(!isNaN(parseInt(weight))) {
			$(`#${which}Weight`).append($("<option>", { value: weight, text: `${weightEnums[weight]} (${weight})` }));
			let diff = Math.abs(parseInt(weight) - oldWeight);
			if(diff < lastDiff) {
				wantedWeight = parseInt(weight);
				lastDiff = diff;
			}
		}
	}

	$(`#${which}Weight`).val(wantedWeight);
	$(`#${which}Weight`).trigger("change");

	$(":root").get(0).style.setProperty(`--${which}-font`, font);
});

const oauthCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const oauthRedirectUri = `${window.location.origin}${window.location.pathname}api/resolve.php`;
const twitchClientID = "xz8xgox825yig2mk30m3ypt1f73rvy";

function getRandomString(length) {
	let rand = [];

	for(let i = 0; i < length; i++) {
		let char = oauthCharacters.charAt(Math.floor(Math.random() * oauthCharacters.length));
		rand.push(char);
	}

	return rand.join("");
}

$("#signInButton").on("mouseup", function(e) {
	let state = getRandomString(16);
	sessionStorage.setItem("_clientSetting_oauth_state", state);

	let args = new URLSearchParams({
		response_type: 'code',
		client_id: twitchClientID,
		scope: "",
		redirect_uri: oauthRedirectUri,
		state: state
	});

	window.location = 'https://id.twitch.tv/oauth2/authorize?' + args;
})

$("input[data-coloris]").on("click", function(e) {
	if($(this).attr("data-enable-alpha") !== undefined) {
		Coloris({
			alpha: true
		});
	} else {
		Coloris({
			alpha: false
		});		
	}
})

var activeFlags = [];
$("body").on("click", ".flag", function(e) {
	if($(this).hasClass("flagActive")) {
		activeFlags.splice(activeFlags.indexOf($(this).attr("data-flag")));
		$(this).removeClass("flagActive");
		return;
	}

	if(activeFlags.length >= 9) {
		sendNotification("Only a maximum of 9 flags are allowed", 5, "warning");
		return;
	}

	activeFlags.push($(this).attr("data-flag"));
	$(this).addClass("flagActive");
});

$(".saveButton").on("click", function(e) {
	let which = $(this).parent().attr("data-buttons-affect");
	saveSettings(which);
});
$(".discardButton").on("click", function(e) {
	let which = $(this).parent().attr("data-buttons-affect");
	discardSettings(which);
});

function sendNotification(msg, duration, type) {
	const notif = $('<div class="notification" style="display: none;"></div>');
	notif.text(msg);
	notif.addClass(`${type ? type : "info"}Notif`);

	switch(type) {
		case "warning":
			notif.prepend($('<i class="fa-fw fa-solid fa-triangle-exclamation"></i>'));
			break;

		case "error":
			notif.prepend($('<i class="fa-fw fa-solid fa-circle-xmark"></i>'));
			break;

		case "success":
			notif.prepend($('<i class="fa-fw fa-solid fa-circle-check"></i>'));
			break;

		default:
			notif.prepend($('<i class="fa-fw fa-solid fa-circle-exclamation"></i>'));
			break;
	}

	notif.fadeIn(250);
	if(duration !== -1) {
		setTimeout(function() {
			notif.fadeOut(250, function() {
				notif.remove();
			});
		}, (duration * 1000) + 250);
	}

	$("#notifications").append(notif);
}