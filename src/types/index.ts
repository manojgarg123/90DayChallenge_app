export interface Profile {
  id: string
  user_id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export interface Challenge {
  id: string
  user_id: string
  title: string
  goal_description: string
  start_date: string
  end_date: string
  status: 'active' | 'completed' | 'abandoned'
  created_at: string
}

export interface Segment {
  id: string
  challenge_id: string
  name: string
  description: string
  icon: string
  color: string
  order_index: number
  created_at: string
}

export interface Task {
  id: string
  challenge_id: string
  segment_id: string
  title: string
  description: string | null
  day_number: number
  week_number: number
  frequency: 'daily' | 'weekly' | 'once'
  created_at: string
}

export interface ProgressLog {
  id: string
  user_id: string
  task_id: string
  challenge_id: string
  logged_date: string
  status: 'completed' | 'skipped' | 'partial'
  notes: string | null
  mood: number | null
  created_at: string
}

export interface WeeklySummary {
  id: string
  user_id: string
  challenge_id: string
  week_number: number
  total_tasks: number
  completed_tasks: number
  skipped_tasks: number
  completion_rate: number
  notes: string | null
  created_at: string
}

export interface Nudge {
  id: string
  user_id: string
  challenge_id: string
  message: string
  type: 'motivation' | 'reminder' | 'milestone' | 'warning'
  read: boolean
  scheduled_for: string
  created_at: string
}

export interface DayPlan {
  dayNumber: number
  weekNumber: number
  tasks: Task[]
  logs: ProgressLog[]
}

export interface SegmentProgress {
  segment: Segment
  totalTasks: number
  completedTasks: number
  completionRate: number
}

export interface ChallengeWithProgress extends Challenge {
  segments: SegmentProgress[]
  overallCompletionRate: number
  currentStreak: number
  longestStreak: number
  currentDay: number
}

export type ThemeMode = 'light' | 'dark'
