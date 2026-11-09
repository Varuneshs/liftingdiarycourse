# Data Mutation Standards

## The rules

1. **NEVER call `redirect()` inside a Server Action.** Navigation after a mutation happens client side, once the Server Action's promise resolves.

## 1. No `redirect()` in Server Actions

Do NOT import or call `redirect()` from `next/navigation` inside a Server Action. A Server Action's job is to perform the mutation and return a result — it does not decide where the user goes next.

Instead, let the action return, then navigate from the Client Component that called it, using `useRouter()` from `next/navigation` after the `await` resolves.

```ts
// src/app/workouts/actions.ts — ✅
"use server"

import { createWorkout } from "@/data/workouts"

export async function createWorkoutAction(formData: FormData) {
  const workout = await createWorkout(formData)
  return { id: workout.id }
}
```

```tsx
// src/app/workouts/new-workout-form.tsx — ✅ redirect on the client
"use client"

import { useRouter } from "next/navigation"
import { createWorkoutAction } from "./actions"

export function NewWorkoutForm() {
  const router = useRouter()

  async function onSubmit(formData: FormData) {
    const { id } = await createWorkoutAction(formData)
    router.push(`/workouts/${id}`)
  }

  return <form action={onSubmit}>{/* ... */}</form>
}
```

```ts
// ❌ WRONG — redirect() inside a Server Action
"use server"

import { redirect } from "next/navigation"

export async function createWorkoutAction(formData: FormData) {
  const workout = await createWorkout(formData)
  redirect(`/workouts/${workout.id}`) // ❌ never do this
}
```

`redirect()` works by throwing a special error, which means it short-circuits the action: the caller never gets a return value, errors are harder to distinguish from real failures, and the client component loses the chance to show pending/success state before navigating. Keeping navigation on the client keeps the action's contract a plain value.

## Checklist before writing any mutation code

- [ ] Is the Server Action free of `redirect()` (and of any `next/navigation` redirect import)?
- [ ] Does the action return the data the caller needs to navigate (e.g. the new record's ID)?
- [ ] Does the Client Component navigate with `useRouter()` after awaiting the action?
