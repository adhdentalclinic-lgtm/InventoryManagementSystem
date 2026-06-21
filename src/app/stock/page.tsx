'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Search, Plus, Trash2, Image as ImageIcon, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Product {
  id: string
  name: string
  sku: string
  category: string
  quantity: number
  selling_price: number
  image_url: string | null
}

interface OrderItem {
  product_id: string
  product_name: string
  selling_price: number
  quantity: number
}

export default function OrderDispatchPage() {
  const router = useRouter()
  const { profile, loading: authLoading } = useAuth()
  const isStaff = profile?.role === 'staff'
  
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [orderQty, setOrderQty] = useState(1)
  const [orderError, setOrderError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading && profile?.role === 'admin') {
      router.replace('/inventory')
    }
  }, [authLoading, profile?.role, router])

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('id, name, sku, category, quantity, selling_price, image_url')
      .gt('quantity', 0)
      .order('name')
    if (error) {
      toast.error('Failed to load products')
    } else {
      setProducts(data || [])
    }
    setLoading(false)
  }

  function addOrderItem() {
    if (!selectedProduct || orderQty <= 0) {
      setOrderError('Please select a product and enter quantity')
      return
    }
    if (orderQty > selectedProduct.quantity) {
      setOrderError(`Insufficient stock. Available: ${selectedProduct.quantity}`)
      return
    }

    const existingItem = orderItems.find(item => item.product_id === selectedProduct.id)
    if (existingItem) {
      const newQty = existingItem.quantity + orderQty
      if (newQty > selectedProduct.quantity) {
        setOrderError(`Insufficient stock. Available: ${selectedProduct.quantity}`)
        return
      }
      setOrderItems(orderItems.map(item =>
        item.product_id === selectedProduct.id
          ? { ...item, quantity: newQty }
          : item
      ))
    } else {
      setOrderItems([...orderItems, {
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        selling_price: selectedProduct.selling_price,
        quantity: orderQty,
      }])
    }

    setSelectedProduct(null)
    setOrderQty(1)
    setOrderError('')
  }

  function removeOrderItem(productId: string) {
    setOrderItems(orderItems.filter(item => item.product_id !== productId))
  }

  async function submitOrder() {
    if (orderItems.length === 0) {
      toast.error('Add at least one item to the order')
      return
    }

    setSubmitting(true)
    try {
      // Create stock movements for each item
      const movements = orderItems.map(item => ({
        product_id: item.product_id,
        type: 'OUT' as const,
        quantity: item.quantity,
        note: 'Order dispatch',
      }))

      const { error: moveError } = await supabase
        .from('stock_movements')
        .insert(movements)

      if (moveError) throw moveError

      // Calculate total revenue
      const totalRevenue = orderItems.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0)

      // Create cashflow entry for order
      const { error: cashError } = await supabase
        .from('cashflow')
        .insert([{
          type: 'IN',
          amount: totalRevenue,
          description: `Order dispatch - ${orderItems.length} item(s)`,
          category: 'sales',
        }])

      if (cashError) throw cashError

      toast.success(`Order placed! Revenue: $${totalRevenue.toFixed(2)}`)
      setOrderItems([])
      fetchProducts()
      setShowModal(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to process order')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  )

  const totalOrderValue = orderItems.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0)
  const totalOrderQty = orderItems.reduce((sum, item) => sum + item.quantity, 0)

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)

  if (authLoading) return <DashboardLayout><div className="text-center py-8">Loading...</div></DashboardLayout>
  if (profile?.role === 'admin') return null

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Order Dispatch</h1>
            <p className="text-sm text-muted-foreground mt-1">Create and manage customer orders</p>
          </div>
          <Button onClick={() => setShowModal(true)} leftIcon={<Plus className="h-4 w-4" />}>
            New Order
          </Button>
        </div>

        {orderItems.length > 0 && (
          <div className="grid gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs font-medium text-muted-foreground">Items</p>
                <p className="text-2xl font-bold text-foreground mt-1">{orderItems.length}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs font-medium text-muted-foreground">Qty</p>
                <p className="text-2xl font-bold text-foreground mt-1">{totalOrderQty}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 col-span-2">
                <p className="text-xs font-medium text-muted-foreground">Order Value</p>
                <p className="text-2xl font-bold text-success mt-1">{formatCurrency(totalOrderValue)}</p>
              </div>
            </div>

            <Button onClick={submitOrder} disabled={submitting} variant="success" className="w-full">
              {submitting ? 'Processing...' : `Confirm Order - ${formatCurrency(totalOrderValue)}`}
            </Button>
          </div>
        )}

        {orderItems.length === 0 && (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
            <ArrowRight className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
            <p className="text-muted-foreground mt-2">No items in order. Create a new order to get started.</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setSelectedProduct(null)
          setOrderQty(1)
          setOrderError('')
        }}
        title="Add Products to Order"
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowModal(false)
                setSelectedProduct(null)
                setOrderQty(1)
                setOrderError('')
              }}
            >
              Close
            </Button>
            <Button onClick={addOrderItem} disabled={!selectedProduct || orderQty <= 0}>
              Add to Order
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 input-focus"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No products available</p>
              </div>
            ) : (
              filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => {
                    setSelectedProduct(product)
                    setOrderError('')
                  }}
                  className={cn(
                    'w-full text-left p-3 rounded-lg border transition-colors',
                    selectedProduct?.id === product.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {product.image_url ? (
                      <img src={product.image_url} alt="" className="h-10 w-10 rounded object-cover border border-border" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center border border-border">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sku} • {product.category}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-foreground">{formatCurrency(product.selling_price)}</p>
                      <p className="text-xs text-muted-foreground">{product.quantity} in stock</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {selectedProduct && (
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <p className="text-sm font-medium text-foreground mb-3">Selected: {selectedProduct.name}</p>
              <Input
                label="Quantity"
                type="number"
                min={1}
                max={selectedProduct.quantity}
                value={orderQty}
                onChange={(e) => {
                  setOrderQty(parseInt(e.target.value) || 1)
                  setOrderError('')
                }}
                helper={`Available: ${selectedProduct.quantity} units`}
              />
              <div className="mt-3 p-2 bg-card rounded text-sm">
                <p className="text-muted-foreground">Line total: <span className="font-semibold text-foreground">{formatCurrency(selectedProduct.selling_price * orderQty)}</span></p>
              </div>
            </div>
          )}

          {orderError && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger">
              {orderError}
            </div>
          )}

          {orderItems.length > 0 && (
            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium text-foreground mb-2">Current Order ({orderItems.length} items):</p>
              <div className="space-y-2">
                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm">
                    <span className="text-foreground">{item.product_name} × {item.quantity}</span>
                    <span className="font-semibold text-foreground">{formatCurrency(item.selling_price * item.quantity)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-2 rounded bg-primary/5 border border-primary/20 text-sm font-semibold">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary">{formatCurrency(totalOrderValue)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </DashboardLayout>
  )
}
