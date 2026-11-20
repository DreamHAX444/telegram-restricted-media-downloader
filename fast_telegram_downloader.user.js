// ==UserScript==
// @name         Telegram Media Downloader (Untangled & UI/UX Pro Max)
// @name:en      Telegram Media Downloader (Untangled & UI/UX Pro Max)
// @version      3.80-promax
// @namespace    https://github.com/Neet-Nestor/Telegram-Media-Downloader
// @description  Streamlined architecture, reactive queue manager, unmistakable card outlines, 6-worker gapless MTProto downloads, tabular live ETA, and unrestricted text selection.
// @author       Nestor Qin & Refined Design
// @license      GNU GPLv3
// @match        https://web.telegram.org/*
// @match        https://webk.telegram.org/*
// @match        https://webz.telegram.org/*
// @icon         https://img.icons8.com/color/452/telegram-app--v5.png
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // 1. Unblock text selection and right-click context menu
  const enableTextSelection = () => {
    const allow = (e) => e.stopImmediatePropagation();
    ["selectstart", "copy", "contextmenu", "dragstart"].forEach((evt) => {
      window.addEventListener(evt, allow, true);
      document.addEventListener(evt, allow, true);
    });

    const style = document.createElement("style");
    style.id = "tel-promax-theme-style";
    style.textContent = `
      :root {
        --tel-font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif;
        --tel-font-mono: ui-monospace, "SF Mono", "JetBrains Mono", Consolas, monospace;
        --tel-bg-glass: rgba(15, 23, 42, 0.94);
        --tel-border: rgba(255, 255, 255, 0.12);
        --tel-primary: #0284c7;
        --tel-primary-hover: #0ea5e9;
        --tel-accent-cyan: #38bdf8;
        --tel-success: #10b981;
        --tel-danger: #ef4444;
        --tel-text: #f8fafc;
        --tel-text-muted: #94a3b8;
      }

      *, .text-content, .message, .bubble, .Message, [class*='message'], [class*='bubble'] {
        -webkit-user-select: text !important;
        user-select: text !important;
      }
      ::selection {
        background: rgba(56, 189, 248, 0.3) !important;
        color: inherit !important;
      }

      #tel-native-select-btn {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 99999;
        background: var(--tel-bg-glass);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        color: var(--tel-text);
        border: 1px solid rgba(56, 189, 248, 0.28);
        border-radius: 9999px;
        padding: 9px 18px;
        font: 600 13px var(--tel-font-sans);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 10px 25px -4px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(255, 255, 255, 0.08) inset;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        user-select: none;
      }
      #tel-native-select-btn:hover {
        transform: translateY(-2px);
        border-color: var(--tel-accent-cyan);
        background: rgba(15, 23, 42, 0.98);
        box-shadow: 0 14px 28px -4px rgba(0, 0, 0, 0.6), 0 0 14px rgba(56, 189, 248, 0.25);
      }
      #tel-native-select-btn:active {
        transform: translateY(0);
      }
      #tel-native-select-btn.active {
        background: rgba(30, 15, 20, 0.94);
        border-color: rgba(239, 68, 68, 0.5);
        color: #fca5a5;
      }
      #tel-native-select-btn.active:hover {
        border-color: var(--tel-danger);
        color: #ffffff;
        box-shadow: 0 12px 28px -4px rgba(239, 68, 68, 0.35);
      }

      body.tel-selecting-mode .tel-video-bubble {
        position: relative !important;
        cursor: pointer !important;
        outline: 2px dashed rgba(56, 189, 248, 0.45) !important;
        outline-offset: 4px !important;
        border-radius: 12px !important;
        transition: outline 0.16s ease, background 0.16s ease, box-shadow 0.16s ease !important;
      }
      body.tel-selecting-mode .tel-video-bubble:hover {
        outline: 2px solid var(--tel-accent-cyan) !important;
        background: rgba(56, 189, 248, 0.08) !important;
      }
      body.tel-selecting-mode .tel-video-bubble.tel-msg-selected {
        outline: 2.5px solid var(--tel-primary) !important;
        outline-offset: 4px !important;
        background: rgba(2, 132, 199, 0.16) !important;
        box-shadow: 0 0 16px rgba(2, 132, 199, 0.3) !important;
      }

      .tel-native-checkbox {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 1.5px solid rgba(255, 255, 255, 0.6);
        background: rgba(15, 23, 42, 0.85);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
        display: none;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 50;
        transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), background 0.18s, border-color 0.18s;
      }
      body.tel-selecting-mode .tel-native-checkbox {
        display: flex;
      }
      .tel-msg-selected .tel-native-checkbox {
        background: var(--tel-primary);
        border-color: var(--tel-accent-cyan);
        transform: scale(1.08);
        box-shadow: 0 0 10px rgba(14, 165, 233, 0.4);
      }
      .tel-native-checkbox svg {
        opacity: 0;
        transform: scale(0.6);
        transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .tel-msg-selected .tel-native-checkbox svg {
        opacity: 1;
        transform: scale(1);
      }

      #tel-native-action-bar {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%) translateY(24px);
        opacity: 0;
        z-index: 99999;
        background: rgba(15, 23, 42, 0.92);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        color: var(--tel-text);
        border: 1px solid var(--tel-border);
        border-radius: 14px;
        padding: 7px 14px 7px 18px;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 20px 40px -8px rgba(0, 0, 0, 0.65), 0 0 1px 1px rgba(255, 255, 255, 0.08);
        font: 500 13px var(--tel-font-sans);
        transition: all 0.24s cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: none;
        user-select: none;
      }
      #tel-native-action-bar.visible {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
        pointer-events: auto;
      }
      .tel-native-bar-count {
        font-weight: 600;
        color: var(--tel-accent-cyan);
        font-size: 13px;
        letter-spacing: -0.2px;
      }
      .tel-native-divider {
        width: 1px;
        height: 18px;
        background: var(--tel-border);
      }
      .tel-native-btn-link {
        background: transparent;
        color: var(--tel-text-muted);
        border: none;
        font: 500 12.5px var(--tel-font-sans);
        cursor: pointer;
        padding: 6px 10px;
        border-radius: 8px;
        transition: all 0.15s ease;
      }
      .tel-native-btn-link:hover {
        color: var(--tel-text);
        background: rgba(255, 255, 255, 0.08);
      }
      .tel-native-btn {
        background: var(--tel-primary);
        color: #ffffff;
        border: none;
        border-radius: 8px;
        padding: 7px 16px;
        font: 600 13px var(--tel-font-sans);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);
        transition: all 0.16s ease;
      }
      .tel-native-btn:hover:not(:disabled) {
        background: var(--tel-primary-hover);
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(14, 165, 233, 0.45);
      }
      .tel-native-btn:active:not(:disabled) {
        transform: translateY(0);
      }
      .tel-native-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        box-shadow: none;
        background: #334155;
        color: var(--tel-text-muted);
      }

      #tel-download-toast {
        position: fixed;
        bottom: 78px;
        right: 24px;
        z-index: 99999;
        background: var(--tel-bg-glass);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        color: var(--tel-text);
        border: 1px solid var(--tel-border);
        border-radius: 14px;
        padding: 12px 16px;
        min-width: 310px;
        max-width: 420px;
        box-shadow: 0 20px 40px -8px rgba(0, 0, 0, 0.65), 0 0 1px 1px rgba(255, 255, 255, 0.08);
        font: 12.5px var(--tel-font-sans);
        display: none;
        user-select: none;
      }
      #tel-download-toast.visible {
        display: block;
        animation: tel-toast-in 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes tel-toast-in {
        from { opacity: 0; transform: translateY(12px) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .tel-toast-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        gap: 12px;
      }
      .tel-toast-title {
        font-weight: 600;
        color: #f1f5f9;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        letter-spacing: -0.2px;
      }
      .tel-toast-close {
        background: transparent;
        color: var(--tel-text-muted);
        border: none;
        cursor: pointer;
        padding: 3px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
      }
      .tel-toast-close:hover {
        color: var(--tel-danger);
        background: rgba(239, 68, 68, 0.14);
      }
      .tel-toast-bar {
        height: 4px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 9999px;
        overflow: hidden;
        margin-bottom: 6px;
      }
      .tel-toast-bar > div {
        height: 100%;
        background: linear-gradient(90deg, var(--tel-primary), var(--tel-accent-cyan));
        border-radius: 9999px;
        width: 0%;
        transition: width 0.15s linear;
      }
      .tel-toast-bar.completed > div {
        background: var(--tel-success);
      }
      .tel-toast-meta {
        color: var(--tel-text-muted);
        font-size: 11.5px;
        font-family: var(--tel-font-mono);
        font-variant-numeric: tabular-nums;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .tel-queue-badge {
        background: rgba(56, 189, 248, 0.14);
        border: 1px solid rgba(56, 189, 248, 0.32);
        color: var(--tel-accent-cyan);
        border-radius: 9999px;
        padding: 2px 8px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        transition: all 0.15s ease;
      }
      .tel-queue-badge:hover {
        background: rgba(56, 189, 248, 0.25);
        border-color: var(--tel-accent-cyan);
        transform: translateY(-1px);
        color: #ffffff;
      }

      #tel-queue-modal {
        position: fixed;
        bottom: 154px;
        right: 24px;
        z-index: 100000;
        width: 360px;
        max-height: 420px;
        background: rgba(15, 23, 42, 0.96);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 16px;
        box-shadow: 0 24px 48px -8px rgba(0, 0, 0, 0.75), 0 0 1px 1px rgba(255, 255, 255, 0.1);
        font: 12.5px var(--tel-font-sans);
        color: var(--tel-text);
        display: none;
        flex-direction: column;
        overflow: hidden;
        user-select: none;
        animation: tel-modal-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      }
      #tel-queue-modal.visible {
        display: flex;
      }
      .tel-queue-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      .tel-queue-header-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .tel-queue-title {
        font-weight: 600;
        font-size: 13px;
        color: var(--tel-text);
      }
      .tel-queue-count-badge {
        font-size: 11px;
        font-weight: 600;
        color: var(--tel-accent-cyan);
        background: rgba(56, 189, 248, 0.15);
        padding: 2px 7px;
        border-radius: 9999px;
      }
      .tel-queue-header-right {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .tel-queue-text-btn {
        font-size: 11.5px;
        color: var(--tel-text-muted);
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 6px;
        transition: all 0.15s;
      }
      .tel-queue-text-btn:hover {
        color: var(--tel-danger);
        background: rgba(239, 68, 68, 0.12);
      }
      .tel-queue-icon-btn {
        background: transparent;
        color: var(--tel-text-muted);
        border: none;
        cursor: pointer;
        padding: 4px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s;
      }
      .tel-queue-icon-btn:hover {
        color: var(--tel-text);
        background: rgba(255, 255, 255, 0.1);
      }
      .tel-queue-body {
        overflow-y: auto;
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-height: 350px;
      }
      .tel-queue-body::-webkit-scrollbar {
        width: 5px;
      }
      .tel-queue-body::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
      }
      .tel-queue-section-label {
        font-size: 10.5px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--tel-text-muted);
        margin-bottom: 4px;
      }
      .tel-queue-active-card {
        background: rgba(2, 132, 199, 0.12);
        border: 1px solid rgba(56, 189, 248, 0.3);
        border-radius: 10px;
        padding: 9px 12px;
      }
      .tel-queue-card-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
      }
      .tel-queue-status-pulse {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .tel-pulse-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--tel-accent-cyan);
        box-shadow: 0 0 8px var(--tel-accent-cyan);
      }
      .tel-pulse-text {
        font-size: 10.5px;
        font-weight: 700;
        color: var(--tel-accent-cyan);
        letter-spacing: 0.4px;
      }
      .tel-queue-skip-btn {
        font-size: 11px;
        font-weight: 600;
        color: #fca5a5;
        background: rgba(239, 68, 68, 0.12);
        border: 1px solid rgba(239, 68, 68, 0.25);
        border-radius: 6px;
        padding: 2px 8px;
        cursor: pointer;
        transition: all 0.15s;
      }
      .tel-queue-skip-btn:hover {
        background: rgba(239, 68, 68, 0.25);
        color: #ffffff;
      }
      .tel-queue-filename {
        font-size: 12px;
        font-weight: 600;
        color: var(--tel-text);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-bottom: 6px;
      }
      .tel-queue-mini-bar {
        height: 3px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 9999px;
        overflow: hidden;
      }
      .tel-queue-mini-bar > div {
        height: 100%;
        background: linear-gradient(90deg, var(--tel-primary), var(--tel-accent-cyan));
        border-radius: 9999px;
      }
      .tel-queue-item-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 7px 10px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 8px;
        transition: background 0.15s;
      }
      .tel-queue-item-row:hover {
        background: rgba(255, 255, 255, 0.07);
      }
      .tel-queue-item-idx {
        font-size: 11px;
        font-weight: 700;
        font-family: var(--tel-font-mono);
        color: var(--tel-accent-cyan);
        background: rgba(56, 189, 248, 0.12);
        padding: 2px 6px;
        border-radius: 4px;
      }
      .tel-queue-item-name {
        font-size: 12px;
        font-weight: 500;
        color: #f1f5f9;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
      }
      .tel-queue-remove-btn {
        background: transparent;
        border: none;
        color: var(--tel-text-muted);
        cursor: pointer;
        padding: 3px 6px;
        border-radius: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s;
      }
      .tel-queue-remove-btn:hover {
        color: var(--tel-danger);
        background: rgba(239, 68, 68, 0.15);
      }
      .tel-queue-empty-note {
        font-size: 11.5px;
        color: #64748b;
        font-style: italic;
        padding: 4px 2px;
      }
    `;
    document.head.appendChild(style);
  };
  enableTextSelection();

  // 2. Vector SVG Icons (Phosphor-inspired minimal stroke)
  const ICONS = {
    check: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    checkSquare: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
    download: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    close: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    closeSm: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
  };

  // 3. String & Utility helpers
  const contentRangeRegex = /^bytes (\d+)-(\d+)\/(\d+)$/;
  const DEFAULT_CHUNK_SIZE = 524288;
  const PARALLEL_WORKERS = 6;
  const UNITS = ["B", "KB", "MB", "GB"];

  const sanitizeFileName = (rawName, ext = ".mp4") => {
    let clean = (rawName || "")
      .replace(/[\r\n\x00-\x1f\x7f<>:"/\\|?*]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!clean || clean.length < 2) clean = `Telegram_Video_${Date.now()}`;
    if (clean.length > 80) clean = clean.slice(0, 80).trim();
    if (!/\.(mp4|mkv|mov)$/i.test(clean)) clean += ext;
    return clean;
  };

  const formatBytes = (bytes) => {
    const idx = Math.min(Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(1024)), UNITS.length - 1);
    return `${(bytes / (1024 ** idx)).toFixed(1)} ${UNITS[idx]}`;
  };

  const formatETA = (seconds) => {
    if (!isFinite(seconds) || seconds <= 0) return "";
    if (seconds < 60) return `${Math.ceil(seconds)}s left`;
    return `${Math.floor(seconds / 60)}m ${Math.ceil(seconds % 60)}s left`;
  };

  const extractMediaTitle = (container = null) => {
    try {
      if (container) {
        const titleEl = container.querySelector(
          ".file-name, .document-name, .title, .message-title, .text-content, .message-text, .transcription"
        );
        if (titleEl?.innerText?.trim()) return titleEl.innerText.trim();
      }
      const viewerA = document.getElementById("MediaViewer");
      if (viewerA) {
        const caption = viewerA.querySelector(".MediaViewerCaption, .caption");
        if (caption?.innerText?.trim()) return caption.innerText.trim();
        const fn = viewerA.querySelector(".file-name, .document-name");
        if (fn?.innerText?.trim()) return fn.innerText.trim();
      }
      const viewerK = document.querySelector(".media-viewer-whole");
      if (viewerK) {
        const title = viewerK.querySelector(".media-viewer-title, .media-viewer-name, .media-viewer-caption");
        if (title?.innerText?.trim()) return title.innerText.trim();
      }
    } catch {}
    return "";
  };

  const extractMediaUrl = (container) => {
    if (!container) return "";
    const v = container.tagName === "VIDEO" ? container : container.querySelector("video");
    if (v) {
      const src = v.getAttribute("src") || v.src || v.currentSrc || v.querySelector("source")?.src || v.getAttribute("data-src");
      if (src) return src;
    }
    const a = container.querySelector("a[href*='document'], a[download], a[href*='progressive']");
    return a?.href || "";
  };

  const saveMediaBlob = (blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  // 4. Centralized Queue & State Engine
  let toastHideTimer = null;

  const queueManager = {
    queue: [],
    active: null,
    total: 0,
    completed: 0,
    seq: 0,

    add(url, title) {
      if (!url || this.queue.some((t) => t.url === url) || this.active?.url === url) return;
      const task = {
        id: ++this.seq,
        url,
        fileName: sanitizeFileName(title),
        received: 0,
        total: 0,
        startedAt: performance.now(),
        controller: new AbortController(),
      };
      this.queue.push(task);
      this.total = Math.max(this.total, this.queue.length + (this.active ? 1 : 0));
      this.render();
      this.pump();
    },

    remove(id) {
      const idx = this.queue.findIndex((t) => t.id === id);
      if (idx !== -1) {
        this.queue.splice(idx, 1);
        this.total = Math.max(1, this.total - 1);
        this.render();
      }
    },

    clearWaiting() {
      this.queue.length = 0;
      this.total = this.active ? 1 : 0;
      this.render();
    },

    cancelAll() {
      this.queue.length = 0;
      this.total = 0;
      this.completed = 0;
      if (this.active) {
        this.active.controller.abort();
        this.active = null;
      }
      this.render();
      hideToast();
    },

    skipActive() {
      if (this.active) this.active.controller.abort();
    },

    render(percent = 0, speedText = "", etaText = "", isDone = false) {
      if (toastHideTimer) {
        clearTimeout(toastHideTimer);
        toastHideTimer = null;
      }

      const toast = document.getElementById("tel-download-toast");
      if (!toast) return;

      if (!this.active && this.queue.length === 0 && !isDone) {
        hideToast();
        return;
      }

      toast.classList.add("visible");
      const titleEl = toast.querySelector(".tel-toast-title");
      const fileName = isDone ? `All ${this.total} videos completed!` : (this.active?.fileName || "Starting...");

      if (this.total > 1 && !isDone) {
        titleEl.textContent = `[${Math.min(this.completed + 1, this.total)}/${this.total}] ${fileName}`;
      } else {
        titleEl.textContent = fileName;
      }

      const bar = toast.querySelector(".tel-toast-bar");
      if (bar) {
        if (isDone) bar.classList.add("completed");
        else bar.classList.remove("completed");
      }
      toast.querySelector(".tel-toast-bar > div").style.width = `${percent}%`;

      const remainingInQueue = this.queue.length;
      let queueHtml = "";
      if (remainingInQueue > 0) {
        queueHtml = `<button id="tel-queue-toggle-btn" class="tel-queue-badge" title="View & manage queue">${remainingInQueue} in queue ▾</button>`;
      }

      toast.querySelector(".tel-toast-meta").innerHTML = `
        <span>${percent}% · ${speedText || "0 B/s"}</span>
        <span>${etaText} ${queueHtml}</span>
      `;

      const toggleBtn = toast.querySelector("#tel-queue-toggle-btn");
      if (toggleBtn) {
        toggleBtn.onclick = (e) => {
          e.stopPropagation();
          toggleQueueModal();
        };
      }

      renderQueueModal();
    },

    pump() {
      if (this.active || this.queue.length === 0) return;
      const task = this.queue.shift();
      this.active = task;
      this.render(0, "Connecting...", "");
      runTask(task).finally(() => {
        this.active = null;
        this.render();
        this.pump();
      });
    }
  };

  const hideToast = () => {
    const toast = document.getElementById("tel-download-toast");
    if (toast) toast.classList.remove("visible");
    toggleQueueModal(false);
  };

  const toggleQueueModal = (forceState = null) => {
    const modal = document.getElementById("tel-queue-modal");
    if (!modal) return;
    const isVisible = forceState !== null ? forceState : !modal.classList.contains("visible");
    if (isVisible) {
      modal.classList.add("visible");
      renderQueueModal();
    } else {
      modal.classList.remove("visible");
    }
  };

  const renderQueueModal = () => {
    const modal = document.getElementById("tel-queue-modal");
    if (!modal) return;

    const countBadge = modal.querySelector("#tel-queue-header-count");
    const activeContainer = modal.querySelector("#tel-queue-active-container");
    const listContainer = modal.querySelector("#tel-queue-list-container");

    const totalCount = queueManager.queue.length + (queueManager.active ? 1 : 0);
    if (countBadge) countBadge.textContent = `${totalCount} file${totalCount === 1 ? "" : "s"}`;

    if (queueManager.active) {
      const act = queueManager.active;
      const pct = act.total ? Math.min(100, Math.floor((act.received * 100) / act.total)) : 0;
      activeContainer.innerHTML = `
        <div class="tel-queue-active-card">
          <div class="tel-queue-card-top">
            <div class="tel-queue-status-pulse">
              <span class="tel-pulse-dot"></span>
              <span class="tel-pulse-text">DOWNLOADING · ${pct}%</span>
            </div>
            <button class="tel-queue-skip-btn" id="tel-queue-skip-active" title="Skip this video">Skip</button>
          </div>
          <div class="tel-queue-filename" title="${act.fileName}">${act.fileName}</div>
          <div class="tel-queue-mini-bar"><div style="width: ${pct}%"></div></div>
        </div>
      `;
      const skipBtn = activeContainer.querySelector("#tel-queue-skip-active");
      if (skipBtn) skipBtn.onclick = () => queueManager.skipActive();
    } else {
      activeContainer.innerHTML = `<div class="tel-queue-empty-note">No active download</div>`;
    }

    if (queueManager.queue.length === 0) {
      listContainer.innerHTML = `<div class="tel-queue-empty-note">No upcoming files waiting in queue</div>`;
    } else {
      listContainer.innerHTML = queueManager.queue
        .map(
          (item, idx) => `
        <div class="tel-queue-item-row" data-task-id="${item.id}">
          <span class="tel-queue-item-idx">#${idx + 1}</span>
          <span class="tel-queue-item-name" title="${item.fileName}">${item.fileName}</span>
          <button class="tel-queue-remove-btn" title="Remove from queue" data-remove-id="${item.id}">
            ${ICONS.closeSm}
          </button>
        </div>
      `
        )
        .join("");

      listContainer.querySelectorAll(".tel-queue-remove-btn").forEach((btn) => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const removeId = Number(btn.getAttribute("data-remove-id"));
          queueManager.remove(removeId);
        };
      });
    }
  };

  // 5. 6-Worker MTProto Download Pipeline
  const fetchChunkWithRetry = async (url, start, end, signal, maxRetries = 5) => {
    let delay = 500;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      if (signal?.aborted) throw signal.reason;
      const ctrl = new AbortController();
      const onAbort = () => ctrl.abort(signal.reason);
      signal?.addEventListener("abort", onAbort, { once: true });
      const timer = setTimeout(() => ctrl.abort(new Error("Timeout")), 30000);

      try {
        const res = await fetch(url, {
          headers: { Range: `bytes=${start}-${end}` },
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);

        if (res.status === 429) {
          await new Promise((r) => setTimeout(r, delay * 2));
          delay *= 2;
          continue;
        }

        if (res.status !== 200 && res.status !== 206) throw new Error(`HTTP ${res.status}`);
        const buf = await res.arrayBuffer();
        if (buf.byteLength === 0) throw new Error("Empty buffer");
        return buf;
      } catch (err) {
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
        if (signal?.aborted) throw err;
        if (attempt === maxRetries) throw err;
        await new Promise((r) => setTimeout(r, delay));
        delay = Math.min(delay * 1.5, 4000);
      }
    }
  };

  const runTask = async (task) => {
    const parts = [];
    const checkAborted = () => {
      if (task.controller.signal.aborted) throw task.controller.signal.reason;
    };

    try {
      checkAborted();

      const res0 = await fetch(task.url, {
        headers: { Range: `bytes=0-${DEFAULT_CHUNK_SIZE - 1}` },
        signal: task.controller.signal,
      });

      if (res0.status !== 200 && res0.status !== 206) throw new Error(`HTTP ${res0.status}`);
      const mime = res0.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() || "video/mp4";

      if (res0.status === 200) {
        const fullBuf = await res0.arrayBuffer();
        saveMediaBlob(new Blob([fullBuf], { type: mime }), task.fileName);
        queueManager.completed++;

        const isAllDone = queueManager.queue.length === 0;
        queueManager.render(100, "100%", isAllDone ? "Done" : "Next starting...", isAllDone);
        if (isAllDone) {
          toastHideTimer = setTimeout(() => {
            hideToast();
            queueManager.total = 0;
            queueManager.completed = 0;
          }, 3500);
        }
        return;
      }

      const rangeMatch = res0.headers.get("Content-Range")?.match(contentRangeRegex);
      if (!rangeMatch) throw new Error("Missing Content-Range");

      const [start0, end0, totalSize] = rangeMatch.slice(1).map(Number);
      const actualPartSize = end0 - start0 + 1;
      task.total = totalSize;

      const buf0 = await res0.arrayBuffer();
      task.received = buf0.byteLength;
      parts[0] = buf0;

      const totalChunks = Math.ceil(totalSize / actualPartSize);
      const remainingIndices = [];
      for (let i = 1; i < totalChunks; i++) remainingIndices.push(i);

      let nextIdx = 0;
      let lastProgressTime = performance.now();
      let lastProgressBytes = task.received;

      const worker = async () => {
        while (true) {
          checkAborted();
          if (nextIdx >= remainingIndices.length) break;
          const chunkIdx = remainingIndices[nextIdx++];
          const chunkStart = chunkIdx * actualPartSize;
          const chunkEnd = Math.min(chunkStart + actualPartSize - 1, totalSize - 1);

          const chunkBuf = await fetchChunkWithRetry(task.url, chunkStart, chunkEnd, task.controller.signal);
          checkAborted();

          parts[chunkIdx] = chunkBuf;
          task.received += chunkBuf.byteLength;

          const now = performance.now();
          if (now - lastProgressTime > 150 || task.received === totalSize) {
            const timeDiff = (now - lastProgressTime) / 1000;
            const bytesDiff = task.received - lastProgressBytes;
            const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0;
            const remainingBytes = totalSize - task.received;
            const etaSeconds = speed > 0 ? remainingBytes / speed : 0;
            const pct = Math.min(100, Math.floor((task.received * 100) / task.total));

            queueManager.render(pct, `${formatBytes(speed)}/s`, formatETA(etaSeconds));
            lastProgressTime = now;
            lastProgressBytes = task.received;
          }
        }
      };

      const workerCount = Math.min(PARALLEL_WORKERS, remainingIndices.length);
      const workers = [];
      for (let w = 0; w < workerCount; w++) workers.push(worker());
      await Promise.all(workers);
      checkAborted();

      if (task.received < totalSize) throw new Error("Incomplete");

      saveMediaBlob(new Blob(parts, { type: mime }), task.fileName);
      queueManager.completed++;

      const isAllDone = queueManager.queue.length === 0;
      queueManager.render(100, "100%", isAllDone ? "Done" : "Next starting...", isAllDone);

      if (isAllDone) {
        toastHideTimer = setTimeout(() => {
          hideToast();
          queueManager.total = 0;
          queueManager.completed = 0;
        }, 3500);
      } else {
        await new Promise((r) => setTimeout(r, 300));
      }
    } catch (err) {
      if (task.controller.signal.aborted) {
        queueManager.render(0, "Skipped", "", false);
      } else {
        queueManager.render(0, "Failed: " + (err.message || "Error"), "Skipping...", false);
        await new Promise((r) => setTimeout(r, 1200));
      }
      if (queueManager.queue.length === 0) {
        toastHideTimer = setTimeout(hideToast, 2500);
      }
    } finally {
      parts.length = 0;
    }
  };

  // 6. Visual Selection & Container Detection
  const selectionManager = {
    isSelecting: false,
    selected: new Map(),

    toggle(container) {
      const url = extractMediaUrl(container);
      const title = extractMediaTitle(container);
      const id = container.getAttribute("data-message-id") || container.getAttribute("data-mid") || url;
      const key = url || id;
      if (!key) return;

      if (this.selected.has(key)) {
        this.selected.delete(key);
        container.classList.remove("tel-msg-selected");
      } else {
        this.selected.set(key, { url, title, id });
        container.classList.add("tel-msg-selected");
      }
      this.updateDock();
    },

    selectAll(containers) {
      containers.forEach((c) => {
        const url = extractMediaUrl(c);
        const title = extractMediaTitle(c);
        const id = c.getAttribute("data-message-id") || c.getAttribute("data-mid") || url;
        const key = url || id;
        if (key) {
          this.selected.set(key, { url, title, id });
          c.classList.add("tel-msg-selected");
        }
      });
      this.updateDock();
    },

    clear() {
      this.selected.clear();
      document.querySelectorAll(".tel-msg-selected").forEach((el) => el.classList.remove("tel-msg-selected"));
      this.updateDock();
    },

    updateDock() {
      const count = this.selected.size;
      const countEl = document.getElementById("tel-native-count");
      const dlBtn = document.getElementById("tel-native-dl-btn");
      if (countEl) countEl.textContent = `${count} video${count === 1 ? "" : "s"} selected`;
      if (dlBtn) {
        dlBtn.disabled = count === 0;
        dlBtn.innerHTML = `${ICONS.download} Download (${count})`;
      }
    }
  };

  const findVideoContainers = () => {
    const seen = new Set();
    const list = [];
    const add = (el) => {
      const c = el.closest(".Message, [class*='message-list-item'], .bubble, [data-message-id]") || el.parentElement;
      if (c && !seen.has(c) && !Array.from(seen).some((s) => s.contains(c) || c.contains(s))) {
        seen.add(c);
        list.push(c);
      }
    };
    document.querySelectorAll("video").forEach(add);
    document.querySelectorAll(".file-name, .document-name, .title").forEach((el) => {
      if (/\.(mp4|mkv|mov|webm)$/i.test(el.innerText || "")) add(el);
    });
    return list;
  };

  const setupBubbles = () => {
    const containers = findVideoContainers();
    containers.forEach((c) => {
      c.classList.add("tel-video-bubble");
      const url = extractMediaUrl(c);
      const id = c.getAttribute("data-message-id") || c.getAttribute("data-mid") || url;
      const key = url || id;

      if (selectionManager.selected.has(key)) {
        c.classList.add("tel-msg-selected");
      }

      if (!c.querySelector(".tel-native-checkbox")) {
        const box = document.createElement("div");
        box.className = "tel-native-checkbox";
        box.innerHTML = ICONS.check;
        c.appendChild(box);

        c.addEventListener(
          "click",
          (e) => {
            if (selectionManager.isSelecting) {
              e.preventDefault();
              e.stopPropagation();
              selectionManager.toggle(c);
            }
          },
          true
        );
      }
    });
  };

  const setSelectingMode = (active) => {
    selectionManager.isSelecting = active;
    const btn = document.getElementById("tel-native-select-btn");
    const bar = document.getElementById("tel-native-action-bar");

    if (active) {
      document.body.classList.add("tel-selecting-mode");
      setupBubbles();
      btn.innerHTML = `${ICONS.close} Cancel Selection`;
      btn.classList.add("active");
      bar.classList.add("visible");
    } else {
      document.body.classList.remove("tel-selecting-mode");
      selectionManager.clear();
      btn.innerHTML = `${ICONS.checkSquare} Select Videos`;
      btn.classList.remove("active");
      bar.classList.remove("visible");
    }
  };

  // 7. Declarative UI Initialization
  const initUI = () => {
    // Floating Select Pill
    if (!document.getElementById("tel-native-select-btn")) {
      const btn = document.createElement("button");
      btn.id = "tel-native-select-btn";
      btn.innerHTML = `${ICONS.checkSquare} Select Videos`;
      btn.onclick = () => setSelectingMode(!selectionManager.isSelecting);
      document.body.appendChild(btn);
    }

    // Action Dock
    if (!document.getElementById("tel-native-action-bar")) {
      const bar = document.createElement("div");
      bar.id = "tel-native-action-bar";
      bar.innerHTML = `
        <span id="tel-native-count" class="tel-native-bar-count">0 videos selected</span>
        <div class="tel-native-divider"></div>
        <button id="tel-native-select-all" class="tel-native-btn-link">Select All Visible</button>
        <button id="tel-native-dl-btn" class="tel-native-btn" disabled>
          ${ICONS.download} Download (0)
        </button>
      `;

      bar.querySelector("#tel-native-select-all").onclick = () => {
        selectionManager.selectAll(findVideoContainers());
      };

      bar.querySelector("#tel-native-dl-btn").onclick = () => {
        const toDownload = Array.from(selectionManager.selected.values());
        if (toDownload.length > 0) {
          toDownload.forEach((item) => queueManager.add(item.url, item.title));
        }
        setSelectingMode(false);
      };

      document.body.appendChild(bar);
    }

    // Progress Toast
    if (!document.getElementById("tel-download-toast")) {
      const toast = document.createElement("div");
      toast.id = "tel-download-toast";
      toast.innerHTML = `
        <div class="tel-toast-header">
          <span class="tel-toast-title">Downloading</span>
          <button class="tel-toast-close" title="Cancel All Downloads">${ICONS.close}</button>
        </div>
        <div class="tel-toast-bar"><div></div></div>
        <div class="tel-toast-meta"><span>0% · 0 B/s</span><span></span></div>
      `;
      toast.querySelector(".tel-toast-close").onclick = () => queueManager.cancelAll();
      document.body.appendChild(toast);
    }

    // Queue Manager Popup
    if (!document.getElementById("tel-queue-modal")) {
      const modal = document.createElement("div");
      modal.id = "tel-queue-modal";
      modal.innerHTML = `
        <div class="tel-queue-header">
          <div class="tel-queue-header-left">
            <span class="tel-queue-title">Download Queue</span>
            <span id="tel-queue-header-count" class="tel-queue-count-badge">0 files</span>
          </div>
          <div class="tel-queue-header-right">
            <button id="tel-queue-clear-btn" class="tel-queue-text-btn" title="Clear all waiting files">Clear Waiting</button>
            <button id="tel-queue-close-btn" class="tel-queue-icon-btn" title="Close queue">${ICONS.close}</button>
          </div>
        </div>
        <div class="tel-queue-body">
          <div class="tel-queue-section-label">Active Download</div>
          <div id="tel-queue-active-container"></div>
          <div class="tel-queue-section-label">Up Next in Queue</div>
          <div id="tel-queue-list-container"></div>
        </div>
      `;

      modal.querySelector("#tel-queue-close-btn").onclick = () => toggleQueueModal(false);
      modal.querySelector("#tel-queue-clear-btn").onclick = () => queueManager.clearWaiting();
      document.body.appendChild(modal);
    }

    // Fullscreen Media Viewer Single Download Button
    const addSingleBtn = (container, video) => {
      if (!container.querySelector(".tel-single-dl")) {
        const btn = document.createElement("button");
        btn.className = "Button smaller translucent-white round tel-single-dl";
        btn.innerHTML = ICONS.download;
        btn.title = "Download Video";
        btn.onclick = () => {
          const src = extractMediaUrl(video);
          if (src) queueManager.add(src, extractMediaTitle());
        };
        container.prepend(btn);
      }
    };

    const mediaA = document.querySelector("#MediaViewer .MediaViewerSlide--active");
    const actionsA = document.querySelector("#MediaViewer .MediaViewerActions");
    const videoA = mediaA?.querySelector(".VideoPlayer video");
    if (mediaA && actionsA && videoA) addSingleBtn(actionsA, videoA);

    const viewerK = document.querySelector(".media-viewer-whole");
    const btnsK = viewerK?.querySelector(".media-viewer-topbar .media-viewer-buttons");
    const videoK = viewerK?.querySelector(".media-viewer-aspecter video");
    if (viewerK && btnsK && videoK) addSingleBtn(btnsK, videoK);

    if (selectionManager.isSelecting) setupBubbles();
  };

  setInterval(() => {
    if (!document.hidden) initUI();
  }, 1200);
  initUI();
})();
