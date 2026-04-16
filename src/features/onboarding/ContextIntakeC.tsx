import { useState } from 'react'
import { ChevronLeft, Check } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const EXPERIENCE_OPTIONS = [
  { value: 'beginner',               icon: '🌱', label: 'Complete beginner' },
  { value: 'some_experience',        icon: '🌿', label: 'Some experience' },
  { value: 'restarting',             icon: '🔁', label: 'Done it before, restarting' },
  { value: 'intermediate_advanced',  icon: '🎯', label: 'Intermediate / Advanced' },
]

const CONSTRAINT_OPTIONS = [
  { value: 'early_mornings', icon: '🌅', label: 'Early mornings work best' },
  { value: 'no_gym',         icon: '🏠', label: 'No gym access' },
  { value: 'work_from_home', icon: '💻', label: 'Work from home' },
  { value: 'travel',         icon: '✈️', label: 'Travel frequently' },
  { value: 'none',           icon: '✅', label: 'No constraints' },
]

const STAGES_OPTIONS = [
  { value: 'never_tried',   icon: '🆕', label: 'Never seriously tried' },
  { value: 'tried_stopped', icon: '🔄', label: 'Tried before and stopped' },
  { value: 'inconsistent',  icon: '📉', label: 'Doing it, but inconsistently' },
  { value: 'restarting',    icon: '💫', label: 'Done it well before, restarting' },
]

interface Props {
  onNext: (data: { experienceLevel: string; constraints: string[]; stagesOfChange: string }) => void
  onBack: () => void
}

export function ContextIntakeC({ onNext, onBack }: Props) {
  const [experienceLevel, setExperienceLevel] = useState('')
  const [constraints, setConstraints] = useState<string[]>([])
  const [stagesOfChange, setStagesOfChange] = useState('')

  function toggleConstraint(value: string) {
    if (value === 'none') {
      setConstraints(constraints.includes('none') ? [] : ['none'])
      return
    }
    setConstraints(prev => {
      const without = prev.filter(c => c !== 'none')
      return without.includes(value)
        ? without.filter(c => c !== value)
        : [...without, value]
    })
  }

  const canProceed = !!experienceLevel && constraints.length > 0 && !!stagesOfChange

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
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">Step 3 of 3</span>
      </div>

      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-peach-100 dark:bg-peach-500/20 mb-4">
          <span className="text-2xl">🎯</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">A bit more about you</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
          This helps us match the plan to your real situation.
        </p>
      </div>

      {/* Q1: Experience level */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Experience level
        </p>
        <div className="flex flex-col gap-2">
          {EXPERIENCE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setExperienceLevel(opt.value)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left
                ${experienceLevel === opt.value
                  ? 'border-lavender-400 bg-lavender-50 dark:bg-lavender-500/15'
                  : 'border-gray-200 dark:border-dark-50 bg-white/60 dark:bg-dark-50/60 hover:border-lavender-200 dark:hover:border-lavender-500/30'}
              `}
            >
              <span className="text-lg flex-shrink-0">{opt.icon}</span>
              <span className={`text-sm font-medium ${experienceLevel === opt.value ? 'text-lavender-700 dark:text-lavender-300' : 'text-gray-700 dark:text-gray-300'}`}>
                {opt.label}
              </span>
              {experienceLevel === opt.value && (
                <Check size={14} className="ml-auto text-lavender-500 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Q2: Constraints (multi-select) */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
          Any constraints?
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Select all that apply</p>
        <div className="flex flex-col gap-2">
          {CONSTRAINT_OPTIONS.map(opt => {
            const active = constraints.includes(opt.value)
            return (
              <button
                key={opt.value}
                onClick={() => toggleConstraint(opt.value)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left
                  ${active
                    ? 'border-lavender-400 bg-lavender-50 dark:bg-lavender-500/15'
                    : 'border-gray-200 dark:border-dark-50 bg-white/60 dark:bg-dark-50/60 hover:border-lavender-200 dark:hover:border-lavender-500/30'}
                `}
              >
                <span className="text-lg flex-shrink-0">{opt.icon}</span>
                <span className={`text-sm font-medium ${active ? 'text-lavender-700 dark:text-lavender-300' : 'text-gray-700 dark:text-gray-300'}`}>
                  {opt.label}
                </span>
                {active && (
                  <Check size={14} className="ml-auto text-lavender-500 flex-shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Q3: Stages of change */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Have you tried this before?
        </p>
        <div className="flex flex-col gap-2">
          {STAGES_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStagesOfChange(opt.value)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left
                ${stagesOfChange === opt.value
                  ? 'border-lavender-400 bg-lavender-50 dark:bg-lavender-500/15'
                  : 'border-gray-200 dark:border-dark-50 bg-white/60 dark:bg-dark-50/60 hover:border-lavender-200 dark:hover:border-lavender-500/30'}
              `}
            >
              <span className="text-lg flex-shrink-0">{opt.icon}</span>
              <span className={`text-sm font-medium ${stagesOfChange === opt.value ? 'text-lavender-700 dark:text-lavender-300' : 'text-gray-700 dark:text-gray-300'}`}>
                {opt.label}
              </span>
              {stagesOfChange === opt.value && (
                <Check size={14} className="ml-auto text-lavender-500 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={() => onNext({ experienceLevel, constraints, stagesOfChange })}
        disabled={!canProceed}
        size="lg"
        className="w-full"
      >
        Build My Plan
      </Button>
    </Card>
  )
}
