'use client'
import { useState, useTransition } from 'react'
import { ChevronRight, ChevronLeft, Plus, X, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createTimeBlock, deleteTimeBlock, completeStep4 } from '@/lib/actions/time-block.actions'
import { PRIORITY_COLORS } from '@/lib/utils/priority'
import { DAY_NAMES } from '@/lib/utils/week'
import type { Week, Task, TimeBlock } from '@/types'
import type { PriorityLevel } from '@/types'
import { WizardShell } from '@/components/wizard/WizardShell'
import Link from 'next/link'

const HOURS = Array.from({ length: 16 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`)

interface Props {
  week: Week
  tasks: Task[]
  blocks: TimeBlock[]
}

interface AddBlockState {
  taskId: string
  day: number
  startTime: string
  endTime: string
  blockType: 'task' | 'fixed_commitment' | 'deep_work' | 'buffer'
  label: string
}

export default function Step4Client({ week, tasks, blocks }: Props) {
  const [adding, setAdding] = useState<Partial<AddBlockState> | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const scheduledTaskIds = new Set(blocks.filter(b => b.task_id).map(b => b.task_id!))
  const unscheduledTasks = tasks.filter(t => !scheduledTaskIds.has(t.id))
  const topTask = tasks.find(t => t.priority_level === 'top')

  async function handleAddBlock() {
    if (!adding) return
    startTransition(async () => {
      const result = await createTimeBlock({
        week_id: week.id,
        task_id: adding.taskId || null,
        day_of_week: adding.day ?? 0,
        start_time: adding.startTime ?? '09:00',
        end_time: adding.endTime ?? '10:00',
        block_type: adding.blockType ?? 'task',
        label: adding.label || null,
      })
      if (result?.error) setError(result.error)
      else setAdding(null)
    })
  }

  async function handleContinue() {
    startTransition(async () => {
      const result = await completeStep4(week.id)
      if (result?.error) setError(result.error)
    })
  }

  const getBlocksForDay = (day: number) => blocks.filter(b => b.day_of_week === day)

  return (
    <WizardShell week={week} stepTitle="Bloquea tu tiempo" stepNumber={4} stepDescription="Asigna tareas a días. Programa trabajo profundo para tu prioridad #1 primero.">

      {/* Top priority suggestion */}
      {topTask && !scheduledTaskIds.has(topTask.id) && (
        <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl mb-6 text-sm">
          <span className="text-yellow-400">⭐</span>
          <span className="text-zinc-300">Programa tu #1 primero: <span className="text-white font-medium">{topTask.action_verb} {topTask.concrete_object}</span></span>
          <button
            onClick={() => setAdding({ taskId: topTask.id, blockType: 'deep_work' })}
            className="ml-auto text-xs text-yellow-400 hover:text-yellow-300 font-medium"
          >
            Programar →
          </button>
        </div>
      )}

      {/* Weekly overview */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {DAY_NAMES.map((day, i) => {
          const dayBlocks = getBlocksForDay(i)
          return (
            <div key={i} className="min-h-24">
              <div className="text-xs text-zinc-500 font-medium mb-1 text-center">{day}</div>
              <div className="space-y-1">
                {dayBlocks.map(block => {
                  const task = block.task_id ? tasks.find(t => t.id === block.task_id) : undefined
                  const color = task?.area?.color ?? (task?.priority_level ? PRIORITY_COLORS[task.priority_level as PriorityLevel] : '#6366f1')
                  return (
                    <div key={block.id} className="relative group p-1.5 rounded text-xs" style={{ backgroundColor: color + '20', borderLeft: `2px solid ${color}` }}>
                      <p className="text-zinc-200 truncate leading-tight">{task ? `${task.action_verb} ${task.concrete_object}` : block.label ?? block.block_type}</p>
                      <p className="text-zinc-500">{block.start_time.slice(0, 5)}–{block.end_time.slice(0, 5)}</p>
                      <button
                        onClick={async () => { await deleteTimeBlock(block.id, week.id) }}
                        className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )
                })}
                <button
                  onClick={() => setAdding({ day: i })}
                  className="w-full text-xs text-zinc-600 hover:text-zinc-400 py-1 border border-dashed border-zinc-800 hover:border-zinc-600 rounded transition-colors"
                >
                  <Plus className="w-3 h-3 mx-auto" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Unscheduled tasks */}
      {unscheduledTasks.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs text-zinc-500 font-medium mb-2 uppercase tracking-wide">Tareas sin programar</h3>
          <div className="flex flex-wrap gap-2">
            {unscheduledTasks.map(task => {
              const color = task.area?.color ?? (task.priority_level ? PRIORITY_COLORS[task.priority_level as PriorityLevel] : '#71717a')
              return (
                <button
                  key={task.id}
                  onClick={() => setAdding({ taskId: task.id })}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{ backgroundColor: color + '20', color, border: `1px solid ${color}40` }}
                >
                  <Clock className="w-3 h-3" />
                  {task.action_verb} {task.concrete_object}
                  {task.area && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs" style={{ backgroundColor: color + '33', color }}>
                      {task.area.name}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Add block modal/form */}
      {adding !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-sm font-semibold text-white">Añadir bloque de tiempo</h3>
            <div className="space-y-3">
              {!adding.taskId && (
                <select
                  onChange={e => setAdding(a => ({ ...a, taskId: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white"
                >
                  <option value="">Sin tarea (añade etiqueta abajo)</option>
                  {tasks.map(t => <option key={t.id} value={t.id}>{t.action_verb} {t.concrete_object}</option>)}
                </select>
              )}
              {adding.taskId && (() => {
                const t = tasks.find(t => t.id === adding.taskId)
                return t ? (
                  <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
                    <span>Tarea: <span className="text-white">{t.action_verb} {t.concrete_object}</span></span>
                    {t.area && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: t.area.color + '33', color: t.area.color }}>
                        {t.area.name}
                      </span>
                    )}
                  </div>
                ) : null
              })()}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Día</label>
                  <select
                    value={adding.day ?? 0}
                    onChange={e => setAdding(a => ({ ...a, day: Number(e.target.value) }))}
                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white"
                  >
                    {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Tipo</label>
                  <select
                    value={adding.blockType ?? 'task'}
                    onChange={e => setAdding(a => ({ ...a, blockType: e.target.value as 'task' | 'fixed_commitment' | 'deep_work' | 'buffer' }))}
                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white"
                  >
                    <option value="task">Tarea</option>
                    <option value="deep_work">Trabajo profundo</option>
                    <option value="fixed_commitment">Compromiso fijo</option>
                    <option value="buffer">Margen</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Inicio</label>
                  <select
                    value={adding.startTime ?? '09:00'}
                    onChange={e => {
                      const start = e.target.value
                      setAdding(a => ({
                        ...a,
                        startTime: start,
                        endTime: (a?.endTime ?? '10:00') > start ? (a?.endTime ?? '10:00') : HOURS[HOURS.indexOf(start) + 1] ?? start,
                      }))
                    }}
                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white"
                  >
                    {HOURS.slice(0, -1).map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Fin</label>
                  <select
                    value={adding.endTime ?? '10:00'}
                    onChange={e => setAdding(a => ({ ...a, endTime: e.target.value }))}
                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white"
                  >
                    {HOURS.filter(h => h > (adding.startTime ?? '09:00')).map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              {!adding.taskId && (
                <input
                  placeholder="Etiqueta (ej. Reunión de mañana)"
                  value={adding.label ?? ''}
                  onChange={e => setAdding(a => ({ ...a, label: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500"
                />
              )}
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAdding(null)} className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">Cancelar</button>
              <button onClick={handleAddBlock} disabled={isPending} className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm rounded-lg transition-colors">
                Añadir bloque
              </button>
            </div>
          </div>
        </div>
      )}

      {error && !adding && <p className="text-red-400 text-sm mb-3">{error}</p>}
      <div className="flex justify-between">
        <Link href={`/plan/${week.id}/step3`} className="flex items-center gap-1 px-3 py-2 text-zinc-400 hover:text-zinc-200 text-sm transition-colors">
          <ChevronLeft className="w-4 h-4" /> Atrás
        </Link>
        <button onClick={handleContinue} disabled={isPending} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors">
          Continuar a Reflexión <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </WizardShell>
  )
}
