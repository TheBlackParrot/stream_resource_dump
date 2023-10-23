$.ajaxSetup({ timeout: parseInt(localStorage.getItem("setting_ajaxTimeout")) * 1000 || 7000 });

function changeStatusCircle(which, status, msg) {
	let circleWhich = $(`#${which}`);
	let msgWhich = circleWhich.parent().children(".statusMessage");

	circleWhich.removeClass("grayCircle").removeClass("redCircle").removeClass("greenCircle").addClass(`${status}Circle`);
	msgWhich.removeClass("grayMessage").removeClass("redMessage").removeClass("greenMessage").addClass(`${status}Message`).text(msg);
}

$("#sensitive .section").show();

const overlayRevision = 25;
const overlayRevisionTimestamp = 1698009712665;
$("#revision").text(`revision ${overlayRevision}`);

function resetEverything() {
	tempID = localStorage.getItem("setting_twitchClientID");
	tempSecret = localStorage.getItem("setting_twitchClientSecret");
	tempChannel = localStorage.getItem("setting_twitchChannel");

	doSettingsBackup();

	for(let setting in defaultConfig) {
		localStorage.removeItem(`setting_${setting}`);
	}

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
	} else {
		if(version < 2) {
			console.log("merging old alpha settings into color settings...");
			let sets = Object.keys(localStorage);

			for(let i in sets) {
				let setting = sets[i];
				console.log(`checking ${setting}...`);

				if(setting.indexOf("setting_") !== -1 && setting.indexOf("Alpha") !== -1) {
					console.log(`${setting} is an alpha setting`);
					let val = Math.round(parseFloat(localStorage.getItem(setting)) * 255).toString(16).padStart(2, "0");
					let nonAlphaSetting = setting.replace("Alpha", "");
					let old = localStorage.getItem(nonAlphaSetting);

					localStorage.setItem(nonAlphaSetting, `${old}${val}`);
					localStorage.removeItem(setting);
				}
			}
		}

		if(version < 3) {
			console.log("splitting old combined padding settings");

			localStorage.setItem("setting_chatMessageUserInfoElementPaddingVertical", localStorage.getItem("setting_chatMessageUserInfoElementPadding"));
			localStorage.setItem("setting_chatMessageUserInfoElementPaddingHorizontal", localStorage.getItem("setting_chatMessageUserInfoElementPadding"));
			localStorage.removeItem("setting_chatMessageUserInfoElementPadding");

			localStorage.setItem("setting_chatBlockIndividualPaddingVertical", localStorage.getItem("setting_chatBlockIndividualPadding"));
			localStorage.setItem("setting_chatBlockIndividualPaddingHorizontal", localStorage.getItem("setting_chatBlockIndividualPadding"));
			localStorage.removeItem("setting_chatBlockIndividualPadding");

			localStorage.setItem("setting_chatBlockPaddingVertical", localStorage.getItem("setting_chatBlockPadding"));
			localStorage.setItem("setting_chatBlockPaddingHorizontal", localStorage.getItem("setting_chatBlockPadding"));
			localStorage.removeItem("setting_chatBlockPadding");
		}
	}

	localStorage.setItem("setting_version", "3");
}
settingsCheck();

var activeRow;
var scrollTops = {};
var scrollLefts = {};
function setRow(which, bypassSensitiveCheck) {
	if(which === activeRow && !bypassSensitiveCheck) {
		return;
	}

	console.log(`should show row ${which}`);
	scrollTops[activeRow] = $("#settings").scrollTop();
	scrollLefts[activeRow] = $("#settings").scrollLeft();

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

	if(which in scrollTops) {
		$("#settings").scrollTop(scrollTops[which]);
	} else {
		$("#settings").scrollTop(0);
	}
	if(which in scrollLefts) {
		$("#settings").scrollLeft(scrollLefts[which]);
	} else {
		$("#settings").scrollLeft(0);
	}
}
setRow("about");

$("body").on("click", ".row", function(e) {
	e.preventDefault();
	setRow($(this).attr("data-tab"));
});

$('input[type="range"]').on("update", function(e) {
	value = $(this).val();
	max = parseInt($(this).attr("max"));

	$(this).parent().children(".rangeValue").text(value);
	$(this).css("background-size", `${(value / max) * 100}% 100%`);
});

$("input, select, textarea").on("change", function(e) {
	if($(this).attr("data-ignoreSetting") === "true") {
		return;
	}
	
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
							element.removeClass("disabled");
						} else {
							element.addClass("disabled");
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
		let oldValue = localStorage.getItem(`setting_${setting}`);

		console.log(`setting ${setting} is now ${value}`);
		localStorage.setItem(`setting_${setting}`, value);

		if(setting === "twitchChannel" && value !== oldValue && isTwitchRunning) {
			client.part(oldValue).then(function() {
				client.join(value).then(function() {
					postToChannel("reload");
				});
			});
		}
	}
});

$("#hideSensitiveWarning").on("mouseup", function(e) {
	$("#sensitive").hide();
	$("#settings").show();

	setRow(activeRow, true);
});

$("#reloadPanelButton").on("mouseup", function(e) {
	location.reload();
})

var resetTimeout;
$("#resetOverlayButton").on("mouseup", function(e) {
	e.preventDefault();
	if($(this).text() === "Are you sure?") {
		resetEverything();

		setTimeout(function() {
			postToChannel("reload");
			location.reload();
		}, 100);
	}

	$(this).text("Are you sure?");
	var elem = $(this); // augh
	resetTimeout = setTimeout(function() {
		elem.text("Reset to Defaults");
	}, 5000);
})

$.get(`version.json?sigh=${Date.now()}`, function(data) {
	if(overlayRevision !== data.revision) {
		$("#updateString").html('<i class="fas fa-times"></i> Out of date!');
		addNotification(`Overlay settings panel is out of date! (You are running r${overlayRevision}, server reports r${data.revision})`, {bgColor: "var(--notif-color-warning)", textColor: "#000", duration: 10});
	} else {
		$("#updateString").html('<i class="fas fa-check"></i> Up to date');
		addNotification("Overlay settings panel is up to date!", {bgColor: "var(--notif-color-success)", duration: 10});
	}
});