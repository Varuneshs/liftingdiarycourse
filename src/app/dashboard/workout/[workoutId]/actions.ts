"use server"

import { revalidatePath } from "next/cache"

import { deleteWorkout, updateWorkout } from "@/data/workouts"

export type UpdateWorkoutResult =
  | { ok: true; id: string; startedAt: string }
  | { ok: false; error: string }

export type DeleteWorkoutResult = { ok: true } | { ok: false; error: string }

export async function updateWorkoutAction(
  workoutId: string,
  formData: FormData
): Promise<UpdateWorkoutResult> {
  const rawName = formData.get("name")
  const rawStartedAt = formData.get("startedAt")
  const rawCompletedAt = formData.get("completedAt")

  const name = typeof rawName === "string" ? rawName.trim() : ""

  if (typeof rawStartedAt !== "string" || rawStartedAt === "") {
    return { ok: false, error: "Please choose when the workout started." }
  }

  // datetime-local gives "yyyy-MM-ddTHH:mm" in the user's local time
  const startedAt = new Date(rawStartedAt)
  if (Number.isNaN(startedAt.getTime())) {
    return { ok: false, error: "That start time isn't a valid date." }
  }

  let completedAt: Date | null = null
  if (typeof rawCompletedAt === "string" && rawCompletedAt !== "") {
    completedAt = new Date(rawCompletedAt)
    if (Number.isNaN(completedAt.getTime())) {
      return { ok: false, error: "That finish time isn't a valid date." }
    }
    if (completedAt < startedAt) {
      return {
        ok: false,
        error: "The workout can't finish before it started.",
      }
    }
  }

  try {
    const workout = await updateWorkout(workoutId, {
      name: name === "" ? null : name,
      startedAt,
      completedAt,
    })

    if (!workout) {
      return { ok: false, error: "That workout could not be found." }
    }

    revalidatePath("/dashboard")
    revalidatePath(`/dashboard/workout/${workoutId}`)

    return {
      ok: true,
      id: workout.id,
      startedAt: startedAt.toISOString(),
    }
  } catch {
    return {
      ok: false,
      error: "Could not update the workout. Please try again.",
    }
  }
}

export async function deleteWorkoutAction(
  workoutId: string
): Promise<DeleteWorkoutResult> {
  try {
    const workout = await deleteWorkout(workoutId)

    if (!workout) {
      return { ok: false, error: "That workout could not be found." }
    }

    revalidatePath("/dashboard")

    return { ok: true }
  } catch {
    return {
      ok: false,
      error: "Could not delete the workout. Please try again.",
    }
  }
}
