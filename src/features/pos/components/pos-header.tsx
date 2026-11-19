import * as React from 'react'
import {
  Lock,
  Maximize2,
  Minimize2,
  Clock,
  Store,
  MapPin,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Merchant, Branch, User } from '@/types/saas'

interface PosHeaderProps {
  merchant: Merchant
  branch: Branch | null
  branches: Branch[]
  cashier: User
  onSelectBranch: (branch: Branch) => void
  onLockTerminal: () => void
  onExitPOS: () => void
}

export function PosHeader({
  merchant,
  branch,
  branches,
  cashier,
  onSelectBranch,
  onLockTerminal,
  onExitPOS,
}: PosHeaderProps) {
  const [time, setTime] = React.useState<string>('')
  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(false)

  // Live Clock
  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fullscreen listener
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  return (
    <header className='h-16 px-4 bg-[#09090B] border-b border-white/10 flex items-center justify-between gap-4 text-white shrink-0 select-none'>
      {/* ── Left: Store Brand & Branch ── */}
      <div className='flex items-center gap-3'>
        {merchant.logo ? (
          <img
            src={merchant.logo}
            alt={merchant.name}
            className='size-9 rounded-xl object-cover border border-white/10 shadow-sm'
          />
        ) : (
          <div className='size-9 rounded-xl bg-white/10 flex items-center justify-center font-bold text-base text-[#3EEA85] border border-white/10'>
            <Store className='size-5' />
          </div>
        )}

        <div>
          <div className='flex items-center gap-2'>
            <span className='font-bold text-sm tracking-tight'>{merchant.name}</span>
            <Badge className='bg-[#3EEA85]/20 text-[#3EEA85] border-none text-[10px] font-mono font-bold px-1.5 py-0'>
              POS
            </Badge>
          </div>

          {branches.length > 1 ? (
            <div className='flex items-center gap-1 text-xs text-neutral-400'>
              <MapPin className='size-3 text-[#3EEA85]' />
              <select
                value={branch?.id || ''}
                onChange={(e) => {
                  const b = branches.find((item) => item.id === e.target.value)
                  if (b) onSelectBranch(b)
                }}
                className='bg-transparent text-xs text-neutral-300 font-medium cursor-pointer border-none focus:outline-none'
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className='bg-neutral-900 text-white'>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className='text-xs text-neutral-400 flex items-center gap-1'>
              <MapPin className='size-3 text-[#3EEA85]' />
              <span>{branch?.name || 'الفرع الرئيسي'}</span>
            </p>
          )}
        </div>
      </div>

      {/* ── Center: Live Time & Status Indicator ── */}
      <div className='hidden md:flex items-center gap-2 bg-neutral-900/90 border border-white/10 px-3 py-1 rounded-xl text-xs'>
        <Clock className='size-3.5 text-[#3EEA85]' />
        <span className='font-mono font-bold text-white'>{time}</span>
        <span className='size-1.5 rounded-full bg-[#3EEA85] animate-ping' />
      </div>

      {/* ── Right: Cashier Info & Actions ── */}
      <div className='flex items-center gap-2 sm:gap-3'>
        {/* Cashier Badge */}
        <div className='flex items-center gap-2 bg-neutral-900/90 border border-white/10 px-3 py-1.5 rounded-xl'>
          <div className='size-6 rounded-full bg-[#3EEA85] text-black font-black text-xs flex items-center justify-center'>
            {cashier.name.charAt(0).toUpperCase()}
          </div>
          <div className='text-right'>
            <div className='text-xs font-bold leading-none'>{cashier.name}</div>
            <span className='text-[10px] text-neutral-400 leading-none'>كاشير نشط</span>
          </div>
        </div>

        {/* Lock Terminal Button */}
        <Button
          size='sm'
          variant='outline'
          onClick={onLockTerminal}
          className='h-9 px-3 rounded-xl border-white/15 bg-white/5 hover:bg-[#3EEA85]/15 hover:border-[#3EEA85]/40 hover:text-[#3EEA85] text-xs font-bold gap-1.5 transition-all text-white'
          title='قفل الشاشة بالرقم السري'
        >
          <Lock className='size-3.5' />
          <span className='hidden sm:inline'>قفل الشاشة</span>
        </Button>

        {/* Fullscreen Button */}
        <Button
          size='icon'
          variant='ghost'
          onClick={toggleFullscreen}
          className='size-9 rounded-xl hover:bg-white/10 text-neutral-300 hover:text-white'
          title={isFullscreen ? 'إلغاء ملء الشاشة' : 'ملء الشاشة'}
        >
          {isFullscreen ? <Minimize2 className='size-4' /> : <Maximize2 className='size-4' />}
        </Button>

        {/* Exit POS */}
        <Button
          size='icon'
          variant='ghost'
          onClick={onExitPOS}
          className='size-9 rounded-xl hover:bg-rose-500/10 text-neutral-400 hover:text-rose-400'
          title='الخروج من نقطة البيع'
        >
          <LogOut className='size-4' />
        </Button>
      </div>
    </header>
  )
}
