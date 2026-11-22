import * as React from 'react'
import {
  Lock,
  Maximize2,
  Minimize2,
  MapPin,
  LogOut,
} from 'lucide-react'
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
  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(false)

  // Fullscreen listener
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  return (
    <header className='bg-white border border-[#e8ece8] rounded-[18px] p-4 flex items-center justify-between gap-4 shadow-[0_4px_18px_rgba(16,32,16,0.024)] select-none'>
      {/* ── Left: Store Brand & Branch ── */}
      <div className='flex items-center gap-3.5'>
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
          <div className='flex items-center gap-2'>
            <span className='font-black text-xl tracking-tight text-[#101410]'>
              {merchant.name || '.GREEN'}
            </span>
            <span className='text-[10px] text-[#368449] bg-[#e8f9ec] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider'>
              POS
            </span>
          </div>
          <div className='text-[11px] text-[#7a827b] uppercase font-bold tracking-wider'>
            Sell More. Print Less.
          </div>
        </div>

        {/* Branch dropdown */}
        <div className='hidden sm:flex items-center ms-3 ps-3 border-s border-[#e8ece8]'>
          {branches.length > 1 ? (
            <div className='flex items-center gap-1.5 text-xs text-[#59635a] bg-[#f2f5f2] border border-[#e8ece8] px-2.5 py-1.5 rounded-xl font-bold'>
              <MapPin className='size-3.5 text-[#00d632]' />
              <select
                value={branch?.id || ''}
                onChange={(e) => {
                  const b = branches.find((item) => item.id === e.target.value)
                  if (b) onSelectBranch(b)
                }}
                className='bg-transparent text-xs text-[#101410] font-bold cursor-pointer border-none focus:outline-none'
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className='bg-white text-[#101410]'>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className='text-xs text-[#7a827b] flex items-center gap-1 font-semibold'>
              <MapPin className='size-3.5 text-[#00d632]' />
              <span>{branch?.name || 'الفرع الرئيسي'}</span>
            </p>
          )}
        </div>
      </div>

      {/* ── Right: User Avatar & Actions (From right: Avatar -> Lock -> Fullscreen -> Logout Arrow) ── */}
      <div className='flex items-center gap-2 sm:gap-2.5 flex-row-reverse'>
        {/* Cashier Circular Avatar (Rightmost) */}
        <div
          className='size-9 sm:size-10 rounded-full bg-[#00d632] text-[#061006] font-black text-sm flex items-center justify-center shadow-xs select-none'
          title={`كاشير: ${cashier.name}`}
        >
          {cashier.name ? cashier.name.charAt(0).toUpperCase() : 'C'}
        </div>

        {/* Lock Terminal Button (White lock in black circle) */}
        <button
          type='button'
          onClick={onLockTerminal}
          className='size-9 sm:size-10 rounded-full bg-[#101410] hover:bg-black text-white flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95'
          title='قفل الشاشة بالرقم السري'
        >
          <Lock className='size-4 text-white' />
        </button>

        {/* Fullscreen Button */}
        <button
          type='button'
          onClick={toggleFullscreen}
          className='size-9 sm:size-10 rounded-full bg-[#f2f5f2] hover:bg-[#e4e9e4] text-[#101410] flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95'
          title={isFullscreen ? 'إلغاء ملء الشاشة' : 'ملء الشاشة'}
        >
          {isFullscreen ? <Minimize2 className='size-4' /> : <Maximize2 className='size-4' />}
        </button>

        {/* Exit POS / Logout Arrow */}
        <button
          type='button'
          onClick={onExitPOS}
          className='size-9 sm:size-10 rounded-full bg-[#f2f5f2] hover:bg-rose-50 text-[#7a827b] hover:text-rose-600 flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95'
          title='الخروج من نقطة البيع'
        >
          <LogOut className='size-4' />
        </button>
      </div>
    </header>
  )
}
