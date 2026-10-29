import { format } from "date-fns"

export function formatDate(date: Date | number) {
  return format(date, "do MMM yyyy")
}
