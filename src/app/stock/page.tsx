'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/DashboardLayout'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { DataTable } from '@/components/ui/DataTable'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { ArrowDownLeft, ArrowUpRight, X, Search, Package, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Product {
  id: string
  name: string
  sku: string
  quantity: number
}

interface StockMovement {
  id: string
  product_id: string
  type: 'IN' | 'OUT'
  quantity: number
  note: string | null
  created_at: string
  products: { name: string; sku: string }
}

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ product_id: '', type: 'IN' as 'IN' | 'OUT', quantity: 1, note: '' })
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: prods }, { data: movs }] = await Promise.all([
      supabase.from('products').select('id, name, sku, quantity').order('name'),
      supabase.from('stock_movements').select('*, products(name, sku)').order('created_at', { ascending: false }).limit(100),
    ])
    setProducts(prods || [])
    setMovements(movs || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    const product = products.find((p) => p.id === form.product_id)
    if (!product) {
      setFormError('Select a product')
      return
    }
    if (form.type === 'OUT' && product.quantity < form.quantity) {
      setFormError(`Insufficient stock. Available: ${product.quantity}`)
      return
    }
    const { error } = await supabase.from('stock_movements').insert([{
      product_id: form.product_id,
      type: form.type,
      quantity: form.quantity,
      note: form.note,
    }])
    if (error) {
      toast.error(error.message)
    } else {
      toast.success(`Stock ${form.type === 'IN' ? 'added' : 'removed'} successfully`)
      setShowModal(false)
      setForm({ product_id: '', type: 'IN', quantity: 1, note: '' })
      fetchData()
    }
  }

  const filteredMovements = movements.filter(
    (m) =>
      m.products?.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.products?.sku?.toLowerCase().includes(search.toLowerCase())
  )

  const inCount = movements.filter((m) => m.type === 'IN').reduce((s, m) => s + m.quantity, 0)
  const outCount = movements.filter((m) => m.type === 'OUT').reduce((s, m) => s + m.quantity, 0)

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (row: StockMovement) => (
        <span className="text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</span>
      ),
      width: '120px',
    },
    {
      key: 'product',
      header: 'Product',
      render: (row: StockMovement) => (
        <div>
          <p className="font-medium text-foreground">{row.products?.name}</p>
          <p className="text-xs text-muted-foreground">{row.products?.sku}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row: StockMovement) => (
        <Badge variant={row.type === 'IN' ? 'success' : 'danger'} dot>
          {row.type}
        </Badge>
      ),
      width: '100px',
    },
    {
      key: 'quantity',
      header: 'Quantity',
      align: 'right' as const,
      render: (row: StockMovement) => (
        <span className="font-semibold text-foreground">{row.quantity}</span>
      ),
      width: '100px',
    },
    {
      key: 'note',
      header: 'Note',
      render: (row: StockMovement) => (
        <span className="text-muted-foreground truncate max-w-[200px] block">{row.note || '-'}</span>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Stock Movement</h1>
            <p className="text-sm text-muted-foreground mt-1">Track and manage stock transactions</p>
          </div>
          <Button onClick={() => setShowModal(true)} leftIcon={<ArrowDownLeft className="h-4 w-4" />}>
            Record Movement
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="flex items-center gap-4" padding="md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
              <ArrowDownLeft className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total In</p>
              <p className="text-2xl font-bold text-foreground">{inCount.toLocaleString()}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4" padding="md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10">
              <ArrowUpRight className="h-6 w-6 text-danger" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Out</p>
              <p className="text-2xl font-bold text-foreground">{outCount.toLocaleString()}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4" padding="md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Net Movement</p>
              <p className="text-2xl font-bold text-foreground">{(inCount - outCount).toLocaleString()}</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Movements table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search movements..."
                className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 input-focus"
              />
            </div>
            <DataTable
              data={filteredMovements}
              columns={columns}
              keyExtractor={(row) => row.id}
              loading={loading}
              emptyState={
                <EmptyState
                  icon="inbox"
                  title="No movements recorded"
                  description="Start tracking your stock movements by recording your first transaction."
                />
              }
            />
          </div>

          {/* Stock levels */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Stock Levels</CardTitle>
                  <CardDescription>Current inventory status</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
                {products.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0',
                        p.quantity <= 5 ? 'bg-danger/10' : p.quantity <= 20 ? 'bg-warning/10' : 'bg-success/10'
                      )}>
                        <Package className={cn(
                          'h-3.5 w-3.5',
                          p.quantity <= 5 ? 'text-danger' : p.quantity <= 20 ? 'text-warning' : 'text-success'
                        )} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.sku}</p>
                      </div>
                    </div>
                    <span className={cn(
                      'text-sm font-bold flex-shrink-0',
                      p.quantity <= 5 ? 'text-danger' : p.quantity <= 20 ? 'text-warning' : 'text-foreground'
                    )}>
                      {p.quantity}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Record Stock Movement"
        description="Add or remove stock from your inventory"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Record Movement</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Product</label>
            <select
              value={form.product_id}
              onChange={(e) => setForm({ ...form, product_id: e.target.value })}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground input-focus"
            >
              <option value="">Select a product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku}) - Qty: {p.quantity}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, type: 'IN' })}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200',
                  form.type === 'IN'
                    ? 'border-success bg-success/10 text-success'
                    : 'border-border text-muted-foreground hover:bg-muted'
                )}
              >
                <ArrowDownLeft className="h-4 w-4" />
                Stock In
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, type: 'OUT' })}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200',
                  form.type === 'OUT'
                    ? 'border-danger bg-danger/10 text-danger'
                    : 'border-border text-muted-foreground hover:bg-muted'
                )}
              >
                <ArrowUpRight className="h-4 w-4" />
                Stock Out
              </button>
            </div>
          </div>
          <Input
            label="Quantity"
            type="number"
            min={1}
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
            required
          />
          <Input
            label="Note"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Optional note..."
          />
          {formError && <p className="text-sm text-danger">{formError}</p>}
        </form>
      </Modal>
    </DashboardLayout>
  )
}
