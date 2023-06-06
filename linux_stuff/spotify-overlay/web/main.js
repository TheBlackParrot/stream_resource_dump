const query = new URLSearchParams(location.search);

const ip = query.get("ip") || "10.161.8.254";
const port = query.get("port") || 8007;

var ws;

function setNewSongData(data) {
	$("#titleString").text(data.title);
	$("#artistString").text(data.artists.join(", "));

	let parentWidth = $("#title").width();
	let childWidth = $("#titleString").width();
	$("#titleString").marquee('destroy');

	if(childWidth > parentWidth) {
		$("#titleString").bind('finished', function() {
			$("#titleString").marquee('pause');
			setTimeout(function() {
				$("#titleString").marquee('resume');
			}, 7000);
		})
		.marquee({
			speed: 65,
			pauseOnCycle: true,
			startVisible: true,
			delayBeforeStart: 7000,
			duplicated: true,
			gap: 50
		});
	} else {
		$("#titleString").marquee('destroy');
	}

	$("#art").on("load", function() {
		$("#art, #artBG, #artShadow").fadeIn(500);
	}).attr("src", data.art);
	$("#artBG").attr("src", data.art);

	$("#scannable").attr("src", data.scannable.color.dark);

	localStorage.setItem("art_darkColor", data.colors.dark);
	localStorage.setItem("art_lightColor", data.colors.light);
	$(":root").get(0).style.setProperty("--colorDark", `${data.colors.dark}`);
	$(":root").get(0).style.setProperty("--colorLight", `${data.colors.light}`);
}

function startWebsocket() {
	console.log("Starting connection to playerctl bridge...");

	let url = `ws://${ip}:${port}`;
	ws = new WebSocket(url);
	ws._init = false;

	ws.addEventListener("message", function(msg) {
		var data = JSON.parse(msg.data);

		$("#title").removeClass("fadeIn").addClass("fadeOut");
		$("#title").one("animationend", function() {
			$("#title").removeClass("fadeOut").addClass("fadeIn");
		})
		setTimeout(function() {
			$("#artist").removeClass("fadeIn").addClass("fadeOut");
			$("#artist").one("animationend", function() {
				setNewSongData(data);
				$("#artist").removeClass("fadeOut").addClass("fadeIn");
			})
		}, 100);

		$("#scannable, #scannableShadow").fadeOut(500, function() {
			setTimeout(function() {
				$("#scannable, #scannableShadow").fadeIn(500);
			}, 100);
		});

		$("#art, #artBG, #artShadow").fadeOut(400);

		console.log(data);
	});

	ws.addEventListener("open", function() {
		console.log(`%cConnected to server at ${url}`, 'background-color: #484; color: #fff');
	});

	ws.addEventListener("close", function() {
		console.log(`%cConnection to ${url} failed, retrying in 10 seconds...`, 'background-color: #a55; color: #fff');
		setTimeout(startWebsocket, 10000);
	});
}
startWebsocket();

window.addEventListener("storage", function(event) {
	switch(event.key) {
		case "art_darkColor":
			$(":root").get(0).style.setProperty("--colorDark", event.newValue);
			break;

		case "art_lightColor":
			$(":root").get(0).style.setProperty("--colorLight", event.newValue);
			break;
	}
});
$(":root").get(0).style.setProperty("--colorLight", localStorage.getItem("art_lightColor"));
$(":root").get(0).style.setProperty("--colorDark", localStorage.getItem("art_darkColor"));