import { motion } from 'framer-motion'
import { CheckCircle, Rocket, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { GeneratedPlan } from './OnboardingPage'

const SEGMENT_COLORS: Record<string, string> = {
  lavender: 'bg-lavender-100 dark:bg-lavender-500/20 text-lavender-700 dark:text-lavender-300',
  mint: 'bg-mint-100 dark:bg-mint-500/20 text-mint-700 dark:text-mint-300',
  peach: 'bg-peach-100 dark:bg-peach-500/20 text-peach-700 dark:text-peach-300',
  sky: 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300',
  blush: 'bg-blush-100 dark:bg-blush-500/20 text-blush-700 dark:text-blush-300',
}

interface PlanPreviewStepProps {
  plan: GeneratedPlan
  totalDays: number
  onStart: () => void
  saving: boolean
  tasksReady: boolean
  tasksError: string | null
}

function TaskChipSkeleton() {
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {[52, 72, 60].map((w, i) => (
        <div
          key={i}
          className="h-5 rounded-full bg-gray-200 dark:bg-dark-100 animate-pulse"
          style={{ width: w }}
        />
      ))}
    </div>
  )
}

export function PlanPreviewStep({ plan, totalDays, onStart, saving, tasksReady, tasksError }: PlanPreviewStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <Card className="p-6">
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-mint-100 dark:bg-mint-500/20 mb-3">
            <CheckCircle className="text-mint-600 dark:text-mint-400" size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{plan.challengeTitle}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{plan.overview}</p>
        </div>

        <div className="flex items-center gap-4 justify-center py-3 border-t border-b border-gray-100 dark:border-dark-100 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalDays}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Days</div>
          </div>
          <div className="w-px h-8 bg-gray-200 dark:bg-dark-100" />
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{plan.segments.length}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Focus Areas</div>
          </div>
          <div className="w-px h-8 bg-gray-200 dark:bg-dark-100" />
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {plan.segments.length * totalDays}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Tasks Total</div>
          </div>
        </div>

        {!tasksReady && (
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400 pb-1">
            <Loader2 size={12} className="animate-spin" />
            Personalising your daily tasks…
          </div>
        )}
      </Card>

      <div className="flex flex-col gap-3">
        {plan.segments.map((seg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${SEGMENT_COLORS[seg.color] || SEGMENT_COLORS.lavender}`}>
                  <span className="text-lg">{seg.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{seg.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{seg.description}</p>

                  {tasksReady ? (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(seg.tasks?.early ?? []).slice(0, 3).map((task, j) => (
                        <span
                          key={j}
                          className="text-xs bg-gray-100 dark:bg-dark-100 text-gray-600 dark:text-gray-400 rounded-full px-2 py-0.5"
                        >
                          {task.main}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <TaskChipSkeleton />
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {tasksError && (
        <p className="text-xs text-amber-600 dark:text-amber-400 text-center px-2">
          Using default task templates — you can customise them later.
        </p>
      )}

      <Button
        onClick={onStart}
        loading={saving}
        disabled={!tasksReady || saving}
        size="lg"
        className="w-full gap-2 mt-2"
      >
        {!tasksReady ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Building your tasks…
          </>
        ) : (
          <>
            <Rocket size={18} />
            Continue to Measurements →
          </>
        )}
      </Button>
    </div>
  )
}
