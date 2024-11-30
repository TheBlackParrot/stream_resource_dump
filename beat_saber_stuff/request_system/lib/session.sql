CREATE TABLE IF NOT EXISTS sessions (
	unixTimestamp INTEGER PRIMARY KEY
);

INSERT INTO sessions (unixTimestamp) VALUES (%1$d);

CREATE TABLE IF NOT EXISTS session_%1$d (
	mapKey STRING PRIMARY KEY,
	mapHash STRING DEFAULT NULL,
	mapTitle STRING DEFAULT "No Title",
	mapArtist STRING DEFAULT "Unknown Artist",
	mapAuthor STRING DEFAULT "Unknown Mapper",
	timePlayed INTEGER DEFAULT 0
);