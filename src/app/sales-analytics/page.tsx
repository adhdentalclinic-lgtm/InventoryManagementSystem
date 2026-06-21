'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/lib/auth'
import { toast } from 'sonner'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import { TrendingUp, TrendingDown, BarChart3, DollarSign, Clock, Activity } from 'lucide-react'

interface CashflowEntry {
  id: string
  type: 'IN' | 'OUT'
  amount: number
  description: string
  category: string | null
  created_at: string
}

interface MovementEntry {
  id: string
  type: 'IN' | 'OUT'
  quantity: number
  note: string | null
  created_at: string
  products?: { name: string | null }
}

export default function SalesAnalyticsPage() {
  const { profile, loading } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [cashflow, setCashflow] = useState<CashflowEntry[]>([])
  const [movements, setMovements] = useState<MovementEntry[]>([])
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)

  useEffect(() => {
    if (!loading && isAdmin) {
      fetchAnalytics()
    }
  }, [loading, isAdmin])

  async function fetchAnalytics() {
    setLoadingAnalytics(true)
    try {
      const [cashResult, movementResult] = await Promise.all([
        supabase
          .from('cashflow')
          .select('id, type, amount, description, category, created_at')
          .order('created_at', { ascending: false })
          .limit(12)
          .returns<CashflowEntry[]>(),
        supabase
          .from('stock_movements')
          .select('id, type, quantity, note, created_at, products(name)')
          .order('created_at', { ascending: false })
          .limit(12)
          .returns<MovementEntry[]>(),
      ])

      if (cashResult.error) throw cashResult.error
      if (movementResult.error) throw movementResult.error

      setCashflow(cashResult.data || [])
      setMovements(movementResult.data || [])
    } catch (error: any) {
      toast.error(error.message || 'Failed to load analytics')
    } finally {
      setLoadingAnalytics(false)
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
          <TrendingDown className="h-12 w-12 text-danger mb-4" />
          <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">This page is restricted to administrators only.</p>
        </div>
      </DashboardLayout>
    )
  }

  const totalSales = cashflow.filter((entry) => entry.type === 'IN').reduce((sum, entry) => sum + entry.amount, 0)
  const totalExpenses = cashflow.filter((entry) => entry.type === 'OUT').reduce((sum, entry) => sum + entry.amount, 0)
  const netRevenue = totalSales - totalExpenses
  const totalOrders = movements.filter((movement) => movement.type === 'OUT').length
  const totalUnitsMoved = movements.filter((movement) => movement.type === 'OUT').reduce((sum, movement) => sum + movement.quantity, 0)

  const recentActivity = cashflow.slice(0, 5)
  const recentStock = movements.slice(0, 5)

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Sales Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">Revenue and order trends for your business.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4" />
            Updated live
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Sales"
            value={`$${totalSales.toFixed(2)}`}
            icon={<DollarSign className="h-5 w-5" />}
            variant="success"
            loading={loadingAnalytics}
          />
          <StatCard
            title="Total Expenses"
            value={`$${totalExpenses.toFixed(2)}`}
            icon={<TrendingDown className="h-5 w-5" />}
            variant="danger"
            loading={loadingAnalytics}
          />
          <StatCard
            title="Net Revenue"
            value={`$${netRevenue.toFixed(2)}`}
            icon={<TrendingUp className="h-5 w-5" />}
            variant={netRevenue >= 0 ? 'gold' : 'danger'}
            loading={loadingAnalytics}
          />
          <StatCard
            title="Orders Shipped"
            value={`${totalOrders}`}
            icon={<BarChart3 className="h-5 w-5" />}
            variant="default"
            loading={loadingAnalytics}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recent Cashflow</CardTitle>
                <CardDescription>Latest sales and spend entries</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No cashflow activity yet.</div>
              ) : (
                recentActivity.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{entry.description}</p>
                      <p className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</p>
                    </div>
                    <span className={entry.type === 'IN' ? 'text-success font-semibold' : 'text-danger font-semibold'}>
                      {entry.type === 'IN' ? '+' : '-'}${entry.amount.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Top Recent Orders</CardTitle>
                <CardDescription>Latest stock movements from dispatch.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentStock.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No stock movement recorded yet.</div>
              ) : (
                recentStock.map((movement) => (
                  <div key={movement.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{movement.products?.name || 'Unknown product'}</p>
                      <p className="text-xs text-muted-foreground">{movement.note || 'Stock movement'}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(movement.created_at).toLocaleString()}</p>
                    </div>
                    <span className="text-foreground font-semibold">{movement.quantity} units</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Monthly Trend</CardTitle>
              <CardDescription>Sales performance and dispatch volume.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-border bg-muted p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Revenue / Order</p>
                <p className="text-2xl font-bold text-foreground">{totalOrders > 0 ? `$${(totalSales / totalOrders).toFixed(2)}` : '$0.00'}</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Units Dispatched</p>
                <p className="text-2xl font-bold text-foreground">{totalUnitsMoved}</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Net Margin</p>
                <p className="text-2xl font-bold text-foreground">{totalSales > 0 ? `${Math.round(((totalSales - totalExpenses) / totalSales) * 100)}%` : '0%'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
