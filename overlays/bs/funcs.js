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

function getYIQ(rawColor) {
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

function ensureSafeColor(color, minBrightness, maxBrightness) {
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

function checkCustomColors() {
	if("colors" in activeMap) {
		if(localStorage.getItem("setting_bs_handsColorReflectsSaberColors") === "true") {
			let leftColor = activeMap.colors.left;
			let rightColor = activeMap.colors.right;

			if(localStorage.getItem("setting_bs_ensureHandsColorIsBrightEnough") === "true") {
				let minBrightness = (parseFloat(localStorage.getItem("setting_bs_handsColorMinBrightness"))/100) * 255;
				let maxBrightness = (parseFloat(localStorage.getItem("setting_bs_handsColorMaxBrightness"))/100) * 255;

				leftColor = ensureSafeColor(leftColor, minBrightness, maxBrightness);
				rightColor = ensureSafeColor(rightColor, minBrightness, maxBrightness);
			}

			rootCSS().setProperty("--handsLeftColor", leftColor);
			rootCSS().setProperty("--handsRightColor", rightColor);
		}
	}
}