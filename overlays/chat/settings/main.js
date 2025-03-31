function changeStatusCircle(which, status, msg) {
	console.log(`${which}: ${status} - ${msg}`)
	let circleWhich = $(`#${which}`);
	let msgWhich = circleWhich.parent().children(".statusMessage");

	circleWhich.removeClass("grayCircle").removeClass("redCircle").removeClass("greenCircle").addClass(`${status}Circle`);
	msgWhich.removeClass("grayMessage").removeClass("redMessage").removeClass("greenMessage").addClass(`${status}Message`).text(msg);
}

$("#sensitive .section").show();

const overlayRevision = 92;
const overlayRevisionTimestamp = 1743427856680;
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

		if(version < 4) {
			console.log("removing old user-customization variables");

			var keys = Object.keys(localStorage);
			const wants = [
				"(namesize_)",
				"(nametransform_)",
				"(namestyle_)",
				"(namespacing_)",
				"(namevariant_)",
				"(nameangle_)",
				"(nameweight_)",
				"(namefont_)",
				"(nameshadow_)",
				"(nameoutline_)",
				"(msgsize_)",
				"(msgweight_)",
				"(msgspacing_)",
				"(msgfont_)",
				"(color_)",
				"(color2_)",
				"(pfpshape_)",
				"(showpfp_)",
				"(flags_)",
				"(usename_)",
				"(use7tvpaint_)"
			];
			const re = new RegExp(wants.join("|"), "i")
			oldKeys = keys.filter(function(key) {
				return re.test(key);
			});

			console.log(oldKeys);

			for(const key of oldKeys) {
				localStorage.removeItem(key);
			}
		}
	}

	localStorage.setItem("setting_version", "4");
}

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

	$("#settings .section").removeClass("activeSection");

	if(section.attr("data-sensitive") === "true" && !bypassSensitiveCheck) {
		$("#settings").hide();
		$("#sensitive").show();
	} else {
		$("#sensitive").hide();
		$("#settings").show();
		section.addClass("activeSection");
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

	if(which === "updates") {
		$(".newUpdates").fadeOut(2000);
		localStorage.setItem("_lastClickedUpdateTab", Date.now());
	}
}

function showExtraRow(name) {
	if($(`.extraRow[data-tab="${name}"]`).is(":visible")) {
		return;
	}

	if(!$(".extraHR").is(":visible")) {
		$(".extraHR").show();
	}
	$(`.extraRow[data-tab="${name}"]`).show();
}

$("body").on("click", ".row", function(e) {
	e.preventDefault();
	setRow($(this).attr("data-tab"));

	$("#quickJumpBar").hide();
	$(".quickJumpIsActive").removeClass("quickJumpIsActive");
});

$("body").on("click", ".rowCollapsable", function(e) {
	e.preventDefault();
	const entries = $(`.rowEntries[data-tab="${$(this).attr("data-tab")}"]`);
	if(entries.is(":visible")) {
		entries.hide();
		$(this).removeClass("isCollapsed");
		$(this).children(".treeIcon").addClass("fa-angle-right").removeClass("fa-angle-down");
	} else {
		entries.show();
		$(this).addClass("isCollapsed");
		$(this).children(".treeIcon").addClass("fa-angle-down").removeClass("fa-angle-right");
	}
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
	if($(this).hasClass("selectedBackup")) {
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

		if(value.toString() !== defaultConfig[setting] && defaultConfig[setting] !== "") {
			$(`.resetToDefaultValueButton[data-setting="${setting}"]`).show();
		} else {
			$(`.resetToDefaultValueButton[data-setting="${setting}"]`).hide();
		}
	}

	if(setting.substring(0, 6) === "panel_") {
		updateSetting(`setting_${setting}`, value);
	}

	if(setting === "_overall_bgColor") {
		postToBGColorChannel(value);
	}

	if(setting in settingUpdatersTrigger) {
		console.log(`wanted trigger for ${setting}`);
		settingUpdatersTrigger[setting]();
	}
});

$("body").on("mouseup", ".resetToDefaultValueButton", function(e) {
	const setting = $(this).attr("data-setting");
	console.log(`wants to reset ${setting}`);

	if(!setting.length) {
		console.log("setting was empty");
		return;
	}

	const newValue = defaultConfig[setting];
	const element = $(`#${setting}`);

	switch(element.attr("type")) {
		case "checkbox":
			element.prop("checked", newValue === "true").trigger("change");
			break;

		default:
			element.val(newValue).trigger("update").trigger("change");
	}

	if(element.is("select")) {
		FancySelect.update(element[0]);
	} else if(element.attr("data-coloris") !== undefined) {
		element[0].dispatchEvent(new Event('input', { bubbles: true }));
	}

	if(setting === "panel_primaryColor") {
		updateSetting(`setting_${setting}`, newValue);
	}
});

$("#hideSensitiveWarning").on("mouseup", function(e) {
	$("#sensitive").hide();
	$("#settings").show();

	setRow(activeRow, true);
});

$("#reloadPanelButton").on("mouseup", function(e) {
	location.reload();
});

function changeButtonText(element, str, showIcon) {
	const oldWidth = `${element.width()}px`;

	const iconElements = element.children("i");
	if(iconElements.length) {
		element.attr("data-icon", $(iconElements[0]).attr("class"));
	}

	element.text(str);

	if(showIcon) {
		let icon = element.attr("data-icon");
		element.css("width", "").prepend($(`<i class="${icon}"></i>`));
	} else {
		element.css("width", oldWidth);
	}
}

var resetTimeout;
$("#resetOverlayButton").on("mouseup", function(e) {
	e.preventDefault();
	if($(this).text() === "Are you sure?") {
		resetEverything();

		setTimeout(function() {
			postToChannel("reload");
			location.reload();
		}, 100);

		changeButtonText($(this), "Reset to Defaults", true);
	}

	changeButtonText($(this), "Are you sure?", false);
	var elem = $(this); // augh
	resetTimeout = setTimeout(function() {
		changeButtonText(elem, "Reset to Defaults", true);
	}, 5000);
})

$("#clearSpotifyButton").on("mouseup", function(e) {
	e.preventDefault();

	if($(this).text() === "Are you sure?") {
		spotifyCodeVerifier = getRandomString(128);
		localStorage.removeItem("spotify_refreshToken");
		localStorage.removeItem("spotify_accessToken");
		clearTimeout(updateTrackTO);

		addNotification("Cached Spotify tokens have been cleared, please reconnect to Spotify.", {duration: 10});
		changeButtonText($(this), "Clear Cached Tokens", true);
	}

	changeButtonText($(this), "Are you sure?", false);
	var elem = $(this); // augh
	resetTimeout = setTimeout(function() {
		changeButtonText(elem, "Clear Cached Tokens", true);
	}, 5000);
});

var sidebarWidth = "210px";
$("#collapseSidebar").on("mouseup", function(e) {
	$(this).css("transition", "0s");

	if($("#sidebar").is(":visible")) {
		$("#sidebar").hide();
		rootCSS().setProperty("--sidebar-width", "0px");
		$(this).css("transition", ".5s");
		$("#collapseSidebar i").removeClass("fa-angle-left").addClass("fa-angle-right");
	} else {
		rootCSS().setProperty("--sidebar-width", sidebarWidth);
		$("#sidebar").show();
		$(this).css("transition", ".5s");
		$("#collapseSidebar i").removeClass("fa-angle-right").addClass("fa-angle-left");
	}
});

$.get(`version.json?sigh=${Date.now()}`, function(data) {
	if(overlayRevision !== data.revision) {
		$("#updateString").html('<i class="fas fa-times"></i> Out of date!');
		addNotification(`Overlay settings panel is out of date! (You are running r${overlayRevision}, server reports r${data.revision})`, {bgColor: "var(--notif-color-warning)", textColor: "#000", duration: 120});
	} else {
		$("#updateString").html('<i class="fas fa-check"></i> Up to date');
		addNotification("Overlay settings panel is up to date!", {bgColor: "var(--notif-color-success)", duration: 10});
	}
});

async function compressImage(url, size, quality, cacheStorageName, cacheExpireDaysAfter) {
	const isRemote = (url.substr(0, 4) === "http");

	if(isRemote) {
		console.log(`compressing image ${url} to ${size}x${size} at quality ${quality*100}`);
	} else {
		console.log(`compressing raw image to ${size}x${size} at quality ${quality*100}`);
	}

	const controller = new AbortController();
	const timedOutID = setTimeout(() => controller.abort(), parseFloat(localStorage.getItem("setting_ajaxTimeout")) * 1000);

	var response;
	if(cacheStorageName === "spotify") {
		response = await getCachedSpotifyImage(url, cacheExpireDaysAfter);
	} else {
		try {
			response = await fetch(url, { signal: controller.signal });
		} catch(err) {
			console.log("failed to fetch image");
			return "placeholder.png";
		}
	}

	if(!response.ok) {
		console.log("failed to fetch image");
		return "placeholder.png";
	}

	const blob = await response.blob();
	const bitmap = await createImageBitmap(blob);

	let canvas = document.createElement('canvas');
	let ctx = canvas.getContext('2d');

	canvas.height = canvas.width = size;

	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = "high";
	ctx.drawImage(bitmap, 0, 0, size, size);
	return canvas.toDataURL("image/jpeg", quality);
}

$("#clearBSDataCacheButton").on("mouseup", function(e) {
	e.preventDefault();
	caches.delete("beatSaverCache");

	addNotification("Cached BeatSaver data has been cleared.", {duration: 5});
});
$("#clearRankedMapDataCacheButton").on("mouseup", function(e) {
	e.preventDefault();
	caches.delete("BeatLeaderCache");
	caches.delete("ScoreSaberCache");

	addNotification("Cached ranked map data has been cleared.", {duration: 5});
});

$("#UAString").text(window.navigator.userAgent);