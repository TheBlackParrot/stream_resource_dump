function checkEffects() {
	const perspective = parseFloat(localStorage.getItem("clientSetting_namePerspectiveShift")) || 0;
	const skew = parseFloat(localStorage.getItem("clientSetting_nameSkew")) || 0;

	var list = [];

	if(perspective !== 0) { list.push("var(--name-perspective-shift)"); }
	if(skew !== 0) { list.push("var(--name-skew)"); }

	console.log((list.length ? list.join(" ") : "none"));

	rootCSS().setProperty("--name-effects", (list.length ? list.join(" ") : "none"));
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
	if(!rawColor) { return 0; }
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

const minBrightnessPerc = 30;
const maxBrightnessPerc = 100;
function ensureSafeColor(color) {
	let minBrightness = (minBrightnessPerc/100) * 255;
	let maxBrightness = (maxBrightnessPerc/100) * 255;

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

	return color;
}

function fixColors(idx, value) {
	let color = value;
	if(localStorage.getItem("clientSetting_previewAgainstThresholds") === "true") {
		if(!value) {
			console.warn("there was a null here");
			color = "#FFFFFF";
		} else {
			color = ensureSafeColor(value);
		}
	}
	rootCSS().setProperty(`--name-color-${idx}`, color);	
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

	nameColorStop1_color: function(value) { fixColors(1, value); },
	nameColorStop2_color: function(value) { fixColors(2, value); },
	nameColorStop3_color: function(value) { fixColors(3, value); },
	nameColorStop4_color: function(value) { fixColors(4, value); },
	nameColorStop5_color: function(value) { fixColors(5, value); },
	nameColorStop6_color: function(value) { fixColors(6, value); },
	nameColorStop7_color: function(value) { fixColors(7, value); },
	nameColorStop8_color: function(value) { fixColors(8, value); },
	nameColorStop9_color: function(value) { fixColors(9, value); },
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
	messageItalic: function(value) {
		rootCSS().setProperty("--message-font-style", (value === "true" ? "italic" : "normal"));
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
	},
	useUsername: function(value) {
		if(!userData) {
			return;
		}

		if(value === "true") {
			$("#namePreviewValue").text(userData.login);
		} else {
			$("#namePreviewValue").text(userData.display_name);
		}
	},
	previewAgainstThresholds: function(value) {
		for(let idx = 1; idx < 10; idx++) {
			if(localStorage.getItem(`clientSetting_nameColorStop${idx}_color`)) {
				fixColors(idx, localStorage.getItem(`clientSetting_nameColorStop${idx}_color`));
			}
		}
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

	if($(`#${setting}`).attr("data-coloris") !== undefined) {
		$(`#${setting}`)[0].dispatchEvent(new Event('input', { bubbles: true }));
	}
}
window.addEventListener("storage", function(event) {
	if(event.newValue === event.oldValue) {
		return;
	}

	updateSetting(event.key, event.newValue, event.oldValue);
});

async function saveSettings(which) {
	$("#loader").fadeIn(100);

	if(which === "flags") {
		await saveFlags();
		return;
	}

	const elements = $(`.cell[id="_settings_${which}"] .setting input, .cell[id="_settings_${which}"] .setting select`);
	if(!elements.length) {
		console.error(`Could not find any settings for ${which}`);
		sendNotification(`Could not find any settings for "${which}"`, 5, "error");
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
				value = (element.is(":checked") ? 1 : 0);
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
		sendNotification(`POST request failed for saving "${which}" settings`, 5, "error");
		return;
	}

	const sanityCheck = await postResponse.json();
	console.log(sanityCheck);
	$("#loader").fadeOut(250);

	sendNotification(`Successfully updated "${which}" settings`, 5, "success");
}

function discardSettings(which, bypassNotif) {
	if(which === "flags") {
		discardFlags(bypassNotif);
		return;
	}

	const elements = $(`.cell[id="_settings_${which}"] .setting input, .cell[id="_settings_${which}"] .setting select`);
	if(!elements.length) {
		console.error(`Could not find any settings for ${which}`);
		sendNotification(`Could not find any settings for "${which}"`, 5, "error");
		return;
	}

	for(const elementRef of elements) {
		const element = $(elementRef);
		if(element.attr("data-ignoreSetting") === "true") {
			continue;
		}

		const setting = element.attr("id");
		var newValue = sessionStorage.getItem(`clientSetting_${setting}`);

		if($(`#${setting}`).attr("data-coloris") !== undefined) {
			var colorLength = 6;
			if(element.attr("data-enable-alpha") !== undefined) {
				colorLength = 8;
			}

			newValue = `#${(parseInt(newValue)).toString(16).padStart(colorLength, "0")}`;
			element[0].dispatchEvent(new Event('input', { bubbles: true }));
		}

		switch(element.attr("type")) {
			case "checkbox":
				element.prop("checked", (newValue === "true" || newValue === "1" ? "true" : "")).trigger("update").trigger("change");
				break;

			default:
				element.val(newValue).trigger("update").trigger("change");
				break;
		}
	}

	if(!bypassNotif) {
		sendNotification(`Reloaded "${which}" settings`, 5);
	}
}

async function saveFlags() {
	const elements = $(`.flagActive .flagName`);

	let flags = {
		'identityFlag1': "",
		'identityFlag2': "",
		'identityFlag3': "",
		'identityFlag4': "",
		'identityFlag5': "",
		'identityFlag6': "",
		'identityFlag7': "",
		'identityFlag8': "",
		'identityFlag9': ""
	};
	for(let i = 1; i <= 9; i++) {
		localStorage.removeItem(`clientSetting_identityFlag${i}`);
	}

	for(let i = 0; i < elements.length; i++) {
		const element = elements[i];
		const setting = `identityFlag${i+1}`;

		flags[setting] = $(element).text();
		localStorage.setItem(`clientSetting_${setting}`, flags[setting]);
	}

	console.log(flags);

	const postResponse = await fetch("api/save.php", {
		method: "POST",
		body: new URLSearchParams(flags)
	});
	$("#loader").fadeOut(250);
	if(!postResponse.ok) {
		console.error("POST request failed for saving flags");
		sendNotification("POST request failed for saving flags settings", 5, "error");
		return;
	}

	sendNotification(`Successfully updated flags settings`, 5, "success");
}

function discardFlags(bypassNotif) {
	$(".flagActive").removeClass("flagActive");
	activeFlags = [];

	for(let i = 1; i <= 9; i++) {
		const oldFlag = sessionStorage.getItem(`clientSetting_identityFlag${i}`);

		if(oldFlag === "null" || oldFlag === "" || oldFlag === undefined) {
			localStorage.removeItem(`clientSetting_identityFlag${i}`);
		} else {
			localStorage.setItem(`clientSetting_identityFlag${i}`, oldFlag);
			$(`.flag[data-flag="${oldFlag}"]`).trigger("click");
		}
	}

	if(!bypassNotif) {
		sendNotification(`Reloaded flags settings`, 5);
	}
}