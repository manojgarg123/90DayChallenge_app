import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const GOAL_VERBS = ['run', 'learn', 'quit', 'build', 'lose', 'save', 'practice', 'meditate', 'write']
const DURATION_OPTIONS = [4, 6, 8, 10, 12, 16]

const VERB_OBJECT_PLACEHOLDERS: Record<string, string> = {
  run:      'a 5k / half marathon / every morning',
  learn:    'guitar / Spanish / to code',
  quit:     'smoking / sugar / social media',
  build:    'muscle / a daily habit / confidence',
  lose:     'weight / 5 kg / body fat',
  save:     'money / £500/month / an emergency fund',
  practice: 'guitar / mindfulness / public speaking',
  meditate: 'daily / for 10 mins / consistently',
  write:    'a journal / 500 words/day / a novel',
}

interface GoalStepProps {
  onAnalyze: (goalVerb: string, goalObject: string, goalOutcome: string, identityStatement: string, durationWeeks: number) => void
}

export function GoalStep({ onAnalyze }: GoalStepProps) {
  const [selectedVerb, setSelectedVerb] = useState('')
  const [customVerb, setCustomVerb] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [goalObject, setGoalObject] = useState('')
  const [goalOutcome, setGoalOutcome] = useState('')
  const [identityStatement, setIdentityStatement] = useState('')
  const [durationWeeks, setDurationWeeks] = useState(12)

  const goalVerb = showCustom ? customVerb.trim() : selectedVerb
  const objectPlaceholder = VERB_OBJECT_PLACEHOLDERS[goalVerb] ?? 'describe what specifically…'

  const canProceed =
    goalVerb.length > 0 &&
    goalObject.trim().length >= 2 &&
    goalOutcome.trim().length >= 10 &&
    identityStatement.trim().length >= 5

  function handleVerbSelect(verb: string) {
    setSelectedVerb(verb)
    setShowCustom(false)
    setGoalObject('')
  }

  function handleOtherSelect() {
    setSelectedVerb('')
    setShowCustom(true)
    setGoalObject('')
  }

  return (
    <Card className="p-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-lavender-100 dark:bg-lavender-500/20 mb-4">
          <span className="text-2xl">🌟</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">What's your challenge?</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
          Tell us what you want to achieve and who you're becoming.
        </p>
      </div>

      {/* Field 1: Goal Verb */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          I want to…
        </p>
        <div className="flex gap-2 flex-wrap">
          {GOAL_VERBS.map(verb => (
            <button
              key={verb}
              onClick={() => handleVerbSelect(verb)}
              className={`
                px-3 py-1.5 rounded-xl text-sm font-semibold transition-all capitalize
                ${!showCustom && selectedVerb === verb
                  ? 'bg-lavender-400 text-white shadow-pastel'
                  : 'bg-gray-100 dark:bg-dark-100 text-gray-600 dark:text-gray-400 hover:bg-lavender-100 dark:hover:bg-lavender-500/20'}
              `}
            >
              {verb}
            </button>
          ))}
          <button
            onClick={handleOtherSelect}
            className={`
              px-3 py-1.5 rounded-xl text-sm font-semibold transition-all
              ${showCustom
                ? 'bg-lavender-400 text-white shadow-pastel'
                : 'bg-gray-100 dark:bg-dark-100 text-gray-600 dark:text-gray-400 hover:bg-lavender-100 dark:hover:bg-lavender-500/20'}
            `}
          >
            other…
          </button>
        </div>
        {showCustom && (
          <div className="mt-2">
            <Input
              placeholder="e.g. cook, cycle, speak…"
              value={customVerb}
              onChange={e => setCustomVerb(e.target.value)}
              maxLength={30}
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Field 2: Goal Object (what) — appears once a verb is chosen */}
      {goalVerb && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            <span className="text-lavender-500 dark:text-lavender-400">{goalVerb}</span>… what?
          </p>
          <Input
            placeholder={objectPlaceholder}
            value={goalObject}
            onChange={e => setGoalObject(e.target.value)}
            maxLength={80}
            autoFocus
          />
        </div>
      )}

      {/* Field 3: Goal Outcome (why) */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          …so that I can…
        </p>
        <Input
          placeholder="feel confident / have energy for my kids / finish my first race"
          value={goalOutcome}
          onChange={e => setGoalOutcome(e.target.value)}
          maxLength={150}
        />
        {goalOutcome.length > 0 && goalOutcome.trim().length < 10 && (
          <p className="text-xs text-gray-400 mt-1">A little more detail helps the AI personalise your plan</p>
        )}
      </div>

      {/* Field 4: Identity Statement */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
          Who do you want to become?
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
          This shapes how your tasks are framed throughout the challenge.
        </p>
        <Input
          placeholder="a runner / a meditator / someone who prioritises health"
          value={identityStatement}
          onChange={e => setIdentityStatement(e.target.value)}
          maxLength={100}
        />
      </div>

      {/* Duration picker */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Challenge Duration
        </p>
        <div className="flex gap-2 flex-wrap">
          {DURATION_OPTIONS.map(w => (
            <button
              key={w}
              onClick={() => setDurationWeeks(w)}
              className={`
                px-3 py-1.5 rounded-xl text-sm font-semibold transition-all
                ${durationWeeks === w
                  ? 'bg-lavender-400 text-white shadow-pastel'
                  : 'bg-gray-100 dark:bg-dark-100 text-gray-600 dark:text-gray-400 hover:bg-lavender-100 dark:hover:bg-lavender-500/20'}
              `}
            >
              {w} wks
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          {durationWeeks} weeks · {durationWeeks * 7} days
        </p>
      </div>

      {/* Preview sentence */}
      {goalVerb && goalObject.trim().length >= 2 && goalOutcome.trim().length >= 10 && (
        <div className="mb-5 p-3 rounded-2xl bg-lavender-50 dark:bg-lavender-500/10 border border-lavender-200 dark:border-lavender-500/30">
          <p className="text-sm text-lavender-700 dark:text-lavender-300">
            "I want to <strong>{goalVerb} {goalObject.trim()}</strong> so that I can {goalOutcome.trim()}"
          </p>
        </div>
      )}

      <Button
        onClick={() => onAnalyze(goalVerb, goalObject.trim(), goalOutcome.trim(), identityStatement.trim(), durationWeeks)}
        disabled={!canProceed}
        size="lg"
        className="w-full gap-2"
      >
        <Sparkles size={18} />
        Analyze My Goal with AI
      </Button>
    </Card>
  )
}
