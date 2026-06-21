'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/lib/auth'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { DataTable } from '@/components/ui/DataTable'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Shield, User, Search, Users, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfileRow {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'staff'
  created_at: string
}

export default function UsersPage() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [users, setUsers] = useState<ProfileRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (error) {
      toast.error('Failed to load users')
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }

  async function toggleRole(userId: string, currentRole: 'admin' | 'staff') {
    const newRole = currentRole === 'admin' ? 'staff' : 'admin'
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success(`Role updated to ${newRole}`)
      fetchUsers()
    }
  }

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name && u.full_name.toLowerCase().includes(search.toLowerCase()))
  )

  const adminCount = users.filter((u) => u.role === 'admin').length
  const staffCount = users.filter((u) => u.role === 'staff').length

  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (row: ProfileRow) => (
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full',
            row.role === 'admin' ? 'bg-gold/10' : 'bg-muted'
          )}>
            <span className={cn(
              'text-sm font-bold',
              row.role === 'admin' ? 'text-gold' : 'text-muted-foreground'
            )}>
              {(row.full_name || row.email || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-foreground">{row.full_name || 'Unnamed User'}</p>
            <p className="text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row: ProfileRow) => (
        <Badge variant={row.role === 'admin' ? 'gold' : 'default'} dot>
          {row.role === 'admin' && <Crown className="h-3 w-3 mr-0.5" />}
          {row.role}
        </Badge>
      ),
      width: '120px',
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (row: ProfileRow) => (
        <span className="text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</span>
      ),
      width: '130px',
    },
    {
      key: 'actions',
      header: '',
      align: 'right' as const,
      render: (row: ProfileRow) => (
        <button
          onClick={() => toggleRole(row.id, row.role)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200',
            row.role === 'admin'
              ? 'border border-border text-muted-foreground hover:bg-danger-muted hover:text-danger hover:border-danger'
              : 'border border-gold/30 text-gold hover:bg-gold/10'
          )}
        >
          Make {row.role === 'admin' ? 'Staff' : 'Admin'}
        </button>
      ),
      width: '140px',
    },
  ]

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted mb-6">
            <Shield className="h-10 w-10 text-muted-foreground/60" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">Only administrators can access user management. Contact your system admin if you need access.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage user roles and permissions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="flex items-center gap-4" padding="md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Users</p>
              <p className="text-2xl font-bold text-foreground">{users.length}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4" padding="md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10">
              <Crown className="h-6 w-6 text-gold" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Admins</p>
              <p className="text-2xl font-bold text-gold">{adminCount}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4" padding="md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Staff</p>
              <p className="text-2xl font-bold text-foreground">{staffCount}</p>
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
            placeholder="Search users by name or email..."
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
              icon="search"
              title="No users found"
              description={search ? 'Try adjusting your search.' : 'No users registered yet.'}
            />
          }
        />
      </div>
    </DashboardLayout>
  )
}
