# Routing Coding Standards

## The rules

1. **Every app route lives under `/dashboard`.** New feature pages are created as `/dashboard/...` segments, not as new top-level routes.
2. **`/dashboard` and all of its sub-pages are protected.** Only a signed-in user may reach them.
3. **Route protection is enforced in `src/proxy.ts`** — the Next.js 16 replacement for `middleware.ts`. Never protect a route by putting a check in the page component instead.

The only routes that exist outside `/dashboard` are the Clerk auth catch-alls (`/sign-in`, `/sign-up`) and the root route `/`.

## ⚠️ `middleware.ts` does not exist in Next.js 16

The `middleware` file convention is **deprecated and renamed to `proxy`**. This project's route protection lives at **`src/proxy.ts`**.

```bash
# The official docs for this convention, from the installed version:
cat node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
```

Quoting those docs directly:

> **Note**: The `middleware` file convention is deprecated and has been renamed to `proxy`.

What this means in practice:

- **Never create `src/middleware.ts` or `middleware.ts`.** The file will simply not run, and every protected route silently becomes public. This is the single most dangerous routing mistake available in this repo — it fails open, with no error.
- The file must sit at `src/proxy.ts` — the same level as `app`, not inside it.
- When a request for "middleware" comes up in conversation or a ticket, it means `proxy.ts`. The concept is unchanged; only the filename moved.

This also applies to anything you recall from training data: nearly every Next.js auth tutorial in existence says `middleware.ts`. In this project that is wrong.

## 1. All routes live under `/dashboard`

The app's route tree:

```
src/app/
├── page.tsx                             # /           — not an app surface
├── sign-in/[[...sign-in]]/page.tsx      # /sign-in    — public (Clerk)
├── sign-up/[[...sign-up]]/page.tsx      # /sign-up    — public (Clerk)
└── dashboard/
    ├── page.tsx                         # /dashboard
    └── workout/
        ├── new/page.tsx                 # /dashboard/workout/new
        └── [workoutId]/page.tsx         # /dashboard/workout/[workoutId]
```

New pages go **inside `src/app/dashboard/`**:

```
✅ src/app/dashboard/exercises/page.tsx        → /dashboard/exercises
✅ src/app/dashboard/workout/[workoutId]/...   → nested under an existing feature
❌ src/app/exercises/page.tsx                  → /exercises — top-level, not allowed
❌ src/app/settings/page.tsx                   → /settings  — top-level, not allowed
```

Why this matters beyond tidiness: `/dashboard` is the app's authenticated surface. Keeping every feature underneath it means protection, layout and navigation are reasoned about in exactly one place. A new top-level route is a route someone has to remember to protect — and `src/proxy.ts` is deny-by-default precisely so that nobody has to remember.

### The root route `/`

`/` is **not** an app surface. It currently holds untouched `create-next-app` boilerplate. Do not build features onto it, and do not treat it as a home page for signed-in users — their home is `/dashboard`.

### Linking and navigation

Use the standard Next.js primitives; there is no custom router wrapper in this project.

```tsx
import Link from "next/link"           // declarative navigation
import { useRouter } from "next/navigation"  // imperative, Client Components only
import { redirect } from "next/navigation"   // server-side, Server Components / Actions
```

- **Always link to absolute app paths** — `/dashboard/workout/new`, never a relative `workout/new`.
- `useRouter` comes from **`next/navigation`**, never the legacy `next/router` (that is the Pages Router and does not exist here).
- `useRouter` only works in a Client Component. From a Server Component or Server Action, use `redirect()`.
- Preserve meaningful query state when navigating. The dashboard is date-driven, so returning to it after a mutation keeps the date:

```tsx
// src/app/dashboard/workout/new/new-workout-form.tsx — ✅ the established pattern
router.push(`/dashboard?date=${toDateParam(date)}`)
```

## 2. `/dashboard` is protected, deny-by-default

`src/proxy.ts` protects **everything except** the routes explicitly listed as public:

```ts
// src/proxy.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
```

Rules for changing this file:

- **To make a route public, add it to `isPublicRoute`.** Never invert the logic into an `isProtectedRoute` allowlist — deny-by-default means a newly created page is protected the moment it exists, which is the behaviour we want. An allowlist means a forgotten entry ships an unprotected page.
- **A new `/dashboard/...` page needs no change here.** It is already protected. If you find yourself editing `proxy.ts` to protect a new page, something is wrong.
- **Keep the `config.matcher` as-is.** It deliberately skips `_next` and static assets while including `/(api|trpc)(.*)` and `/__clerk/:path*`. Narrowing it is how auth logic accidentally stops running; widening it is how CSS and images start getting blocked.
- One proxy function per file — Next.js supports a single default (or `proxy`-named) export, and `clerkMiddleware(...)` is it.

### Never protect a route inside the page

```tsx
// ❌ WRONG — protection does not belong in the component
export default async function SomeDashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")
  // ...
}
```

This is redundant where `proxy.ts` already covers the route, and it is a trap elsewhere: the next page nobody remembers to add it to is simply unprotected. Centralised protection means there is one place to audit.

## 3. Route protection is not data authorization

`auth.protect()` in `src/proxy.ts` proves *someone* is signed in. It does **not** prove the data being requested belongs to them.

`/dashboard/workout/[workoutId]` is reachable by **any** signed-in user with any `workoutId`. The route being protected does nothing to stop user A opening user B's workout — only the query scoping does.

```ts
// ✅ every data helper scopes by the current user itself
export async function getWorkoutById(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return db.query.workouts.findFirst({
    where: and(eq(workouts.id, id), eq(workouts.userId, userId)),
  });
}
```

See `/docs/auth.md` and `/docs/data-fetching.md` for the full rule. It is repeated here because a protected route is exactly what makes this mistake feel safe.

## Route segment conventions

- **Dynamic segments** use `[param]` — e.g. `[workoutId]`. The folder name is the key you destructure from `params`.
- **`params` and `searchParams` are Promises and must be awaited.** See `/docs/server-components.md`; getting this wrong is a bug even when the page appears to render.
- **Type page props with the `PageProps` global**, not a hand-written inline type:

```tsx
// ✅
export default async function EditWorkoutPage({
  params,
}: PageProps<"/dashboard/workout/[workoutId]">) {
  const { workoutId } = await params
}

// ❌ hand-written — loses type safety against the real route tree
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {}
```

- **Colocate route-specific components** next to the page that uses them (`src/app/dashboard/date-picker.tsx`, `.../new-workout-form.tsx`). Only genuinely shared components belong in `src/components/`.
- **A missing resource is `notFound()`**, not a redirect or a rendered error string:

```tsx
const workout = await getWorkoutById(workoutId)
if (!workout) notFound()
```

Because queries are user-scoped, `notFound()` is also the correct response when a workout exists but belongs to someone else — it reveals nothing about whether that ID exists.

## Checklist before adding a route

- [ ] Is the new page under `src/app/dashboard/`, rather than a new top-level route?
- [ ] Did I leave `src/proxy.ts` alone? (A new `/dashboard` page is already protected.)
- [ ] If I did edit it, did I add to `isPublicRoute` rather than inverting to an allowlist, and leave `config.matcher` intact?
- [ ] Did I avoid creating `middleware.ts` anywhere?
- [ ] Is protection in the proxy rather than an `auth()` check inside the page component?
- [ ] Does every data helper the page calls scope its query by `userId` from `auth()`?
- [ ] Did I `await params` / `await searchParams`, and type props with `PageProps`?
- [ ] Are links absolute app paths, with `useRouter` imported from `next/navigation`?
