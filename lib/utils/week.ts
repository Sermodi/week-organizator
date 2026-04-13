import { startOfISOWeek, format, addDays, parseISO } from 'date-fns'

export function getWeekStart(date: Date = new Date()): Date {
  return startOfISOWeek(date)
}

export function getWeekStartString(date: Date = new Date()): string {
  return format(startOfISOWeek(date), 'yyyy-MM-dd')
}

export function formatWeekRange(weekStart: string): string {
  const start = parseISO(weekStart)
  const end = addDays(start, 6)
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
}

export function getWeekDays(weekStart: string): Date[] {
  const start = parseISO(weekStart)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const DAY_NAMES_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
