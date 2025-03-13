const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function formatTime(date) {
	return `${daysOfWeek[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}, ${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`
}

sessionData = {};

async function getSessions() {
	const response = await fetch("../../getSessions.php");
	if(!response.ok) {
		console.warn("Failed to fetch session timestamps");
		return;
	}

	const data = await response.json();
	if(!data.OK) {
		console.warn(data.message);
		return;
	}

	const timestamps = data.data;

	for(const timestamp of timestamps) {
		sessionData[timestamp] = {};

		const query = new URLSearchParams({
			session: timestamp
		});
		const sessionResponse = await fetch(`../../getSession.php?${query.toString()}`);
		if(!sessionResponse.ok) {
			console.warn(`Failed to fetch session ${timestamp}`);
			return;
		}

		const stuff = await sessionResponse.json();

		if(!stuff.songs.length) {
			continue;
		}

		const pageElement = $('<div class="page"></div>');

		const queryNoDupes = new URLSearchParams({
			session: timestamp,
			duplicates: false
		});
		const headerElement = $('<div class="header"></div>');
		const headerLink = $('<a></a>');
		headerLink.text(formatTime(new Date(timestamp * 1000)));
		headerLink.attr("href", `../../getSession.php?${queryNoDupes.toString()}`);
		headerElement.append(headerLink);
		pageElement.append(headerElement);

		for(const songDetails of stuff.songs) {
			const cellElement = $('<div class="cell"></div>');
			
			const mapKeyElement = $('<div class="part mapKey"></div>');
			const mapKeyValue = $('<a></a>');
			mapKeyValue.text(songDetails.key);
			mapKeyValue.attr("href", `https://beatsaver.com/maps/${songDetails.key}`);
			mapKeyElement.append(mapKeyValue);
			cellElement.append(mapKeyElement);

			const coverElement = $('<div class="mapCover"></div>');
			coverElement.css("background-image", `url('https://cdn.beatsaver.com/${songDetails.hash}.jpg')`);
			cellElement.append(coverElement);

			const backgroundElementRoot = $('<div class="mapBG"></div>');
			const backgroundElement = $('<div></div>');
			backgroundElement.css("background-image", `url('https://cdn.beatsaver.com/${songDetails.hash}.jpg')`);
			backgroundElementRoot.append(backgroundElement);
			cellElement.append(backgroundElementRoot);

			const mapDetailsElement = $('<div class="part mapDetails"></div>');

			const mapArtistElement = $('<span class="mapArtist"></span>');
			mapArtistElement.text(songDetails.songArtist);
			mapDetailsElement.append(mapArtistElement);

			const mapTitleElement = $('<span class="mapTitle"></span>');
			mapTitleElement.text(songDetails.songName);
			mapDetailsElement.append(mapTitleElement);

			const mapAuthorElement = $('<span class="mapAuthor"></span>');
			mapAuthorElement.text(songDetails.levelAuthorName);
			mapDetailsElement.append(mapAuthorElement);

			cellElement.append(mapDetailsElement);

			const extraInfoElement = $('<div class="part mapExtraInfo"></div>');

			const accElement = $('<span class="mapAcc"></span>');
			if(!songDetails.accuracy) {
				accElement.text("DNF");
				accElement.addClass("DNF");
			} else {
				accElement.text(songDetails.accuracy.toFixed(1));
			}
			extraInfoElement.append(accElement);

			const dateObject = new Date(songDetails.timePlayed * 1000);
			const timePlayedElement = $('<span class="timePlayed"></div>');
			timePlayedElement.text(`${dateObject.getHours()}:${dateObject.getMinutes().toString().padStart(2, "0")}`);
			extraInfoElement.append(timePlayedElement);

			cellElement.append(extraInfoElement);

			pageElement.append(cellElement);
		}

		$("#wrapper").append(pageElement);

		const el = headerElement[0];
		const observer = new IntersectionObserver( 
			([e]) => e.target.classList.toggle("isPinned", e.intersectionRatio < 1),
			{ threshold: [1] }
		);

		observer.observe(el);
	}
}

function windowResized() {
	document.querySelector("html").style.setProperty("--max-width", `${window.innerWidth - 279}px`);
}
windowResized();
window.onresize = windowResized;