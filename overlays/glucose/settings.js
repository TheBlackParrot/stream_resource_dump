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
	enablePadding: function(value) {
		if(value === "true") {
			$("#transparent_number").show();
		} else {
			$("#transparent_number").hide();
		}
	},
	fadeOutPadding: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--valuePaddingOpacity", "0.33");
		} else {
			rootCSS().setProperty("--valuePaddingOpacity", "1");
		}
		setValueDisplay();
	},
	elementSpacing: function(value) {
		rootCSS().setProperty("--verticalSpacing", `${parseFloat(value) / 2}px`);
	},
	elementWidth: function(value) {
		rootCSS().setProperty("--elementWidth", `${value}px`);
	},
	elementJustify: function(value) {
		rootCSS().setProperty("--elementJustify", value);
	},
	overlayMarginHorizontal: function(value) {
		rootCSS().setProperty("--horizontalMargin", `${value}px`);
	},
	overlayMarginVertical: function(value) {
		rootCSS().setProperty("--verticalMargin", `${value}px`);
	},
	headerIconColor: function(value) {
		rootCSS().setProperty("--headerIconColorActual", value);
	},
	headerAdaptColor: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--headerColor", "var(--colorLight)");
		} else {
			rootCSS().setProperty("--headerColor", "var(--headerColorActual)");
		}
	},
	headerColor: function(value) {
		rootCSS().setProperty("--headerColorActual", value);
	},
	headerFont: function(value) {
		rootCSS().setProperty("--headerFont", value);
	},
	headerFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--headerFontStyle", "italic");
		} else {
			rootCSS().setProperty("--headerFontStyle", "normal");
		}
	},
	headerFontSize: function(value) {
		rootCSS().setProperty("--headerFontSize", `${value}pt`);
	},
	headerFontWeight: function(value) {
		rootCSS().setProperty("--headerFontWeight", value);
	},
	headerFontWeightExtra: function(value) {
		rootCSS().setProperty("--headerFontWeightExtra", `${value}px`);
	},
	headerLetterSpacing: function(value) {
		rootCSS().setProperty("--headerLetterSpacing", `${value}px`);
	},
	valueIconColor: function(value) {
		rootCSS().setProperty("--valueIconColorActual", value);
	},
	valueAdaptColor: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--valueIconColor", "var(--colorLight)");
		} else {
			rootCSS().setProperty("--valueIconColor", "var(--valueIconColorActual)");
		}
	},
	valueColor: function(value) {
		rootCSS().setProperty("--valueColor", value);
	},
	valueFont: function(value) {
		rootCSS().setProperty("--valueFont", value);
	},
	valueFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--valueFontStyle", "italic");
		} else {
			rootCSS().setProperty("--valueFontStyle", "normal");
		}
	},
	valueFontSize: function(value) {
		rootCSS().setProperty("--valueFontSize", `${value}pt`);
	},
	valueFontWeight: function(value) {
		rootCSS().setProperty("--valueFontWeight", value);
	},
	valueFontWeightExtra: function(value) {
		rootCSS().setProperty("--valueFontWeightExtra", `${value}px`);
	},
	valueLetterSpacing: function(value) {
		rootCSS().setProperty("--valueLetterSpacing", `${value}px`);
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
		if(value >= 3 && localStorage.getItem("setting_ns_outlineStripCorners") === "true") {
			matrix = getSmoothMatrix(value, parseFloat(localStorage.getItem("setting_ns_outlineThreshold")));
		} else {
			matrix = new Array(Math.pow(value, 2)).fill(1);
		}

		$("feConvolveMatrix").attr("order", `${value},${value}`);
		$("feConvolveMatrix").attr("kernelMatrix", matrix.join(" "));
	},
	outlineStripCorners: function() {
		settingUpdaters.outlineOrder(localStorage.getItem("setting_ns_outlineOrder"));
	},
	overlayOutlineThreshold: function() {
		settingUpdaters.overlayOutlineOrder(localStorage.getItem("setting_ns_outlineOrder"));
	},

	headerUsesGradient: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--headerBackgroundImage", `var(--headerGradientBackground)`);
			rootCSS().setProperty("--headerBackgroundColor", "unset");
		} else {
			rootCSS().setProperty("--headerBackgroundImage", "unset");
			rootCSS().setProperty("--headerBackgroundColor", `var(--headerColor)`);
		}
	},
	headerGradientColor: function(value) {
		rootCSS().setProperty("--headerGradientColor", value);
	},
	headerGradientAngle: function(value) {
		rootCSS().setProperty("--headerGradientAngle", `${value}deg`);
	},
	valueIconUsesGradient: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--valueIconBackgroundImage", `var(--valueIconGradientBackground)`);
			rootCSS().setProperty("--valueIconBackgroundColor", "unset");
		} else {
			rootCSS().setProperty("--valueIconBackgroundImage", "unset");
			rootCSS().setProperty("--valueIconBackgroundColor", `var(--valueIconColor)`);
		}
	},
	valueIconGradientColor: function(value) {
		rootCSS().setProperty("--valueIconGradientColor", value);
	},
	valueIconGradientAngle: function(value) {
		rootCSS().setProperty("--valueIconGradientAngle", `${value}deg`);
	},
	valueIconSize: function(value) {
		rootCSS().setProperty("--valueIconSize", `${value}em`);
	},

	enableIcon: function(value) {
		rootCSS().setProperty("--valueIconDisplay", (value === "true" ? "inline-block" : "none"));
	},
	enableUnits: function(value) {
		rootCSS().setProperty("--unitsDisplay", (value === "true" ? "flex" : "none"));
	},
	enableTrend: function(value) {
		rootCSS().setProperty("--trendDisplay", (value === "true" ? "inline-flex" : "none"));
	},

	headerText: function(value) {
		$("#peak").text(value);
	}
};

function updateSetting(which, value, oldValue) {
	if(which.indexOf("setting_ns_") === -1) {
		return;
	}

	let setting = which.substr(11);

	if(setting in settingUpdaters) {
		console.log(`setting ${setting} updated`);
		settingUpdaters[setting](value, oldValue);
	}
}
window.addEventListener("storage", function(event) {
	updateSetting(event.key, event.newValue, event.oldValue);
});