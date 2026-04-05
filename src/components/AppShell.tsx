import { useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useActiveChallenge } from '@/hooks/useChallenge'
import { useAppStore } from '@/store'
import { BottomNav } from './BottomNav'

const PUBLIC_ROUTES = ['/', '/auth']
const ONBOARDING_ROUTE = '/onboarding'
const PROTECTED_ROUTES = ['/dashboard', '/log', '/plan', '/weekly', '/profile', '/history', '/notifications']

export function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()
  const { challenge, loading: challengeLoading } = useActiveChallenge(user?.id)
  const { theme } = useAppStore()

  const showNav = PROTECTED_ROUTES.some(r => location.pathname.startsWith(r))

  useEffect(() => {
    if (authLoading || challengeLoading) return

    if (!user && !PUBLIC_ROUTES.includes(location.pathname)) {
      navigate('/auth', { replace: true })
      return
    }

    if (user && PUBLIC_ROUTES.includes(location.pathname)) {
      if (!challengeLoading && challenge === null) {
        navigate('/onboarding', { replace: true })
      } else if (challenge) {
        navigate('/dashboard', { replace: true })
      }
    }

    if (user && location.pathname === ONBOARDING_ROUTE && challenge) {
      // Only redirect away from onboarding if the user arrived here accidentally
      // (e.g. direct URL) — not when navigated intentionally from History page.
      // We use location.state to signal intentional navigation.
      if (!location.state?.newChallenge) {
        navigate('/dashboard', { replace: true })
      }
    }
  }, [user, challenge, authLoading, challengeLoading, location.pathname])

  if (authLoading || (!!user && challengeLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lavender-100 to-mint-50 dark:from-dark-300 dark:to-dark-200">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-3xl bg-lavender-400 dark:bg-lavender-500 flex items-center justify-center shadow-pastel animate-float">
            <span className="text-2xl">🎯</span>
          </div>
          <div className="w-6 h-6 border-2 border-lavender-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className={`${theme} min-h-screen`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
      {showNav && <BottomNav />}
    </div>
  )
}
