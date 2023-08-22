// thanks motzel! didn't want to re-invent the wheel here
// https://github.com/motzel/ppcalc/blob/master/src/utils/pp.js
// https://isitworthplaying.motzel.dev/

const PP_PER_STAR = 42.114296;

const ppCurve = [
	{at: 0.0, value: 0.0},
	{at: 60, value: 0.25},
	{at: 65, value: 0.29},
	{at: 70, value: 0.34},
	{at: 75, value: 0.40},
	{at: 80, value: 0.47},
	{at: 82.5, value: 0.51},
	{at: 85, value: 0.57},
	{at: 87.5, value: 0.655},
	{at: 90, value: 0.75},
	{at: 91, value: 0.79},
	{at: 92, value: 0.835},
	{at: 93, value: 0.885},
	{at: 94, value: 0.94},
	{at: 95, value: 1},
	{at: 95.5, value: 1.05},
	{at: 96, value: 1.115},
	{at: 96.5, value: 1.195},
	{at: 97, value: 1.3},
	{at: 97.25, value: 1.36},
	{at: 97.5, value: 1.43},
	{at: 97.75, value: 1.515},
	{at: 98, value: 1.625},
	{at: 98.25, value: 1.775},
	{at: 98.5, value: 2.0},
	{at: 98.75, value: 2.31},
	{at: 99, value: 2.73},
	{at: 99.25, value: 3.31},
	{at: 99.5, value: 4.14},
	{at: 99.75, value: 5.31},
	{at: 99.9, value: 6.24},
	{at: 100, value: 7},
];

function ppFactorFromAcc(acc) {
	if(!acc || acc <= 0) {
		return 0;
	}

	let index = ppCurve.findIndex(o => o.at >= acc);
	if(index === -1) {
		return ppCurve[ppCurve.length - 1].value;
	}

	if(!index) {
		return ppCurve[0].value;
	}

	let from = ppCurve[index - 1];
	let to = ppCurve[index];
	let progress = (acc - from.at) / (to.at - from.at);
	
	return from.value + (to.value - from.value) * progress;
}