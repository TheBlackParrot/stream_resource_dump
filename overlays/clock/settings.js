function rootCSS() {
	return document.querySelector("html").style;
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

const settingUpdaters = {
	overlayMarginHorizontal: function(value) {
		rootCSS().setProperty("--horizontalMargin", `${value}px`);
	},
	overlayMarginVertical: function(value) {
		rootCSS().setProperty("--verticalMargin", `${value}px`);
	},
	elementSpacing: function(value) {
		rootCSS().setProperty("--verticalSpacing", `${parseFloat(value) / 2}px`);
	},
	enableShadowEffects: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--shadowStuff", "url(#shadowEffect)");
		} else {
			rootCSS().setProperty("--shadowStuff", "url(#blankEffect)");
		}
	},
	enableOutlineEffects: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--outlineStuff", "url(#outlineEffect)");
		} else {
			rootCSS().setProperty("--outlineStuff", "url(#blankEffect)");
		}
	},
	shadowColor: function(value) {
		rootCSS().setProperty("--overlayShadowColor", value);
	},
	shadowXOffset: function(value) {
		$("feDropShadow").attr("dx", value);
	},
	shadowYOffset: function(value) {
		$("feDropShadow").attr("dy", value);
	},
	shadowBlurRadius: function(value) {
		$("feDropShadow").attr("stdDeviation", value);
	},
	outlineColor: function(value) {
		rootCSS().setProperty("--overlayOutlineColor", value);
	},
	outlineDivisor: function(value) {
		$("feConvolveMatrix").attr("divisor", value);
	},
	outlineOrder: function(value) {
		value = parseInt(value);
		let matrix;
		if(value >= 3 && localStorage.getItem("setting_clock_outlineStripCorners") === "true") {
			matrix = getSmoothMatrix(value, parseFloat(localStorage.getItem("setting_clock_outlineThreshold")));
		} else {
			matrix = new Array(Math.pow(value, 2)).fill(1);
		}

		$("feConvolveMatrix").attr("order", `${value},${value}`);
		$("feConvolveMatrix").attr("kernelMatrix", matrix.join(" "));
	},
	outlineStripCorners: function() {
		settingUpdaters.outlineOrder(localStorage.getItem("setting_clock_outlineOrder"));
	},
	overlayOutlineThreshold: function() {
		settingUpdaters.overlayOutlineOrder(localStorage.getItem("setting_clock_outlineOrder"));
	},
	headerFont: function(value) {
		rootCSS().setProperty("--timezoneFont", value);
	},
	headerFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--timezoneFontStyle", "italic");
		} else {
			rootCSS().setProperty("--timezoneFontStyle", "normal");
		}
	},
	headerFontSize: function(value) {
		rootCSS().setProperty("--timezoneFontSize", `${value}pt`);
	},
	headerFontWeight: function(value) {
		rootCSS().setProperty("--timezoneFontWeight", value);
	},
	headerFontWeightExtra: function(value) {
		rootCSS().setProperty("--timezoneAddWeight", `${value}px`);
	},
	headerLetterSpacing: function(value) {
		rootCSS().setProperty("--timezoneLetterSpacing", `${value}px`);
	},
	clockFont: function(value) {
		rootCSS().setProperty("--clockFont", value);
	},
	clockFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--clockFontStyle", "italic");
		} else {
			rootCSS().setProperty("--clockFontStyle", "normal");
		}
	},
	clockFontSize: function(value) {
		rootCSS().setProperty("--clockFontSize", `${value}pt`);
	},
	clockFontWeight: function(value) {
		rootCSS().setProperty("--clockFontWeight", value);
	},
	clockFontWeightExtra: function(value) {
		rootCSS().setProperty("--clockAddWeight", `${value}px`);
	},
	clockLetterSpacing: function(value) {
		rootCSS().setProperty("--clockLetterSpacing", `${value}px`);
	},
	secondsFont: function(value) {
		rootCSS().setProperty("--secondsFont", value);
	},
	secondsFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--secondsFontStyle", "italic");
		} else {
			rootCSS().setProperty("--secondsFontStyle", "normal");
		}
	},
	secondsFontSize: function(value) {
		rootCSS().setProperty("--secondsFontSize", `${value}pt`);
	},
	secondsFontWeight: function(value) {
		rootCSS().setProperty("--secondsFontWeight", value);
	},
	secondsFontWeightExtra: function(value) {
		rootCSS().setProperty("--secondsAddWeight", `${value}px`);
	},
	secondsLetterSpacing: function(value) {
		rootCSS().setProperty("--secondsLetterSpacing", `${value}px`);
	},
	headerColor: function(value) {
		rootCSS().setProperty("--timezoneColorActual", value);
	},
	headerAdaptColor: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--timezoneColor", "var(--colorLight)");
		} else {
			rootCSS().setProperty("--timezoneColor", "var(--timezoneColorActual)");
		}
	},
	clockColor: function(value) {
		rootCSS().setProperty("--clockColorActual", value);
	},
	clockAdaptColor: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--clockColor", "var(--colorLight)");
		} else {
			rootCSS().setProperty("--clockColor", "var(--clockColorActual)");
		}
	},
	meridiemFont: function(value) {
		rootCSS().setProperty("--meridiemFont", value);
	},
	meridiemFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--meridiemFontStyle", "italic");
		} else {
			rootCSS().setProperty("--meridiemFontStyle", "normal");
		}
	},
	meridiemFontSize: function(value) {
		rootCSS().setProperty("--meridiemFontSize", `${value}pt`);
	},
	meridiemFontWeight: function(value) {
		rootCSS().setProperty("--meridiemFontWeight", value);
	},
	meridiemFontWeightExtra: function(value) {
		rootCSS().setProperty("--meridiemAddWeight", `${value}px`);
	},
	meridiemLetterSpacing: function(value) {
		rootCSS().setProperty("--meridiemLetterSpacing", `${value}px`);
	},

	elementWidth: function(value) {
		rootCSS().setProperty("--elementWidth", `${value}px`);
	},
	elementJustify: function(value) {
		rootCSS().setProperty("--elementJustify", value);
	},
	headerTransform: function(value) {
		rootCSS().setProperty("--headerTransform", value);
	},
	showLocalTime: function(value) {
		if(localStorage.getItem("setting_clock_condenseClocks") === "false") {
			if(value === "true") {
				$("#localTime").show();
				$("#localTime").children().show();
			} else {
				$("#localTime").hide();
				$("#localTime").children().hide();
			}
		}

		clocksEnabled.localTime = (value === "true");
	},
	showStreamUptime: function(value) {
		if(localStorage.getItem("setting_clock_condenseClocks") === "false") {
			if(value === "true") {
				$("#streamUptime").show();
				$("#streamUptime").children().show();
			} else {
				$("#streamUptime").hide();
				$("#streamUptime").children().hide();
			}
		}

		clocksEnabled.streamUptime = (value === "true");
	},
	showAdTimer: function(value) {
		if(localStorage.getItem("setting_clock_condenseClocks") === "false") {
			if(value === "true") {
				$("#nextAd").show();
				$("#nextAd").children().show();
			} else {
				$("#nextAd").hide();
				$("#nextAd").children().hide();
			}
		}

		clocksEnabled.nextAd = (value === "true");
	},
	condenseClocks: function(value) {
		if(value === "true") {
			$(".clockElement").removeClass("activeClock").hide();
			currentClock = -1;
			switchClock();
		} else {
			$(".clockElement .head").removeClass("slideIn").removeClass("slideOut");
			$(".clockElement .value").removeClass("slideIn").removeClass("slideOut");

			if(localStorage.getItem("setting_clock_showLocalTime") === "true") {
				$("#localTime").show();
				$("#localTime .effectWrapper").children().show();
			} else {
				$("#localTime").hide();
				$("#localTime .effectWrapper").children().hide();
			}

			if(localStorage.getItem("setting_clock_showStreamUptime") === "true") {
				$("#streamUptime").show();
				$("#streamUptime .effectWrapper").children().show();
			} else {
				$("#streamUptime").hide();
				$("#streamUptime .effectWrapper").children().hide();
			}

			if(localStorage.getItem("setting_clock_showAdTimer") === "true") {
				$("#nextAd").show();
				$("#nextAd .effectWrapper").children().show();
			} else {
				$("#nextAd").hide();
				$("#nextAd .effectWrapper").children().hide();
			}
		}
	},
	localTimeHeaderString: function(value) {
		setTZ();
	},
	streamUptimeHeaderString: function(value) {
		setTZ();
	},
	nextAdHeaderString: function(value) {
		setTZ();
	},
	fadeDuration: function(value) {
		rootCSS().setProperty("--animationDuration", `${value}s`);
	}
};

function updateSetting(which, value, oldValue) {
	if(which.indexOf("setting_clock_") === -1) {
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