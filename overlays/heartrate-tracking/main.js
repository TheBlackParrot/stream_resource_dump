var curHR = -1;
var finalHR = -1;

var mapHighestPeak = 0;
var overallHighestPeak = 0;

var showMapHighest = false;

function updateHR(rate) {
	console.log(rate);

	finalHR = rate;

	if(finalHR > overallHighestPeak) {
		overallHighestPeak = finalHR;
	}
	if(finalHR > mapHighestPeak) {
		mapHighestPeak = finalHR;
	}

	if(showMapHighest) {
		$("#peak_value").text(mapHighestPeak);
		$(".which-icon").removeClass("fa-globe").addClass("fa-map");
	} else {
		$("#peak_value").text(overallHighestPeak);
		$(".which-icon").removeClass("fa-map").addClass("fa-globe");
	}

	$(":root").get(0).style.setProperty(`--beatInterval`, `${60/rate}s`);
	animateHRChange();
}

var hrChangeTO;
function animateHRChange() {
	animatingHRChange = true;
	clearTimeout(hrChangeTO);

	if(curHR === finalHR) {
		return;
	}

	let toChange = finalHR - curHR;

	if(!toChange) {
		animatingAccChange = false;
		return;
	}

	if(toChange > 0) {
		curHR += 1;
	} else if(toChange < 0) {
		curHR -= 1;
	}

	if(curHR < 10) {
		$("#transparent_number").text("00");
	} else if(curHR < 100) {
		$("#transparent_number").text("0");
	} else {
		$("#transparent_number").empty();
	}
	$("#cur_value_value").text(curHR);

	hrChangeTO = setTimeout(animateHRChange, 10);
}

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