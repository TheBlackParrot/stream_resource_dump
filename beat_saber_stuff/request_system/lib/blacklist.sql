CREATE TABLE IF NOT EXISTS blacklist (
	mapKey BLOB PRIMARY KEY,
	mapTitle BLOB DEFAULT "No Title",
	mapArtist BLOB DEFAULT "Unknown Artist",
	mapAuthor BLOB DEFAULT "Unknown Mapper",
	timeAdded INTEGER DEFAULT 0
);