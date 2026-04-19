import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

const features = [
  {
    icon: '🎯',
    title: 'Set your goal',
    description: 'Describe what you want to achieve in your own words',
  },
  {
    icon: '🤖',
    title: 'Get your AI plan',
    description: 'A personalised day-by-day challenge built just for you',
  },
  {
    icon: '📈',
    title: 'Track & win',
    description: 'Log tasks daily and watch your progress grow week by week',
  },
]

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-100 via-mint-50 to-peach-50 dark:from-dark-300 dark:via-dark-200 dark:to-dark-100 flex items-center justify-center p-6">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-lavender-200/40 dark:bg-lavender-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-mint-200/40 dark:bg-mint-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-peach-200/20 dark:bg-peach-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo + headline */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-lavender-400 dark:bg-lavender-500 shadow-pastel mb-5 animate-float">
            <span className="text-4xl">🎯</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
            Meta-Morph
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed">
            Create your better version, one challenge at a time.
          </p>
        </motion.div>

        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex flex-col gap-3 mb-10"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
              className="flex items-start gap-4 bg-white/60 dark:bg-dark-50/60 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-sm"
            >
              <span className="text-2xl leading-none mt-0.5">{f.icon}</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{f.title}</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{f.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="flex flex-col gap-3"
        >
          <Button
            size="lg"
            className="w-full"
            onClick={() => navigate('/auth', { state: { view: 'register' } })}
          >
            Metamorph Me
          </Button>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/auth', { state: { view: 'login' } })}
              className="text-lavender-600 dark:text-lavender-400 font-semibold hover:underline"
            >
              Sign in
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
