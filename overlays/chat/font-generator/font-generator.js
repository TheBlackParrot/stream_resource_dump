const { glob, globSync, globStream, globStreamSync, Glob } = require('glob');
const fs = require("fs");
const StreamZip = require('node-stream-zip');

const zips = globSync("*.zip");
var extracteds;
fs.rmdirSync("generated", { recursive: true, force: true });
fs.mkdirSync("generated/fonts", { recursive: true });

//extracteds = globSync("generated/fonts/\*\/\*.ttf");
//console.log(extracteds);

function zipStep(zipIdx) {
	if(zipIdx >= zips.length) {
		extracteds = globSync("generated/fonts/\*\/\*.ttf");
		runThroughExtracted(0);
		return;
	}

	let zipFilename = zips[zipIdx];
	let fontName = zipFilename.replace(".zip", "").split("_").join(" ");

	console.log(`extracting zip for ${fontName}...`);

	const zip = new StreamZip({ file: zipFilename });
	zip.on('ready', function() {
		let folder = `generated/fonts/${fontName}`;
		fs.mkdirSync(folder);
		zip.extract(null, folder, (err, count) => {
			console.log(err ? 'Extract error' : `Extracted ${count} entries`);
			zip.close();
			zipStep(zipIdx + 1);
		});
	});
}
zipStep(0);

var fonts = {};

function addFont(name, weight, style, filename) {
	weight = weight.toString();

	if(!(name in fonts)) {
		fonts[name] = {
			allowed: {
				names: true,
				messages: false
			}
		};
	}

	if(!(weight in fonts[name])) {
		fonts[name][weight] = {};
	}

	fonts[name][weight][style] = filename;
}

function runThroughExtracted(folderIdx) {
	if(folderIdx >= extracteds.length) {
		generateCSSFile();
		return;
	}

	let folder = extracteds[folderIdx];

	let parts = folder.replace("generated/fonts/", "").split("/");
	let fontName = parts[0];
	let fileName = parts[1];

	if(fs.existsSync(`generated/fonts/${fontName}/static`)) { fs.rmdirSync(`generated/fonts/${fontName}/static`, { recursive: true, force: true }); }
	if(fs.existsSync(`generated/fonts/${fontName}/__MACOSX`)) { fs.rmdirSync(`generated/fonts/${fontName}/__MACOSX`, { recursive: true, force: true }); }
	if(fs.existsSync(`generated/fonts/${fontName}/README.txt`)) { fs.rmSync(`generated/fonts/${fontName}/README.txt`); }

	let fileNameParts = fileName.replace(".ttf", "").split("-");
	//console.log(fileNameParts);

	if(fileNameParts.length === 2) {
		if(fileNameParts[1].substr(0, 12) === "VariableFont") {
			for(let i = 1; i <= 9; i++) {
				let weight = i*100;
				addFont(fontName, weight, "normal", fileName);
			}
		} else {
			switch(fileNameParts[1]) {
				case "Thin": addFont(fontName, 100, "normal", fileName); break;
				case "ThinItalic": addFont(fontName, 100, "italic", fileName); break;
				case "ExtraLight": addFont(fontName, 200, "normal", fileName); break;
				case "ExtraLightItalic": addFont(fontName, 200, "italic", fileName); break;
				case "Light": addFont(fontName, 300, "normal", fileName); break;
				case "LightItalic": addFont(fontName, 300, "italic", fileName); break;
				case "Regular": addFont(fontName, 400, "normal", fileName); break;
				case "Italic": addFont(fontName, 400, "italic", fileName); break;
				case "Medium": addFont(fontName, 500, "normal", fileName); break;
				case "MediumItalic": addFont(fontName, 500, "italic", fileName); break;
				case "SemiBold": addFont(fontName, 600, "normal", fileName); break;
				case "SemiBoldItalic": addFont(fontName, 600, "italic", fileName); break;
				case "Bold": addFont(fontName, 700, "normal", fileName); break;
				case "BoldItalic": addFont(fontName, 700, "italic", fileName); break;
				case "ExtraBold": addFont(fontName, 800, "normal", fileName); break;
				case "ExtraBoldItalic": addFont(fontName, 800, "italic", fileName); break;
				case "Black": addFont(fontName, 900, "normal", fileName); break;
				case "BlackItalic": addFont(fontName, 900, "italic", fileName); break;
				default:
					console.log(`Non-standard weight name for ${fontName}: ${fileNameParts[1]}`);
			}
		}
	} else if(fileNameParts.length === 3) {
		for(let i = 1; i <= 9; i++) {
			let weight = i*100;
			addFont(fontName, weight, "italic", fileName);
		}
	}

	runThroughExtracted(folderIdx + 1);
}

function generateCSSFile() {
	let cssOut = [];

	for(let name in fonts) {
		let fontData = fonts[name];
		for(let weight in fontData) {
			if(isNaN(parseInt(weight))) {
				continue;
			}
			
			let fontStyles = fontData[weight];
			for(let style in fontStyles) {
				let filename = fontStyles[style];
				cssOut.push(`@font-face { font-family: "${name}"; src: url('fonts/${name}/${filename}'); font-weight: ${weight}; font-style: ${style}; }`);
			}
		}
	}

	fs.writeFileSync("generated/fonts.css", cssOut.join("\r\n"));
	fs.writeFileSync("generated/fonts.json", JSON.stringify(fonts, null, '\t'));
}