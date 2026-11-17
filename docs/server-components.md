# Server Component Standards

## The rules

1. **`params` is a Promise. ALWAYS `await` it.** Never read a property off it directly.
2. **`searchParams` is a Promise too.** Same rule, same reason.
3. **Components are Server Components by default.** Only add `"use client"` when the component genuinely needs interactivity.
4. **Type page and layout props with the `PageProps` / `LayoutProps` globals**, not hand-written inline types.

Breaking rule 1 or 2 is a bug even if the page appears to render.

## 1. `params` MUST be awaited

In this project `params` is a **`Promise`**, not a plain object. Reading a property off it without awaiting gives you `undefined` (or a Promise, depending on the access), not the route segment.

```tsx
// src/app/dashboard/workout/[workoutId]/page.tsx — ✅
export default async function EditWorkoutPage({
  params,
}: PageProps<"/dashboard/workout/[workoutId]">) {
  const { workoutId } = await params

  const workout = await getWorkoutById(workoutId)
  if (!workout) notFound()

  return <EditWorkoutForm workoutId={workout.id} />
}
```

```tsx
// ❌ WRONG — params is a Promise; workoutId is not a string here
export default async function EditWorkoutPage({ params }) {
  const workout = await getWorkoutById(params.workoutId)
}

// ❌ WRONG — destructuring in the signature doesn't await it either
export default async function EditWorkoutPage({ params: { workoutId } }) { }

// ❌ WRONG — not an async component, so it cannot await at all
export default function EditWorkoutPage({ params }) { }
```

The component must be `async` for this to work. If you find yourself wanting to read `params` from a non-async component, that is the signal you are in the wrong kind of component — see rule 3.

### Why it's a Promise

Dynamic params are request-time data. Making them a Promise lets Next.js begin rendering the static parts of a route before the request-specific values are known, rather than blocking the whole render. The same reasoning makes `cookies()` and `headers()` async.

### Version note

This project is on **Next.js 16.2.9**. `params` and `searchParams` became Promises in **Next.js 15** and remain Promises in 16 — most pre-15 examples in the wild (and in model training data) show the old synchronous object. Treat any example that reads `params.foo` directly as out of date.

Next.js 15 kept a backwards-compatible synchronous access path with a deprecation warning. **Do not rely on it.** It is deprecated and we do not use it here.

## 2. `searchParams` follows the same rule

```tsx
// src/app/dashboard/page.tsx — ✅
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { date: dateParam } = await searchParams
  const date = parseDateParam(
    typeof dateParam === "string" ? dateParam : undefined
  ) ?? new Date()

  const workouts = await getWorkoutsForDate(date)
  // ...
}
```

Two things to keep in mind:

- A value can be `string`, `string[]` (when the key repeats in the URL) or `undefined`. Always narrow with `typeof value === "string"` before using it, as above.
- `searchParams` is request-time data, so using it opts the route into dynamic rendering. That is expected for our dashboard; just know it is the reason the route is not static.

Search params are **untrusted user input** — they come from the URL. Validate and parse them (`parseDateParam`), never pass them into a query unchecked.

## 3. Server Component by default

Everything under `src/app/` is a Server Component unless it opts out with `"use client"`. Keep it that way.

Add `"use client"` only when the component needs:

- event handlers (`onClick`, `onChange`, form submit handlers)
- React state or effects (`useState`, `useTransition`, `useEffect`)
- browser-only APIs, or `useRouter()` for client-side navigation

If a component needs data **and** interactivity, split it: an `async` Server Component page fetches, and a Client Component child takes the result as props. That is the pattern used by the workout pages — `page.tsx` fetches and awaits `params`, `edit-workout-form.tsx` is the `"use client"` form.

```tsx
// ✅ server fetches, client handles interaction
const workout = await getWorkoutById(workoutId)
return <EditWorkoutForm defaultName={workout.name ?? ""} />
```

A Client Component **never** fetches data and never calls `auth()` — see `/docs/data-fetching.md` and `/docs/auth.md`.

### Reading params in a Client Component

A Client Component cannot be `async`, so it cannot `await`. If a Client Component page genuinely needs `params`, unwrap the Promise with React's `use()`:

```tsx
"use client"
import { use } from "react"

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
}
```

Prefer passing the value down as a prop from the Server Component parent. Reach for `use()` only when that isn't possible.

## 4. Type props with the global helpers

`PageProps` and `LayoutProps` are **globally available** — no import needed. They take the literal route and derive `params` (and `searchParams`) from it, so the keys stay correct if a segment is ever renamed.

```tsx
// ✅ keys are derived from the route
export default async function Page(
  props: PageProps<"/dashboard/workout/[workoutId]">
) {
  const { workoutId } = await props.params
}

// ✅ layouts use LayoutProps
export default async function Layout(props: LayoutProps<"/dashboard">) {
  const { children } = props
}
```

These types are generated during `next dev`, `next build`, or `next typegen`. If the type isn't recognised, run a build rather than falling back to a hand-written type.

An explicit inline `Promise<...>` type is acceptable where no literal route applies (e.g. the `searchParams` example above), but **never type `params` as a plain non-Promise object** — that defeats the type checker's ability to catch a missing `await`.

## Layouts

Layouts receive `params` as a Promise on the same terms as pages, and the same rules apply.

Layouts do **not** receive `searchParams`. They don't re-render on navigation, so search params would go stale — read them in the page instead.

## Checklist before writing any Server Component

- [ ] Is the component `async` if it reads `params`, `searchParams`, or fetches data?
- [ ] Is every `params` access `await`ed — including in `generateMetadata`?
- [ ] Is every `searchParams` access `await`ed, and each value narrowed before use?
- [ ] Are props typed with `PageProps<"/the/[route]">` / `LayoutProps<"/the/route">`?
- [ ] Is `"use client"` absent unless the component truly needs interactivity?
- [ ] Is data fetched here and passed down, rather than fetched in a Client Component?
