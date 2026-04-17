'use client'
import { useState, useTransition, useEffect } from 'react'
import { ChevronRight, ChevronLeft, Plus, Trash2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createTask, deleteTask, completeStep3 } from '@/lib/actions/task.actions'
import { PRIORITY_COLORS, PRIORITY_BG, PRIORITY_BORDER, scoreToPriorityLevel } from '@/lib/utils/priority'
import type { Week, Priority, Task, Area } from '@/types'
import type { PriorityLevel } from '@/types'
import { WizardShell } from '@/components/wizard/WizardShell'
import Link from 'next/link'

const DEFAULT_VERBS = ['Escribir', 'Construir', 'Revisar', 'Investigar', 'Diseñar', 'Preparar', 'Terminar', 'Enviar', 'Llamar', 'Arreglar', 'Planificar', 'Crear']
const STORAGE_KEY = 'wo_custom_verbs'

function loadCustomVerbs(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}
function saveCustomVerb(verb: string) {
  const existing = loadCustomVerbs()
  if (!existing.includes(verb)) localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, verb]))
}

interface TaskFormState {
  action_verb: string
  concrete_object: string
  victory_condition: string
}

interface Props {
  week: Week
  priorities: Priority[]
  tasks: Task[]
  areas: Area[]
}

function TaskForm({ priority, weekId, onCreated }: { priority: Priority; weekId: string; onCreated: () => void }) {
  const [form, setForm] = useState<TaskFormState>({ action_verb: '', concrete_object: '', victory_condition: '' })
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [verbSuggestions, setVerbSuggestions] = useState<string[]>(DEFAULT_VERBS)

  useEffect(() => {
    const custom = loadCustomVerbs()
    if (custom.length) setVerbSuggestions([...DEFAULT_VERBS, ...custom.filter(v => !DEFAULT_VERBS.includes(v))])
  }, [])

  const priorityLevel: PriorityLevel = priority.score ? scoreToPriorityLevel(priority.score) : 'medium'
  const color = PRIORITY_COLORS[priorityLevel]

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await createTask({
        week_id: weekId,
        priority_id: priority.id,
        action_verb: form.action_verb,
        concrete_object: form.concrete_object,
        victory_condition: form.victory_condition,
        area_id: priority.area_id,
        priority_level: priorityLevel,
      })
      if (result?.error) {
        setError(result.error)
      } else {
        if (form.action_verb && !DEFAULT_VERBS.includes(form.action_verb)) {
          saveCustomVerb(form.action_verb)
          setVerbSuggestions(prev => prev.includes(form.action_verb) ? prev : [...prev, form.action_verb])
        }
        setForm({ action_verb: '', concrete_object: '', victory_condition: '' })
        setError(null)
        onCreated()
      }
    })
  }

  return (
    <div className="mt-3 space-y-3 border-t border-zinc-800 pt-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            value={form.action_verb}
            onChange={e => setForm(f => ({ ...f, action_verb: e.target.value }))}
            placeholder="Verbo de acción (Escribir, Crear…)"
            list="verb-suggestions"
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          <datalist id="verb-suggestions">
            {verbSuggestions.map(v => <option key={v} value={v} />)}
          </datalist>
        </div>
        <div className="flex-[2]">
          <input
            value={form.concrete_object}
            onChange={e => setForm(f => ({ ...f, concrete_object: e.target.value }))}
            placeholder="…¿qué exactamente?"
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
      </div>
      {form.action_verb && form.concrete_object && (
        <p className="text-xs text-zinc-400 italic">Vista previa: &quot;<span className="text-zinc-200">{form.action_verb} {form.concrete_object}</span>&quot;</p>
      )}
      <textarea
        value={form.victory_condition}
        onChange={e => setForm(f => ({ ...f, victory_condition: e.target.value }))}
        placeholder="Listo cuando… (sé específico)"
        rows={2}
        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={isPending || !form.action_verb || !form.concrete_object || form.victory_condition.length < 10}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Añadir tarea
      </button>
    </div>
  )
}

export default function Step3Client({ week, priorities, tasks, areas }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(priorities[0]?.id ?? null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const getTasksForPriority = (priorityId: string) => tasks.filter(t => t.priority_id === priorityId)

  async function handleContinue() {
    startTransition(async () => {
      const result = await completeStep3(week.id)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <WizardShell week={week} stepTitle="Define acciones concretas" stepNumber={3} stepDescription="Para cada prioridad, define exactamente qué harás. Verbo + objeto + condición de éxito.">

      <div className="space-y-3 mb-8">
        {priorities.map(priority => {
          const priorityLevel: PriorityLevel = priority.score ? scoreToPriorityLevel(priority.score) : 'medium'
          const color = PRIORITY_COLORS[priorityLevel]
          const relatedTasks = getTasksForPriority(priority.id)
          const isExpanded = expandedId === priority.id

          return (
            <div key={priority.id} className={cn(
              'border rounded-xl overflow-hidden',
              relatedTasks.length > 0
                ? 'border-zinc-800 bg-zinc-900/50'
                : cn(PRIORITY_BORDER[priorityLevel], PRIORITY_BG[priorityLevel])
            )}>
              <button
                className="w-full flex items-center gap-3 p-4 text-left"
                onClick={() => setExpandedId(isExpanded ? null : priority.id)}
              >
                <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {priority.is_number_one && <span className="text-xs text-yellow-400 font-medium">⭐ #1</span>}
                    <span className="text-sm font-medium text-zinc-200">{priority.title}</span>
                  </div>
                  <span className="text-xs text-zinc-500">{relatedTasks.length} tarea{relatedTasks.length !== 1 ? 's' : ''} definida{relatedTasks.length !== 1 ? 's' : ''}</span>
                </div>
                {relatedTasks.length > 0 && <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4">
                  {relatedTasks.map(task => (
                    <div key={task.id} className="flex items-start gap-2 py-2 border-t border-zinc-800/50">
                      <div className="flex-1">
                        <p className="text-sm text-zinc-200 font-medium">{task.action_verb} {task.concrete_object}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">Listo cuando: {task.victory_condition}</p>
                      </div>
                      <button
                        onClick={async () => { await deleteTask(task.id, week.id) }}
                        className="text-zinc-600 hover:text-red-400 transition-colors mt-0.5 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <TaskForm priority={priority} weekId={week.id} onCreated={() => {}} />
                </div>
              )}
            </div>
          )
        })}

        {priorities.length === 0 && (
          <p className="text-zinc-500 text-sm text-center py-8">Sin prioridades. Vuelve al Paso 2 para clasificar tus elementos.</p>
        )}
      </div>

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
      <div className="flex justify-between">
        <Link href={`/plan/${week.id}/step2`} className="flex items-center gap-1 px-3 py-2 text-zinc-400 hover:text-zinc-200 text-sm transition-colors">
          <ChevronLeft className="w-4 h-4" /> Atrás
        </Link>
        <button onClick={handleContinue} disabled={isPending} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors">
          Continuar a Planificar <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </WizardShell>
  )
}
