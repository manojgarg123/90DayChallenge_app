import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, TrendingUp, Target, Zap } from 'lucide-react'
import { ProfileAvatar } from '@/components/ProfileAvatar'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useActiveChallenge } from '@/hooks/useChallenge'
import { getDayNumber } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export function WeeklySummaryPage() {
  const { user } = useAuth()
  const { challenge, segments } = useActiveChallenge(user?.id)
  const currentDay = challenge ? getDayNumber(challenge.start_date) : 1
  const currentWeek = Math.ceil(currentDay / 7)
  const [selectedWeek, setSelectedWeek] = useState(currentWeek)
  const [summaryData, setSummaryData] = useState<{
    totalTasks: number
    completedTasks: number
    skippedTasks: number
    completionRate: number
    segmentData: Array<{ name: string; completed: number; total: number; icon: string }>
    dailyData: Array<{ day: string; completed: number; total: number }>
  } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (challenge) {
      setSelectedWeek(currentWeek)
    }
  }, [challenge])

  useEffect(() => {
    if (challenge) fetchWeeklySummary()
  }, [challenge, selectedWeek])

  async function fetchWeeklySummary() {
    if (!challenge) return
    setLoading(true)

    const startDay = (selectedWeek - 1) * 7 + 1
    const endDay = Math.min(selectedWeek * 7, 90)

    const [tasksRes, logsRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('*, segment:segments(name, icon)')
        .eq('challenge_id', challenge.id)
        .gte('day_number', startDay)
        .lte('day_number', endDay),
      supabase
        .from('progress_logs')
        .select('*, task:tasks(day_number, segment_id)')
        .eq('challenge_id', challenge.id)
        .gte('day_number', startDay)
        .lte('day_number', endDay),
    ])

    const tasks = tasksRes.data || []
    const logs = logsRes.data || []

    const completedLogs = logs.filter(l => l.status === 'completed')
    const skippedLogs = logs.filter(l => l.status === 'skipped')

    // Segment breakdown
    const segmentData = segments.map(seg => {
      const segTasks = tasks.filter(t => t.segment_id === seg.id)
      const segCompleted = completedLogs.filter(l =>
        segTasks.some(t => t.id === l.task_id)
      ).length
      return {
        name: seg.name.length > 10 ? seg.name.slice(0, 10) + '…' : seg.name,
        completed: segCompleted,
        total: segTasks.length,
        icon: seg.icon,
      }
    })

    // Daily breakdown
    const dailyData = Array.from({ length: endDay - startDay + 1 }, (_, i) => {
      const dayNum = startDay + i
      const dayTasks = tasks.filter(t => t.day_number === dayNum)
      const dayCompleted = completedLogs.filter(l =>
        dayTasks.some(t => t.id === l.task_id)
      ).length
      return {
        day: `D${dayNum}`,
        completed: dayCompleted,
        total: dayTasks.length,
      }
    })

    setSummaryData({
      totalTasks: tasks.length,
      completedTasks: completedLogs.length,
      skippedTasks: skippedLogs.length,
      completionRate: tasks.length > 0 ? Math.round((completedLogs.length / tasks.length) * 100) : 0,
      segmentData,
      dailyData,
    })
    setLoading(false)
  }

  const getRatingEmoji = (rate: number) => {
    if (rate >= 90) return { emoji: '🏆', label: 'Exceptional', color: 'mint' as const }
    if (rate >= 70) return { emoji: '⭐', label: 'Strong week', color: 'lavender' as const }
    if (rate >= 50) return { emoji: '👍', label: 'Good effort', color: 'sky' as const }
    if (rate >= 30) return { emoji: '💪', label: 'Keep going', color: 'peach' as const }
    return { emoji: '🌱', label: 'Room to grow', color: 'blush' as const }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/50 to-white dark:from-dark-200 dark:to-dark-300 pb-24">
      <div className="max-w-lg mx-auto">
      <div className="px-4 pt-8 sm:pt-12 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Weekly Report</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Track your progress week by week</p>
          </div>
          <ProfileAvatar />
        </div>
      </div>

      {/* Week selector */}
      <div className="px-4 mb-4">
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedWeek(w => Math.max(1, w - 1))}
              disabled={selectedWeek === 1}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-dark-100 disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="text-center">
              <p className="font-bold text-gray-900 dark:text-white">Week {selectedWeek}</p>
              <p className="text-xs text-gray-400">
                Days {(selectedWeek - 1) * 7 + 1}–{Math.min(selectedWeek * 7, 90)}
                {selectedWeek === currentWeek && ' (current)'}
              </p>
            </div>
            <button
              onClick={() => setSelectedWeek(w => Math.min(13, w + 1))}
              disabled={selectedWeek >= currentWeek}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-dark-100 disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </Card>
      </div>

      {loading ? (
        <div className="px-4 pb-2 flex flex-col gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-white/60 dark:bg-dark-50/60 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : summaryData ? (
        <div className="px-4 pb-2 flex flex-col gap-4">
          {/* Summary header */}
          {(() => {
            const rating = getRatingEmoji(summaryData.completionRate)
            return (
              <Card className="p-5" glow>
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{rating.emoji}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl font-bold text-gray-900 dark:text-white">
                        {summaryData.completionRate}%
                      </span>
                      <Badge variant={rating.color}>{rating.label}</Badge>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">completion rate this week</p>
                  </div>
                </div>
              </Card>
            )
          })()}

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={<Target size={18} className="text-lavender-500" />} value={summaryData.totalTasks} label="Scheduled" />
            <StatCard icon={<TrendingUp size={18} className="text-mint-500" />} value={summaryData.completedTasks} label="Completed" color="text-mint-600 dark:text-mint-400" />
            <StatCard icon={<Zap size={18} className="text-peach-500" />} value={summaryData.skippedTasks} label="Skipped" color="text-peach-600 dark:text-peach-400" />
          </div>

          {/* Daily bar chart */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Daily Breakdown</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={summaryData.dailyData} barSize={20} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.1)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-gray-400" />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(30,30,46,0.9)',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="total" fill="rgba(196,181,253,0.2)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" radius={[4, 4, 0, 0]}>
                  {summaryData.dailyData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.completed === entry.total && entry.total > 0 ? '#4ade80' : '#a78bfa'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Segment breakdown */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">By Focus Area</h3>
            <div className="flex flex-col gap-3">
              {summaryData.segmentData.map((seg, i) => {
                const pct = seg.total > 0 ? Math.round((seg.completed / seg.total) * 100) : 0
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-base">{seg.icon}</span>
                      <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{seg.name}</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-dark-100 rounded-full overflow-hidden ml-7">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: ['#a78bfa', '#4ade80', '#fb923c', '#38bdf8', '#fb7185'][i % 5] }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                      />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </Card>
        </div>
      ) : null}
      </div>
    </div>
  )
}

function StatCard({
  icon, value, label, color = 'text-gray-900 dark:text-white'
}: {
  icon: React.ReactNode; value: number; label: string; color?: string
}) {
  return (
    <Card className="p-4 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
    </Card>
  )
}
