import type { Week } from '@/types'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { num: 1, label: 'Capture' },
  { num: 2, label: 'Prioritize' },
  { num: 3, label: 'Define' },
  { num: 4, label: 'Schedule' },
  { num: 5, label: 'Reflect' },
]

interface Props {
  week: Week
  stepNumber: number
  stepTitle: string
  stepDescription: string
  children: React.ReactNode
}

export function WizardShell({ week, stepNumber, stepTitle, stepDescription, children }: Props) {
  return (
    <div className="p-8 max-w-2xl">
      {/* Step progress */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((step, i) => {
          const done = week.completed_steps.includes(step.num)
          const current = step.num === stepNumber
          return (
            <div key={step.num} className="flex items-center gap-2">
              <div className={cn(
                'flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-colors',
                done ? 'bg-violet-600 text-white' :
                current ? 'bg-violet-600/30 border border-violet-500 text-violet-300' :
                'bg-zinc-800 text-zinc-500'
              )}>
                {done ? <Check className="w-3 h-3" /> : step.num}
              </div>
              <span className={cn('text-xs hidden sm:block', current ? 'text-zinc-300' : 'text-zinc-500')}>
                {step.label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={cn('w-8 h-px mx-1', done ? 'bg-violet-600/50' : 'bg-zinc-800')} />
              )}
            </div>
          )
        })}
      </div>

      {/* Step header */}
      <div className="mb-6">
        <div className="text-xs text-violet-400 font-medium mb-1">Step {stepNumber} of 5</div>
        <h1 className="text-2xl font-semibold text-white mb-2">{stepTitle}</h1>
        <p className="text-zinc-400 text-sm">{stepDescription}</p>
      </div>

      {children}
    </div>
  )
}
