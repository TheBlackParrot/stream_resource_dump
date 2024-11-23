import { opendir, readFile, writeFile } from 'node:fs/promises';

// environments with old and/or V3 lighting capabilities
const oldEnvironments = [
	"DefaultEnvironment",
	"TriangleEnvironment",
	"NiceEnvironment",
	"BigMirrorEnvironment",
	"KDAEnvironment",
	"MonstercatEnvironment",
	"CrabRaveEnvironment",
	"DragonsEnvironment",
	"OriginsEnvironment",
	"PanicEnvironment",
	"RocketEnvironment",
	"GreenDayEnvironment",
	"GreenDayGrenadeEnvironment",
	"TimbalandEnvironment",
	"FitBeatEnvironment",
	"LinkinParkEnvironment",
	"BTSEnvironment",
	"KaleidoscopeEnvironment",
	"InterscopeEnvironment",
	"SkrillexEnvironment",
	"BillieEnvironment",
	"HalloweenEnvironment",
	"GagaEnvironment",
	"GlassDesertEnvironment"
];
// environments with *only* V3 lighting capabilities, but were present in game versions on or before 1.29.1
const pre1291Environments = [
	"WeaveEnvironment",
	"PyroEnvironment",
	"EDMEnvironment",
	"TheSecondEnvironment",
	"LizzoEnvironment",
	"TheWeekndEnvironment",
	"RockMixtapeEnvironment",
	"Dragons2Environment",
	"Panic2Environment"
];

// open the directory and create the output array
const dir = await opendir(process.argv[2]);
let keys = [];

// loop through the directory
for await (const dirent of dir) {
	// set the folder path, init the data variable
	let filePath = `${dirent.parentPath}${dirent.name}`;
	let rawData = null;

	try {
		// try reading info.dat with a capital I
		rawData = await readFile(`${filePath}/Info.dat`, { encoding: 'utf8' });
	} catch {
		try {
			// if that fails, try reading info.dat with a lowercase I
			rawData = await readFile(`${filePath}/info.dat`, { encoding: 'utf8' });
		} catch {
			// welp
		}
	}

	// if rawData is still null, spit an error out and move on
	if(!rawData) {
		console.warn(`!! Could not find info.dat for ${dirent.name}`);
		continue;
	}

	// parse the raw data we found into a more friendly format
	const infoData = JSON.parse(rawData);

	// if _environmentName is not in info.dat (...uh)
	if(!("_environmentName" in infoData)) {
		console.warn(`!! _environmentName not present in info.dat for ${dirent.name}`);
	} else {
		// ...but if it *is* actually present

		const environment = infoData._environmentName;

		// if the environment name is not in any of the old pre-1.29.1 environment name arrays
		if(oldEnvironments.indexOf(environment) === -1 && pre1291Environments.indexOf(environment) === -1) {
			console.log(`${dirent.name} has a new environment: ${environment}`);

			// add it to the final output
			// (maps grabbed from BeatSaver through the usual mods will always have the map key first, so we just grab it through the folder name)
			keys.push(dirent.name.split(" ")[0]);
		}
	}
}

// final output, also write to a file
console.log(keys.join("\n"));
try {
	await writeFile("bskeys_output.txt", keys.join("\r\n"));
} catch(err) {
	console.warn("could not write to bskeys_output.txt");
	console.warn(err);
} finally {
	console.log("wrote output to bskeys_output.txt");
}

// we can use this output with the Multi-Add feature in a BeatSaver playlist yippee