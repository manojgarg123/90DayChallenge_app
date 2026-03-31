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

interface GoalStepProps {
  onAnalyze: (goal: string) => void
}

export function GoalStep({ onAnalyze }: GoalStepProps) {
  const [goal, setGoal] = useState('')

  function handleExample(example: string) {
    setGoal(example)
  }

  return (
    <Card className="p-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-lavender-100 dark:bg-lavender-500/20 mb-4">
          <span className="text-2xl">🌟</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">What's your 90-day goal?</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
          Describe what you want to achieve. Be specific — our AI will craft a personalized plan.
        </p>
      </div>

      <Textarea
        placeholder="e.g. I want to lose 20 pounds, build strength, improve my diet, and develop better sleep habits over the next 90 days..."
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
        onClick={() => onAnalyze(goal)}
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
