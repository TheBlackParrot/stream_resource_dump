// https://github.com/tmijs/docs/blob/gh-pages/_posts/v1.4.2/2019-03-03-Events.md
var md = window.markdownit({html: true})
	.disable(['link', 'image', 'linkify', 'table', 'fence', 'blockquote', 'hr',
			  'list', 'reference', 'heading', 'lheading', 'paragraph',
			  'newline', 'escape', 'autolink'])

const entityMap = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;',
	'`': '&#x60;',
	'=': '&#x3D;'
};

const pn = {
	"aeaer": "Ae / Aer",
	"any": "Any",
	"eem": "E / Em",
	"faefaer": "Fae / Faer",
	"hehim": "He / Him",
	"heshe": "He / She",
	"hethem": "He / They",
	"itits": "It / Its",
	"other": "Other",
	"perper": "Per / Per",
	"sheher": "She / Her",
	"shethem": "She / They",
	"theythem": "They / Them",
	"vever": "Ve / Ver",
	"xexem": "Xe / Xem",
	"ziehir": "Zie / Hir",
	"NONE": null
};

function formatTime(val) {
	let secs = val % 60;
	let mins = Math.floor(val / 60);

	return `${mins}:${secs.toString().padStart(2, '0')}`;
}

var fonts;
$.get("fonts.json", function(data) {
	fonts = data;
});

client.on('message', function(channel, tags, message, self) {
	if(self) {
		return;
	}

	if(!allowedToProceed) {
		console.log("No Client ID or Secret is set.");
		return;
	}

	console.log(tags);

	if(settings.chat.hideAccounts.indexOf(tags['username']) !== -1) {
		return;
	}

	let highlighted = false;
	if('msg-id' in tags) {
		if(tags['msg-id'] === "highlighted-message") {
			highlighted = true;
		}
	}

	let moderator = false;
	if('badges' in tags) {
		let roles = Object.keys(tags.badges);
		if(roles.indexOf("broadcaster") !== -1 || roles.indexOf("moderator") !== -1) {
			moderator = true;
		}
	}

	parseMessage({
		message: message,
		type: tags['message-type'],
		highlighted: highlighted,
		emotes: tags['emotes'],
		uuid: tags['id'],
		user: {
			id: tags['user-id'],
			name: tags['display-name'],
			username: tags['username'],
			badges: {
				list: tags['badges'],
				info: tags['badge-info']
			},
			color: tags['color'],
			moderator: moderator
		}
	});
});

client.on("ban", function(channel, username, reason, tags) {
	let id = tags['target-user-id'];
	$(`.chatBlock[data-userid="${id}"]`).remove();
});

client.on("messagedeleted", function(channel, username, deletedMessage, tags) {
	let id = tags['target-msg-id'];
	$(`.chatBlock[data-msguuid="${id}"]`).remove();
});

client.on("timeout", function(channel, username, reason, duration, tags) {
	let id = tags["target-user-id"];
	$(`.chatBlock[data-userid="${id}"]`).remove();
});

const chatFuncs = {
	namecolor: function(data, args) {
		let color = args[0].replace("#", "");
		if(!(/^([0-9a-f]{3}){1,2}$/i).test(color)) {
			return;
		}

		console.log(`set color for ${data.user.username} to #${color}`)
		localStorage.setItem(`color_${data.user.id}`, `#${color}`);
		$(":root").get(0).style.setProperty(`--nameColor${data.user.id}`, `#${color}`);
	},

	namesecondarycolor: function(data, args) {
		let color = args[0].replace("#", "");
		if(!(/^([0-9a-f]{3}){1,2}$/i).test(color)) {
			return;
		}

		console.log(`set 2nd color for ${data.user.username} to #${color}`)
		localStorage.setItem(`color2_${data.user.id}`, `#${color}`);
		$(":root").get(0).style.setProperty(`--nameColorSecondary${data.user.id}`, `#${color}`);
	},

	namefont: function(data, args) {
		let fontName = args.join(" ");
		if(Object.keys(fonts).indexOf(fontName) === -1) { return; }
		if(!fonts[fontName].allowed.names) { return; }

		console.log(`set name font for ${data.user.username} to ${fontName}`)
		localStorage.setItem(`namefont_${data.user.id}`, fontName);
		$(":root").get(0).style.setProperty(`--nameFont${data.user.id}`, fontName);
	},

	nameweight: function(data, args) {
		let weight = args.join("").toLowerCase();
		if(weight in enums.weight) {
			weight = enums.weight[weight];
		} else {
			weight = parseInt(weight);
			if(isNaN(weight)) { weight = 700; }

			weight = Math.max(Math.min(weight - weight % 100, 900), 100);
		}

		console.log(`set name weight for ${data.user.username} to ${weight}`)
		localStorage.setItem(`nameweight_${data.user.id}`, weight);
		$(":root").get(0).style.setProperty(`--nameWeight${data.user.id}`, weight);
	},

	namesize: function(data, args) {
		let size = settings.limits.names.size.default;
		if(!isNaN(parseFloat(args[0]))) {
			size = Math.max(Math.min(parseFloat(args[0]), settings.limits.names.size.max), settings.limits.names.size.min);
		}

		console.log(`set name size for ${data.user.username} to ${size}pt`)
		localStorage.setItem(`namesize_${data.user.id}`, `${size}pt`);
		$(":root").get(0).style.setProperty(`--nameSize${data.user.id}`, `${size}pt`);
	},

	nameitalic: function(data, args) {
		let which = (args[0].toLowerCase() === "yes" ? "italic" : "normal");

		console.log(`set name italics for ${data.user.username} to ${which}`);
		localStorage.setItem(`namestyle_${data.user.id}`, which);
		$(":root").get(0).style.setProperty(`--nameStyle${data.user.id}`, which);
	},

	namespacing: function(data, args) {
		let val = settings.limits.names.spacing.default;
		if(!isNaN(parseFloat(args[0]))) {
			val = Math.max(Math.min(parseFloat(args[0]), settings.limits.names.spacing.max), settings.limits.names.spacing.min);
		}

		console.log(`set name character spacing for ${data.user.username} to ${val}px`)
		localStorage.setItem(`namespacing_${data.user.id}`, `${val}px`);
		$(":root").get(0).style.setProperty(`--nameSpacing${data.user.id}`, `${val}px`);
	},

	msgfont: function(data, args) {
		let fontName = args.join(" ");

		if(Object.keys(fonts).indexOf(fontName) === -1) { return; }
		if(!fonts[fontName].allowed.messages) { return; }

		console.log(`set message font for ${data.user.username} to ${fontName}`)
		localStorage.setItem(`msgfont_${data.user.id}`, fontName);
		$(":root").get(0).style.setProperty(`--msgFont${data.user.id}`, fontName);
	},

	msgsize: function(data, args) {
		let size = settings.limits.messages.size.default;
		if(!isNaN(parseFloat(args[0]))) {
			size = Math.max(Math.min(parseFloat(args[0]), settings.limits.messages.size.max), settings.limits.messages.size.min);
		}

		console.log(`set message size for ${data.user.username} to ${size}pt`)
		localStorage.setItem(`msgsize_${data.user.id}`, `${size}pt`);
		$(":root").get(0).style.setProperty(`--msgSize${data.user.id}`, `${size}pt`);
	},

	msgspacing: function(data, args) {
		let val = settings.limits.messages.spacing.default;
		if(!isNaN(parseFloat(args[0]))) {
			val = Math.max(Math.min(parseFloat(args[0]), settings.limits.messages.spacing.max), settings.limits.messages.spacing.min);
		}

		console.log(`set message character spacing for ${data.user.username} to ${val}px`)
		localStorage.setItem(`msgspacing_${data.user.id}`, `${val}px`);
		$(":root").get(0).style.setProperty(`--msgSpacing${data.user.id}`, `${val}px`);
	},

	msgweight: function(data, args) {
		let weight = args.join("").toLowerCase();
		if(weight in enums.weight) {
			weight = enums.weight[weight];
		} else {
			weight = parseInt(weight);
			if(isNaN(weight)) { weight = 700; }
		}

		weight = Math.max(Math.min(weight - weight % 100, 900), 400);

		console.log(`set message weight for ${data.user.username} to ${weight}`)
		localStorage.setItem(`msgweight_${data.user.id}`, weight);
		$(":root").get(0).style.setProperty(`--msgWeight${data.user.id}`, weight);
	},

	"nametransform": function(data, args) {
		let valid = ["none", "lowercase", "uppercase"];
		let chosen = valid[0];

		if(!(isNaN(parseInt(args[0])))) {
			let c = Math.max(Math.min(parseInt(args[0]), 2), 0);
			chosen = valid[c];
		} else {
			if(valid.indexOf(args[0]) !== -1) {
				chosen = args[0];
			}
		}

		console.log(`set name transform for ${data.user.username} to ${chosen}`)
		localStorage.setItem(`nametransform_${data.user.id}`, chosen);
		$(":root").get(0).style.setProperty(`--nameTransform${data.user.id}`, chosen);
	},

	"namevariant": function(data, args) {
		let valid = ["normal", "small-caps", "unicase"];
		let chosen = valid[0];

		if(!(isNaN(parseInt(args[0])))) {
			let c = Math.max(Math.min(parseInt(args[0]), 2), 0);
			chosen = valid[c];
		} else {
			if(valid.indexOf(args[0]) !== -1) {
				chosen = args[0];
			}
		}

		console.log(`set name variant for ${data.user.username} to ${chosen}`)
		localStorage.setItem(`namevariant_${data.user.id}`, chosen);
		$(":root").get(0).style.setProperty(`--nameVariant${data.user.id}`, chosen);
	},

	nameangle: function(data, args) {
		let angle = settings.limits.names.gradAngle.default;
		if(!isNaN(parseFloat(args[0]))) {
			angle = Math.max(Math.min(parseFloat(args[0]), settings.limits.names.gradAngle.max), settings.limits.names.gradAngle.min);
		}

		console.log(`set name angle for ${data.user.username} to ${angle}deg`)
		localStorage.setItem(`nameangle_${data.user.id}`, `${angle}deg`);
		$(":root").get(0).style.setProperty(`--nameAngle${data.user.id}`, `${angle}deg`);
	},

	"chatsettings": function(data, args) {
		if(args.length !== 18) {
			console.log("args not correct length");
			return;
		}

		chatFuncs["namecolor"](data, [args[0]]);
		chatFuncs["namefont"](data, args[1].split("_"));
		chatFuncs["namesize"](data, [args[2]]);
		chatFuncs["nameitalic"](data, [args[3]]);
		chatFuncs["nameweight"](data, [args[4]]);
		chatFuncs["nametransform"](data, [args[5]]);
		chatFuncs["namevariant"](data, [args[6]]);
		chatFuncs["namespacing"](data, [args[7]]);
		chatFuncs["msgfont"](data, args[8].split("_"));
		chatFuncs["msgsize"](data, [args[9]]);
		chatFuncs["msgweight"](data, [args[10]]);
		chatFuncs["msgspacing"](data, [args[11]]);
		chatFuncs["namesecondarycolor"](data, [args[12]]);
		chatFuncs["nameangle"](data, [args[13]]);
		chatFuncs["showpfp"](data, [args[14]]);
		chatFuncs["useusername"](data, [args[15]]);
		chatFuncs["pfpshape"](data, [args[16]]);
		chatFuncs["use7tvpaint"](data, [args[17]]);
	},

	"flags": function(data, args) {
		let flags = [];
		for(let idx = 0; idx < args.length; idx++) {
			if(flags.length >= settings.limits.flags.max) {
				break;
			}

			let flag = args[idx];
			if(!(flag in settings.flags)) {
				continue;
			}

			flags.push(flag);
		}

		flags = flags.join(",");

		console.log(`set flag badges for ${data.user.username} to ${flags}`)
		localStorage.setItem(`flags_${data.user.id}`, flags);
	},
	"flag": function(data, args) { chatFuncs["flags"](data, args); },

	"bsr": function(data, args, msgElement) {
		if(channelData.game_id !== "503116") {
			return;
		}
		// todo: add a setting to disable this
		// very much future todo: make this an external script or something. make a plugin system. idk.
		if(!args.length) {
			return;
		}

		if(args[0].length > 5) {
			return;
		}

		args[0] = args[0].toLowerCase();
		if(!(/^[0-9a-f]+$/i).test(args[0])) {
			return;
		}

		if(!msgElement) {
			// god i need to refactor this system
			return true;
		}

		//let msgElement = $(`.chatBlock[data-msgUUID="${data.uuid}"]`);
		msgElement.children(".message").remove();

		let infoElement = $(`<div class="bsrInfo loading"></div>`);
		infoElement.html(`<i class="fas fa-spinner fa-pulse"></i> <span style="opacity: 0.67; margin-left: 6px;" class="loadingMsg">getting information for <strong>${args[0]}</strong>...</span>`);

		msgElement.append(infoElement);

		$.get(`https://api.beatsaver.com/maps/id/${args[0]}`, function(mapData) {
			console.log(mapData);

			if(mapData.id === "25f") {
				infoElement.addClass("STREAMER_CAN_YOU_PLAY_REALITY_CHECK_ITS_MY_FAVORITE_MAP");
			}

			$.get(`https://api.beatsaver.com/users/id/${mapData.uploader.id}`, function(uploaderData) {
				let canShowArt = (mapData.ranked || mapData.qualified || mapData.uploader.verifiedMapper || "curatedAt" in mapData);

				let canShowInfo = canShowArt;
				if(!canShowInfo) {
					if("firstUpload" in uploaderData.stats) {
						let firstUploadTimestamp = new Date(uploaderData.stats.firstUpload).getTime();
						if(Date.now() - firstUploadTimestamp > (10518984*1000)) {
							canShowInfo = true;
						}
					}
				}

				if(!canShowInfo) {
					infoElement.html(`<i class="fas fa-times"></i> <span style="opacity: 0.67; margin-left: 6px;" class="loadingMsg">could not show information for ${mapData.id}, BeatSaver account is too new</span>`);
					return;
				}

				let artElement = $(`<div class="bsrArt"></div>`);
				if(canShowArt) {
					let e = $(`<img src="${mapData.versions[0].coverURL}"/>`);
					artElement.append(e);
				}

				let metadataElement = $(`<div class="bsrMapInfo"></div>`);
				let titleElement = $(`<div class="songTitle">${mapData.metadata.songName}${mapData.metadata.songSubName === "" ? "" : ` - ${mapData.metadata.songSubName}`}</div>`);
				let artistElement = $(`<div class="songArtist">${mapData.metadata.songAuthorName}</div>`);
				let mapperElement = $(`<div class="mapper">${mapData.metadata.levelAuthorName}</div>`);
				metadataElement.append(titleElement).append(artistElement).append(mapperElement);

				let extraDataElement = $(`<div class="bsrExtraInfo"></div>`);
				let idElement = $(`<div class="bsrCode">${mapData.id}</div>`);
				let statsElement = $(`<div class="bsrStats"></div>`);
				statsElement.append($(`<span class="songTime"><i class="fas fa-clock"></i> ${formatTime(mapData.metadata.duration)}</span>`));
				statsElement.append($(`<span class="songRating"><i class="fas fa-thumbs-up"></i> ${mapData.stats.upvotes.toLocaleString()} <i class="fas fa-thumbs-down"></i> ${mapData.stats.downvotes.toLocaleString()}</span>`));
				extraDataElement.append(idElement).append(statsElement);

				infoElement.empty();
				if(canShowArt) {
					infoElement.append(artElement);
				}
				infoElement.append(metadataElement).append(extraDataElement);
			});
		});
	},

	refreshpronouns: function(data, callback) {
		$.get(`https://pronouns.alejo.io/api/users/${data.user.username}`, function(pnData) {
			let fetched = { pronoun_id: "NONE" };
			if(pnData.length) {
				fetched = pnData[0];
			}

			let expiresAt = Date.now() + (settings.cache.expireDelay * 1000);

			localStorage.setItem(`pn_${data.user.id}`, fetched.pronoun_id);
			localStorage.setItem(`pn_${data.user.id}_expiry`, expiresAt);
			console.log(`cached pronouns for ${data.user.username}, expires at ${new Date(expiresAt)}`);

			if(typeof callback === "function") {
				callback(fetched);
			}
		});
	},

	showpfp: function(data, args) {
		if(!args.length) { return; }
		let show = (args[0] === "yes" ? "yes" : "no");

		console.log(`show pfp for ${data.user.username} is now ${show}`);
		localStorage.setItem(`showpfp_${data.user.id}`, show);
	},

	useusername: function(data, args) {
		if(!args.length) { return; }
		let which = (args[0] === "yes" ? "username" : "name");

		console.log(`name for ${data.user.username} is now ${which}`);
		localStorage.setItem(`usename_${data.user.id}`, which);
	},

	pfpshape: function(data, args) {
		if(!args.length) { return; }

		let val = "10px";
		switch(args[0]) {
			case "square": val = "0px"; break;
			case "squircle": val = "10px"; break;
			case "circle": val = "100%"; break;
		}

		console.log(`pfp shape for ${data.user.username} is now ${val}`);
		localStorage.setItem(`pfpShape_${data.user.id}`, val);
		$(":root").get(0).style.setProperty(`--pfpShape${data.user.id}`, val);
	},

	refreshpfp: function(data, args) {
		console.log(`refreshing pfp cache for ${data.user.username}`);
		callTwitch({
			"endpoint": "users",
			"args": {
				"login": data.user.username
			}
		}, function(rawUserResponse) {
			console.log(rawUserResponse);
			localStorage.setItem(`pfp_${data.user.id}`, rawUserResponse.data[0].profile_image_url);
			localStorage.setItem(`pfp_${data.user.id}_expiry`, Date.now() + (settings.cache.expireDelay * 1000));
		});
	},

	refreshemotes: function(data, args) {
		//getExternalChannelEmotes(broadcasterData);
		if(!data.user.moderator) {
			return;
		}

		console.log("refreshing external emotes...");

		chatEmotes = {};
		getGlobalChannelEmotes(broadcasterData);
	},

	use7tvpaint: function(data, args) {
		if(!args.length) { return; }
		let which = (args[0] === "yes" ? "yes" : "no");

		console.log(`7tv paint for ${data.user.username} is now ${which} (only if available)`);
		localStorage.setItem(`use7tvpaint_${data.user.id}`, which);
	}
}

var lastUser;
var lastMessageIdx;
var messageCount = 0;
var testNameBlock;
function parseMessage(data) {
	if(!allowedToProceed) {
		console.log("No Client ID or Secret is set.");
		return;
	}

	console.log(data);

	let wantedCommand;
	let wantedArgs;
	if(data.message[0] === settings.chat.commandCharacter) {
		let parts = data.message.substr(1).split(" ");
		
		let cmd = parts[0].toLowerCase();
		wantedArgs = parts.slice(1);

		if(cmd in chatFuncs) {
			wantedCommand = chatFuncs[cmd];
		}

		let continueOn = false;
		if(typeof wantedCommand === "function") {
			continueOn = wantedCommand(data, wantedArgs);
		}

		if(!continueOn) {
			return;
		}
	}

	let rootElement = $(`<div class="chatBlock slideIn" data-msgIdx="${messageCount}" data-msgUUID="${data.uuid}" data-userID="${data.user.id}"></div>`);

	let userBlock = $('<div class="userInfo userInfoIn" style="display: none;"></div>');
	if(lastUser !== data.user.id) {
		userBlock.show();
	} else {
		userBlock.css("margin-top", "0px");
		userBlock.removeClass("userInfoIn").addClass("justFadeIn");
		rootElement.css("margin-top", "0px");
		$(`.chatBlock[data-msgIdx=${lastMessageIdx}]`).css("margin-bottom", "3px");
	}
	lastUser = data.user.id;
	lastMessageIdx = messageCount;
	messageCount++;

	let badgeBlock = $('<div class="badges" style="display: none;"></div>');
	for(let badgeType in data.user.badges.list) {
		let badgeData = getBadgeData(badgeType, data.user.badges.list[badgeType]);
		let url = badgeData.image_url_4x;
		if(typeof url === "undefined") {
			url = badgeData.image_url_1x;
		}

		let badgeElem = $(`<img src="${url}"/>`);
		badgeBlock.append(badgeElem);
		badgeBlock.show();
	}
	userBlock.append(badgeBlock);

	if(!localStorage.getItem(`flags_${data.user.id}`)) { localStorage.setItem(`flags_${data.user.id}`, ""); }
	let flags = localStorage.getItem(`flags_${data.user.id}`).split(",");

	if(flags.length) {
		let flagBlock = $('<div class="flags" style="display: none;"></div>');
		for(let flagIdx in flags) {
			let flag = flags[flagIdx];
			if(!flag) {
				continue;
			}

			let filename = settings.flags[flag];

			flagBlock.append($(`<span class="flag${flag} flag" style="background-image: url('flags/${filename}'); display: inline-block;"></div>`));
			flagBlock.show();
		}
		userBlock.append(flagBlock);
	}

	let pronounsBlock = $('<div class="pronouns" style="display: none;"></div>');
	let pronouns = localStorage.getItem(`pn_${data.user.id}`);
	let pronounsExpiry = parseInt(localStorage.getItem(`pn_${data.user.id}_expiry`));
	let recachePronouns = false;

	if(pronouns) {
		console.log(`pronouns are cached for ${data.user.username}`);

		if(Date.now() > pronounsExpiry || isNaN(pronounsExpiry)) {
			recachePronouns = true;
			console.log("...however, they are out of date");
		}
	} else {
		recachePronouns = true;
	}

	if(recachePronouns) {
		console.log(`refreshing pronoun cache for ${data.user.username}`);
		chatFuncs["refreshpronouns"](data, function(fetched) {
			if(fetched.pronoun_id !== "NONE") {
				pronounsBlock.text(pn[fetched.pronoun_id]);
				pronounsBlock.show();
			}			
		});
	} else {
		if(pn[pronouns]) {
			pronounsBlock.text(pn[pronouns]);
			pronounsBlock.show();
		}
	}

	userBlock.append(pronounsBlock);

	let pfpBlock = $('<img class="pfp" src="" style="display: none;"/>');
	let pfpURL = localStorage.getItem(`pfp_${data.user.id}`);
	let pfpExpiry = parseInt(localStorage.getItem(`pfp_${data.user.id}_expiry`));
	let recachePfp = false;

	if(pfpURL) {
		console.log(`pfp cached for ${data.user.username}`);

		if(Date.now() > pfpExpiry || isNaN(pfpExpiry)) {
			recachePfp = true;
			console.log("...however, it is out of date");
		}
	} else {
		recachePfp = true;
	}

	if(recachePfp) {
		console.log(`refreshing pfp cache for ${data.user.username}`);
		callTwitch({
			"endpoint": "users",
			"args": {
				"login": data.user.username
			}
		}, function(rawUserResponse) {
			console.log(rawUserResponse);
			localStorage.setItem(`pfp_${data.user.id}`, rawUserResponse.data[0].profile_image_url);
			localStorage.setItem(`pfp_${data.user.id}_expiry`, Date.now() + (settings.cache.expireDelay * 1000));
			pfpBlock.attr("src", rawUserResponse.data[0].profile_image_url);
		});
	} else {
		console.log(`pfp is cached for ${data.user.username}`);
		pfpBlock.attr("src", pfpURL);
	}

	if(!localStorage.getItem(`pfpShape_${data.user.id}`)) { localStorage.setItem(`pfpShape_${data.user.id}`, "10px"); }
	$(":root").get(0).style.setProperty(`--pfpShape${data.user.id}`, localStorage.getItem(`pfpShape_${data.user.id}`));
	pfpBlock.css("border-radius", `var(--pfpShape${data.user.id})`);

	if(!settings.chat.alwaysShowPFP) {
		if(data.user.badges.list) {
			if("vip" in data.user.badges.list || "moderator" in data.user.badges.list || "subscriber" in data.user.badges.list || "broadcaster" in data.user.badges.list) {
				if(!localStorage.getItem(`showpfp_${data.user.id}`)) { localStorage.setItem(`showpfp_${data.user.id}`, "yes"); }

				if(localStorage.getItem(`showpfp_${data.user.id}`) === "yes") {
					userBlock.append(pfpBlock);
					pfpBlock.show();
				}
			}
		}
	} else {
		if(localStorage.getItem(`showpfp_${data.user.id}`) !== "no") {
			userBlock.append(pfpBlock);
			pfpBlock.show();
		}
	}

	if(!localStorage.getItem(`color_${data.user.id}`)) {
		let col = data.user.color;
		if(!col) { col = "#AAAAAA"; }

		localStorage.setItem(`color_${data.user.id}`, col);
	}
	if(!localStorage.getItem(`namefont_${data.user.id}`)) { localStorage.setItem(`namefont_${data.user.id}`, "Manrope"); }
	if(!localStorage.getItem(`nameweight_${data.user.id}`)) { localStorage.setItem(`nameweight_${data.user.id}`, 700); }
	if(!localStorage.getItem(`namesize_${data.user.id}`)) { localStorage.setItem(`namesize_${data.user.id}`, "16pt"); }
	if(!localStorage.getItem(`namestyle_${data.user.id}`)) { localStorage.setItem(`namestyle_${data.user.id}`, "normal"); }
	if(!localStorage.getItem(`namespacing_${data.user.id}`)) { localStorage.setItem(`namespacing_${data.user.id}`, "1px"); }
	if(!localStorage.getItem(`nametransform_${data.user.id}`)) { localStorage.setItem(`nametransform_${data.user.id}`, "uppercase"); }
	if(!localStorage.getItem(`namevariant_${data.user.id}`)) { localStorage.setItem(`namevariant_${data.user.id}`, "normal"); }
	if(!localStorage.getItem(`color2_${data.user.id}`)) { localStorage.setItem(`color2_${data.user.id}`, "#ffffff"); }
	if(!localStorage.getItem(`nameangle_${data.user.id}`)) { localStorage.setItem(`nameangle_${data.user.id}`, "170deg"); }
	if(!localStorage.getItem(`usename_${data.user.id}`)) { localStorage.setItem(`usename_${data.user.id}`, "name"); }
	if(!localStorage.getItem(`use7tvpaint_${data.user.id}`)) { localStorage.setItem(`use7tvpaint_${data.user.id}`, "yes"); }

	$(":root").get(0).style.setProperty(`--nameColor${data.user.id}`, localStorage.getItem(`color_${data.user.id}`));
	$(":root").get(0).style.setProperty(`--nameFont${data.user.id}`, localStorage.getItem(`namefont_${data.user.id}`));
	$(":root").get(0).style.setProperty(`--nameWeight${data.user.id}`, localStorage.getItem(`nameweight_${data.user.id}`));
	$(":root").get(0).style.setProperty(`--nameSize${data.user.id}`, localStorage.getItem(`namesize_${data.user.id}`));
	$(":root").get(0).style.setProperty(`--nameStyle${data.user.id}`, localStorage.getItem(`namestyle_${data.user.id}`));
	$(":root").get(0).style.setProperty(`--nameSpacing${data.user.id}`, localStorage.getItem(`namespacing_${data.user.id}`));
	$(":root").get(0).style.setProperty(`--nameTransform${data.user.id}`, localStorage.getItem(`nametransform_${data.user.id}`));
	$(":root").get(0).style.setProperty(`--nameVariant${data.user.id}`, localStorage.getItem(`namevariant_${data.user.id}`));
	$(":root").get(0).style.setProperty(`--nameColorSecondary${data.user.id}`, localStorage.getItem(`color2_${data.user.id}`));
	$(":root").get(0).style.setProperty(`--nameAngle${data.user.id}`, localStorage.getItem(`nameangle_${data.user.id}`));

	let nameBlock = $(`<div class="name" data-userid="${data.user.id}">${data.user[localStorage.getItem(`usename_${data.user.id}`)]}</div>`);
	nameBlock.css("background-image", `linear-gradient(var(--nameAngle${data.user.id}), var(--nameColorSecondary${data.user.id}) 0%, var(--nameColor${data.user.id}) 75%)`);
	nameBlock.css("font-family", `var(--nameFont${data.user.id})`);
	nameBlock.css("font-weight", `var(--nameWeight${data.user.id})`);
	nameBlock.css("font-size", `var(--nameSize${data.user.id})`);
	nameBlock.css("font-style", `var(--nameStyle${data.user.id})`);
	nameBlock.css("letter-spacing", `var(--nameSpacing${data.user.id})`);
	nameBlock.css("text-transform", `var(--nameTransform${data.user.id})`);
	nameBlock.css("font-variant", `var(--nameVariant${data.user.id})`);

	userBlock.append(nameBlock);
	rootElement.append(userBlock);

	if(!localStorage.getItem(`msgfont_${data.user.id}`)) { localStorage.setItem(`msgfont_${data.user.id}`, "Manrope"); }
	if(!localStorage.getItem(`msgsize_${data.user.id}`)) { localStorage.setItem(`msgsize_${data.user.id}`, "16pt"); }
	if(!localStorage.getItem(`msgspacing_${data.user.id}`)) { localStorage.setItem(`msgspacing_${data.user.id}`, "0px"); }
	if(!localStorage.getItem(`msgweight_${data.user.id}`)) { localStorage.setItem(`msgweight_${data.user.id}`, 700); }

	$(":root").get(0).style.setProperty(`--msgFont${data.user.id}`, localStorage.getItem(`msgfont_${data.user.id}`));
	$(":root").get(0).style.setProperty(`--msgSize${data.user.id}`, localStorage.getItem(`msgsize_${data.user.id}`));
	$(":root").get(0).style.setProperty(`--msgSpacing${data.user.id}`, localStorage.getItem(`msgspacing_${data.user.id}`));
	$(":root").get(0).style.setProperty(`--msgWeight${data.user.id}`, localStorage.getItem(`msgweight_${data.user.id}`));

	let messageBlock = $('<div class="message"></div>');
	messageBlock.css("font-family", `var(--msgFont${data.user.id})`);
	messageBlock.css("font-size", `var(--msgSize${data.user.id})`);
	messageBlock.css("letter-spacing", `var(--msgSpacing${data.user.id})`);
	messageBlock.css("font-weight", `var(--msgWeight${data.user.id})`);

	if(localStorage.getItem(`use7tvpaint_${data.user.id}`) === "yes") {
		for(let i in sevenTVPaints) {
			let paint = sevenTVPaints[i];
			if(paint.users.indexOf(data.user.id) !== -1) {
				set7TVPaint(nameBlock, i);
				break;
			}
		}
	}

	//console.log(` 1: ${data.message}`);

	// don't mind the bad grammar, this helped here LOL
	// https://dev.to/acanimal/how-to-slice-or-get-symbols-from-a-unicode-string-with-emojis-in-javascript-lets-learn-how-javascript-represent-strings-h3a
	let originalMessage = Array.from(data.message.normalize());
	let checkExternalEmotes = Array.from(data.message.normalize());

	//console.log(` 2: ${originalMessage}`);

	if(data.emotes) {
		for(let emoteID in data.emotes) {
			for(let i in data.emotes[emoteID]) {
				let spots = data.emotes[emoteID][i].split("-");
				let startAt = parseInt(spots[0]);
				let stopAt = parseInt(spots[1]);

				for(let charIdx = startAt; charIdx <= stopAt; charIdx++) {
					originalMessage[charIdx] = "";
					checkExternalEmotes[charIdx] = "";
				}

				let emoteURL = `https://static-cdn.jtvnw.net/emoticons/v2/${emoteID}/default/dark/3.0`;
				originalMessage[startAt] = `<span class="emote" style="background-image: url('${emoteURL}');"><img src="${emoteURL}"/></span>`;
			}
		}
	}

	//console.log(` 3: ${originalMessage}`);

	let externalPostRemoval = [];
	for(let charIdx in checkExternalEmotes) {
		let char = checkExternalEmotes[charIdx];
		if(char !== "") {
			externalPostRemoval.push(char);
		}
	}
	//console.log(` 4: ${externalPostRemoval}`);
	externalPostRemoval = externalPostRemoval.join("").replace(/\p{Extended_Pictographic}/ug, '');
	let eprw = externalPostRemoval.split(" ");
	let eprww = [];
	for(let wordIdx in eprw) {
		let word = eprw[wordIdx];
		if(!(word in chatEmotes)) {
			eprww.push(eprw[wordIdx]);
		}
	}
	//console.log(` 5: ${eprww}`);

	let parsedMessage = [];

	for(let charIdx in originalMessage) {
		if(!originalMessage[charIdx]) {
			continue;
		}

		if(originalMessage[charIdx] in entityMap) {
			parsedMessage.push(entityMap[originalMessage[charIdx]]);
		} else {
			parsedMessage.push(originalMessage[charIdx]);
		}
	}
	//console.log(` 6: ${parsedMessage}`);

	let stuff = md.renderInline(parsedMessage.join(""));
	//console.log(` 7: ${stuff}`);

	let words = stuff.split(" ");
	for(let wordIdx in words) {
		let word = words[wordIdx];
		if(word in chatEmotes) {
			words[wordIdx] = `<span class="emote" style="background-image: url('${chatEmotes[word].url}');"><img src="${chatEmotes[word].url}"/></span>`;
		}
	}

	//console.log(` 8: ${words}`);

	// what i'm doing here to fix in-line seamless emotes is stupid but it works yay
	messageBlock.html(words.join(" ").replaceAll("</span> <span", "</span><span"));

	if(data.type === "action") {
		messageBlock.addClass("actionMessage");
		messageBlock.css("background-image", `linear-gradient(170deg, #fff -50%, ${data.user.color} 150%)`);
	}

	messageBlock = $(twemoji.parse(messageBlock[0]));

	if(eprww.join("") === "") {
		messageBlock.css("font-size", "0pt").css("line-height", "1em").css("letter-spacing", "0px").css("padding-bottom", "8px");
		messageBlock.children(".emote").css("font-size", "48pt").css("padding", "0px");

		let count = 0;
		messageBlock.children(".emote,.emoji").each(function() {
			if(count >= settings.limits.bigEmoji.max) {
				$(this).remove();
			}
			count++;
		});
	}

	rootElement.append(messageBlock);

	// hard cap at 100 messages, realistically this will never be hit. only here for the perma-message no-opacity needers
	if($(".chatBlock").length > 100) {
		$(".chatBlock")[0].remove();
	}

	$(".chatBlock").each(function() {
		let opacity = 1 - ((messageCount - parseInt($(this).attr("data-msgIdx"))) * settings.chat.opacityDecreaseStep);
		if(opacity < 0) {
			opacity = 0;
		}

		if(!opacity) {
			$(this).remove();
		}

		$(this).children(".userInfo,.bsrInfo").css("transition", ".5s").css("filter", `opacity(${opacity})`);
		$(this).children(".message").css("transition", ".5s").css("filter", `var(--shadowStuff) opacity(${opacity})`);
	});

	if(data.highlighted) {
		rootElement.addClass("highlighted");
	}

	$("#wrapper").append(rootElement);

	if(typeof wantedCommand === "function") {
		wantedCommand(data, wantedArgs, rootElement);
	}

	if(settings.chat.secondsVisible) {
		setTimeout(function() {
			rootElement.removeClass("slideIn").addClass("slideOut");
			rootElement.one("animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd", function() {
				$(this).remove();
			});
		}, settings.chat.secondsVisible * 1000);
	}

	checkForExternalBadges(data, badgeBlock);

	testNameBlock = nameBlock;
}

function set7TVPaint(nameBlock, which) {
	let paint = sevenTVPaints[which];
	let css = "";
	let bgColor = parse7TVColor(paint.color);

	if(paint.function === "url") {
		css = `url(${paint.image_url})`;
	} else {
		let stops = [];
		for(let i in paint.stops) {
			let stop = paint.stops[i];
			stops.push(`${parse7TVColor(stop.color)} ${stop.at*100}%`);
		}
		
		let func = paint.function;
		if(paint.repeat) {
			func = `repeating-${paint.function}`;
		}

		let angle = `${paint.angle}deg`
		if(paint.function === "radial-gradient") {
			angle = `${paint.shape} at ${paint.angle}%`;
		}

		css = `${func}(${angle}, ${stops.join(",")})`;
	}

	let shadows = "";
	if("drop_shadows" in paint) {
		let shadowsArr = [];
		if(paint.drop_shadows.length) {
			for(let i in paint.drop_shadows) {
				let s = paint.drop_shadows[i];
				// names are a biiit bigger here on the overlay
				shadowsArr.push(`drop-shadow(${s.x_offset*1.5}px ${s.y_offset*1.5}px ${s.radius*1.5}px ${parse7TVColor(s.color)})`);
			}
			shadows = shadowsArr.join(" ");
		}
	}
	//console.log(css);
	nameBlock.css("background-color", bgColor).css("background-image", css).css("background-size", "contain");
	nameBlock.css("filter", `${shadows === "" ? "var(--shadowStuff)" : shadows}`);
}

var externalBadgeCache = {};

function getFFZBadges(data, callback) {
	let id = data.user.id;
	console.log(`getting FFZ badges for ${data.user.username}...`);

	$.ajax({
		type: "GET",
		url: `https://api.frankerfacez.com/v1/user/id/${id}`,

		success: function(response) {
			console.log(response);

			externalBadgeCache[id].ffz = {
				expires: Date.now() + 3600000,
				badges: []
			};

			if(!("status" in response)) {
				let badges = response.badges;
				for(let i in badges) {
					let badge = badges[i];
					let badgeURL = badge.urls[4 in badge.urls ? 4 : 1];

					externalBadgeCache[id].ffz.badges.push({
						img: badgeURL,
						color: badge.color
					});
				}
			}

			if(typeof callback === "function") {
				callback(data, response);
			}
		}
	})	
}

// 7TV just stores all their badge data in one URL, get it now
var sevenTVCosmetics = {};
var sevenTVBadges = [];
var sevenTVPaints = [];
function get7TVBadges() {
	console.log("getting 7TV badges...");
	$.ajax({
		type: "GET",
		url: `https://7tv.io/v2/cosmetics?user_identifier=twitch_id`,

		success: function(response) {
			sevenTVCosmetics = response;
			sevenTVBadges = response.badges;
			sevenTVPaints = response.paints;
		}
	})	
}
get7TVBadges();

function parse7TVColor(color) {
	if(!color) {
		return "#000";
	}

	let red = (color >> 24) & 0xFF;
	let green = (color >> 16) & 0xFF;
	let blue = (color >> 8) & 0xFF;
	let alpha = (color & 0xFF);

	return `rgba(${red}, ${green}, ${blue}, ${alpha/255})`;
}

function checkForExternalBadges(data, badgeBlock) {
	console.log(data);
	let id = data.user.id;

	if(!(id in externalBadgeCache)) {
		console.log(`external badges not cached for ${data.user.username}`);

		externalBadgeCache[id] = {
			ffz: {
				expires: null,
				badges: []
			},
			bttv: {
				expires: null,
				badges: []
			},
			seventv: {
				expires: null,
				badges: []
			}
		};

		for(let i in sevenTVBadges) {
			let stvBadge = sevenTVBadges[i];
			if(stvBadge.users.indexOf(id) !== -1) {
				externalBadgeCache[id].seventv.badges.push({
					img: stvBadge.urls[stvBadge.urls.length-1][1]
				});
			}
		}

		getFFZBadges(data, function(data, response) {
			console.log(`got external badges for ${data.user.username}`);
			checkIfExternalBadgesDone(data, badgeBlock);
		});
	} else {
		if(!("ffz" in externalBadgeCache[id])) {
			externalBadgeCache[id].ffz = {
				expires: null,
				badges: []
			};
		}
		if(!("bttv" in externalBadgeCache[id])) {
			externalBadgeCache[id].bttv = {
				expires: null,
				badges: []
			};
		}
		if(!("seventv" in externalBadgeCache[id])) {
			externalBadgeCache[id].seventv = {
				expires: null,
				badges: []
			};
		}

		if(Date.now() > externalBadgeCache[id].ffz.expires) {
			getFFZBadges(data, function(data, response) {
				checkIfExternalBadgesDone(data, badgeBlock);
			});
		} else {
			renderExternalBadges(data, badgeBlock);
		}
	}
}

function renderExternalBadges(data, badgeBlock) {
	if(!badgeBlock) {
		return;
	}

	let id = data.user.id;

	for(let service in externalBadgeCache[id]) {
		let cacheData = externalBadgeCache[id][service];

		for(let i in cacheData.badges) {
			let badge = cacheData.badges[i];

			let badgeElem = $(`<img src="${badge.img}"/>`).css("border-radius", "3px");
			if("color" in badge) {
				badgeElem.css("background-color", badge.color);
			}

			badgeBlock.append(badgeElem);
		}
	}	
}

function checkIfExternalBadgesDone(data, badgeBlock) {
	let id = data.user.id;
	let okToRender = true;

	for(let service in externalBadgeCache[id]) {
		let cacheData = externalBadgeCache[id][service];

		if(cacheData.expires === null) {
			continue;
		}

		if(Date.now() > cacheData.expires) {
			okToRender = false;
			break;
		}
	}

	if(okToRender) {
		renderExternalBadges(data, badgeBlock);
	}
}

function bttvBadge(data) {
	if(!("data" in data)) {
		console.log("no data");
		return;
	}
	data = data.data; // sigh

	console.log(`getting bttv badge data for ${data.name}...`);

	if(!("badge" in data)) {
		console.log("no badge object");
		return;
	}
	if(!Object.keys(data.badge).length) {
		console.log("badge object empty");
		return;
	}

	let id = data.providerId;

	if(!(id in externalBadgeCache)) {
		externalBadgeCache[id] = {
			ffz: {
				expires: null,
				badges: []
			},
			bttv: {
				expires: null,
				badges: []
			},
			seventv: {
				expires: null,
				badges: []
			}
		};
	}

	externalBadgeCache[id].bttv.badges = [{
		img: data.badge.url
	}];	
}

function updateBTTVEmote(data) {
	let newEmote = data.emote;
	let id = newEmote.id;

	for(let name in chatEmotes) {
		let oldEmote = chatEmotes[name];

		if(oldEmote.service === "bttv" && oldEmote.id === id) {
			console.log(`renamed ${name} to ${newEmote.code}`);

			chatEmotes[newEmote.code] = oldEmote;
			delete chatEmotes[name];
			break;
		}
	}
}

function deleteBTTVEmote(data) {
	let id = data.emoteId;

	for(let name in chatEmotes) {
		let oldEmote = chatEmotes[name];

		if(oldEmote.service === "bttv" && oldEmote.id === id) {
			console.log(`deleted ${name}`);
			delete chatEmotes[name];
			break;
		}
	}	
}

function addBTTVEmote(data) {
	let emote = data.emote;
	
	chatEmotes[emote.code] = {
		service: "bttv",
		url: `https://cdn.betterttv.net/emote/${emote.id}/3x.${emote.imageType}`,
		id: emote.id
	}

	console.log(`added emote ${emote.code}`);
}

var bttvWS;
function startBTTVWebsocket() {
	console.log("Starting connection to BTTV...");

	bttvWS = new WebSocket("wss://sockets.betterttv.net/ws");

	bttvWS.addEventListener("message", function(msg) {
		let data = JSON.parse(msg.data);
		console.log(data);

		switch(data.name) {
			case "lookup_user":
				bttvBadge(data);
				break;

			case "emote_update":
				updateBTTVEmote(data.data);
				break;

			case "emote_delete":
				deleteBTTVEmote(data.data);
				break;

			case "emote_create":
				addBTTVEmote(data.data);
				break;
		}
	});

	bttvWS.addEventListener("open", function() {
		console.log("Successfully connected to BTTV");

		let waitForBroadcasterData = function() {
			if(!("id" in broadcasterData)) {
				console.log("no broadcaster data yet...");
				setTimeout(waitForBroadcasterData, 1000);
				return;
			} else {
				console.log("broadcaster data is present, joining BTTV channel...");
			}

			let msg = {
				name: "join_channel",
				data: {
					name: `twitch:${broadcasterData.id}`
				}
			}

			bttvWS.send(JSON.stringify(msg));
		};
		waitForBroadcasterData();
	});

	bttvWS.addEventListener("close", function() {
		console.log("Disconnected from BTTV, trying again in 20 seconds...");
		setTimeout(startBTTVWebsocket, 20000);
	});
}
startBTTVWebsocket();