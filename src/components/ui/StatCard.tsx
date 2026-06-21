'use client'

import { cn } from '@/lib/utils'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  icon: React.ReactNode
  trend?: {
    value: number
    label: string
  }
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'gold'
  className?: string
  loading?: boolean
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  variant = 'default',
  className,
  loading = false,
}: StatCardProps) {
  const variants = {
    default: {
      bg: 'bg-primary/10',
      text: 'text-primary',
      border: 'border-primary/20',
    },
    success: {
      bg: 'bg-success/10',
      text: 'text-success',
      border: 'border-success/20',
    },
    danger: {
      bg: 'bg-danger/10',
      text: 'text-danger',
      border: 'border-danger/20',
    },
    warning: {
      bg: 'bg-warning/10',
      text: 'text-warning',
      border: 'border-warning/20',
    },
    gold: {
      bg: 'bg-gold/10',
      text: 'text-gold',
      border: 'border-gold/20',
    },
  }

  const v = variants[variant]

  if (loading) {
    return (
      <div className={cn('rounded-xl bg-card border border-border p-5 animate-pulse', className)}>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3.5 w-24 rounded bg-muted" />
            <div className="h-8 w-20 rounded bg-muted" />
          </div>
          <div className="h-10 w-10 rounded-lg bg-muted" />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-xl bg-card border border-border p-5 card-lift group',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
          {trend && (
            <div className="flex items-center gap-1.5 mt-1">
              {trend.value > 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5 text-success" />
              ) : trend.value < 0 ? (
                <ArrowDownRight className="h-3.5 w-3.5 text-danger" />
              ) : (
                <Minus className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.value > 0 && 'text-success',
                  trend.value < 0 && 'text-danger',
                  trend.value === 0 && 'text-muted-foreground'
                )}
              >
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110',
            v.bg
          )}
        >
          <span className={v.text}>{icon}</span>
        </div>
      </div>
    </div>
  )
}
