import { useState } from 'react'
import { Mail, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface LoginFormProps {
  onRegister: () => void
  onForgot: () => void
}

export function LoginForm({ onRegister, onForgot }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Welcome back</h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Sign in to your account</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          type="email"
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          icon={<Mail size={16} />}
          required
          autoComplete="email"
        />
        <Input
          type="password"
          label="Password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          icon={<Lock size={16} />}
          required
          autoComplete="current-password"
        />

        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={onForgot}
          className="text-sm text-lavender-600 dark:text-lavender-400 hover:underline text-right"
        >
          Forgot password?
        </button>

        <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
          Sign In
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
        Don't have an account?{' '}
        <button
          onClick={onRegister}
          className="text-lavender-600 dark:text-lavender-400 font-semibold hover:underline"
        >
          Create one
        </button>
      </p>
    </Card>
  )
}
