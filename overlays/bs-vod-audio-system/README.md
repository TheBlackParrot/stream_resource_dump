# Beat Saber VOD Audio System
I wanted to give the VOD watchers of my Twitch stream some game audio when I could, so I made a system that would automatically toggle on/off the "VOD Audio Track 2" thing in OBS.

*This is "version 2" of the system, the first version ran on an external Node.js script, but this is now all contained within a browser page.*

## How to use
You will need BeatSaberPlus's Song Overlay module installed, as well as making sure the OBS websocket plugin is configured. OBS <= 28 users can download the 5.x version of the plugin from OBS's plugin repository. OBS >= 29 users should have it by default.  
Add a Browser source with the URL field pointing to <https://theblackparrot.me/overlays/bs-vod-audio>, or add a browser dock with the same URL.  
To configure it, you need the settings panel that controls all of my overlays: <https://theblackparrot.me/overlays/chat/settings>. Add this as a browser source, or browser dock, as well.

## Interacting with the system
Once you're in a map, you'll see both a "Flag SAFE" and a "Flag UNSAFE" button as well as if it's already been flagged or not. "SAFE" means VOD audio will be on, "UNSAFE" means it will be off/muted. You only have to press either button once and it will forever remember your choice. It's set up by default to mute on unknowns, but this can be configured to remain unmuted.

# HEADS UP
Always do your own research when it comes to this stuff. I provide my own list of hashes as a default database to sync from in the settings. I can get things wrong, none of that list is automated. If you use only that list and something gets muted, please let me know ASAP and I'll try to fix it when I can.