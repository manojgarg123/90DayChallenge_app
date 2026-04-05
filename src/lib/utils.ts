import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, differenceInDays, addDays, isToday, isBefore, isAfter } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getChallengeDuration(startDate: string, endDate: string): number {
  return differenceInDays(new Date(endDate), new Date(startDate)) + 1
}

export function getDayNumber(startDate: string, endDate?: string): number {
  const totalDays = endDate ? getChallengeDuration(startDate, endDate) : 90
  const today = new Date()
  const diff = differenceInDays(today, new Date(startDate)) + 1
  return Math.max(1, Math.min(totalDays, diff))
}

export function getWeekNumber(dayNumber: number): number {
  return Math.ceil(dayNumber / 7)
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy')
}

export function formatShortDate(date: string | Date): string {
  return format(new Date(date), 'MMM d')
}

export function getDaysRemaining(endDate: string): number {
  return Math.max(0, differenceInDays(new Date(endDate), new Date()) + 1)
}

export function getProgressPercentage(completed: number, total: number): number {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

export function calculateStreak(logs: Array<{ logged_date: string; status: string }>): {
  current: number
  longest: number
} {
  if (!logs.length) return { current: 0, longest: 0 }

  const completedDates = new Set(
    logs
      .filter(l => l.status === 'completed')
      .map(l => l.logged_date.split('T')[0])
  )

  let current = 0
  let longest = 0
  let streak = 0
  let checkDate = new Date()

  // Calculate current streak (going backwards from today)
  while (completedDates.has(format(checkDate, 'yyyy-MM-dd'))) {
    streak++
    checkDate = addDays(checkDate, -1)
  }
  current = streak

  // Calculate longest streak
  const sortedDates = Array.from(completedDates).sort()
  streak = 0
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      streak = 1
    } else {
      const prev = new Date(sortedDates[i - 1])
      const curr = new Date(sortedDates[i])
      const diff = differenceInDays(curr, prev)
      if (diff === 1) {
        streak++
      } else {
        streak = 1
      }
    }
    longest = Math.max(longest, streak)
  }

  return { current, longest }
}

export function getSegmentColor(index: number): string {
  const colors = [
    'lavender', 'mint', 'peach', 'sky', 'blush',
  ]
  return colors[index % colors.length]
}

export function getSegmentIcon(name: string): string {
  const iconMap: Record<string, string> = {
    nutrition: '🥗',
    exercise: '💪',
    fitness: '🏃',
    sleep: '😴',
    mindset: '🧘',
    habits: '✅',
    hydration: '💧',
    recovery: '🔄',
    social: '👥',
    learning: '📚',
    meditation: '🧠',
    stress: '🌿',
    weight: '⚖️',
    cardio: '❤️',
    strength: '🏋️',
    flexibility: '🤸',
    wellness: '🌟',
    default: '🎯',
  }
  const key = name.toLowerCase()
  for (const [k, v] of Object.entries(iconMap)) {
    if (key.includes(k)) return v
  }
  return iconMap.default
}

export function isDayCompleted(
  dayNumber: number,
  tasks: Array<{ id: string }>,
  logs: Array<{ task_id: string; status: string }>
): boolean {
  if (!tasks.length) return false
  const dayLogs = logs.filter(l => tasks.some(t => t.id === l.task_id))
  const completedCount = dayLogs.filter(l => l.status === 'completed').length
  return completedCount === tasks.length
}
