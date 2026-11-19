import * as React from 'react'
import {
  Lock,
  Delete,
  Store,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  const [selectedCashier, setSelectedCashier] = React.useState<User | null>(
    cashiers[0] || null
  )
  const [pin, setPin] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [shake, setShake] = React.useState(false)

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
        triggerError('رمز PIN غير صحيح، حاول مرة أخرى')
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
      triggerError('رمز PIN غير صحيح!')
    }
  }

  return (
    <div className='min-h-screen w-full bg-[#09090B] text-white flex flex-col justify-between p-4 sm:p-8 select-none font-sans'>
      {/* ── Top Bar: Store Identity & Exit ── */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          {merchant.logo ? (
            <img
              src={merchant.logo}
              alt={merchant.name}
              className='size-11 rounded-2xl object-cover border border-white/10 shadow-lg'
            />
          ) : (
            <div className='size-11 rounded-2xl bg-white/10 flex items-center justify-center font-bold text-lg border border-white/10'>
              <Store className='size-5 text-[#3EEA85]' />
            </div>
          )}
          <div>
            <h1 className='text-lg font-extrabold tracking-tight flex items-center gap-2'>
              {merchant.name}
              <Badge className='bg-[#3EEA85]/20 text-[#3EEA85] border border-[#3EEA85]/40 text-[10px] font-bold'>
                POS Terminal
              </Badge>
            </h1>
            <p className='text-xs text-neutral-400'>بوابة تسجيل دخول الكاشير السريعة بالرقم السري</p>
          </div>
        </div>

        <Button
          variant='ghost'
          size='sm'
          onClick={onExit}
          className='text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl text-xs gap-1.5'
        >
          <span>إغلاق الشاشة</span>
          <ArrowRight className='size-3.5 rtl:rotate-180' />
        </Button>
      </div>

      {/* ── Center Stage: Cashier Selection + PIN Pad ── */}
      <div className='max-w-md w-full mx-auto my-auto py-6 flex flex-col items-center'>
        {/* Cashier Selection Pills */}
        <div className='w-full mb-6'>
          <p className='text-xs font-semibold text-neutral-400 text-center mb-2.5'>
            اختر حساب الكاشير:
          </p>
          <div className='flex items-center justify-center gap-2 flex-wrap'>
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
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-[#3EEA85] text-black border-[#3EEA85] shadow-lg shadow-[#3EEA85]/20 scale-105'
                      : 'bg-neutral-900/80 text-neutral-300 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div
                    className={`size-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                      isSelected
                        ? 'bg-black text-[#3EEA85]'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    {cashier.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{cashier.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected Cashier Identity Box */}
        {selectedCashier && (
          <div className='flex flex-col items-center mb-6 text-center'>
            <div className='size-16 rounded-3xl bg-neutral-900 border border-white/10 shadow-inner flex items-center justify-center mb-3 relative'>
              <Lock className='size-7 text-[#3EEA85]' />
              <span className='absolute -top-1 -right-1 size-3.5 rounded-full bg-[#3EEA85] ring-4 ring-[#09090B]' />
            </div>
            <h2 className='text-xl font-black text-white tracking-tight'>
              {selectedCashier.name}
            </h2>
            <p className='text-xs text-neutral-400 mt-0.5 flex items-center gap-1.5'>
              <ShieldCheck className='size-3.5 text-[#3EEA85]' />
              <span>أدخل رمز PIN المكون من 4 أرقام لفتح نقطة البيع</span>
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
                    ? 'bg-[#3EEA85] shadow-md shadow-[#3EEA85]/50 scale-125'
                    : 'bg-neutral-800 border border-white/15'
                }`}
              />
            )
          })}
        </div>

        {/* Error message */}
        {error && (
          <div className='mb-4 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5'>
            <AlertCircle className='size-3.5 shrink-0' />
            <span>{error}</span>
          </div>
        )}

        {/* Touch NumPad */}
        <div className='grid grid-cols-3 gap-3 w-full max-w-[280px]'>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type='button'
              onClick={() => handleDigit(digit)}
              className='h-14 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 active:scale-95 border border-white/10 text-xl font-bold text-white transition-all shadow-sm flex items-center justify-center font-mono'
            >
              {digit}
            </button>
          ))}

          <button
            type='button'
            onClick={handleClear}
            className='h-14 rounded-2xl bg-neutral-900/40 hover:bg-neutral-800 active:scale-95 border border-white/10 text-xs font-bold text-neutral-400 hover:text-white transition-all flex items-center justify-center'
          >
            مسح (C)
          </button>

          <button
            type='button'
            onClick={() => handleDigit('0')}
            className='h-14 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 active:scale-95 border border-white/10 text-xl font-bold text-white transition-all shadow-sm flex items-center justify-center font-mono'
          >
            0
          </button>

          <button
            type='button'
            onClick={handleBackspace}
            className='h-14 rounded-2xl bg-neutral-900/40 hover:bg-neutral-800 active:scale-95 border border-white/10 text-neutral-300 hover:text-white transition-all flex items-center justify-center'
          >
            <Delete className='size-5' />
          </button>
        </div>

        {/* Quick hint */}
        <p className='text-[11px] text-neutral-500 text-center mt-6'>
          الرقم الافتراضي لأي كاشير جديد هو <code className='text-[#3EEA85] font-mono font-bold bg-white/5 px-1.5 py-0.5 rounded'>1234</code>
        </p>
      </div>

      {/* ── Footer Info ── */}
      <div className='text-center text-xs text-neutral-500 flex items-center justify-center gap-2'>
        <span>Saller Finro POS Engine v2.0</span>
        <span>•</span>
        <span className='flex items-center gap-1 text-[#3EEA85]'>
          <span className='size-2 rounded-full bg-[#3EEA85] inline-block animate-pulse' />
          متصل بالإنترنت ومزامن لحظياً
        </span>
      </div>
    </div>
  )
}
