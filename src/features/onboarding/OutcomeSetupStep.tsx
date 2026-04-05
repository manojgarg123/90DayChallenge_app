import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface SuggestedMetric {
  name: string
  unit: string
  lowerIsBetter: boolean
}

interface MetricEntry {
  localId: string
  name: string
  unit: string
  lowerIsBetter: boolean
  baselineValue: string
}

interface OutcomeSetupStepProps {
  suggestedMetrics: SuggestedMetric[]
  onStart: (metrics: MetricEntry[]) => void
  onSkip: () => void
  saving: boolean
}

let nextId = 0
function genId() { return String(nextId++) }

export function OutcomeSetupStep({ suggestedMetrics, onStart, onSkip, saving }: OutcomeSetupStepProps) {
  const [metrics, setMetrics] = useState<MetricEntry[]>(
    suggestedMetrics.map(m => ({
      localId: genId(),
      name: m.name,
      unit: m.unit,
      lowerIsBetter: m.lowerIsBetter,
      baselineValue: '',
    }))
  )

  function addMetric() {
    setMetrics(prev => [...prev, { localId: genId(), name: '', unit: '', lowerIsBetter: true, baselineValue: '' }])
  }

  function removeMetric(localId: string) {
    setMetrics(prev => prev.filter(m => m.localId !== localId))
  }

  function updateMetric(localId: string, field: keyof MetricEntry, value: string | boolean) {
    setMetrics(prev => prev.map(m => m.localId === localId ? { ...m, [field]: value } : m))
  }

  function handleStart() {
    onStart(metrics.filter(m => m.baselineValue !== '' && m.name !== ''))
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-6">
        <div className="text-center mb-2">
          <div className="text-4xl mb-2">📏</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Set Your Baseline</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track what really changes over your challenge
          </p>
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        {metrics.map((m, i) => (
          <motion.div
            key={m.localId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card className="p-4">
              <div className="flex items-start gap-2 mb-3">
                <div className="flex-1 flex gap-2">
                  <Input
                    value={m.name}
                    onChange={e => updateMetric(m.localId, 'name', e.target.value)}
                    placeholder="Metric name"
                    className="flex-1 text-sm"
                  />
                  <Input
                    value={m.unit}
                    onChange={e => updateMetric(m.localId, 'unit', e.target.value)}
                    placeholder="unit"
                    className="w-20 text-sm"
                  />
                </div>
                <button
                  onClick={() => removeMetric(m.localId)}
                  className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 mt-2 flex-shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                    Starting value {m.unit ? `(${m.unit})` : ''}
                  </label>
                  <Input
                    type="number"
                    value={m.baselineValue}
                    onChange={e => updateMetric(m.localId, 'baselineValue', e.target.value)}
                    placeholder="e.g. 80"
                    className="text-sm"
                  />
                </div>
                <div className="flex-shrink-0 pt-5">
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={m.lowerIsBetter}
                      onChange={e => updateMetric(m.localId, 'lowerIsBetter', e.target.checked)}
                      className="rounded"
                    />
                    Lower is better
                  </label>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}

        <button
          onClick={addMetric}
          className="flex items-center gap-2 text-sm text-lavender-600 dark:text-lavender-400 hover:text-lavender-700 dark:hover:text-lavender-300 py-2 px-1 transition-colors"
        >
          <Plus size={16} />
          Add custom metric
        </button>
      </div>

      <Button onClick={handleStart} loading={saving} size="lg" className="w-full gap-2">
        Start My Challenge! 🚀
      </Button>
      <button
        onClick={onSkip}
        disabled={saving}
        className="text-center text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 py-1 transition-colors"
      >
        Skip for now →
      </button>
    </div>
  )
}
