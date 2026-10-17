# PatrickBot

A WhatsApp bot built on [Baileys](https://github.com/WhiskeySockets/Baileys) (multi-device). It ships with games, a sticker maker, media downloaders, group admin tools and an XP / limit economy, and every command is a small plugin file you can add, edit or delete while the bot is running.

Bot replies are in Indonesian.

> This is an unofficial client. WhatsApp does not allow automated accounts, so use a number you can afford to lose.

## Features

| Category | Commands (examples) |
|---|---|
| Games | `tebakgambar` `tebakkata` `family100` `asahotak` `caklontong` `susunkata` `tekateki` `math` `suit` `tictactoe` `slot` and more |
| Stickers | `stiker` (image / video / URL) · `wm` (change pack name) · `stikermeme` · `ttp1-4` and `attp1-2` (text stickers) · `toimg` · `togif` · `tovideo` |
| Downloaders | `tiktok` `tiktokmp3` · `ytmp3` `ytmp4` `play` · `facebook` · `instagram` (photos, carousels, reels) · links pasted in chat are downloaded automatically |
| Group | `tagall` `hidetag` `kick` `add` `promote` `demote` `linkgroup` `revoke` `pengumuman` |
| XP & limit | `daftar` `levelup` `daily` `weekly` `monthly` `leaderboard` `pay` `buy` |
| Tools | `tts` `translate` `calc` `nulis` `upload` `yts` `tomp3` `tovn` |
| Islamic | `alquran <surah> <ayat>` (with audio) · `asmaulhusna` · `salat <kota>` |
| Fun | `apakah` `kapankah` `siapakah` `jadian` `tod` `bucin` |
| Group utilities | `absen` (attendance) · `mulaivote` (voting) · `setcmd` / `addmsg` (custom commands and saved messages) |
| Owner | `broadcast` `ban` `addprem` `setexif` `update` `>` (eval) `$` (shell) |

Send `.menu` to the bot for the full, categorized list.

## Requirements

| | Needed for |
|---|---|
| [Node.js](https://nodejs.org) **20.12 or newer** | everything |
| [FFmpeg](https://ffmpeg.org) **8.0 or newer** | stickers, audio/video conversion (8.0+ decodes animated stickers) |
| [ImageMagick 7](https://imagemagick.org) | `ttp`, `attp`, `stikermeme`, `nulis`, level-up cards |
| [yt-dlp](https://github.com/yt-dlp/yt-dlp) | YouTube, Facebook and Instagram downloads |
| [MongoDB](https://www.mongodb.com/atlas) (optional) | storing the database in the cloud instead of `database.json` |

All three command-line tools must be on your `PATH`.

```sh
# Windows (scoop)
scoop install ffmpeg imagemagick yt-dlp

# Debian / Ubuntu (yt-dlp from pip is newer than apt's)
sudo apt install ffmpeg imagemagick && pipx install yt-dlp

# macOS
brew install ffmpeg imagemagick yt-dlp
```

## Setup

```sh
git clone https://github.com/aniq12/PatrickBot.git
cd PatrickBot
npm install
cp .env.example .env     # then edit .env
```

`.env` holds everything personal or secret. It is in `.gitignore`, so it never gets committed.

| Variable | |
|---|---|
| `OWNER_NUMBERS` | Your number(s) with country code, comma-separated, e.g. `628123456789`. Owners can use owner commands and receive crash reports. |
| `OWNER_NAME` | Name on the contact card that `.owner` sends. |
| `MONGODB_URI` | Only when you start with `--mongo`. |
| `PAIRING_NUMBER` | Optional: log in with a pairing code instead of a QR code. |
| `DONATION` | Optional: what `.donasi` shows, one item per `\|`. |
| `GROUP_LINK` | Optional: invite link of the bot's group, sent by `.linkgcbot`. |

## Running

```sh
npm start                 # node index.js: restarts the bot automatically if it crashes
npm start -- --mongo      # same, with the database in MongoDB
```

For a server, run it under [pm2](https://pm2.keymetrics.io) instead:

```sh
npm run pm2               # pm2 start main.js --name patrickbot -- --mongo
pm2 logs patrickbot
```

### Logging in

On the first start the bot is not linked yet, and it logs in one of two ways:

- **Pairing code**, if `PAIRING_NUMBER` is set in `.env` (or you pass `--pairing <number>`). The code is printed in the console. On the phone, go to WhatsApp > Linked devices > Link with phone number and enter it.
- **QR code**, if no number is set. It is printed in the console (`pm2 logs` under pm2) and refreshes every ~20 seconds. Scan it from WhatsApp > Linked devices > Link a device.

When you run `node main.js` directly in a terminal with no number set, it also asks for the number, and leaving it empty gives the QR code. The login is saved in `sessions/`. Delete that folder to log in again.

### Options

| Flag | |
|---|---|
| `--mongo` | Store the database in MongoDB (`MONGODB_URI`). |
| `--pairing <number>` | Log in with a pairing code for this number. |
| `--prefix <chars>` | Characters that start a command (default: most symbols, e.g. `.` `/` `!` `#`). |
| `--self` | Only the bot's own number can use commands. |
| `--pconly` / `--gconly` | Only answer in private chats / in groups. |
| `--debug` | Verbose Baileys logs. |

### Instagram

Instagram only serves posts to logged-in users. Log in to a **spare** Instagram account in your browser, export its cookies in Netscape format (e.g. with the *Get cookies.txt LOCALLY* extension) and save the file as `cookies.txt` in the project folder. It is picked up automatically and is git-ignored. Anyone with that file can use the account, so don't use your main one.

## Writing a plugin

Every `.js` file under `plugins/` is a plugin. The bot loads all of them at start and reloads a file as soon as you save it. Subfolders are only for organization; the menu category comes from `handler.tags`.

```js
// plugins/fun/hello.js
let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) throw `Contoh: ${usedPrefix + command} Budi`   // a thrown string is sent as the reply
    await m.reply(`Halo, ${text}!`)
}
handler.help = ['hello <nama>']   // shown in the menu
handler.tags = ['fun']            // menu category
handler.command = /^hello$/i      // what triggers it (regex, string or array)

export default handler
```

Optional flags: `owner`, `rowner` (only the numbers in `OWNER_NUMBERS`), `premium`, `group`, `private`, `admin`, `botAdmin`, `register`, `limit` (costs limit), `level` (minimum level), `exp` (XP gained).

A plugin can also export `all(m)`, which runs on every message, or set `handler.before(m)`, which runs before commands. The files in `plugins/_events/` work this way: auto-download, auto-sticker, game answers and so on.

Plugin file names must be unique across all folders, because plugins are keyed by file name.

## Project layout

```
index.js        starts main.js and restarts it if it crashes
main.js         WhatsApp connection, login, database, plugin loader
handler.js      runs plugins for each incoming message
config.js       global settings (reads .env)
lib/            shared helpers: stickers, ffmpeg/ImageMagick, yt-dlp, uploads, database adapters
plugins/        the commands, one file each, grouped by category
src/            fonts and images used by plugins
```

## Credits

- Based on [games-wabot](https://github.com/BochilGaming/games-wabot) by BochilGaming and contributors
- [Baileys](https://github.com/WhiskeySockets/Baileys) for the WhatsApp Web protocol
- [yt-dlp](https://github.com/yt-dlp/yt-dlp), [tikwm](https://www.tikwm.com), [equran.id](https://equran.id), [catbox.moe](https://catbox.moe) and [BochilTeam/database](https://github.com/BochilTeam/database) (game data)

## License

[GPL-3.0-or-later](LICENSE), the same as the project it is based on. If you distribute a modified version, it must stay under the GPL and include its source.
