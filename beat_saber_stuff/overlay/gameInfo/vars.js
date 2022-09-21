const query = new URLSearchParams(location.search);

const ip = query.get("ip") || "127.0.0.1";
const port = query.get("port") || 2947;
const whom = query.get("name");

const customVars = [
	"fontFamily",           // Font used throughout the overlay (some Google fonts are provided (not directly through them), check fonts.css) [Manrope]
	"charWidth",			// Width of each number character
	"accWeight",
	"comboWeight",
	"hitMissWeight",
	"bestAccPPWeight",
	"outlineColor",         // Text outline color [rgba(0,0,0,0.5)]
	"shadowColor"          // Element drop shadow color [#000]
];

for(let i in customVars) {
	let customVar = customVars[i];
	let val = query.get(customVar);

	if(val !== null) {
		$(":root").get(0).style.setProperty(`--${customVar}`, val.replace("$", "#"));
	}
}

// By default, all lettering will have black outlines. Turning this on will disable them.
if(query.get("disableOutlines")) {
	$(":root").get(0).style.setProperty("--outlineFilter", " ");
}

// By default, all text will have slight drop shadows. Turning this on will disable them.
if(query.get("disableShadows")) {
	$(":root").get(0).style.setProperty("--dropShadowFilter", " ");
	$("#shadowTrickery").hide();
}