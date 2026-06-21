'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/lib/auth'
import { toast } from 'sonner'
import { DataTable } from '@/components/ui/DataTable'
import { Card } from '@/components/ui/Card'
import { Activity, Clock, Package, Wallet } from 'lucide-react'

interface LogEntry {
  id: string
  key: string
  event: string
  details: string
  category: string
  value: string
  created_at: string
}

export default function ActivityLogsPage() {
  const { profile, loading } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)

  useEffect(() => {
    if (!loading && isAdmin) {
      fetchLogs()
    }
  }, [loading, isAdmin])

  async function fetchLogs() {
    setLoadingLogs(true)
    try {
      const [stockResponse, cashResponse] = await Promise.all([
        supabase
          .from('stock_movements')
          .select('id, type, quantity, note, created_at, products(name)')
          .order('created_at', { ascending: false })
          .limit(12),
        supabase
          .from('cashflow')
          .select('id, type, amount, description, category, created_at')
          .order('created_at', { ascending: false })
          .limit(12),
      ])

      if (stockResponse.error) throw stockResponse.error
      if (cashResponse.error) throw cashResponse.error

      const stockLogs = (stockResponse.data || []).map((item: any) => ({
        id: item.id,
        key: `stock-${item.id}`,
        event: item.type === 'IN' ? 'Stock Added' : 'Stock Dispatched',
        details: item.note || 'Inventory movement',
        category: item.products?.name || 'Stock movement',
        value: `${item.quantity} units`,
        created_at: item.created_at,
      }))

      const cashLogs = (cashResponse.data || []).map((item: any) => ({
        id: item.id,
        key: `cash-${item.id}`,
        event: item.type === 'IN' ? 'Revenue' : 'Expense',
        details: item.description,
        category: item.category || 'Cashflow',
        value: `${item.type === 'IN' ? '+' : '-'}$${item.amount.toFixed(2)}`,
        created_at: item.created_at,
      }))

      const merged = [...stockLogs, ...cashLogs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setLogs(merged)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load activity logs')
      setLogs([])
    } finally {
      setLoadingLogs(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Loading...</div>
      </DashboardLayout>
    )
  }

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
          <Activity className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">This page is restricted to administrators only.</p>
        </div>
      </DashboardLayout>
    )
  }

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (row: LogEntry) => <span className="text-sm text-muted-foreground">{new Date(row.created_at).toLocaleString()}</span>,
      width: '180px',
    },
    {
      key: 'event',
      header: 'Event',
      render: (row: LogEntry) => <span className="font-medium text-foreground">{row.event}</span>,
    },
    {
      key: 'details',
      header: 'Details',
      render: (row: LogEntry) => <span className="text-sm text-muted-foreground">{row.details}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      render: (row: LogEntry) => <span className="text-sm text-foreground">{row.category}</span>,
      width: '160px',
    },
    {
      key: 'value',
      header: 'Value',
      align: 'right' as const,
      render: (row: LogEntry) => <span className="font-semibold text-foreground">{row.value}</span>,
      width: '140px',
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Activity Logs</h1>
            <p className="text-sm text-muted-foreground mt-1">Audit trail for stock and financial activity.</p>
          </div>
          <Card className="rounded-3xl border border-border p-4" padding="none">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Latest Events</p>
                <p className="font-bold text-foreground">{logs.length}</p>
              </div>
            </div>
          </Card>
        </div>

        <DataTable
          data={logs}
          columns={columns}
          keyExtractor={(row) => row.key}
          loading={loadingLogs}
          emptyState={
            <div className="py-12 text-center text-sm text-muted-foreground">
              No activity logs are available yet.
            </div>
          }
        />
      </div>
    </DashboardLayout>
  )
}
