'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Package, Eye, EyeOff, ArrowRight, CircleCheck as CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
  const { signIn, signUp, user } = useAuth()
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  if (user) {
    router.push('/dashboard')
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) {
          toast.error(error.message || 'Invalid credentials')
        } else {
          toast.success('Welcome back!')
          router.push('/dashboard')
        }
      } else {
        const { error } = await signUp(email, password, fullName)
        if (error) {
          toast.error(error.message || 'Registration failed')
        } else {
          toast.success('Account created successfully!')
          setMode('login')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const features = [
    'Real-time inventory tracking',
    'Stock movement logging',
    'Financial cashflow management',
    'Role-based access control',
  ]

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-black" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gold/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 border border-gold/20">
              <Package className="h-5 w-5 text-gold" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Inventory Pro</span>
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl xl:text-5xl font-bold text-white tracking-tight leading-tight">
                Enterprise-grade<br />
                <span className="text-gold">inventory management</span>
              </h1>
              <p className="mt-4 text-lg text-neutral-400 max-w-md">
                Streamline your operations with real-time stock tracking, automated cashflow monitoring, and intelligent analytics.
              </p>
            </div>

            <div className="space-y-3">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-neutral-300">
                  <CheckCircle2 className="h-5 w-5 text-gold flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-neutral-500">
            Trusted by 500+ businesses worldwide
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm space-y-8 animate-fade-in">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xl font-bold text-foreground">Inventory Pro</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === 'login'
                ? 'Enter your credentials to access your dashboard'
                : 'Fill in your details to get started'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
              />
            )}
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
            </div>

            <Button
              type="submit"
              loading={loading}
              size="lg"
              className="w-full"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="text-center">
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {mode === 'login' ? (
                <>Don&apos;t have an account? <span className="text-primary font-medium">Sign up</span></>
              ) : (
                <>Already have an account? <span className="text-primary font-medium">Sign in</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
