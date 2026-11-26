import * as React from 'react'
import {
  Lock,
  Maximize2,
  Minimize2,
  MapPin,
  LogOut,
  Globe,
  Sun,
  Moon,
  RotateCcw,
} from 'lucide-react'
import { useDirection } from '@/context/direction-provider'
import { useTheme } from '@/context/theme-provider'
import { setCookie } from '@/lib/cookies'
import type { Merchant, Branch, User } from '@/types/saas'

interface PosHeaderProps {
  merchant: Merchant
  branch: Branch | null
  branches: Branch[]
  cashier: User
  onSelectBranch: (branch: Branch) => void
  onOpenReturns?: () => void
  onLockTerminal: () => void
  onExitPOS: () => void
}

export function PosHeader({
  merchant,
  branch,
  branches,
  cashier,
  onSelectBranch,
  onOpenReturns,
  onLockTerminal,
  onExitPOS,
}: PosHeaderProps) {
  const { dir, setDir } = useDirection()
  const { resolvedTheme, setTheme } = useTheme()
  const isAr = dir === 'rtl'
  const isDark = resolvedTheme === 'dark'
  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(false)

  const toggleLanguage = () => {
    const nextLang = isAr ? 'en' : 'ar'
    setCookie('app_language', nextLang, 60 * 60 * 24 * 365)
    document.documentElement.lang = nextLang
    setDir(nextLang === 'ar' ? 'rtl' : 'ltr')
  }

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  // Fullscreen listener
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  return (
    <header className='bg-white dark:bg-[#1E1F20] border border-[#e8ece8] dark:border-neutral-800 rounded-[18px] p-3.5 sm:p-4 flex items-center justify-between gap-4 shadow-[0_4px_18px_rgba(16,32,16,0.024)] dark:shadow-none select-none transition-colors'>
      {/* ── Start: Store Brand & Branch ── */}
      <div className='flex items-center gap-3.5'>
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
          <div className='flex items-center gap-2'>
            <span className='font-black text-xl tracking-tight text-[#101410] dark:text-neutral-100'>
              {merchant.name || '.GREEN'}
            </span>
            <span className='text-[10px] text-[#368449] dark:text-neutral-200 bg-[#e8f9ec] dark:bg-neutral-800 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider'>
              POS
            </span>
          </div>
          <div className='text-[11px] text-[#7a827b] dark:text-neutral-400 font-bold tracking-wider'>
            {isAr ? 'نقطة بيع سريعة وذكية' : 'SELL MORE. PRINT LESS.'}
          </div>
        </div>

        {/* Branch dropdown */}
        <div className='hidden sm:flex items-center ms-3 ps-3 border-s border-[#e8ece8] dark:border-neutral-800'>
          {branches.length > 1 ? (
            <div className='flex items-center gap-1.5 text-xs text-[#59635a] dark:text-neutral-300 bg-[#f2f5f2] dark:bg-[#282A2C] border border-[#e8ece8] dark:border-neutral-800 px-2.5 py-1.5 rounded-xl font-bold'>
              <MapPin className='size-3.5 text-[#00d632] dark:text-neutral-400' />
              <select
                value={branch?.id || ''}
                onChange={(e) => {
                  const b = branches.find((item) => item.id === e.target.value)
                  if (b) onSelectBranch(b)
                }}
                className='bg-transparent text-xs text-[#101410] dark:text-neutral-100 font-bold cursor-pointer border-none focus:outline-none'
              >
                {branches.map((b) => (
                  <option
                    key={b.id}
                    value={b.id}
                    className='bg-white dark:bg-[#242628] text-[#101410] dark:text-neutral-100'
                  >
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className='text-xs text-[#7a827b] dark:text-neutral-400 flex items-center gap-1 font-semibold'>
              <MapPin className='size-3.5 text-[#00d632] dark:text-neutral-400' />
              <span>{branch?.name || (isAr ? 'الفرع الرئيسي' : 'Main Branch')}</span>
            </p>
          )}
        </div>
      </div>

      {/* ── End: User Avatar, Lock, Language Toggle, Dark Mode Toggle, Fullscreen, Exit ── */}
      <div className='flex items-center gap-2 sm:gap-2.5 flex-row-reverse'>
        {/* Cashier Circular Avatar */}
        <div
          className='size-9 sm:size-10 rounded-full bg-[#00d632] text-[#061006] font-black text-sm flex items-center justify-center shadow-xs select-none'
          title={isAr ? `كاشير: ${cashier.name}` : `Cashier: ${cashier.name}`}
        >
          {cashier.name ? cashier.name.charAt(0).toUpperCase() : 'C'}
        </div>

        {/* Lock Terminal Button */}
        <button
          type='button'
          onClick={onLockTerminal}
          className='size-9 sm:size-10 rounded-full bg-[#101410] hover:bg-black text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95'
          title={isAr ? 'قفل الشاشة بالرقم السري' : 'Lock Terminal (PIN)'}
        >
          <Lock className='size-4' />
        </button>

        {/* Returns Action Button */}
        {onOpenReturns && (
          <button
            type='button'
            onClick={onOpenReturns}
            className='h-9 sm:h-10 px-3 rounded-full bg-[#f2f5f2] hover:bg-[#e4e9e4] dark:bg-[#282A2C] dark:hover:bg-[#323538] text-[#101410] dark:text-neutral-100 flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 text-xs font-black'
            title={isAr ? 'مرتجع فاتورة (كامل أو جزئي)' : 'Invoice Returns (Full / Partial)'}
          >
            <RotateCcw className='size-4' />
            <span className='hidden sm:inline'>{isAr ? 'المرتجعات' : 'Returns'}</span>
          </button>
        )}

        {/* Language Toggle Button (Next to Lock) */}
        <button
          type='button'
          onClick={toggleLanguage}
          className='h-9 sm:h-10 px-3 rounded-full bg-[#f2f5f2] hover:bg-[#e4e9e4] dark:bg-[#282A2C] dark:hover:bg-[#262c27] text-[#101410] dark:text-neutral-100 flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 text-xs font-black'
          title={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
        >
          <Globe className='size-4' />
          <span>{isAr ? 'EN' : 'عربي'}</span>
        </button>

        {/* Dark / Light Mode Toggle Button */}
        <button
          type='button'
          onClick={toggleTheme}
          className='size-9 sm:size-10 rounded-full bg-[#f2f5f2] hover:bg-[#e4e9e4] dark:bg-[#282A2C] dark:hover:bg-[#262c27] text-[#101410] dark:text-neutral-100 flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95'
          title={
            isDark
              ? isAr
                ? 'الوضع الفاتح'
                : 'Light Mode'
              : isAr
                ? 'الوضع الليلي'
                : 'Dark Mode'
          }
        >
          {isDark ? <Sun className='size-4' /> : <Moon className='size-4' />}
        </button>

        {/* Fullscreen Button */}
        <button
          type='button'
          onClick={toggleFullscreen}
          className='size-9 sm:size-10 rounded-full bg-[#f2f5f2] hover:bg-[#e4e9e4] dark:bg-[#282A2C] dark:hover:bg-[#262c27] text-[#101410] dark:text-neutral-100 flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95'
          title={
            isFullscreen
              ? isAr
                ? 'إلغاء ملء الشاشة'
                : 'Exit Fullscreen'
              : isAr
                ? 'ملء الشاشة'
                : 'Fullscreen'
          }
        >
          {isFullscreen ? <Minimize2 className='size-4' /> : <Maximize2 className='size-4' />}
        </button>

        {/* Exit POS */}
        <button
          type='button'
          onClick={onExitPOS}
          className='size-9 sm:size-10 rounded-full bg-[#f2f5f2] hover:bg-rose-50 dark:bg-[#282A2C] dark:hover:bg-rose-950/50 text-[#7a827b] dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95'
          title={isAr ? 'الخروج من نقطة البيع' : 'Exit POS'}
        >
          <LogOut className='size-4' />
        </button>
      </div>
    </header>
  )
}
