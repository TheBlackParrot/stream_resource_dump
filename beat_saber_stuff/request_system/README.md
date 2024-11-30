This is an external request system for Beat Saber, utilizing PHP and an SQLite database to dynamically generate a .bplist formatted JSON file for use with the PlaylistManager mod.

# Server-sided setup
Create a webserver-readable "key" file, and modify the `$access_key` variable in `lib/settings.php` to the filepath of said key file. This is used in POST requests that require some sort of authentication to ensure the requests being made are coming from something you control.

Modify any setting values in the `$settings` array in `lib/settings.php` to values of your liking. `INF` is infinity, `-INF` is negative infinity, use these to disable numeric thresholds. *(eventually I'll make commands for these sry)*

# Payload examples
### Notes
- Payloads are sent as POST requests, unless otherwise specified.
- Permission checks are outside the scope of this system, your Twitch bot should be able to handle this.
- Twitch users are referenced by their unique numerical ID.
- Map keys are sent as strings.
- `flags/userLevel` corresponds to the viewer's subscriber role.
	- 0 = not subscribed
	- 1 = Tier 1 sub
	- 2 = Tier 2 sub
	- 3 = Tier 3 sub
- If the map being added is a forced addition, `flags/modadd` should be set to `true`, otherwise use `false`.
- If a target user is specified, add their numerical ID to `flags/modaddTarget`.
	- This variable is optional.

## !bsr [key] -- *(addToQueue.php)*
```json
{
	"accessKey": "abc123",
	"user": 43464015,
	"key": "1ad3b",
	"flags": {
		"isModerator": true,
		"isVIP": false,
		"userLevel": 3,
		"modadd": false
	}
}
```

## !modadd [key] [opt: user] -- *(addToQueue.php)*
```json
{
	"accessKey": "abc123",
	"user": 43464015,
	"key": "1ad3b",
	"flags": {
		"isModerator": true,
		"isVIP": false,
		"userLevel": 3,
		"modadd": true,
		"modaddTarget": 420691337
	}
}
```

## !blacklist [key] -- *(blacklistMap.php)*
```json
{
	"accessKey": "abc123",
	"key": "1ad3b"
}
```

## !unblacklist [key] -- *(unblacklistMap.php)*
```json
{
	"accessKey": "abc123",
	"key": "1ad3b"
}
```

## !queue -- *(viewQueue.php)*
Use a GET request.
> (`user` parameter is optional)

```
viewQueue.php?user=43464015
```

## !clear -- *(clearQueue.php)*
```json
{
	"accessKey": "abc123"
}
```

# In-game setup
Navigate to `https://your.webserver.here/path/to/folder/getPlaylist.php?key=youraccesskeyhere`, and save the resulting JSON file as a .bplist file in your `Beat Saber/Playlists` directory. Once in-game, press the refresh icon in the top-right corner of the playlist cover view, and it will automatically pull down the next map in queue. Every time this is pressed, it will move to the next map, so press carefully.

To pull down the *entire* queue, use `https://your.webserver.here/path/to/folder/getEntireQueue.php` (no key needed). This will not do any destructive changes.