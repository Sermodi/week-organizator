'use client'
import { useActionState, useState, useTransition } from 'react'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { createArea, updateArea, deleteArea } from '@/lib/actions/area.actions'
import type { Area } from '@/types'

const PRESET_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#64748b']

interface Props { areas: Area[] }

function AreaRow({ area }: { area: Area }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(area.name)
  const [color, setColor] = useState(area.color)
  const [isPending, startTransition] = useTransition()

  const save = () => {
    startTransition(async () => {
      await updateArea(area.id, { name, color })
      setEditing(false)
    })
  }

  if (editing) {
    return (
      <div className="flex items-center gap-3 p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl">
        <div className="w-8 h-8 rounded-lg shrink-0" style={{ backgroundColor: color }} />
        <input value={name} onChange={e => setName(e.target.value)} className="flex-1 bg-transparent text-white text-sm outline-none border-b border-zinc-600 pb-0.5" />
        <div className="flex gap-1">
          {PRESET_COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} className={`w-4 h-4 rounded-full transition-transform ${c === color ? 'scale-125' : ''}`} style={{ backgroundColor: c }} />
          ))}
        </div>
        <button onClick={save} disabled={isPending} className="text-green-400 hover:text-green-300"><Check className="w-4 h-4" /></button>
        <button onClick={() => setEditing(false)} className="text-zinc-500 hover:text-zinc-300"><X className="w-4 h-4" /></button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl group">
      <div className="w-8 h-8 rounded-lg shrink-0" style={{ backgroundColor: area.color }} />
      <span className="flex-1 text-sm text-zinc-200">{area.name}</span>
      <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-300 transition-all"><Pencil className="w-3.5 h-3.5" /></button>
      <button onClick={async () => { await deleteArea(area.id) }} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
    </div>
  )
}

export default function AreasClient({ areas }: Props) {
  const [state, action, pending] = useActionState(createArea, undefined)
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0])

  return (
    <div>
      {/* Add area form */}
      <form action={(fd) => { fd.append('color', selectedColor); action(fd) }} className="flex gap-2 mb-6">
        <input name="name" required placeholder="New area name…" className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500" />
        <div className="flex items-center gap-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg">
          {PRESET_COLORS.map(c => (
            <button type="button" key={c} onClick={() => setSelectedColor(c)} className={`w-4 h-4 rounded-full transition-transform ${c === selectedColor ? 'scale-125' : ''}`} style={{ backgroundColor: c }} />
          ))}
        </div>
        <button type="submit" disabled={pending} className="px-3 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </form>
      {state?.error && <p className="text-red-400 text-sm mb-4">{state.error}</p>}

      {/* Areas list */}
      <div className="space-y-2">
        {areas.length === 0 && <p className="text-zinc-500 text-sm text-center py-8">No areas yet. Create one to organize your tasks.</p>}
        {areas.map(area => <AreaRow key={area.id} area={area} />)}
      </div>
    </div>
  )
}
