'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/DashboardLayout'
import { Package, Boxes, Banknote, TrendingUp, TrendingDown, Wallet } from 'lucide-react'

interface DashboardMetrics {
  totalItems: number
  totalQuantity: number
  totalCOGS: number
  totalCashIn: number
  totalCashOut: number
  netCashflow: number
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 10000)
    return () => clearInterval(interval)
  }, [])

  async function fetchMetrics() {
    setLoading(true)
    try {
      const { data: products } = await supabase.from('products').select('quantity, cost_price')
      const { data: cashIn } = await supabase.from('cashflow').select('amount').eq('type', 'IN')
      const { data: cashOut } = await supabase.from('cashflow').select('amount').eq('type', 'OUT')

      const totalItems = products?.length || 0
      const totalQuantity = products?.reduce((sum, p) => sum + (p.quantity || 0), 0) || 0
      const totalCOGS = products?.reduce((sum, p) => sum + (p.quantity || 0) * (p.cost_price || 0), 0) || 0
      const totalCashIn = cashIn?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0
      const totalCashOut = cashOut?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0
      const netCashflow = totalCashIn - totalCashOut

      setMetrics({ totalItems, totalQuantity, totalCOGS, totalCashIn, totalCashOut, netCashflow })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)

  const formatNumber = (val: number) => new Intl.NumberFormat('en-US').format(val)

  const cards = [
    {
      title: 'Total Items',
      value: formatNumber(metrics.totalItems),
      icon: Package,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Total Quantity',
      value: formatNumber(metrics.totalQuantity),
      icon: Boxes,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Total COGS',
      value: formatCurrency(metrics.totalCOGS),
      icon: Banknote,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Cash In',
      value: formatCurrency(metrics.totalCashIn),
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'Cash Out',
      value: formatCurrency(metrics.totalCashOut),
      icon: TrendingDown,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
    },
    {
      title: 'Net Cashflow',
      value: formatCurrency(metrics.netCashflow),
      icon: Wallet,
      color: metrics.netCashflow >= 0 ? 'text-gold' : 'text-rose-500',
      bg: metrics.netCashflow >= 0 ? 'bg-gold/10' : 'bg-rose-500/10',
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of your inventory and financials</p>
        </div>

        {loading && metrics.totalItems === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-card border border-border animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card) => (
              <div
                key={card.title}
                className="rounded-xl bg-card border border-border p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                    <p className="mt-2 text-2xl font-bold text-foreground">{card.value}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bg}`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
