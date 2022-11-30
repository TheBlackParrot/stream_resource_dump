currentIdx = 1;
max = 4;

function doThing(is_init) {
	if(!is_init) {
		let old = $(".active");
		old.hide();
		old.marquee('destroy');
	}

	if(currentIdx > max) {
		currentIdx = 1;
	}

	$(".active").removeClass("active");
	$(`.message[idx=${currentIdx}]`).addClass("active");

	$(".active").fadeIn(300, function() {
		$(".active").bind("finished", function() {
			currentIdx++;
			doThing();
		}).marquee({
			speed: 150,
			pauseOnCycle: true,
			startVisible: true,
			delayBeforeStart: 2500
		});
	});
}
doThing(1);