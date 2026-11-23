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
import { getQRCodeSvg } from '@/lib/qr-generator'
import { useSaaSStore } from '@/lib/saas-store'

export function MobileScannerModal() {
  const [copied, setCopied] = React.useState(false)
  const { currentUser, merchants } = useSaaSStore()

  // Respect merchant-level scanner button toggle
  if (currentUser.role !== 'SUPER_ADMIN') {
    const currentMerchant = merchants.find((m) => m.id === currentUser.merchantId)
    if (currentMerchant?.features?.scannerButton === false) {
      return null
    }
  }

  // Compute network accessible URL for mobile phones on the same WiFi network
  const host = typeof window !== 'undefined'
    ? (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
        ? window.location.hostname
        : '192.168.1.5')
    : '192.168.1.5'
  const port = typeof window !== 'undefined' ? window.location.port : '5173'
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:'
  const mobileUrl = `${protocol}//${host}${port ? `:${port}` : ''}/scan`

  const qrSvg = getQRCodeSvg(mobileUrl, 200)

  const handleCopy = () => {
    navigator.clipboard.writeText(mobileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size='sm' variant='default' className='h-8 gap-1.5 bg-primary text-primary-foreground text-xs shadow-xs'>
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
          {/* Scannable QR Code for Phone */}
          <div
            className='p-3 bg-white rounded-xl shadow-md border inline-block'
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />

          <div className='text-[11px] text-muted-foreground flex items-center gap-1.5'>
            <span>وجّه كاميرا الموبايل نحو هذا الـ QR لفتحه فوراً</span>
          </div>

          <div className='w-full rounded-md border bg-muted/60 p-2 text-start flex items-center justify-between gap-2'>
            <code className='text-[10px] text-foreground truncate select-all font-mono'>
              {mobileUrl}
            </code>
            <Button size='icon' variant='ghost' className='size-7 shrink-0' onClick={handleCopy}>
              {copied ? <Check className='size-3 text-green-500' /> : <Copy className='size-3' />}
            </Button>
          </div>
        </div>

        <div className='flex flex-col gap-2'>
          <Button asChild size='sm' className='w-full text-xs gap-1.5'>
            <Link to='/scan' target='_blank'>
              <ExternalLink className='size-3.5' />
              فتح الاسكانر في المتصفح الحالي
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
