I didn't like the fact (a certain service) I was using wanted to charge (a monthly subscription fee) for a Date.now() return value and number value readout over a websocket, so I coded my own. And made it free.
Requires Node.js and the heartrate library (which uses noble internally). I've only tested this on Linux, if you can get this working under Windows, then great!
## Installation
1. Clone the repository
2. Run `npm i` in the same directory as `package.json`
3. Rename `settings.json.example` to `settings.json` and modify it to your liking
4. Run `node main.js`. If you're on Linux, you may need to run it as root or use the instructions provided [here](https://github.com/noble/noble#running-without-rootsudo).
## Websocket
This script outputs data over a websocket whenever the device reads data, formatted as JSON:
```json
{
	"heartrate": 90,
	"ts": 1680709755531,
	"battery": 100
}
```
`initial` will be present in received data once the websocket connection is established.
## Notes
I haven't *extensively* tested the reconnect functions, if something breaks with auto-reconnecting, please let me know!