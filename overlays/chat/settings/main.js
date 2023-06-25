function setRow(which) {
	console.log(`should show row ${which}`)
	$(".section").hide();
	$(`.section[data-content="${which}"]`).show();

	$(".active").removeClass("active");
	$(`.row[data-tab="${which}"]`).addClass("active");
}
setRow("appearance");

$(".row").on("click", function(e) {
	e.preventDefault();
	setRow($(this).attr("data-tab"));

	console.log("clicked row");
});

$("input, select").on("change", function(e) {
	let value = null;
	let parent = $(this).parent().parent();
	let setting = $(this).attr("id");

	switch($(this).attr("type")) {
		case "checkbox":
			value = $(this).is(":checked");
			let dependent = $(this).attr("data-dependent");

			if(dependent !== undefined) {
				let settings = $.find(".setting");

				for(let i in settings) {
					let element = $(settings[i]);
					if(element[0] === parent[0]) {
						console.log("same as parent element");
						continue;
					}

					if(element.attr("data-dependent") === dependent) {
						if(value) {
							element.show();
						} else {
							element.hide();
						}
					}
				}
			}
			break;

		default:
			value = $(this).val();
			break;
	}

	if(value !== null && setting && loadingInit) {
		console.log(`setting ${setting} is now ${value}`);
		localStorage.setItem(`setting_${setting}`, value);
	}
});