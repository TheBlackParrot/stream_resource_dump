function checkEffects() {
	const perspective = parseFloat(localStorage.getItem("clientSetting_namePerspectiveShift")) || 0;
	const skew = parseFloat(localStorage.getItem("clientSetting_nameSkew")) || 0;

	var list = [];

	if(perspective !== 0) { list.push("var(--name-perspective-shift)"); }
	if(skew !== 0) { list.push("var(--name-skew)"); }

	console.log((list.length ? list.join(" ") : "none"));

	rootCSS().setProperty("--name-effects", (list.length ? list.join(" ") : "none"));
}

const settingUpdaters = {
	nameColorStops: function(value) {
		setNameGradient();
	},
	nameGradientType: function(value) {
		setNameGradient();
	},
	nameGradientRepeats: function(value) {
		setNameGradient();
	},

	nameColorStop1_color: function(value) { rootCSS().setProperty("--name-color-1", value); },
	nameColorStop2_color: function(value) { rootCSS().setProperty("--name-color-2", value); },
	nameColorStop3_color: function(value) { rootCSS().setProperty("--name-color-3", value); },
	nameColorStop4_color: function(value) { rootCSS().setProperty("--name-color-4", value); },
	nameColorStop5_color: function(value) { rootCSS().setProperty("--name-color-5", value); },
	nameColorStop6_color: function(value) { rootCSS().setProperty("--name-color-6", value); },
	nameColorStop7_color: function(value) { rootCSS().setProperty("--name-color-7", value); },
	nameColorStop8_color: function(value) { rootCSS().setProperty("--name-color-8", value); },
	nameColorStop9_color: function(value) { rootCSS().setProperty("--name-color-9", value); },
	nameColorStop1_percentage: function(value) { rootCSS().setProperty("--name-color-1-percentage", `${value}%`); },
	nameColorStop2_percentage: function(value) { rootCSS().setProperty("--name-color-2-percentage", `${value}%`); },
	nameColorStop3_percentage: function(value) { rootCSS().setProperty("--name-color-3-percentage", `${value}%`); },
	nameColorStop4_percentage: function(value) { rootCSS().setProperty("--name-color-4-percentage", `${value}%`); },
	nameColorStop5_percentage: function(value) { rootCSS().setProperty("--name-color-5-percentage", `${value}%`); },
	nameColorStop6_percentage: function(value) { rootCSS().setProperty("--name-color-6-percentage", `${value}%`); },
	nameColorStop7_percentage: function(value) { rootCSS().setProperty("--name-color-7-percentage", `${value}%`); },
	nameColorStop8_percentage: function(value) { rootCSS().setProperty("--name-color-8-percentage", `${value}%`); },
	nameColorStop9_percentage: function(value) { rootCSS().setProperty("--name-color-9-percentage", `${value}%`); },
	nameColorStop1_isHard: function(value) { setNameGradient(); },
	nameColorStop2_isHard: function(value) { setNameGradient(); },
	nameColorStop3_isHard: function(value) { setNameGradient(); },
	nameColorStop4_isHard: function(value) { setNameGradient(); },
	nameColorStop5_isHard: function(value) { setNameGradient(); },
	nameColorStop6_isHard: function(value) { setNameGradient(); },
	nameColorStop7_isHard: function(value) { setNameGradient(); },
	nameColorStop8_isHard: function(value) { setNameGradient(); },
	nameColorStop9_isHard: function(value) { setNameGradient(); },

	nameGradientAngle: function(value) {
		rootCSS().setProperty("--name-gradient-direction", `${value}deg`);
	},

	nameFont: function(value) {
		rootCSS().setProperty("--name-font", value);
	},
	nameWeight: function(value) {
		rootCSS().setProperty("--name-weight", value);
	},
	nameSize: function(value) {
		rootCSS().setProperty("--name-size", `${value}pt`);
	},
	nameExtraWeight: function(value) {
		rootCSS().setProperty("--name-weight-extra", `${value}px`);
	},
	nameItalic: function(value) {
		rootCSS().setProperty("--name-font-style", (value === "true" ? "italic" : "normal"));
	},
	nameTransform: function(value) {
		rootCSS().setProperty("--name-transform", value);
	},
	nameVariant: function(value) {
		rootCSS().setProperty("--name-variant", value);
	},
	nameCharSpacing: function(value) {
		rootCSS().setProperty("--name-letter-spacing", `${value}px`);
	},
	nameGradientXPos: function(value) {
		rootCSS().setProperty("--name-gradient-x-pos", `${value}%`);
	},
	nameGradientYPos: function(value) {
		rootCSS().setProperty("--name-gradient-y-pos", `${value}%`);
	},
	namePerspectiveShift: function(value) {
		rootCSS().setProperty("--name-perspective-shift-amount", value);
		checkEffects();
	},
	nameSkew: function(value) {
		rootCSS().setProperty("--name-skew-amount", `${value}deg`);
		checkEffects();
	},
	nameGlowEnabled: function(value) {
		rootCSS().setProperty("--name-glow-effect", (value === "true" ? "var(--name-glow-effect-actual)" : "opacity(1)"));
	},
	nameGlowColor: function(value) {
		rootCSS().setProperty("--name-glow-effect-color", value);
	},
	nameGlowAmount: function(value) {
		rootCSS().setProperty("--name-glow-effect-blur", `${value}px`);
	},

	messageFont: function(value) {
		rootCSS().setProperty("--message-font", value);
	},
	messageWeight: function(value) {
		rootCSS().setProperty("--message-weight", value);
	},
	messageSize: function(value) {
		rootCSS().setProperty("--message-size", `${value}pt`);
	},
	messageExtraWeight: function(value) {
		rootCSS().setProperty("--message-weight-extra", `${value}px`);
	},
	messageCharSpacing: function(value) {
		rootCSS().setProperty("--message-letter-spacing", `${value}px`);
	},
	messageBoldExtraWeight: function(value) {
		rootCSS().setProperty("--message-bold-weight-extra", `${value}px`);
	},
	messageLineHeight: function(value) {
		rootCSS().setProperty("--message-line-height", `${value}px`);
	},
	messageVariant: function(value) {
		rootCSS().setProperty("--message-variant", value);
	},
	avatarBorderRadius: function(value) {
		rootCSS().setProperty("--avatar-border-radius", `${value}%`);
	}
};

function updateSetting(which, value, oldValue) {
	if(!which || value === undefined) {
		console.error(`updateSetting called but setting or value was not present\nwhich: ${which}\nvalue: ${value}`);
		return;
	}

	console.log(`wants ${which}`);

	if(which.indexOf("clientSetting_") === -1) {
		return;
	}

	let setting = which.substr(14);

	if(setting in settingUpdaters) {
		console.log(`setting ${setting} updated`);
		settingUpdaters[setting](value.toString());
	}

	const subSettings = $(`.setting[data-show-for="${setting}"]`);
	if(subSettings.length) {
		console.log(subSettings);
		subSettings.each(function(idx) {
			let item = $(subSettings[idx]);
			console.log(item);

			if(item.attr("data-value-for").indexOf(value) === -1) {
				item.hide();
			} else {
				item.show();
			}
		});
	}
}
window.addEventListener("storage", function(event) {
	updateSetting(event.key, event.newValue, event.oldValue);
});

async function saveSettings(which) {
	$("#loader").fadeIn(100);

	if(which === "flags") {
		saveFlags();
		return;
	}

	const elements = $(`.cell[id="_settings_${which}"] .setting input, .cell[id="_settings_${which}"] .setting select`);
	if(!elements.length) {
		console.error(`Could not find any settings for ${which}`);
		$("#loader").fadeOut(250);
		return;
	}

	let settings = {};
	for(const elementRef of elements) {
		const element = $(elementRef);
		if(element.attr("data-ignoreSetting") === "true") {
			continue;
		}
		
		let value = null;
		const setting = element.attr("id");

		switch(element.attr("type")) {
			case "checkbox":
				value = element.is(":checked");
				break;

			default:
				value = element.val();
				break;
		}

		if(element.attr("data-coloris") !== undefined) {
			if(element.attr("data-enable-alpha") !== undefined) {
				if(value.length === 7) {
					value = parseInt(`${value.substr(1)}ff`, 16);
				} else {
					value = parseInt(value.substr(1), 16);
				}
			} else {
				value = parseInt(value.substr(1), 16);
			}
		}

		settings[setting] = value;
	}

	console.log(`settings for ${which}:`);
	console.log(settings);

	const postResponse = await fetch("api/save.php", {
		method: "POST",
		body: new URLSearchParams(settings)
	});
	if(!postResponse.ok) {
		console.error(`POST request failed for saving ${which} settings`);
		$("#loader").fadeOut(250);
		return;
	}

	// have the server-sided save code spit out old values being overwritten, store those in sessionStorage and add a revert button
	const oldSettings = await postResponse.json();
	console.log(oldSettings);
	$("#loader").fadeOut(250);
}

function saveFlags() {
	const elements = $(`.flagActive .flagName`);
	let flags = [];

	for(const element of elements) {
		flags.push($(element).text());
	}

	console.log(`active flags: ${flags.join(", ")}`);
}