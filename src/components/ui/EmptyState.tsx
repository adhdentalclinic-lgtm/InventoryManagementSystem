'use client'

import { cn } from '@/lib/utils'
import { SearchX, Package, Inbox } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: 'search' | 'package' | 'inbox'
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  title = 'No results found',
  description = 'Try adjusting your search or filters.',
  icon = 'search',
  action,
  className,
}: EmptyStateProps) {
  const icons = {
    search: SearchX,
    package: Package,
    inbox: Inbox,
  }

  const Icon = icons[icon]

  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
        <Icon className="h-8 w-8 text-muted-foreground/60" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
