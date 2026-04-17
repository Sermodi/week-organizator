import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { addDays, parseISO, format } from 'date-fns'
import { redirect } from 'next/navigation'

function icsDate(date: Date, time: string): string {
  const [h, m] = time.split(':')
  return format(date, 'yyyyMMdd') + `T${h}${m}00`
}

function escapeIcs(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export async function GET(_req: Request, { params }: { params: Promise<{ weekId: string }> }) {
  const { weekId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: week } = await supabase
    .from('weeks').select('*').eq('id', weekId).eq('user_id', user.id).single()
  if (!week) return new NextResponse('Not found', { status: 404 })

  const { data: blocks } = await supabase
    .from('time_blocks')
    .select('*, task:tasks(action_verb, concrete_object, victory_condition, area:areas(name))')
    .eq('week_id', weekId)
    .order('day_of_week')
    .order('start_time')

  const weekStart = parseISO(week.week_start)
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WeekOrganizator//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  for (const block of blocks ?? []) {
    const date = addDays(weekStart, block.day_of_week)
    const task = block.task as { action_verb: string; concrete_object: string; victory_condition: string; area?: { name: string } } | null
    const summary = task
      ? `${task.action_verb} ${task.concrete_object}`
      : (block.label ?? block.block_type)
    const description = task?.victory_condition
      ? `Listo cuando ${task.victory_condition}`
      : ''
    const location = task?.area?.name ?? ''

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${block.id}@weekorganizator`)
    lines.push(`DTSTART:${icsDate(date, block.start_time)}`)
    lines.push(`DTEND:${icsDate(date, block.end_time)}`)
    lines.push(`SUMMARY:${escapeIcs(summary)}`)
    if (description) lines.push(`DESCRIPTION:${escapeIcs(description)}`)
    if (location) lines.push(`LOCATION:${escapeIcs(location)}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  return new NextResponse(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="semana-${week.week_start}.ics"`,
    },
  })
}
