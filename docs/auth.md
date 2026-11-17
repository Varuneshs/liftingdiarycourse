# Auth Coding Standards

## The rule

**This app uses Clerk (`@clerk/nextjs` v7) for authentication. It is the only auth system.**

- Do NOT add another auth library (NextAuth/Auth.js, Lucia, Passport, Supabase Auth, Firebase Auth, etc.).
- Do NOT hand-roll auth — no custom session cookies, JWT signing/verifying, password hashing, or your own login form posting to a route handler.
- Do NOT store users, passwords, sessions, or credentials in our database. Clerk owns identity; our DB only stores the Clerk user ID as a foreign key.
- Do NOT read or parse Clerk cookies/headers yourself (`__session`, `Authorization`, etc.). Use the Clerk APIs below.

If an auth need exists, the answer is: **use the matching Clerk API**, not write one.

## ⚠️ This is Clerk v7 on Next.js 16 — not the versions in your training data

Two breaking changes matter constantly. Getting these wrong is the most common auth mistake in this repo:

1. **`middleware.ts` no longer exists.** Next.js 16 renamed the file convention to **`proxy.ts`**. Our Clerk middleware lives at `src/proxy.ts`. Never create `src/middleware.ts` or `middleware.ts` — it will not run.
2. **`<SignedIn>`, `<SignedOut>` and `<Protect>` are gone.** Clerk v7 replaced all three with a single **`<Show when={...}>`** component. They are not exported from `@clerk/nextjs` — importing them is a build error.

Before writing anything non-trivial, check the installed packages rather than recalling from memory:

```bash
cat node_modules/@clerk/nextjs/dist/types/index.d.ts        # client exports
cat node_modules/@clerk/nextjs/dist/types/server/index.d.ts  # server exports
cat node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
```

## Route protection lives in `src/proxy.ts`

Routes are protected centrally by `clerkMiddleware`. **The app is deny-by-default**: everything requires a signed-in user except routes explicitly listed as public.

```ts
// src/proxy.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});
```

Rules:

- **To make a route public, add it to `isPublicRoute`** — do not invert the logic into an `isProtectedRoute` allowlist. Deny-by-default means a new page is protected the moment it is created, which is the behaviour we want.
- Keep the `config.matcher` as-is. It skips `_next` and static assets and includes `/(api|trpc)(.*)` and `/__clerk/:path*`.
- Protection in `proxy.ts` is **not** a substitute for scoping queries by user. See "Never trust the route" below.

## Server-side: `auth()` from `@clerk/nextjs/server`

```ts
import { auth, currentUser } from "@clerk/nextjs/server";

const { userId } = await auth();   // ✅ always await — auth() is async
const user = await currentUser();  // full user profile (extra network call)
```

- **`auth()` is async in v7.** `const { userId } = auth()` without `await` is wrong.
- Import from **`@clerk/nextjs/server`**, never `@clerk/nextjs`. The root package deliberately exports `auth` as `never` to produce a clear error if you get it wrong.
- `auth()` works only in Server Components, Server Actions and the proxy — never in a Client Component.
- Use **`userId`** (the Clerk user ID string) as the identity key everywhere, including `workouts.userId` in the DB schema.
- Prefer `auth()` over `currentUser()` when all you need is the ID — `currentUser()` makes an additional request to Clerk.

## Never trust the route — scope every query by `userId`

`auth.protect()` in `src/proxy.ts` proves *someone* is signed in. It does **not** prove the data they are requesting is theirs.

**This duplicates `/docs/data-fetching.md` on purpose, because it is the rule most easily broken:**

- Every helper in `src/data/` calls `auth()` **itself** and throws when there is no `userId`.
- **Never accept `userId` as a function parameter** — a caller must not be able to pass someone else's ID.
- Every query filters on the current user. Fetching by ID alone is a bug: combine them (`and(eq(workouts.id, id), eq(workouts.userId, userId))`).
- `exercises` and `sets` have no `userId` column — scope them through their parent `workouts` row.

```ts
// src/data/workouts.ts — ✅ the pattern every data helper follows
import { auth } from "@clerk/nextjs/server";

export async function getWorkoutsForDate(date: Date) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return db.query.workouts.findMany({
    where: and(eq(workouts.userId, userId), /* ... */),
  });
}
```

```ts
// ❌ WRONG — "the proxy already protected this route" is not user scoping
export async function getWorkoutById(id: string) {
  return db.select().from(workouts).where(eq(workouts.id, id));
}

// ❌ WRONG — caller chooses whose data comes back
export async function getWorkouts(userId: string) { /* ... */ }
```

## UI: conditional rendering with `<Show>`

`<Show>` replaces `<SignedIn>`, `<SignedOut>` and `<Protect>`. It takes a `when` prop and an optional `fallback` (rendered when the condition fails; defaults to `null`).

```tsx
import { Show } from "@clerk/nextjs";

<Show when="signed-out">
  <SignInButton mode="modal" />
  <SignUpButton mode="modal" />
</Show>

<Show when="signed-in">
  <UserButton />
</Show>
```

`when` accepts:

- `"signed-in"` / `"signed-out"` shorthands
- an authorization object — `{ role: "admin" }`, `{ permission: "org:billing:manage" }`, `{ feature: "..." }`, `{ plan: "..." }`
- a predicate receiving the `has` helper — `(has) => has({ permission: "org:read" }) && isEnabled`

```tsx
// ❌ WRONG — these do not exist in Clerk v7
import { SignedIn, SignedOut, Protect } from "@clerk/nextjs";
```

`<Show>` is a **UI convenience, not a security boundary.** Hiding a button does not protect the data behind it — the proxy and the `src/data/` user scoping do that.

## Prebuilt Clerk components only

Per `/docs/ui.md`, we don't hand-roll UI. The same applies to auth screens — use Clerk's prebuilt components rather than building forms against the `useSignIn` / `useSignUp` hooks:

| Need | Use |
| --- | --- |
| Sign-in page | `<SignIn />` |
| Sign-up page | `<SignUp />` |
| Account menu / avatar | `<UserButton />` |
| Sign in / up triggers in the header | `<SignInButton />`, `<SignUpButton />` |
| Sign out | `<SignOutButton />` |
| Profile management | `<UserProfile />` |

Catch-all routes already exist and must keep their splat segments so Clerk can own its sub-routes:

- `src/app/sign-in/[[...sign-in]]/page.tsx`
- `src/app/sign-up/[[...sign-up]]/page.tsx`

`<ClerkProvider>` wraps the app once in `src/app/layout.tsx`. Do not add a second provider lower in the tree.

Custom flows with `useSignIn` / `useSignUp`, and `appearance` theming beyond our existing setup, are **not** approved — stop and ask first.

## Client Components

- A Client Component **never fetches data** (see `/docs/data-fetching.md`) and never calls `auth()`.
- For display-only user info in a Client Component, prefer passing it down as props from a Server Component.
- `useAuth()` / `useUser()` are available when a client-side reactive value is genuinely needed, but anything they return is **untrusted for authorization** — the browser controls it. Authorization decisions happen on the server.

## Environment variables

Clerk keys live in `.env` and are never hardcoded or committed to source:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=   # safe to expose to the browser
CLERK_SECRET_KEY=                    # server-only — never NEXT_PUBLIC_, never in a Client Component
NEXT_PUBLIC_CLERK_SIGN_IN_URL=
NEXT_PUBLIC_CLERK_SIGN_UP_URL=
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=
```

Only the publishable key may carry the `NEXT_PUBLIC_` prefix among the secrets. Prefixing `CLERK_SECRET_KEY` ships it to every browser — treat that as a security incident, not a bug.

Redirect URLs are configured via these env vars rather than hardcoded in components, because server-side `redirectToSignIn()` can only read redirect URLs from env vars or `clerkMiddleware` dynamic keys.

## Checklist before writing any auth code

- [ ] Am I using Clerk, not a second auth system or something hand-rolled?
- [ ] Is route protection in `src/proxy.ts` (**not** `middleware.ts`), with public routes added to `isPublicRoute`?
- [ ] Did I `await auth()` and import it from `@clerk/nextjs/server`?
- [ ] Does every data helper get `userId` from `auth()` itself — never as a parameter — and filter every query by it?
- [ ] Am I using `<Show when={...}>` rather than `<SignedIn>` / `<SignedOut>` / `<Protect>`?
- [ ] Am I using Clerk's prebuilt components instead of a custom auth form?
- [ ] Are all keys from env vars, with `CLERK_SECRET_KEY` server-only?
