import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Edit3, LogOut, Bell, Moon, Sun, ChevronRight, Award, Flame, Target } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useActiveChallenge } from '@/hooks/useChallenge'
import { useAppStore } from '@/store'
import { getDayNumber, calculateStreak } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Profile, ProgressLog } from '@/types'

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { challenge } = useActiveChallenge(user?.id)
  const { theme, toggleTheme, profile, setProfile } = useAppStore()

  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [saving, setSaving] = useState(false)
  const [logs, setLogs] = useState<ProgressLog[]>([])
  const [challengeCount, setChallengeCount] = useState(0)

  useEffect(() => {
    if (user) {
      fetchProfile()
      fetchStats()
    }
  }, [user])

  async function fetchProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user!.id)
      .single()
    if (data) {
      setProfile(data as Profile)
      setFullName(data.full_name || '')
      setBio(data.bio || '')
    }
  }

  async function fetchStats() {
    const [logsRes, challengesRes] = await Promise.all([
      supabase
        .from('progress_logs')
        .select('*')
        .eq('user_id', user!.id),
      supabase
        .from('challenges')
        .select('id', { count: 'exact' })
        .eq('user_id', user!.id),
    ])
    if (logsRes.data) setLogs(logsRes.data)
    if (challengesRes.count) setChallengeCount(challengesRes.count)
  }

  async function saveProfile() {
    setSaving(true)
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user!.id,
        full_name: fullName,
        bio,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (!error && data) {
      setProfile(data as Profile)
      setEditing(false)
    }
    setSaving(false)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const streaks = calculateStreak(logs)
  const totalCompleted = logs.filter(l => l.status === 'completed').length
  const dayNumber = challenge ? getDayNumber(challenge.start_date) : 0

  const initials = (profile?.full_name || user?.email || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="min-h-screen bg-gradient-to-b from-blush-50/50 to-white dark:from-dark-200 dark:to-dark-300 pb-24">
      <div className="px-4 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
      </div>

      <div className="px-4 flex flex-col gap-4">
        {/* Avatar + info */}
        <Card className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-lavender-300 to-lavender-500 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex flex-col gap-2">
                  <Input
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Your name"
                    className="text-sm"
                  />
                  <Input
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Short bio..."
                    className="text-sm"
                  />
                  <div className="flex gap-2 mt-1">
                    <Button size="sm" onClick={saveProfile} loading={saving}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-gray-900 dark:text-white">
                      {profile?.full_name || 'Set your name'}
                    </h2>
                    <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      <Edit3 size={14} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                  {profile?.bio && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{profile.bio}</p>
                  )}
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon="🏆" value={challengeCount} label="Challenges" />
          <StatCard icon="🔥" value={streaks.current} label="Streak" />
          <StatCard icon="✅" value={totalCompleted} label="Completed" />
        </div>

        {challenge && (
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-lavender-100 dark:bg-lavender-500/20 flex items-center justify-center">
                <Target size={18} className="text-lavender-600 dark:text-lavender-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">{challenge.title}</p>
                <p className="text-xs text-gray-400">Day {dayNumber} of 90 · Active</p>
              </div>
            </div>
          </Card>
        )}

        {/* Settings */}
        <Card className="overflow-hidden">
          <SettingRow
            icon={theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
            label={`${theme === 'dark' ? 'Dark' : 'Light'} Mode`}
            onClick={toggleTheme}
            rightElement={
              <div className={`w-10 h-6 rounded-full transition-all ${theme === 'dark' ? 'bg-lavender-400' : 'bg-gray-200'} relative`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            }
          />
          <div className="h-px bg-gray-100 dark:bg-dark-100 mx-4" />
          <SettingRow
            icon={<Bell size={18} />}
            label="Notifications"
            onClick={() => navigate('/notifications')}
          />
          <div className="h-px bg-gray-100 dark:bg-dark-100 mx-4" />
          <SettingRow
            icon={<Award size={18} />}
            label="Challenge History"
            onClick={() => navigate('/history')}
          />
        </Card>

        <Button
          variant="danger"
          size="lg"
          className="w-full gap-2"
          onClick={handleSignOut}
        >
          <LogOut size={18} />
          Sign Out
        </Button>
      </div>
    </div>
  )
}

function StatCard({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <Card className="p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xl font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </Card>
  )
}

function SettingRow({
  icon, label, onClick, rightElement,
}: {
  icon: React.ReactNode; label: string; onClick: () => void; rightElement?: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-dark-100/30 transition-colors"
    >
      <span className="text-gray-500 dark:text-gray-400">{icon}</span>
      <span className="flex-1 text-left text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      {rightElement || <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />}
    </button>
  )
}
