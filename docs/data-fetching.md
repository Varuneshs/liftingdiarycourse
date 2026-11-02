# Data Fetching Standards

## The rules

1. **ALL data fetching happens in Server Components. No exceptions.**
2. **ALL database queries go through helper functions in `src/data/`, written with Drizzle ORM. No raw SQL.**
3. **A logged-in user can ONLY ever access their own data.** Every query must be scoped to the current user.

These rules are critical. Breaking any one of them is a bug, even if the feature "works".

## 1. Fetch data ONLY in Server Components

Data is fetched by `async` Server Components (pages, layouts, and server-rendered sections under `src/app/`), which call the helpers in `src/data/` directly and pass the results down as props.

Do NOT fetch data:

- ❌ In **Route Handlers** (`route.ts` / API routes) — do not build an API for the app to call itself.
- ❌ In **Client Components** (`"use client"`) — no `useEffect` + `fetch`, no SWR, no React Query, no calling a server endpoint from the browser.
- ❌ Via **Server Actions** used as a read mechanism, or any other workaround.
- ❌ Any other way. If it's not a Server Component calling a `src/data/` helper, it's wrong.

If a Client Component needs data, fetch it in the nearest Server Component parent and pass it down as props.

```tsx
// src/app/dashboard/page.tsx — ✅ Server Component
import { getWorkouts } from "@/data/workouts"

export default async function DashboardPage() {
  const workouts = await getWorkouts()
  return <WorkoutList workouts={workouts} />
}
```

## 2. Database queries live in `src/data/` and use Drizzle ORM

- Every database query is a helper function in `src/data/` (e.g. `src/data/workouts.ts`, `src/data/exercises.ts`).
- Components and pages **never** import `db` from `@/db` directly — they only call `src/data/` helpers.
- Helpers use **Drizzle ORM's query builder** (`db.select()`, `db.query.<table>.findMany()`, `eq`, `and`, etc.) with the schema from `@/db/schema`.
- **DO NOT USE RAW SQL.** No `sql\`...\`` template strings for queries, no `db.execute()` with hand-written SQL, no string-built queries.

## 3. Users can ONLY access their own data

This is the most important rule in this document. A user must never be able to read another user's data — not through a crafted URL, a guessed ID, or a missing filter.

- **Every helper gets the user ID itself** from Clerk via `auth()` from `@clerk/nextjs/server`. Do NOT accept `userId` as a function parameter — callers must not be able to pass in someone else's ID.
- If there is no signed-in user, throw (or return nothing). Never fall back to an unscoped query.
- **Every query filters by the current user.** Fetching by ID is not enough — always combine the ID with the user check (`and(eq(workouts.id, id), eq(workouts.userId, userId))`).
- Tables without a `userId` column (`exercises`, `sets`) must be scoped **through their parent `workouts` row** — join to `workouts` and filter on `workouts.userId`.
- `exerciseDefinitions`: a user may see shared definitions (`createdBy` is null) and their own (`createdBy = userId`) — never another user's custom definitions.

```ts
// src/data/workouts.ts — ✅
import { auth } from "@clerk/nextjs/server"
import { and, desc, eq } from "drizzle-orm"
import { db } from "@/db"
import { workouts } from "@/db/schema"

export async function getWorkouts() {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  return db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId))
    .orderBy(desc(workouts.startedAt))
}

export async function getWorkoutById(id: string) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const [workout] = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.id, id), eq(workouts.userId, userId)))

  return workout ?? null
}
```

```ts
// ❌ WRONG — no user scoping, any user can read any workout by ID
export async function getWorkoutById(id: string) {
  return db.select().from(workouts).where(eq(workouts.id, id))
}

// ❌ WRONG — caller controls which user's data is returned
export async function getWorkouts(userId: string) { ... }

// ❌ WRONG — raw SQL
db.execute(sql`select * from workouts where user_id = ${userId}`)
```

## Checklist before writing any data code

- [ ] Is the data fetched in a Server Component (not a route handler, client component, or anything else)?
- [ ] Does the query live in a helper in `src/data/`?
- [ ] Does it use Drizzle ORM, with no raw SQL?
- [ ] Does the helper get `userId` from `auth()` itself and filter every query by it (directly or via `workouts`)?
