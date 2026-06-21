'use client'

import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useState } from 'react'

interface DataTableProps<T> {
  data: T[]
  columns: {
    key: string
    header: string
    render?: (row: T) => React.ReactNode
    align?: 'left' | 'right' | 'center'
    width?: string
  }[]
  keyExtractor: (row: T) => string
  loading?: boolean
  skeletonRows?: number
  emptyState?: React.ReactNode
  pagination?: boolean
  pageSize?: number
  className?: string
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  loading = false,
  skeletonRows = 5,
  emptyState,
  pagination = true,
  pageSize = 10,
  className,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1)

  const totalPages = Math.ceil(data.length / pageSize)
  const paginatedData = pagination ? data.slice((page - 1) * pageSize, page * pageSize) : data

  const alignClass = (align?: string) => {
    switch (align) {
      case 'right': return 'text-right'
      case 'center': return 'text-center'
      default: return 'text-left'
    }
  }

  return (
    <div className={cn('rounded-xl border border-border bg-card overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider',
                    alignClass(col.align)
                  )}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {columns.map((_, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-3.5 w-3/4 animate-pulse rounded bg-muted" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  {emptyState || (
                    <div className="py-12 text-center text-muted-foreground text-sm">
                      No data available
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  className="border-b border-border table-row-hover"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn('px-4 py-3.5', alignClass(col.align))}
                    >
                      {col.render ? col.render(row) : (row as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
          <div className="text-xs text-muted-foreground">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, data.length)} of {data.length}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-foreground px-3 min-w-[3rem] text-center">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
