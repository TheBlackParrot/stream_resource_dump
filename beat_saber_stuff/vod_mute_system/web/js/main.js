const ip = "127.0.0.1";
const port = 2940;

var mapInfo;
var funcs = {
	"gameState": function(data) {
		if(data === "playing") {
			$(".wrapper").fadeIn(500);
		} else {
			$(".wrapper").fadeOut(500);
		}
	},

	"mapInfo": function(map) {
		mapInfo = map;
		$(".songArt img").attr("src", `data:image/jpg;base64,${map.coverRaw}`);
		$(".songTitle").text(map.sub_name === "" ? map.name : `${map.name} ${map.sub_name}`);
		$(".songArtist").text(map.artist);
		$(".songHash").text(map.hash);

		setStatus(map.isVODSafe);
	},

	"flagUpdate": function(data) {
		if(data.hash === mapInfo.hash) {
			mapInfo.isVODSafe = data.state;
			setStatus(mapInfo.isVODSafe);
		}
	}
}

function setStatus(val) {
	switch(val) {
		case 0:
			$(".unknown").show();
			$(".safe").hide();
			$(".unsafe").hide();
			break;

		case 1:
			$(".unknown").hide();
			$(".safe").show();
			$(".unsafe").hide();
			break;

		case 2:
			$(".unknown").hide();
			$(".safe").hide();
			$(".unsafe").show();
			break;
	}
}

var ws;
function startSocket() {
	ws = new WebSocket(`ws://${ip}:${port}`);

	ws.addEventListener("message", function(msg) {
		var data = JSON.parse(msg.data);
		if(data.event in funcs) {
			funcs[data.event](data.data);
		} else {
			console.log(data);
		}
	});

	ws.addEventListener("open", function() {
		console.log("Connected");
	});

	ws.addEventListener("close", function() {
		console.log(`Connection failed, retrying in 5 seconds...`);
		setTimeout(startSocket, 5000);
	});
}
startSocket();

function flag(val) {
	ws.send(JSON.stringify({
		event: "flag", 
		data: {
			flag: (val === "safe" ? "safe" : "unsafe"),
			hash: mapInfo.hash
		}
	}));
}