import { format } from "date-fns"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { NewWorkoutForm } from "./new-workout-form"

export default function NewWorkoutPage() {
  // value shape required by <input type="datetime-local">
  const defaultStartedAt = format(new Date(), "yyyy-MM-dd'T'HH:mm")

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold">New workout</h1>
        <p className="text-sm text-muted-foreground">
          Log a new workout session.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workout details</CardTitle>
          <CardDescription>
            Name it and set when you started. You can add exercises afterwards.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewWorkoutForm defaultStartedAt={defaultStartedAt} />
        </CardContent>
      </Card>
    </div>
  )
}
