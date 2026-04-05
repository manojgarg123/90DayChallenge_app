import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProfileAvatar } from '@/components/ProfileAvatar'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useActiveChallenge } from '@/hooks/useChallenge'
import { getDayNumber, getChallengeDuration, formatShortDate } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { addDays, format } from 'date-fns'
import type { Task, ProgressLog } from '@/types'

const BADGE_VARIANTS = ['lavender', 'mint', 'peach', 'sky', 'blush'] as const

export function PlanPage() {
  const { user } = useAuth()
  const { challenge, segments, loading } = useActiveChallenge(user?.id)
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [tasks, setTasks] = useState<Task[]>([])
  const [logs, setLogs] = useState<ProgressLog[]>([])
  const [loadingTasks, setLoadingTasks] = useState(false)

  const totalDays = challenge ? getChallengeDuration(challenge.start_date, challenge.end_date) : 84
  const totalWeeks = Math.ceil(totalDays / 7)
  const currentDay = challenge ? getDayNumber(challenge.start_date, challenge.end_date) : 1
  const currentWeek = Math.ceil(currentDay / 7)

  useEffect(() => {
    if (challenge) {
      setSelectedWeek(currentWeek)
    }
  }, [challenge, currentWeek])

  useEffect(() => {
    if (challenge && selectedWeek) {
      fetchWeekTasks()
    }
  }, [challenge, selectedWeek])

  async function fetchWeekTasks() {
    if (!challenge) return
    setLoadingTasks(true)
    const startDay = (selectedWeek - 1) * 7 + 1
    const endDay = Math.min(selectedWeek * 7, totalDays)

    const [tasksRes, logsRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('*, segment:segments(name, icon, color)')
        .eq('challenge_id', challenge.id)
        .gte('day_number', startDay)
        .lte('day_number', endDay)
        .order('day_number')
        .order('segment_id'),
      supabase
        .from('progress_logs')
        .select('*')
        .eq('challenge_id', challenge.id)
        .gte('day_number', startDay)
        .lte('day_number', endDay),
    ])

    if (tasksRes.data) setTasks(tasksRes.data as Task[])
    if (logsRes.data) setLogs(logsRes.data)
    setLoadingTasks(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-lavender-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 text-center">
        <div>
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-500 dark:text-gray-400">No active challenge</p>
        </div>
      </div>
    )
  }

  // Group tasks by day
  const tasksByDay: Record<number, Task[]> = {}
  for (const task of tasks) {
    if (!tasksByDay[task.day_number]) tasksByDay[task.day_number] = []
    tasksByDay[task.day_number].push(task)
  }

  const startDay = (selectedWeek - 1) * 7 + 1
  const days = Array.from({ length: Math.min(7, totalDays - startDay + 1) }, (_, i) => startDay + i)

  return (
    <div className="min-h-screen bg-gradient-to-b from-lavender-50/50 to-white dark:from-dark-200 dark:to-dark-300 pb-24">
      <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="px-4 pt-8 sm:pt-12 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Challenge Plan</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{challenge.title}</p>
          </div>
          <ProfileAvatar />
        </div>
      </div>

      {/* Segment legend */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 flex-wrap">
          {segments.map((seg, i) => (
            <Badge key={seg.id} variant={BADGE_VARIANTS[i % BADGE_VARIANTS.length]} size="sm">
              {seg.icon} {seg.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Week navigator */}
      <div className="px-4 mb-4">
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedWeek(w => Math.max(1, w - 1))}
              disabled={selectedWeek === 1}
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-dark-100 disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex-1 overflow-x-auto flex gap-1 no-scrollbar">
              {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(w => (
                <button
                  key={w}
                  onClick={() => setSelectedWeek(w)}
                  className={`
                    flex-shrink-0 w-9 h-9 rounded-xl text-sm font-semibold transition-all
                    ${selectedWeek === w
                      ? 'bg-lavender-400 text-white shadow-pastel'
                      : w === currentWeek
                      ? 'border-2 border-lavender-300 dark:border-lavender-500 text-lavender-600 dark:text-lavender-400'
                      : w < currentWeek
                      ? 'bg-mint-100 dark:bg-mint-500/20 text-mint-700 dark:text-mint-400'
                      : 'bg-gray-100 dark:bg-dark-100 text-gray-500 dark:text-gray-400'
                    }
                  `}
                >
                  {w}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSelectedWeek(w => Math.min(totalWeeks, w + 1))}
              disabled={selectedWeek === totalWeeks}
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-dark-100 disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </Card>
      </div>

      {/* Week label */}
      <div className="px-4 mb-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Week {selectedWeek}
            {selectedWeek === currentWeek && (
              <span className="ml-2 text-xs font-normal text-lavender-500 dark:text-lavender-400">(current)</span>
            )}
          </h2>
          <span className="text-xs text-gray-400">
            Days {startDay}–{Math.min(selectedWeek * 7, totalDays)}
          </span>
        </div>
      </div>

      {/* Days */}
      <div className="px-4 pb-2 flex flex-col gap-3">
        {loadingTasks ? (
          [...Array(7)].map((_, i) => (
            <div key={i} className="h-20 bg-white/60 dark:bg-dark-50/60 rounded-3xl animate-pulse" />
          ))
        ) : (
          days.map((dayNum) => {
            const dayTasks = tasksByDay[dayNum] || []
            const dayLogs = logs.filter(l => dayTasks.some(t => t.id === l.task_id))
            const completedCount = dayLogs.filter(l => l.status === 'completed').length
            const isToday = dayNum === currentDay
            const isPast = dayNum < currentDay
            const isFuture = dayNum > currentDay

            const dayDate = challenge
              ? addDays(new Date(challenge.start_date), dayNum - 1)
              : new Date()

            return (
              <motion.div
                key={dayNum}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (dayNum - startDay) * 0.04 }}
              >
                <Card
                  className={`p-4 ${isToday ? 'border-2 border-lavender-300 dark:border-lavender-500' : ''}`}
                  glow={isToday}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`
                      w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0
                      ${isToday ? 'bg-lavender-400 text-white' :
                        isPast ? 'bg-mint-100 dark:bg-mint-500/20 text-mint-700 dark:text-mint-400' :
                        'bg-gray-100 dark:bg-dark-100 text-gray-500 dark:text-gray-400'}
                    `}>
                      {dayNum}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {format(dayDate, 'EEE, MMM d')}
                        </span>
                        {isToday && (
                          <Badge variant="lavender" size="sm">Today</Badge>
                        )}
                        {isPast && completedCount === dayTasks.length && dayTasks.length > 0 && (
                          <Badge variant="mint" size="sm">✓ Done</Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''}
                        {dayTasks.length > 0 && ` · ${completedCount} completed`}
                      </span>
                    </div>
                  </div>

                  {dayTasks.length > 0 && (
                    <div className="flex flex-col gap-1.5 pl-8 sm:pl-12">
                      {dayTasks.map(task => {
                        const taskLog = dayLogs.find(l => l.task_id === task.id)
                        const done = taskLog?.status === 'completed'
                        return (
                          <div key={task.id} className="flex items-center gap-2">
                            <span className="text-xs">
                              {(task as any).segment?.icon || '🎯'}
                            </span>
                            <span className={`text-xs ${done ? 'line-through text-gray-400 dark:text-gray-600' : isFuture ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                              {task.title}
                            </span>
                            {done && <span className="text-xs">✅</span>}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Card>
              </motion.div>
            )
          })
        )}
      </div>
      </div>
    </div>
  )
}
