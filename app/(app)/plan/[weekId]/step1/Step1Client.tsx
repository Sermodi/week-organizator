'use client'
import { useRef, useState, useEffect, useTransition } from 'react'
import { Plus, Trash2, Timer, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createBrainDumpItem, deleteBrainDumpItem, updateBrainDumpItemArea, completeStep1 } from '@/lib/actions/brain-dump.actions'
import type { Week, BrainDumpItem, Area } from '@/types'
import { WizardShell } from '@/components/wizard/WizardShell'

interface Props {
  week: Week
  items: BrainDumpItem[]
  areas: Area[]
}

export default function Step1Client({ week, items, areas }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null)
  const [timerRunning, setTimerRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const TIMER_KEY = `brain-dump-timer-${week.id}`

  useEffect(() => {
    const saved = localStorage.getItem(TIMER_KEY)
    if (saved) {
      const { seconds, running, savedAt } = JSON.parse(saved)
      if (running) {
        const elapsed = Math.floor((Date.now() - savedAt) / 1000)
        setTimerSeconds(Math.max(0, seconds - elapsed))
        setTimerRunning(seconds - elapsed > 0)
      } else {
        setTimerSeconds(seconds)
        setTimerRunning(false)
      }
    }
  }, [TIMER_KEY])

  useEffect(() => {
    if (!timerRunning || timerSeconds === null) return
    if (timerSeconds <= 0) { setTimerRunning(false); return }
    const interval = setInterval(() => {
      setTimerSeconds(s => {
        const next = (s ?? 0) - 1
        localStorage.setItem(TIMER_KEY, JSON.stringify({ seconds: next, running: next > 0, savedAt: Date.now() }))
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timerRunning, timerSeconds, TIMER_KEY])

  const startTimer = () => {
    const secs = 20 * 60
    setTimerSeconds(secs)
    setTimerRunning(true)
    localStorage.setItem(TIMER_KEY, JSON.stringify({ seconds: secs, running: true, savedAt: Date.now() }))
  }

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  async function handleContinue() {
    startTransition(async () => {
      const result = await completeStep1(week.id)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <WizardShell
      week={week}
      stepTitle="Volcado mental"
      stepNumber={1}
      stepDescription="Escribe todo lo que tienes en la cabeza — sin filtro, sin orden. Solo captura."
    >
      {/* Timer */}
      <div className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-xl mb-6">
        <div className="flex items-center gap-2 text-zinc-400">
          <Timer className="w-4 h-4" />
          <span className="text-sm">Temporizador de 20 minutos</span>
        </div>
        {timerSeconds !== null ? (
          <span className={cn(
            'ml-auto font-mono text-sm font-medium',
            timerSeconds === 0 ? 'text-green-400' : timerRunning ? 'text-violet-400' : 'text-zinc-400'
          )}>
            {timerSeconds === 0 ? '¡Hecho! ✓' : formatTime(timerSeconds)}
          </span>
        ) : (
          <button
            onClick={startTimer}
            className="ml-auto text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            Iniciar
          </button>
        )}
      </div>

      {/* Add item form */}
      <form
        ref={formRef}
        action={async (fd) => {
          fd.append('week_id', week.id)
          await createBrainDumpItem(fd)
          formRef.current?.reset()
        }}
        className="flex gap-2 mb-6"
      >
        <input
          name="content"
          placeholder="¿Qué tienes en la cabeza?"
          required
          className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <button
          type="submit"
          className="px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>

      {/* Items list */}
      <div className="space-y-2 mb-8">
        {items.length === 0 && (
          <p className="text-zinc-500 text-sm text-center py-8">
            Empieza a escribir para capturar tu primer pensamiento.
          </p>
        )}
        {items.map(item => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-lg group"
          >
            <span className="flex-1 text-sm text-zinc-200">{item.content}</span>
            {item.area && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: item.area.color + '40', color: item.area.color }}
              >
                {item.area.name}
              </span>
            )}
            {areas.length > 0 && (
              <select
                defaultValue={item.area_id ?? ''}
                onChange={async (e) => {
                  await updateBrainDumpItemArea(item.id, e.target.value || null, week.id)
                }}
                className="opacity-0 group-hover:opacity-100 text-xs bg-zinc-800 border border-zinc-700 rounded px-1 py-0.5 text-zinc-300 transition-opacity"
              >
                <option value="">Sin área</option>
                {areas.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            )}
            <button
              onClick={async () => { await deleteBrainDumpItem(item.id, week.id) }}
              className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Continue */}
      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
      <div className="flex justify-between items-center">
        <span className="text-zinc-500 text-sm">
          {items.length} elemento{items.length !== 1 ? 's' : ''} capturado{items.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={handleContinue}
          disabled={isPending || items.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Continuar a Priorizar <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </WizardShell>
  )
}
