# Nouri app (usable alpha)

The app Nouri runs as: a private claude.ai page (Artifact) at https://claude.ai/artifact/41Y2RFDUiUPex8k1zChmwE.
`index.html` at the repo root is the original prototype; it is untouched, and its export file imports here.

## Installable app (PWA)
Built to `app/dist/` and deployed to GitHub Pages by `.github/workflows/deploy-app.yml` on every push to `main`
that touches `app/`. The address is https://brandon-c-tran.github.io/nouri/ once Pages is on.
- One-time setup: repo Settings → Pages → Source: GitHub Actions. Private repos need a paid plan for Pages; otherwise make the repo public. Your food data is never in the repo.
- Install: open the address in Safari → Share → Add to Home Screen.
- Data lives on that phone: records in local storage, photos at full quality in IndexedDB. Back up from History → ••• → Export (share sheet → Save to Files); restore with Import. No cross-device sync and no Claude assists in this version.
- Offline: a service worker caches the app; updates apply on the next open.
- Tests: `node app/test/pwa.mjs`.

## Use it on claude.ai
Open the link in Safari while signed in to claude.ai, then Share → Add to Home Screen.
Direct links, each can be its own home-screen icon:
- `…/41Y2RFDUiUPex8k1zChmwE#save` opens straight into Save a craving.
- `#today`, `#saved`, `#week`, `#history` open that tab.

## Layout
- `src/core.js`: data model and migration, link parsing, recommendations, grocery derivation. Pure functions.
- `src/store.js`: persistence. Cloud (Artifact `db`, per user under `data/users/<id>/`) or browser storage outside claude.ai. Writes confirm before "Saved"; failed writes queue on the device and retry.
- `src/art.js`: illustrations, used only for labeled sample dishes.
- `src/ui.js`, `src/styles.css`, `src/shell.html`: the interface.
- `nouri.html`: the built page. Generated; don't edit by hand.

## Commands
- Build: `node app/build.mjs`
- Unit tests: `node --test app/test/*.test.js`
- Journey tests (iPhone 13 viewport, Playwright, mock of the claude.ai runtime): `node app/test/e2e.mjs [screenshotDir]`
- Publish: from Claude Code, publish `app/nouri.html` with the Artifact tool. Same path, same URL. Capabilities: db, user, assets, sample, downloads.

## Data
- Dishes: `ideas/items`. Older docs are migrated on read, never rewritten until edited.
- Meals: `meals/items`.
- Cooks: `cooks/items`.
- Week, groceries and tonight's pick: the `state` doc.
- Photos: Artifact assets, or a small inline copy when assets are unavailable.
- Export and import: History → ••• .
