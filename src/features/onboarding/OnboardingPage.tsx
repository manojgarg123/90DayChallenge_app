import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase, supabaseAnonKey } from '@/lib/supabase'
import { OnboardingProgress } from './OnboardingProgress'
import { GoalStep } from './GoalStep'
import { ContextIntakeA } from './ContextIntakeA'
import { ContextIntakeB } from './ContextIntakeB'
import { ContextIntakeC } from './ContextIntakeC'
import { AnalyzingStep } from './AnalyzingStep'
import { PlanPreviewStep } from './PlanPreviewStep'
import { OutcomeSetupStep } from './OutcomeSetupStep'

export interface TaskObj {
  main: string
  floor: string
  time_of_day: 'morning' | 'midday' | 'afternoon' | 'evening' | 'night'
}

export interface GeneratedPlan {
  challengeTitle: string
  overview: string
  segments: Array<{
    name: string
    description: string
    icon: string
    color: string
    weeklyFocus: string[]
    tasks?: { early: TaskObj[]; mid: TaskObj[]; late: TaskObj[] }
  }>
  suggestedMetrics?: Array<{ name: string; unit: string; lowerIsBetter: boolean }>
}

interface MetricEntry {
  localId: string
  name: string
  unit: string
  lowerIsBetter: boolean
  baselineValue: string
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'goal' | 'contextA' | 'contextB' | 'contextC' | 'analyzing' | 'preview' | 'outcomes'>('goal')
  const [goalVerb, setGoalVerb] = useState('')
  const [goalObject, setGoalObject] = useState('')
  const [goalOutcome, setGoalOutcome] = useState('')
  const [identityStatement, setIdentityStatement] = useState('')
  const [durationWeeks, setDurationWeeks] = useState(12)
  const [currentFrequency, setCurrentFrequency] = useState('')
  const [availableTime, setAvailableTime] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('')
  const [constraints, setConstraints] = useState<string[]>([])
  const [stagesOfChange, setStagesOfChange] = useState('')
  const [plan, setPlan] = useState<GeneratedPlan | null>(null)
  const [tasksReady, setTasksReady] = useState(false)
  const [tasksError, setTasksError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [pendingMetrics, setPendingMetrics] = useState<MetricEntry[] | null>(null)
  const [activeCount, setActiveCount] = useState(0)

  function handleGoalComplete(verb: string, object: string, outcome: string, identity: string, weeks: number) {
    setGoalVerb(verb)
    setGoalObject(object)
    setGoalOutcome(outcome)
    setIdentityStatement(identity)
    setDurationWeeks(weeks)
    setStep('contextA')
  }

  function handleContextAComplete(frequency: string) {
    setCurrentFrequency(frequency)
    setStep('contextB')
  }

  function handleContextBComplete(time: string) {
    setAvailableTime(time)
    setStep('contextC')
  }

  function handleContextCComplete(data: { experienceLevel: string; constraints: string[]; stagesOfChange: string }) {
    setExperienceLevel(data.experienceLevel)
    setConstraints(data.constraints)
    setStagesOfChange(data.stagesOfChange)
    triggerAnalysis(data.experienceLevel, data.constraints, data.stagesOfChange)
  }

  async function triggerAnalysis(expLevel: string, constr: string[], stages: string) {
    setAnalyzeError(null)
    setTasksError(null)
    setTasksReady(false)
    setStep('analyzing')

    const goalText = `I want to ${goalVerb} ${goalObject} so that I can ${goalOutcome}`
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!supabaseUrl || !supabaseAnonKey) {
      setAnalyzeError('Missing Supabase config')
      setPlan({ ...generateFallbackPlan(goalText, durationWeeks), suggestedMetrics: [] })
      setStep('preview')
      generateFallbackTasks()
      return
    }

    // ── Step 1: Get plan structure (fast, ~1-2s) ──────────────────────────────
    let structurePlan: GeneratedPlan
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/analyze-goal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': supabaseAnonKey },
        body: JSON.stringify({ goal: goalText, goalVerb, goalObject, goalOutcome, durationWeeks }),
      })
      const payload = await res.json()
      if (!res.ok || !payload?.plan?.segments?.length) {
        throw new Error(payload?.error ?? `Edge function error (${res.status})`)
      }
      structurePlan = payload.plan
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[analyze-goal] Failed:', msg)
      setAnalyzeError(msg)
      structurePlan = generateFallbackPlan(goalText, durationWeeks)
    }

    setPlan(structurePlan)
    setStep('preview')

    // ── Step 2: Generate tasks in background (runs while user reads preview) ──
    generateTasksInBackground(structurePlan.segments, expLevel, constr, stages)
  }

  async function generateTasksInBackground(
    segments: GeneratedPlan['segments'],
    expLevel: string,
    constr: string[],
    stages: string,
  ) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': supabaseAnonKey },
        body: JSON.stringify({
          segments: segments.map(s => ({ name: s.name, description: s.description })),
          goalVerb, goalObject, goalOutcome, identityStatement,
          currentFrequency, availableTime,
          experienceLevel: expLevel,
          constraints: constr,
          stagesOfChange: stages,
          durationWeeks,
        }),
      })
      const payload = await res.json()
      if (!res.ok || !Array.isArray(payload?.segments)) {
        throw new Error(payload?.error ?? `generate-tasks error (${res.status})`)
      }

      // Merge tasks back into plan segments
      setPlan(prev => {
        if (!prev) return prev
        const updated = { ...prev, segments: prev.segments.map((seg, i) => ({
          ...seg,
          tasks: payload.segments[i]?.tasks ?? seg.tasks,
        }))}
        return updated
      })
      setTasksReady(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[generate-tasks] Failed:', msg)
      setTasksError(msg)
      generateFallbackTasks()
    }
  }

  function generateFallbackTasks() {
    const fallbackPhase = (scale: number): TaskObj[] => [
      { main: `After morning coffee: ${scale * 15}-min practice — note one win`, floor: 'If 5 mins: one focused rep', time_of_day: 'morning' },
      { main: 'After lunch: review progress — pick one improvement', floor: 'If 2 mins: read one tip', time_of_day: 'midday' },
      { main: 'Before bed: plan tomorrow — write the one key task', floor: 'If 2 mins: set your alarm cue', time_of_day: 'night' },
    ]
    setPlan(prev => {
      if (!prev) return prev
      return { ...prev, segments: prev.segments.map(seg => ({
        ...seg,
        tasks: { early: fallbackPhase(1), mid: fallbackPhase(2), late: fallbackPhase(3) },
      }))}
    })
    setTasksReady(true)
  }

  function generateFallbackPlan(goal: string, weeks: number): GeneratedPlan {
    return {
      challengeTitle: `My ${weeks}-Week Challenge`,
      overview: `A structured ${weeks}-week plan to help you achieve your goal: "${goal}"`,
      suggestedMetrics: [],
      segments: [
        { name: 'Core Practice',  description: 'Build the central daily habit for your goal',    icon: '🎯', color: 'lavender', weeklyFocus: ['Foundation', 'Momentum', 'Mastery'] },
        { name: 'Mindset',        description: 'Cultivate focus, resilience and self-belief',    icon: '🧘', color: 'peach',    weeklyFocus: ['Awareness', 'Reframing', 'Ownership'] },
        { name: 'Learning',       description: 'Deepen knowledge and skills tied to the goal',  icon: '📚', color: 'sky',      weeklyFocus: ['Concepts', 'Application', 'Mastery'] },
        { name: 'Recovery',       description: 'Protect energy, sleep and sustainability',       icon: '😴', color: 'mint',     weeklyFocus: ['Sleep hygiene', 'Active rest', 'Stress mastery'] },
      ],
    }
  }

  // Check phase — counts active challenges and shows confirmation dialog if any exist
  async function startChallenge(metrics: MetricEntry[] = []) {
    if (!plan) return
    setSaveError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaveError('Not authenticated'); return }

    const { count } = await supabase
      .from('challenges')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (count && count > 0) {
      setActiveCount(count)
      setPendingMetrics(metrics)
      return
    }

    await executeStartChallenge(metrics)
  }

  function confirmAddChallenge() {
    if (pendingMetrics !== null) executeStartChallenge(pendingMetrics)
    setPendingMetrics(null)
  }

  function cancelAddChallenge() {
    setPendingMetrics(null)
  }

  // Execute phase — saves challenge, segments, tasks and metrics to the database
  async function executeStartChallenge(metrics: MetricEntry[] = []) {
    if (!plan) return
    setSaving(true)
    setSaveError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // NOTE: Auto-deactivation of existing challenges has been disabled.
      // The app now supports multiple concurrent active challenges.
      // Users are prompted before adding a second challenge (see startChallenge above).
      // await supabase
      //   .from('challenges')
      //   .update({ status: 'abandoned' })
      //   .eq('user_id', user.id)
      //   .eq('status', 'active')

      const totalDays = durationWeeks * 7
      const startDate = new Date().toISOString().split('T')[0]
      const endDate = new Date(Date.now() + (totalDays - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Create challenge
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .insert({
          user_id: user.id,
          title: plan.challengeTitle,
          goal_description: goalVerb
            ? `I want to ${goalVerb} ${goalObject} so that I can ${goalOutcome}`
            : goalOutcome,
          goal_verb: goalVerb || null,
          goal_object: goalObject || null,
          goal_outcome: goalOutcome || null,
          identity_statement: identityStatement || null,
          current_frequency: currentFrequency || null,
          available_time: availableTime || null,
          experience_level: experienceLevel || null,
          constraints: constraints.length > 0 ? constraints : null,
          stages_of_change: stagesOfChange || null,
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

        const tasks = generateTasksForSegment(challenge.id, segment.id, seg.tasks, totalDays)
        const { error: tasksError } = await supabase.from('tasks').insert(tasks)
        if (tasksError) throw tasksError
      }

      // Save outcome metrics + baselines
      for (const m of metrics) {
        const { data: metric, error: metricError } = await supabase
          .from('outcome_metrics')
          .insert({
            challenge_id: challenge.id,
            user_id: user.id,
            name: m.name,
            unit: m.unit,
            lower_is_better: m.lowerIsBetter,
          })
          .select()
          .single()

        if (!metricError && metric) {
          await supabase.from('outcome_logs').insert({
            metric_id: metric.id,
            challenge_id: challenge.id,
            user_id: user.id,
            week_number: 0,
            value: parseFloat(m.baselineValue),
            logged_date: startDate,
          })
        }
      }

      navigate('/dashboard')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('Failed to start challenge:', msg)
      setSaveError(msg)
    } finally {
      setSaving(false)
    }
  }

  function generateTasksForSegment(
    challengeId: string,
    segmentId: string,
    tasks: { early: TaskObj[]; mid: TaskObj[]; late: TaskObj[] },
    totalDays: number
  ) {
    const result = []
    const phase1End = Math.round(totalDays / 3)
    const phase2End = Math.round(totalDays * 2 / 3)
    for (let day = 1; day <= totalDays; day++) {
      const pool = day <= phase1End ? tasks.early : day <= phase2End ? tasks.mid : tasks.late
      const taskObj = pool[day % pool.length]
      result.push({
        challenge_id: challengeId,
        segment_id: segmentId,
        title: taskObj.main,
        floor_task: taskObj.floor,
        time_of_day: taskObj.time_of_day,
        day_number: day,
        week_number: Math.ceil(day / 7),
        frequency: 'daily',
      })
    }
    return result
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-100 via-mint-50 to-peach-50 dark:from-dark-300 dark:via-dark-200 dark:to-dark-100 flex items-center justify-center p-4">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-lavender-200/30 dark:bg-lavender-500/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-mint-200/30 dark:bg-mint-500/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative">
        {step !== 'analyzing' && <OnboardingProgress step={step} />}
        <AnimatePresence mode="wait">
          {step === 'goal' && (
            <motion.div key="goal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <GoalStep onAnalyze={handleGoalComplete} />
            </motion.div>
          )}
          {step === 'contextA' && (
            <motion.div key="contextA" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <ContextIntakeA
                goalVerb={goalVerb}
                goalObject={goalObject}
                onNext={handleContextAComplete}
                onBack={() => setStep('goal')}
              />
            </motion.div>
          )}
          {step === 'contextB' && (
            <motion.div key="contextB" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <ContextIntakeB
                onNext={handleContextBComplete}
                onBack={() => setStep('contextA')}
              />
            </motion.div>
          )}
          {step === 'contextC' && (
            <motion.div key="contextC" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <ContextIntakeC
                onNext={handleContextCComplete}
                onBack={() => setStep('contextB')}
              />
            </motion.div>
          )}
          {step === 'analyzing' && (
            <motion.div key="analyzing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <AnalyzingStep goal={goalVerb ? `I want to ${goalVerb} ${goalObject} so that I can ${goalOutcome}` : goalOutcome} />
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
              <PlanPreviewStep
                plan={plan}
                totalDays={durationWeeks * 7}
                onStart={() => setStep('outcomes')}
                saving={false}
                tasksReady={tasksReady}
                tasksError={tasksError}
              />
            </motion.div>
          )}
          {step === 'outcomes' && plan && (
            <motion.div key="outcomes" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <OutcomeSetupStep
                suggestedMetrics={plan.suggestedMetrics || []}
                onStart={startChallenge}
                onSkip={() => startChallenge([])}
                saving={saving}
                saveError={saveError}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation dialog — shown when user already has active challenges */}
      <AnimatePresence>
        {pendingMetrics !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 8 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm bg-white dark:bg-dark-100 rounded-3xl shadow-pastel-lg p-6"
            >
              <div className="text-center mb-5">
                <div className="text-4xl mb-3">⚠️</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Active Challenge Exists
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  You already have{' '}
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {activeCount} active challenge{activeCount !== 1 ? 's' : ''}
                  </span>
                  . Do you want to continue adding another?
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={cancelAddChallenge}
                  className="flex-1 py-3 px-4 rounded-2xl border border-gray-200 dark:border-dark-50 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-dark-50 transition-colors"
                >
                  No, Discard
                </button>
                <button
                  onClick={confirmAddChallenge}
                  disabled={saving}
                  className="flex-1 py-3 px-4 rounded-2xl bg-lavender-400 hover:bg-lavender-500 text-white font-medium text-sm transition-colors disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Yes, Add'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
