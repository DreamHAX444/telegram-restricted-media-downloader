# Selective Telegram Channel Video Downloader

* **Author:** ZNS
* **Date:** 2026-11-20

## Overview

A local terminal utility designed to selectively download video files from user-authorized Telegram channels that have client-side save restrictions (`restrict_saving_content`). The tool bridges an authenticated browser session into an MTProto client engine, indexes the full message history across the target channel without rendering DOM elements, presents an interactive search-and-checkbox terminal selector, and streams selected videos directly to local disk with chunk-level resumption across large (30-40+ GB) batches.

## Analysis

### 1. Contrarian & Code Minimization (YAGNI)
Writing a custom browser extension or automated browser scraper to extract 30-40+ GB of video introduces unnecessary complexity. Telegram Web A virtualizes DOM nodes, meaning messages only load into memory when scrolled into view. Rebuilding an entire virtual-scroll scraper and in-browser blob assembler reinvents what MTProto client libraries (`Telethon`, `Pyrogram`, or `gramjs`) already provide natively. Existing MTProto libraries handle media chunking, protocol encryption, parallel data center connections, and direct disk streaming out of the box.

### 2. Inventive Catalyst (Contradiction Elimination)
* **Core Contradiction:** The user wants to avoid generating Telegram API credentials (`api_id` and `api_hash` from `my.telegram.org`) or entering SMS verification codes, preferring to use their existing browser login. However, accessing Telegram Web's session storage directly from an external process requires parsing Chromium's internal LevelDB IndexedDB files on disk, which are locked while the browser runs and subject to breaking format changes across Chromium releases.
* **Inventive Resolution (Intermediary Injection):** Rather than reading locked binary files from the OS filesystem, provide a minimal JavaScript snippet executed once in the browser DevTools Console. The snippet reads the active MTProto auth key and DC parameters directly via the browser's own standard IndexedDB API and exports a compact session string. The CLI tool accepts this session string directly. This eliminates disk locks, browser shutdown requirements, and external credential generation.

### 3. Economics, Quotas & Network Throttling
* **FloodWait Handling:** Telegram enforces rate limits (`FLOOD_WAIT_X`) on media chunk requests. Pulling 30-40+ GB across dozens of files risks temporary IP or account throttling if requests are dispatched in unthrottled bursts.
* **Throughput Optimization:** File chunks must be requested sequentially per file with controlled concurrency (e.g., maximum 2-3 parallel chunk streams across multi-DC connections) and an automatic exponential backoff handler when Telegram returns `FloodWaitError`.

### 4. UX & Developer Ergonomics
* **Terminal Selector:** Given dozens or hundreds of videos in channel history, a flat prompt is unusable. The interface requires an interactive terminal UI (TUI) with real-time text filtering (by caption, date, or filename), multi-select checkboxes, selection inversion, and total payload size calculation prior to confirming the download queue.
* **Progress Telemetry:** Active downloads must display visual metrics: per-file transfer rate (MB/s), elapsed time, ETA, downloaded vs total byte count, and overall queue completion.

### 5. Observability, State Management & Resumption
* **Failure Modes:** In a 30-40+ GB batch, network drops, socket timeouts, and process terminations are inevitable.
* **State Ledger:** The tool must manage download state via a lightweight local SQLite database or state file (`downloads.db`). Each record tracks `message_id`, `file_id`, `file_name`, `total_bytes`, `downloaded_bytes`, and `status` (`pending`, `downloading`, `completed`, `failed`). Partially downloaded files write to a temporary `.part` file, enabling byte-exact resumption (`Range` request equivalent in MTProto) without redownloading completed segments.

### 6. Long-Term Tech Debt & Maintenance
* Decoupling the downloading engine from Telegram Web's front-end DOM prevents breakage when Telegram updates its Web A or Web K user interfaces. Relying exclusively on standard MTProto specifications ensures longevity across client UI revisions.

## Goals vs. Non-Goals

* **In-Scope Goals:**
  * One-step session extraction from active Telegram Web browser session into CLI-compatible MTProto session format.
  * Comprehensive indexing of all video/document messages in a specified channel without DOM rendering.
  * Interactive terminal-based search and multi-select checkbox UI.
  * Resumable chunked file streaming directly to disk with temporary `.part` buffering.
  * Local state tracking to avoid re-downloading previously acquired files.
  * Automatic rate limit and `FloodWait` handling.

* **Out-of-Scope Non-Goals:**
  * Bypassing channel authorization (the user must already be an authorized member in the target channel).
  * In-browser DOM automation, scrolling emulation, or browser-based blob assembly.
  * Standalone graphical desktop interface (GUI).
  * Video transcode, re-encoding, or post-processing.

## Alternatives Weighed

* **Browser DOM Virtual-Scroll Scraper (Tampermonkey / Puppeteer from scratch):**
  * *Rejected by author:* Writing an in-browser scraper from scratch is redundant when battle-tested userscripts exist.
* **Direct Chromium LevelDB Disk Extraction:**
  * *Rejected by author:* Reading IndexedDB LevelDB files from disk while Chrome/Edge is running fails due to OS file lock conflicts (`LOCK` file on LevelDB directory), and parsing raw LevelDB records without Chromium's native engine is brittle.
* **Hosted Telegram Forwarder Bots (e.g., Save-Restricted-Content-Bot-v3):**
  * *Rejected by author:* Heavy infrastructure footprint requiring a separate MongoDB instance, `@BotFather` bot token, and server deployment. Re-uploads downloaded media back to Telegram chat instead of saving to local disk, consuming double bandwidth on 30-40+ GB batches and lacking an interactive local terminal selector.
* **Verified Browser Media Downloader with File System Access API (Telegram Media Downloader / SakerLy):**
  * *Selected:* Executes directly within the authenticated browser session (`web.telegram.org/a/`), requires zero API keys or external server setup, provides an in-page visual selection mode (`Ctrl+Shift+M`) with checkboxes and range selection, and streams videos directly to a local disk folder using the Chromium File System Access API.

## Key Decisions & Staging for Next Steps

1. **Core Language & Engine:** Python 3 with `Telethon` (or `Pyrogram`), utilizing standard asynchronous I/O (`asyncio`) for network throughput and disk writes.
2. **Session Extraction Path:** A lightweight browser console snippet to export the active GramJS/Web session key into a transferable session string.
3. **Selector Interface:** Interactive terminal selection powered by `questionary` or `textual`.
4. **Resumption & Storage:** Temporary `.part` files with an SQLite state database (`downloads.db`) recording progress and message metadata.
