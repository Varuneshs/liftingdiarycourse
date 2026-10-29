"use client"

import { useState } from "react"
import { CalendarIcon, Dumbbell } from "lucide-react"

import { formatDate } from "@/lib/date"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

type Workout = {
  id: string
  name: string
  time: string
  exercises: { name: string; sets: number; reps: number; weight: number }[]
}

const MOCK_WORKOUTS: Workout[] = [
  {
    id: "1",
    name: "Push Day",
    time: "7:30 AM",
    exercises: [
      { name: "Bench Press", sets: 4, reps: 8, weight: 80 },
      { name: "Overhead Press", sets: 3, reps: 10, weight: 45 },
      { name: "Tricep Pushdown", sets: 3, reps: 12, weight: 25 },
    ],
  },
  {
    id: "2",
    name: "Evening Accessories",
    time: "6:15 PM",
    exercises: [
      { name: "Lateral Raise", sets: 3, reps: 15, weight: 10 },
      { name: "Face Pull", sets: 3, reps: 15, weight: 20 },
    ],
  },
]

export default function DashboardPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          View your logged workouts by date.
        </p>
      </div>

      <Popover>
        <PopoverTrigger
          render={
            <Button variant="outline" className="w-fit">
              <CalendarIcon data-icon="inline-start" />
              {date ? formatDate(date) : "Select a date"}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            autoFocus
          />
        </PopoverContent>
      </Popover>

      <Card>
        <CardHeader>
          <CardTitle>Workouts</CardTitle>
          <CardDescription>
            {date ? formatDate(date) : "No date selected"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {MOCK_WORKOUTS.length > 0 ? (
            <ScrollArea className="h-96 pr-3">
              <div className="flex flex-col gap-4">
                {MOCK_WORKOUTS.map((workout, index) => (
                  <div key={workout.id} className="flex flex-col gap-3">
                    {index > 0 && <Separator />}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Dumbbell className="size-4 text-muted-foreground" />
                        <span className="font-medium">{workout.name}</span>
                      </div>
                      <Badge variant="secondary">{workout.time}</Badge>
                    </div>
                    <div className="flex flex-col gap-1.5 pl-6">
                      {workout.exercises.map((exercise) => (
                        <div
                          key={exercise.name}
                          className="flex items-center justify-between text-sm text-muted-foreground"
                        >
                          <span>{exercise.name}</span>
                          <span>
                            {exercise.sets} x {exercise.reps} @{" "}
                            {exercise.weight}kg
                          </span>
                        </div>
                      ))}
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
