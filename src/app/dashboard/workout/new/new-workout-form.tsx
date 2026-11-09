"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toDateParam } from "@/lib/date"

import { createWorkoutAction } from "./actions"

export function NewWorkoutForm({ defaultStartedAt }: { defaultStartedAt: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(formData: FormData) {
    setError(null)

    startTransition(async () => {
      const result = await createWorkoutAction(formData)

      if (!result.ok) {
        setError(result.error)
        return
      }

      const startedAt = formData.get("startedAt")
      const date =
        typeof startedAt === "string" ? new Date(startedAt) : new Date()

      // navigation happens on the client, never inside the Server Action
      router.push(`/dashboard?date=${toDateParam(date)}`)
      router.refresh()
    })
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Workout name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Push day"
          maxLength={120}
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Optional — leave blank for an untitled workout.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="startedAt">Started at</Label>
        <Input
          id="startedAt"
          name="startedAt"
          type="datetime-local"
          defaultValue={defaultStartedAt}
          required
          disabled={isPending}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating…" : "Create workout"}
        </Button>
        <Button
          variant="ghost"
          disabled={isPending}
          nativeButton={false}
          render={<Link href="/dashboard">Cancel</Link>}
        />
      </div>
    </form>
  )
}
