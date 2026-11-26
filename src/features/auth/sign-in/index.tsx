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
  Loader2,
  ScanLine,
  Tag,
  Check,
  ArrowRight,
  ShoppingCart,
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
import { GreenScanLogo } from '@/components/green-scan-logo'
import { useDirection } from '@/context/direction-provider'

const APPLE_FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Arabic", "Plus Jakarta Sans", "Readex Pro", system-ui, sans-serif'

const signInCopy = {
  en: {
    title: 'Welcome back',
    subPrefix: 'Sign in to your',
    subSuffix: 'store portal and manage live prices effortlessly.',
    userLabel: 'Username or Email',
    userPlaceholder: 'e.g. sherif or store@email.com',
    passLabel: 'Password',
    forgot: 'Forgot password?',
    submit: 'Log In',
    newUser: 'New to Green Scan?',
    createAccount: 'Create an account',
    adminChip: 'Super Admin:',
    badge: 'Zero Price Stickers',
    cardHeader: 'Green Scan Live',
    productName: 'Roasted Coffee',
    addToCart: 'Add to Cart',
    heroLine1: 'Shopping made fun.',
    heroLine2: 'Prices in a snap.',
    heroSub:
      'Update prices once and let every shopper scan barcodes live with their phone camera — no paper tags required.',
    check1: 'No app download',
    check2: 'Live store QR',
    errUserRequired: 'Please enter your username or email.',
    errPassRequired: 'Please enter your password.',
    errInvalid: 'Invalid credentials. Use: sherif / 123456',
  },
  ar: {
    title: 'أهلاً بعودتك',
    subPrefix: 'سجّل دخولك لبوابة',
    subSuffix: 'وأدر أسعار ومنتجات متجرك بكل سهولة.',
    userLabel: 'اسم المستخدم أو البريد الإلكتروني',
    userPlaceholder: 'مثال: sherif أو store@email.com',
    passLabel: 'كلمة المرور',
    forgot: 'نسيت كلمة المرور؟',
    submit: 'تسجيل الدخول',
    newUser: 'جديد في Green Scan؟',
    createAccount: 'إنشاء حساب جديد',
    adminChip: 'سوبر أدمن:',
    badge: 'بدون ستيكر أسعار',
    cardHeader: 'سكانر Green Scan الحي',
    productName: 'بن / قهوة طازجة',
    addToCart: 'أضف للسلة',
    heroLine1: 'التسوق بقى أمتع.',
    heroLine2: 'والسعر في لحظة.',
    heroSub:
      'عدّل السعر مرة واحدة وخلي كل عميل يمسح الباركود بكاميرا موبايله ويعرف السعر فوراً — بدون أي ستيكر ورقي.',
    check1: 'بدون تحميل تطبيقات',
    check2: 'QR حي لمتجرك',
    errUserRequired: 'يرجى إدخال اسم المستخدم أو البريد الإلكتروني.',
    errPassRequired: 'يرجى إدخال كلمة المرور.',
    errInvalid: 'بيانات الدخول غير صحيحة. جرّب: sherif / 123456',
  },
} as const

type FormValues = {
  usernameOrEmail: string
  password: string
}

export function SignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })
  const navigate = useNavigate()
  const { auth } = useAuthStore()
  const { users, switchUser } = useSaaSStore()
  const { dir } = useDirection()
  const isAr = dir === 'rtl'
  const t = signInCopy[isAr ? 'ar' : 'en']

  const [isLoading, setIsLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)

  const formSchema = React.useMemo(
    () =>
      z.object({
        usernameOrEmail: z.string().min(1, t.errUserRequired),
        password: z.string().min(1, t.errPassRequired),
      }),
    [t.errUserRequired, t.errPassRequired]
  )

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
        if (res.user.role === 'MERCHANT_MANAGER' && !res.user.merchantId) {
          navigate({ to: '/onboarding', replace: true })
        } else {
          navigate({ to: redirect || '/dashboard', replace: true })
        }
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
      navigate({ to: redirect || '/dashboard', replace: true })
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
        navigate({ to: redirect || '/dashboard', replace: true })
        return
      }
    }

    setIsLoading(false)
    toast.error(t.errInvalid)
  }

  return (
    <div
      dir={dir}
      style={{
        fontFamily: APPLE_FONT_STACK,
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      }}
      className='relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#F5F6F7] dark:bg-[#061006] overflow-hidden'
    >
      {/* Top Bar: Brand Home Link + Language & Theme */}
      <div className='absolute top-5 inset-x-5 sm:inset-x-8 flex items-center justify-between z-20'>
        <Link to='/' className='transition-transform hover:scale-105'>
          <GreenScanLogo size='sm' />
        </Link>
        <div className='flex items-center gap-2'>
          <LanguageSwitch />
          <ThemeSwitch />
        </div>
      </div>

      {/* Main Split Card (Green Scan Identity) */}
      <div className='w-full max-w-5xl bg-card border border-border/70 rounded-[2.25rem] shadow-[0_24px_70px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.5)] p-5 sm:p-7 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-stretch relative z-10 mt-10 sm:mt-0'>
        {/* ── LEFT COLUMN: Login Form ── */}
        <div className='w-full max-w-sm mx-auto flex flex-col justify-center py-4'>
          {/* Green Scan Emblem */}
          <div className='mb-5 flex justify-center'>
            <Link to='/' className='transition-transform hover:scale-105'>
              <GreenScanLogo size='lg' showText={false} />
            </Link>
          </div>

          <h1 className='text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground text-center'>
            {t.title}
          </h1>
          <p className='text-xs sm:text-[13px] text-muted-foreground text-center mt-2 max-w-xs mx-auto leading-relaxed'>
            {t.subPrefix} <span className='font-bold text-foreground'>Green Scan</span> {t.subSuffix}
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 mt-7'>
              {/* Username / Email */}
              <FormField
                control={form.control}
                name='usernameOrEmail'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs font-semibold text-foreground'>
                      {t.userLabel}
                    </FormLabel>
                    <FormControl>
                      <div className='relative'>
                        <User className='size-4 text-muted-foreground absolute start-3.5 top-1/2 -translate-y-1/2' />
                        <Input
                          placeholder={t.userPlaceholder}
                          className='ps-10 h-11 rounded-2xl text-xs bg-muted/40 dark:bg-muted/20 border-border/80 focus-visible:border-[#00D632] focus-visible:ring-[#00D632]/30'
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className='text-[11px]' />
                  </FormItem>
                )}
              />

              {/* Password */}
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <div className='flex items-center justify-between'>
                      <FormLabel className='text-xs font-semibold text-foreground'>
                        {t.passLabel}
                      </FormLabel>
                      <Link
                        to='/forgot-password'
                        className='text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors'
                      >
                        {t.forgot}
                      </Link>
                    </div>
                    <FormControl>
                      <div className='relative'>
                        <Lock className='size-4 text-muted-foreground absolute start-3.5 top-1/2 -translate-y-1/2' />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder='••••••••'
                          className='ps-10 pe-10 h-11 rounded-2xl text-xs bg-muted/40 dark:bg-muted/20 border-border/80 focus-visible:border-[#00D632] focus-visible:ring-[#00D632]/30'
                          {...field}
                        />
                        <button
                          type='button'
                          onClick={() => setShowPassword(!showPassword)}
                          className='absolute end-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
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
                    <FormMessage className='text-[11px]' />
                  </FormItem>
                )}
              />

              {/* Primary Submit Button (Jet Black in Light / Volt Green in Dark) */}
              <Button
                type='submit'
                disabled={isLoading}
                className='w-full h-12 rounded-full font-bold text-sm bg-[#061006] hover:bg-black text-white dark:bg-[#00D632] dark:hover:bg-[#19e848] dark:text-[#061006] shadow-lg active:scale-[0.99] transition-all gap-2 mt-2 cursor-pointer'
              >
                {isLoading ? (
                  <Loader2 className='size-4 animate-spin' />
                ) : (
                  <>
                    <span>{t.submit}</span>
                    <ArrowRight className={`size-4 ${isAr ? 'rotate-180' : ''}`} />
                  </>
                )}
              </Button>

              {/* Sign Up Link */}
              <p className='text-center text-xs text-muted-foreground pt-1'>
                {t.newUser}{' '}
                <Link
                  to='/sign-up'
                  className='font-bold text-foreground underline underline-offset-4 hover:text-[#00a827] dark:hover:text-[#00D632] transition-colors'
                >
                  {t.createAccount}
                </Link>
              </p>

              {/* Quick Auto-fill Credential Chip */}
              <div className='pt-2 text-center'>
                <button
                  type='button'
                  onClick={fillSherifCredentials}
                  className='inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors bg-muted/60 hover:bg-muted px-3.5 py-1.5 rounded-full border border-border/70 cursor-pointer'
                >
                  <Shield className='size-3 text-[#00a827] dark:text-[#00D632]' />
                  <span>{t.adminChip}</span>
                  <span className='font-mono font-bold text-foreground' dir='ltr'>
                    sherif / 123456
                  </span>
                </button>
              </div>
            </form>
          </Form>
        </div>

        {/* ── RIGHT COLUMN: Signature Green Scan Brand Panel ── */}
        <div className='relative rounded-[1.75rem] bg-[#00D632] text-[#061006] p-7 sm:p-8 flex flex-col justify-between overflow-hidden min-h-[510px] max-lg:hidden'>
          {/* Subtle Dot Texture */}
          <div
            className='pointer-events-none absolute inset-0 opacity-[0.08]'
            style={{
              backgroundImage: 'radial-gradient(#061006 1.2px, transparent 1.2px)',
              backgroundSize: '22px 22px',
            }}
          />

          {/* Top Brand Tag */}
          <div className='relative z-10 flex items-center justify-between'>
            <div className='inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#061006]/10 border border-[#061006]/15 text-[11px] font-bold tracking-wider uppercase'>
              <Tag className='size-3.5' />
              <span>{t.badge}</span>
            </div>
            <div className='size-9 rounded-full bg-[#061006] text-[#00D632] flex items-center justify-center'>
              <ScanLine className='size-4' />
            </div>
          </div>

          {/* Centerpiece: Sleek Green Scan Live Price Card Preview */}
          <div className='relative z-10 my-6 flex flex-col items-center justify-center'>
            <div className='w-full max-w-[300px] rounded-[28px] bg-[#061006] text-white p-5 shadow-[0_28px_60px_rgba(6,16,6,0.35)] space-y-4'>
              {/* Mini Viewfinder Header */}
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <div className='size-7 rounded-full bg-[#00D632] text-[#061006] flex items-center justify-center font-black text-[10px]'>
                    GS
                  </div>
                  <span className='text-xs font-bold text-white/90'>{t.cardHeader}</span>
                </div>
                <span className='text-[10px] font-mono text-[#00D632] font-bold bg-[#00D632]/15 px-2 py-0.5 rounded-full'>
                  0.1s
                </span>
              </div>

              {/* Inner Bright Green Scanned Price Card */}
              <div className='rounded-2xl bg-[#00D632] text-[#061006] p-4 text-center space-y-2'>
                <p className='text-sm font-extrabold'>{t.productName}</p>
                <div className='flex items-baseline justify-center gap-1' dir='ltr'>
                  <span className='text-4xl font-extrabold tracking-tight tabular-nums'>65.00</span>
                  <span className='text-base font-bold opacity-80'>LE</span>
                </div>
                <div className='w-full py-2 rounded-xl bg-[#061006] text-white text-[11px] font-bold flex items-center justify-center gap-1.5'>
                  <ShoppingCart className='size-3.5' />
                  <span>{t.addToCart}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Brand Copy */}
          <div className='relative z-10 space-y-3'>
            <h2 className='text-2xl sm:text-[26px] font-extrabold tracking-tight leading-tight text-[#061006]'>
              {t.heroLine1}
              <br />
              {t.heroLine2}
            </h2>
            <p className='text-xs font-semibold text-[#061006]/80 leading-relaxed max-w-sm'>
              {t.heroSub}
            </p>

            <div className='flex flex-wrap items-center gap-3 pt-1 text-[11px] font-bold text-[#061006]/85'>
              <span className='inline-flex items-center gap-1'>
                <Check className='size-3.5 stroke-[3]' /> {t.check1}
              </span>
              <span className='inline-flex items-center gap-1'>
                <Check className='size-3.5 stroke-[3]' /> {t.check2}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
