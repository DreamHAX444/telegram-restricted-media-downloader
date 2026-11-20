# 🚀 Telegram Media Downloader (Super Suite & Batch Pro)

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-3.80--promax-success.svg)](fast_telegram_downloader.user.js)
[![Platform](https://img.shields.io/badge/Platform-Telegram%20Web%20(A%20%7C%20K%20%7C%20Z)-0284c7.svg)](https://web.telegram.org)
[![Userscript](https://img.shields.io/badge/Tampermonkey-Compatible-green.svg)](https://www.tampermonkey.net/)
[![UI/UX Pro Max](https://img.shields.io/badge/Design-UI%2FUX%20Pro%20Max-0ea5e9.svg)](#uiux-design)

A high-performance browser userscript that enables **turbo multi-worker media downloads**, **virtualization-proof batch video queues**, and **unrestricted text/context menu unblocking** on Telegram Web (`web.telegram.org/a/`, `/k/`, and `/z/`), even in private channels with *"Restrict saving content"* enabled.

---

## 🌟 Key Features

### ⚡ 6-Worker MTProto Parallel Range Engine
- Downloads large videos (1.4 GB+) at **10–15+ MB/s** using 6 concurrent HTTP Range workers.
- **Dynamic 512 KB Chunk Negotiation**: Telegram's media server enforces a strict 524,288-byte chunk ceiling. Our engine dynamically negotiates chunk bounds, eliminating null-byte gaps and fixing the corrupt `00000020 ftypisom` video playback error.
- **100% Byte-Integrity Verification**: Enforces strict byte-equality checks before committing files to disk.

### 🎯 Virtualization-Proof Batch Video Selection
- **Distinct 4-Sided Card Outlines**: Enters selection mode with crisp, unmistakable dashed cyan outlines (`rgba(56, 189, 248, 0.45)`) around all video messages.
- **Anti-Nesting Container Deduplication**: Distinguishes outer message nodes from inner bubbles, preventing duplicate counts (e.g. 8 selected when there are only 4 videos).
- **Virtual List Resilience**: Pre-captures video URLs, document IDs, and lecture titles into memory upon selection. Even if Telegram's virtual list unmounts offscreen DOM nodes when you scroll through 50+ messages, all selected items remain safely queued for download.

### 📋 Interactive Queue Manager Popup
- **Live Progress & Tabular Telemetry**: Real-time download percentage, MB/s transfer speed, and ETA countdown using tabular monospace numerals (no layout jitter).
- **Interactive Queue Pill**: Click the `(N in queue ▾)` badge on the toast to open the sleek floating Queue Manager modal.
- **Active Download Controls**: View the currently downloading video with a live pulsing indicator and an instant **Skip** button.
- **Granular Queue Management**: See all upcoming videos in sequence (`#1`, `#2`, `#3`...) and remove any specific video with an individual `✕` button without canceling the entire batch.
- **Clear Waiting**: Discard pending queue items in one click while letting the current download finish cleanly.

### 🔓 Full Text Selection & Context Menu Unblocker
- Eliminates `user-select: none` CSS locks in restricted channels.
- Intercepts and neutralizes `copy`, `contextmenu`, `selectstart`, and `dragstart` event blockers.
- Allows you to freely select, copy, and right-click text and lecture notes across all Telegram Web versions.

### 🎨 UI/UX Pro Max Obsidian Glass Design
- Built following the **UI/UX Pro Max** modern dark design system.
- Rich dark obsidian glass surface (`rgba(15, 23, 42, 0.94)`) with 20px backdrop blur (`backdrop-filter: blur(20px)`).
- Telegram electric sky-blue accents (`#0284c7`, `#38bdf8`) with emerald green completion indicators.
- Pure Phosphor-inspired SVG vector strokes (zero unstandardized emojis).

---

## 📦 Installation

### Step 1: Install a Userscript Manager
If you don't already have one, install one of the following browser extensions:
- [Tampermonkey](https://www.tampermonkey.net/) (Recommended for Chrome, Brave, Edge, Firefox)
- [Violentmonkey](https://violentmonkey.github.io/)

### Step 2: Install the Script
1. Open your userscript manager dashboard (e.g., click the Tampermonkey extension icon -> **Dashboard**).
2. Click the **+** (Create a new script) tab.
3. Delete any default placeholder code.
4. Copy the entire contents of [fast_telegram_downloader.user.js](fast_telegram_downloader.user.js) and paste it into the editor.
5. Save the script (`Ctrl + S` or `Cmd + S`).

### Step 3: Open Telegram Web
Navigate to [web.telegram.org/a/](https://web.telegram.org/a/) or [web.telegram.org/k/](https://web.telegram.org/k/). Refresh the page if you were already on it.

---

## 🖥️ How to Use

### 1. Single Video Download
- Open any video in Telegram Web's fullscreen Media Viewer.
- Look at the top control bar (or top-left controls) — you will see a clean download button.
- Click it to download the video gaplessly to your default `Downloads` folder.

### 2. Batch Multi-Video Download
1. In any Telegram channel or chat, click the **"Select Videos"** pill button at the bottom right.
2. Every video message will immediately display a dashed cyan outline and a circular checkmark badge in the top right corner.
3. Click any video cards you wish to download (or click **"Select All Visible"** on the bottom dock).
4. Click the blue **"Download (N)"** button on the floating dock.
5. All selected videos will be queued and downloaded automatically one by one with live speed and ETA telemetry.

### 3. Managing the Download Queue
- While downloads are running, look at the progress toast at the bottom right.
- Click the **`(N in queue ▾)`** badge.
- A floating modal will open displaying:
  - The currently downloading video with its percentage and a **Skip** button.
  - The ordered list of upcoming videos.
  - A red **`✕`** icon next to each waiting video to remove it from the queue.
  - A **Clear Waiting** button to remove all upcoming videos at once.

---

## 🔬 Technical Architecture & Deep-Dive

### The 512 KB Chunk Boundary Discovery
Telegram's MTProto Web API restricts HTTP Range responses to strictly **512 KB (524,288 bytes)**.
```
Client: Range: bytes=0-4194303 (Requests 4 MB)
Server: HTTP 206 Partial Content
Content-Range: bytes 0-524287/1506279424 (Telegram returns ONLY 512 KB!)
```
When downloaders assume a fixed 4 MB jump, 3.5 MB of every 4 MB block is left unfilled (filled with zeros on NTFS filesystems). This script dynamically inspects the `Content-Range` header of chunk 0:
```javascript
const [start0, end0, totalSize] = rangeMatch.slice(1).map(Number);
const actualPartSize = end0 - start0 + 1; // Negotiates strictly to 524,288 bytes
```
Chunk indexing steps strictly by `actualPartSize`, guaranteeing **100% gapless and uncorrupted MP4 playback**.

### Sequential Batch Ingestion vs. Browser Blocking
Chromium restricts `showSaveFilePicker()` to single user activation gestures and prohibits concurrent modal dialogs. Attempting to loop file pickers rejects items 2 through N. Our script handles batch multi-video downloads via sequential in-memory ArrayBuffer chunks assembled into Blob URLs, passing verified files smoothly to the browser's download manager without dialog interruption.

---

## 📂 Project Structure

```
├── fast_telegram_downloader.user.js   # Production Userscript (v3.80-promax)
├── concepts_brief.md                  # Engineering analysis & TRIZ contradiction brief
├── requirements.txt                   # Optional Python analysis dependencies
├── LICENSE                            # GNU General Public License v3.0
└── README.md                          # Repository documentation
```

---

## 🤝 Contributing

Contributions, bug reports, and suggestions are welcome!
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the **GNU General Public License v3.0** — see the [LICENSE](LICENSE) file for details.
