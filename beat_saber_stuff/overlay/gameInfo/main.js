const beatsaverURL = 'https://api.beatsaver.com/maps/hash'

const diffEnums = {
	Easy: 1,
	Normal: 3,
	Hard: 5,
	Expert: 7,
	ExpertPlus: 9
}

function interp(var1, var2, weight) {
	return (1 - weight) * var1 + (weight * var2);
}

var ws;

var currentScene = "Menu";
var isPaused = false;

function getHTTP(url, callback) {
	let xH = new XMLHttpRequest();

	xH.onreadystatechange = function() {
		if(xH.readyState === 4 && xH.status === 200) {
			callback(xH.responseText);
		}
	}

	xH.open("GET", url, true);
	xH.send(null);
}

function startWebsocket() {
	console.log("Starting connection to BS+...");

	let url = `ws://${ip}:${port}/socket`;
	ws = new WebSocket(url);
	ws._init = false;

	ws.addEventListener("message", function(msg) {
		var data = JSON.parse(msg.data);

		if(!ws._init) {
			ws._init = true;
			console.log(`%cBeat Saber v${data.gameVersion}`, 'font-weight: 700');
		}

		console.log(data);

		if(data._type === "event") {
			processMessage(data);
		}
	});

	ws.addEventListener("open", function() {
		console.log(`%cConnected to server at ${url}`, 'background-color: #484; color: #fff');
	});

	ws.addEventListener("close", function() {
		console.log(`%cConnection to ${url} failed, retrying in 5 seconds...`, 'background-color: #a55; color: #fff');
		setTimeout(startWebsocket, 5000);
	});
}
startWebsocket();

function showStuff() {
	//$("#bloqsMissed").hide();
	//$("#bloqsFC").show();
	$("#bestAcc").hide();

	oldCombo = 0;
	hits = 0;

	$("body").removeClass("hide");
}
function hideStuff() {
	$("body").addClass("hide");
}
function pauseStuff() {
	$("body").addClass("pause");
}
function resumeStuff() {
	$("body").removeClass("pause");
}

var currentStars = 0;
var eventFuncs = {
	"gameState": function(data) {
		oldScene = currentScene;

		if(data.gameStateChanged === "Playing") {
			currentScene = "Game";
		} else {
			currentScene = "Menu";
		}

		if(oldScene !== currentScene) {
			if(currentScene === "Game") {
				showStuff();
			} else {
				hideStuff();
			}
		}
	},

	"pause": function(data) {
		pauseStuff();
		isPaused = true;
	},

	"resume": function(data) {
		resumeStuff();
		isPaused = false;
	},

	"score": function(data) {
		//console.log(data);
		let scoreData = data.scoreEvent;
		setAcc(scoreData.accuracy*100);
		setCombo(scoreData.combo);
		setHealth(scoreData.currentHealth);

		if(!isNaN(scoreData.score)) {
			setHitMiss(scoreData.combo, scoreData.missCount);
			
			if(currentStars) {
				setPP(Math.round(currentStars*PP_PER_STAR*ppFactorFromAcc(scoreData.accuracy*100)));
			}

			setHealth(scoreData.currentHealth);
		}
	},

	"mapInfo": function(data) {
		let map = data.mapInfoChanged;
		map.hash = map.level_id.replace("custom_level_", "");

		console.log(data);

		let bsUrl = `https://api.beatsaver.com/maps/hash/${map.hash}`; // hooray no paranoid CORS policy
		console.log(`fetching beatsaver data from ${bsUrl}`);

		setCombo(0);
		setHitMiss(0, 0);
		$("#hitValue").text(0);
		setHealth(0.5);

		hasBest = false;
		
		getHTTP(bsUrl, function(bsResponse) {
			let bsData = JSON.parse(bsResponse);

			console.log(bsData);

			let chartData = [];
			for(let i in bsData.versions[0].diffs) {
				let d = bsData.versions[0].diffs[i];
				if(d.characteristic === map.characteristic.replace("Solo", "") && d.difficulty === map.difficulty) {
					chartData = d;
				}
			}

			setBest(map, chartData);

			if(bsData.ranked) {
				currentStars = chartData.stars;
				switchSubHeads();
			} else {
				clearInterval(subHeadSwitchInt);
				toggleSubHeads(0);
				currentStars = 0;
			}
		});
	}
}

var oldHealth = -1;
var dismissHealthTimer;
function setHealth(health) {
	if(oldHealth === health) {
		return;
	}

	$("#healthWrap").removeClass("healthHide");
	$("#healthWrap").addClass("healthShow");

	let redWeight = interp(0, 255, health);
	$("#healthFilled").css("width", `${health*100}%`);
	$("#healthWrap").css("background-color", `rgba(255, ${redWeight}, ${redWeight}, 0.3)`);
	$("#healthFilled").css("background-color", `rgb(255, ${redWeight}, ${redWeight})`);

	clearTimeout(dismissHealthTimer);
	dismissHealthTimer = setTimeout(function() {
		$("#healthWrap").removeClass("healthShow");
		$("#healthWrap").addClass("healthHide");
	}, 3000);

	oldHealth = health;
}

function processMessage(data) {
	//console.log(data);
	if(data._event in eventFuncs) {
		eventFuncs[data._event](data);
	} else {
		console.log(data);
	}
}

var finalNums = [null, null, null, null];
var currentNums = [0, 0, 0, 0];

function splitAcc(acc) {
	return [
		(acc - (acc % 10))/10 | 0, 
		Math.floor(acc % 10) | 0,
		Math.floor((acc*10) % 10) | 0,
		Math.floor((acc*100) % 10) | 0
	];
}

function setAcc(acc) {
	if(acc === 100 || acc === 0) {
		finalNums = [null, null, null, null];
		currentNums = [0, 0, 0, 0];
		
		$("#accNum0").text("-");
		$("#accNum1").text("-");
		$("#accNum2").text("-");
		$("#accNum3").text("-");

		return;
	} else {
		finalNums = splitAcc(acc);
	}

	animateAccChange();
}

var accChangeTO;
function animateAccChange() {
	clearTimeout(accChangeTO);

	if(finalNums[0] === null || finalNums[1] === null || finalNums[2] === null || finalNums[3] === null) {
		//console.log("all null");
		return;
	}
	if(currentNums[0] === finalNums[0] && currentNums[1] === finalNums[1] && currentNums[2] === finalNums[2] && currentNums[3] === finalNums[3]) {
		//console.log("all equal");
		return;
	}

	accChangeTO = setTimeout(animateAccChange, 10);

	for(let i = 0; i < 4; i++) {
		if(currentNums[i] === finalNums[i]) {
			continue;
		}

		if(currentNums[i] > finalNums[i]) { currentNums[i]--; } else if(currentNums[i] < finalNums[i]) { currentNums[i]++; }
		$(`#accNum${i}`).text(currentNums[i]);
	}
}

var currentComboSpans = 0;
function setCombo(combo) {
	let comboStr = combo.toString();
	let len = comboStr.length;

	for(let i = 0; i < len; i++) {
		if(i >= currentComboSpans) {
			$("#comboNums").append($(`<span class="comboNum" id="comboNum${i}">`));
			currentComboSpans++;
		}

		$(`#comboNum${i}`).text(comboStr[i]);
	}

	for(let i = currentComboSpans-1; i >= len; i--) {
		$(`#comboNum${i}`).remove();
		currentComboSpans--;
	}
}

var currentPPSpans = 0; // pp length joke here
function setPP(pp) {
	let ppStr = pp.toString();
	let len = ppStr.length;

	for(let i = 0; i < len; i++) {
		if(i >= currentPPSpans) {
			$("#ppNums").append($(`<span class="ppNum" id="ppNum${i}">`));
			currentPPSpans++;
		}

		$(`#ppNum${i}`).text(ppStr[i]);
	}

	for(let i = currentPPSpans-1; i >= len; i--) {
		$(`#ppNum${i}`).remove();
		currentPPSpans--;
	}
}

var oldCombo = 0;
var hits = 0;
function setHitMiss(combo, missCount) {
	$("#missValue").text(missCount);

	if(combo === oldCombo) {
		return;
	}

	if(combo < oldCombo) {
		oldCombo = combo;
		return;
	}
	
	hits += combo - oldCombo;
	$("#hitValue").text(hits);

	oldCombo = combo;

	//if(!missCount) {
	if(hits === combo) {
		$("#bloqsFC").show();
		$("#bloqsMissed").hide();
	} else {
		$("#bloqsFC").hide();
		$("#bloqsMissed").show();
	}
}

var hasBest = false;
function setBest(map, chartData) {
	if(whom == null) {
		return;
	}

	if(map.characteristic === "Standard") {
		// ugh
		// scoresaber just accept Standard please
		map.characteristic = "SoloStandard";
	}

	console.log(map);

	//let url = `https://scoresaber.com/api/leaderboard/by-hash/${map.hash}/scores?difficulty=${diffEnums[map.difficulty]}&search=${whom}&gameMode=${map.characteristic}`;
	let url = `../proxy.php?hash=${map.hash}&diff=${diffEnums[map.difficulty]}&name=${whom}&mode=${map.characteristic}`;

	console.log(`fetching scoresaber data from ${url}`);
	getHTTP(url, function(response) {
		let parsed = JSON.parse(response);
		let data = parsed.data;

		console.log(data);

		if(data.metadata.total != 1) {
			return;
		}

		hasBest = true;

		let acc = splitAcc(((data.scores[0].baseScore / chartData.maxScore) * 100).toFixed(2));
		for(let i = 0; i < acc.length; i++) {
			$(`#bestAccNum${i}`).text(acc[i]);
		}
		$("#bestAcc").fadeIn(150);
	});
}

var subHeadSwitchInt;
function switchSubHeads() {
	clearInterval(subHeadSwitchInt);

	if(!hasBest) {
		if(currentStars) {
			toggleSubHeads(1);
		}
		return;
	}

	subHeadSwitchInt = setInterval(function() {
		toggleSubHeads();
	}, 7000);
}

let currentRow = 0;
function toggleSubHeads(which = null) {
	const rows = ["#bestAccWrap", "#ppWrap"];

	let nextRow = currentRow+1;
	if(which === null) {
		if(nextRow > rows.length-1) {
			nextRow = 0;
		}
	} else {
		nextRow = which;
	}

	for(let i = 0; i < rows.length; i++) {
		let r = rows[i];
		if(i !== nextRow) {
			$(r).fadeOut(150);
		} else {
			setTimeout(function() { $(r).fadeIn(150); }, 150);
		}
	}

	console.log(currentRow, nextRow);
	currentRow = nextRow;
}
toggleSubHeads(0);

$(document).ready(function() {
	$("#comboWrap").css("width", $("#accNums").css("width"));
	$("#bestAccWrap").css("width", $("#accNums").css("width"));
	$("#ppWrap").css("width", $("#accNums").css("width"));
	$("#healthWrap").css("width", $("#accNums").css("width"));
})