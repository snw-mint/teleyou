<div align="center">

<img src="public/android-chrome-192x192.png" width="96" height="96" alt="TeleYou logo" />

# TeleYou

**Material You theme generator for Telegram — runs entirely in your browser.**

Extract palettes from images or colors and export native themes for Telegram Desktop and Mobile. No install, no server, no data collection.

[![Live](https://img.shields.io/badge/live-teleyou.app-6750A4?style=flat-square)](https://teleyou.app)
[![License](https://img.shields.io/github/license/snw-mint/teleyou?style=flat-square&color=6750A4)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-6750A4?style=flat-square)](version.json)

</div>

---

## Features

- **Image extraction** — upload any photo and TeleYou derives a full Material You palette from its dominant colors
- **Seed color** — pick or randomize a single HCT color to generate the entire palette
- **Fine-grained editing** — tweak Primary, Secondary, Tertiary, Error, Neutral and Neutral Variant individually with the built-in HCT picker
- **Live preview** — side-by-side mobile and desktop Telegram mockups update in real time
- **Two export targets** — `.attheme` for Telegram Android/iOS, `.tdesktop-theme` for Telegram Desktop
- **Three color modes** — Light, Dark, and AMOLED (true black)
- **100% client-side** — all processing happens in your browser via WebAssembly; nothing is sent to any server

## Tech stack

| Layer | Library |
|---|---|
| Color science | [`@material/material-color-utilities`](https://github.com/material-foundation/material-color-utilities) |
| Archive export | [`jszip`](https://github.com/Stuk/jszip) |
| Build | [Vite 8](https://vitejs.dev) |
| Font | [Google Sans Flex](https://fonts.google.com) + Material Symbols |

## Getting started

```bash
# Clone
git clone https://github.com/snw-mint/teleyou.git
cd teleyou

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

Requires Node.js `^20.19.0` or `>=22.12.0` (Vite 8 requirement).

## Project structure

```
teleyou/
├── public/                  # Static assets (favicons, manifest, theme templates)
│   └── templates/           # Blank .attheme and .tdesktop template files
├── src/
│   ├── assets/              # Wallpapers, avatar images
│   ├── css/                 # Stylesheets (style, mockup, modals, pages)
│   └── js/                  # Application logic
│       ├── main.js          # Entry point — theme extraction & UI wiring
│       ├── hct-picker.js    # HCT color picker component
│       ├── hct-constraints.js # Role-aware color constraints
│       ├── export-modal.js  # Export flow (mode → platform → download)
│       ├── theme-mobile.js  # .attheme generator
│       └── theme-desktop.js # .tdesktop-theme generator
├── app.html                 # Generator page (noindex)
├── index.html               # Landing page
├── privacy.html             # Privacy policy
└── terms.html               # Terms of use
```

## Deploying to Vercel

The project deploys out of the box. Just import the repo in Vercel — no special configuration needed. The `vite.config.js` already sets `base: '/'`.

## Contributing

Bug reports, theme color corrections, and feature ideas are all welcome. Please use the issue templates to keep things organized.

For code contributions, open a pull request against `main`. Keep changes focused — one fix or feature per PR.

## License

[MIT](LICENSE) © 2026 [Snow Mint](https://github.com/snw-mint)