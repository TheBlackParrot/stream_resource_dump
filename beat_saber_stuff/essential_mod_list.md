# Essential Beat Saber Mod List
Writing this up to send an essential list of mods to use for people new to the game or new to streaming the game.

## Setup/pre-requisites
You should *probably* use a mod manager/launcher like [BSManager](https://github.com/Zagrios/bs-manager/releases) to make managing different installs of the game easier. Game updates can break mods, and having different versions of the game separated will make your Beat Saber experience much smoother. It is not required if you want to do things manually, although this assumes you're going to use BSManager.

At the time of writing, I recommend using the latest version of Beat Saber v1.40.x, which is currently v1.40.7. 

## General
- **BeatSaverUpdater**
  - This will automatically check for community map updates, and notify you with an icon in the corner of the map selection menu.
- **PlaylistManager**
  - Essential mod for sorting through your (eventual) map collection in-game.
- the **Heck** suite: **AudioLink, Chroma, CustomJSONData, Heck, LookupID, NoodleExtensions, and Vivify**
  - Many community maps use one (or more) of these mapping extension mods, some even *require* them.
- **MappingExtensions**
  - Not used much now-a-days, but this was an older mapping extension mod. Many older maps used this.
- **DiTails**
  - Turns the cover image in the map selection menu into a clickable button, which shows you more details about the selected map in a popup dialog.
- **BetterSongList**
  - Gives more functionality to the map selection list, including filters and sorting methods.
- **BetterSongSearch**
  - Gives you the ability to search for community maps in-game
- **GottaGoFast**
  - Shortens the fade transitions between game scenes, overall making the game feel snappier
- **EasyOffset**
  - Gives a more visual approach to configuring controller offsets
- **HitsoundTweaks**
  - Fixes a few base-game sound bugs you're likely to encounter at some point
- **SmoothedController**
  - https://github.com/kinsi55/BeatSaber_SmoothedController/releases
  - Averages out your controller position and rotation while in the menus, making it easier to use the smaller parts of the UI
  
## Streaming-specific
### Request managers
- **BeatSaberPlus**
  - https://github.com/hardcpp/BeatSaberPlus/releases
  - This is the most commonly used request manager, also comes with a slew of other optional tools/tweaks
    - Paid version has some extra benefits, including native YouTube Live support
- **SongRequestManager**
  - https://github.com/denpadokei/SongRequestManagerV2/releases
  - The oldest request manager, has optional integration with Streamer.bot
- **Cherry**
  - https://github.com/whatdahopper/Cherry/releases
  - The lightest request manager, essentially just has the essentials
- **DumbRequestManager**
  - https://github.com/TheBlackParrot/DumbRequestManager/releases  
  *(Disclaimer: this is my own mod)*
  - The request manager for tinkerers, completely relies on external streaming bot software to function

### Avatar rendering
A lot of people stream the game with an avatar, of which there are multiple ways to do it. Most people now-a-days use in-game mods to render avatars, but LIV (listed below) is a good option for newcomers.
#### In-game rendering
- **NalulunaAvatars**
  - https://nalulululuna.fanbox.cc/posts/2079749
  - This is the most commonly used in-game avatar mod, and overall the most common way of rendering an avatar.
    - Free version blocks full body tracking, only half body
    - Requires a VRM-formatted avatar
- **CustomAvatars**
  - https://github.com/nicoco007/BeatSaberCustomAvatars
  - The avatar mod for tinkerers, requires some knowledge of Unity to get avatars set up
    - Uses its own avatar format, no VRM needed
#### External rendering
- **LIV**
  - https://store.steampowered.com/app/755540/LIV
  - Probably the easiest option, also has cross-compatibility with multiple other games
    - Supports both CustomAvatars-formatted and VRM-formatted avatars
- **VNyan**
  - https://suvidriel.itch.io/vnyan
  - Usually a desktop VTubing program, but has added SteamVR tracking support in a recent update. Great for tinkerers.
    - Supports VRM-formatted and VSFAvatar-formatted avatars