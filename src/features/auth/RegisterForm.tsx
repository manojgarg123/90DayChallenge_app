import { useState } from 'react'
import { Mail, Lock, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface RegisterFormProps {
  onLogin: () => void
}

export function RegisterForm({ onLogin }: RegisterFormProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <Card className="p-6 text-center">
        <div className="text-4xl mb-4">📬</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Check your email</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
        </p>
        <Button variant="secondary" onClick={onLogin} className="w-full">
          Back to Sign In
        </Button>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Start your journey</h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Create a free account</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          type="text"
          label="Full name"
          placeholder="Alex Johnson"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          icon={<User size={16} />}
          required
          autoComplete="name"
        />
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
          placeholder="At least 8 characters"
          value={password}
          onChange={e => setPassword(e.target.value)}
          icon={<Lock size={16} />}
          required
          autoComplete="new-password"
        />
        <Input
          type="password"
          label="Confirm password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          icon={<Lock size={16} />}
          required
          autoComplete="new-password"
        />

        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
        Already have an account?{' '}
        <button
          onClick={onLogin}
          className="text-lavender-600 dark:text-lavender-400 font-semibold hover:underline"
        >
          Sign in
        </button>
      </p>
    </Card>
  )
}
