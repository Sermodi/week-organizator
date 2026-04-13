import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AreasClient from './AreasClient'

export default async function AreasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: areas } = await supabase.from('areas').select('*').eq('user_id', user.id).order('sort_order')

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Áreas</h1>
        <p className="text-zinc-400 text-sm mt-1">Categorías que se mantienen entre semanas.</p>
      </div>
      <AreasClient areas={areas ?? []} />
    </div>
  )
}
