import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'lavender' | 'mint' | 'peach' | 'sky' | 'blush' | 'gray'
  size?: 'sm' | 'md'
}

export function Badge({ className, variant = 'lavender', size = 'sm', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        {
          'bg-lavender-100 text-lavender-700 dark:bg-lavender-500/20 dark:text-lavender-300': variant === 'lavender',
          'bg-mint-100 text-mint-700 dark:bg-mint-500/20 dark:text-mint-300': variant === 'mint',
          'bg-peach-100 text-peach-700 dark:bg-peach-500/20 dark:text-peach-300': variant === 'peach',
          'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300': variant === 'sky',
          'bg-blush-100 text-blush-700 dark:bg-blush-500/20 dark:text-blush-300': variant === 'blush',
          'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400': variant === 'gray',
        },
        {
          'text-xs px-2.5 py-0.5': size === 'sm',
          'text-sm px-3 py-1': size === 'md',
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
