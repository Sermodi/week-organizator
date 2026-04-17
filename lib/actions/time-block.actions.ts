'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const CreateBlockSchema = z.object({
  week_id: z.string().uuid(),
  task_id: z.string().uuid().optional().nullable(),
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  block_type: z.enum(['task', 'fixed_commitment', 'deep_work', 'buffer']).default('task'),
  label: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
})

export async function createTimeBlock(data: z.infer<typeof CreateBlockSchema>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const parsed = CreateBlockSchema.safeParse(data)
  if (!parsed.success) return { error: 'Invalid input' }
  if (parsed.data.end_time <= parsed.data.start_time) return { error: 'La hora de fin debe ser posterior a la de inicio.' }

  const { error } = await supabase.from('time_blocks').insert({ ...parsed.data, user_id: user.id })
  if (error) return { error: error.message }
  revalidatePath(`/plan/${parsed.data.week_id}/step4`)
}

export async function deleteTimeBlock(id: string, weekId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  await supabase.from('time_blocks').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath(`/plan/${weekId}/step4`)
}

export async function completeStep4(weekId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: week } = await supabase.from('weeks').select('completed_steps').eq('id', weekId).single()
  const steps = week?.completed_steps ?? []
  if (!steps.includes(4)) steps.push(4)
  await supabase.from('weeks').update({ completed_steps: steps, current_step: 5 }).eq('id', weekId).eq('user_id', user.id)

  revalidatePath(`/plan/${weekId}`)
  redirect(`/plan/${weekId}/step5`)
}
