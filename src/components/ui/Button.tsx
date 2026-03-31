import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-lavender-400 hover:bg-lavender-500 text-white shadow-pastel hover:shadow-pastel-lg dark:bg-lavender-500 dark:hover:bg-lavender-400':
              variant === 'primary',
            'bg-lavender-50 hover:bg-lavender-100 text-lavender-700 dark:bg-dark-50 dark:hover:bg-dark-100 dark:text-lavender-300':
              variant === 'secondary',
            'hover:bg-lavender-50 text-lavender-600 dark:hover:bg-dark-50 dark:text-lavender-400':
              variant === 'ghost',
            'bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-400':
              variant === 'danger',
            'border-2 border-lavender-300 hover:border-lavender-400 text-lavender-600 dark:border-lavender-600 dark:text-lavender-400':
              variant === 'outline',
          },
          {
            'text-sm px-4 py-2 gap-1.5': size === 'sm',
            'text-base px-6 py-3 gap-2': size === 'md',
            'text-lg px-8 py-4 gap-2.5': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : null}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
