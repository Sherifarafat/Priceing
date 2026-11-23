import * as React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import {
  Shield,
  Lock,
  User,
  Eye,
  EyeOff,
  Star,
  Loader2,
  DollarSign,
  CreditCard,
  Wifi,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { useSaaSStore } from '@/lib/saas-store'
import { api } from '@/lib/api-client'
import { sleep } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { ThemeSwitch } from '@/components/theme-switch'
import { LanguageSwitch } from '@/components/language-switch'

const formSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Please enter your username or email.'),
  password: z.string().min(1, 'Please enter your password.'),
})

type FormValues = z.infer<typeof formSchema>

export function SignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })
  const navigate = useNavigate()
  const { auth } = useAuthStore()
  const { users, switchUser } = useSaaSStore()

  const [isLoading, setIsLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      usernameOrEmail: '',
      password: '',
    },
  })

  const fillSherifCredentials = () => {
    form.setValue('usernameOrEmail', 'sherif')
    form.setValue('password', '123456')
  }

  async function onSubmit(data: FormValues) {
    setIsLoading(true)

    // 1. Try Live Backend API First
    try {
      const res = await api.auth.login({
        username: data.usernameOrEmail.trim(),
        password: data.password.trim(),
      })

      if (res && res.token) {
        localStorage.setItem('saas_auth_token', res.token)
        auth.setUser({
          accountNo: res.user.id,
          email: res.user.email,
          role: [res.user.role],
          exp: Date.now() + 24 * 60 * 60 * 1000,
        })
        auth.setAccessToken(res.token)

        const matchedStoreUser = users.find((u) => u.username === res.user.username || u.id === res.user.id)
        if (matchedStoreUser) {
          switchUser(matchedStoreUser.id)
        }

        setIsLoading(false)
        toast.success(`Welcome back, ${res.user.name}! Connected to Live Backend.`)
        navigate({ to: redirect || '/', replace: true })
        return
      }
    } catch {
      // Graceful fallback to client store
    }

    await sleep(400)
    const input = data.usernameOrEmail.trim().toLowerCase()
    const pass = data.password.trim()

    // 1. Check Sherif (Company Super Admin)
    const isSuperAdminInput =
      input === 'sherif' ||
      input === 'sherif123' ||
      input === 'sherif@company.com' ||
      input === 'sherifarafat85@gmail.com'

    if (isSuperAdminInput && pass === '123456') {
      const superAdminUser =
        users.find((u) => u.role === 'SUPER_ADMIN') || {
          id: '5313b2a9-d578-4d11-b6bd-e391589cc6be',
          email: 'sherifarafat85@gmail.com',
          username: 'sherif123',
          password: '123456',
          name: 'Sherif Arafat (Super Admin)',
          role: 'SUPER_ADMIN' as const,
          merchantId: null,
          status: 'Active' as const,
          createdAt: new Date().toISOString(),
        }

      localStorage.removeItem('saas_auth_token')
      try {
        const res = await api.auth.switchDemoUser(superAdminUser.id)
        if (res?.token) {
          localStorage.setItem('saas_auth_token', res.token)
        }
      } catch {}

      switchUser(superAdminUser.id)
      auth.setUser({
        accountNo: superAdminUser.id,
        email: superAdminUser.email,
        role: ['SUPER_ADMIN'],
        exp: Date.now() + 24 * 60 * 60 * 1000,
      })
      auth.setAccessToken(`auth-token-${superAdminUser.id}`)

      setIsLoading(false)
      toast.success('Welcome back, Sherif! Logged in as Company Super Admin.')
      navigate({ to: redirect || '/', replace: true })
      return
    }

    // 2. Check other registered users
    const matchedUser = users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === input) ||
        u.email.toLowerCase() === input
    )

    if (matchedUser) {
      const validPass = matchedUser.password ? matchedUser.password === pass : pass === '123456'
      if (validPass) {
        localStorage.removeItem('saas_auth_token')
        try {
          const res = await api.auth.switchDemoUser(matchedUser.id)
          if (res?.token) {
            localStorage.setItem('saas_auth_token', res.token)
          }
        } catch {}

        switchUser(matchedUser.id)
        auth.setUser({
          accountNo: matchedUser.id,
          email: matchedUser.email,
          role: [matchedUser.role],
          exp: Date.now() + 24 * 60 * 60 * 1000,
        })
        auth.setAccessToken(`auth-token-${matchedUser.id}`)

        setIsLoading(false)
        toast.success(`Welcome back, ${matchedUser.name}!`)
        navigate({ to: redirect || '/', replace: true })
        return
      }
    }

    setIsLoading(false)
    toast.error('Invalid credentials. Use: sherif / 123456')
  }

  return (
    <div className='relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-tr from-indigo-50/50 via-background to-indigo-100/30 dark:from-zinc-950 dark:via-background dark:to-zinc-950 overflow-hidden'>
      {/* Top Header Controls (Language & Theme) */}
      <div className='absolute top-4 end-4 flex items-center gap-2 z-20'>
        <LanguageSwitch />
        <ThemeSwitch />
      </div>

      {/* Main Split Container Card */}
      <div className='w-full max-w-5xl bg-card/95 backdrop-blur-xl border border-border/70 rounded-[2.5rem] shadow-2xl p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10'>
        {/* ── LEFT COLUMN: Login Form (Username & Password Only) ── */}
        <div className='w-full max-w-sm mx-auto flex flex-col justify-center py-2'>
          {/* Top Logo Badge */}
          <div className='mb-3 flex justify-center'>
            <div className='size-13 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center shadow-lg transition-transform hover:scale-105'>
              <Shield className='size-7' />
            </div>
          </div>

          {/* Heading */}
          <h1 className='text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground text-center'>
            Welcome back
          </h1>
          <p className='text-xs text-muted-foreground text-center mt-2 max-w-xs mx-auto leading-relaxed'>
            Dive back into your world with a simple sign-in. Your next adventure awaits - let's get started!
          </p>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 mt-6'>
              {/* Field 1: Username / Email */}
              <FormField
                control={form.control}
                name='usernameOrEmail'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs font-semibold text-foreground'>
                      Your Username or Email
                    </FormLabel>
                    <FormControl>
                      <div className='relative'>
                        <User className='size-4 text-muted-foreground absolute start-3.5 top-1/2 -translate-y-1/2' />
                        <Input
                          placeholder='e.g. sherif or user@company.com'
                          className='ps-10 h-11 rounded-xl text-xs bg-background border-border/80 focus-visible:ring-primary'
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className='text-[11px]' />
                  </FormItem>
                )}
              />

              {/* Field 2: Password */}
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <div className='flex items-center justify-between'>
                      <FormLabel className='text-xs font-semibold text-foreground'>
                        Your Password
                      </FormLabel>
                    </div>
                    <FormControl>
                      <div className='relative'>
                        <Lock className='size-4 text-muted-foreground absolute start-3.5 top-1/2 -translate-y-1/2' />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder='Password'
                          className='ps-10 pe-10 h-11 rounded-xl text-xs bg-background border-border/80 focus-visible:ring-primary'
                          {...field}
                        />
                        <button
                          type='button'
                          onClick={() => setShowPassword(!showPassword)}
                          className='absolute end-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                        >
                          {showPassword ? (
                            <EyeOff className='size-4' />
                          ) : (
                            <Eye className='size-4' />
                          )}
                          <span className='sr-only'>Toggle password visibility</span>
                        </button>
                      </div>
                    </FormControl>
                    <div className='flex justify-end pt-0.5'>
                      <Link
                        to='/forgot-password'
                        className='text-[11px] text-muted-foreground hover:text-primary transition-colors'
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormMessage className='text-[11px]' />
                  </FormItem>
                )}
              />

              {/* Vibrant Login Button */}
              <Button
                type='submit'
                disabled={isLoading}
                className='w-full h-11 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-600 via-[#4F46E5] to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-md shadow-indigo-500/25 active:scale-[0.99] transition-all gap-2 mt-2'
              >
                {isLoading ? (
                  <Loader2 className='size-4 animate-spin' />
                ) : (
                  <span>Log in</span>
                )}
              </Button>

              {/* Quick Auto-fill Credential Chip */}
              <div className='pt-2 text-center'>
                <button
                  type='button'
                  onClick={fillSherifCredentials}
                  className='inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors bg-muted/50 hover:bg-muted px-3 py-1.5 rounded-full border border-border/60'
                >
                  <Shield className='size-3 text-primary' />
                  <span>Company Super Admin:</span>
                  <span className='font-mono font-bold text-foreground'>sherif / 123456</span>
                </button>
              </div>
            </form>
          </Form>
        </div>

        {/* ── RIGHT COLUMN: Showcase Hero Card (Matching Image) ── */}
        <div className='relative rounded-[2rem] bg-gradient-to-b from-muted/50 via-muted/30 to-muted/15 border border-border/50 p-6 sm:p-8 flex flex-col justify-between overflow-hidden min-h-[510px] max-lg:hidden'>
          {/* Subtle Ambient Background Gradients */}
          <div className='absolute -top-12 -right-12 size-56 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none' />
          <div className='absolute -bottom-12 -left-12 size-56 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none' />

          {/* Floating Cards Area */}
          <div className='relative w-full h-[260px] flex items-center justify-center pt-2'>
            {/* 1. Top-Left Floating Testimonial Card */}
            <div className='absolute -top-1 left-2 bg-card/95 backdrop-blur-md rounded-2xl p-3.5 shadow-lg border border-border/60 -rotate-3 hover:rotate-0 transition-transform duration-300 w-[200px] space-y-1.5 z-20'>
              <div className='flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400'>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className='size-3 fill-indigo-600 dark:fill-indigo-400 text-indigo-600 dark:text-indigo-400' />
                ))}
              </div>
              <p className='text-[10px] text-foreground font-medium leading-snug'>
                "Cool pricing platform, fast and deposits. Way better than any other."
              </p>
              <div className='flex items-center gap-2 pt-1 border-t border-border/40'>
                <div className='size-5 rounded-full bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[9px]'>
                  S
                </div>
                <div>
                  <div className='text-[10px] font-bold text-foreground leading-tight'>Sherif Arafat</div>
                  <div className='text-[8px] text-muted-foreground'>Platform Owner</div>
                </div>
              </div>
            </div>

            {/* 2. Top-Right Floating Value Pill Card */}
            <div className='absolute top-2 right-2 bg-card/95 backdrop-blur-md rounded-2xl px-3.5 py-2.5 shadow-lg border border-border/60 rotate-3 hover:rotate-0 transition-transform duration-300 z-10 space-y-1 text-end'>
              <div className='text-[9px] text-muted-foreground'>Tuesday, Apr 2, 2026</div>
              <div className='inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-lg font-mono text-[11px] font-bold border border-indigo-200/50'>
                <DollarSign className='size-3 text-indigo-600 dark:text-indigo-400' />
                Value: $7,254.00
              </div>
            </div>

            {/* 3. Centerpiece Dark Smart Card Widget */}
            <div className='relative z-15 w-[270px] rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 text-white p-4.5 space-y-4 border border-neutral-800 shadow-2xl shadow-black/40 rotate-1 hover:rotate-0 transition-transform duration-300'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-1.5 text-neutral-400'>
                  <CreditCard className='size-5' />
                  <Wifi className='size-3.5 rotate-90' />
                </div>
                {/* Mastercard-style circles */}
                <div className='flex items-center -space-x-1.5'>
                  <div className='size-4 rounded-full bg-[#4F46E5]' />
                  <div className='size-4 rounded-full bg-indigo-400/80' />
                </div>
              </div>

              <div className='pt-1'>
                <div className='text-[10px] font-mono text-neutral-400 tracking-wider'>
                  PriceingSaaS **** 3421
                </div>
              </div>

              <div className='flex items-end justify-between pt-2 border-t border-neutral-800/80'>
                <div>
                  <div className='text-[9px] text-neutral-400'>Company Account</div>
                  <div className='text-xs font-semibold'>Sherif Arafat</div>
                </div>
                <div className='text-end'>
                  <div className='text-xs font-mono font-bold text-white'>$7,254.00</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Hero Text */}
          <div className='text-center mt-6 space-y-2 relative z-10'>
            <h2 className='text-xl sm:text-2xl font-bold tracking-tight text-foreground'>
              Discover the Universe of Smart Retail Pricing
            </h2>
            <p className='text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed'>
              Turn your retail pricing into success with our platform: your trusted partner in smart grocery & store management.
            </p>

            {/* Pagination / Slider Indicator */}
            <div className='flex items-center justify-center gap-1.5 pt-4'>
              <div className='h-1.5 w-6 rounded-full bg-neutral-900 dark:bg-white transition-all' />
              <div className='h-1.5 w-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700' />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
