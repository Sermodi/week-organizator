'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const CreateTaskSchema = z.object({
  week_id: z.string().uuid(),
  priority_id: z.string().uuid().optional().nullable(),
  action_verb: z.string().min(1).max(50),
  concrete_object: z.string().min(1).max(200),
  victory_condition: z.string().min(10).max(500),
  area_id: z.string().uuid().optional().nullable(),
  priority_level: z.enum(['top', 'high', 'medium', 'low']).optional().nullable(),
})

export async function createTask(data: z.infer<typeof CreateTaskSchema>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const parsed = CreateTaskSchema.safeParse(data)
  if (!parsed.success) return { error: 'Invalid input: ' + parsed.error.issues[0]?.message }

  const { data: existing } = await supabase
    .from('tasks').select('sort_order').eq('week_id', parsed.data.week_id)
    .order('sort_order', { ascending: false }).limit(1).single()

  const { error } = await supabase.from('tasks').insert({
    ...parsed.data,
    user_id: user.id,
    sort_order: (existing?.sort_order ?? -1) + 1,
  })
  if (error) return { error: error.message }
  revalidatePath(`/plan/${parsed.data.week_id}/step3`)
}

export async function deleteTask(id: string, weekId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  await supabase.from('tasks').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath(`/plan/${weekId}/step3`)
}

export async function completeStep3(weekId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { count } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('week_id', weekId)
  if (!count || count < 1) return { error: 'Define at least one task before continuing.' }

  const { data: week } = await supabase.from('weeks').select('completed_steps').eq('id', weekId).single()
  const steps = week?.completed_steps ?? []
  if (!steps.includes(3)) steps.push(3)
  await supabase.from('weeks').update({ completed_steps: steps, current_step: 4 }).eq('id', weekId).eq('user_id', user.id)

  revalidatePath(`/plan/${weekId}`)
  redirect(`/plan/${weekId}/step4`)
}
