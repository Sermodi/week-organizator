'use client'
import { useState, useTransition, useCallback } from 'react'
import { Star, ChevronRight, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { upsertPriority, setNumberOnePriority, completeStep2 } from '@/lib/actions/priority.actions'
import type { Week, BrainDumpItem, Priority, Area } from '@/types'
import type { Classification } from '@/types'
import { WizardShell } from '@/components/wizard/WizardShell'
import Link from 'next/link'

interface PriorityState {
  id?: string
  score: number
  classification: Classification | null
  is_number_one: boolean
}

interface Props {
  week: Week
  items: BrainDumpItem[]
  existingPriorities: Priority[]
  areas: Area[]
}

const CLASSIFICATION_OPTIONS: { value: Classification; label: string; color: string }[] = [
  { value: 'top_priority', label: 'Top 3', color: 'bg-violet-600 text-white' },
  { value: 'essential', label: 'Esencial', color: 'bg-zinc-700 text-zinc-200' },
  { value: 'not_essential', label: 'Omitir', color: 'bg-zinc-800 text-zinc-400' },
]

export default function Step2Client({ week, items, existingPriorities, areas: _areas }: Props) {
  const [states, setStates] = useState<Record<string, PriorityState>>(() => {
    const initial: Record<string, PriorityState> = {}
    items.forEach(item => {
      const existing = existingPriorities.find(p => p.brain_dump_item_id === item.id)
      initial[item.id] = {
        id: existing?.id,
        score: existing?.score ?? 50,
        classification: existing?.classification ?? null,
        is_number_one: existing?.is_number_one ?? false,
      }
    })
    return initial
  })
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const topPriorityItems = items.filter(i => states[i.id]?.classification === 'top_priority')
  const numberOneId = items.find(i => states[i.id]?.is_number_one)?.id

  const saveItem = useCallback((itemId: string, patch: Partial<PriorityState>) => {
    const item = items.find(i => i.id === itemId)!
    const current = states[itemId]
    const next = { ...current, ...patch }
    setStates(s => ({ ...s, [itemId]: next }))
    setSavingId(itemId)
    startTransition(async () => {
      const result = await upsertPriority({
        week_id: week.id,
        brain_dump_item_id: itemId,
        title: item.content,
        area_id: item.area_id,
        score: next.score,
        classification: next.classification ?? undefined,
        is_number_one: next.is_number_one,
      })
      if (result && 'id' in result) {
        setStates(s => ({ ...s, [itemId]: { ...s[itemId], id: result.id } }))
      }
      setSavingId(null)
    })
  }, [items, states, week.id])

  const handleSetNumberOne = (itemId: string) => {
    const priorityId = states[itemId]?.id
    setStates(s => {
      const next = { ...s }
      Object.keys(next).forEach(k => { next[k] = { ...next[k], is_number_one: false } })
      next[itemId] = { ...next[itemId], is_number_one: true }
      return next
    })
    if (priorityId) {
      startTransition(async () => {
        await setNumberOnePriority(priorityId, week.id)
      })
    }
  }

  async function handleContinue() {
    startTransition(async () => {
      const result = await completeStep2(week.id)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <WizardShell
      week={week}
      stepTitle="Elige lo esencial"
      stepNumber={2}
      stepDescription="Regla del 90%: si no es un SÍ rotundo (puntuación > 90), es un no. Elige máximo 3 prioridades."
    >
      <div className="space-y-3 mb-8">
        {items.map(item => {
          const state = states[item.id]
          const isTop = state.classification === 'top_priority'
          const isNumberOne = state.is_number_one

          return (
            <div
              key={item.id}
              className={cn(
                'p-4 bg-zinc-900 border rounded-xl transition-all',
                isNumberOne ? 'border-yellow-500/50 bg-yellow-500/5' :
                isTop ? 'border-violet-500/40' : 'border-zinc-800'
              )}
            >
              <div className="flex items-start gap-3 mb-3">
                {isTop && (
                  <button
                    onClick={() => handleSetNumberOne(item.id)}
                    title="Mark as #1 priority"
                    className={cn(
                      'mt-0.5 shrink-0 transition-colors',
                      isNumberOne ? 'text-yellow-400' : 'text-zinc-600 hover:text-yellow-400'
                    )}
                  >
                    <Star className="w-4 h-4" fill={isNumberOne ? 'currentColor' : 'none'} />
                  </button>
                )}
                <span className="text-sm text-zinc-200 flex-1">{item.content}</span>
                {savingId === item.id && <span className="text-xs text-zinc-500">guardando…</span>}
              </div>

              {/* Score slider */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-zinc-500 mb-1">
                  <span>Puntuación</span>
                  <span className={cn(
                    'font-medium',
                    state.score >= 90 ? 'text-yellow-400' : state.score >= 70 ? 'text-violet-400' : 'text-zinc-400'
                  )}>
                    {state.score}/100{state.score >= 90 ? ' ✓ SÍ' : ''}
                  </span>
                </div>
                <input
                  type="range" min="0" max="100" step="5"
                  value={state.score}
                  onChange={e => saveItem(item.id, { score: Number(e.target.value) })}
                  className="w-full accent-violet-500"
                />
              </div>

              {/* Classification */}
              <div className="flex gap-2">
                {CLASSIFICATION_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => saveItem(item.id, { classification: opt.value })}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-lg font-medium transition-colors',
                      state.classification === opt.value ? opt.color : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      {topPriorityItems.length > 0 && (
        <div className="p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl mb-6">
          <p className="text-sm text-violet-300 font-medium mb-2">
            {topPriorityItems.length}/3 prioridades top seleccionadas
          </p>
          {!numberOneId && (
            <p className="text-xs text-zinc-400">
              ⭐ Haz clic en la estrella de tu prioridad más importante para marcarla como #1.
            </p>
          )}
          {numberOneId && (
            <p className="text-xs text-yellow-400">
              ⭐ #1: {items.find(i => i.id === numberOneId)?.content}
            </p>
          )}
        </div>
      )}

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
      <div className="flex justify-between">
        <Link
          href={`/plan/${week.id}/step1`}
          className="flex items-center gap-1 px-3 py-2 text-zinc-400 hover:text-zinc-200 text-sm transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Atrás
        </Link>
        <button
          onClick={handleContinue}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Continuar a Definir acciones <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </WizardShell>
  )
}
