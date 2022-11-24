setInterval(function() {
	let d = new Date();
	let h = d.getHours().toString().padStart(2, "0");
	let m = d.getMinutes().toString().padStart(2, "0");
	let s = d.getSeconds().toString().padStart(2, "0");

	$("#clock").text(`${h}:${m}`);
	$("#seconds").text(s);
}, 1000);