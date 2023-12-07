function setTZ() {
	if(localStorage.getItem("setting_clock_overrideHeader") === "true") {
		$("#timezone").text(localStorage.getItem("setting_clock_overrideHeaderString"));
		return;
	}

	const dt = luxon.DateTime.local();

	const tz = {
		name: dt.offsetNameLong.split(" "),
		initials: "",
		prefix: "",
		offset: dt.offset / 60
	};

	for(const word of tz.name) {
		tz.initials += word[0].toUpperCase();
	}

	if(tz.offset < 0) { 
		tz.prefix = "";
	} else if(tz.offset > 0) {
		tz.prefix = "+";
	}

	console.log(tz);

	$("#timezone").text(`${tz.initials} / GMT${tz.prefix}${tz.offset}`);
}
setTZ();

function doClock() {
	const d = new Date();

	let h = d.getHours();
	if(localStorage.getItem("setting_clock_use12Hour") === "true") {
		$("#meridiem").text(h >= 12 ? " PM" : " AM");
		h = (h > 12 ? h % 12 : h);
	} else {
		$("#meridiem").empty();
	}

	if(localStorage.getItem("setting_clock_padHour") === "true") {
		h = h.toString().padStart(2, "0");
	}

	let m = d.getMinutes().toString().padStart(2, "0");
	let s = d.getSeconds().toString().padStart(2, "0");

	$("#clockMain").text(`${h}:${m}`);
	$("#seconds").text(s);

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