import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle, SkipForward, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'
import { ProfileAvatar } from '@/components/ProfileAvatar'
import { format } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'
import { useActiveChallenge } from '@/hooks/useChallenge'
import { useTodayTasks } from '@/hooks/useChallenge'
import { getDayNumber } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { ChallengeSelector } from '@/components/ChallengeSelector'

const MOOD_OPTIONS = [
  { value: 1, emoji: '😫', label: 'Rough' },
  { value: 2, emoji: '😕', label: 'Meh' },
  { value: 3, emoji: '😊', label: 'Good' },
  { value: 4, emoji: '😄', label: 'Great' },
  { value: 5, emoji: '🤩', label: 'Amazing' },
]

const TIME_SECTIONS = ['Morning', 'Midday', 'Afternoon', 'Evening', 'Night'] as const

// Use structured time_of_day field when available, fall back to parsing title prefix for old tasks
function getTaskTimeSection(task: { title: string; time_of_day?: string | null }): string {
  if (task.time_of_day) {
    return task.time_of_day.charAt(0).toUpperCase() + task.time_of_day.slice(1)
  }
  const prefix = task.title.split(':')[0].trim()
  return (TIME_SECTIONS as readonly string[]).includes(prefix) ? prefix : 'Other'
}

// New tasks have no time prefix in title; old tasks still need the prefix stripped
function getTaskDisplayTitle(task: { title: string; time_of_day?: string | null }): string {
  if (task.time_of_day) return task.title
  const colon = task.title.indexOf(':')
  if (colon === -1) return task.title
  const prefix = task.title.slice(0, colon).trim()
  return (TIME_SECTIONS as readonly string[]).includes(prefix)
    ? task.title.slice(colon + 1).trim()
    : task.title
}

export function LogPage() {
  const { user } = useAuth()
  const { challenge } = useActiveChallenge(user?.id)
  const dayNumber = challenge ? getDayNumber(challenge.start_date) : 1
  const { tasks, logs, loading, logTask } = useTodayTasks(challenge?.id, dayNumber)

  const [expandedTask, setExpandedTask] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [mood, setMood] = useState<number>(3)
  const [showMoodPicker, setShowMoodPicker] = useState(false)

  async function handleLog(taskId: string, status: 'completed' | 'skipped' | 'partial') {
    await logTask(taskId, status, notes[taskId])
  }

  const completedCount = logs.filter(l => l.status === 'completed').length
  const totalTasks = tasks.length
  const allDone = totalTasks > 0 && completedCount === totalTasks
  const progressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0

  // Group tasks by time of day in defined order
  const tasksByTime: Record<string, typeof tasks> = {}
  for (const section of TIME_SECTIONS) {
    const sectionTasks = tasks.filter(t => getTaskTimeSection(t) === section)
    if (sectionTasks.length > 0) tasksByTime[section] = sectionTasks
  }
  const otherTasks = tasks.filter(t => getTaskTimeSection(t) === 'Other')
  if (otherTasks.length > 0) tasksByTime['Other'] = otherTasks

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-lavender-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-peach-50/50 to-white dark:from-dark-200 dark:to-dark-300 pb-24">
      <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="px-4 pt-8 sm:pt-12 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Daily Log</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {format(new Date(), 'EEEE, MMMM d')} · Day {dayNumber}
            </p>
          </div>
          <ProfileAvatar />
        </div>
      </div>

      <ChallengeSelector userId={user?.id} />

      <div className="px-4 pb-2 flex flex-col gap-4">
        {/* Progress header */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedCount}/{totalTasks}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">tasks completed today</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-lavender-500 dark:text-lavender-400">{progressPct}%</p>
              {allDone && <p className="text-xs text-mint-500 font-medium">Perfect day! 🌟</p>}
            </div>
          </div>
          <div className="w-full h-2.5 bg-gray-100 dark:bg-dark-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-lavender-400 to-mint-400"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </Card>

        {/* Mood check-in */}
        <Card className="p-4">
          <button
            onClick={() => setShowMoodPicker(p => !p)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{MOOD_OPTIONS.find(m => m.value === mood)?.emoji}</span>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">How are you feeling?</p>
                <p className="text-xs text-gray-400">{MOOD_OPTIONS.find(m => m.value === mood)?.label}</p>
              </div>
            </div>
            {showMoodPicker ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          <AnimatePresence>
            {showMoodPicker && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex justify-around pt-4">
                  {MOOD_OPTIONS.map(m => (
                    <button
                      key={m.value}
                      onClick={() => { setMood(m.value); setShowMoodPicker(false) }}
                      className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${
                        mood === m.value ? 'bg-lavender-100 dark:bg-lavender-500/20 scale-110' : 'hover:bg-gray-50 dark:hover:bg-dark-100'
                      }`}
                    >
                      <span className="text-2xl">{m.emoji}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{m.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Tasks grouped by time of day */}
        {Object.entries(tasksByTime).map(([timeSection, sectionTasks]) => {
          const sectionLogs = logs.filter(l => sectionTasks.some(t => t.id === l.task_id))
          const sectionCompleted = sectionLogs.filter(l => l.status === 'completed').length

          return (
            <Card key={timeSection} className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{timeSection}</h3>
                <span className="text-xs text-gray-400">{sectionCompleted}/{sectionTasks.length} done</span>
              </div>

              <div className="flex flex-col gap-2">
                {sectionTasks.map(task => {
                  const log = logs.find(l => l.task_id === task.id)
                  const isExpanded = expandedTask === task.id
                  const isCompleted = log?.status === 'completed'
                  const isSkipped = log?.status === 'skipped'
                  const segmentIcon = (task as any).segment?.icon || '🎯'

                  return (
                    <div key={task.id}>
                      <div
                        className={`
                          flex items-center gap-3 p-3 rounded-2xl transition-all
                          ${isCompleted ? 'bg-mint-50 dark:bg-mint-500/10' :
                            isSkipped ? 'bg-gray-50 dark:bg-dark-100/50 opacity-70' :
                            'bg-gray-50 dark:bg-dark-100/50'}
                        `}
                      >
                        <button
                          onClick={() => handleLog(task.id, isCompleted ? 'skipped' : 'completed')}
                          className="flex-shrink-0"
                        >
                          {isCompleted ? (
                            <CheckCircle2 size={22} className="text-mint-500" />
                          ) : (
                            <Circle size={22} className="text-gray-300 dark:text-gray-600" />
                          )}
                        </button>

                        <span className="text-base flex-shrink-0">{segmentIcon}</span>

                        <div className="flex-1 min-w-0">
                          <span className={`text-sm ${isCompleted ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                            {getTaskDisplayTitle(task)}
                          </span>
                          {task.floor_task && !isCompleted && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 italic">
                              {task.floor_task}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {!isCompleted && (
                            <button
                              onClick={() => handleLog(task.id, 'skipped')}
                              className="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-dark-50"
                            >
                              <SkipForward size={14} className="text-gray-400" />
                            </button>
                          )}
                          <button
                            onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                            className="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-dark-50"
                          >
                            <MessageSquare size={14} className="text-gray-400" />
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden pl-8 sm:pl-10 pr-2 pt-2"
                          >
                            <Textarea
                              placeholder="Add a note about this task..."
                              value={notes[task.id] || log?.notes || ''}
                              onChange={e => setNotes(prev => ({ ...prev, [task.id]: e.target.value }))}
                              className="text-sm min-h-[60px]"
                              rows={2}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </Card>
          )
        })}

        {allDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6"
          >
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Day {dayNumber} complete!</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">You crushed it today. Keep going!</p>
          </motion.div>
        )}
      </div>
      </div>
    </div>
  )
}
