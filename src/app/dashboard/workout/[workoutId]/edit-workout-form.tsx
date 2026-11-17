"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toDateParam } from "@/lib/date"

import { deleteWorkoutAction, updateWorkoutAction } from "./actions"

export function EditWorkoutForm({
  workoutId,
  defaultName,
  defaultStartedAt,
  defaultCompletedAt,
}: {
  workoutId: string
  defaultName: string
  defaultStartedAt: string
  defaultCompletedAt: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const busy = isPending || isDeleting

  function onSubmit(formData: FormData) {
    setError(null)

    startTransition(async () => {
      const result = await updateWorkoutAction(workoutId, formData)

      if (!result.ok) {
        setError(result.error)
        return
      }

      // navigation happens on the client, never inside the Server Action
      router.push(`/dashboard?date=${toDateParam(new Date(result.startedAt))}`)
      router.refresh()
    })
  }

  function onDelete() {
    setError(null)

    startDeleteTransition(async () => {
      const result = await deleteWorkoutAction(workoutId)

      if (!result.ok) {
        setError(result.error)
        return
      }

      router.push("/dashboard")
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
          defaultValue={defaultName}
          disabled={busy}
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
          disabled={busy}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="completedAt">Finished at</Label>
        <Input
          id="completedAt"
          name="completedAt"
          type="datetime-local"
          defaultValue={defaultCompletedAt}
          disabled={busy}
        />
        <p className="text-xs text-muted-foreground">
          Optional — leave blank if the workout is still in progress.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
        <Button
          variant="ghost"
          disabled={busy}
          nativeButton={false}
          render={<Link href="/dashboard">Cancel</Link>}
        />

        <AlertDialog>
          <AlertDialogTrigger
            disabled={busy}
            render={
              <Button type="button" variant="destructive" className="ml-auto">
                {isDeleting ? "Deleting…" : "Delete"}
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this workout?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently deletes the workout along with its exercises
                and sets. This can&apos;t be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                type="button"
                variant="destructive"
                disabled={busy}
                onClick={onDelete}
              >
                Delete workout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </form>
  )
}
