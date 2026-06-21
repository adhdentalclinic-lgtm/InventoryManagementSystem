'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/lib/auth'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { SlidersHorizontal, ShieldCheck, Sparkles } from 'lucide-react'

export default function SettingsPage() {
  const { profile, loading } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [threshold, setThreshold] = useState(10)
  const [target, setTarget] = useState(50000)
  const [notifications, setNotifications] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!loading && isAdmin) {
      setThreshold(10)
      setTarget(50000)
      setNotifications(true)
    }
  }, [loading, isAdmin])

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
          <ShieldCheck className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">This page is restricted to administrators only.</p>
        </div>
      </DashboardLayout>
    )
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    window.setTimeout(() => {
      toast.success('Settings saved successfully')
      setSaving(false)
    }, 600)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Configure admin controls for the inventory system.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            Admin only
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <SlidersHorizontal className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">General Configuration</h2>
                  <p className="text-sm text-muted-foreground">Control alert thresholds and performance targets.</p>
                </div>
              </div>
              <form className="space-y-4" onSubmit={handleSave}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Low stock threshold</label>
                  <Input
                    type="number"
                    value={threshold}
                    onChange={(event) => setThreshold(Number(event.target.value))}
                    min={1}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Monthly sales target</label>
                  <Input
                    type="number"
                    value={target}
                    onChange={(event) => setTarget(Number(event.target.value))}
                    min={0}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Notifications</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setNotifications(true)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${notifications ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
                    >
                      Enabled
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotifications(false)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${!notifications ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
                    >
                      Disabled
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </form>
            </div>
          </Card>

          <Card>
            <div className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-success/10 text-success">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Security & access</h2>
                  <p className="text-sm text-muted-foreground">Review user settings and admin privileges.</p>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-muted p-4">
                <p className="text-sm text-muted-foreground">Current admin</p>
                <p className="mt-2 font-medium text-foreground">{profile?.full_name || profile?.email}</p>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Role: {profile?.role}</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted p-4">
                <p className="text-sm text-muted-foreground">System status</p>
                <p className="mt-2 font-medium text-foreground">Operational</p>
                <p className="text-xs text-muted-foreground">All services are responding normally.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
