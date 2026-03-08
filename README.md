# ⚔️ The War Table — D&D Campaign Dashboard v6.0

A real-time D&D party tracker with Firebase sync, multi-currency wallet, D&D stats, conditions, death saves and more.

## 🚀 Deploy to GitHub Pages (zero build tools)

1. Create a new GitHub repository
2. Upload both `index.html` and `App.jsx` to the **root** of the repo
3. Go to **Settings → Pages → Source → Deploy from branch → main / root**
4. Your dashboard will be live at `https://<your-username>.github.io/<repo-name>/`

## 🔥 Firebase (Live Multi-Device Sync)

The Firebase project is already configured in `App.jsx`. Players are synced in real-time across all connected devices. If Firebase is unavailable, the dashboard falls back to `localStorage` automatically.

To use your own Firebase project, replace the `FB_CFG` object near the top of `App.jsx` with your own config from the Firebase Console (Realtime Database).

## 🔐 DM Password

The default DM passphrase is: `dungeonmaster2024`

The passphrase is verified client-side via SHA-256. It is never stored in plain text.

## 📱 Browser Compatibility

Works in all modern browsers. No build step required — Babel transpiles the JSX directly in the browser.

## 🗂️ Files

| File | Purpose |
|---|---|
| `index.html` | Entry point — loads React, ReactDOM, Babel from CDN |
| `App.jsx` | Entire application (2100+ lines, self-contained) |

## 🛠️ Local Development

Simply open `index.html` with a local server:

```bash
# Python
python3 -m http.server 8080

# Node / npx
npx serve .
```

Then visit `http://localhost:8080`.

> ⚠️ Opening `index.html` directly as a `file://` URL will NOT work because Babel's `src=` script loading requires HTTP.
