import { ProgressRing } from '@/components/ui/ProgressRing'
import type { Segment } from '@/types'

interface SegmentProgressCardProps {
  segment: Segment
  progress: number
  color: string
}

export function SegmentProgressCard({ segment, progress, color }: SegmentProgressCardProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <ProgressRing
        progress={progress}
        size={64}
        strokeWidth={6}
        color={color}
        label={`${progress}%`}
      >
        <span className="text-xl">{segment.icon}</span>
      </ProgressRing>
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center max-w-[64px] leading-tight">
        {segment.name.length > 10 ? segment.name.substring(0, 10) + '…' : segment.name}
      </span>
    </div>
  )
}
