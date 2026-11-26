import * as React from 'react'
import { QrCode, ExternalLink, Smartphone, Copy, Check } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useSaaSStore } from '@/lib/saas-store'

export function MobileScannerModal() {
  const [open, setOpen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [lanIp, setLanIp] = React.useState<string | null>(null)
  const { currentUser, merchants } = useSaaSStore()

  // Fetch host LAN IPv4 address when dialog opens so QR codes scanned by phones reach this machine
  React.useEffect(() => {
    if (!open) return
    let cancelled = false
    fetch('/api/scan/network-info')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.lanIp) {
          setLanIp(data.lanIp)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [open])

  // Respect merchant-level scanner button toggle
  if (currentUser.role !== 'SUPER_ADMIN') {
    const currentMerchant = merchants.find((m) => m.id === currentUser.merchantId)
    if (currentMerchant?.features?.scannerButton === false) {
      return null
    }
  }

  const merchantQuery =
    currentUser.role !== 'SUPER_ADMIN' && currentUser.merchantId
      ? `?merchantId=${currentUser.merchantId}`
      : ''

  const buildOrigin = () => {
    if (typeof window === 'undefined') return 'https://localhost:5173'
    const isLocalhost =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    const host = isLocalhost && lanIp ? lanIp : window.location.hostname
    const port = window.location.port ? `:${window.location.port}` : ''
    return `${window.location.protocol}//${host}${port}`
  }

  const mobileUrl = `${buildOrigin()}/scan${merchantQuery}`
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(
    mobileUrl
  )}`

  const handleCopy = () => {
    navigator.clipboard.writeText(mobileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size='sm' variant='default' className='h-8 gap-1.5 bg-primary text-primary-foreground text-xs shadow-xs cursor-pointer'>
          <Smartphone className='size-3.5' />
          <span>افتح صفحة الاسكانر</span>
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-sm text-center'>
        <DialogHeader>
          <DialogTitle className='text-center flex items-center justify-center gap-2'>
            <QrCode className='size-5 text-primary' />
            صفحة الاسكانر (Customer Scanner)
          </DialogTitle>
          <DialogDescription className='text-xs text-center'>
            امسح الكود بكاميرا الموبايل لتفتح صفحة الاسكانر مباشرة على هاتفك، أو افتحها على جهازك الحالي.
          </DialogDescription>
        </DialogHeader>

        <div className='my-3 flex flex-col items-center justify-center space-y-3'>
          {/* Real Phone-Scannable QR Code */}
          <div className='p-3 bg-white rounded-xl shadow-md border inline-block'>
            <img
              src={qrImageUrl}
              alt='Customer Scanner QR Code'
              width={200}
              height={200}
              className='size-[200px] rounded-md'
            />
          </div>

          <div className='text-[11px] text-muted-foreground flex items-center gap-1.5'>
            <span>وجّه كاميرا الموبايل نحو هذا الـ QR لفتحه فوراً</span>
          </div>

          <div className='w-full rounded-md border bg-muted/60 p-2 text-start flex items-center justify-between gap-2'>
            <code className='text-[10px] text-foreground truncate select-all font-mono'>
              {mobileUrl}
            </code>
            <Button size='icon' variant='ghost' className='size-7 shrink-0 cursor-pointer' onClick={handleCopy}>
              {copied ? <Check className='size-3 text-emerald-500' /> : <Copy className='size-3' />}
            </Button>
          </div>
        </div>

        <div className='flex flex-col gap-2'>
          <Button asChild size='sm' className='w-full text-xs gap-1.5'>
            <Link
              to='/scan'
              search={
                currentUser.role !== 'SUPER_ADMIN' && currentUser.merchantId
                  ? { merchantId: currentUser.merchantId }
                  : {}
              }
              target='_blank'
            >
              <ExternalLink className='size-3.5' />
              فتح الاسكانر في المتصفح الحالي
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
