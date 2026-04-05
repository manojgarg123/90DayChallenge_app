import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'
import { useAuth } from '@/hooks/useAuth'

export function ProfileAvatar() {
  const navigate = useNavigate()
  const { profile } = useAppStore()
  const { user } = useAuth()

  const initials = (profile?.full_name || user?.email || 'U')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <button
      onClick={() => navigate('/profile')}
      className="w-9 h-9 rounded-xl bg-gradient-to-br from-lavender-300 to-lavender-500 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0"
      aria-label="Go to profile"
    >
      {initials}
    </button>
  )
}
