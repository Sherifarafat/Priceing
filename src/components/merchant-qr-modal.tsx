import * as React from 'react'
import { QrCode, ExternalLink, Copy, Check, Store, GitBranch, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useSaaSStore } from '@/lib/saas-store'
import type { Merchant } from '@/types/saas'

interface MerchantQrButtonProps {
  merchant: Merchant
  variant?: 'icon' | 'outline'
}

export function MerchantQrButton({ merchant, variant = 'icon' }: MerchantQrButtonProps) {
  const { branches } = useSaaSStore()
  const [open, setOpen] = React.useState(false)
  const [lanIp, setLanIp] = React.useState<string | null>(null)
  const [selectedTarget, setSelectedTarget] = React.useState<string>('store')
  const [copied, setCopied] = React.useState(false)

  const merchantBranches = React.useMemo(
    () => branches.filter((b) => b.merchantId === merchant.id),
    [branches, merchant.id]
  )

  // Reset selected target when merchant changes
  React.useEffect(() => {
    setSelectedTarget('store')
  }, [merchant.id])

  // Fetch host LAN IPv4 address when dialog opens so QR codes scanned by phones always reach this machine
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

  const buildOrigin = () => {
    if (typeof window === 'undefined') return 'https://localhost:5173'
    const isLocalhost =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    const host = isLocalhost && lanIp ? lanIp : window.location.hostname
    const port = window.location.port ? `:${window.location.port}` : ''
    return `${window.location.protocol}//${host}${port}`
  }

  const origin = buildOrigin()
  const selectedBranch =
    selectedTarget === 'store'
      ? null
      : merchantBranches.find((b) => b.id === selectedTarget) || null

  const scannerPath = selectedBranch
    ? `/branch/${selectedBranch.qrToken}`
    : `/scan?merchantId=${merchant.id}`

  const scannerUrl = `${origin}${scannerPath}`
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=12&data=${encodeURIComponent(
    scannerUrl
  )}`

  const handleCopy = () => {
    navigator.clipboard.writeText(scannerUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadQr = async () => {
    try {
      const response = await fetch(qrImageUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const label = selectedBranch ? `${merchant.name}-${selectedBranch.name}` : merchant.name
      a.download = `qr-scanner-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      window.open(qrImageUrl, '_blank')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === 'icon' ? (
          <Button
            type='button'
            variant='ghost'
            size='icon'
            title={`رموز QR لسكانر ${merchant.name}`}
            aria-label='Merchant Scanner QR Codes'
            className='relative size-9 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer'
          >
            <QrCode className='size-4' />
          </Button>
        ) : (
          <Button
            type='button'
            variant='outline'
            size='sm'
            title={`رموز QR لسكانر ${merchant.name}`}
            className='h-8 px-2.5 rounded-lg text-xs gap-1.5 shrink-0 cursor-pointer'
          >
            <QrCode className='size-3.5 text-foreground' />
            <span>QR</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className='w-[calc(100%-2rem)] sm:max-w-md rounded-3xl p-6 flex flex-col gap-4 overflow-hidden'>
        <DialogHeader className='space-y-2 pe-6'>
          <div className='flex items-center gap-3 min-w-0'>
            {merchant.logo ? (
              <img
                src={merchant.logo}
                alt={merchant.name}
                className='size-11 rounded-xl object-cover border border-border/80 shrink-0'
              />
            ) : (
              <div className='size-11 rounded-xl bg-foreground text-background flex items-center justify-center font-black text-base shrink-0'>
                {merchant.name[0]?.toUpperCase() || <Store className='size-5' />}
              </div>
            )}
            <div className='min-w-0 flex-1 text-start'>
              <DialogTitle className='text-base font-bold truncate'>
                {merchant.name} — Scanner QR
              </DialogTitle>
              <DialogDescription dir='rtl' className='text-xs text-start'>
                امسح الرمز بكاميرا الموبايل لفتح صفحة سكانر {merchant.name} مباشرة
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Store / Branch Selector (when merchant has branches) */}
        {merchantBranches.length > 0 && (
          <div className='flex flex-wrap items-center gap-1.5 w-full min-w-0'>
            <button
              type='button'
              onClick={() => setSelectedTarget('store')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                selectedTarget === 'store'
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-muted/40 text-muted-foreground border-border/80 hover:text-foreground'
              }`}
            >
              <Store className='size-3.5' />
              <span>المتجر بالكامل</span>
            </button>
            {merchantBranches.map((b) => (
              <button
                key={b.id}
                type='button'
                onClick={() => setSelectedTarget(b.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  selectedTarget === b.id
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-muted/40 text-muted-foreground border-border/80 hover:text-foreground'
                }`}
              >
                <GitBranch className='size-3.5' />
                <span>{b.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Scannable QR Code Card */}
        <div className='w-full min-w-0 flex flex-col items-center justify-center space-y-3'>
          <div className='p-4 bg-white rounded-2xl shadow-md border border-border/80 flex flex-col items-center gap-2'>
            <img
              src={qrImageUrl}
              alt={`${merchant.name} Scanner QR Code`}
              className='size-52 rounded-lg'
            />
            <Badge variant='secondary' className='text-[10px] font-semibold px-2.5 py-0.5'>
              {selectedBranch ? selectedBranch.name : merchant.name}
            </Badge>
          </div>

          {/* Copyable Direct URL */}
          <div className='w-full min-w-0 rounded-xl border border-border/80 bg-muted/50 px-3 py-2 flex items-center justify-between gap-2 overflow-hidden'>
            <code className='min-w-0 flex-1 text-[11px] text-foreground truncate select-all font-mono' dir='ltr'>
              {scannerUrl}
            </code>
            <Button
              type='button'
              size='icon'
              variant='ghost'
              className='size-7 shrink-0 rounded-lg'
              onClick={handleCopy}
              title='نسخ الرابط'
            >
              {copied ? (
                <Check className='size-3.5 text-emerald-500' />
              ) : (
                <Copy className='size-3.5' />
              )}
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='w-full min-w-0 flex items-center gap-2 pt-1'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={handleDownloadQr}
            className='flex-1 min-w-0 h-10 rounded-xl text-xs font-semibold gap-1.5 cursor-pointer'
          >
            <Download className='size-3.5 shrink-0' />
            <span className='truncate'>تحميل QR</span>
          </Button>
          <Button
            asChild
            size='sm'
            className='flex-[1.4] min-w-0 h-10 rounded-xl text-xs font-bold gap-1.5'
          >
            <a href={scannerPath} target='_blank' rel='noreferrer' className='min-w-0'>
              <ExternalLink className='size-3.5 shrink-0' />
              <span className='truncate'>فتح سكانر {merchant.name}</span>
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
