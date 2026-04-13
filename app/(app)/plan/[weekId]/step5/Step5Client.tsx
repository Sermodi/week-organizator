'use client'
import { useState, useTransition } from 'react'
import { ChevronLeft, CheckCircle2 } from 'lucide-react'
import { upsertReflection, completeStep5 } from '@/lib/actions/reflection.actions'
import type { Week, Reflection } from '@/types'
import { WizardShell } from '@/components/wizard/WizardShell'
import Link from 'next/link'

interface Props {
  week: Week
  reflection: Reflection | null
  taskCount: number
  blockCount: number
}

const FIELDS = [
  {
    key: 'what_worked' as const,
    label: '✅ ¿Qué ha funcionado?',
    placeholder: '¿Qué fue bien esta semana? ¿Qué hábitos, sistemas o acciones contribuyeron más?',
  },
  {
    key: 'what_didnt' as const,
    label: '❌ ¿Qué no ha funcionado?',
    placeholder: '¿Dónde falló el plan? ¿Qué causó distracción o falta de foco?',
  },
  {
    key: 'what_to_change' as const,
    label: '🔄 ¿Qué cambiarías?',
    placeholder: 'Un ajuste concreto para la próxima semana que mejore tus resultados.',
  },
]

export default function Step5Client({ week, reflection, taskCount, blockCount }: Props) {
  const [form, setForm] = useState({
    what_worked: reflection?.what_worked ?? '',
    what_didnt: reflection?.what_didnt ?? '',
    what_to_change: reflection?.what_to_change ?? '',
    overall_rating: reflection?.overall_rating ?? 0,
  })
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function save(patch: Partial<typeof form>) {
    const next = { ...form, ...patch }
    setForm(next)
    startTransition(async () => {
      await upsertReflection({
        week_id: week.id,
        ...next,
        overall_rating: next.overall_rating || undefined,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  function handleFinish() {
    startTransition(async () => {
      const result = await completeStep5(week.id)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <WizardShell
      week={week}
      stepTitle="Reflexión semanal"
      stepNumber={5}
      stepDescription="20 minutos para revisar lo que pasó y mejorar la próxima semana."
    >
      {/* Week summary */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
          <p className="text-2xl font-bold text-violet-400">{taskCount}</p>
          <p className="text-xs text-zinc-500 mt-0.5">Tareas definidas</p>
        </div>
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
          <p className="text-2xl font-bold text-violet-400">{blockCount}</p>
          <p className="text-xs text-zinc-500 mt-0.5">Bloques programados</p>
        </div>
      </div>

      {/* Reflection fields */}
      <div className="space-y-4 mb-6">
        {FIELDS.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-zinc-300 mb-2">{label}</label>
            <textarea
              value={form[key]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              onBlur={() => save({ [key]: form[key] })}
              placeholder={placeholder}
              rows={3}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
          </div>
        ))}
      </div>

      {/* Star rating */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-zinc-300 mb-2">¿Cómo fue la semana en general?</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(rating => (
            <button
              key={rating}
              onClick={() => save({ overall_rating: rating })}
              className={`w-10 h-10 rounded-lg text-sm font-semibold transition-colors ${
                form.overall_rating >= rating
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
              }`}
            >
              {rating}
            </button>
          ))}
        </div>
      </div>

      {saved && (
        <div className="flex items-center gap-1.5 text-xs text-green-400 mb-3">
          <CheckCircle2 className="w-3.5 h-3.5" /> Guardado
        </div>
      )}

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <div className="flex justify-between">
        <Link
          href={`/plan/${week.id}/step4`}
          className="flex items-center gap-1 px-3 py-2 text-zinc-400 hover:text-zinc-200 text-sm transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Atrás
        </Link>
        <button
          onClick={handleFinish}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <CheckCircle2 className="w-4 h-4" /> Finalizar semana
        </button>
      </div>
    </WizardShell>
  )
}
