import { Link, useLocation } from '@tanstack/react-router'
import { Sparkles } from 'lucide-react'
import { useSaaSStore } from '@/lib/saas-store'
import { useLang } from '@/lib/i18n'

export function FloatingAiButton() {
  const { t } = useLang()
  const location = useLocation()
  const { currentUser, merchants } = useSaaSStore()

  // Hide the floating button when already on the AI chat page
  if (location.pathname.startsWith('/ai-chat')) {
    return null
  }

  // Respect merchant-level AI toggle when signed in as merchant / staff
  if (currentUser.role !== 'SUPER_ADMIN') {
    const currentMerchant = merchants.find((m) => m.id === currentUser.merchantId)
    if (currentMerchant?.features?.ai === false) {
      return null
    }
  }

  return (
    <div className='fixed bottom-6 end-6 z-50 print:hidden'>
      <Link
        to='/ai-chat'
        className='group relative flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#09090B] text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-100 shadow-2xl border border-white/15 dark:border-black/10 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer'
        title='Ask Maya AI Copilot'
      >
        {/* Glowing Mint Icon Badge */}
        <div className='size-7 rounded-full bg-[#3EEA85] text-black flex items-center justify-center font-bold shadow-xs shrink-0 transition-transform group-hover:rotate-12'>
          <Sparkles className='size-3.5 fill-black text-black' />
        </div>

        {/* Text & Live Pulse Indicator */}
        <div className='flex items-center gap-2'>
          <span className='text-xs font-bold tracking-tight'>
            {t('اسأل مايا AI', 'Ask Maya')}
          </span>
          <span className='flex h-2 w-2 relative'>
            <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3EEA85] opacity-75'></span>
            <span className='relative inline-flex rounded-full h-2 w-2 bg-[#3EEA85]'></span>
          </span>
        </div>
      </Link>
    </div>
  )
}
