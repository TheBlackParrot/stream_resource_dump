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
	else if(amount > 6) { amount = 6; }

	console.log(`user wants ${amount} color stops`);

	let stops = [];
	for(let i = 1; i <= amount; i++) {
		stops.push(`var(--name-color-${i}) var(--name-color-${i}-percentage)`);
	}

	let initialPart = "";
	switch(type) {
		case "linear-gradient":
			initialPart = "var(--name-gradient-direction), ";
			break;

		case "radial-gradient":
			// nothing
			break;

		case "conic-gradient":
			initialPart = "from var(--name-gradient-direction), ";
			break;
	}
	rootCSS().setProperty("--name-gradient", `${repeats ? "repeating-" : ""}${type}(${initialPart}${stops.join(", ")})`);

	let list = $('.setting[data-multi-slot-list="nameColorStops"]');
	for(element of list) {
		element = $(element);
		if(parseInt(element.attr("data-multi-slot")) > amount) {
			element.hide();
		} else {
			element.show();
		}
	}
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

	if(value !== null && setting && loadingInit) {
		let oldValue = localStorage.getItem(`clientSetting_${setting}`);

		console.log(`setting ${setting} is now ${value}`);
		localStorage.setItem(`clientSetting_${setting}`, value);

		updateSetting(`clientSetting_${setting}`, value, oldValue);
	}
});

setNameGradient();

var fontData;
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

window.addEventListener("load", function(event) {
	$.get("fonts.json", function(data) {
		fontData = data;
		let fonts = Object.keys(fontData);
		fonts.sort();
		fonts.reverse();
		
		for(let fontIdx in fonts) {
			let fontName = fonts[fontIdx];
			let font = fontData[fontName];

			if(font.allowed.names) {
				$("#nameFont").prepend($("<option>", { value: fontName, text: fontName }));
			}

			/*
			if(font.allowed.messages) {
				$("#msgFont").prepend($("<option>", { value: fontName, text: fontName }));
			}
			*/
		}

		if(!localStorage.getItem("_clientSetting_hasInitBefore")) {
			localStorage.setItem("_clientSetting_hasInitBefore", "yes");
			localStorage.setItem("clientSetting_nameFont", "Manrope");
		}

		$("#nameFont").val(localStorage.getItem("clientSetting_nameFont"));
		$("#nameFont").trigger("change");
	});

	/*
	let _flags = Object.keys(settings.flags);
	_flags.sort();
	for(let i in _flags) {
		let flag = _flags[i];
		$("#identityFlags").append(`<div><span class="flag${flag} flag" style="background-image: url('../flags/${settings.flags[flag]}'); display: inline-block;"></span> ${flag}</div>`);
	}
	*/
});

$("#nameFont").on("change", function(e) {
	let optionSelected = $("#nameFont:selected", this);
	let font = this.value;

	$("#nameWeight").empty();

	let weights = Object.keys(fontData[font]);
	if(!("700" in fontData[font])) {
		weights.push("700");
	}
	weights.sort();

	let oldWeight = parseInt(localStorage.getItem("clientSetting_nameWeight"));
	let lastDiff = 1000;
	let wantedWeight = 100;

	for(let weightIdx in weights) {
		let weight = weights[weightIdx];

		if(!isNaN(parseInt(weight))) {
			$("#nameWeight").append($("<option>", { value: weight, text: `${weightEnums[weight]} (${weight})` }));
			let diff = Math.abs(parseInt(weight) - oldWeight);
			if(diff < lastDiff) {
				wantedWeight = parseInt(weight);
				lastDiff = diff;
			}
		}
	}

	$("#nameWeight").val(wantedWeight);
	$("#nameWeight").trigger("change");

	$(":root").get(0).style.setProperty(`--name-font`, font);
});

$("#signInButton").on("mouseup", function(e) {
	alert("(this does nothing, no backend for this exists yet)");
})