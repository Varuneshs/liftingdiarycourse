"use client"

import { useRouter } from "next/navigation"
import { CalendarIcon } from "lucide-react"

import { formatDate, toDateParam } from "@/lib/date"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DashboardDatePicker({ date }: { date: Date }) {
  const router = useRouter()

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" className="w-fit">
            <CalendarIcon data-icon="inline-start" />
            {formatDate(date)}
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selected) => {
            if (selected) {
              router.push(`/dashboard?date=${toDateParam(selected)}`)
            }
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
