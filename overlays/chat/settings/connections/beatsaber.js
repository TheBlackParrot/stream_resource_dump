var currentBSSong = null;
var currentBSState = {
	state: "stopped",
	elapsed: 0,
	timestamp: Date.now(),
	acc: 1,
	combo: 0,
	hits: 0,
	misses: 0,
	score: 0,
	scene: "Menu"
};

const mapPacks = {
	"OST Vol. 1":["100bills","balearicpumping","beatsaber","breezer","commercialpumping","countryrounds","escape","legend","lvlinsane","turnmeon"],
	"Base Game Extras":["angelvoices","onehope","popstars","crabrave","fitbeat","spookybeat","100billsremix","escaperemix"],
	"OST Vol. 2":["bethereforyou","elixia","ineedyou","rumnbass","unlimitedpower"],
	"Monstercat DLC Pack":["boundless","emojivip","epic","feelingstronger","overkill","rattlesnake","stronger","thistime","tillitsover","wewontbealone"],
	"Imagine Dragons DLC Pack":["badliar","believer","digital","itstime","machine","natural","radioactive","thunder","warriors","whateverittakes","bones","enemy"],
	"Camellia Pack":["crystallized","cyclehit","whatthecat","exitthisearthsatomosphere","ghost","lightitup"],
	"OST Vol. 3":["burningsands","fullcharge","givealittlelove","immortal","origins","reasonforliving"],
	"Panic! at the Disco DLC Pack":["emperorsnewclothes","highhopes","thegreatestshow","victorious","crazygenius","dancingsnotacrime","heylookmaimadeit","sayamen","sugarsoaker","vivalasvengeance"],
	"Rocket League DLC Pack":["glide","luvuneedu","play","rockit","shiawase","testme"],
	"Green Day DLC Pack":["americanidiot","boulevardofbrokendreams","fatherofall","firereadyaim","holiday","minority"],
	"Timbaland DLC Pack":["dumbthingz","famous","hasameaning","whatilike","whilewereyoung"],
	"Linkin Park DLC Pack":["bleeditout","breakingthehabit","faint","givenup","intheend","newdivide","numb","onestepcloser","papercut","somewhereibelong","whativedone"],
	"BTS DLC Pack":["bloodsweatandtears","boywithluv","burningup","dionysus","dna","dope","dynamite","fakelove","idol","micdrop","nottoday","ugh"],
	"OST Vol. 4":["intothedream","ittakesme","ludicrous","spineternally"],
	"Interscope Mixtape DLC Pack":["countingstars","dnalamar","dontcha","partyrockanthem","rollin","sugar","thesweetescape"],
	"Skrillex DLC Pack":["bangarang","butterflies","dontgo","firstoftheyear","raggabomb","rocknroll","scarymonstersandnicesprites","thedevilsden"],
	"Billie Eilish DLC Pack":["allthegoodgirlsgotohell","badguy","bellyache","buryafriend","happierthanever","ididntchangemynumber","nda","oxytocin","thereforeiam","youshouldseemeinacrown"],
	"Lady Gaga DLC Pack":["alejandro","badromance","bornthisway","justdance","paparazzi","pokerface","rainonme","stupidlove","telephone","theedgeofglory"],
	"OST Vol. 5":["curtainsallnightlong","dollarseventyeight","finalbosschan","firestarter","iwannabeamachine","magic"],
	"Fall Out Boy DLC Pack":["centuries","dancedance","idontcare","immortals","irresistible","mysongsknow","thisaintascene","thnksfrthmmrs"],
	"Electronic Mixtape DLC Pack":["alone","animals","freestyler","ghostsnstuff","icarus","sandstorm","staythenight","therockafellerskank","waitingallnight","witchcraft"],
	"Lizzo DLC Pack":["2beloved","aboutdamntime","cuziloveyou","everybodysgay","goodashell","juice","tempo","truthhurts","worship"],
	"The Weeknd DLC Pack":["blindinglights","cantfeelmyface","howdoimakeyouloveme","ifeelitcoming","prayforme","sacrifice","saveyourtears","starboy","takemybreath","thehills","dieforyou","lessthanzero"],
	"Rock Mixtape DLC Pack":["borntobewild","eyeofthetiger","freebird","iwasmadelovingyou","sevennationarmy","smellsliketeenspirit","sweetchildomine","thepretender"],
	"Queen DLC Pack":["anotheronebitesthedust","bohemianrhapsody","crazylittlethingcalledlove","dontstopmenow","iwantitall","killerqueen","onevision","somebodytolove","stonecoldcrazy","wearethechampions","wewillrockyou"],
	"Linkin Park x Mike Shinoda DLC Pack":["alreadyover","crawling","fightingmyself","inmyhead","lost","morethevictim","numbencore","rememberthename"],
	"The Rolling Stones DLC Pack":["angry","bitemyheadoff","cantyouhearmeknocking","gimmeshelter","icantgetnosatisfaction","livebythesword","messitup","paintitblack","startmeup","sympathyforthedevil","wholewideworld"],
	"OST Vol. 6":["heavyweight","liftoff","powerofthesaberblade","tempokatana","cathedral"]
};

const bsEventChannel = new BroadcastChannel("bs");
function postToBSEventChannel(data) {
	console.log(data);
	if(data) {
		bsEventChannel.postMessage(data);
	}
}

var oldHash;
async function updateBeatSaberMapData() {
	const curHash = `${currentBSSong.map.hash}.${currentBSSong.song.title}`;
	if(oldHash === curHash) {
		console.log(`old hash is current hash, not updating map data (old: ${oldHash}, new: ${curHash})`);
		return;
	} else {
		console.log(`old hash is not current hash, updating map data (old: ${oldHash}, new: ${curHash})`);
	}
	oldHash = curHash;

	if(!currentBSSong.song.title) { currentBSSong.song.title = '(no title)'; }
	if(!currentBSSong.song.artist) { currentBSSong.song.artist = '(no artist)'; }
	if(!currentBSSong.map.author) { currentBSSong.map.author = '(unknown mapper)'; }

	if(currentBSSong.map.hash === null) {
		postToBSEventChannel({
			type: "map",
			data: currentBSSong
		});
		return;
	} else {
		for(const packName in mapPacks) {
			const pack = mapPacks[packName];
			if(pack.indexOf(currentBSSong.map.hash) !== -1) {
				currentBSSong.map.pack = packName;
				break;
			}
		}
	}
	
	let cacheData = sessionStorage.getItem(`_bs_cache_${currentBSSong.map.hash}`);
	let bsData = null;

	if(cacheData !== null) {
		bsData = JSON.parse(cacheData);
	} else {
		if(currentBSSong.map.hash.indexOf("wip") === -1 && currentBSSong.map.hash.length === 40) {
			const bsFetchController = new AbortController();
			const bsFetchTimedOutID = setTimeout(() => bsFetchController.abort(), parseInt(localStorage.getItem("setting_ajaxTimeout")) * 1000);
			var response = {ok: false};
			try {
				response = await fetch(`https://api.beatsaver.com/maps/hash/${currentBSSong.map.hash}`);
			} catch(err) {
				console.log("failed to fetch map data from beatsaver");
			}

			if(response.ok) {
				bsData = await response.json();
				if(!("collaborators" in bsData)) { // TEMP SOLUTION REMOVE LATER
					let responseID = await fetch(`https://api.beatsaver.com/maps/id/${bsData.id}`);
					if(responseID.ok) {
						bsData = await responseID.json();
					}
				}
				sessionStorage.setItem(`_bs_cache_${currentBSSong.map.hash}`, JSON.stringify(bsData));
			}
		}
	}

	if(bsData !== null) {
		console.log(bsData);
		if(!("verifiedMapper" in bsData.uploader)) { bsData.uploader.verifiedMapper = false; }

		const showAvatar = (bsData.uploader.curator || bsData.uploader.seniorCurator || bsData.uploader.verifiedMapper || bsData.ranked || bsData.qualified || "curator" in bsData);

		currentBSSong.map.bsr = bsData.id;
		currentBSSong.map.uploaders = [{
			name: bsData.uploader.name,
			avatar: (showAvatar && !("suspendedAt" in bsData.uploader) ? bsData.uploader.avatar : null)
		}];

		currentBSSong.cover.external.url = bsData.versions[0].coverURL;
		if(sessionStorage.getItem(`_bs_cache_art_${currentBSSong.map.hash}`)) {
			currentBSSong.cover.external.image = sessionStorage.getItem(`_bs_cache_art_${currentBSSong.map.hash}`);
		} else {
			currentBSSong.cover.external.image = await compressImage(bsData.versions[0].coverURL, parseInt(localStorage.getItem("setting_bs_artSize")) * 2, 0.8);
			sessionStorage.setItem(`_bs_cache_art_${currentBSSong.map.hash}`, currentBSSong.cover.external.image);
		}

		if("collaborators" in bsData) {
			const maxCollaborators = (parseInt(localStorage.getItem("setting_bs_maxCollaborators")) || 5);

			for(const collaborator of bsData.collaborators) {
				if(currentBSSong.map.uploaders.length >= maxCollaborators) {
					currentBSSong.map.uploaders.push({
						name: `and ${(bsData.collaborators.length+1) - maxCollaborators} more...`,
						avatar: null
					});
					break;
				}

				const showCollaboratorAvatar = (collaborator.curator || collaborator.seniorCurator || collaborator.verifiedMapper);
				currentBSSong.map.uploaders.push({
					name: collaborator.name,
					avatar: (showCollaboratorAvatar && !("suspendedAt" in collaborator) ? collaborator.avatar : null)
				});
			}
		}
	}

	let art;
	let swatches;
	// DataPuller doesn't ever send raw image data, it's always remote
	if(localStorage.getItem("setting_bs_useRemoteArtURL") === "true" || localStorage.getItem("setting_beatSaberDataMod") === "datapuller") {
		art = currentBSSong.cover.external.image;
		if(art === null && currentBSSong.cover.internal.image !== null) {
			art = currentBSSong.cover.internal.image;
		}
	} else {
		art = currentBSSong.cover.internal.image;
	}
	if(art !== null) {
		$("#bsplusImageContainer").attr("src", art);
		swatches = await Vibrant.from($("#bsplusImageContainer")[0]).getSwatches();

		let colors = {
			light: [],
			dark: []
		};
		const checks = {
			light: ["LightVibrant", "Vibrant", "LightMuted", "Muted"],
			dark: ["DarkVibrant", "DarkMuted", "Muted", "Vibrant"]
		};

		for(let shade in checks) {
			for(let i in checks[shade]) {
				let check = checks[shade][i];
				if(check in swatches) {
					if(swatches[check] !== null) {
						colors[shade].push(swatches[check].getRgb());
					}
				}
			}
		}
		currentBSSong.cover.colors.dark = `#${colors.dark[0].map(function(x) { return Math.floor(x).toString(16).padStart(2, "0"); }).join("")}`;
		currentBSSong.cover.colors.light = `#${colors.light[0].map(function(x) { return Math.floor(x).toString(16).padStart(2, "0"); }).join("")}`;
	}

	postToBSEventChannel({
		type: "map",
		data: currentBSSong
	});
}

function connectBeatSaber() {
	switch(localStorage.getItem("setting_beatSaberDataMod")) {
		case "bsplus":
			changeStatusCircle("BSPlusStatus", "red", "disconnected");
			startBSPlusWebsocket();
			break;

		case "datapuller":
			changeStatusCircle("BSDataPullerMapDataStatus", "red", "MapData disconnected");
			startDataPullerMapInfoWebsocket();
			changeStatusCircle("BSDataPullerLiveDataStatus", "red", "LiveData disconnected");
			startDataPullerLiveDataWebsocket();
			break;
	}
}