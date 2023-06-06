This is a **Node.js** script I made to get around CORS stuff on Tiltify's REST API. I'm uploading it in its current state just to use as reference.

### settings.json
The `auth` object contains the developer ID and secret key that you'll make in your Tiltify developer dashboard.
The `listen` object is for the websocket server that will send data out.  

The `campaign` object contains a shorthand name for your campaign (e.g. for overlays) and the ID of your own campaign, visible in the URL of the campaign in your dashboard. You'll take that UUID and replace the value of the key with your shorthand name with the one from the URL.
`poll_interval` is how often (in seconds) that the script will poll the REST API for new donations.

### Events
If new donations are received, they'll be sent out as a single object:
```json
{
	"event": "donations",
	"campaign": "[campaign name given in settings.json]",
	"data": [[REST API response]]
}
```

When new websocket clients connect, they'll receive data pertaining to the campaign:
```json
{
	"event": "campaign",
	"campaign": "[campaign name given in settings.json]",
	"data": {[REST API response]}
}
```

All events simply broadcast what the REST API spits out.
https://developers.tiltify.com/api-reference/public