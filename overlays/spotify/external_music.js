const musicChannel = new BroadcastChannel("music");

const musicFuncs = {
	track: function(data) {
		cycleAlbumArtist("artist");
		$("#scannableWrapper").hide();
		if(localStorage.getItem("setting_spotify_enableArt") === "true") { $("#artWrapper").show(); }

		const enableAnimations = (localStorage.getItem("setting_spotify_enableAnimations") === "true");
		const timespans = {
			small: (enableAnimations ? 100 : 0),
			medium: (enableAnimations ? 250 : 0),
			large: (enableAnimations ? 500 : 0)
		};

		currentSong = data;

		$("#detailsWrapper").addClass("fadeOut");
		$("#detailsWrapper").removeClass("fadeIn");

		$("#title").addClass("slideOut");
		$("#title").removeClass("slideIn");
		setTimeout(function() {
			$("#secondary").addClass("slideOut");
			$("#secondary").removeClass("slideIn");

			setTimeout(function() {
				$("#titleString").text(data.title);
				$("#artistString").text(data.artists.join(", "));
				$("#albumString").text(data.album.name);
				
				if(data.labels.length) {
					$("#labelString").text(data.labels.join(", "));
				}

				if(data.album.year) {
					$("#yearString").show();
					$("#yearString").text(data.album.year);
				} else {
					$("#yearString").hide();
				}

				$(":root").get(0).style.setProperty("--currentProgressAngle", '0deg');
				prevPerc = -1;
				elapsed = 0;
				updateProgress();

				$("#albumString").removeClass("isSingle");
				/*if(data.album.type === "single") {
					if(localStorage.getItem("setting_spotify_showSingleIfSingle") === "true") {
						$("#albumString").addClass("isSingle");
					}
				}*/

				let darkColor = data.album.art.colors.dark;
				let lightColor = data.album.art.colors.light;

				if(localStorage.getItem("setting_spotify_ensureColorIsBrightEnough") === "true") {
					darkColor = ensureSafeColor(darkColor);
					lightColor = ensureSafeColor(lightColor);
				}

				$(":root").get(0).style.setProperty("--colorDark", darkColor);
				$(":root").get(0).style.setProperty("--colorLight", lightColor);

				$("#detailsWrapper").addClass("fadeIn")
				$("#detailsWrapper").removeClass("fadeOut");
				$("#title").addClass("slideIn")
				$("#title").removeClass("slideOut");
				
				setTimeout(function() {
					$("#secondary").removeClass("slideOut");
					$("#secondary").addClass("slideIn");
					updateSecondaryMarquee();
				}, timespans.small);

				if(localStorage.getItem("setting_spotify_enableArtistAlbumCycle") === "true") {
					albumArtistCycleTO = setTimeout(function() {
						cycleAlbumArtist("album");
					}, parseFloat(localStorage.getItem("setting_spotify_artistAlbumCycleDelay")) * 1000);
				}
				updateMarquee();
			}, timespans.large);
		}, timespans.small);

		setTimeout(function() {
			$("#artAnimationWrapper, #bgWrapper .artContainer").fadeOut(timespans.medium, function() {
				$("#art, #artLoader").attr("src", data.album.art.data);
				rootCSS().setProperty("--art-url", `url('${data.album.art.data}')`);

				$("#artLoader").one({
					load: function() {
						$("#artAnimationWrapper").fadeIn(timespans.large);
						$("#bgWrapper .artContainer").fadeIn(parseFloat(localStorage.getItem("setting_spotify_artBackgroundFadeInDuration")) * 1000);
					},
					error: function() {
						$("#art, #artLoader").attr("src", "placeholder.png");
						rootCSS().setProperty("--art-url", `url('placeholder.png')`);
					}
				});
			});
		}, timespans.medium);

		setTimeout(function() {
			// i'm lazy, there's some animation conflict here and it is 6 in the morning and i am tired
			$("#title").removeClass("slideIn");
			$("#title").removeClass("slideOut");
			$("#detailsWrapper").removeClass("fadeIn");
			$("#detailsWrapper").removeClass("fadeOut");
			$("#secondary").removeClass("slideIn");
			$("#secondary").removeClass("slideOut");
		}, timespans.large * 3);
	},

	state: function(data) {
		elapsed = data.elapsed;
		updateProgress();
	}
};

musicChannel.onmessage = function(message) {
	message = message.data;
	console.log(message);

	if(message.event in musicFuncs) {
		musicFuncs[message.event](message.data);
	}
};