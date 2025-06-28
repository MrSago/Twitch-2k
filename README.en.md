# Twitch 2k

[Русская версия](README.md)

## About the Extension

Twitch 2k is an extension that unlocks all quality options on the Twitch platform. **The extension also unlocks 2K quality**, allowing you to enjoy broadcasts at the highest possible quality.

The extension works by proxying two requests:

1. `gql.twitch.tv`

2. `usher.ttvnw.net`

With the first one, we obtain the `streamPlaybackAccessToken`, which contains data about the maximum available quality. The second request sends some token data and, as a response, receives unique links for broadcasting each quality option.

## Main Features

- 🔓 Unlock all available quality options on Twitch
- 📺 Access to 2K quality for broadcasts that support it
- 🔧 Option to use both built-in and custom proxy servers

## Developer Mode Installation

To install the extension in developer mode:

1. Download and extract the [extension archive](https://github.com/MrSago/Twitch-2k/releases/latest)
2. Go to the extensions page:
   - Chrome: `chrome://extensions/`
   - Yandex Browser: `browser://extensions/`
   - Opera: `opera://extensions`
3. Enable "Developer mode" (toggle in the top right corner)
4. Click the "Load unpacked extension" button
5. Select the folder with the unpacked extension
6. The extension will be installed and appear in the extensions list

## Usage

1. After installation, click on the extension icon in the toolbar
2. Enable the proxy using the corresponding extension button
3. Open Twitch and enjoy all available quality options
4. If necessary, reload the Twitch tab to apply changes

## Note

The extension requires a working non-Russian proxy server, as a foreign IP is needed to bypass Twitch restrictions. If mine stops working, find another one. The extension does not support authentication, so the proxy server must support anonymous access.

---

The extension icon was taken from [Flaticon](https://www.flaticon.com/free-icon/twitch_3771425?term=twitch&page=1&position=43&origin=search&related_id=3771425)
