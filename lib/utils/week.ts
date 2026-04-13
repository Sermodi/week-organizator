import { startOfISOWeek, format, addDays, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function getWeekStart(date: Date = new Date()): Date {
  return startOfISOWeek(date)
}

export function getWeekStartString(date: Date = new Date()): string {
  return format(startOfISOWeek(date), 'yyyy-MM-dd')
}

export function formatWeekRange(weekStart: string): string {
  const start = parseISO(weekStart)
  const end = addDays(start, 6)
  return `${format(start, "d 'de' MMM", { locale: es })} – ${format(end, "d 'de' MMM 'de' yyyy", { locale: es })}`
}

export function getWeekDays(weekStart: string): Date[] {
  const start = parseISO(weekStart)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
export const DAY_NAMES_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
