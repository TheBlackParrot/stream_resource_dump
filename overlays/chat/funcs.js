function callTwitch(data, callback) {
	if(!allowedToProceed) {
		console.log("No Client ID or Secret is set.");
		return;
	}

	$.ajax({
		type: "GET",
		url: `https://api.twitch.tv/helix/${data.endpoint}`,
		headers: {
			"Authorization": `Bearer ${twitchAccessToken}`,
			"Client-Id": twitchClientId
		},

		data: data.args,

		success: function(data) {
			if(typeof callback === "function") {
				callback(data);
			}
		}
	})	
}

function systemMessage(msg) {
	client._onMessage({
		data: `@badge-info=;badges=;color=#FFFFFF;display-name=Overlay (r${overlayRevision});id=-1;mod=0;room-id=${broadcasterData.id};subscriber=0;tmi-sent-ts=${Date.now()};turbo=0;user-id=-1 :overlay!overlay@overlay.tmi.twitch.tv PRIVMSG #${broadcasterData.username} :${msg}`
	});
}

function formatTime(val) {
	let secs = val % 60;
	let mins = Math.floor(val / 60);

	return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function parse7TVColor(color) {
	if(!color) {
		return "#000";
	}

	let red = (color >> 24) & 0xFF;
	let green = (color >> 16) & 0xFF;
	let blue = (color >> 8) & 0xFF;
	let alpha = (color & 0xFF);

	return `rgba(${red}, ${green}, ${blue}, ${alpha/255})`;
}

function set7TVPaint(nameBlock, which, userID) {
	let paint = sevenTVPaints[which];
	let css = "";
	let bgColor = parse7TVColor(paint.color);

	if(paint.function === "url") {
		css = `url(${paint.image_url})`;
	} else {
		let stops = [];
		for(let i in paint.stops) {
			let stop = paint.stops[i];
			stops.push(`${parse7TVColor(stop.color)} ${stop.at*100}%`);
		}
		
		let func = paint.function;
		if(paint.repeat) {
			func = `repeating-${paint.function}`;
		}

		let angle = `${paint.angle}deg`
		if(paint.function === "radial-gradient") {
			angle = `${paint.shape} at ${paint.angle}%`;
		}

		css = `${func}(${angle}, ${stops.join(",")})`;
	}

	let shadows = "";
	if("drop_shadows" in paint) {
		let shadowsArr = [];
		if(paint.drop_shadows.length) {
			for(let i in paint.drop_shadows) {
				let s = paint.drop_shadows[i];
				shadowsArr.push(`drop-shadow(${s.x_offset}px ${s.y_offset}px ${s.radius}px ${parse7TVColor(s.color)})`);
			}
			shadows = shadowsArr.join(" ");
		}
	}
	//console.log(css);
	nameBlock.css("background-color", bgColor).css("background-image", css).css("background-size", "contain");
	nameBlock.css("filter", `var(--nameEffects${userID})${shadows}`);
}