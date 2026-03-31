import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Challenge, Segment, Task, ProgressLog } from '@/types'

export function useActiveChallenge(userId: string | undefined) {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    fetchActiveChallenge()
  }, [userId])

  async function fetchActiveChallenge() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setChallenge(data)
        await fetchSegments(data.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load challenge')
    } finally {
      setLoading(false)
    }
  }

  async function fetchSegments(challengeId: string) {
    const { data, error } = await supabase
      .from('segments')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('order_index')

    if (!error && data) setSegments(data)
  }

  return { challenge, segments, loading, error, refetch: fetchActiveChallenge }
}

export function useTodayTasks(challengeId: string | undefined, dayNumber: number) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [logs, setLogs] = useState<ProgressLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!challengeId) {
      setLoading(false)
      return
    }
    fetchTodayTasks()
  }, [challengeId, dayNumber])

  async function fetchTodayTasks() {
    try {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]

      const [tasksRes, logsRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('*, segment:segments(name, icon, color)')
          .eq('challenge_id', challengeId)
          .eq('day_number', dayNumber),
        supabase
          .from('progress_logs')
          .select('*')
          .eq('challenge_id', challengeId)
          .eq('logged_date', today),
      ])

      if (tasksRes.data) setTasks(tasksRes.data as Task[])
      if (logsRes.data) setLogs(logsRes.data)
    } finally {
      setLoading(false)
    }
  }

  async function logTask(taskId: string, status: 'completed' | 'skipped' | 'partial', notes?: string) {
    const today = new Date().toISOString().split('T')[0]
    const existingLog = logs.find(l => l.task_id === taskId)

    if (existingLog) {
      const { data } = await supabase
        .from('progress_logs')
        .update({ status, notes: notes ?? null })
        .eq('id', existingLog.id)
        .select()
        .single()

      if (data) {
        setLogs(prev => prev.map(l => l.id === existingLog.id ? data : l))
      }
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase
        .from('progress_logs')
        .insert({
          task_id: taskId,
          challenge_id: challengeId!,
          user_id: user!.id,
          logged_date: today,
          status,
          notes: notes ?? null,
        })
        .select()
        .single()

      if (data) setLogs(prev => [...prev, data])
    }
  }

  return { tasks, logs, loading, logTask, refetch: fetchTodayTasks }
}
