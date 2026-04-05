import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'solid'
  glow?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'glass', glow, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-3xl transition-all duration-200',
          {
            'bg-white/60 dark:bg-dark-50/60 backdrop-blur-md border border-white/40 dark:border-white/5 shadow-sm':
              variant === 'glass',
            'bg-white dark:bg-dark-50 border border-gray-100 dark:border-dark-100 shadow-sm':
              variant === 'solid',
            'bg-transparent': variant === 'default',
          },
          glow && 'shadow-pastel dark:shadow-dark-pastel',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'
