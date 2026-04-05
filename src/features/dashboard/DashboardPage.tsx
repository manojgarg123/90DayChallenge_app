import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Bell, Plus, Sun, Moon } from 'lucide-react'
import { ProfileAvatar } from '@/components/ProfileAvatar'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useActiveChallenge } from '@/hooks/useChallenge'
import { useAppStore } from '@/store'
import { getDayNumber, getDaysRemaining, getProgressPercentage, calculateStreak } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { Button } from '@/components/ui/Button'
import { SegmentProgressCard } from './SegmentProgressCard'
import { TodayTasksList } from './TodayTasksList'
import { NudgesBanner } from './NudgesBanner'
import type { ProgressLog } from '@/types'

export function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { challenge, segments, loading } = useActiveChallenge(user?.id)
  const { theme, toggleTheme, profile } = useAppStore()

  const [allLogs, setAllLogs] = useState<ProgressLog[]>([])
  const [nudges, setNudges] = useState<Array<{ id: string; message: string; type: string }>>([])

  const dayNumber = challenge ? getDayNumber(challenge.start_date) : 1
  const weekNumber = Math.ceil(dayNumber / 7)

  useEffect(() => {
    if (challenge) {
      fetchLogs()
      fetchNudges()
    }
  }, [challenge])

  async function fetchLogs() {
    const { data } = await supabase
      .from('progress_logs')
      .select('*, task:tasks(segment_id)')
      .eq('challenge_id', challenge!.id)
      .order('logged_date', { ascending: false })
    if (data) setAllLogs(data as any)
  }

  async function fetchNudges() {
    const { data } = await supabase
      .from('nudges')
      .select('*')
      .eq('user_id', user!.id)
      .eq('read', false)
      .order('scheduled_for', { ascending: false })
      .limit(3)
    if (data) setNudges(data)
  }

  const streaks = calculateStreak(allLogs)
  const overallProgress = challenge
    ? getProgressPercentage(allLogs.filter(l => l.status === 'completed').length, dayNumber * segments.length)
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-lavender-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="text-5xl mb-4 animate-float">🎯</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No active challenge</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          Start your 90-day journey today!
        </p>
        <Button onClick={() => navigate('/onboarding', { state: { newChallenge: true } })} size="lg">
          <Plus size={18} />
          Start a New Challenge
        </Button>
      </div>
    )
  }

  const progressRingColor = overallProgress >= 80 ? '#4ade80' : overallProgress >= 50 ? '#a78bfa' : '#fb923c'

  return (
    <div className="min-h-screen bg-gradient-to-b from-lavender-50/50 to-white dark:from-dark-200 dark:to-dark-300 pb-24">
      <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="px-4 pt-8 sm:pt-12 pb-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {format(new Date(), 'EEEE, MMMM d')}
            </p>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Hey, {profile?.full_name?.split(' ')[0] || 'there'} 👋
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/70 dark:bg-dark-50/70 border border-gray-100 dark:border-dark-100"
            >
              {theme === 'dark' ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} className="text-gray-600" />}
            </button>
            <button
              onClick={() => navigate('/notifications')}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center bg-white/70 dark:bg-dark-50/70 border border-gray-100 dark:border-dark-100"
            >
              <Bell size={16} className="text-gray-600 dark:text-gray-400" />
              {nudges.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-lavender-400 rounded-full text-white text-xs flex items-center justify-center">
                  {nudges.length}
                </span>
              )}
            </button>
            <ProfileAvatar />
          </div>
        </div>
      </div>

      <div className="px-4 pb-2 flex flex-col gap-4">
        {/* Nudges Banner */}
        {nudges.length > 0 && (
          <NudgesBanner nudge={nudges[0]} onDismiss={() => {
            supabase.from('nudges').update({ read: true }).eq('id', nudges[0].id)
            setNudges(prev => prev.slice(1))
          }} />
        )}

        {/* Challenge Overview Card */}
        <Card className="p-5" glow>
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 dark:text-white truncate">{challenge.title}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Day {dayNumber} of 90 · Week {weekNumber}</p>
            </div>
            <ProgressRing
              progress={overallProgress}
              size={72}
              strokeWidth={7}
              color={progressRingColor}
            >
              <div className="text-center">
                <div className="text-sm font-bold text-gray-900 dark:text-white">{overallProgress}%</div>
              </div>
            </ProgressRing>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <StatChip label="Day" value={dayNumber} icon="📅" />
            <StatChip label="Streak" value={`${streaks.current}🔥`} icon="" />
            <StatChip label="Best" value={`${streaks.longest}⭐`} icon="" />
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Overall progress</span>
              <span>{getDaysRemaining(challenge.end_date)} days left</span>
            </div>
            <div className="w-full h-2 bg-gray-100 dark:bg-dark-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-lavender-400 to-mint-400"
                initial={{ width: 0 }}
                animate={{ width: `${(dayNumber / 90) * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
        </Card>

        {/* Segment progress rings */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">Focus Areas</h3>
          <div className="flex justify-around flex-wrap gap-3">
            {segments.map((seg, i) => {
              const completed = allLogs.filter(
                l => (l as any).task?.segment_id === seg.id && l.status === 'completed'
              ).length
              const segProgress = getProgressPercentage(completed, dayNumber)
              const ringColors = ['#a78bfa', '#4ade80', '#fb923c', '#38bdf8', '#fb7185']
              return (
                <SegmentProgressCard
                  key={seg.id}
                  segment={seg}
                  progress={segProgress}
                  color={ringColors[i % ringColors.length]}
                />
              )
            })}
          </div>
        </Card>

        {/* Today's Tasks */}
        <TodayTasksList
          challengeId={challenge.id}
          dayNumber={dayNumber}
          onLogComplete={fetchLogs}
        />
      </div>
      </div>
    </div>
  )
}

function StatChip({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="bg-gray-50 dark:bg-dark-100/50 rounded-2xl p-3 text-center">
      <div className="text-lg font-bold text-gray-900 dark:text-white">
        {icon}{value}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  )
}
