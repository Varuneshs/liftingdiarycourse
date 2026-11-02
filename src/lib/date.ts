import { format, isValid, parse } from "date-fns"

const DATE_PARAM_FORMAT = "yyyy-MM-dd"

export function formatDate(date: Date | number) {
  return format(date, "do MMM yyyy")
}

export function formatTime(date: Date | number) {
  return format(date, "h:mm a")
}

export function toDateParam(date: Date | number) {
  return format(date, DATE_PARAM_FORMAT)
}

export function parseDateParam(value: string | undefined) {
  if (!value) return null
  const date = parse(value, DATE_PARAM_FORMAT, new Date())
  return isValid(date) ? date : null
}
