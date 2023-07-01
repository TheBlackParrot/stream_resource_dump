$("#sensitive .section").show();
$("#sideButtons").css("top", parseInt($("#sidebar").css("height")) + 40);

function resetEverything() {
	// old v1
	let tempID = localStorage.getItem("twitch_clientID");
	let tempSecret = localStorage.getItem("twitch_clientSecret");
	if(!tempID) {
		// new v2
		tempID = localStorage.getItem("setting_twitchClientID");
		tempSecret = localStorage.getItem("setting_twitchClientSecret");
		tempChannel = localStorage.getItem("setting_twitchChannel");
	}

	localStorage.clear();

	if(tempID) {
		localStorage.setItem("setting_twitchClientID", tempID);
		localStorage.setItem("setting_twitchClientSecret", tempSecret);	
	}
	if(tempChannel) {
		localStorage.setItem("setting_twitchChannel", tempChannel);	
	}
}

function settingsCheck() {
	const version = parseInt(localStorage.getItem("setting_version"));

	if(isNaN(version)) {
		if(localStorage.getItem("twitch_clientID")) {
			// user probably has keys, move them over
			resetEverything();
		}
	}

	localStorage.setItem("setting_version", "1");
}
settingsCheck();

var activeRow;
function setRow(which, bypassSensitiveCheck) {
	console.log(`should show row ${which}`);

	activeRow = which;
	let section = $(`.section[data-content="${which}"]`);
	let row = $(`.row[data-tab="${which}"]`);

	$(".active").removeClass("active");
	row.addClass("active");

	$("#settings .section").hide();

	if(section.attr("data-sensitive") === "true" && !bypassSensitiveCheck) {
		$("#settings").hide();
		$("#sensitive").show();
	} else {
		$("#sensitive").hide();
		$("#settings").show();
		section.show();
	}
}
setRow("layout");

$(".row").on("click", function(e) {
	e.preventDefault();
	setRow($(this).attr("data-tab"));

	console.log("clicked row");
});

$("input, select, textarea").on("change", function(e) {
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

$("#hideSensitiveWarning").on("mouseup", function(e) {
	$("#sensitive").hide();
	$("#settings").show();

	setRow(activeRow, true);
});

$("#reloadOverlayButton").on("mouseup", function(e) {
	localStorage.setItem("setting_windowReload", Date.now());
});

$("#sendTestButton").on("mouseup", function(e) {
	localStorage.setItem("setting_testMessage", Date.now());
});

var resetTimeout;
$("#resetOverlayButton").on("mouseup", function(e) {
	e.preventDefault();
	if($(this).text() === "Are you sure?") {
		resetEverything();
		localStorage.setItem("setting_windowReload", Date.now());
		location.reload();
	}

	$(this).text("Are you sure?");
	var elem = $(this); // augh
	resetTimeout = setTimeout(function() {
		elem.text("Reset to Defaults");
	}, 5000);
})