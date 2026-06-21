'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  DollarSign,
  Users,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Menu,
  X,
  ChevronRight,
  Layers,
  Slash,
  BarChart3,
  Activity,
  Settings,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Cashflow', href: '/cashflow', icon: DollarSign },
]

const adminNavItems = [
  { label: 'Products', href: '/inventory', icon: Package, role: 'admin' },
  { label: 'Low Stocks', href: '/low-stocks', icon: Layers, role: 'admin' },
  { label: 'Out of Stock', href: '/out-of-stock', icon: Slash, role: 'admin' },
  { label: 'Sales Analytics', href: '/sales-analytics', icon: BarChart3, role: 'admin' },
  { label: 'Activity Logs', href: '/activity-logs', icon: Activity, role: 'admin' },
  { label: 'Settings', href: '/settings', icon: Settings, role: 'admin' },
  { label: 'Users', href: '/users', icon: Users, role: 'admin' },
]

const staffNavItems = [
  { label: 'Order Dispatch', href: '/stock', icon: ArrowLeftRight, role: 'staff' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isAdmin = profile?.role === 'admin'

  const navLinkClass = (href: string) =>
    cn(
      'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
      pathname === href
        ? 'bg-primary/10 text-primary shadow-sm'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    )

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
          <Package className="h-4.5 w-4.5 text-primary" />
        </div>
        <div>
          <span className="text-base font-bold text-foreground tracking-tight">Inventory Pro</span>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Enterprise</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4 overflow-y-auto">
        <div className="px-3 mb-2">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Main</span>
        </div>
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={navLinkClass(item.href)}>
            <item.icon className={cn('h-4 w-4 transition-colors', pathname === item.href ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
            <span className="flex-1">{item.label}</span>
            {pathname === item.href && <ChevronRight className="h-3.5 w-3.5 text-primary/60" />}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="px-3 mt-6 mb-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Administration</span>
            </div>
            {adminNavItems.map((item) => (
              <Link key={item.href} href={item.href} className={navLinkClass(item.href)}>
                <item.icon className={cn('h-4 w-4 transition-colors', pathname === item.href ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                <span className="flex-1">{item.label}</span>
                {pathname === item.href && <ChevronRight className="h-3.5 w-3.5 text-primary/60" />}
              </Link>
            ))}
          </>
        )}

        {!isAdmin && (
          <>
            <div className="px-3 mt-6 mb-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Operations</span>
            </div>
            {staffNavItems.map((item) => (
              <Link key={item.href} href={item.href} className={navLinkClass(item.href)}>
                <item.icon className={cn('h-4 w-4 transition-colors', pathname === item.href ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                <span className="flex-1">{item.label}</span>
                {pathname === item.href && <ChevronRight className="h-3.5 w-3.5 text-primary/60" />}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-border px-3 py-4 space-y-4">
        <div className="flex items-center gap-3 rounded-xl bg-muted/80 px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <span className="text-xs font-bold text-primary">{(profile?.full_name || profile?.email || 'U').charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{profile?.full_name || profile?.email}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{profile?.role}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-muted/80 p-1">
          <button
            onClick={() => setTheme('light')}
            className={cn(
              'flex flex-1 items-center justify-center rounded-lg py-1.5 text-xs font-medium transition-all duration-200',
              theme === 'light' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Sun className="h-3.5 w-3.5 mr-1" />
            Light
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={cn(
              'flex flex-1 items-center justify-center rounded-lg py-1.5 text-xs font-medium transition-all duration-200',
              theme === 'dark' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Moon className="h-3.5 w-3.5 mr-1" />
            Dark
          </button>
          <button
            onClick={() => setTheme('system')}
            className={cn(
              'flex flex-1 items-center justify-center rounded-lg py-1.5 text-xs font-medium transition-all duration-200',
              theme === 'system' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Monitor className="h-3.5 w-3.5 mr-1" />
            Auto
          </button>
        </div>

        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-danger-muted hover:text-danger"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Package className="h-4 w-4 text-primary" />
          </div>
          <span className="text-base font-bold text-foreground">Inventory Pro</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-foreground rounded-lg hover:bg-muted transition-colors">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:h-screen',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
