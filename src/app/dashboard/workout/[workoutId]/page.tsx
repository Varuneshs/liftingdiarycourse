import { notFound } from "next/navigation"
import { format } from "date-fns"
import { Dumbbell } from "lucide-react"

import { getWorkoutById } from "@/data/workouts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import { EditWorkoutForm } from "./edit-workout-form"

// value shape required by <input type="datetime-local">
const DATETIME_LOCAL_FORMAT = "yyyy-MM-dd'T'HH:mm"

export default async function EditWorkoutPage({
  params,
}: PageProps<"/dashboard/workout/[workoutId]">) {
  const { workoutId } = await params

  const workout = await getWorkoutById(workoutId)
  if (!workout) notFound()

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold">Edit workout</h1>
        <p className="text-sm text-muted-foreground">
          Update the details of this workout session.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workout details</CardTitle>
          <CardDescription>
            Change the name or when the session started and finished.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditWorkoutForm
            workoutId={workout.id}
            defaultName={workout.name ?? ""}
            defaultStartedAt={
              workout.startedAt
                ? format(workout.startedAt, DATETIME_LOCAL_FORMAT)
                : ""
            }
            defaultCompletedAt={
              workout.completedAt
                ? format(workout.completedAt, DATETIME_LOCAL_FORMAT)
                : ""
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exercises</CardTitle>
          <CardDescription>
            {workout.exercises.length > 0
              ? `${workout.exercises.length} exercise${
                  workout.exercises.length === 1 ? "" : "s"
                } logged.`
              : "Nothing logged for this workout yet."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workout.exercises.length > 0 ? (
            <div className="flex flex-col gap-4">
              {workout.exercises.map((exercise, index) => (
                <div key={exercise.id} className="flex flex-col gap-3">
                  {index > 0 && <Separator />}
                  <div className="flex items-center gap-2">
                    <Dumbbell className="size-4 text-muted-foreground" />
                    <span className="font-medium">
                      {exercise.definition.name}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5 pl-6">
                    {exercise.sets.length > 0 ? (
                      exercise.sets.map((set) => (
                        <div
                          key={set.id}
                          className="flex items-center justify-between text-sm text-muted-foreground"
                        >
                          <span>Set {set.setNumber}</span>
                          <span className="flex items-center gap-2">
                            {set.isWarmup && (
                              <Badge variant="secondary">Warm-up</Badge>
                            )}
                            {`${set.weightKg ?? 0}kg x ${set.reps ?? 0}`}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No sets recorded.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No exercises logged for this workout.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
