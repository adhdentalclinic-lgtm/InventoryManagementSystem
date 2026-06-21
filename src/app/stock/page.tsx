'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/DashboardLayout'
import { toast } from 'sonner'
import { ArrowDownLeft, ArrowUpRight, X, Search } from 'lucide-react'

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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: prods }, { data: movs }] = await Promise.all([
      supabase.from('products').select('id, name, sku, quantity').order('name'),
      supabase.from('stock_movements').select('*, products(name, sku)').order('created_at', { ascending: false }).limit(50),
    ])
    setProducts(prods || [])
    setMovements(movs || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const product = products.find((p) => p.id === form.product_id)
    if (!product) {
      toast.error('Select a product')
      return
    }
    if (form.type === 'OUT' && product.quantity < form.quantity) {
      toast.error(`Insufficient stock. Available: ${product.quantity}`)
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Stock Movement</h1>
            <p className="text-sm text-muted-foreground mt-1">Track stock IN and OUT transactions</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <ArrowDownLeft className="h-4 w-4" />
            Record Movement
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search movements..."
                className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Qty</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-border">
                          <td colSpan={5} className="px-4 py-4"><div className="h-4 w-3/4 animate-pulse rounded bg-muted" /></td>
                        </tr>
                      ))
                    ) : filteredMovements.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No movements found</td>
                      </tr>
                    ) : (
                      filteredMovements.map((m) => (
                        <tr key={m.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">{m.products?.name}</div>
                            <div className="text-xs text-muted-foreground">{m.products?.sku}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              m.type === 'IN'
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : 'bg-rose-500/10 text-rose-500'
                            }`}>
                              {m.type === 'IN' ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                              {m.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-foreground">{m.quantity}</td>
                          <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px]">{m.note || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Current Stock Levels</h3>
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 max-h-[500px] overflow-y-auto">
              {products.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.sku}</p>
                  </div>
                  <span className={`text-sm font-bold ${p.quantity <= 5 ? 'text-rose-500' : 'text-foreground'}`}>
                    {p.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">Record Stock Movement</h2>
              <button onClick={() => setShowModal(false)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Product</label>
                <select
                  value={form.product_id}
                  onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select a product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku}) - Qty: {p.quantity}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: 'IN' })}
                    className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      form.type === 'IN'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    Stock In
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: 'OUT' })}
                    className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      form.type === 'OUT'
                        ? 'border-rose-500 bg-rose-500/10 text-rose-500'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    Stock Out
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Note</label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
