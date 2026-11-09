"use server"

import { revalidatePath } from "next/cache"

import { createWorkout } from "@/data/workouts"

export type CreateWorkoutResult =
  | { ok: true; id: string }
  | { ok: false; error: string }

export async function createWorkoutAction(
  formData: FormData
): Promise<CreateWorkoutResult> {
  const rawName = formData.get("name")
  const rawStartedAt = formData.get("startedAt")

  const name = typeof rawName === "string" ? rawName.trim() : ""

  if (typeof rawStartedAt !== "string" || rawStartedAt === "") {
    return { ok: false, error: "Please choose when the workout started." }
  }

  // datetime-local gives "yyyy-MM-ddTHH:mm" in the user's local time
  const startedAt = new Date(rawStartedAt)
  if (Number.isNaN(startedAt.getTime())) {
    return { ok: false, error: "That start time isn't a valid date." }
  }

  try {
    const workout = await createWorkout({
      name: name === "" ? null : name,
      startedAt,
    })

    revalidatePath("/dashboard")

    return { ok: true, id: workout.id }
  } catch {
    return { ok: false, error: "Could not create the workout. Please try again." }
  }
}
