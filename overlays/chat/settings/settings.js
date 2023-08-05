var loadingInit = false;

function loadSettings() {
	let settings = $.find("input, select, textarea");

	for(let i in settings) {
		let element = $(settings[i]);

		let setting = element.attr("id");
		let val = null;

		switch(element.attr("type")) {
			case "checkbox":
				val = element.is(":checked");
				break;

			case "range":
				val = element.val();

				element[0].addEventListener("input", function(event) {
					element.parent().children(".rangeValue").text(event.target.value);

					value = event.target.value;
					max = parseInt(element.attr("max"));
					element.css("background-size", `${(value / max) * 100}% 100%`);
				});
				break;

			default:
				val = element.val();
		}

		if(setting && val !== null) {
			let storedVal = localStorage.getItem(`setting_${setting}`);

			if(storedVal !== null) {
				console.log(`loaded ${setting}: ${storedVal}`);
				switch(element.attr("type")) {
					case "checkbox":
						element.prop("checked", storedVal === "true").trigger("change");
						break;

					case "range":
						element.val(storedVal).trigger("update");
						break;

					default:
						element.val(storedVal);
				}
			} else {
				localStorage.setItem(`setting_${setting}`, val);
			}
		} else {
			console.log(`something went wrong: ${setting}, ${val}`);
		}
	}

	loadingInit = true;
}
loadSettings();

window.addEventListener("storage", function(event) {
	if(event.key === "_isPresent_bsvodaudio") {
		console.log("BS VOD Audio overlay is active");

		if(!$(".extraHR").length) {
			$("#rows").append($('<hr class="extraHR"/>'));
		}
		$("#rows").append('<div class="row extraRow" data-tab="bsvodaudio"><i class="fas fa-wrench"></i>BS VOD Audio</div>');
	}
});