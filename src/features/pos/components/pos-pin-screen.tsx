import * as React from 'react'
import {
  Delete,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Globe,
  Sun,
  Moon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDirection } from '@/context/direction-provider'
import { useTheme } from '@/context/theme-provider'
import { setCookie } from '@/lib/cookies'
import type { Merchant, User } from '@/types/saas'

interface PosPinScreenProps {
  merchant: Merchant
  cashiers: User[]
  onUnlock: (cashier: User) => void
  onExit: () => void
}

export function PosPinScreen({
  merchant,
  cashiers,
  onUnlock,
  onExit,
}: PosPinScreenProps) {
  const { dir, setDir } = useDirection()
  const { resolvedTheme, setTheme } = useTheme()
  const isAr = dir === 'rtl'
  const isDark = resolvedTheme === 'dark'
  const [selectedCashier, setSelectedCashier] = React.useState<User | null>(
    cashiers[0] || null
  )
  const [pin, setPin] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [shake, setShake] = React.useState(false)

  const toggleLanguage = () => {
    const nextLang = isAr ? 'en' : 'ar'
    setCookie('app_language', nextLang, 60 * 60 * 24 * 365)
    document.documentElement.lang = nextLang
    setDir(nextLang === 'ar' ? 'rtl' : 'ltr')
  }

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  // Keep selected cashier synchronized when cashiers list loads or changes
  React.useEffect(() => {
    if ((!selectedCashier || !cashiers.some((c) => c.id === selectedCashier.id)) && cashiers.length > 0) {
      setSelectedCashier(cashiers[0])
    }
  }, [cashiers, selectedCashier])

  // Auto-focus physical keyboard listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCashier) return

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        handleDigit(e.key)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        handleBackspace()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleClear()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        handleVerifyPin()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pin, selectedCashier])

  const handleDigit = (digit: string) => {
    if (pin.length >= 6) return
    setError(null)
    const nextPin = pin + digit
    setPin(nextPin)

    // Auto verify if reached 4 digits
    const expectedPin = selectedCashier?.pin || '1234'
    if (nextPin.length === expectedPin.length) {
      if (nextPin === expectedPin && selectedCashier) {
        onUnlock(selectedCashier)
      } else if (nextPin.length >= 4) {
        triggerError(isAr ? 'رمز PIN غير صحيح، حاول مرة أخرى' : 'Incorrect PIN, please try again')
      }
    }
  }

  const handleBackspace = () => {
    setError(null)
    setPin((prev) => prev.slice(0, -1))
  }

  const handleClear = () => {
    setError(null)
    setPin('')
  }

  const triggerError = (msg: string) => {
    setError(msg)
    setShake(true)
    setTimeout(() => {
      setShake(false)
      setPin('')
    }, 600)
  }

  const handleVerifyPin = () => {
    if (!selectedCashier) return
    const expectedPin = selectedCashier.pin || '1234'
    if (pin === expectedPin) {
      onUnlock(selectedCashier)
    } else {
      triggerError(isAr ? 'رمز PIN غير صحيح!' : 'Incorrect PIN!')
    }
  }

  return (
    <div
      dir={dir}
      className='min-h-screen w-full bg-[#f5f7f5] dark:bg-[#131314] text-[#101410] dark:text-neutral-100 flex flex-col justify-between p-4 sm:p-8 select-none font-sans transition-colors'
    >
      {/* ── Top Bar: Store Identity & Exit ── */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          {merchant.logo ? (
            <img
              src={merchant.logo}
              alt={merchant.name}
              className='size-11 rounded-[14px] object-cover border border-[#e8ece8] dark:border-neutral-800 shadow-xs'
            />
          ) : (
            <div className='size-11 rounded-[14px] bg-[#00d632] dark:bg-white text-[#061006] dark:text-black flex items-center justify-center font-black text-2xl shadow-xs'>
              {merchant.name ? merchant.name.charAt(0).toUpperCase() : 'G'}
            </div>
          )}
          <div>
            <h1 className='text-xl font-black tracking-tight text-[#101410] dark:text-neutral-100 flex items-center gap-2'>
              {merchant.name || 'GREEN POS'}
              <span className='text-[11px] text-[#368449] dark:text-neutral-200 bg-[#e8f9ec] dark:bg-neutral-800 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider'>
                POS Terminal
              </span>
            </h1>
            <p className='text-xs text-[#7a827b] dark:text-neutral-400'>
              {isAr
                ? 'بوابة تسجيل دخول الكاشير السريعة بالرقم السري'
                : 'Quick Cashier PIN Sign-In Gate'}
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={toggleTheme}
            className='size-9 rounded-xl bg-white dark:bg-[#1E1F20] border border-[#e8ece8] dark:border-neutral-800 hover:bg-[#f0f3f0] dark:hover:bg-[#282A2C] text-[#101410] dark:text-neutral-100 flex items-center justify-center cursor-pointer transition-colors'
            title={isDark ? (isAr ? 'الوضع الفاتح' : 'Light Mode') : (isAr ? 'الوضع الليلي' : 'Dark Mode')}
          >
            {isDark ? <Sun className='size-4' /> : <Moon className='size-4' />}
          </button>

          <button
            type='button'
            onClick={toggleLanguage}
            className='h-9 px-3 rounded-xl bg-white dark:bg-[#1E1F20] border border-[#e8ece8] dark:border-neutral-800 hover:bg-[#f0f3f0] dark:hover:bg-[#282A2C] text-[#101410] dark:text-neutral-100 flex items-center gap-1.5 text-xs font-black cursor-pointer transition-colors'
            title={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
          >
            <Globe className='size-3.5' />
            <span>{isAr ? 'EN' : 'عربي'}</span>
          </button>

          <Button
            variant='ghost'
            size='sm'
            onClick={onExit}
            className='text-[#7a827b] dark:text-neutral-400 hover:text-[#101410] dark:hover:text-white hover:bg-[#e8ece8] dark:hover:bg-[#282A2C] rounded-xl text-xs gap-1.5 cursor-pointer'
          >
            <span>{isAr ? 'إغلاق الشاشة' : 'Close'}</span>
            <ArrowRight className='size-3.5 rtl:rotate-180' />
          </Button>
        </div>
      </div>

      {/* ── Center Stage: Cashier Selection + Circular PIN Pad ── */}
      <div className='max-w-xl sm:max-w-2xl w-full mx-auto my-auto p-7 sm:p-10 bg-white dark:bg-[#1E1F20] border border-[#e8ece8] dark:border-neutral-800 rounded-[28px] shadow-[0_6px_28px_rgba(16,32,16,0.04)] dark:shadow-none flex flex-col items-center'>
        {/* Cashier Accounts Selection (Avatar circle with name underneath) */}
        <div className='w-full mb-6'>
          <p className='text-xs font-bold text-[#7a827b] dark:text-neutral-400 text-center mb-3 uppercase tracking-wider'>
            {isAr ? 'اختر حساب الكاشير' : 'Select Cashier'}
          </p>
          <div className='flex items-center justify-center gap-4 sm:gap-6 flex-wrap'>
            {cashiers.map((cashier) => {
              const isSelected = selectedCashier?.id === cashier.id
              return (
                <button
                  key={cashier.id}
                  type='button'
                  onClick={() => {
                    setSelectedCashier(cashier)
                    setPin('')
                    setError(null)
                  }}
                  className='flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none'
                >
                  <div
                    className={`size-14 sm:size-16 rounded-full flex items-center justify-center text-lg sm:text-xl font-black transition-all shadow-xs ${
                      isSelected
                        ? 'bg-[#00d632] text-[#061006] ring-4 ring-[#101410] dark:ring-white scale-105 shadow-md'
                        : 'bg-[#f0f3f0] dark:bg-[#282A2C] text-[#59635a] dark:text-neutral-300 hover:bg-[#e4eae4] dark:hover:bg-[#262c27] border border-[#e8ece8] dark:border-neutral-800 group-hover:scale-102'
                    }`}
                  >
                    {cashier.name ? cashier.name.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <span
                    className={`text-xs transition-colors max-w-[85px] truncate text-center ${
                      isSelected
                        ? 'text-[#101410] dark:text-white font-black'
                        : 'text-[#7a827b] dark:text-neutral-400 font-medium group-hover:text-[#101410] dark:group-hover:text-white'
                    }`}
                  >
                    {cashier.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected Cashier Identity */}
        {selectedCashier && (
          <div className='flex flex-col items-center mb-5 text-center'>
            <h2 className='text-lg font-black text-[#101410] dark:text-white tracking-tight'>
              {selectedCashier.name}
            </h2>
            <p className='text-xs text-[#7a827b] dark:text-neutral-400 mt-0.5 flex items-center gap-1.5'>
              <ShieldCheck className='size-3.5 text-[#00d632] dark:text-neutral-300' />
              <span>
                {isAr
                  ? 'أدخل رمز PIN المكون من 4 أرقام لفتح نقطة البيع'
                  : 'Enter your 4-digit PIN to unlock POS'}
              </span>
            </p>
          </div>
        )}

        {/* PIN Dots Display */}
        <div
          className={`flex items-center justify-center gap-4 mb-6 transition-transform ${
            shake ? 'animate-bounce text-red-500' : ''
          }`}
        >
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index
            return (
              <div
                key={index}
                className={`size-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-[#101410] dark:bg-white shadow-sm scale-125'
                    : 'bg-[#e8ece8] dark:bg-neutral-800 border border-[#d6ddd6] dark:border-neutral-700'
                }`}
              />
            )
          })}
        </div>

        {/* Error message */}
        {error && (
          <div className='mb-4 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5'>
            <AlertCircle className='size-3.5 shrink-0' />
            <span>{error}</span>
          </div>
        )}

        {/* Touch Circular NumPad */}
        <div className='grid grid-cols-3 gap-4 w-full max-w-[280px] justify-items-center' dir='ltr'>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type='button'
              onClick={() => handleDigit(digit)}
              className='size-16 rounded-full bg-white dark:bg-[#242628] hover:bg-[#f0f8f1] dark:hover:bg-neutral-800 hover:border-[#00d632] dark:hover:border-neutral-500 active:scale-90 border border-[#e8ece8] dark:border-neutral-800 text-2xl font-bold text-[#101410] dark:text-white transition-all shadow-xs flex items-center justify-center font-mono cursor-pointer'
            >
              {digit}
            </button>
          ))}

          <button
            type='button'
            onClick={handleClear}
            className='size-16 rounded-full bg-[#f2f5f2] dark:bg-[#282A2C] hover:bg-[#e8ece8] dark:hover:bg-[#262c27] active:scale-90 border border-[#e8ece8] dark:border-neutral-800 text-xs font-bold text-[#59635a] dark:text-neutral-300 transition-all flex items-center justify-center cursor-pointer'
          >
            {isAr ? 'مسح (C)' : 'Clear'}
          </button>

          <button
            type='button'
            onClick={() => handleDigit('0')}
            className='size-16 rounded-full bg-white dark:bg-[#242628] hover:bg-[#f0f8f1] dark:hover:bg-neutral-800 hover:border-[#00d632] dark:hover:border-neutral-500 active:scale-90 border border-[#e8ece8] dark:border-neutral-800 text-2xl font-bold text-[#101410] dark:text-white transition-all shadow-xs flex items-center justify-center font-mono cursor-pointer'
          >
            0
          </button>

          <button
            type='button'
            onClick={handleBackspace}
            className='size-16 rounded-full bg-[#f2f5f2] dark:bg-[#282A2C] hover:bg-[#e8ece8] dark:hover:bg-[#262c27] active:scale-90 border border-[#e8ece8] dark:border-neutral-800 text-[#59635a] dark:text-neutral-300 hover:text-[#101410] dark:hover:text-white transition-all flex items-center justify-center cursor-pointer'
          >
            <Delete className='size-5' />
          </button>
        </div>

        {/* Quick hint */}
        <p className='text-[11px] text-[#7a827b] dark:text-neutral-400 text-center mt-6'>
          {isAr ? 'الرقم الافتراضي لأي كاشير جديد هو ' : 'Default PIN for new cashiers is '}
          <code className='text-[#061006] dark:text-white font-mono font-bold bg-[#e8f9ec] dark:bg-neutral-800 border border-[#00d632]/30 dark:border-neutral-700 px-2 py-0.5 rounded-md'>
            1234
          </code>
        </p>
      </div>

      {/* ── Footer Info ── */}
      <div className='text-center text-xs text-[#7a827b] dark:text-neutral-400 flex items-center justify-center gap-2'>
        <span>GREEN POS • Paperless Engine</span>
        <span>•</span>
        <span className='flex items-center gap-1.5 text-[#368449] dark:text-neutral-300 font-bold'>
          <span className='size-2 rounded-full bg-[#00d632] dark:bg-white inline-block animate-pulse' />
          PAPERLESS MODE ON
        </span>
      </div>
    </div>
  )
}
