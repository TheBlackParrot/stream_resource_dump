CREATE TABLE IF NOT EXISTS blacklist (
	mapKey STRING PRIMARY KEY,
	mapTitle STRING DEFAULT "No Title",
	mapArtist STRING DEFAULT "Unknown Artist",
	mapAuthor STRING DEFAULT "Unknown Mapper",
	timeAdded INTEGER DEFAULT 0
);