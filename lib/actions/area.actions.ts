'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const AreaSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
})

export async function createArea(
  _prev: { error: string } | undefined,
  formData: FormData
): Promise<{ error: string } | undefined> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const parsed = AreaSchema.safeParse({
    name: formData.get('name'),
    color: formData.get('color'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const { data: existing } = await supabase.from('areas').select('sort_order').eq('user_id', user.id).order('sort_order', { ascending: false }).limit(1).single()

  const { error } = await supabase.from('areas').insert({
    ...parsed.data,
    user_id: user.id,
    sort_order: (existing?.sort_order ?? -1) + 1,
  })
  if (error) return { error: error.message }
  revalidatePath('/areas')
}

export async function updateArea(id: string, data: { name?: string; color?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  await supabase.from('areas').update(data).eq('id', id).eq('user_id', user.id)
  revalidatePath('/areas')
}

export async function deleteArea(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  await supabase.from('areas').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/areas')
}
