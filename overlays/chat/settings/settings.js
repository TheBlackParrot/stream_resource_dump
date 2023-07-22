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
			$("#sidebar").append($('<hr class="extraHR"/>'));
		}
		$("#sidebar").append('<div class="row extraRow" data-tab="bsvodaudio"><i class="fas fa-wrench"></i>BS VOD Audio</div>');

		setButtonYPos();
	}
});