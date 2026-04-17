import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Loader2, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'

type Difficulty = 'too_hard' | 'just_right' | 'too_easy'
type Step = 'loading' | 'difficulty' | 'woop' | 'adjusting' | 'done'

const DIFFICULTY_OPTIONS: Array<{ value: Difficulty; emoji: string; label: string; sub: string }> = [
  { value: 'too_hard', emoji: '😓', label: 'Too Hard', sub: "I struggled to keep up" },
  { value: 'just_right', emoji: '😊', label: 'Just Right', sub: "Challenging but manageable" },
  { value: 'too_easy', emoji: '🚀', label: 'Too Easy', sub: "I want more challenge" },
]

interface WeeklyCheckInProps {
  challengeId: string
  userId: string
  weekNumber: number
  nextWeekNumber: number
  challenge: any
}

export function WeeklyCheckIn({ challengeId, userId, weekNumber, nextWeekNumber, challenge }: WeeklyCheckInProps) {
  const [step, setStep] = useState<Step>('loading')
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const [woopOutcome, setWoopOutcome] = useState('')
  const [woopObstacle, setWoopObstacle] = useState('')
  const [existingCheckin, setExistingCheckin] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [adjustError, setAdjustError] = useState<string | null>(null)

  useEffect(() => {
    fetchExisting()
  }, [weekNumber, challengeId])

  async function fetchExisting() {
    setStep('loading')
    const { data } = await supabase
      .from('weekly_checkins')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('week_number', weekNumber)
      .maybeSingle()

    if (data) {
      setExistingCheckin(data)
      setStep('done')
    } else {
      setStep('difficulty')
    }
  }

  function handleDifficultySelect(d: Difficulty) {
    setDifficulty(d)
    setStep('woop')
  }

  async function handleSubmit() {
    if (!difficulty) return
    setSaving(true)
    setAdjustError(null)

    // 1. Save check-in record
    const { error: saveErr } = await supabase.from('weekly_checkins').upsert({
      challenge_id: challengeId,
      user_id: userId,
      week_number: weekNumber,
      difficulty,
      woop_outcome: woopOutcome.trim() || null,
      woop_obstacle: woopObstacle.trim() || null,
    }, { onConflict: 'challenge_id,week_number' })

    if (saveErr) {
      setSaving(false)
      return
    }

    // 2. If adjustment needed, fetch next week's tasks and call edge function
    if (difficulty !== 'just_right' && nextWeekNumber > weekNumber) {
      setStep('adjusting')

      const startDay = (nextWeekNumber - 1) * 7 + 1
      const endDay = nextWeekNumber * 7

      const { data: nextTasks } = await supabase
        .from('tasks')
        .select('id, title, floor_task, time_of_day')
        .eq('challenge_id', challengeId)
        .gte('day_number', startDay)
        .lte('day_number', endDay)

      if (nextTasks && nextTasks.length > 0) {
        try {
          const { data: fnData, error: fnErr } = await supabase.functions.invoke('adjust-tasks', {
            body: {
              difficulty,
              tasks: nextTasks,
              goalVerb: challenge.goal_verb || '',
              goalObject: challenge.goal_object || '',
              identityStatement: challenge.identity_statement || '',
              availableTime: challenge.available_time || '30min',
            },
          })

          if (!fnErr && fnData?.adjustedTasks?.length) {
            // Update tasks in batch
            await Promise.all(
              fnData.adjustedTasks.map((t: { id: string; title: string; floor_task: string }) =>
                supabase
                  .from('tasks')
                  .update({ title: t.title, floor_task: t.floor_task })
                  .eq('id', t.id)
              )
            )
          } else {
            setAdjustError('Could not adjust tasks — your original plan is unchanged.')
          }
        } catch {
          setAdjustError('Could not adjust tasks — your original plan is unchanged.')
        }
      }
    }

    setSaving(false)
    setStep('done')
    setExistingCheckin({ difficulty, woop_outcome: woopOutcome, woop_obstacle: woopObstacle })
  }

  if (step === 'loading') return null

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">📋</span>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Week {weekNumber} Check-in</h3>
      </div>

      <AnimatePresence mode="wait">
        {step === 'difficulty' && (
          <motion.div key="difficulty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">How did this week feel overall?</p>
            <div className="flex flex-col gap-2">
              {DIFFICULTY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleDifficultySelect(opt.value)}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 dark:border-dark-100 hover:border-lavender-300 dark:hover:border-lavender-500/50 hover:bg-lavender-50/50 dark:hover:bg-lavender-500/10 transition-all text-left"
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{opt.label}</p>
                    <p className="text-xs text-gray-400">{opt.sub}</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'woop' && difficulty && (
          <motion.div key="woop" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{DIFFICULTY_OPTIONS.find(o => o.value === difficulty)?.emoji}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {DIFFICULTY_OPTIONS.find(o => o.value === difficulty)?.label}
              </span>
              {difficulty !== 'just_right' && (
                <span className="text-xs text-lavender-500 dark:text-lavender-400 ml-auto">
                  Next week's tasks will be adjusted
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3 mb-4">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                  🎯 Best outcome I want next week
                </label>
                <Textarea
                  value={woopOutcome}
                  onChange={e => setWoopOutcome(e.target.value)}
                  placeholder="e.g. Run 3 times without stopping"
                  rows={2}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                  🚧 Biggest obstacle I might face
                </label>
                <Textarea
                  value={woopObstacle}
                  onChange={e => setWoopObstacle(e.target.value)}
                  placeholder="e.g. Late nights at work"
                  rows={2}
                  className="text-sm"
                />
              </div>
              {woopObstacle.trim() && (
                <div className="bg-lavender-50 dark:bg-lavender-500/10 rounded-2xl px-3 py-2">
                  <p className="text-xs text-lavender-700 dark:text-lavender-300">
                    💡 <span className="font-medium">Implementation intention:</span> If {woopObstacle.trim().toLowerCase()}, I'll use my floor task as a fallback.
                  </p>
                </div>
              )}
            </div>

            <Button onClick={handleSubmit} loading={saving} disabled={saving} className="w-full" size="sm">
              Save Check-in
            </Button>
          </motion.div>
        )}

        {step === 'adjusting' && (
          <motion.div key="adjusting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-4 gap-2">
            <Loader2 size={24} className="animate-spin text-lavender-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Adjusting next week's tasks…</p>
          </motion.div>
        )}

        {step === 'done' && existingCheckin && (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-mint-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {DIFFICULTY_OPTIONS.find(o => o.value === existingCheckin.difficulty)?.emoji}{' '}
                {DIFFICULTY_OPTIONS.find(o => o.value === existingCheckin.difficulty)?.label}
              </span>
            </div>

            {existingCheckin.woop_outcome && (
              <div className="bg-gray-50 dark:bg-dark-100/50 rounded-2xl px-3 py-2 flex flex-col gap-1">
                {existingCheckin.woop_outcome && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    🎯 <span className="font-medium">Outcome:</span> {existingCheckin.woop_outcome}
                  </p>
                )}
                {existingCheckin.woop_obstacle && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    🚧 <span className="font-medium">Obstacle:</span> {existingCheckin.woop_obstacle}
                  </p>
                )}
              </div>
            )}

            {adjustError && (
              <p className="text-xs text-amber-600 dark:text-amber-400">{adjustError}</p>
            )}

            {existingCheckin.difficulty !== 'just_right' && !adjustError && (
              <p className="text-xs text-mint-600 dark:text-mint-400">
                ✓ Next week's tasks have been adjusted
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
