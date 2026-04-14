import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  rightElement?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, rightElement, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full rounded-2xl border bg-white/70 dark:bg-dark-50/70 backdrop-blur-sm px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500',
              'border-gray-200 dark:border-dark-50 focus:border-lavender-400 dark:focus:border-lavender-500',
              'focus:outline-none focus:ring-2 focus:ring-lavender-300/50 dark:focus:ring-lavender-500/30',
              'transition-all duration-200',
              icon && 'pl-10',
              rightElement && 'pr-10',
              error && 'border-red-400 focus:border-red-400 focus:ring-red-300/50',
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full rounded-2xl border bg-white/70 dark:bg-dark-50/70 backdrop-blur-sm px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500',
            'border-gray-200 dark:border-dark-50 focus:border-lavender-400 dark:focus:border-lavender-500',
            'focus:outline-none focus:ring-2 focus:ring-lavender-300/50 dark:focus:ring-lavender-500/30',
            'transition-all duration-200 resize-none',
            error && 'border-red-400 focus:border-red-400 focus:ring-red-300/50',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
