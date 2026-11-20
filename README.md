# Fast Telegram Downloader

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Userscript](https://img.shields.io/badge/Tampermonkey-Compatible-green.svg)](https://www.tampermonkey.net/)
[![Platform](https://img.shields.io/badge/Platform-Telegram%20Web%20(A%20%7C%20K%20%7C%20Z)-0284c7.svg)](https://web.telegram.org)

A browser userscript for Telegram Web that downloads restricted videos, accelerates large media transfers through parallel range requests, and lets you queue multiple videos for batch downloading.

Works on `web.telegram.org/a/`, `web.telegram.org/k/`, and `web.telegram.org/z/`.

---

## Why this script exists

Telegram Web restricts media saving and text copying in private channels when channel admins enable the "Restrict saving content" setting. Beyond UI restrictions, downloading large videos directly through the browser often fails or produces unplayable files:

1. **Corrupted MP4 files (`00000020 ftypisom`)**: Standard multi-part download scripts assume a fixed 4 MB chunk size. Telegram servers silently cap individual range responses to 512 KB (524,288 bytes). Any script that jumps ahead by 4 MB leaves 3.5 MB of empty null bytes in every block, corrupting the video container.
2. **Browser batch limitations**: Chromium browsers block multiple file save dialogs from firing in a loop, terminating batch downloads after the first file.
3. **Virtual DOM message recycling**: When scrolling through chat history in Telegram Web, offscreen message elements are unmounted from the DOM. Typical selection tools lose track of selected videos as soon as you scroll away.

This script addresses all three issues directly.

---

## What the script does

- **Parallel chunk engine**: Uses 6 concurrent HTTP Range workers. It inspects the initial response header, locks onto Telegram's 512 KB chunk ceiling, and verifies total byte count before saving.
- **Batch video selection**: Lets you click to select multiple videos in a chat, keeping them in an in-memory registry so scrolling never drops selections.
- **Queue manager**: Downloads videos sequentially in the background. Shows transfer speed, progress percentage, and estimated time remaining. Includes a popup to inspect the queue, skip the active video, or remove pending items.
- **Unblocks text and menus**: Removes CSS `user-select: none` locks and intercepts script listeners that block right-clicking, text selection, and copying.

---

## Installation

### Prerequisites

You need a userscript manager extension installed in your browser:

- **Chrome, Brave, Edge**: [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) or [Violentmonkey](https://violentmonkey.github.io/)
- **Firefox**: [Tampermonkey](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)

### Setup steps

1. Click the Tampermonkey icon in your browser toolbar and select **Dashboard**.
2. Click the **+** (Add a new script) tab.
3. Remove any template code present in the editor.
4. Open [fast_telegram_downloader.user.js](fast_telegram_downloader.user.js), copy the full code, and paste it into the Tampermonkey editor.
5. Press `Ctrl + S` (or `Cmd + S` on macOS) to save.
6. Open or reload [web.telegram.org/a/](https://web.telegram.org/a/) or [web.telegram.org/k/](https://web.telegram.org/k/).

---

## Step-by-step user guide

### 1. Downloading a single video

1. Open any chat or channel and click on a video to launch Telegram's built-in media viewer.
2. Look at the top control bar. You will see a blue download button added by the script.
3. Click the button. A progress toast will appear in the bottom-right corner showing download speed and percentage.
4. When the transfer finishes, the file is saved automatically to your default browser downloads folder.

### 2. Downloading multiple videos (Batch mode)

1. Open the chat containing the videos you want to download.
2. In the bottom-right corner of the window, click the floating **Select Videos** button.
3. The interface enters selection mode:
   - All video messages in the chat will display a dashed cyan outline.
   - A selection dock will appear at the bottom of the screen.
4. Click on each video card you want to download. A checkmark badge appears on selected items.
   - You can scroll freely through the chat to select older videos. Items you picked earlier will stay selected even when they scroll out of view.
   - To select all currently visible videos at once, click **Select All Visible** on the bottom dock.
5. Click the blue **Download (N)** button on the dock.
6. The script queues all selected videos and begins downloading them one by one.

> **Important note for first-time batch users:**
> When the second video in a batch begins downloading, your browser may ask for permission:
> *"web.telegram.org wants to download multiple files"*
> Click **Allow**. If you block or ignore this, your browser will stop subsequent downloads.

### 3. Managing the download queue

While a download is active, a status toast appears in the bottom-right corner.

1. Click the queue badge on the toast (for example, `(3 in queue)`).
2. The Queue Manager window opens:
   - **Active download**: Displays the title, progress bar, current speed, and a **Skip** button. Clicking Skip aborts the active file and moves immediately to the next item in line.
   - **Upcoming list**: Lists all pending videos in order (`#1`, `#2`, `#3`...).
   - **Individual item removal**: Click the red **x** button beside any waiting item to remove it from the queue without affecting other files.
   - **Clear Waiting**: Click this button at the top of the queue list to cancel all pending items at once while allowing the currently downloading file to finish.
3. Click the **x** in the top-right corner of the modal (or click anywhere outside it) to close the window.

### 4. Copying text in restricted channels

In channels where text selection is disabled:
- Simply highlight any text using your mouse cursor as normal.
- Press `Ctrl + C` (or right-click and select **Copy**).
- Right-click context menus are fully restored across all chat messages.

---

## Technical details

### Dynamic 512 KB chunk negotiation

Telegram's web media endpoints enforce a strict 512 KB chunk limit per HTTP Range request. If a client sends:

```http
Range: bytes=0-4194303
```

The server returns:

```http
HTTP/2 206 Partial Content
Content-Range: bytes 0-524287/1506279424
```

The response contains only 524,288 bytes despite the larger request. The script evaluates chunk 0 dynamically:

```javascript
const [start0, end0, totalSize] = rangeMatch.slice(1).map(Number);
const actualPartSize = end0 - start0 + 1; // Evaluates strictly to 524,288 bytes
```

All subsequent worker offsets step forward by `actualPartSize` instead of an assumed static buffer size. This ensures no unwritten sectors occur in the final assembled binary.

### Browser download automation

Chromium enforces security rules that prevent scripts from triggering multiple `showSaveFilePicker()` dialogs consecutively without fresh user clicks.

This script downloads chunks directly into memory, builds a single verified `Blob`, and uses standard object URL anchor triggers. This allows the background queue to download ten or more files in sequence without requiring manual confirmation for every individual video.

### Virtual DOM resilience

Telegram Web uses virtualized scrolling: messages that leave the viewport are removed from the DOM to conserve browser memory.

When you click a video in batch selection mode, the script extracts its media URL, document identifier, and title immediately into an in-memory `Map`. When you trigger the download, the queue reads from this map rather than querying DOM nodes, preventing lost items during long scroll operations.

---

## Troubleshooting

### Downloads stop after the first file
Your browser blocked automatic multi-file downloads.
- Look at the right side of the browser address bar for a blocked download icon.
- Click it, select **Always allow web.telegram.org to download multiple files**, and click **Done**.
- Alternatively, go to browser settings: `Settings -> Privacy and Security -> Site Settings -> web.telegram.org -> Automatic downloads -> Allow`.

### Download fails or stalls halfway
If your network connection drops or Telegram rate-limits requests:
- Open the Queue Manager and click **Skip** to move to the next file.
- If downloads consistently stall, refresh the Telegram Web tab (`Ctrl + F5`) and restart the batch.

### Where are downloaded videos stored?
Files are handled directly by your browser and saved to your default `Downloads` directory (or the folder configured in your browser settings).

### Does this work on Telegram Desktop or mobile apps?
No. This is a userscript specifically built for web browsers running Telegram Web (`web.telegram.org/a/`, `/k/`, or `/z/`).

---

## Project structure

```
├── fast_telegram_downloader.user.js   # Main userscript file (v3.80-promax)
├── concepts_brief.md                  # MTProto range negotiation & TRIZ analysis
├── requirements.txt                   # Optional Python analysis tools
├── LICENSE                            # GNU General Public License v3.0
└── README.md                          # Documentation
```

---

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).
