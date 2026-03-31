import { motion } from 'framer-motion'
import { X } from 'lucide-react'

const NUDGE_STYLES: Record<string, { bg: string; emoji: string }> = {
  motivation: { bg: 'bg-lavender-50 dark:bg-lavender-500/10 border-lavender-200 dark:border-lavender-500/20', emoji: '✨' },
  reminder: { bg: 'bg-peach-50 dark:bg-peach-500/10 border-peach-200 dark:border-peach-500/20', emoji: '⏰' },
  milestone: { bg: 'bg-mint-50 dark:bg-mint-500/10 border-mint-200 dark:border-mint-500/20', emoji: '🏆' },
  warning: { bg: 'bg-blush-50 dark:bg-blush-500/10 border-blush-200 dark:border-blush-500/20', emoji: '⚡' },
}

interface NudgesBannerProps {
  nudge: { id: string; message: string; type: string }
  onDismiss: () => void
}

export function NudgesBanner({ nudge, onDismiss }: NudgesBannerProps) {
  const style = NUDGE_STYLES[nudge.type] || NUDGE_STYLES.motivation

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-start gap-3 p-4 rounded-3xl border ${style.bg}`}
    >
      <span className="text-xl flex-shrink-0">{style.emoji}</span>
      <p className="flex-1 text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
        {nudge.message}
      </p>
      <button
        onClick={onDismiss}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0"
      >
        <X size={16} />
      </button>
    </motion.div>
  )
}
