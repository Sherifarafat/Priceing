import { Link } from '@tanstack/react-router'
import { Check, Gift, QrCode, RefreshCw, Smile } from 'lucide-react'
import { ThemeSwitch } from '@/components/theme-switch'
import { LanguageSwitch } from '@/components/language-switch'
import { GreenScanLogo } from '@/components/green-scan-logo'
import { useDirection } from '@/context/direction-provider'
import { SignUpForm } from './components/sign-up-form'

const APPLE_FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Arabic", "Plus Jakarta Sans", "Readex Pro", system-ui, sans-serif'

const signUpCopy = {
  en: {
    title: 'Create your account',
    subPrefix: 'Start with',
    subSuffix: 'in under a minute and say goodbye to paper price stickers.',
    haveAccount: 'Already have an account?',
    login: 'Log in',
    badge: '30-Day Free Trial',
    features: [
      {
        title: 'One QR code for your entire store',
        desc: 'Shoppers scan once in their browser — zero app downloads needed.',
      },
      {
        title: 'No more peeling or reprinting stickers',
        desc: 'Update any price once and it reflects immediately on every phone.',
      },
      {
        title: 'Shopping made fun & transparent',
        desc: 'Instant green price cards in LE with a built-in cart calculator.',
      },
    ],
    free: '30-Day Free Trial',
    noCard: 'No credit card required',
  },
  ar: {
    title: 'أنشئ حسابك الآن',
    subPrefix: 'ابدأ مع',
    subSuffix: 'في أقل من دقيقة واستغنى عن ستيكرات الأسعار الورقية للأبد.',
    haveAccount: 'لديك حساب بالفعل؟',
    login: 'تسجيل الدخول',
    badge: 'تجربة مجانية 30 يوم',
    features: [
      {
        title: 'كود QR واحد لمتجرك بالكامل',
        desc: 'العميل يمسحه مرة واحدة من المتصفح — بدون تحميل أي تطبيق.',
      },
      {
        title: 'وداعاً لستيكرات الأسعار اللي بتتلف',
        desc: 'عدّل أي سعر مرة واحدة وهيسمّع فوراً على موبايل كل عميل.',
      },
      {
        title: 'تسوق أمتع وأسهل للعميل',
        desc: 'بطاقة سعر خضراء فورية بـ LE مع حاسبة سلة مدمجة قبل الكاشير.',
      },
    ],
    free: 'تجربة مجانية 30 يوم',
    noCard: 'بدون بطاقة بنكية',
  },
} as const

export function SignUp() {
  const { dir } = useDirection()
  const isAr = dir === 'rtl'
  const t = signUpCopy[isAr ? 'ar' : 'en']
  const icons = [QrCode, RefreshCw, Smile]

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
      {/* Top Bar: Green Scan Logo + Language & Theme */}
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
        {/* ── LEFT COLUMN: Sign Up Form with Green Scan Logo ── */}
        <div className='w-full max-w-sm mx-auto flex flex-col justify-center py-4'>
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

          <div className='mt-7'>
            <SignUpForm />
          </div>

          <p className='text-center text-xs text-muted-foreground mt-5'>
            {t.haveAccount}{' '}
            <Link
              to='/sign-in'
              className='font-bold text-foreground underline underline-offset-4 hover:text-[#00a827] dark:hover:text-[#00D632] transition-colors'
            >
              {t.login}
            </Link>
          </p>
        </div>

        {/* ── RIGHT COLUMN: Dark Obsidian + Electric Green Brand Panel ── */}
        <div className='relative rounded-[1.75rem] bg-[#061006] text-white p-7 sm:p-8 flex flex-col justify-between overflow-hidden min-h-[510px] max-lg:hidden'>
          <div className='pointer-events-none absolute -top-20 -end-20 size-64 rounded-full bg-[#00D632]/25 blur-3xl' />
          <div className='pointer-events-none absolute -bottom-24 -start-16 size-64 rounded-full bg-[#00D632]/15 blur-3xl' />

          {/* Top Logo */}
          <div className='relative z-10 flex items-center justify-between'>
            <GreenScanLogo size='sm' inverted className='[&_span]:text-white' />
            <span className='px-3 py-1 rounded-full bg-[#00D632]/15 text-[#00D632] text-[10px] font-bold tracking-widest uppercase'>
              {t.badge}
            </span>
          </div>

          {/* Center Feature Highlights */}
          <div className='relative z-10 space-y-3.5 my-6'>
            {t.features.map((item, idx) => {
              const Icon = icons[idx]
              return (
                <div
                  key={idx}
                  className='rounded-2xl bg-white/[0.06] border border-white/10 p-4 flex items-start gap-3.5 backdrop-blur-xs'
                >
                  <div className='size-10 rounded-xl bg-[#00D632] text-[#061006] flex items-center justify-center shrink-0'>
                    <Icon className='size-5' />
                  </div>
                  <div className='space-y-0.5'>
                    <h3 className='text-sm font-bold text-white'>{item.title}</h3>
                    <p className='text-xs text-neutral-400 leading-relaxed'>{item.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Bottom Pill */}
          <div className='relative z-10 flex items-center justify-between pt-4 border-t border-white/10 text-xs text-neutral-400'>
            <span className='inline-flex items-center gap-1.5 font-semibold text-white'>
              <Gift className='size-3.5 text-[#00D632]' /> {t.free}
            </span>
            <span className='inline-flex items-center gap-1.5 font-semibold text-[#00D632]'>
              <Check className='size-3.5 stroke-[3]' /> {t.noCard}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
