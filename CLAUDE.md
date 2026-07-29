# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

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
