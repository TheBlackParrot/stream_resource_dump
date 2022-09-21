This is merely a code dump in case someone wants to look through what I'm doing for my overlays, it's easier than trying to crawl addresses and whatever.

To use the overlay I use currently:
- Add a browser source in OBS
- Set that browser source's URL to 
  - `http://theblackparrot.me/bs_overlays/5/songInfo` for information on the song you're currently playing.
  - `http://theblackparrot.me/bs_overlays/5/gameInfo` for statistics on how you're doing as you're playing. If you want ScoreSaber personal bests to show up above your accuracy, add `?name=yournamehere` to the end of this URL.

Both overlays have settings available in `vars.js` in their respective folders. Check those for details on changing things around. It's all URL GET parameter based, sorry!