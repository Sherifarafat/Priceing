import * as React from 'react'
import {
  Delete,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
    <div className='min-h-screen w-full bg-[#f5f7f5] text-[#101410] flex flex-col justify-between p-4 sm:p-8 select-none font-sans'>
      {/* ── Top Bar: Store Identity & Exit ── */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          {merchant.logo ? (
            <img
              src={merchant.logo}
              alt={merchant.name}
              className='size-11 rounded-[14px] object-cover border border-[#e8ece8] shadow-xs'
            />
          ) : (
            <div className='size-11 rounded-[14px] bg-[#00d632] text-[#061006] flex items-center justify-center font-black text-2xl shadow-xs'>
              {merchant.name ? merchant.name.charAt(0).toUpperCase() : 'G'}
            </div>
          )}
          <div>
            <h1 className='text-xl font-black tracking-tight text-[#101410] flex items-center gap-2'>
              {merchant.name || 'GREEN POS'}
              <span className='text-[11px] text-[#368449] bg-[#e8f9ec] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider'>
                POS Terminal
              </span>
            </h1>
            <p className='text-xs text-[#7a827b]'>بوابة تسجيل دخول الكاشير السريعة بالرقم السري</p>
          </div>
        </div>

        <Button
          variant='ghost'
          size='sm'
          onClick={onExit}
          className='text-[#7a827b] hover:text-[#101410] hover:bg-[#e8ece8] rounded-xl text-xs gap-1.5'
        >
          <span>إغلاق الشاشة</span>
          <ArrowRight className='size-3.5 rtl:rotate-180' />
        </Button>
      </div>

      {/* ── Center Stage: Cashier Selection + Circular PIN Pad ── */}
      <div className='max-w-xl sm:max-w-2xl w-full mx-auto my-auto p-7 sm:p-10 bg-white border border-[#e8ece8] rounded-[28px] shadow-[0_6px_28px_rgba(16,32,16,0.04)] flex flex-col items-center'>
        {/* Cashier Accounts Selection (Avatar circle with name underneath) */}
        <div className='w-full mb-6'>
          <p className='text-xs font-bold text-[#7a827b] text-center mb-3 uppercase tracking-wider'>
            اختر حساب الكاشير
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
                        ? 'bg-[#00d632] text-[#061006] ring-4 ring-[#101410] scale-105 shadow-md'
                        : 'bg-[#f0f3f0] text-[#59635a] hover:bg-[#e4eae4] border border-[#e8ece8] group-hover:scale-102'
                    }`}
                  >
                    {cashier.name ? cashier.name.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <span
                    className={`text-xs transition-colors max-w-[85px] truncate text-center ${
                      isSelected ? 'text-[#101410] font-black' : 'text-[#7a827b] font-medium group-hover:text-[#101410]'
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
            <h2 className='text-lg font-black text-[#101410] tracking-tight'>
              {selectedCashier.name}
            </h2>
            <p className='text-xs text-[#7a827b] mt-0.5 flex items-center gap-1.5'>
              <ShieldCheck className='size-3.5 text-[#00d632]' />
              <span>أدخل رمز PIN المكون من 4 أرقام لفتح نقطة البيع</span>
            </p>
          </div>
        )}

        {/* PIN Dots Display (Filled is Black #101410) */}
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
                    ? 'bg-[#101410] shadow-sm scale-125'
                    : 'bg-[#e8ece8] border border-[#d6ddd6]'
                }`}
              />
            )
          })}
        </div>

        {/* Error message */}
        {error && (
          <div className='mb-4 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5'>
            <AlertCircle className='size-3.5 shrink-0' />
            <span>{error}</span>
          </div>
        )}

        {/* Touch Circular NumPad */}
        <div className='grid grid-cols-3 gap-4 w-full max-w-[280px] justify-items-center'>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type='button'
              onClick={() => handleDigit(digit)}
              className='size-16 rounded-full bg-white hover:bg-[#f0f8f1] hover:border-[#00d632] active:scale-90 border border-[#e8ece8] text-2xl font-bold text-[#101410] transition-all shadow-xs flex items-center justify-center font-mono cursor-pointer'
            >
              {digit}
            </button>
          ))}

          <button
            type='button'
            onClick={handleClear}
            className='size-16 rounded-full bg-[#f2f5f2] hover:bg-[#e8ece8] active:scale-90 border border-[#e8ece8] text-xs font-bold text-[#59635a] transition-all flex items-center justify-center cursor-pointer'
          >
            مسح (C)
          </button>

          <button
            type='button'
            onClick={() => handleDigit('0')}
            className='size-16 rounded-full bg-white hover:bg-[#f0f8f1] hover:border-[#00d632] active:scale-90 border border-[#e8ece8] text-2xl font-bold text-[#101410] transition-all shadow-xs flex items-center justify-center font-mono cursor-pointer'
          >
            0
          </button>

          <button
            type='button'
            onClick={handleBackspace}
            className='size-16 rounded-full bg-[#f2f5f2] hover:bg-[#e8ece8] active:scale-90 border border-[#e8ece8] text-[#59635a] hover:text-[#101410] transition-all flex items-center justify-center cursor-pointer'
          >
            <Delete className='size-5' />
          </button>
        </div>

        {/* Quick hint */}
        <p className='text-[11px] text-[#7a827b] text-center mt-6'>
          الرقم الافتراضي لأي كاشير جديد هو{' '}
          <code className='text-[#061006] font-mono font-bold bg-[#e8f9ec] border border-[#00d632]/30 px-2 py-0.5 rounded-md'>
            1234
          </code>
        </p>
      </div>

      {/* ── Footer Info ── */}
      <div className='text-center text-xs text-[#7a827b] flex items-center justify-center gap-2'>
        <span>GREEN POS • Paperless Engine</span>
        <span>•</span>
        <span className='flex items-center gap-1.5 text-[#368449] font-bold'>
          <span className='size-2 rounded-full bg-[#00d632] inline-block animate-pulse' />
          PAPERLESS MODE ON
        </span>
      </div>
    </div>
  )
}
