# How to use (OBS)
To use my chat overlay in your own stream layout:
1. In a web browser, navigate to [your Twitch Developer Console](https://dev.twitch.tv/console)
2. Press the **"Register Your Application"** button, give it a name, set the OAuth Redirect URL to `http://localhost` (this doesn't use it), and set the category to *"Chat Bot"*. Click the **"Create"** button.
3. In [your list of Developer Applications](https://dev.twitch.tv/console/apps), click the **"Manage"** button on the application you just registered and note down the text in the *"Client ID"* field. Click the **"New Secret"** button, and also note down the code you receive.
4. In OBS, add a new Browser Source.
5. In the URL/address field: enter `http://theblackparrot.me/overlays/chat?clientID=[your client ID key here]&clientSecret=[your client secret key here]&channel=[your channel name here]` and press OK
6. Re-open the browser source you just added and remove `clientID=[your client ID key here]&clientSecret=[your client secret key here]&` from the URL. It should now just read `http://theblackparrot.me/overlays/chat?channel=[your channel name here]`.

Client IDs and client secrets are stored in the LocalStorage for the page after you set them, allowing you to clear them from the URL for security purposes if you desire. All cached data is also kept in LocalStorage.

Pronoun display fetches data from the [Twitch Chat Pronouns](https://pronouns.alejo.io) service.

If you wish to add more fonts, I've provided a nodejs script I use to automatically extract any downloaded font packages/zips from Google Fonts and generate JSON and CSS files. The script probably requires some tinkering for your own local setup. It is also probably not the prettiest/most efficient script (sorry in advance).

Settings page is available [here](http://theblackparrot.me/overlays/chat/previewer)