import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'

const MESSAGES = [
  "Reading your goal...",
  "Identifying key focus areas...",
  "Designing your challenge roadmap...",
  "Building daily action plans...",
  "Finalizing your challenge...",
]

interface AnalyzingStepProps {
  goal: string
}

export function AnalyzingStep({ goal }: AnalyzingStepProps) {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => Math.min(prev + 1, MESSAGES.length - 1))
    }, 1200)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="p-8 text-center">
      <div className="flex flex-col items-center gap-6">
        {/* Animated orbs */}
        <div className="relative w-24 h-24">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full"
              style={{
                background: [
                  'rgba(196, 181, 253, 0.3)',
                  'rgba(134, 239, 172, 0.3)',
                  'rgba(253, 186, 116, 0.3)',
                ][i],
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.6, 0.3, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.4,
              }}
            />
          ))}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl animate-float">✨</span>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            AI is crafting your plan
          </h2>
          <motion.p
            key={messageIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-gray-500 dark:text-gray-400 text-sm"
          >
            {MESSAGES[messageIndex]}
          </motion.p>
        </div>

        <div className="w-full bg-gray-100 dark:bg-dark-100 rounded-full h-1.5 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-lavender-400 to-mint-400 rounded-full"
            initial={{ width: '5%' }}
            animate={{ width: '90%' }}
            transition={{ duration: 6, ease: 'easeInOut' }}
          />
        </div>

        <div className="bg-lavender-50 dark:bg-lavender-500/10 rounded-2xl p-4 text-sm text-gray-600 dark:text-gray-300 italic text-left max-w-sm">
          "{goal.length > 120 ? goal.substring(0, 120) + '...' : goal}"
        </div>
      </div>
    </Card>
  )
}
