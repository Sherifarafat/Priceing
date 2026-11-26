import * as React from 'react'
import {
  MessageCircle,
  QrCode,
  CheckCircle2,
  Loader2,
  Unplug,
  RefreshCw,
  Send,
  Smartphone,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDirection } from '@/context/direction-provider'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'

export type WhatsAppConnectionStatus = 'disconnected' | 'connecting' | 'qr' | 'connected'

export interface WhatsAppStatusSnapshot {
  status: WhatsAppConnectionStatus
  qrDataUrl: string | null
  phoneNumber: string | null
  name: string | null
  lastError: string | null
}

interface WhatsAppConnectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  merchantId?: string
  merchantName?: string
  onStatusChange?: (snapshot: WhatsAppStatusSnapshot) => void
}

export function WhatsAppConnectModal({
  open,
  onOpenChange,
  merchantId,
  merchantName,
  onStatusChange,
}: WhatsAppConnectModalProps) {
  const { dir } = useDirection()
  const isAr = dir === 'rtl'

  const [snapshot, setSnapshot] = React.useState<WhatsAppStatusSnapshot>({
    status: 'disconnected',
    qrDataUrl: null,
    phoneNumber: null,
    name: null,
    lastError: null,
  })
  const [isBusy, setIsBusy] = React.useState(false)
  const [testPhone, setTestPhone] = React.useState('')
  const [isSendingTest, setIsSendingTest] = React.useState(false)
  const prevStatusRef = React.useRef<WhatsAppConnectionStatus>('disconnected')

  const refreshStatus = React.useCallback(async () => {
    try {
      const data = await api.whatsapp.getStatus(merchantId)
      setSnapshot(data)
      onStatusChange?.(data)
      if (prevStatusRef.current !== 'connected' && data.status === 'connected') {
        toast.success(
          isAr
            ? `تم ربط واتساب بنجاح (${data.phoneNumber || ''})`
            : `WhatsApp connected (${data.phoneNumber || ''})`
        )
      }
      prevStatusRef.current = data.status
    } catch {
      // ignore transient network errors
    }
  }, [merchantId, onStatusChange, isAr])

  React.useEffect(() => {
    if (!open) return
    refreshStatus()
    const timer = setInterval(refreshStatus, 2000)
    return () => clearInterval(timer)
  }, [open, refreshStatus])

  const handleConnect = async () => {
    setIsBusy(true)
    try {
      const data = await api.whatsapp.connect(merchantId)
      setSnapshot(data)
      onStatusChange?.(data)
    } catch (err: any) {
      toast.error(err?.message || (isAr ? 'فشل بدء الاتصال بواتساب' : 'Failed to start WhatsApp'))
    } finally {
      setIsBusy(false)
    }
  }

  const handleDisconnect = async () => {
    setIsBusy(true)
    try {
      await api.whatsapp.disconnect(merchantId)
      const next: WhatsAppStatusSnapshot = {
        status: 'disconnected',
        qrDataUrl: null,
        phoneNumber: null,
        name: null,
        lastError: null,
      }
      setSnapshot(next)
      onStatusChange?.(next)
      prevStatusRef.current = 'disconnected'
      toast.info(isAr ? 'تم فصل اتصال واتساب' : 'WhatsApp disconnected')
    } catch (err: any) {
      toast.error(err?.message || (isAr ? 'تعذر فصل الاتصال' : 'Failed to disconnect'))
    } finally {
      setIsBusy(false)
    }
  }

  const handleSendTest = async () => {
    if (!testPhone.trim()) return
    setIsSendingTest(true)
    try {
      await api.whatsapp.send({
        merchantId,
        phone: testPhone.trim(),
        message: isAr
          ? `رسالة تجريبية من نظام ${merchantName || 'Green Scan POS'} ✓\nالربط المباشر بواتساب يعمل بنجاح!`
          : `Test message from ${merchantName || 'Green Scan POS'} ✓\nDirect WhatsApp integration is working!`,
      })
      toast.success(isAr ? 'تم إرسال الرسالة التجريبية بنجاح ✓' : 'Test message sent ✓')
      setTestPhone('')
    } catch (err: any) {
      toast.error(err?.message || (isAr ? 'فشل إرسال الرسالة' : 'Failed to send message'))
    } finally {
      setIsSendingTest(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir={dir}
        className='sm:max-w-md rounded-[22px] p-6 bg-white dark:bg-[#121513] border border-[#e8ece8] dark:border-neutral-800 text-[#101410] dark:text-neutral-100'
      >
        <DialogHeader className='text-start'>
          <DialogTitle className='flex items-center gap-2.5 text-base font-black'>
            <div className='size-9 rounded-xl bg-[#101410] dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0'>
              <MessageCircle className='size-4' />
            </div>
            <span>{isAr ? 'ربط واتساب المتجر (إرسال مباشر)' : 'Store WhatsApp Direct Link'}</span>
          </DialogTitle>
          <DialogDescription className='text-xs text-start text-[#7a827b] dark:text-neutral-400'>
            {isAr
              ? 'اربط رقم واتساب المتجر مرة واحدة بمسح الـ QR، وبعدها هيبعت الفواتير للعملاء تلقائياً من داخل السيستم بدون فتح واتساب ويب.'
              : 'Link your store WhatsApp once via QR code to send receipts directly from the system without opening WhatsApp Web.'}
          </DialogDescription>
        </DialogHeader>

        <div className='my-3 flex flex-col items-center justify-center space-y-4'>
          {snapshot.status === 'connected' ? (
            <div className='w-full space-y-4'>
              <div className='rounded-2xl border border-[#e8ece8] dark:border-neutral-800 bg-[#fafbfa] dark:bg-[#171b18] p-4 flex items-center justify-between gap-3'>
                <div className='flex items-center gap-3 min-w-0'>
                  <div className='size-11 rounded-full bg-[#00d632] text-[#061006] flex items-center justify-center shrink-0'>
                    <CheckCircle2 className='size-6' />
                  </div>
                  <div className='min-w-0'>
                    <p className='text-sm font-black text-[#101410] dark:text-white truncate'>
                      {isAr ? 'متصل وجاهز للإرسال المباشر' : 'Connected & Ready'}
                    </p>
                    <p className='text-xs font-mono text-[#7a827b] dark:text-neutral-400 truncate' dir='ltr'>
                      {snapshot.phoneNumber ? `+${snapshot.phoneNumber}` : ''}
                      {snapshot.name ? ` • ${snapshot.name}` : ''}
                    </p>
                  </div>
                </div>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  disabled={isBusy}
                  onClick={handleDisconnect}
                  className='h-8 px-2.5 text-xs gap-1 rounded-xl border-[#e8ece8] dark:border-neutral-700 cursor-pointer shrink-0'
                >
                  <Unplug className='size-3.5' />
                  <span>{isAr ? 'فصل' : 'Disconnect'}</span>
                </Button>
              </div>

              {/* Optional Quick Test Message */}
              <div className='rounded-2xl border border-[#e8ece8] dark:border-neutral-800 bg-[#fafbfa] dark:bg-[#171b18] p-3.5 space-y-2'>
                <label className='text-xs font-bold block'>
                  {isAr ? 'تجربة إرسال رسالة سريعة:' : 'Send a quick test message:'}
                </label>
                <div className='flex items-center gap-2'>
                  <Input
                    type='tel'
                    dir='ltr'
                    placeholder='010XXXXXXXX'
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleSendTest()
                      }
                    }}
                    className='h-9 text-xs font-mono bg-white dark:bg-[#121513] border-[#e8ece8] dark:border-neutral-800 rounded-xl'
                  />
                  <Button
                    type='button'
                    size='sm'
                    disabled={!testPhone.trim() || isSendingTest}
                    onClick={handleSendTest}
                    className='h-9 px-3 rounded-xl bg-[#101410] dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-neutral-200 text-xs font-bold gap-1.5 cursor-pointer shrink-0'
                  >
                    {isSendingTest ? (
                      <Loader2 className='size-3.5 animate-spin' />
                    ) : (
                      <Send className='size-3.5' />
                    )}
                    <span>{isAr ? 'تجربة' : 'Test'}</span>
                  </Button>
                </div>
              </div>
            </div>
          ) : snapshot.status === 'qr' && snapshot.qrDataUrl ? (
            <div className='w-full flex flex-col items-center space-y-3'>
              <div className='p-3 bg-white rounded-2xl border-2 border-[#101410] dark:border-neutral-700 shadow-md'>
                <img
                  src={snapshot.qrDataUrl}
                  alt='WhatsApp Link QR'
                  className='size-56 rounded-lg'
                />
              </div>
              <div className='text-center space-y-1 max-w-xs'>
                <p className='text-xs font-bold flex items-center justify-center gap-1.5'>
                  <Smartphone className='size-3.5' />
                  <span>
                    {isAr
                      ? 'افتح واتساب على موبايلك ← الأجهزة المرتبطة ← ربط جهاز'
                      : 'Open WhatsApp on phone → Linked Devices → Link a Device'}
                  </span>
                </p>
                <p className='text-[11px] text-[#7a827b] dark:text-neutral-400'>
                  {isAr
                    ? 'امسح الكود أعلاه وسيتم تفعيل الإرسال التلقائي فوراً'
                    : 'Scan the QR above to activate instant direct messaging'}
                </p>
              </div>
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={isBusy}
                onClick={handleConnect}
                className='h-8 text-xs gap-1.5 rounded-xl cursor-pointer'
              >
                <RefreshCw className='size-3.5' />
                <span>{isAr ? 'تحديث الكود' : 'Refresh QR'}</span>
              </Button>
            </div>
          ) : snapshot.status === 'connecting' ? (
            <div className='py-10 flex flex-col items-center gap-3 text-center'>
              <Loader2 className='size-10 animate-spin text-[#101410] dark:text-white' />
              <p className='text-xs font-bold'>
                {isAr ? 'جاري الاتصال بسيرفر واتساب وتجهيز الـ QR...' : 'Connecting to WhatsApp & generating QR...'}
              </p>
            </div>
          ) : (
            <div className='w-full py-4 flex flex-col items-center gap-4 text-center'>
              <div className='size-16 rounded-2xl bg-[#f2f5f2] dark:bg-[#1c211d] flex items-center justify-center'>
                <QrCode className='size-8 text-[#101410] dark:text-white' />
              </div>
              <div className='space-y-1 max-w-xs'>
                <p className='text-sm font-black'>
                  {isAr ? 'واتساب غير مربوط حالياً' : 'WhatsApp Not Connected'}
                </p>
                <p className='text-xs text-[#7a827b] dark:text-neutral-400'>
                  {isAr
                    ? 'اضغط الزر بالأسفل لإظهار كود الـ QR وربط رقم واتساب المتجر مرة واحدة فقط.'
                    : 'Click below to generate a QR code and link your store WhatsApp once.'}
                </p>
              </div>
              {snapshot.lastError && (
                <p className='text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 rounded-lg'>
                  {snapshot.lastError}
                </p>
              )}
              <Button
                type='button'
                disabled={isBusy}
                onClick={handleConnect}
                className='h-11 px-6 rounded-xl bg-[#101410] dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-neutral-200 font-black text-xs gap-2 cursor-pointer'
              >
                {isBusy ? <Loader2 className='size-4 animate-spin' /> : <QrCode className='size-4' />}
                <span>{isAr ? 'إظهار QR وربط واتساب الآن' : 'Show QR & Connect WhatsApp'}</span>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
