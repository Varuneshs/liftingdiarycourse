# UI Coding Standards

## The rule

**Only shadcn/ui components are allowed in this project's UI. No exceptions.**

- Do NOT create custom components (no hand-rolled `Button`, `Card`, `Modal`, `Input`, `Dropdown`, etc.).
- Do NOT write custom UI primitives "inspired by" or "similar to" shadcn — use the real shadcn component.
- Do NOT reach for another component library (MUI, Chakra, Ant Design, react-bootstrap, Headless UI wrappers you write yourself, etc.).
- Do NOT hand-write raw HTML + Tailwind for anything that a shadcn component already covers (buttons, inputs, dialogs, dropdowns, tabs, tooltips, cards, badges, avatars, tables, forms, etc.).

If a UI need exists, the answer is: **install the matching shadcn component**, not write one.

## Adding a component

Use the shadcn CLI to add components as needed:

```bash
npx shadcn@latest add <component-name>
```

This project's shadcn config lives in `components.json`:
- Style: `base-nova`
- Base color: `neutral`
- Icon library: `lucide-react`
- Components install to `src/components/ui/`

Check `src/components/ui/` first — the component you need may already be installed (e.g. `button.tsx`).

## What "no custom components" means in practice

- **Composition is fine.** You may compose multiple shadcn components together into a page or feature section (e.g. combining `Card`, `Input`, and `Button` into a form layout). That composition lives in the page/feature file, not as a new reusable "custom component" wrapping shadcn internals.
- **Do not wrap shadcn components** in a new abstraction layer (e.g. no `MyButton` that wraps shadcn's `Button`) unless shadcn itself has no equivalent and there is truly no way to compose existing shadcn components to achieve it — in that case, stop and ask before writing anything custom.
- **Do not edit generated shadcn files** to add unrelated custom behavior. If a shadcn component needs a variant, use its existing `cva` variant system (see `button.tsx`) rather than layering custom markup on top.
- **Icons** come from `lucide-react` (already configured as this project's icon library) — do not add another icon set.
- **Styling** stays within Tailwind v4's `@theme` config in `src/app/globals.css` and shadcn's existing CSS variables. Do not introduce ad-hoc one-off styles that duplicate what a shadcn component/variant already provides.

## Date formatting

All dates displayed in the UI must be formatted using **date-fns** — do not use `toLocaleDateString`, `Intl.DateTimeFormat`, or hand-written date formatting.

Format: `do MMM yyyy` — e.g. `1st Sep 2025`, `2nd Aug 2025`, `3rd Jan 2026`, `4th Jun 2024`.

Use the shared helper in `src/lib/date.ts` rather than calling `date-fns` directly in components:

```ts
import { formatDate } from "@/lib/date"

formatDate(new Date()) // "6th Aug 2026"
```

If a new date format is ever needed, add it to `src/lib/date.ts` rather than formatting dates inline in components.

## If shadcn doesn't have what you need

Do not improvise a custom component. Stop and flag it — the project owner decides whether to:
1. Use a different existing shadcn component/variant combination, or
2. Explicitly approve a one-off exception.

Silently building a custom component to fill the gap is not allowed.
