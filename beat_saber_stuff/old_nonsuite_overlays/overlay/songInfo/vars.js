/*
	Use standard GET paramater URL elements to change settings, use $ in place of # symbols
	for example:
	- disable the background
		http://blah.blah/songInfo?disableBackground=1
	- disable the background, the shadows, and the outlines
		http://blah.blah/songInfo?disableBackground=1&disableShadows=1&disableOutlines=1
	- set the font to Oswald and make the title light-weight
		http://blah.blah/songInfo?fontFamily=Oswald&titleWeight=200
	- show all avatars regardless of mapper verification status and disable the automatic coloring system
		http://blah.blah/songInfo?showAllAvatars=1&disableAutoColoring=1
	- set the outline color to red (no), the shadow color to green (stop), the font to Comic Neue (WHY), and do not blur the background
		http://blah.blah/songInfo?outlineColor=rgba(255,0,0,0.5)&shadowColor=$0f0&fontFamily=Comic Neue&backgroundBlurAmount=0px

	all settings:
	- (everything in customVars below)
	- ip                  [127.0.0.1]
	- port                [2947]
	- showAllAvatars      (1 = all, 0 = verified only) [0]
	- disableAvatars      (1 = disabled, 0 = enabled) [0]
	- disableAutoColoring (1 = disabled, 0 = enabled) [0]
	- disableOutlines     (1 = disabled, 0 = enabled) [0]
	- disableShadows      (1 = disabled, 0 = enabled) [0]
	- disableBackground   (1 = disabled, 0 = enabled) [0]
	- capitalizeTitle     (1 = capitalized, 0 = normal) [0]
	- capitalizeSubtitle  (1 = capitalized, 0 = normal) [0]
	- capitalizeArtist    (1 = capitalized, 0 = normal) [0]
	- capitalizeCode      (1 = capitalized, 0 = normal) [0]
	- capitalizeMapper    (1 = capitalized, 0 = normal) [0]
	- hideArtOutline      (1 = no outline, 0 = normal) [0]
	- avatarShape         (2 = square, 1 = squircle, 0 = circle) [0]
	- swapDelay           (number of seconds) [7]
	- codeSwapDelay       (number of seconds) [5]
	- disableMovement     (1 = no start/end animation, 0 = normal) [0]
*/

const query = new URLSearchParams(location.search);

// IP/Port of BS+'s websocket library
const ip = query.get("ip") || "127.0.0.1";
const port = query.get("port") || 2947;

const customVars = [
	"fontFamily",           // Font used throughout the overlay (some Google fonts are provided (not directly through them), check fonts.css) [Manrope]
	"titleWeight",          // Font weight for the title element [900]
	"subtitleWeight",       // Font weight for the subtitle element [700]
	"artistWeight",         // Font weight for the artist and mapper elements [600]
	"statsWeight",          // Font weight for the stat value elements [700]
	"timeWeight",           // Font weight for the elapsed time and duration elements [700]
	"codeWeight",           // Font weight for the code and difficulty display [800]
	"backgroundBlurAmount", // Blur amount for the background [9px]
	"backgroundOpacity",    // Background opacity [0.6]
	"outlineColor",         // Text outline color [rgba(0,0,0,0.5)]
	"shadowColor",          // Element drop shadow color [#000]
	"progressBarWidth"      // Width of the song progress bar [500px]
];

for(let i in customVars) {
	let customVar = customVars[i];
	let val = query.get(customVar);

	if(val !== null) {
		$(":root").get(0).style.setProperty(`--${customVar}`, val.replace("$", "#"));
	}
}

// By default, the overlay will only display avatars for verified mappers. Turning this on will show all avatars, regardless of verification status.
// !! Highly, HIGHLY recommended to keep this off. !!
const showAllAvatars = query.get("showAllAvatars") | false;

// By default, mappers will have avatars beside their name. Turn this on to hide it.
const disableAvatars = query.get("disableAvatars") | false;

// By default, overlay elements will try to reflect colors in the album art. Turning this off will default them back to shades of white/gray.
const disableAutoColoring = query.get("disableAutoColoring") | false;

// By default, all lettering will have black outlines. Turning this on will disable them.
if(query.get("disableOutlines")) {
	$(":root").get(0).style.setProperty("--outlineFilter", " ");
}

// By default, all text will have slight drop shadows. Turning this on will disable them.
if(query.get("disableShadows")) {
	$(":root").get(0).style.setProperty("--dropShadowFilter", " ");
	$("#shadowTrickery").hide();
}

// By default, the overlay will have a blurred album art background. Turning this on will hide it.
if(query.get("disableBackground")) {
	$("#artBGWrap").hide();
}

// Turning this on will force-capitalize the title element
if(query.get("capitalizeTitle")) {
	$("#title").css("text-transform", "uppercase");
}

// Turning this on will force-capitalize the subtitle element
if(query.get("capitalizeSubtitle")) {
	$("#subtitle").css("text-transform", "uppercase");
}

// Turning this on will force-capitalize the artist element
if(query.get("capitalizeArtist")) {
	$("#artist").css("text-transform", "uppercase");
}

// Turning this on will force-capitalize the BSR code
if(query.get("capitalizeCode")) {
	$("#bsrCode").css("text-transform", "uppercase");
}

// Turning this on will force-capitalize the mapper element
if(query.get("capitalizeMapper")) {
	$("#mapperPreText").css("text-transform", "uppercase");
	$("#mapperName").css("text-transform", "uppercase");
}

// By default, the album art has a brighter psuedo-outline around it. Turn this on to hide it.
if(query.get("hideArtOutline")) {
	$("#artBehindWrap").hide();
	$("#aBB1").hide();
	$("#aBB2").hide();

	$("#artWrap").css("top", "29px");
	$("#artWrap").css("left", "29px");
	$("#artWrap").css("width", "156px");
	$("#artWrap").css("height", "156px");
}

// By default, the avatar will be a circle. Use 1 to change it to a rounded square, and 2 to make it a hard square.
switch(query.get("avatarShape")) {
	case 1:
	case "1":
	case "roundSquare":
	case "squircle":
		$("#avatar").css("border-radius", "10%");
		break;

	case 2:
	case "2":
	case "hardSquare":
	case "square":
		$("#avatar").css("border-radius", 0);
		break;

	default:
		break;
}

// By default, the artist/mapper/stats roles will swap every 7 seconds. Use this to change it.
const swapDelay = parseInt(query.get("swapDelay"))*1000 || 7000;

// By default, the code/difficulty block will swap every 5 seconds. Use this to change it.
const codeSwapDelay = parseInt(query.get("codeSwapDelay"))*1000 || 5000;

// By default, the overlay will blur/slide in and out when a song is started and finished. Turn this on to have it just appear.
const disableMovement = query.get("disableMovement") | false;
if(disableMovement) {
	$("body").removeClass("hide");
}

// By default, the overlay will show "!bsr" before the code in the BeatSaver code display box. Set this to 0 to hide it.
const showBSR = query.get("showBSR");
if(showBSR === "0") {
	$(".showBSR").removeClass("showBSR");
}