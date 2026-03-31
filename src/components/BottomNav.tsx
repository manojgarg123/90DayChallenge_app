import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, ListChecks, BarChart3, Calendar, User } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/dashboard', icon: Home, label: 'Home' },
  { path: '/log', icon: ListChecks, label: 'Log' },
  { path: '/plan', icon: Calendar, label: 'Plan' },
  { path: '/weekly', icon: BarChart3, label: 'Weekly' },
  { path: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Blur backdrop */}
      <div className="bg-white/80 dark:bg-dark-100/80 backdrop-blur-xl border-t border-gray-100 dark:border-dark-50 px-2 pb-safe">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="flex flex-col items-center gap-0.5 py-3 px-4 relative"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute top-1.5 w-5 h-1 bg-lavender-400 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon
                  size={22}
                  className={`transition-colors ${
                    isActive
                      ? 'text-lavender-500 dark:text-lavender-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                />
                <span className={`text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-lavender-500 dark:text-lavender-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
