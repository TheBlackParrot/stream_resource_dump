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