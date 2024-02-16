function rootCSS() {
	return document.querySelector("html").style;
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

const settingUpdaters = {
	primaryColor: function(value) {
		rootCSS().setProperty("--primary-color", value);
		rootCSS().setProperty("--primary-color-bright", interpolateColor("#ffffffff", value, 50));
		rootCSS().setProperty("--primary-color-bright-desat", interpolateColor("#000000ff", interpolateColor("#808080ff", value, 75), 40));
		rootCSS().setProperty("--primary-color-brighter-desat", interpolateColor("#606060ff", interpolateColor("#808080ff", value, 50), 70));
		rootCSS().setProperty("--primary-color-desat", interpolateColor("#000000ff", interpolateColor("#808080ff", value, 22), 40));
		rootCSS().setProperty("--primary-color-dark", interpolateColor("#000000ff", interpolateColor("#808080ff", value, 33), 25));
		rootCSS().setProperty("--primary-color-darkest", interpolateColor("#000000ff", interpolateColor("#808080ff", value, 50), 15));
		rootCSS().setProperty("--primary-color-darkester", interpolateColor("#000000ff", interpolateColor("#808080ff", value, 50), 6));
	},

	minWidth: function(value) {
		rootCSS().setProperty("--panel-minimum-width", `${value}px`);
	}
};

function updateSetting(which, value, oldValue) {
	if(which.indexOf("setting_panel_") === -1) {
		return;
	}

	let setting = which.substr(14);

	if(setting in settingUpdaters) {
		console.log(`setting ${setting} updated`);
		settingUpdaters[setting](value, oldValue);
	}
}
window.addEventListener("storage", function(event) {
	updateSetting(event.key, event.newValue, event.oldValue);
});

var loadingInit = false;

function loadSettings() {
	let settings = $.find("input, select, textarea");

	for(let i in settings) {
		let element = $(settings[i]);

		let setting = element.attr("id");
		let val = null;

		if(element.attr("data-ignoreSetting") === "true") {
			continue;
		}

		let resetButton;
		if(setting in defaultConfig) {
			resetButton = $(`<div class="button resetToDefaultValueButton" data-setting="${setting}"><i class="fas fa-redo-alt"></i></div>`);
			element.before(resetButton);
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
			let storedVal = localStorage.getItem(`setting_${setting}`);

			if(storedVal !== null) {
				//console.log(`loaded ${setting}: ${storedVal}`);
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

				if(setting.substring(0, 6) === "panel_") {
					updateSetting(`setting_${setting}`, storedVal);
				}

				if(resetButton) {
					if(storedVal !== defaultConfig[setting] && defaultConfig[setting] !== "") {
						resetButton.show();
					} else {
						resetButton.hide();
					}
				}
			} else {
				localStorage.setItem(`setting_${setting}`, val);
			}
		} else {
			console.log(`something went wrong: ${setting}, ${val}`);
		}
	}

	loadingInit = true;
}
loadSettings();