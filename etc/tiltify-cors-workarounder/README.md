This is a **Node.js** script I made to get around CORS stuff on Tiltify's REST API. I'm uploading it in its current state just to use as reference.

### settings.json
The `auth` object contains the developer ID and secret key that you'll make in your Tiltify developer dashboard.
The `listen` object is for the websocket server that will send data out.  

`campaign_id` is the ID of your own campaign, visible in the URL of the campaign in your dashboard. You'll take that UUID and replace the value of `campaign_id` with the one from the URL.
`poll_interval` is how often (in seconds) that the script will poll the REST API for new donations.

The `campaign_overlay_id` can be ignored, this was supposed to be for my own overlays, but forgot to make use of it. Eventually this will send out with the `event` websocket broadcasts so that any goal overlay can auto-update.

### Events
If new donations are received, they'll be sent out as a single object:
```json
{
	"event": "donations",
	"data": [REST API response]
}
```

When new websocket clients connect, they'll receive data pertaining to the campaign:
```json
{
	"event": "campaign",
	"data": [REST API response]
}
```

All events simply broadcast what the REST API spits out.
https://developers.tiltify.com/api-reference/public