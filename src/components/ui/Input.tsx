'use client'

import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, leftIcon, rightIcon, className, ...props }, ref) => {
    return (
      <div className={cn('space-y-1.5', className)}>
        {label && (
          <label className="block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full rounded-lg border bg-background text-foreground text-sm placeholder:text-muted-foreground/60 input-focus disabled:opacity-50 disabled:cursor-not-allowed',
              leftIcon ? 'pl-10' : 'px-3',
              rightIcon ? 'pr-10' : 'px-3',
              error
                ? 'border-danger focus:border-danger'
                : 'border-border',
              'py-2.5'
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
        {helper && !error && <p className="text-xs text-muted-foreground">{helper}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
