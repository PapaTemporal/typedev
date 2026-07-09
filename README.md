# typelit-dev

A [typelit.io](https://typelit.io)-style typing trainer, enhanced for developers learning a new
keyboard layout (Colemak, Colemak-DH, Dvorak). Instead of only prose, you practice on **real
open-source code** — because story books never make you type `{`, `=>`, `::`, or `&mut`.

## Features

- **Typelit-style practice**: the page is shown, you type it, mistakes turn red, backspace fixes
  them. Live WPM/accuracy, per-page progress with resume.
- **Code mode**: real files from Zod, Express, Requests, Flask, Gin, Cobra, ripgrep, Tokio, Redis,
  spdlog — monospace, indentation preserved, Enter auto-skips leading whitespace. Grouped easy
  (TS/JS/Python/Go) → symbol-heavy (Rust/C/C++).
- **Books mode**: 20 public-domain classics from Project Gutenberg (same source typelit uses) —
  fetch more with `pnpm books <gutenberg-id>`.
- **Import**: paste any text, or give a GitHub file URL.
- **Layout aids** (all optional, off by default — Settings):
  - On-screen keyboard (QWERTY / Colemak / Colemak-DH / Dvorak) highlighting the physical key for
    the next character.
  - Board shapes: ANSI, Charybdis 4x6 split, import from keyboard-layout-editor.com (KLE raw
    JSON), or build your exact board in the built-in key editor (`/editor`): drag/rotate/resize
    keys, bind them by pressing the physical key, and define **layers** with layer-toggle keys.
    During practice the keyboard shows which layer the next character needs and highlights the
    layer key to hold (real-time layer detection isn't possible from a browser — firmware layer
    switches never reach the host — but next-key layer guidance doesn't need it).
  - Input modes: trust the OS/firmware, or emulate the layout in-app (physical `event.code` →
    layout table), so your OS and QMK/ZMK firmware can stay on QWERTY.
  - Error heatmap over the keyboard, per layout.
  - Finger guidance colors.
  - "Must correct errors" mode.
- **Drill mode**: generates practice text weighted toward your statistically weakest keys.
- **Stats**: WPM-over-time chart, accuracy, totals — stored in SQLite.

## Stack

SvelteKit 2 · Svelte 5 (runes) · TypeScript · Tailwind CSS v4 · Drizzle ORM · better-sqlite3 · Vitest

## Getting started

```sh
pnpm install
pnpm db:generate   # only after changing src/lib/server/db/schema.ts
pnpm seed          # load content/ into data/typing.db
pnpm dev
```

Set your OS keyboard layout to the layout you're learning, pick the same layout in Settings, and
the on-screen keyboard highlights will match your physical keys.

## Adding content

Drop a file under `content/code/<language>/` or `content/books/`, add an entry to that folder's
`manifest.json` (title, language, difficulty, source, license, author), and run `pnpm seed`.
Re-seeding is idempotent.

## Hosting on GitHub Pages

The app has two build targets:

- **Local (default)**: SvelteKit + adapter-node with SQLite — full server, cross-device stats.
- **Static (`pnpm build:static`)**: adapter-static SPA for GitHub Pages — the library is baked
  into JSON at build time (`pnpm bake` → `static/data/`), and stats/progress/imports live in the
  browser's localStorage instead of SQLite. Imports run client-side (Gutendex and GitHub raw both
  allow CORS; Gutenberg mirrors fall back to a CORS proxy).

`.github/workflows/deploy.yml` builds and deploys the static target on every push to `main`.
One-time setup: repo **Settings → Pages → Source: GitHub Actions**. The site lands at
`https://<user>.github.io/<repo>/` (the workflow sets `BASE_PATH` from the repo name).

## Scripts

| Command            | What it does                              |
| ------------------ | ----------------------------------------- |
| `pnpm dev`         | dev server                                |
| `pnpm test`        | vitest unit tests (engine, layouts, etc.) |
| `pnpm check`       | svelte-check / TypeScript                 |
| `pnpm seed`        | (re)load `content/` into SQLite           |
| `pnpm books [id…]` | download Gutenberg books into `content/`  |
| `pnpm db:generate` | generate Drizzle migrations               |
| `pnpm build`       | production build (adapter-node)           |
| `pnpm build:static`| bake content + static SPA build (Pages)   |

## Content licenses

Bundled snippets are excerpts from open-source projects, each attributed with source URL and
license in `content/*/manifest.json`. Book excerpts are public domain via Project Gutenberg.
