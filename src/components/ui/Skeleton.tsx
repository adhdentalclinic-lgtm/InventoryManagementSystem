'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string
  height?: string
}

export function Skeleton({ className, variant = 'text', width, height }: SkeletonProps) {
  const variants = {
    text: 'rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  }

  return (
    <div
      className={cn('shimmer', variants[variant], className)}
      style={{ width, height }}
    />
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl bg-card border border-border p-5 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <Skeleton width="120px" height="16px" />
        <Skeleton variant="circular" width="40px" height="40px" />
      </div>
      <Skeleton width="80px" height="32px" />
    </div>
  )
}

export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <Skeleton width={`${60 + Math.random() * 30}%`} height="14px" />
        </td>
      ))}
    </tr>
  )
}
