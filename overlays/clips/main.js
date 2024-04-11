const twitchClientId = localStorage.getItem(`setting_twitchClientID`);
const twitchClientSecret = localStorage.getItem(`setting_twitchClientSecret`);

var clipQueue = [];
var clipIsActive = false;
var playedClips = {};
var allowedUsers = [];

function checkClipQueue() {
	if(!clipQueue.length) {
		return;
	}

	const queueCopy = clipQueue.slice(0);
	const next = queueCopy[0];
	clipQueue = clipQueue.slice(1);

	setClip(next[0], next[1], next[2]);
}

function getClipURLs(baseURL) {
	const thumbnail = new URL(baseURL);

	const pathParts = thumbnail.pathname.split("/");
	let fileParts = pathParts[pathParts.length - 1].split("-");
	fileParts = fileParts.slice(0, fileParts.length - 2);

	const baseVideoURL = thumbnail.protocol + "//" + thumbnail.hostname + pathParts.slice(0, pathParts.length - 1).join("/") + "/" + fileParts.join("-");

	if(thumbnail.pathname.indexOf("-offset-") !== -1) {
		// old clip, afaik only the source quality can be grabbed through the thumbnail's URL
		return [`${baseVideoURL}.mp4`];
	}

	const videoURLs = [];
	const preferred = localStorage.getItem("setting_clips_preferredResolution");
	for(const size of [preferred, 480, 360, 720, 160]) {
		const newURL = `${baseVideoURL}-${size}.mp4`;
		if(videoURLs.indexOf(newURL) === -1) {
			videoURLs.push(newURL);
		}
	}
	videoURLs.push(`${baseVideoURL}.mp4`);

	return videoURLs;
}

function clipIsPlaying() {
	const lines = $(".line");

	$("#streamerWrap").addClass("fadeIn").removeClass("fadeOut");
	$("#gameCoverBGWrap").addClass("fadeIn").removeClass("fadeOut");

	$("#videoWrap").addClass("fadeIn").removeClass("fadeOut");

	if(localStorage.getItem("setting_clips_enableAnimations") === "true") {
		for(let idx = 0; idx < lines.length; idx++) {
			const line = $(lines[idx]);
			setTimeout(function() {
				line.addClass("slideIn").removeClass("slideOut");
			}, idx * 200);
		}
	} else {
		lines.addClass("slideIn").removeClass("slideOut");
	}
}

function clipIsFinished() {
	const lines = $(".line");

	if(localStorage.getItem("setting_clips_enableAnimations") === "true") {
		for(let idx = 0; idx < lines.length; idx++) {
			const line = $(lines[idx]);
			setTimeout(function() {
				line.addClass("slideOut").removeClass("slideIn");
			}, idx * 100);
		}
	} else {
		lines.addClass("slideOut").removeClass("slideIn");
	}

	$("#videoWrap").addClass("fadeOut").removeClass("fadeIn");
	$("#streamerWrap").addClass("fadeOut").removeClass("fadeIn");
	$("#gameCoverBGWrap").addClass("fadeOut").removeClass("fadeIn");

	if(localStorage.getItem("setting_clips_enableAnimations") === "true") {
		$("#videoWrap").one("animationend", function() {
			clipIsActive = false;
			checkClipQueue();
		});
	} else {
		clipIsActive = false;
		checkClipQueue();
	}
}

async function setClip(targetLogin, wantedClip, clipURL) {
	if(allowedUsers.indexOf(targetLogin) !== -1) {
		allowedUsers.splice(allowedUsers.indexOf(targetLogin), 1);
	}
	
	if(clipIsActive) {
		clipQueue.push([targetLogin, wantedClip, clipURL]);
		return;
	}
	clipIsActive = true;

	var clipsResponse;
	var userResponse;
	var target;
	if(!clipURL) {
		userResponse = await callTwitchAsync({
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

		target = userResponse.data[0];
		console.log(target);

		if(!(target.id in playedClips)) {
			playedClips[target.id] = [];
		}

		clipsResponse = await callTwitchAsync({
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
	} else {
		const urlObject = new URL(clipURL);
		console.log(urlObject);

		const pathParts = urlObject.pathname.split("/");

		clipsResponse = await callTwitchAsync({
			"endpoint": "clips",
			"args": {
				"id": pathParts[pathParts.length - 1]
			}
		});
		if(!clipsResponse) {
			console.log("is the clip URL not valid?");
			clipIsActive = false;
			return;
		}

		userResponse = await callTwitchAsync({
			"endpoint": "users",
			"args": {
				"id": clipsResponse.data[0].broadcaster_id
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

		target = userResponse.data[0];
		console.log(target);

		if(!(target.id in playedClips)) {
			playedClips[target.id] = [];
		}
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

		clips = allClips.filter((clip) => clip.duration >= min && clip.duration <= max && playedClips[target.id].indexOf(clip.id) === -1);
		if(clips.length < 1) {
			clips = allClips;
			playedClips[target.id] = [];
		}

		console.log(`found ${clips.length} clips that fit within filters for ${target.id} that have not been previously played`);
		console.log(clips);

		if(clips.length > 1) {
			if(localStorage.getItem("setting_clips_useRandom") === "true") {
				idx = Math.floor(Math.random() * clips.length);
			}
		}
	} else if(!clipURL) {
		if(wantedClip >= clips.length) {
			wantedClip = clips.length-1;
		} else if(wantedClip < -1) {
			wantedClip = 0;
		}

		idx = wantedClip;		
	}

	const selectedClip = clips[idx];
	console.log(selectedClip);

	playedClips[target.id].push(selectedClip.id);

	var game = {
		name: null,
		box_art_url: null
	};
	const gamesResponse = await callTwitchAsync({
		"endpoint": "games",
		"args": {
			"id": selectedClip.game_id
		}
	});
	if(gamesResponse) {
		if(gamesResponse.data.length >= 1) {
			game = gamesResponse.data[0];
		}
	}
	console.log(game);

	const videoURLSources = getClipURLs(selectedClip.thumbnail_url);
	console.log(videoURLSources);

	$("video").remove();
	
	const video = $(`<video autoplay></video>`);
	video[0].onplay = clipIsPlaying;
	video[0].onended = clipIsFinished;
	for(const videoURL of videoURLSources) {
		video.append($(`<source src="${videoURL}"/>`));
	}
	$("#videoWrap").append(video);

	setMetadata(target, selectedClip, game);
}

const lux = luxon.DateTime;
function setMetadata(target, clip, game) {
	$("#clipTitle").text(clip.title);
	$("#streamerAvatar").attr("src", target.profile_image_url);
	$("#streamerName").text(clip.broadcaster_name);
	$("#gamePlayed").text(game.name);
	$("#clipperName").text(clip.creator_name);
	$("#clipperDate").text(lux.fromISO(clip.created_at).toLocaleString(lux.DATE_FULL));

	rootCSS().setProperty("--currentStreamerAvatar", `url('${target.profile_image_url}')`);
	rootCSS().setProperty("--currentGameCover", `url('${game.box_art_url.replace("{width}", 285).replace("{height}", 380)}')`);
}