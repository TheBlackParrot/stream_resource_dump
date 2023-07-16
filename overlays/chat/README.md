# How to use (OBS)
To use my chat overlay in your own stream layout:
1. In OBS, add a new Browser Source.
2. In the URL/address field: enter `http://theblackparrot.me/overlays/chat` and press OK.
3. Add another Browser Source, *OR* add a Browser Dock through the *Tools* menu in OBS's top menu bar.
4. In the URL/address field: enter `http://theblackparrot.me/overlays/chat/settings` and press OK. Interacting with this browser source will allow you to configure the chat overlay to your liking.
5. In a web browser, navigate to [your Twitch Developer Console](https://dev.twitch.tv/console)
6. Press the **"Register Your Application"** button, give it a name, set the OAuth Redirect URL to `http://localhost` (this doesn't use it), and set the category to *"Chat Bot"*. Click the **"Create"** button.
7. In [your list of Developer Applications](https://dev.twitch.tv/console/apps), click the **"Manage"** button on the application you just registered and copy the text in the *"Client ID"* field to the *"App client ID"* field on the settings source. Click the **"New Secret"** button, and also do the same for the *"App client secret"* field.

All saved/cached data is stored in LocalStorage for the page after you set them.

Pronoun display fetches data from the [Twitch Chat Pronouns](https://pronouns.alejo.io) service.

If you wish to add more fonts, I've provided a nodejs script I use to automatically extract any downloaded font packages/zips from Google Fonts and generate JSON and CSS files. The script probably requires some tinkering for your own local setup. It is also probably not the prettiest/most efficient script (sorry in advance).

Settings page for user customizations is available [here](http://theblackparrot.me/overlays/chat/previewer)