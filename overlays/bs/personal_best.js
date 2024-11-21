async function getPersonalBest(hash, diff, mode) {
	const playerID = localStorage.getItem("setting_bs_pbPlayerIdentifier");
	if(!playerID || playerID === null) {
		console.warn("No player identifier set, please see BS Overlay > Personal Best Cell to set it");
		return -1;
	}

	const query = new URLSearchParams({
		playerID: playerID,
		hash: hash,
		diff: parseInt(diff),
		mode: mode,
		context: localStorage.getItem("setting_bs_pbLeaderboardContext")
	});

	const response = await fetch(`proxies/beatleader_score.php?${query.toString()}`);
	if(!response.ok) {
		return -1;
	}
	const data = await response.json();

	if(data === null) {
		return -1;
	}

	return data.data;
}

function setPBDisplay(data) {
	if(data === 0 || data === -1) {
		data = {
			accuracy: 0,
			rank: 0
		}
	} else {
		rootCSS().setProperty("--blAvatar", `url("${data.avatarURL}")`);
	}

	if(localStorage.getItem("setting_bs_hidePBCellIfNoScore") === "true" && data.accuracy === 0) {
		if($("#pbCell").is(":visible")) {
			$("#pbCell").hide();
			updateMarquee();
		}
	}

	if(data.accuracy > 0 && $("#pbCell").attr("data-enabled") === "true") {
		if(!$("#pbCell").is(":visible")) {
			$("#pbCell").show();
			updateMarquee();
		}
	}

	const precision = parseInt(localStorage.getItem("setting_bs_pbPrecision"));

	if(!data.accuracy) {
		$("#pbAcc").text("--.".padEnd(3 + precision, "-"));
	} else {
		$("#pbAcc").text((data.accuracy * 100).toFixed(precision));
	}

	if(!data.rank) {
		$("#pbRankValue").text("N/A");
	} else {
		$("#pbRankValue").text(data.rank.toLocaleString());
	}
}