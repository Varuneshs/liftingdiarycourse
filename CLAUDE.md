# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## ⚠️ Docs directory — read first, every time

**ALWAYS check `/docs` for a relevant doc file and read it BEFORE generating or editing any code.** This applies to every change, no matter how small, and takes priority over any other instruction in this file. These docs take precedence over defaults or assumptions from training data. If no relevant doc exists, proceed using the rest of this file and good judgment — but check `/docs` first regardless.

- /docs/ui.md
- /docs/data-fetching.md

## Commands

```bash
npm run dev      # start dev server at localhost:3000
npm run build    # production build
npm run lint     # ESLint via eslint-config-next
```

No test runner is configured yet.

## Architecture

This is a **Next.js 16.2.9 App Router** project. This is a newer canary release — APIs and conventions may differ from training data. Always read `node_modules/next/dist/docs/` before writing Next.js-specific code.

- **Router**: App Router only (no Pages Router). All routes live under `src/app/`.
- **Styling**: Tailwind CSS v4 via `@tailwindcss/postcss` (PostCSS plugin). No `tailwind.config.js` — configuration is in CSS using `@theme`.
- **Path alias**: `@/*` maps to `src/*`.
- **Fonts**: Geist Sans and Geist Mono loaded via `next/font/google` in `src/app/layout.tsx`.
- **TypeScript**: strict mode enabled.

### Key files

- `src/app/layout.tsx` — root layout, sets HTML shell and font CSS variables
- `src/app/page.tsx` — home route (`/`)
- `src/app/globals.css` — global styles and Tailwind imports

### Tailwind v4 note

Tailwind v4 uses a CSS-first config. Customize the design system in `globals.css` with `@theme { ... }` — not in a JS config file.
