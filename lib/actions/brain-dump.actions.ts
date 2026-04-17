'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const CreateItemSchema = z.object({
  content: z.string().min(1).max(500),
  area_id: z.string().uuid(),
  week_id: z.string().uuid(),
})

export async function createBrainDumpItem(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const parsed = CreateItemSchema.safeParse({
    content: formData.get('content'),
    area_id: formData.get('area_id') || null,
    week_id: formData.get('week_id'),
  })
  if (!parsed.success) return { error: 'Invalid input' }

  const { data: existing } = await supabase
    .from('brain_dump_items')
    .select('sort_order')
    .eq('week_id', parsed.data.week_id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const { error } = await supabase.from('brain_dump_items').insert({
    ...parsed.data,
    user_id: user.id,
    sort_order: (existing?.sort_order ?? -1) + 1,
  })
  if (error) return { error: error.message }

  revalidatePath(`/plan/${parsed.data.week_id}/step1`)
}

export async function deleteBrainDumpItem(id: string, weekId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  await supabase.from('brain_dump_items').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath(`/plan/${weekId}/step1`)
}

export async function updateBrainDumpItemArea(id: string, areaId: string | null, weekId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  await supabase.from('brain_dump_items').update({ area_id: areaId }).eq('id', id).eq('user_id', user.id)
  revalidatePath(`/plan/${weekId}/step1`)
}

export async function completeStep1(weekId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: allItems, count } = await supabase
    .from('brain_dump_items')
    .select('area_id', { count: 'exact' })
    .eq('week_id', weekId)
  if (!count || count < 1) return { error: 'Añade al menos un elemento para continuar.' }
  if (allItems?.some(i => !i.area_id)) return { error: 'Todos los elementos deben tener un área asignada.' }

  const { data: week } = await supabase
    .from('weeks').select('completed_steps').eq('id', weekId).single()
  const steps: number[] = week?.completed_steps ?? []
  if (!steps.includes(1)) steps.push(1)

  await supabase.from('weeks').update({
    completed_steps: steps,
    current_step: 2,
  }).eq('id', weekId).eq('user_id', user.id)

  revalidatePath(`/plan/${weekId}`)
  redirect(`/plan/${weekId}/step2`)
}
