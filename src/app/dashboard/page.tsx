'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/DashboardLayout'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Package, Boxes, Banknote, TrendingUp, TrendingDown, Wallet, ArrowUpRight, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardMetrics {
  totalItems: number
  totalQuantity: number
  totalCOGS: number
  totalCashIn: number
  totalCashOut: number
  netCashflow: number
}

interface RecentActivity {
  id: string
  type: 'IN' | 'OUT'
  description: string
  amount?: number
  created_at: string
}

interface ProductMetricsRow {
  id: string
  name: string
  sku: string
  quantity: number
  cost_price: number
}

interface MovementRow {
  id: string
  type: 'IN' | 'OUT'
  quantity: number
  created_at: string
  products?: { name: string | null }
}

async function fetchMetrics(setLoading: React.Dispatch<React.SetStateAction<boolean>>, setMetrics: React.Dispatch<React.SetStateAction<DashboardMetrics>>, setLowStock: React.Dispatch<React.SetStateAction<{ name: string; sku: string; quantity: number }[]>>, setRecentActivity: React.Dispatch<React.SetStateAction<RecentActivity[]>>) {
  setLoading(true)
  try {
    const [{ data: products }, { data: cashIn }, { data: cashOut }, { data: movements }] = await Promise.all([
      supabase.from('products').select('quantity, cost_price, name, sku').returns<ProductMetricsRow[]>(),
      supabase.from('cashflow').select('amount').eq('type', 'IN').returns<{ amount: number }[]>(),
      supabase.from('cashflow').select('amount').eq('type', 'OUT').returns<{ amount: number }[]>(),
      supabase.from('stock_movements').select('*, products(name)').order('created_at', { ascending: false }).limit(5).returns<MovementRow[]>(),
    ])

    const totalItems = products?.length || 0
    const totalQuantity = products?.reduce((sum, p) => sum + p.quantity, 0) || 0
    const totalCOGS = products?.reduce((sum, p) => sum + p.quantity * p.cost_price, 0) || 0
    const totalCashIn = cashIn?.reduce((sum, c) => sum + c.amount, 0) || 0
    const totalCashOut = cashOut?.reduce((sum, c) => sum + c.amount, 0) || 0
    const netCashflow = totalCashIn - totalCashOut

    setMetrics({ totalItems, totalQuantity, totalCOGS, totalCashIn, totalCashOut, netCashflow })

    const low = (products || [])
      .filter((p) => p.quantity <= 10)
      .slice(0, 5)
      .map((p) => ({ name: p.name, sku: p.sku, quantity: p.quantity }))
    setLowStock(low)

    const activity: RecentActivity[] = (movements || []).map((m) => ({
      id: m.id,
      type: m.type,
      description: `${m.type === 'IN' ? 'Stock in' : 'Stock out'}: ${m.products?.name || 'Unknown'} (${m.quantity} units)`,
      amount: m.quantity,
      created_at: m.created_at,
    }))
    setRecentActivity(activity)
  } finally {
    setLoading(false)
  }
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalItems: 0,
    totalQuantity: 0,
    totalCOGS: 0,
    totalCashIn: 0,
    totalCashOut: 0,
    netCashflow: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [lowStock, setLowStock] = useState<{ name: string; sku: string; quantity: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics(setLoading, setMetrics, setLowStock, setRecentActivity)
    const interval = setInterval(() => fetchMetrics(setLoading, setMetrics, setLowStock, setRecentActivity), 15000)
    return () => clearInterval(interval)
  }, [])

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)

  const formatNumber = (val: number) => new Intl.NumberFormat('en-US').format(val)

  const cards = [
    {
      title: 'Total Items',
      value: formatNumber(metrics.totalItems),
      icon: <Package className="h-5 w-5" />,
      variant: 'default' as const,
      trend: { value: 12, label: 'vs last month' },
    },
    {
      title: 'Total Quantity',
      value: formatNumber(metrics.totalQuantity),
      icon: <Boxes className="h-5 w-5" />,
      variant: 'default' as const,
      trend: { value: 8, label: 'vs last month' },
    },
    {
      title: 'Total COGS',
      value: formatCurrency(metrics.totalCOGS),
      icon: <Banknote className="h-5 w-5" />,
      variant: 'default' as const,
    },
    {
      title: 'Cash In',
      value: formatCurrency(metrics.totalCashIn),
      icon: <TrendingUp className="h-5 w-5" />,
      variant: 'success' as const,
      trend: { value: 24, label: 'vs last month' },
    },
    {
      title: 'Cash Out',
      value: formatCurrency(metrics.totalCashOut),
      icon: <TrendingDown className="h-5 w-5" />,
      variant: 'danger' as const,
      trend: { value: -5, label: 'vs last month' },
    },
    {
      title: 'Net Cashflow',
      value: formatCurrency(metrics.netCashflow),
      icon: <Wallet className="h-5 w-5" />,
      variant: (metrics.netCashflow >= 0 ? 'gold' : 'danger') as 'gold' | 'danger',
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Real-time overview of your business metrics</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5 text-success" />
              Live data
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {cards.map((card) => (
            <StatCard
              key={card.title}
              title={card.title}
              value={card.value}
              icon={card.icon}
              variant={card.variant}
              trend={card.trend}
              loading={loading && metrics.totalItems === 0}
            />
          ))}
        </div>

        {/* Bottom section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest stock movements</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No recent activity
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg',
                      activity.type === 'IN' ? 'bg-success/10' : 'bg-danger/10'
                    )}>
                      {activity.type === 'IN' ? (
                        <ArrowUpRight className="h-4 w-4 text-success" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-danger" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{new Date(activity.created_at).toLocaleDateString()}</p>
                    </div>
                    <Badge variant={activity.type === 'IN' ? 'success' : 'danger'} dot>
                      {activity.type}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Low Stock Alert</CardTitle>
                <CardDescription>Items running below threshold</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {lowStock.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  All stock levels healthy
                </div>
              ) : (
                lowStock.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10">
                        <Package className="h-4 w-4 text-warning" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.sku}</p>
                      </div>
                    </div>
                    <Badge variant="warning" dot>
                      {item.quantity} left
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
