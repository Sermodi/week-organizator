import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Step2Client from './Step2Client'

export default async function Step2Page({ params }: { params: Promise<{ weekId: string }> }) {
  const { weekId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: week } = await supabase.from('weeks').select('*').eq('id', weekId).eq('user_id', user.id).single()
  if (!week) notFound()

  const { data: items } = await supabase
    .from('brain_dump_items')
    .select('*, area:areas(*)')
    .eq('week_id', weekId)
    .order('sort_order')

  const { data: priorities } = await supabase
    .from('priorities')
    .select('*')
    .eq('week_id', weekId)

  const { data: areas } = await supabase.from('areas').select('*').eq('user_id', user.id).order('sort_order')

  return <Step2Client week={week} items={items ?? []} existingPriorities={priorities ?? []} areas={areas ?? []} />
}
