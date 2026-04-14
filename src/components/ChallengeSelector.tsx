import { useAppStore } from '@/store'
import { useActiveChallenges } from '@/hooks/useChallenge'

interface ChallengeSelectorProps {
  userId: string | undefined
}

export function ChallengeSelector({ userId }: ChallengeSelectorProps) {
  const { challenges, loading } = useActiveChallenges(userId)
  const { selectedChallengeId, setSelectedChallengeId } = useAppStore()

  if (loading || challenges.length <= 1) return null

  const activeId = selectedChallengeId ?? challenges[0]?.id

  return (
    <div className="px-4 mb-3">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {challenges.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedChallengeId(c.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors max-w-[140px] truncate
              ${c.id === activeId
                ? 'bg-lavender-400 text-white'
                : 'border border-lavender-300 dark:border-lavender-500/50 text-lavender-600 dark:text-lavender-400 bg-white/60 dark:bg-dark-50/60'
              }`}
          >
            {c.title}
          </button>
        ))}
      </div>
    </div>
  )
}
