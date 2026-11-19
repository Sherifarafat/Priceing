import { Monitor, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSaaSStore } from '@/lib/saas-store'

export function PosShortcutButton() {
  const { currentUser, merchants } = useSaaSStore()
  const merchantId = currentUser.merchantId || merchants[0]?.id || ''

  const handleOpenPOS = () => {
    window.open(`/pos${merchantId ? `?merchantId=${merchantId}` : ''}`, '_blank')
  }

  return (
    <Button
      size='sm'
      onClick={handleOpenPOS}
      className='h-8.5 gap-2 rounded-xl bg-black text-[#3EEA85] hover:bg-neutral-900 border border-[#3EEA85]/40 font-bold text-xs shadow-xs hover:border-[#3EEA85] transition-all hover:scale-[1.02] cursor-pointer'
    >
      <Monitor className='size-3.5 text-[#3EEA85]' />
      <span className='font-bold'>شاشة الكاشير (POS)</span>
      <ExternalLink className='size-3 text-neutral-400' />
    </Button>
  )
}
