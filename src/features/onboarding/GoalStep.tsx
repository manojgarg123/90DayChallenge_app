import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const GOAL_EXAMPLES = [
  "Lose 15 pounds and build muscle through consistent workouts and clean eating",
  "Run my first 5K and develop a sustainable fitness routine",
  "Reduce stress, improve sleep quality, and practice mindfulness daily",
  "Build a morning routine, journal daily, and read 10 books",
]

const DURATION_OPTIONS = [4, 6, 8, 10, 12, 16]

interface GoalStepProps {
  onAnalyze: (goal: string, durationWeeks: number) => void
}

export function GoalStep({ onAnalyze }: GoalStepProps) {
  const [goal, setGoal] = useState('')
  const [durationWeeks, setDurationWeeks] = useState(12)

  function handleExample(example: string) {
    setGoal(example)
  }

  return (
    <Card className="p-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-lavender-100 dark:bg-lavender-500/20 mb-4">
          <span className="text-2xl">🌟</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">What's your challenge goal?</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
          Describe what you want to achieve. Our AI will craft a personalized plan.
        </p>
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

      <Textarea
        placeholder="e.g. I want to lose 20 pounds, build strength, improve my diet, and develop better sleep habits..."
        value={goal}
        onChange={e => setGoal(e.target.value)}
        className="min-h-[140px]"
        maxLength={500}
      />
      <p className="text-xs text-gray-400 dark:text-gray-600 text-right mt-1">
        {goal.length}/500
      </p>

      <div className="mt-4">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
          Example goals
        </p>
        <div className="flex flex-col gap-2">
          {GOAL_EXAMPLES.map((example, i) => (
            <button
              key={i}
              onClick={() => handleExample(example)}
              className="text-left text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-100/50 hover:bg-lavender-50 dark:hover:bg-lavender-500/10 rounded-xl p-2.5 transition-colors"
            >
              "{example}"
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={() => onAnalyze(goal, durationWeeks)}
        disabled={goal.trim().length < 20}
        size="lg"
        className="w-full mt-6 gap-2"
      >
        <Sparkles size={18} />
        Analyze My Goal with AI
      </Button>
    </Card>
  )
}
