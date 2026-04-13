import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Step1Client from './Step1Client'

export default async function Step1Page({ params }: { params: Promise<{ weekId: string }> }) {
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

  const { data: areas } = await supabase.from('areas').select('*').eq('user_id', user.id).order('sort_order')

  return <Step1Client week={week} items={items ?? []} areas={areas ?? []} />
}
