CREATE TABLE IF NOT EXISTS sessions (
	unixTimestamp INTEGER PRIMARY KEY,
	version INTEGER DEFAULT 0
);

INSERT INTO sessions (unixTimestamp, version) VALUES (%1$d, 1);

CREATE TABLE IF NOT EXISTS session_%1$d (
	mapKey BLOB,
	mapHash BLOB DEFAULT NULL,
	mapTitle BLOB DEFAULT "No Title",
	mapArtist BLOB DEFAULT "Unknown Artist",
	mapAuthor BLOB DEFAULT "Unknown Mapper",
	accuracy REAL DEFAULT 0,
	timePlayed INTEGER PRIMARY KEY
);