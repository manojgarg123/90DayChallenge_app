import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { OutcomeMetric, OutcomeLog } from '@/types'

export function useOutcomes(challengeId: string | undefined) {
  const [metrics, setMetrics] = useState<OutcomeMetric[]>([])
  const [logs, setLogs] = useState<OutcomeLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!challengeId) {
      setLoading(false)
      return
    }
    fetchOutcomes()
  }, [challengeId])

  async function fetchOutcomes() {
    try {
      setLoading(true)
      const [metricsRes, logsRes] = await Promise.all([
        supabase
          .from('outcome_metrics')
          .select('*')
          .eq('challenge_id', challengeId)
          .order('created_at'),
        supabase
          .from('outcome_logs')
          .select('*')
          .eq('challenge_id', challengeId)
          .order('week_number'),
      ])
      if (metricsRes.data) setMetrics(metricsRes.data)
      if (logsRes.data) setLogs(logsRes.data)
    } finally {
      setLoading(false)
    }
  }

  async function saveLog(metricId: string, weekNumber: number, value: number) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase
      .from('outcome_logs')
      .upsert({
        metric_id: metricId,
        challenge_id: challengeId!,
        user_id: user!.id,
        week_number: weekNumber,
        value,
        logged_date: new Date().toISOString().split('T')[0],
      }, { onConflict: 'metric_id,week_number' })
    await fetchOutcomes()
  }

  return { metrics, logs, loading, saveLog, refetch: fetchOutcomes }
}
