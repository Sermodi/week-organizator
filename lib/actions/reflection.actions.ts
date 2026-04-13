'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const UpsertReflectionSchema = z.object({
  week_id: z.string().uuid(),
  what_worked: z.string().optional(),
  what_didnt: z.string().optional(),
  what_to_change: z.string().optional(),
  overall_rating: z.number().int().min(1).max(5).optional(),
})

export async function upsertReflection(data: z.infer<typeof UpsertReflectionSchema>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const parsed = UpsertReflectionSchema.safeParse(data)
  if (!parsed.success) return { error: 'Invalid input' }

  const { error } = await supabase.from('reflections').upsert({
    ...parsed.data,
    user_id: user.id,
  }, { onConflict: 'week_id' })

  if (error) return { error: error.message }
  revalidatePath(`/plan/${parsed.data.week_id}/step5`)
}

export async function completeStep5(weekId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: reflection } = await supabase.from('reflections').select('*').eq('week_id', weekId).single()
  if (!reflection?.what_worked || !reflection?.what_didnt || !reflection?.what_to_change) {
    return { error: 'Fill in all three reflection fields before finishing.' }
  }

  const { data: week } = await supabase.from('weeks').select('completed_steps').eq('id', weekId).single()
  const steps = week?.completed_steps ?? []
  if (!steps.includes(5)) steps.push(5)
  await supabase.from('weeks').update({ completed_steps: steps, current_step: 5, status: 'completed' }).eq('id', weekId).eq('user_id', user.id)

  revalidatePath('/dashboard')
  redirect('/dashboard')
}
