import * as React from 'react'
import { ChevronRight, X } from 'lucide-react'

interface SidebarTrialCardProps {
  onSelectPlan: () => void
  onDismiss?: () => void
}

export function SidebarTrialCard({ onSelectPlan, onDismiss }: SidebarTrialCardProps) {
  const [isDismissed, setIsDismissed] = React.useState(false)

  if (isDismissed) return null

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDismissed(true)
    onDismiss?.()
  }

  return (
    <div className='group-data-[collapsible=icon]:hidden relative w-full rounded-2xl bg-[#161618] dark:bg-[#18181B] text-white p-3.5 shadow-lg border border-white/5 dark:border-white/10 transition-all'>
      {/* Top Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-1.5 font-bold text-xs tracking-tight text-white'>
          <span className='text-sm leading-none select-none'>🗓️</span>
          <span>5 Days left !</span>
        </div>
        <button
          type='button'
          onClick={handleDismiss}
          className='size-5 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer'
          title='Dismiss'
        >
          <X className='size-3' />
        </button>
      </div>

      {/* Modern Gradient Progress Bar */}
      <div className='h-1.5 w-full bg-neutral-800/90 rounded-full overflow-hidden my-2.5'>
        <div
          className='h-full w-[45%] rounded-full bg-gradient-to-r from-[#FCA5A5] via-[#C084FC] to-[#4F46E5] transition-all duration-500'
        />
      </div>

      {/* Description text */}
      <p className='text-[11px] text-neutral-400 leading-relaxed font-normal mb-2.5'>
        Select best plan now and unlock all special features
      </p>

      {/* Action link / button */}
      <button
        type='button'
        onClick={onSelectPlan}
        className='inline-flex items-center gap-1 text-xs font-semibold text-white hover:text-indigo-300 transition-colors cursor-pointer group/btn'
      >
        <span>Select plan</span>
        <ChevronRight className='size-3.5 group-hover/btn:translate-x-0.5 transition-transform' />
      </button>
    </div>
  )
}
