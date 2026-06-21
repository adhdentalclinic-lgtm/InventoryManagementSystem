'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/lib/auth'
import { toast } from 'sonner'
import { DataTable } from '@/components/ui/DataTable'
import { Card } from '@/components/ui/Card'
import { Package, AlertTriangle, Layers, TrendingDown } from 'lucide-react'

interface Product {
  id: string
  name: string
  sku: string
  category: string
  quantity: number
  selling_price: number
}

export default function LowStocksPage() {
  const { profile, loading } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  useEffect(() => {
    if (!loading && isAdmin) {
      fetchLowStock()
    }
  }, [loading, isAdmin])

  async function fetchLowStock() {
    setLoadingProducts(true)
    const { data, error } = await supabase
      .from('products')
      .select('id, name, sku, category, quantity, selling_price')
      .lte('quantity', 10)
      .order('quantity', { ascending: true })
      .returns<Product[]>()

    if (error) {
      toast.error('Failed to load low stock items')
      setProducts([])
    } else {
      setProducts(data || [])
    }
    setLoadingProducts(false)
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
          <AlertTriangle className="h-12 w-12 text-warning mb-4" />
          <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">This page is restricted to administrators only.</p>
        </div>
      </DashboardLayout>
    )
  }

  const totalItems = products.length
  const totalQuantity = products.reduce((sum, product) => sum + product.quantity, 0)
  const averageStock = totalItems > 0 ? Math.round(totalQuantity / totalItems) : 0

  const columns = [
    {
      key: 'product',
      header: 'Product',
      render: (row: Product) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{row.name}</span>
          <span className="text-xs text-muted-foreground">{row.sku}</span>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row: Product) => <span className="text-sm text-foreground">{row.category}</span>,
    },
    {
      key: 'quantity',
      header: 'Quantity',
      align: 'right' as const,
      render: (row: Product) => <span className="font-semibold text-warning">{row.quantity}</span>,
    },
    {
      key: 'price',
      header: 'Selling Price',
      align: 'right' as const,
      render: (row: Product) => <span className="text-foreground">${row.selling_price.toFixed(2)}</span>,
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Low Stocks</h1>
            <p className="text-sm text-muted-foreground mt-1">Monitor items that need restocking soon.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full sm:w-auto">
            <Card className="rounded-3xl border border-border p-4" padding="none">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">SKUs</p>
                  <p className="font-bold text-foreground">{totalItems}</p>
                </div>
              </div>
            </Card>
            <Card className="rounded-3xl border border-border p-4" padding="none">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Units</p>
                  <p className="font-bold text-foreground">{totalQuantity}</p>
                </div>
              </div>
            </Card>
            <Card className="rounded-3xl border border-border p-4" padding="none">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                  <Package className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Avg Remaining</p>
                  <p className="font-bold text-foreground">{averageStock}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <DataTable
          data={products}
          columns={columns}
          keyExtractor={(row) => row.id}
          loading={loadingProducts}
          emptyState={
            <div className="py-12 text-center text-sm text-muted-foreground">
              No low stock products found. Inventory levels are healthy.
            </div>
          }
        />
      </div>
    </DashboardLayout>
  )
}
