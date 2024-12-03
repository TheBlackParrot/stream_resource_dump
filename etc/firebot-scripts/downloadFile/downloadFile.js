const fs = require("fs");

function _downloadFile_scriptManifest() {
	return {
		name: "File downloader",
		description: "Downloads a file from a specified URL.",
		author: "TheBlackParrot",
		version: "r1",
		website: "https://twitch.tv/TheBlackParrot",
		firebotVersion: "5"
	};
}

function _downloadFile_defaultParameters() {
	return {
		URL: {
			type: "string",
			description: "URL to download file from"
		},
		folderPath: {
			type: "filepath",
			description: "Where to save the file",
			fileOptions: {
				directoryOnly: true
			}
		},
		fileName: {
			type: "string",
			description: "File name to save data to"				
		}
	};
}

function _downloadFile_run(runRequest) {
	const logger = runRequest.modules.logger;

	return new Promise(async (resolve, reject) => {
		const response = await fetch(runRequest.parameters.URL);
		if(!response.ok) {
			return resolve({
				success: false,
				errorMessage: `Failed to download file from ${runRequest.parameters.URL}`
			});
		}

		const data = await response.bytes();
		fs.writeFile(`${runRequest.parameters.folderPath}/${runRequest.parameters.fileName}`, data, (err) => { if (err) throw err; });

		return resolve({
			success: true,
		});
	});
}

module.exports = {
	getScriptManifest: _downloadFile_scriptManifest,
	getDefaultParameters: _downloadFile_defaultParameters,
	run: _downloadFile_run
};