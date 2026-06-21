'use client'

import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'danger' | 'warning' | 'info' | 'gold'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
  dot?: boolean
}

export function Badge({ children, variant = 'default', className, dot = false }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-success-muted text-success status-glow-success',
    danger: 'bg-danger-muted text-danger status-glow-danger',
    warning: 'bg-warning-muted text-warning status-glow-warning',
    info: 'bg-info-muted text-info',
    gold: 'bg-gold-muted text-gold status-glow-gold',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        variants[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'success' && 'bg-success',
            variant === 'danger' && 'bg-danger',
            variant === 'warning' && 'bg-warning',
            variant === 'gold' && 'bg-gold',
            variant === 'default' && 'bg-muted-foreground',
            variant === 'info' && 'bg-info'
          )}
        />
      )}
      {children}
    </span>
  )
}
