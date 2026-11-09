import Link from "next/link"
import { Dumbbell, Plus } from "lucide-react"

import { getWorkoutsForDate } from "@/data/workouts"
import { formatDate, formatTime, parseDateParam } from "@/lib/date"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { DashboardDatePicker } from "./date-picker"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { date: dateParam } = await searchParams
  const date =
    parseDateParam(typeof dateParam === "string" ? dateParam : undefined) ??
    new Date()

  const workouts = await getWorkoutsForDate(date)

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          View your logged workouts by date.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <DashboardDatePicker date={date} />
        <Button
          render={
            <Link href="/dashboard/workout/new">
              <Plus data-icon="inline-start" />
              New workout
            </Link>
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workouts</CardTitle>
          <CardDescription>{formatDate(date)}</CardDescription>
        </CardHeader>
        <CardContent>
          {workouts.length > 0 ? (
            <ScrollArea className="h-96 pr-3">
              <div className="flex flex-col gap-4">
                {workouts.map((workout, index) => (
                  <div key={workout.id} className="flex flex-col gap-3">
                    {index > 0 && <Separator />}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Dumbbell className="size-4 text-muted-foreground" />
                        <span className="font-medium">
                          {workout.name ?? "Untitled workout"}
                        </span>
                      </div>
                      {workout.startedAt && (
                        <Badge variant="secondary">
                          {formatTime(workout.startedAt)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 pl-6">
                      {workout.exercises.map((exercise) => {
                        const workingSets = exercise.sets.filter(
                          (set) => !set.isWarmup
                        )
                        return (
                          <div
                            key={exercise.id}
                            className="flex items-center justify-between text-sm text-muted-foreground"
                          >
                            <span>{exercise.definition.name}</span>
                            <span>
                              {workingSets.length > 0
                                ? workingSets
                                    .map(
                                      (set) =>
                                        `${set.weightKg ?? 0}kg x ${set.reps ?? 0}`
                                    )
                                    .join(", ")
                                : "No working sets"}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No workouts logged for this date.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
