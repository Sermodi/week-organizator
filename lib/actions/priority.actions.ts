'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const UpsertPrioritySchema = z.object({
  week_id: z.string().uuid(),
  brain_dump_item_id: z.string().uuid(),
  title: z.string().min(1),
  area_id: z.string().uuid().nullable(),
  score: z.number().int().min(0).max(100).optional(),
  classification: z.enum(['top_priority', 'essential', 'not_essential']).optional(),
  is_number_one: z.boolean().optional(),
})

export async function upsertPriority(data: z.infer<typeof UpsertPrioritySchema>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const parsed = UpsertPrioritySchema.safeParse(data)
  if (!parsed.success) return { error: 'Invalid input' }

  const { error } = await supabase.from('priorities').upsert({
    ...parsed.data,
    user_id: user.id,
  }, { onConflict: 'week_id,brain_dump_item_id' })

  if (error) return { error: error.message }
  revalidatePath(`/plan/${parsed.data.week_id}/step2`)
}

export async function setNumberOnePriority(priorityId: string, weekId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Clear all is_number_one for this week
  await supabase.from('priorities').update({ is_number_one: false }).eq('week_id', weekId).eq('user_id', user.id)
  // Set selected one
  await supabase.from('priorities').update({ is_number_one: true }).eq('id', priorityId).eq('user_id', user.id)
  revalidatePath(`/plan/${weekId}/step2`)
}

export async function completeStep2(weekId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: priorities } = await supabase
    .from('priorities')
    .select('classification, is_number_one')
    .eq('week_id', weekId)
    .not('classification', 'is', null)

  if (!priorities?.length) return { error: 'Classify at least one priority before continuing.' }

  const hasNumberOne = priorities.some(p => p.is_number_one)
  if (!hasNumberOne) return { error: 'Select your #1 priority before continuing.' }

  const { data: week } = await supabase.from('weeks').select('completed_steps').eq('id', weekId).single()
  const steps: number[] = week?.completed_steps ?? []
  if (!steps.includes(2)) steps.push(2)

  await supabase.from('weeks').update({ completed_steps: steps, current_step: 3 }).eq('id', weekId).eq('user_id', user.id)

  revalidatePath(`/plan/${weekId}`)
  redirect(`/plan/${weekId}/step3`)
}
