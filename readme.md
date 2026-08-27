# GSLEY Website — Deployment Package

This package contains everything needed to deploy the GSLEY website to **Netlify** (as a static site) **or** to **WordPress** (as a custom theme). Both options are fully self-contained and require no build step.

## What's inside

```
gsley-deploy/
├── netlify/                  ← drag-and-drop static deploy
│   ├── index.html            ← the entire site, bundled into one file
│   ├── netlify.toml          ← Netlify build/header config
│   ├── _redirects            ← SPA fallback for hash routes
│   └── robots.txt
│
├── wordpress/                ← upload as a WordPress theme (.zip)
│   ├── style.css             ← theme metadata + base CSS
│   ├── functions.php         ← theme hooks
│   ├── front-page.php        ← renders the GSLEY app on the homepage
│   ├── index.php             ← fallback / blog template
│   ├── page.php              ← any standard WP page
│   ├── header.php
│   ├── footer.php
│   └── assets/
│       └── gsley-app.html    ← the bundled site (same file as netlify/index.html)
│
├── source/                   ← editable source code (React + JSX)
│   ├── index.html
│   ├── tweaks-panel.jsx
│   └── site/
│       ├── app.jsx
│       ├── data.jsx          ← all copy, services, contact details
│       ├── diagnostic.jsx    ← Growth Diagnostic interactive tool
│       ├── pages-shared.jsx
│       └── dir-b-clinical.jsx ← layout, nav, sub-brand pages
│
└── README.md                 ← this file
```

---

## Option 1 — Deploy to Netlify (recommended, 60 seconds)

### Drag-and-drop method (no Git required)

1. Sign in at <https://app.netlify.com/>.
2. Open the **Sites** tab.
3. Zip the contents of the `netlify/` folder (the `index.html` must be at the root of the zip — *not* inside another folder).
4. Drag the zip onto the Netlify "drag your site folder here" panel.
5. Netlify will deploy in ~10 seconds and give you a `*.netlify.app` URL.
6. To use a custom domain (e.g. `gsley.com`), open the new site → **Domain management** → **Add custom domain**.

### Git method (if you want push-to-deploy)

1. Push the contents of `netlify/` to a GitHub/GitLab repository.
2. In Netlify, click **Add new site → Import an existing project**.
3. Select the repo. Build command: leave blank. Publish directory: `.`
4. Click Deploy.

### Editing on Netlify

Netlify itself doesn't offer an in-browser editor, but the bundled `index.html` is a single file you can:
- Open in any code editor and edit text/colors directly, or
- Edit the **source** files (`source/`) and re-bundle (see "Re-bundling" below).

---

## Option 2 — Install on WordPress

The `wordpress/` folder is a complete WordPress theme. The homepage renders the full GSLEY application; any other WordPress pages and blog posts you add render through the standard theme.

### Install

1. Zip the **contents of the `wordpress/` folder** (so `style.css`, `functions.php`, `assets/`, etc. sit at the root of the zip — *not* inside a `wordpress/` folder). Name it `gsley-theme.zip`.
2. In your WordPress admin: **Appearance → Themes → Add New → Upload Theme**.
3. Upload `gsley-theme.zip` and click **Install Now**, then **Activate**.
4. Make sure **Settings → Reading → Your homepage displays** is set to "Your latest posts" (Front-page.php loads automatically).

### Editing on WordPress

- **Standard WP pages** (e.g. Privacy Policy, Terms): create them in **Pages → Add New** — they use the standard `page.php` template and are fully editable in the WordPress block editor.
- **The GSLEY homepage application** is rendered from `assets/gsley-app.html`. To edit copy, services, contact details, or visual styles:
  - Quick text edits: open `assets/gsley-app.html` in the WordPress **Theme File Editor** (Appearance → Theme File Editor) and search/replace the copy you want to change.
  - Larger changes: edit the **source** files (`source/`), re-bundle (below), and replace `wordpress/assets/gsley-app.html`.

---

## Re-bundling (advanced)

If you want to make significant changes (new pages, restructured sub-brands, layout changes), edit the React source in `source/site/` and re-bundle:

1. The source uses React + Babel loaded from CDN — no `npm install` required.
2. Open `source/index.html` directly in a browser to preview your changes locally.
3. To produce a new bundled `index.html`, use any HTML inliner (e.g. [`html-inline`](https://www.npmjs.com/package/html-inline)) to merge all referenced JSX/CSS into a single file:
   ```
   npx html-inline source/index.html > netlify/index.html
   ```
4. Replace `wordpress/assets/gsley-app.html` with the same bundled file if deploying to WordPress.

### Where to find common things in source

| Want to change…             | File                              |
|-----------------------------|-----------------------------------|
| Phone, email, WhatsApp      | `source/site/dir-b-clinical.jsx` (top of file) |
| Sub-brand names, services   | `source/site/data.jsx`            |
| Diagnostic questions/scoring| `source/site/diagnostic.jsx`      |
| Homepage hero / sections    | `source/site/dir-b-clinical.jsx`  |
| Colors, fonts, defaults     | `source/site/app.jsx` (TWEAK_DEFAULTS) |

---

## Notes on parity

- The bundled site uses the in-browser Babel transformer for JSX. This is acceptable for a marketing site and keeps the build process zero-config, but means initial render is slightly slower than a pre-compiled build.
- Routing uses URL hashes (`#/services`, `#/about`). This works on every host — including WordPress subpages — without server-side rewrites.
- The diagnostic tool stores no user data; results are computed entirely client-side.
- The contact form opens a `mailto:` link to **gsleydigital@gmail.com**. To swap in a server-side form (e.g. Netlify Forms, WPForms), edit the `submit` handler in `source/site/dir-b-clinical.jsx`.
- The live chat bubble launches WhatsApp (`+234 902 476 7079`) in a new window.

---

## Support

For changes beyond the scope of these instructions, edit the `source/` files and re-bundle, or contact your developer with the `source/` folder attached.
