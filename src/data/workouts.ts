import { auth } from "@clerk/nextjs/server"
import { addDays, startOfDay } from "date-fns"
import { and, asc, eq, gte, lt } from "drizzle-orm"
import { db } from "@/db"
import { exercises, sets, workouts } from "@/db/schema"

export async function getWorkoutsForDate(date: Date) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const dayStart = startOfDay(date)
  const dayEnd = addDays(dayStart, 1)

  // exercises and sets have no userId; they are scoped through the parent workout
  return db.query.workouts.findMany({
    where: and(
      eq(workouts.userId, userId),
      gte(workouts.startedAt, dayStart),
      lt(workouts.startedAt, dayEnd)
    ),
    orderBy: [asc(workouts.startedAt)],
    with: {
      exercises: {
        orderBy: [asc(exercises.order)],
        with: {
          definition: true,
          sets: { orderBy: [asc(sets.setNumber)] },
        },
      },
    },
  })
}

export async function createWorkout(input: {
  name: string | null
  startedAt: Date
}) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const [workout] = await db
    .insert(workouts)
    .values({
      userId,
      name: input.name,
      startedAt: input.startedAt,
    })
    .returning()

  return workout
}
