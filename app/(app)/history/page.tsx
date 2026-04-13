import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatWeekRange } from '@/lib/utils/week'
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react'

const STEP_LABELS = ['Capturar', 'Priorizar', 'Definir', 'Planificar', 'Reflexionar']

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: weeks } = await supabase
    .from('weeks')
    .select('*, reflections(*)')
    .eq('user_id', user.id)
    .order('week_start', { ascending: false })
    .limit(20)

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Historial</h1>
        <p className="text-zinc-400 text-sm mt-1">Todas tus semanas de planificación.</p>
      </div>

      <div className="space-y-3">
        {!weeks?.length && <p className="text-zinc-500 text-sm text-center py-8">Aún no hay semanas anteriores.</p>}
        {weeks?.map(week => {
          const reflection = Array.isArray(week.reflections) ? week.reflections[0] : week.reflections
          return (
            <Link
              key={week.id}
              href={`/plan/${week.id}/step${week.current_step}`}
              className="flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-colors group"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm font-medium text-white">{formatWeekRange(week.week_start)}</p>
                  {week.status === 'completed' && (
                    <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full">Completada</span>
                  )}
                </div>
                <div className="flex gap-1">
                  {STEP_LABELS.map((label, i) => {
                    const done = week.completed_steps?.includes(i + 1)
                    return (
                      <div key={i} className="flex items-center gap-1">
                        {done
                          ? <CheckCircle2 className="w-3 h-3 text-violet-400" />
                          : <Circle className="w-3 h-3 text-zinc-700" />
                        }
                        <span className={`text-xs hidden sm:block ${done ? 'text-zinc-400' : 'text-zinc-600'}`}>{label}</span>
                      </div>
                    )
                  })}
                </div>
                {reflection?.what_worked && (
                  <p className="text-xs text-zinc-500 mt-2 truncate">"{reflection.what_worked}"</p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
