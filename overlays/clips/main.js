const twitchClientId = localStorage.getItem(`setting_twitchClientID`);
const twitchClientSecret = localStorage.getItem(`setting_twitchClientSecret`);

var clipQueue = [];
var clipIsActive = false;

function checkClipQueue() {
	if(!clipQueue.length) {
		return;
	}

	const queueCopy = clipQueue.slice(0);
	const next = queueCopy[0];
	clipQueue = clipQueue.slice(1);

	setClip(next[0], next[1]);
}

async function setClip(targetLogin, wantedClip) {
	if(clipIsActive) {
		clipQueue.push([targetLogin, wantedClip]);
		return;
	}
	clipIsActive = true;

	const lines = $(".line");

	const userResponse = await callTwitchAsync({
		"endpoint": "users",
		"args": {
			"login": targetLogin
		}
	});
	if(!userResponse) {
		console.log("user doesn't exist?");
		clipIsActive = false;
		return;		
	}
	if(userResponse.data.length < 1) {
		console.log("user doesn't exist?");
		clipIsActive = false;
		return;
	}

	const target = userResponse.data[0];
	console.log(target);

	// twitch pls, just let me use names
	var clipsResponse = await callTwitchAsync({
		"endpoint": "clips",
		"args": {
			"broadcaster_id": target.id,
			"is_featured": localStorage.getItem("setting_clips_onlyFetchFeatured"),
			"first": localStorage.getItem("setting_clips_listSize")
		}
	});

	if(clipsResponse) {
		if(clipsResponse.data.length < 1) {
			// try again but only if no featured clips are present
			console.log("no featured clips? forcing featured only arg off");

			clipsResponse = await callTwitchAsync({
				"endpoint": "clips",
				"args": {
					"broadcaster_id": target.id,
					"is_featured": false,
					"first": localStorage.getItem("setting_clips_listSize")
				}
			});
		}
	} else {
		console.log("umm...?");
		clipIsActive = false;
		return;
	}

	if(clipsResponse.data.length < 1) {
		// welp
		console.log("no clips! boo");
		clipIsActive = false;
		return;
	}

	const allClips = clipsResponse.data;
	var clips = allClips;
	var idx = 0;

	if(wantedClip === -1) {
		const min = parseInt(localStorage.getItem("setting_clips_durationPreferenceMin"));
		const max = parseInt(localStorage.getItem("setting_clips_durationPreferenceMax"));

		clips = allClips.filter((clip) => clip.duration >= min && clip.duration <= max);
		if(clips.length < 1) {
			clips = allClips;
		}

		console.log(`found ${clips.length} clips that fit within filters for ${targetLogin}`);
		console.log(clips);

		if(clips.length > 1) {
			if(localStorage.getItem("setting_clips_useRandom") === "true") {
				idx = Math.floor(Math.random() * clips.length);
			}
		}
	} else {
		if(wantedClip >= clips.length) {
			wantedClip = clips.length-1;
		} else if(wantedClip < -1) {
			wantedClip = 0;
		}

		idx = wantedClip;		
	}

	const selectedClip = clips[idx];
	console.log(selectedClip);

	// for fucks sake dude jusT PUT IT IN THE CLIP RESPONSE
	const gamesResponse = await callTwitchAsync({
		"endpoint": "games",
		"args": {
			"id": selectedClip.game_id
		}
	});
	if(!gamesResponse) {
		clipIsActive = false;
		return;
	}
	if(gamesResponse.data.length < 1) {
		clipIsActive = false;
		return;
	}

	const game = gamesResponse.data[0];
	console.log(game);

	$("iframe").remove();
	const iframe = $(`<iframe src="${selectedClip.embed_url}&parent=${window.location.host}&autoplay=true" width="100%" height="100%" preload="auto" allow="autoplay"></iframe>`);
	$("#videoWrap").append(iframe);

	setMetadata(target, selectedClip, game);
	$("#streamerWrap").addClass("fadeIn").removeClass("fadeOut");

	// this is an incredibly hacky way to work around having literally nothing because twitch could give less of a shit about any clip embed control
	// or they could just. you know, give me a static link to the video file i need so they wouldn't even need to do anything? golly gee
	setTimeout(function() {
		$("#videoWrap").addClass("fadeIn").removeClass("fadeOut");

		setTimeout(function() {
			for(let idx = 0; idx < lines.length; idx++) {
				const line = $(lines[idx]);
				setTimeout(function() {
					line.addClass("slideOut").removeClass("slideIn");
				}, idx * 100);
			}

			$("#videoWrap").addClass("fadeOut").removeClass("fadeIn");
			$("#streamerWrap").addClass("fadeOut").removeClass("fadeIn");

			$("#videoWrap").one("animationend", function() {
				$("iframe").remove();
				clipIsActive = false;
				checkClipQueue();
			})
		}, (selectedClip.duration - parseFloat(localStorage.getItem("setting_clips_hideCutoff"))) * 1000);
	}, parseFloat(localStorage.getItem("setting_clips_showDelay")) * 1000);

	for(let idx = 0; idx < lines.length; idx++) {
		const line = $(lines[idx]);
		setTimeout(function() {
			line.addClass("slideIn").removeClass("slideOut");
		}, idx * 200);
	}
}

const lux = luxon.DateTime;
function setMetadata(target, clip, game) {
	$("#clipTitle").text(clip.title);
	$("#streamerAvatar").attr("src", target.profile_image_url);
	$("#streamerName").text(clip.broadcaster_name);
	$("#gamePlayed").text(game.name);
	$("#clipperName").text(clip.creator_name);
	$("#clipperDate").text(lux.fromISO(clip.created_at).toLocaleString(lux.DATE_FULL));
}