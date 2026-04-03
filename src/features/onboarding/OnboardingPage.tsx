import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { GoalStep } from './GoalStep'
import { AnalyzingStep } from './AnalyzingStep'
import { PlanPreviewStep } from './PlanPreviewStep'
import type { Segment } from '@/types'

export interface GeneratedPlan {
  challengeTitle: string
  segments: Array<{
    name: string
    description: string
    icon: string
    color: string
    weeklyFocus: string[]
    sampleTasks: string[]
  }>
  overview: string
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'goal' | 'analyzing' | 'preview'>('goal')
  const [goalText, setGoalText] = useState('')
  const [plan, setPlan] = useState<GeneratedPlan | null>(null)
  const [saving, setSaving] = useState(false)

  const [analyzeError, setAnalyzeError] = useState<string | null>(null)

  async function analyzeGoal(goal: string) {
    setGoalText(goal)
    setAnalyzeError(null)
    setStep('analyzing')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      console.log('[analyze-goal] Invoking edge function...')

      const { data, error } = await supabase.functions.invoke('analyze-goal', {
        body: { goal },
      })

      console.log('[analyze-goal] Response:', { data, error })

      if (error) {
        // Try to extract detailed error from the response body
        let detail = error.message
        try {
          // FunctionsHttpError has a context property with the raw Response
          const ctx = (error as any).context
          if (ctx) {
            const body = await ctx.json()
            detail = body.details || body.error || JSON.stringify(body)
          }
        } catch {}
        throw new Error(`Edge function error: ${detail}`)
      }
      if (!data?.plan) throw new Error('No plan returned from edge function')

      setPlan(data.plan)
      setStep('preview')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[analyze-goal] Failed:', msg)
      setAnalyzeError(msg)
      setPlan(generateFallbackPlan(goal))
      setStep('preview')
    }
  }

  function generateFallbackPlan(goal: string): GeneratedPlan {
    return {
      challengeTitle: `My 90-Day Challenge`,
      overview: `A structured 90-day plan to help you achieve your goal: "${goal}"`,
      segments: [
        {
          name: 'Physical Fitness',
          description: 'Build strength, endurance, and overall physical health',
          icon: '💪',
          color: 'lavender',
          weeklyFocus: ['Foundation building', 'Building momentum', 'Peak performance'],
          sampleTasks: ['30-min workout', 'Daily steps goal', 'Stretching routine'],
        },
        {
          name: 'Nutrition',
          description: 'Fuel your body with the right foods for optimal performance',
          icon: '🥗',
          color: 'mint',
          weeklyFocus: ['Clean eating habits', 'Meal prep mastery', 'Intuitive eating'],
          sampleTasks: ['Meal prep Sunday', 'Track macros', 'Drink 2L water'],
        },
        {
          name: 'Mindset',
          description: 'Cultivate mental strength, resilience, and positive thinking',
          icon: '🧘',
          color: 'peach',
          weeklyFocus: ['Awareness', 'Habits', 'Mastery'],
          sampleTasks: ['10-min meditation', 'Gratitude journal', 'Affirmations'],
        },
        {
          name: 'Recovery',
          description: 'Prioritize sleep, rest, and active recovery for sustained progress',
          icon: '😴',
          color: 'sky',
          weeklyFocus: ['Sleep hygiene', 'Active recovery', 'Stress management'],
          sampleTasks: ['8h sleep target', 'Evening wind-down', 'Rest day walk'],
        },
      ],
    }
  }

  async function startChallenge() {
    if (!plan) return
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Mark any existing active challenge as abandoned before starting a new one
      await supabase
        .from('challenges')
        .update({ status: 'abandoned' })
        .eq('user_id', user.id)
        .eq('status', 'active')

      const startDate = new Date().toISOString().split('T')[0]
      const endDate = new Date(Date.now() + 89 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Create challenge
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .insert({
          user_id: user.id,
          title: plan.challengeTitle,
          goal_description: goalText,
          start_date: startDate,
          end_date: endDate,
          status: 'active',
        })
        .select()
        .single()

      if (challengeError) throw challengeError

      // Create segments and tasks
      for (let i = 0; i < plan.segments.length; i++) {
        const seg = plan.segments[i]

        const { data: segment, error: segError } = await supabase
          .from('segments')
          .insert({
            challenge_id: challenge.id,
            name: seg.name,
            description: seg.description,
            icon: seg.icon,
            color: seg.color,
            order_index: i,
          })
          .select()
          .single()

        if (segError) throw segError

        // Generate 90 days of tasks for this segment
        const tasks = generateTasksForSegment(challenge.id, segment.id, seg.sampleTasks)
        const { error: tasksError } = await supabase.from('tasks').insert(tasks)
        if (tasksError) throw tasksError
      }

      navigate('/dashboard')
    } catch (err) {
      console.error('Failed to start challenge:', err)
    } finally {
      setSaving(false)
    }
  }

  function generateTasksForSegment(
    challengeId: string,
    segmentId: string,
    sampleTasks: string[]
  ) {
    const tasks = []
    for (let day = 1; day <= 90; day++) {
      const week = Math.ceil(day / 7)
      const taskTitle = sampleTasks[day % sampleTasks.length]
      tasks.push({
        challenge_id: challengeId,
        segment_id: segmentId,
        title: taskTitle,
        day_number: day,
        week_number: week,
        frequency: 'daily',
      })
    }
    return tasks
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-100 via-mint-50 to-peach-50 dark:from-dark-300 dark:via-dark-200 dark:to-dark-100 flex items-center justify-center p-4">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-lavender-200/30 dark:bg-lavender-500/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-mint-200/30 dark:bg-mint-500/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative">
        <AnimatePresence mode="wait">
          {step === 'goal' && (
            <motion.div key="goal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <GoalStep onAnalyze={analyzeGoal} />
            </motion.div>
          )}
          {step === 'analyzing' && (
            <motion.div key="analyzing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <AnalyzingStep goal={goalText} />
            </motion.div>
          )}
          {step === 'preview' && plan && (
            <motion.div key="preview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {analyzeError && (
                <div className="mb-4 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">⚠️ AI plan failed — using fallback plan</p>
                  <p className="text-xs text-red-500 dark:text-red-500 font-mono break-all">{analyzeError}</p>
                </div>
              )}
              <PlanPreviewStep plan={plan} onStart={startChallenge} saving={saving} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
