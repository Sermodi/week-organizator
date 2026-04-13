export type PriorityLevel = 'top' | 'high' | 'medium' | 'low'
export type WeekStatus = 'active' | 'completed' | 'archived'
export type BlockType = 'task' | 'fixed_commitment' | 'deep_work' | 'buffer'
export type Classification = 'top_priority' | 'essential' | 'not_essential'

export interface Area {
  id: string
  user_id: string
  name: string
  color: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Week {
  id: string
  user_id: string
  week_start: string
  current_step: number
  completed_steps: number[]
  status: WeekStatus
  created_at: string
  updated_at: string
}

export interface BrainDumpItem {
  id: string
  week_id: string
  user_id: string
  content: string
  area_id: string | null
  sort_order: number
  created_at: string
  updated_at: string
  area?: Area
}

export interface Priority {
  id: string
  week_id: string
  user_id: string
  brain_dump_item_id: string | null
  title: string
  area_id: string | null
  score: number | null
  classification: Classification | null
  is_number_one: boolean
  sort_order: number
  created_at: string
  updated_at: string
  area?: Area
}

export interface Task {
  id: string
  week_id: string
  user_id: string
  priority_id: string | null
  action_verb: string
  concrete_object: string
  victory_condition: string
  area_id: string | null
  priority_level: PriorityLevel | null
  sort_order: number
  created_at: string
  updated_at: string
  area?: Area
}

export interface TimeBlock {
  id: string
  week_id: string
  user_id: string
  task_id: string | null
  day_of_week: number
  start_time: string
  end_time: string
  block_type: BlockType
  label: string | null
  color: string | null
  created_at: string
  updated_at: string
  task?: Task
}

export interface Reflection {
  id: string
  week_id: string
  user_id: string
  what_worked: string | null
  what_didnt: string | null
  what_to_change: string | null
  overall_rating: number | null
  created_at: string
  updated_at: string
}
