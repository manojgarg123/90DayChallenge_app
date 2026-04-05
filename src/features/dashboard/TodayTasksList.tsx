import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle, Clock, SkipForward } from 'lucide-react'
import { useTodayTasks } from '@/hooks/useChallenge'
import { Card } from '@/components/ui/Card'

interface TodayTasksListProps {
  challengeId: string
  dayNumber: number
  onLogComplete: () => void
}

export function TodayTasksList({ challengeId, dayNumber, onLogComplete }: TodayTasksListProps) {
  const { tasks, logs, loading, logTask } = useTodayTasks(challengeId, dayNumber)

  async function handleToggle(taskId: string) {
    const existingLog = logs.find(l => l.task_id === taskId)
    if (existingLog?.status === 'completed') {
      await logTask(taskId, 'skipped')
    } else {
      await logTask(taskId, 'completed')
      onLogComplete()
    }
  }

  if (loading) {
    return (
      <Card className="p-5">
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 dark:bg-dark-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </Card>
    )
  }

  const completedCount = logs.filter(l => l.status === 'completed').length
  const allDone = tasks.length > 0 && completedCount === tasks.length

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Today's Tasks</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {completedCount}/{tasks.length} completed
          </p>
        </div>
        {allDone && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-sm font-semibold text-mint-600 dark:text-mint-400 flex items-center gap-1"
          >
            <CheckCircle2 size={14} />
            All done! 🎉
          </motion.div>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-400 dark:text-gray-600">
          <Clock size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No tasks for today</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence>
            {tasks.map((task, i) => {
              const log = logs.find(l => l.task_id === task.id)
              const isCompleted = log?.status === 'completed'
              const isSkipped = log?.status === 'skipped'

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleToggle(task.id)}
                  className={`
                    flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all active:scale-98
                    ${isCompleted
                      ? 'bg-mint-50 dark:bg-mint-500/10 border border-mint-200 dark:border-mint-500/20'
                      : isSkipped
                      ? 'bg-gray-50 dark:bg-dark-100/50 opacity-60'
                      : 'bg-white dark:bg-dark-50/80 border border-gray-100 dark:border-dark-100 hover:border-lavender-200 dark:hover:border-lavender-500/30'
                    }
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={22} className="text-mint-500 flex-shrink-0" />
                  ) : isSkipped ? (
                    <SkipForward size={22} className="text-gray-400 flex-shrink-0" />
                  ) : (
                    <Circle size={22} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-snug ${
                      isCompleted ? 'text-mint-700 dark:text-mint-300 line-through' : 'text-gray-900 dark:text-white'
                    }`}>
                      {task.title}
                    </p>
                    {(task as any).segment && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {(task as any).segment.icon} {(task as any).segment.name}
                      </p>
                    )}
                  </div>

                  {isCompleted && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-sm"
                    >
                      ✅
                    </motion.span>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </Card>
  )
}
