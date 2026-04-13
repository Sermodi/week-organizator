import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Step4Client from './Step4Client'

export default async function Step4Page({ params }: { params: Promise<{ weekId: string }> }) {
  const { weekId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: week } = await supabase.from('weeks').select('*').eq('id', weekId).eq('user_id', user.id).single()
  if (!week) notFound()

  const { data: tasks } = await supabase
    .from('tasks').select('*, area:areas(*)')
    .eq('week_id', weekId).order('sort_order')

  const { data: blocks } = await supabase
    .from('time_blocks').select('*, task:tasks(*)')
    .eq('week_id', weekId)

  return <Step4Client week={week} tasks={tasks ?? []} blocks={blocks ?? []} />
}
