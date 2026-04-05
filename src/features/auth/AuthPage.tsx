import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { ForgotPasswordForm } from './ForgotPasswordForm'

type AuthView = 'login' | 'register' | 'forgot'

export function AuthPage() {
  const [view, setView] = useState<AuthView>('login')

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-100 via-mint-50 to-peach-50 dark:from-dark-300 dark:via-dark-200 dark:to-dark-100 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-lavender-200/40 dark:bg-lavender-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-mint-200/40 dark:bg-mint-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-peach-200/20 dark:bg-peach-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-lavender-400 dark:bg-lavender-500 shadow-pastel mb-4 animate-float">
            <span className="text-2xl">🎯</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meta-Morph</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Transform your life, one challenge at a time</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {view === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <LoginForm
                onRegister={() => setView('register')}
                onForgot={() => setView('forgot')}
              />
            </motion.div>
          )}
          {view === 'register' && (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <RegisterForm onLogin={() => setView('login')} />
            </motion.div>
          )}
          {view === 'forgot' && (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <ForgotPasswordForm onBack={() => setView('login')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
