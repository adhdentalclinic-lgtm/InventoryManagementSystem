'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/lib/auth'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { DataTable } from '@/components/ui/DataTable'
import { Search, Plus, Pencil, Trash2, Package, Image as ImageIcon, ListFilter as Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Product {
  id: string
  name: string
  sku: string
  category: string
  quantity: number
  cost_price: number
  selling_price: number
  image_url: string | null
  created_at: string
}

export default function InventoryPage() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

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

  function validateForm() {
    const errors: Record<string, string> = {}
    if (!form.name.trim()) errors.name = 'Name is required'
    if (!form.sku.trim()) errors.sku = 'SKU is required'
    if (!form.category.trim()) errors.category = 'Category is required'
    if (form.quantity < 0) errors.quantity = 'Quantity cannot be negative'
    if (form.cost_price < 0) errors.cost_price = 'Cost price cannot be negative'
    if (form.selling_price < 0) errors.selling_price = 'Selling price cannot be negative'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isAdmin) {
      toast.error('Only admins can manage products')
      return
    }
    if (!validateForm()) return

    if (editing) {
      const { error } = await supabase.from('products').update(form).eq('id', editing.id)
      if (error) toast.error(error.message)
      else {
        toast.success('Product updated successfully')
        setShowModal(false)
        setEditing(null)
        fetchProducts()
      }
    } else {
      const { error } = await supabase.from('products').insert([form])
      if (error) toast.error(error.message)
      else {
        toast.success('Product created successfully')
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
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return
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
    setFormErrors({})
    setShowModal(true)
  }

  function openCreate() {
    setEditing(null)
    setForm({ name: '', sku: '', category: '', quantity: 0, cost_price: 0, selling_price: 0, image_url: '' })
    setFormErrors({})
    setShowModal(true)
  }

  const categories = Array.from(new Set(products.map((p) => p.category)))

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !categoryFilter || p.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)

  const columns = [
    {
      key: 'product',
      header: 'Product',
      render: (row: Product) => (
        <div className="flex items-center gap-3">
          {row.image_url ? (
            <img src={row.image_url} alt="" className="h-10 w-10 rounded-lg object-cover border border-border" />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center border border-border">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="font-medium text-foreground">{row.name}</p>
            <p className="text-xs text-muted-foreground">{row.sku}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row: Product) => (
        <Badge variant="default">{row.category}</Badge>
      ),
    },
    {
      key: 'quantity',
      header: 'Quantity',
      align: 'right' as const,
      render: (row: Product) => (
        <span className={cn(
          'font-semibold',
          row.quantity <= 5 ? 'text-danger' : row.quantity <= 20 ? 'text-warning' : 'text-foreground'
        )}>
          {row.quantity}
        </span>
      ),
    },
    {
      key: 'cost_price',
      header: 'Cost',
      align: 'right' as const,
      render: (row: Product) => <span className="text-muted-foreground">{formatCurrency(row.cost_price)}</span>,
    },
    {
      key: 'selling_price',
      header: 'Price',
      align: 'right' as const,
      render: (row: Product) => <span className="font-medium text-foreground">{formatCurrency(row.selling_price)}</span>,
    },
    ...(isAdmin ? [{
      key: 'actions',
      header: '',
      align: 'right' as const,
      width: '100px',
      render: (row: Product) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => openEdit(row)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-danger-muted hover:text-danger transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    }] : []),
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Inventory</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your products and stock levels</p>
          </div>
          {isAdmin && (
            <Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>
              Add Product
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 input-focus"
            />
          </div>
          {categories.length > 0 && (
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-border bg-card pl-10 pr-8 py-2.5 text-sm text-foreground input-focus appearance-none cursor-pointer"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
          {(search || categoryFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(''); setCategoryFilter('') }}
              leftIcon={<X className="h-4 w-4" />}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success" />
            <span className="text-muted-foreground">{products.filter(p => p.quantity > 20).length} Healthy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-warning" />
            <span className="text-muted-foreground">{products.filter(p => p.quantity > 0 && p.quantity <= 20).length} Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-danger" />
            <span className="text-muted-foreground">{products.filter(p => p.quantity === 0).length} Out</span>
          </div>
          <div className="ml-auto text-muted-foreground">
            {filtered.length} of {products.length} products
          </div>
        </div>

        {/* Table */}
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={(row) => row.id}
          loading={loading}
          emptyState={
            <EmptyState
              icon="package"
              title="No products found"
              description={search ? 'Try adjusting your search or filters.' : 'Get started by adding your first product.'}
              action={isAdmin && !search ? (
                <Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>
                  Add Product
                </Button>
              ) : undefined}
            />
          }
        />
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditing(null) }}
        title={editing ? 'Edit Product' : 'Add Product'}
        description={editing ? 'Update product details' : 'Create a new product in your inventory'}
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => { setShowModal(false); setEditing(null) }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editing ? 'Update Product' : 'Create Product'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={formErrors.name}
              required
            />
            <Input
              label="SKU"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              error={formErrors.sku}
              required
            />
          </div>
          <Input
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            error={formErrors.category}
            required
          />
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Quantity"
              type="number"
              min={0}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
              error={formErrors.quantity}
              required
            />
            <Input
              label="Cost Price"
              type="number"
              step="0.01"
              min={0}
              value={form.cost_price}
              onChange={(e) => setForm({ ...form, cost_price: parseFloat(e.target.value) || 0 })}
              error={formErrors.cost_price}
              required
            />
            <Input
              label="Selling Price"
              type="number"
              step="0.01"
              min={0}
              value={form.selling_price}
              onChange={(e) => setForm({ ...form, selling_price: parseFloat(e.target.value) || 0 })}
              error={formErrors.selling_price}
              required
            />
          </div>
          <Input
            label="Image URL"
            type="url"
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            placeholder="https://..."
            helper="Optional product image"
          />
        </form>
      </Modal>
    </DashboardLayout>
  )
}
