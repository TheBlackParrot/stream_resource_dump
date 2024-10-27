var curveData = {
	BeatLeader: [[0, 0]],
	ScoreSaber: [[0, 0]]
};

async function getCurveData() {
	const response = await fetch("curves.json");
	if(!response.ok) {
		console.error("Could not fetch curve data");
		return;
	}

	curveData = await response.json();
}

async function getCachedRankedData(service, url) {
	if(service === "BeatLeader") {
		var cacheStorage = await caches.open("BeatLeaderCache");
	} else {
		var cacheStorage = await caches.open("ScoreSaberCache");
	}

	var cachedResponse = await cacheStorage.match(url);
	if(!cachedResponse) {
		const newResponse = await fetch(url);
		if(!newResponse.ok) {
			return null;
		}
		var mapData = await newResponse.json();

		cachedResponse = new Response(JSON.stringify(mapData), {
			headers: {
				'Content-Type': "application/json",
				'X-Cache-Timestamp': Date.now()
			}
		});
		await cacheStorage.put(url, await cachedResponse.clone());
	} else {
		const cacheTimestamp = parseInt(cachedResponse.headers.get("X-Cache-Timestamp"));
		const staleThreshold = parseFloat(localStorage.getItem("setting_rankedMapCacheExpiryDelay")) * 24 * 60 * 60 * 1000;
		if(Date.now() - cacheTimestamp > staleThreshold) {
			console.log(`cached ranked data for ${url} is stale, re-fetching...`);
			cacheStorage.delete(url);
			return await getCachedRankedData(service, url);
		}

		return await cachedResponse.json();
	}

	cachedResponse = await cacheStorage.match(url);
	return await cachedResponse.json();
}

var leaderboardData = {
	BeatLeader: {},
	ScoreSaber: {},
	hash: null
};

async function getBeatLeaderLeaderboardData(difficulty, characteristic, hash) {
	const query = new URLSearchParams({
		hash: hash
	});
	const data = await getCachedRankedData("BeatLeader", "proxies/beatleader.php?" + query.toString());
	if(data === null) {
		return null;
	}

	if(!data.data) {
		return null;
	}

	let foundData;

	for(const check of data.data.difficulties) {
		if(check.modeName !== characteristic || check.difficultyName !== difficulty) {
			continue;
		} else {
			foundData = check;
			break;
		}
	}

	if(!foundData) {
		console.warn("Couldn't find matching leaderboard data for currently active map");
		return null;
	}

	return foundData;
}

const diffEnum = {
	Easy: 1,
	Normal: 3,
	Hard: 5,
	Expert: 7,
	ExpertPlus: 9
}; // guh

async function getScoreSaberLeaderboardData(difficulty, characteristic, hash) {
	const query = new URLSearchParams({
		hash: hash,
		diff: diffEnum[difficulty],
		mode: characteristic
	});
	const data = await getCachedRankedData("ScoreSaber", "proxies/scoresaber.php?" + query.toString());
	if(data === null) {
		return null;
	}

	return data;
}

var previousRankedHashCheck;
async function refreshLeaderboardData(difficulty, characteristic, hash) {
	$("#blValue").text(`0${ppDecimalPrecision ? `.${"".padStart(ppDecimalPrecision, "0")}` : ""}`);
	$("#ssValue").text(`0${ppDecimalPrecision ? `.${"".padStart(ppDecimalPrecision, "0")}` : ""}`);

	if(hash === previousRankedHashCheck) {
		return;
	}

	$("#ppCell").hide();
	$("#blCell").hide();
	$("#ssCell").hide();

	previousRankedHashCheck = hash;

	let isRanked = false;

	leaderboardData.BeatLeader = null;
	leaderboardData.ScoreSaber = null;

	beatLeaderData = await getBeatLeaderLeaderboardData(difficulty, characteristic, hash);
	console.log(beatLeaderData);

	if(!beatLeaderData) {
		leaderboardData.BeatLeader = null
	} else {
		leaderboardData.BeatLeader = {
			ranked: (beatLeaderData.status === 3),
			stars: {
				pass: beatLeaderData.passRating,
				tech: beatLeaderData.techRating,
				acc: beatLeaderData.accRating,
				overall: beatLeaderData.stars
			}
		}

		if(beatLeaderData.status === 3) {
			if(localStorage.getItem("setting_bs_ppDisplayBL")) {
				$("#blCell").show();
			}
			isRanked = true;

			$("#blStarsValue").text(beatLeaderData.stars.toFixed(2));
		}
	}

	scoreSaberData = await getScoreSaberLeaderboardData(difficulty, characteristic, hash);
	console.log(scoreSaberData);

	if(!scoreSaberData) {
		leaderboardData.ScoreSaber = null;
	} else {
		if(scoreSaberData.data) {
			leaderboardData.ScoreSaber = {
				ranked: scoreSaberData.data.ranked,
				stars: scoreSaberData.data.stars
			}

			if(scoreSaberData.data.ranked) {
				if(localStorage.getItem("setting_bs_ppDisplaySS")) {
					$("#ssCell").show();
				}
				isRanked = true;

				$("#ssStarsValue").text(scoreSaberData.data.stars.toFixed(2));
			}
		} else {
			leaderboardData.ScoreSaber = null;
		}
	}

	leaderboardData.hash = hash;

	if(isRanked) {
		if($("#ppCell").attr("data-enabled") === "true") {
			$("#ppCell").show();
		}
		if(!currentState.hits && !currentState.misses) {
			$("#ssValue").text(`0${ppDecimalPrecision ? `.${"".padStart(ppDecimalPrecision, "0")}` : ""}`);
			$("#blValue").text(`0${ppDecimalPrecision ? `.${"".padStart(ppDecimalPrecision, "0")}` : ""}`);
		} else {
			updatePPValues(currentState.acc);
		}
	}

	return true;
}

/*
// https://github.com/BeatLeader/beatleader-server/blob/98319aa661f3455c6cdfd20ef7a6c8f17b0aa216/Utils/ReplayUtils.cs
public static float Curve2(float acc)
{
	int i = 0;
	for (; i < pointList2.Count; i++)
	{
		if (pointList2[i].Item1 <= acc) {
			break;
		}
	}

	if (i == 0) {
		i = 1;
	}

	double middle_dis = (acc - pointList2[i-1].Item1) / (pointList2[i].Item1 - pointList2[i-1].Item1);
	return (float)(pointList2[i-1].Item2 + middle_dis * (pointList2[i].Item2 - pointList2[i-1].Item2));
}
*/

function _Curve2(points, acc) {
	if(isNaN(acc) || acc === undefined) {
		return 0;
	}
	
	let i = 0;
	for(; i < points.length; i++) {
		if(points[i][0] <= acc) {
			break;
		}
	}

	if(i === 0) {
		i = 1;
	}

	const middle_dis = (acc - points[i-1][0]) / (points[i][0] - points[i-1][0]);
	return points[i-1][1] + middle_dis * (points[i][1] - points[i-1][1]);
}

/*
// https://github.com/BeatLeader/beatleader-server/blob/98319aa661f3455c6cdfd20ef7a6c8f17b0aa216/Utils/ReplayUtils.cs
private static float Inflate(float peepee) {
	return (650f * MathF.Pow(peepee, 1.3f)) / MathF.Pow(650f, 1.3f);
}
*/
function _Inflate(pp) {
	return (650 * Math.pow(pp, 1.3)) / Math.pow(650, 1.3);
}

/*
// https://github.com/BeatLeader/beatleader-server/blob/98319aa661f3455c6cdfd20ef7a6c8f17b0aa216/Utils/ReplayUtils.cs
private static (float, float, float) GetPp(LeaderboardContexts context, float accuracy, float accRating, float passRating, float techRating) {

	float passPP = 15.2f * MathF.Exp(MathF.Pow(passRating, 1 / 2.62f)) - 30f;
	if (float.IsInfinity(passPP) || float.IsNaN(passPP) || float.IsNegativeInfinity(passPP) || passPP < 0)
	{
		passPP = 0;
	}
	float accPP = context == LeaderboardContexts.Golf ? accuracy * accRating * 42f : Curve2(accuracy) * accRating * 34f;
	float techPP = MathF.Exp(1.9f * accuracy) * 1.08f * techRating;
	
	return (passPP, accPP, techPP);
}
*/

function getBeatLeaderPP(acc, accRating, passRating, techRating) {
	let passPP = 15.2 * Math.exp(Math.pow(passRating, 1 / 2.62)) - 30;
	if(passPP === Infinity || isNaN(passPP) || passPP < 0) {
		passPP = 0;
	}

	let accPP = _Curve2(curveData.BeatLeader, acc) * accRating * 34;
	let techPP = Math.exp(1.9 * acc) * 1.08 * techRating;

	let finalPP = _Inflate(passPP + accPP + techPP);
	if(isNaN(finalPP) || finalPP === undefined) {
		finalPP = 0;
	}
	return [passPP, accPP, techPP, finalPP];
}

function getScoreSaberPP(acc, stars) {
	const value = _Curve2(curveData.ScoreSaber, acc) * stars * 42.114296;
	if(isNaN(value) || value === undefined) {
		return 0;
	}

	return value;
}

// really don't wanna call localStorage super frequently so, this changes from settings.js
var ppDecimalPrecision = 2;
function updatePPValues(acc) {
	if(!$("#ppCell").is(":visible")) {
		return;
	}

	if(progressivePP && currentState.maxScore !== 0) {
		acc = currentState.score / currentState.maxScore;
	}

	acc = Math.min(1, Math.max(0, acc));

	const ss = leaderboardData.ScoreSaber;
	const bl = leaderboardData.BeatLeader;

	if(leaderboardData.ScoreSaber) {
		if(leaderboardData.ScoreSaber.ranked) {
			const value = getScoreSaberPP(acc, ss.stars);
			const parts = value.toFixed(ppDecimalPrecision).split(".");

			$("#ssValue").text(`${parseInt(parts[0]).toLocaleString()}${ppDecimalPrecision ? `.${parts[1]}` : ""}`);
		} else {
			$("#ssValue").text(`0${ppDecimalPrecision ? `.${"".padStart(ppDecimalPrecision, "0")}` : ""}`);
		}
	} else {
		$("#ssValue").text(`0${ppDecimalPrecision ? `.${"".padStart(ppDecimalPrecision, "0")}` : ""}`);
	}

	if(leaderboardData.BeatLeader) {
		if(leaderboardData.BeatLeader.ranked) {
			const value = getBeatLeaderPP(acc, bl.stars.acc, bl.stars.pass, bl.stars.tech)[3];
			const parts = value.toFixed(ppDecimalPrecision).split(".");

			$("#blValue").text(`${parseInt(parts[0]).toLocaleString()}${ppDecimalPrecision ? `.${parts[1]}` : ""}`);
		} else {
			$("#blValue").text(`0${ppDecimalPrecision ? `.${"".padStart(ppDecimalPrecision, "0")}` : ""}`);
		}
	} else {
		$("#blValue").text(`0${ppDecimalPrecision ? `.${"".padStart(ppDecimalPrecision, "0")}` : ""}`);
	}
}