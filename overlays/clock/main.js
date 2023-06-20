function setTZ() {
	// undefined will automatically grab the system's locale. which is what we want to happen
	let tz = new Date().toLocaleTimeString(undefined, { timeZoneName: "short" }).split(" ");

	let offset = new Date().getTimezoneOffset() * -1;
	let offsetMins = offset % 60;
	let offsetHrs = Math.floor(offset / 60);

	let formattedOffset = `UTC${offsetHrs >= 0 ? "+" : ""}${offsetHrs}${offsetMins ? `:${offsetMins.toString().padStart(2, "0")}` : ""}`;

	let tzOut = [];
	if(tz.length === 3) {
		tzOut.push(tz[2]);
	}
	tzOut.push(formattedOffset);

	$("#timezone").text(tzOut.join(" / "));
}
setTZ();

function doClock() {
	let d = new Date();
	let h = d.getHours().toString().padStart(2, "0");
	let m = d.getMinutes().toString().padStart(2, "0");
	let s = d.getSeconds().toString().padStart(2, "0");

	$("#clock").html(`${h}:${m}<span id="seconds">${s}</span>`);
}
doClock();

setInterval(doClock, 1000);

window.addEventListener("storage", function(event) {
	switch(event.key) {
		case "art_darkColor":
			$(":root").get(0).style.setProperty("--colorDark", event.newValue);
			break;

		case "art_lightColor":
			$(":root").get(0).style.setProperty("--colorLight", event.newValue);
			break;
	}
});
$(":root").get(0).style.setProperty("--colorLight", localStorage.getItem("art_lightColor"));
$(":root").get(0).style.setProperty("--colorDark", localStorage.getItem("art_darkColor"));