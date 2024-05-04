var loadingInit = false;

function loadSettings() {
	if(loadingInit) {
		return;
	}

	let settings = $.find("input, select, textarea");

	for(let i in settings) {
		let element = $(settings[i]);

		let setting = element.attr("id");
		let val = null;

		if(element.attr("data-ignoreSetting") === "true") {
			continue;
		}

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
loadSettings();

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

setNameGradient();

var fontData;
var userData;
var flagsData;
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
	const cookieParts = document.cookie.split("; ")
	const cookieValue = cookieParts.find((key) => key.startsWith("access="))?.split("=")[1];
	var isSignedIn = false;

	if(cookieValue) {
		const response = await fetch('api/getUser.php');
		if(!response.ok) {
			$("#signInButton").show();
			$(".footer").hide();
			$("#loader").fadeOut(250);
			return;
		}

		userData = await response.json();
		rootCSS().setProperty("--user-avatar", `url('${userData.profile_image_url}')`);
		$("#signedInUser_name").text(userData.display_name);
		$("#signedInUser").fadeIn(250);

		$("#namePreview").fadeOut(250, function() {
			$("#namePreview").text(userData.display_name);
			$("#namePreview").fadeIn(250);
		});

		isSignedIn = true;
	} else {
		$("#signInButton").show();
		$(".footer").hide();
		$("#loader").fadeOut(250);
	}

	const fontResponse = await fetch(`fonts.json`);
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

		if(!localStorage.getItem("_clientSetting_hasInitBefore")) {
			localStorage.setItem("_clientSetting_hasInitBefore", "yes");

			localStorage.setItem("clientSetting_nameFont", "Manrope");
			localStorage.setItem("clientSetting_messageFont", "Manrope");
		}

		$("#nameFont").val(localStorage.getItem("clientSetting_nameFont"));
		$("#messageFont").val(localStorage.getItem("clientSetting_messageFont"));
		$("#nameFont, #messageFont").trigger("change");
	}

	const flagsResponse = await fetch(`flags.json`);
	if(flagsResponse.ok) {
		flagsData = await flagsResponse.json();

		let flags = Object.keys(flagsData);
		flags.sort();

		for(let flag of flags) {
			let flagElement = $(`<div class="flag"></div>`);

			let flagIconContainer = $(`<div class="flagIconContainer"></div>`);
			flagIconContainer.append($(`<div class="flagOutline" style="background-image: url('flags/${flagsData[flag]}');"></div>`));
			flagIconContainer.append($(`<div class="flagIcon" style="background-image: url('flags/${flagsData[flag]}');"></div>`));
			flagElement.append(flagIconContainer);

			flagElement.append($(`<span class="flagName">${flag}</span>`));
			$("#identityFlags").append(flagElement);
		}
	}

	if(isSignedIn) {
		setTimeout(function() {
			$("#loader").fadeOut(250, function() {
				$(".footer").fadeIn(250);
			});
		}, 250);
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

var activeFlags = 0;
$("body").on("click", ".flag", function(e) {
	if($(this).hasClass("flagActive")) {
		activeFlags--;
		$(this).removeClass("flagActive");
		return;
	}

	if(activeFlags >= 5) {
		alert("Only 5 flags are allowed maximum.");
		return;
	}

	activeFlags++;
	$(this).addClass("flagActive");
});

$(".saveButton").on("click", function(e) {
	let which = $(this).parent().attr("data-buttons-affect");
	saveSettings(which);
});