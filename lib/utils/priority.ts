import type { PriorityLevel } from '@/types'

export const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  top: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
}

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  top: 'Top Priority',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export const PRIORITY_BG: Record<PriorityLevel, string> = {
  top: 'bg-red-500/10',
  high: 'bg-orange-500/10',
  medium: 'bg-yellow-500/10',
  low: 'bg-green-500/10',
}

export const PRIORITY_BORDER: Record<PriorityLevel, string> = {
  top: 'border-red-500/30',
  high: 'border-orange-500/30',
  medium: 'border-yellow-500/30',
  low: 'border-green-500/30',
}

export function scoreToPriorityLevel(score: number): PriorityLevel {
  if (score >= 90) return 'top'
  if (score >= 70) return 'high'
  if (score >= 50) return 'medium'
  return 'low'
}
