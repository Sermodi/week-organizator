import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getWeekStartString, formatWeekRange } from '@/lib/utils/week'
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react'

const STEP_LABELS = [
  'Volcado mental',
  'Priorizar',
  'Definir acciones',
  'Bloqueo de tiempo',
  'Reflexión',
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const weekStart = getWeekStartString()

  // Get or create current week
  const { data: weekData } = await supabase
    .rpc('get_or_create_week', { p_user_id: user.id, p_week_start: weekStart })

  const { data: week } = await supabase
    .from('weeks')
    .select('*')
    .eq('id', weekData)
    .single()

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <p className="text-zinc-500 text-sm mb-1">Semana actual</p>
        <h1 className="text-2xl font-semibold text-white">{formatWeekRange(weekStart)}</h1>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-4">
        <h2 className="text-sm font-medium text-zinc-400 mb-4">Progreso de planificación</h2>
        <div className="space-y-3">
          {STEP_LABELS.map((label, i) => {
            const stepNum = i + 1
            const done = week?.completed_steps?.includes(stepNum)
            const current = week?.current_step === stepNum
            return (
              <div key={stepNum} className="flex items-center gap-3">
                {done ? (
                  <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />
                ) : (
                  <Circle className={`w-4 h-4 shrink-0 ${current ? 'text-violet-400' : 'text-zinc-600'}`} />
                )}
                <span className={`text-sm ${done ? 'text-zinc-400 line-through' : current ? 'text-white' : 'text-zinc-500'}`}>
                  {label}
                </span>
                {current && (
                  <span className="ml-auto text-xs text-violet-400 font-medium">Actual</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <Link
        href={`/plan/${week?.id}/step${week?.current_step ?? 1}`}
        className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {week?.current_step === 1 ? 'Empezar planificación' : 'Continuar planificación'}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
