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
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Inventory', href: '/inventory', icon: Package },
  { label: 'Stock Movement', href: '/stock', icon: ArrowLeftRight },
  { label: 'Cashflow', href: '/cashflow', icon: DollarSign },
]

const adminNavItems = [
  { label: 'Users', href: '/users', icon: Users },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isAdmin = profile?.role === 'admin'

  const navLinkClass = (href: string) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      pathname === href
        ? 'bg-primary/10 text-primary'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Package className="h-4 w-4 text-primary" />
        </div>
        <span className="text-lg font-bold text-foreground">Inventory</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={navLinkClass(item.href)}>
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
        {isAdmin &&
          adminNavItems.map((item) => (
            <Link key={item.href} href={item.href} className={navLinkClass(item.href)}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
      </nav>

      <div className="border-t border-border px-3 py-4 space-y-3">
        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground truncate">{profile?.full_name || profile?.email}</p>
            <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          <button
            onClick={() => setTheme('light')}
            className={`flex flex-1 items-center justify-center rounded-md py-1.5 text-xs font-medium transition-colors ${
              theme === 'light' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            <Sun className="h-3.5 w-3.5 mr-1" />
            Light
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex flex-1 items-center justify-center rounded-md py-1.5 text-xs font-medium transition-colors ${
              theme === 'dark' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            <Moon className="h-3.5 w-3.5 mr-1" />
            Dark
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`flex flex-1 items-center justify-center rounded-md py-1.5 text-xs font-medium transition-colors ${
              theme === 'system' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            <Monitor className="h-3.5 w-3.5 mr-1" />
            Auto
          </button>
        </div>

        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Package className="h-4 w-4 text-primary" />
          </div>
          <span className="text-lg font-bold text-foreground">Inventory</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-foreground">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transition-transform lg:translate-x-0 lg:static lg:h-screen ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
