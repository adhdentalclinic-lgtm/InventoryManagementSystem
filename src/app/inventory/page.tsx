'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/lib/auth'
import { toast } from 'sonner'
import { Search, Plus, Pencil, Trash2, X, Upload } from 'lucide-react'

interface Product {
  id: string
  name: string
  sku: string
  category: string
  quantity: number
  cost_price: number
  selling_price: number
  image_url: string | null
}

export default function InventoryPage() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: '',
    quantity: 0,
    cost_price: 0,
    selling_price: 0,
    image_url: '',
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    setLoading(true)
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (error) {
      toast.error('Failed to load products')
    } else {
      setProducts(data || [])
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isAdmin) {
      toast.error('Only admins can manage products')
      return
    }
    if (editing) {
      const { error } = await supabase.from('products').update(form).eq('id', editing.id)
      if (error) toast.error(error.message)
      else {
        toast.success('Product updated')
        setShowModal(false)
        setEditing(null)
        fetchProducts()
      }
    } else {
      const { error } = await supabase.from('products').insert([form])
      if (error) toast.error(error.message)
      else {
        toast.success('Product created')
        setShowModal(false)
        setForm({ name: '', sku: '', category: '', quantity: 0, cost_price: 0, selling_price: 0, image_url: '' })
        fetchProducts()
      }
    }
  }

  async function handleDelete(id: string) {
    if (!isAdmin) {
      toast.error('Only admins can delete products')
      return
    }
    if (!confirm('Are you sure you want to delete this product?')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Product deleted')
      fetchProducts()
    }
  }

  function openEdit(product: Product) {
    if (!isAdmin) return
    setEditing(product)
    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      quantity: product.quantity,
      cost_price: product.cost_price,
      selling_price: product.selling_price,
      image_url: product.image_url || '',
    })
    setShowModal(true)
  }

  function openCreate() {
    setEditing(null)
    setForm({ name: '', sku: '', category: '', quantity: 0, cost_price: 0, selling_price: 0, image_url: '' })
    setShowModal(true)
  }

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  )

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your products and stock levels</p>
          </div>
          {isAdmin && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU, or category..."
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">SKU</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Qty</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Cost</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Price</th>
                  {isAdmin && <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      <td colSpan={isAdmin ? 7 : 6} className="px-4 py-4">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="px-4 py-8 text-center text-muted-foreground">
                      No products found
                    </td>
                  </tr>
                ) : (
                  filtered.map((product) => (
                    <tr key={product.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img src={product.image_url} alt="" className="h-8 w-8 rounded-lg object-cover" />
                          ) : (
                            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                              <Upload className="h-3 w-3 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-medium text-foreground">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{product.sku}</td>
                      <td className="px-4 py-3 text-muted-foreground">{product.category}</td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">{product.quantity}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(product.cost_price)}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(product.selling_price)}</td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(product)}
                              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="rounded-md p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">
                {editing ? 'Edit Product' : 'Add Product'}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditing(null) }}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">SKU</label>
                  <input
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                <input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Quantity</label>
                  <input
                    type="number"
                    min={0}
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Cost Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.cost_price}
                    onChange={(e) => setForm({ ...form, cost_price: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Selling Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.selling_price}
                    onChange={(e) => setForm({ ...form, selling_price: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Image URL</label>
                <input
                  type="url"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditing(null) }}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
