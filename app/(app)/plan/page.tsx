import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getWeekStartString } from '@/lib/utils/week'

export default async function PlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const weekStart = getWeekStartString()
  const { data: weekId } = await supabase.rpc('get_or_create_week', {
    p_user_id: user.id,
    p_week_start: weekStart,
  })

  const { data: week } = await supabase
    .from('weeks')
    .select('id, current_step')
    .eq('id', weekId)
    .single()

  redirect(`/plan/${week?.id}/step${week?.current_step ?? 1}`)
}
