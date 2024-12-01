CREATE TABLE IF NOT EXISTS queue (
	mapKey BLOB PRIMARY KEY,
	mapHash BLOB DEFAULT NULL,
	mapTitle BLOB DEFAULT "No Title",
	mapArtist BLOB DEFAULT "Unknown Artist",
	mapAuthor BLOB DEFAULT "Unknown Mapper",
	mapDuration INTEGER DEFAULT 0,
	requesterID INTEGER DEFAULT 0,
	flagIsModAdd BOOLEAN DEFAULT FALSE,
	flagModAddTargetID INTEGER DEFAULT 0,
	timeAdded INTEGER DEFAULT 0
);