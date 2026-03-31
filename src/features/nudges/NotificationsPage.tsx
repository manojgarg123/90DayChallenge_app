import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, Check } from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { Nudge } from '@/types'

const NUDGE_ICONS: Record<string, string> = {
  motivation: '✨',
  reminder: '⏰',
  milestone: '🏆',
  warning: '⚡',
}

export function NotificationsPage() {
  const { user } = useAuth()
  const [nudges, setNudges] = useState<Nudge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchNudges()
  }, [user])

  async function fetchNudges() {
    setLoading(true)
    const { data } = await supabase
      .from('nudges')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setNudges(data)
    setLoading(false)
  }

  async function markAllRead() {
    await supabase
      .from('nudges')
      .update({ read: true })
      .eq('user_id', user!.id)
      .eq('read', false)
    setNudges(prev => prev.map(n => ({ ...n, read: true })))
  }

  async function markRead(nudgeId: string) {
    await supabase.from('nudges').update({ read: true }).eq('id', nudgeId)
    setNudges(prev => prev.map(n => n.id === nudgeId ? { ...n, read: true } : n))
  }

  const unreadCount = nudges.filter(n => !n.read).length

  return (
    <div className="min-h-screen bg-gradient-to-b from-lavender-50/50 to-white dark:from-dark-200 dark:to-dark-300 pb-24">
      <div className="px-4 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-lavender-500 dark:text-lavender-400">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="gap-1">
              <Check size={14} />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 flex flex-col gap-2">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-white/60 dark:bg-dark-50/60 rounded-3xl animate-pulse" />
          ))
        ) : nudges.length === 0 ? (
          <div className="text-center py-16">
            <Bell size={48} className="mx-auto mb-4 text-gray-200 dark:text-dark-100" />
            <p className="text-gray-400">No notifications yet</p>
            <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">You'll receive nudges and reminders here</p>
          </div>
        ) : (
          nudges.map((nudge, i) => (
            <motion.div
              key={nudge.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card
                className={`p-4 cursor-pointer ${!nudge.read ? 'border-lavender-200 dark:border-lavender-500/20' : ''}`}
                onClick={() => !nudge.read && markRead(nudge.id)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0 mt-0.5">
                    {NUDGE_ICONS[nudge.type] || '📢'}
                  </span>
                  <div className="flex-1">
                    <p className={`text-sm leading-relaxed ${nudge.read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white font-medium'}`}>
                      {nudge.message}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                      {format(new Date(nudge.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  {!nudge.read && (
                    <div className="w-2 h-2 bg-lavender-400 rounded-full flex-shrink-0 mt-1.5" />
                  )}
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
