This is an example showing the schema for what the Now Playing overlay's external music player websocket connection expects. It's probably rather primitive and prone to breaking, but it's meant to just be an example.

# state event
**Fired on an interval, just updates the current state of the player**

```json
{
	"event": "state",
	"data": {
		"playing": true,
		"elapsed": 15670
	}
}
```

`data.playing` is a boolean (true if playing, false otherwise)  
`data.elapsed` is in milliseconds

# track event
**Fired on connection or whenever the currently playing track changes**

```json
{
	"event": "track",
	"data": {
		"id": "sdfhskjdfhskdfs",
		"title": "Song Title",
		"artists": ["Song Artist 1", "Song Artist 2", "..."],
		"duration": 180000,
		"album": {
			"name": "This Is A Music Album",
			"year": 2024
		},
		"art": {
			"type": "image/jpeg",
			"data": "[base64 art data here]"
		},
		"isrc": "QZS652374108"
	}
}
```

`data.id` is only a unique identifier for internal use, change this for each unique song  
`data.duration` is in milliseconds
`data.art.type` is the mime type of the encoded art data, anything CEF can read will work here. null if art is not present
`data.art.data` is binary image data encoded in base64, null if art is not present
`data.isrc` is null if an ISRC is not present