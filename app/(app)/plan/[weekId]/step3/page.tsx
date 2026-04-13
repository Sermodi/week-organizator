import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Step3Client from './Step3Client'

export default async function Step3Page({ params }: { params: Promise<{ weekId: string }> }) {
  const { weekId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: week } = await supabase.from('weeks').select('*').eq('id', weekId).eq('user_id', user.id).single()
  if (!week) notFound()

  const { data: priorities } = await supabase
    .from('priorities')
    .select('*')
    .eq('week_id', weekId)
    .in('classification', ['top_priority', 'essential'])
    .order('is_number_one', { ascending: false })
    .order('score', { ascending: false })

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, area:areas(*)')
    .eq('week_id', weekId)
    .order('sort_order')

  const { data: areas } = await supabase.from('areas').select('*').eq('user_id', user.id)

  return <Step3Client week={week} priorities={priorities ?? []} tasks={tasks ?? []} areas={areas ?? []} />
}
