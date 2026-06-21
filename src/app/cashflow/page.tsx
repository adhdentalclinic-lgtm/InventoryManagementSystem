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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { TrendingUp, TrendingDown, X, Search, Wallet, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CashflowEntry {
  id: string
  type: 'IN' | 'OUT'
  amount: number
  description: string
  category: string | null
  created_at: string
}

export default function CashflowPage() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [entries, setEntries] = useState<CashflowEntry[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<CashflowEntry | null>(null)
  const [form, setForm] = useState({ type: 'IN' as 'IN' | 'OUT', amount: 0, description: '', category: '' })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [totals, setTotals] = useState({ in: 0, out: 0, net: 0 })

  useEffect(() => {
    fetchEntries()
  }, [])

  async function fetchEntries() {
    setLoading(true)
    const { data, error } = await supabase.from('cashflow').select('*').order('created_at', { ascending: false })
    if (error) {
      toast.error('Failed to load cashflow')
    } else {
      setEntries(data || [])
      const totalIn = (data || []).filter((e) => e.type === 'IN').reduce((s, e) => s + (e.amount || 0), 0)
      const totalOut = (data || []).filter((e) => e.type === 'OUT').reduce((s, e) => s + (e.amount || 0), 0)
      setTotals({ in: totalIn, out: totalOut, net: totalIn - totalOut })
    }
    setLoading(false)
  }

  function validateForm() {
    const errors: Record<string, string> = {}
    if (!form.description.trim()) errors.description = 'Description is required'
    if (form.amount <= 0) errors.amount = 'Amount must be greater than 0'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateForm()) return

    if (editing) {
      if (!isAdmin) {
        toast.error('Only admins can edit entries')
        return
      }
      const { error } = await supabase.from('cashflow').update(form).eq('id', editing.id)
      if (error) toast.error(error.message)
      else {
        toast.success('Entry updated')
        setShowModal(false)
        setEditing(null)
        fetchEntries()
      }
    } else {
      const { error } = await supabase.from('cashflow').insert([form])
      if (error) toast.error(error.message)
      else {
        toast.success('Entry recorded')
        setShowModal(false)
        setForm({ type: 'IN', amount: 0, description: '', category: '' })
        fetchEntries()
      }
    }
  }

  async function handleDelete(id: string) {
    if (!isAdmin) {
      toast.error('Only admins can delete entries')
      return
    }
    if (!confirm('Delete this entry?')) return
    const { error } = await supabase.from('cashflow').delete().eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Entry deleted')
      fetchEntries()
    }
  }

  function openEdit(entry: CashflowEntry) {
    setEditing(entry)
    setForm({ type: entry.type, amount: entry.amount, description: entry.description, category: entry.category || '' })
    setFormErrors({})
    setShowModal(true)
  }

  const filtered = entries.filter(
    (e) =>
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      (e.category && e.category.toLowerCase().includes(search.toLowerCase()))
  )

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (row: CashflowEntry) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</span>
        </div>
      ),
      width: '130px',
    },
    {
      key: 'type',
      header: 'Type',
      render: (row: CashflowEntry) => (
        <Badge variant={row.type === 'IN' ? 'success' : 'danger'} dot>
          {row.type}
        </Badge>
      ),
      width: '100px',
    },
    {
      key: 'description',
      header: 'Description',
      render: (row: CashflowEntry) => (
        <span className="text-foreground">{row.description}</span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row: CashflowEntry) => (
        row.category ? <Badge variant="default">{row.category}</Badge> : <span className="text-muted-foreground">-</span>
      ),
      width: '140px',
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right' as const,
      render: (row: CashflowEntry) => (
        <span className={cn(
          'font-semibold',
          row.type === 'IN' ? 'text-success' : 'text-danger'
        )}>
          {row.type === 'IN' ? '+' : '-'}{formatCurrency(row.amount)}
        </span>
      ),
      width: '140px',
    },
    ...(isAdmin ? [{
      key: 'actions',
      header: '',
      align: 'right' as const,
      width: '120px',
      render: (row: CashflowEntry) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => openEdit(row)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-xs font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-danger-muted hover:text-danger transition-colors text-xs font-medium"
          >
            Delete
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
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Cashflow</h1>
            <p className="text-sm text-muted-foreground mt-1">Track all financial transactions</p>
          </div>
          <Button
            onClick={() => { setEditing(null); setForm({ type: 'IN', amount: 0, description: '', category: '' }); setFormErrors({}); setShowModal(true) }}
            leftIcon={<Wallet className="h-4 w-4" />}
          >
            Add Entry
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="flex items-center gap-4" padding="md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Cash In</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(totals.in)}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4" padding="md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10">
              <TrendingDown className="h-6 w-6 text-danger" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Cash Out</p>
              <p className="text-2xl font-bold text-danger">{formatCurrency(totals.out)}</p>
            </div>
          </Card>
          <Card className={cn(
            'flex items-center gap-4',
            totals.net >= 0 ? 'border-gold/30' : 'border-danger/30'
          )} padding="md">
            <div className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl',
              totals.net >= 0 ? 'bg-gold/10' : 'bg-danger/10'
            )}>
              <Wallet className={cn(
                'h-6 w-6',
                totals.net >= 0 ? 'text-gold' : 'text-danger'
              )} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Net Balance</p>
              <p className={cn(
                'text-2xl font-bold',
                totals.net >= 0 ? 'text-gold' : 'text-danger'
              )}>
                {formatCurrency(totals.net)}
              </p>
            </div>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entries..."
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 input-focus"
          />
        </div>

        {/* Table */}
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={(row) => row.id}
          loading={loading}
          emptyState={
            <EmptyState
              icon="inbox"
              title="No entries found"
              description={search ? 'Try adjusting your search.' : 'Start tracking your cashflow by adding your first entry.'}
            />
          }
        />
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditing(null) }}
        title={editing ? 'Edit Entry' : 'Add Cashflow Entry'}
        description={editing ? 'Update transaction details' : 'Record a new cash transaction'}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowModal(false); setEditing(null) }}>Cancel</Button>
            <Button onClick={handleSubmit}>{editing ? 'Update' : 'Record'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
                <TrendingUp className="h-4 w-4" />
                Cash In
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
                <TrendingDown className="h-4 w-4" />
                Cash Out
              </button>
            </div>
          </div>
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min={0.01}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
            error={formErrors.amount}
            required
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            error={formErrors.description}
            required
          />
          <Input
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="e.g. Sales, Rent, Supplies"
            helper="Optional category for grouping"
          />
        </form>
      </Modal>
    </DashboardLayout>
  )
}
