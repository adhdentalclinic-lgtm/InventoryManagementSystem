'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/lib/auth'
import { toast } from 'sonner'
import { TrendingUp, TrendingDown, X, Search, Wallet } from 'lucide-react'

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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
    setShowModal(true)
  }

  const filtered = entries.filter(
    (e) =>
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      (e.category && e.category.toLowerCase().includes(search.toLowerCase()))
  )

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cashflow</h1>
            <p className="text-sm text-muted-foreground mt-1">Track all cash in and out transactions</p>
          </div>
          <button
            onClick={() => { setEditing(null); setForm({ type: 'IN', amount: 0, description: '', category: '' }); setShowModal(true) }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Wallet className="h-4 w-4" />
            Add Entry
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-card border border-border p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cash In</p>
                <p className="mt-2 text-2xl font-bold text-emerald-500">{formatCurrency(totals.in)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-card border border-border p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cash Out</p>
                <p className="mt-2 text-2xl font-bold text-rose-500">{formatCurrency(totals.out)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10">
                <TrendingDown className="h-5 w-5 text-rose-500" />
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-card border border-border p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Balance</p>
                <p className={`mt-2 text-2xl font-bold ${totals.net >= 0 ? 'text-gold' : 'text-rose-500'}`}>
                  {formatCurrency(totals.net)}
                </p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${totals.net >= 0 ? 'bg-gold/10' : 'bg-rose-500/10'}`}>
                <Wallet className={`h-5 w-5 ${totals.net >= 0 ? 'text-gold' : 'text-rose-500'}`} />
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entries..."
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                  {isAdmin && <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      <td colSpan={isAdmin ? 6 : 5} className="px-4 py-4"><div className="h-4 w-3/4 animate-pulse rounded bg-muted" /></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-muted-foreground">No entries found</td>
                  </tr>
                ) : (
                  filtered.map((e) => (
                    <tr key={e.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{new Date(e.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          e.type === 'IN'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {e.type === 'IN' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {e.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground">{e.description}</td>
                      <td className="px-4 py-3 text-muted-foreground">{e.category || '-'}</td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">{formatCurrency(e.amount)}</td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(e)}
                              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(e.id)}
                              className="rounded-md p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                            >
                              Delete
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
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">{editing ? 'Edit Entry' : 'Add Cashflow Entry'}</h2>
              <button onClick={() => { setShowModal(false); setEditing(null) }} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    Cash In
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
                    Cash Out
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min={0.01}
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                <input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. Sales, Rent, Supplies"
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
                  {editing ? 'Update' : 'Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
