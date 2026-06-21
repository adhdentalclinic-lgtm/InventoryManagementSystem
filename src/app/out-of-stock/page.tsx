'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/lib/auth'
import { toast } from 'sonner'
import { DataTable } from '@/components/ui/DataTable'
import { Card } from '@/components/ui/Card'
import { Box, Slash, AlertCircle, Package } from 'lucide-react'

interface Product {
  id: string
  name: string
  sku: string
  category: string
  quantity: number
}

export default function OutOfStockPage() {
  const { profile, loading } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  useEffect(() => {
    if (!loading && isAdmin) {
      fetchOutOfStock()
    }
  }, [loading, isAdmin])

  async function fetchOutOfStock() {
    setLoadingProducts(true)
    const { data, error } = await supabase
      .from('products')
      .select('id, name, sku, category, quantity')
      .eq('quantity', 0)
      .order('name')
      .returns<Product[]>()

    if (error) {
      toast.error('Failed to load out of stock items')
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
          <AlertCircle className="h-12 w-12 text-danger mb-4" />
          <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">This page is restricted to administrators only.</p>
        </div>
      </DashboardLayout>
    )
  }

  const totalItems = products.length

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
      header: 'Stock',
      align: 'right' as const,
      render: () => <span className="font-semibold text-danger">0</span>,
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Out of Stock</h1>
            <p className="text-sm text-muted-foreground mt-1">Items currently unavailable for sale.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full sm:w-auto">
            <Card className="rounded-3xl border border-border p-4" padding="none">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/10 text-danger">
                  <Slash className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Out of Stock SKUs</p>
                  <p className="font-bold text-foreground">{totalItems}</p>
                </div>
              </div>
            </Card>
            <Card className="rounded-3xl border border-border p-4" padding="none">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                  <Box className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Action Required</p>
                  <p className="font-bold text-foreground">Restock soon</p>
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
              No out of stock items. Everything is available.
            </div>
          }
        />
      </div>
    </DashboardLayout>
  )
}
