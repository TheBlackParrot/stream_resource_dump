const trendEnums = {
	DoubleDown: "trendSingleDown",
	SingleDown: "trendSingleDown",
	FortyFiveDown: "trendFortyFiveDown",
	Flat: "trendFlat",
	FortyFiveUp: "trendFortyFiveUp",
	SingleUp: "trendSingleUp",
	DoubleUp: "trendSingleUp",
	"NOT COMPUTABLE": "trendFlat",
	"RATE OUT OF RANGE": "trendFlat"
};
var curValue = -1;
var finalValue = -1;

function updateValue(rate) {
	finalValue = rate;
	animateValueChange();
}

function updateTrend(trend) {
	$("#trendArrowWrapper i").removeClass("trendSingleDown trendFortyFiveDown trendFlat trendFortyFiveUp trendSingleUp");
	$("#trendArrowWrapper i").addClass(`${trendEnums[trend]}`);
}

function setValueDisplay() {
	if(curValue < 0) {
		return;
	}

	if(localStorage.getItem("setting_ns_fadeOutPadding") === "true") {
		if(curValue < 10) {
			$("#transparent_number").text("00");
		} else if(curValue < 100) {
			$("#transparent_number").text("0");
		} else {
			$("#transparent_number").empty();
		}
		$("#cur_value_value").text(curValue);
	} else {
		$("#transparent_number").empty();
		$("#cur_value_value").text(curValue.toString().padStart(3, "0"));
	}	
}

var valueChangeTO;
function animateValueChange() {
	if(localStorage.getItem("setting_ns_animateRateChanges") === "false") {
		animatingValueChange = false;
		curValue = finalValue;
	} else {
		animatingValueChange = true;
		clearTimeout(valueChangeTO);

		if(curValue === finalValue) {
			return;
		}

		let toChange = finalValue - curValue;

		if(!toChange) {
			animatingValueChange = false;
			return;
		}

		if(toChange > 0) {
			curValue += 1;
		} else if(toChange < 0) {
			curValue -= 1;
		}

		valueChangeTO = setTimeout(animateValueChange, parseInt(localStorage.getItem("setting_ns_animateRateInterval")));
	}

	setValueDisplay();
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