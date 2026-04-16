import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const OPTIONS = [
  { value: 'never',      icon: '🚫', label: 'Never',         sub: 'Starting fresh' },
  { value: 'once_week',  icon: '1️⃣', label: 'Once a week',   sub: 'Occasional attempts' },
  { value: '2_3x_week',  icon: '🔄', label: '2–3× a week',   sub: 'Building momentum' },
  { value: 'daily',      icon: '✅', label: 'Daily',          sub: 'Already consistent' },
]

interface Props {
  goalVerb: string
  goalObject: string
  onNext: (frequency: string) => void
  onBack: () => void
}

export function ContextIntakeA({ goalVerb, goalObject, onNext, onBack }: Props) {
  const [selected, setSelected] = useState('')

  const subject = goalVerb && goalObject
    ? `${goalVerb} ${goalObject}`
    : goalVerb || 'work on your goal'

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-dark-100 text-gray-500 hover:bg-gray-200 dark:hover:bg-dark-50 transition-colors flex-shrink-0"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex gap-1.5">
          <span className="w-6 h-1.5 rounded-full bg-lavender-400" />
          <span className="w-6 h-1.5 rounded-full bg-gray-200 dark:bg-dark-50" />
          <span className="w-6 h-1.5 rounded-full bg-gray-200 dark:bg-dark-50" />
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">1 of 3</span>
      </div>

      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-lavender-100 dark:bg-lavender-500/20 mb-4">
          <span className="text-2xl">📊</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Where are you starting?</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
          Right now, how often do you <span className="font-semibold text-gray-700 dark:text-gray-300">{subject}</span>?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setSelected(opt.value)}
            className={`
              flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center
              ${selected === opt.value
                ? 'border-lavender-400 bg-lavender-50 dark:bg-lavender-500/15 shadow-pastel'
                : 'border-gray-200 dark:border-dark-50 bg-white/60 dark:bg-dark-50/60 hover:border-lavender-200 dark:hover:border-lavender-500/30'}
            `}
          >
            <span className="text-2xl">{opt.icon}</span>
            <div>
              <p className={`text-sm font-semibold ${selected === opt.value ? 'text-lavender-700 dark:text-lavender-300' : 'text-gray-800 dark:text-gray-200'}`}>
                {opt.label}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{opt.sub}</p>
            </div>
          </button>
        ))}
      </div>

      <Button
        onClick={() => onNext(selected)}
        disabled={!selected}
        size="lg"
        className="w-full"
      >
        Continue
      </Button>
    </Card>
  )
}
