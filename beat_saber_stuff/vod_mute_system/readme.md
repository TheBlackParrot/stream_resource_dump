# Beat Saber VOD Audio Mute/Unmute System
I wanted to give the VOD watchers of my Twitch stream some game audio when I could, so I made a system that would automatically toggle on/off the "VOD Audio Track 2" thing in OBS.

## Install
You will need Node.js and BeatSaberPlus's Song Overlay module at the very least.  
Once you have Node.js installed, enter `cmd` in the explorer address bar (or just navigate to the folder in a command prompt/terminal/what-have-you), and run `npm i` to install the pre-requisite libraries (**ws** and **obs-websocket-js**).  
Once Node is ready and you have all of your settings configured, start Beat Saber and start OBS, then run `node main.js` to start the system.

## Interacting with the system
In the **web** folder is a webpage that can interact with the system. Once you're in a map, you'll see both a "SAFE" and an "UNSAFE" button as well as if it's already been flagged or not. "SAFE" means VOD audio will be on, "UNSAFE" means it will be off/muted. You only have to press either button once and it will forever remember your choice.