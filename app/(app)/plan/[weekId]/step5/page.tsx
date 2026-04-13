import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Step5Client from './Step5Client'

export default async function Step5Page({ params }: { params: Promise<{ weekId: string }> }) {
  const { weekId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: week } = await supabase.from('weeks').select('*').eq('id', weekId).eq('user_id', user.id).single()
  if (!week) notFound()

  const { data: reflection } = await supabase.from('reflections').select('*').eq('week_id', weekId).maybeSingle()

  const { count: taskCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('week_id', weekId)
  const { count: blockCount } = await supabase.from('time_blocks').select('*', { count: 'exact', head: true }).eq('week_id', weekId)

  return <Step5Client week={week} reflection={reflection} taskCount={taskCount ?? 0} blockCount={blockCount ?? 0} />
}
