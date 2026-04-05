import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, CheckCircle, XCircle, Clock, Trophy } from 'lucide-react'
import { ProfileAvatar } from '@/components/ProfileAvatar'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { formatDate, getDaysRemaining, getChallengeDuration } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Challenge } from '@/types'

interface ChallengeWithStats extends Challenge {
  completion_rate: number
  completed_tasks: number
  total_tasks: number
}

export function HistoryPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [challenges, setChallenges] = useState<ChallengeWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  useEffect(() => {
    if (user) fetchChallenges()
  }, [user])

  async function fetchChallenges() {
    setLoading(true)
    const { data } = await supabase
      .from('challenges')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })

    if (data) {
      // Fetch completion stats for each challenge
      const withStats = await Promise.all(
        data.map(async (c) => {
          const [tasksRes, logsRes] = await Promise.all([
            supabase.from('tasks').select('id', { count: 'exact' }).eq('challenge_id', c.id),
            supabase.from('progress_logs').select('id', { count: 'exact' }).eq('challenge_id', c.id).eq('status', 'completed'),
          ])
          const total = tasksRes.count || 0
          const completed = logsRes.count || 0
          return {
            ...c,
            total_tasks: total,
            completed_tasks: completed,
            completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
          }
        })
      )
      setChallenges(withStats)
    }
    setLoading(false)
  }

  async function handleDeactivate(challengeId: string) {
    setActionLoadingId(challengeId)
    await supabase
      .from('challenges')
      .update({ status: 'abandoned' })
      .eq('id', challengeId)
      .eq('user_id', user!.id)
    setChallenges(prev =>
      prev.map(c => c.id === challengeId ? { ...c, status: 'abandoned' as const } : c)
    )
    setActionLoadingId(null)
  }

  async function handleDelete(challengeId: string) {
    setActionLoadingId(challengeId)
    await supabase
      .from('challenges')
      .delete()
      .eq('id', challengeId)
      .eq('user_id', user!.id)
    setChallenges(prev => prev.filter(c => c.id !== challengeId))
    setConfirmDeleteId(null)
    setActionLoadingId(null)
  }

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'completed') return <CheckCircle size={16} className="text-mint-500" />
    if (status === 'abandoned') return <XCircle size={16} className="text-blush-400" />
    return <Clock size={16} className="text-lavender-400" />
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'lavender' as const,
      completed: 'mint' as const,
      abandoned: 'blush' as const,
    }
    return variants[status as keyof typeof variants] || 'gray' as const
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-mint-50/50 to-white dark:from-dark-200 dark:to-dark-300 pb-24">
      <div className="max-w-lg mx-auto">
      <div className="px-4 pt-8 sm:pt-12 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Challenge History</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">All your challenges</p>
          </div>
          <ProfileAvatar />
        </div>
      </div>

      <div className="px-4 flex flex-col gap-3">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-white/60 dark:bg-dark-50/60 rounded-3xl animate-pulse" />
          ))
        ) : challenges.length === 0 ? (
          <div className="text-center py-16">
            <Trophy size={48} className="mx-auto mb-4 text-gray-200 dark:text-dark-100" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No challenges yet</h3>
            <p className="text-sm text-gray-400 mb-6">Start your first challenge!</p>
            <Button onClick={() => navigate('/onboarding', { state: { newChallenge: true } })}>
              <Plus size={16} />
              New Challenge
            </Button>
          </div>
        ) : (
          <>
            {challenges.map((challenge, i) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white leading-snug line-clamp-1">
                          {challenge.title}
                        </h3>
                        <span className="text-xs font-medium text-lavender-500 dark:text-lavender-400 bg-lavender-50 dark:bg-lavender-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
                          {Math.round(getChallengeDuration(challenge.start_date, challenge.end_date) / 7)} wks
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{challenge.goal_description}</p>
                    </div>
                    <Badge variant={getStatusBadge(challenge.status)} size="sm">
                      <StatusIcon status={challenge.status} />
                      <span className="ml-1 capitalize">{challenge.status}</span>
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <span>📅 {formatDate(challenge.start_date)}</span>
                    {challenge.status === 'active' && (
                      <span>⏳ {getDaysRemaining(challenge.end_date)} days left</span>
                    )}
                    {challenge.status !== 'active' && (
                      <span>🏁 {formatDate(challenge.end_date)}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-dark-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-lavender-400 to-mint-400 transition-all"
                        style={{ width: `${challenge.completion_rate}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      {challenge.completion_rate}%
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                    {challenge.completed_tasks} / {challenge.total_tasks} tasks completed
                  </p>

                  {/* Actions */}
                  {challenge.status === 'active' && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-100">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeactivate(challenge.id)}
                        loading={actionLoadingId === challenge.id}
                      >
                        Deactivate Challenge
                      </Button>
                    </div>
                  )}

                  {(challenge.status === 'abandoned' || challenge.status === 'completed') && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-100">
                      {confirmDeleteId === challenge.id ? (
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex-1">
                            This will permanently delete all data. Are you sure?
                          </p>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(challenge.id)}
                            loading={actionLoadingId === challenge.id}
                          >
                            Yes, Delete
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setConfirmDeleteId(challenge.id)}
                        >
                          Delete Challenge
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}

            <Button
              variant="secondary"
              size="lg"
              className="w-full gap-2"
              onClick={() => navigate('/onboarding', { state: { newChallenge: true } })}
            >
              <Plus size={18} />
              Start New Challenge
            </Button>
          </>
        )}
      </div>
      </div>
    </div>
  )
}
