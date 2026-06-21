'use client'

import { cn } from '@/lib/utils'
import { Loader as Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 border-transparent',
    secondary: 'bg-muted text-foreground hover:bg-muted/80 border-border',
    ghost: 'bg-transparent text-foreground hover:bg-muted border-transparent',
    danger: 'bg-danger text-white hover:bg-danger/90 border-transparent',
    success: 'bg-success text-white hover:bg-success/90 border-transparent',
  }

  const sizes = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2.5',
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium border transition-all duration-150 btn-press focus-ring disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {!loading && leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
}
