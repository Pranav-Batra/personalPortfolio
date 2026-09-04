# DSi Menu Portfolio

A fully static personal portfolio styled after the **Nintendo DSi menu**. Two screens:
the **bottom screen** is a scrollable carousel of "apps," and selecting one opens its
content on the **top screen**. Includes a DSi stylus cursor and synthesized sound effects.

## Apps
- **About Me** · **Projects** · **Experience** · **Contact**

## How it works
- Browse the carousel with **scroll wheel, drag/swipe, the ◀ ▶ arrows, the dots, or ← → keys**.
- **Tap the centered app** (or the **Open** button, or **Enter**) to open it on the top screen.
- **Back** button, **Esc**, or **Backspace** returns to the browsing view.

## Run it
Pure HTML/CSS/JS — open `index.html`, or serve the folder:

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Make it yours
Content lives in **`index.html`** inside the `#content` block (one `<section class="app-content">`
per app):

- **About Me** — bio + skill chips. Photo is `assets/me.jpg`.
- **Projects** — four `.proj-card` blocks. The "View on GitHub" links currently point at
  your profile — swap in specific repo URLs.
- **Experience** — `.timeline` entries.
- **Contact** — email / GitHub / LinkedIn / phone.

App names, taglines, and accent colors are defined once in the `APPS` array at the top of
**`script.js`** (and mirrored on the carousel icons in `index.html`).

## Notes
- Sound needs one click/tap first (browser autoplay policy) — a hint prompts for it.
- The stylus cursor is desktop-only; touch devices fall back to the normal pointer.

## Deploy
Any static host: GitHub Pages, Netlify, Vercel, Cloudflare Pages — no build step.
