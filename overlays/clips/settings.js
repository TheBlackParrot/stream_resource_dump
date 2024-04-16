const widthHeightRatio = (16/9);

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
	videoHeight: function(value) {
		rootCSS().setProperty("--videoWidth", `${parseInt(value) * widthHeightRatio}px`);
		rootCSS().setProperty("--videoHeight", `${value}px`);
	},

	videoRadius: function(value) {
		rootCSS().setProperty("--videoBorderRadius", `${value}px`);
	},

	enableAnimations: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--animationDurationMedium", '0.5s');
			rootCSS().setProperty("--animationDurationLong", '0.67s');
			$("#streamerTag, #streamerAvatar, #streamerName").addClass("float");
		} else {
			rootCSS().setProperty("--animationDurationMedium", '0s');
			rootCSS().setProperty("--animationDurationLong", '0s');
			$("#streamerTag, #streamerAvatar, #streamerName").removeClass("float");
		}
	},

	detailsAlignment: function(value) {
		rootCSS().setProperty("--detailsAlignment", value);
	},

	streamerColor: function(value) {
		rootCSS().setProperty("--streamerColor", value);	
	},
	streamerFont: function(value) {	
		rootCSS().setProperty("--streamerFont", value);	
	},
	streamerFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--streamerFontItalic", "italic");	
		} else {
			rootCSS().setProperty("--streamerFontItalic", "normal");
		}
	},
	streamerFontSize: function(value) {
		rootCSS().setProperty("--streamerFontSize", `${value}pt`);
	},
	streamerFontWeight: function(value) {
		rootCSS().setProperty("--streamerFontWeight", value);
	},
	streamerFontAdditionalWeight: function(value) {
		rootCSS().setProperty("--streamerAdditionalWeight", `${value}px`);
	},

	titleFont: function(value) {
		rootCSS().setProperty("--titleFont", value);
	},
	titleFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--titleFontItalic", "italic");	
		} else {
			rootCSS().setProperty("--titleFontItalic", "normal");
		}
	},
	titleFontSize: function(value) {
		rootCSS().setProperty("--titleFontSize", `${value}pt`);
	},
	titleFontWeight: function(value) {
		rootCSS().setProperty("--titleFontWeight", value);
	},
	titleFontAdditionalWeight: function(value) {
		rootCSS().setProperty("--titleAdditionalWeight", `${value}px`);
	},

	detailsColor: function(value) {
		rootCSS().setProperty("--detailsColor", value);
	},
	detailsFont: function(value) {
		rootCSS().setProperty("--detailsFont", value);
	},
	detailsFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--detailsFontItalic", "italic");	
		} else {
			rootCSS().setProperty("--detailsFontItalic", "normal");
		}
	},
	detailsFontSize: function(value) {
		rootCSS().setProperty("--detailsFontSize", `${value}pt`);
	},
	detailsFontWeight: function(value) {
		rootCSS().setProperty("--detailsFontWeight", value);
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
		if(value >= 3 && localStorage.getItem("setting_clips_outlineStripCorners") === "true") {
			matrix = getSmoothMatrix(value, parseFloat(localStorage.getItem("setting_clips_outlineThreshold")));
		} else {
			matrix = new Array(Math.pow(value, 2)).fill(1);
		}

		$("feConvolveMatrix").attr("order", `${value},${value}`);
		$("feConvolveMatrix").attr("kernelMatrix", matrix.join(" "));
	},
	outlineStripCorners: function() {
		settingUpdaters.outlineOrder(localStorage.getItem("setting_clips_outlineOrder"));
	},
	overlayOutlineThreshold: function() {
		settingUpdaters.overlayOutlineOrder(localStorage.getItem("setting_clips_outlineOrder"));
	},

	enableBoxShadowEffects: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--box-shadow-effects-actual", "var(--box-shadow-effects)");
		} else {
			rootCSS().setProperty("--box-shadow-effects-actual", "none");
		}
	},
	boxShadowColor: function(value) {
		rootCSS().setProperty("--box-shadow-effects-color", value);
	},
	boxShadowXOffset: function(value) {
		rootCSS().setProperty("--box-shadow-effects-offset-x", `${value}px`);
	},
	boxShadowYOffset: function(value) {
		rootCSS().setProperty("--box-shadow-effects-offset-y", `${value}px`);
	},
	boxShadowBlurRadius: function(value) {
		rootCSS().setProperty("--box-shadow-effects-blur-radius", `${value}px`);
	},
	boxShadowBlurInset: function(value) {
		rootCSS().setProperty("--box-shadow-effects-inset", `${value}px`);
	},

	enableVideoBorder: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--videoBorderActual", "var(--videoBorder)");
		} else {
			rootCSS().setProperty("--videoBorderActual", "none");
		}
	},
	borderColor: function(value) {
		rootCSS().setProperty("--videoBorderColor", value);
	},
	borderSize: function(value) {
		rootCSS().setProperty("--videoBorderSize", `${value}px`);
	},
	borderStyle: function(value) {
		rootCSS().setProperty("--videoBorderStyle", value);
	},

	streamerUsesGradient: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--streamerGradientActual", "var(--streamerGradient)");
		} else {
			rootCSS().setProperty("--streamerGradientActual", "var(--streamerColor)");
		}
	},
	titleUsesGradient: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--titleGradientActual", "var(--titleGradient)");
		} else {
			rootCSS().setProperty("--titleGradientActual", "var(--titleColor)");
		}
	},
	streamerColor: function(value) {
		rootCSS().setProperty("--streamerColor", value);
	},
	streamerGradientColor: function(value) {
		rootCSS().setProperty("--streamerGradientColor", value);
	},
	streamerGradientAngle: function(value) {
		rootCSS().setProperty("--streamerGradientAngle", `${value}deg`);
	},
	titleColor: function(value) {
		rootCSS().setProperty("--titleColor", value);
	},
	titleGradientColor: function(value) {
		rootCSS().setProperty("--titleGradientColor", value);
	},
	titleGradientAngle: function(value) {
		rootCSS().setProperty("--titleGradientAngle", `${value}deg`);
	},
	showDetails: function(value) {
		if(value === "true") {
			$("#detailsWrap").show();
		} else {
			$("#detailsWrap").hide();
		}
	},

	overlayMargin: function(value) {
		rootCSS().setProperty("--overlayMargin", `${value}px`);
	},
	elementSpacing: function(value) {
		rootCSS().setProperty("--overlayVerticalSpacing", `${value}px`);
	},

	blurStreamerBG: function(value) {
		if(value === "true") {
			$("#streamerAvatarBG").show();
		} else {
			$("#streamerAvatarBG").hide();
		}
	},
	blurStreamerBGAmount: function(value) {
		rootCSS().setProperty("--backgroundBlurAmount", `${value}px`);
	},
	blurDetailsBG: function(value) {
		if(value === "true") {
			$("#gameCoverBG").show();
		} else {
			$("#gameCoverBG").hide();
		}
	},
	blurDetailsBGAmount: function(value) {
		rootCSS().setProperty("--backgroundFooterBlurAmount", `${value}px`);
	}
};

function updateSetting(which, value, oldValue) {
	if(which.indexOf("setting_clips_") === -1) {
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