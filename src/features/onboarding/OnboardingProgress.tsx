import { Check } from 'lucide-react'

type OnboardingStep = 'goal' | 'contextA' | 'contextB' | 'contextC' | 'analyzing' | 'preview' | 'outcomes'

const STAGES = [
  { id: 1, label: 'Your Goal',  steps: ['goal'] as OnboardingStep[] },
  { id: 2, label: 'About You',  steps: ['contextA', 'contextB', 'contextC'] as OnboardingStep[] },
  { id: 3, label: 'Your Plan',  steps: ['analyzing', 'preview'] as OnboardingStep[] },
  { id: 4, label: 'Metrics',    steps: ['outcomes'] as OnboardingStep[] },
]

function getActiveStage(step: OnboardingStep): number {
  return STAGES.find(s => s.steps.includes(step))?.id ?? 1
}

interface Props {
  step: OnboardingStep
}

export function OnboardingProgress({ step }: Props) {
  const activeStage = getActiveStage(step)

  return (
    <div className="flex items-center justify-center mb-6 px-2">
      {STAGES.map((stage, idx) => {
        const done    = stage.id < activeStage
        const current = stage.id === activeStage
        const future  = stage.id > activeStage

        return (
          <div key={stage.id} className="flex items-center">
            {/* Step node */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${done    ? 'bg-lavender-400 text-white'                                             : ''}
                  ${current ? 'bg-lavender-400 text-white ring-4 ring-lavender-200 dark:ring-lavender-500/30' : ''}
                  ${future  ? 'bg-gray-200 dark:bg-dark-100 text-gray-400 dark:text-gray-500'           : ''}
                `}
              >
                {done ? <Check size={13} strokeWidth={3} /> : stage.id}
              </div>
              <span
                className={`
                  text-[10px] font-medium whitespace-nowrap
                  ${done || current ? 'text-lavender-600 dark:text-lavender-400' : 'text-gray-400 dark:text-gray-500'}
                `}
              >
                {stage.label}
              </span>
            </div>

            {/* Connector line */}
            {idx < STAGES.length - 1 && (
              <div
                className={`
                  h-0.5 w-10 sm:w-14 mx-1 mb-4 rounded-full transition-all
                  ${stage.id < activeStage ? 'bg-lavender-400' : 'bg-gray-200 dark:bg-dark-100'}
                `}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
