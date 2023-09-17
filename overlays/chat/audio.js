const AudioContext = window.AudioContext || window.webkitAudioContext;
const context = new AudioContext();

var soundList = [
	"newMsg"
];
var sounds = {};

function loadSound(which) {
	if(soundList.indexOf(which) === -1) {
		console.log(`${which} not in allowed list`);
		return;
	}

	let sound = sounds[which];
	for(let i in sound.buffers) {
		delete sound.buffers[i];
	}
	sound.buffers = [];

	for(let i in sound.urls) {
		let url = sound.urls[i];
		let request = new XMLHttpRequest();
		request.open("GET", url, true);
		request.responseType = "arraybuffer";

		console.log(`loading sound ${url}`);

		request.onload = function() {
			context.decodeAudioData(request.response, function(buffer) {
				if(!buffer) {
					console.log(`error decoding ${url}`);
					return;
				}

				console.log(`loaded sound ${url}`);

				sound.buffers.push(buffer);
			});

			request.onerror = function() {
				console.log(`Could not load sound from ${url}`);        
			};
		};

		request.onerror = function(event) {
			systemMessage(`Could not load sound from ${url}, please check the DevTools console for more information.`);
		}

		request.send();
	}
}

function playSound(which) {
	if(soundList.indexOf(which) === -1) {
		console.log(`${which} not in allowed list`);
		return;
	}
	if(localStorage.getItem(`setting_sound_${which}_Enabled`) === "false") {
		return;
	}

	let sound = sounds[which];

	let source = context.createBufferSource();
	source.playbackRate.value = randomFloat(parseFloat(localStorage.getItem(`setting_sound_${which}_PitchRandMin`)) / 100, parseFloat(localStorage.getItem(`setting_sound_${which}_PitchRandMax`)) / 100);
	source.buffer = sound.buffers[randomInt(0, sound.buffers.length-1)];
	source.connect(context.destination);
	source.connect(sound.gainNode);
	setTimeout(function() {
		source.start(0);
	}, parseFloat(localStorage.getItem(`setting_sound_${which}_Delay`)) * 1000);
}

function initSoundMetadata() {
	for(let idx in soundList) {
		let name = soundList[idx];
		console.log(`creating sound ${name}`);
		let url = localStorage.getItem(`setting_sound_${name}_URL`);

		sounds[name] = {
			value: name,
			urls: [
				url
			],
			buffers: [],
			gainNode: context.createGain()
		}

		let isGroup = false;
		if(url.charAt(0) === "<") {
			isGroup = true;
		}

		if(isGroup) {
			sounds[name].urls = [];
			let maxSoundIdx = 1;
			let filename = "";

			switch(url) {
				case "<jerma noises>":
					filename = "jerma-teacher-noise";
					maxSoundIdx = 7;
					break;

				case "<keyboard noises>":
					filename = "keyboard-typing";
					maxSoundIdx = 15;
					break;

				case "<boop noises>":
					filename = "boop";
					maxSoundIdx = 5;
					break;
			}

			if(filename !== "") {
				for(let i = 1; i <= maxSoundIdx; i++) {
					sounds[name].urls.push(`sounds/${filename}-${i}.ogg`);
				}
			} else {
				let customSoundList = localStorage.getItem("setting_sound_newMsg_CustomURLs").split("\n");
				for(let i in customSoundList) {
					sounds[name].urls.push(customSoundList[i].trim());
				}				
			}
		}

		sounds[name].gainNode.connect(context.destination);
		sounds[name].gainNode.gain.value = parseInt(localStorage.getItem(`setting_sound_${name}_Volume`)) / 100;

		loadSound(name);
	}
}

function setVolume(which, volume) {
	sounds[which].gainNode.gain.value = parseInt(volume) / 100;
}

const noiseBuffer = new AudioBuffer({
	length: context.sampleRate,
	sampleRate: context.sampleRate
});

const noiseData = noiseBuffer.getChannelData(0);
for(let i = 0; i < context.sampleRate; i++) {
	noiseData[i] = Math.random() / 20;
}

const noise = new AudioBufferSourceNode(context, {
	buffer: noiseBuffer,
	loop: true
});

const noiseLowPassFilter = new BiquadFilterNode(context, {
	type: "lowpass",
	frequency: parseInt(localStorage.getItem("setting_noiseLowpassHz")) || 400
});

const noiseGain = context.createGain();

noise.connect(noiseGain).connect(noiseLowPassFilter).connect(context.destination);
noise.start();