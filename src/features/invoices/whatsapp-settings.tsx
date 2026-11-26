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
  ShieldCheck,
  FileText,
  Wifi,
} from 'lucide-react'
import { toast } from 'sonner'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { LanguageSwitch } from '@/components/language-switch'
import { PosShortcutButton } from '@/components/pos-shortcut-button'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useSaaSStore } from '@/lib/saas-store'
import { useLang } from '@/lib/i18n'
import { api } from '@/lib/api-client'
import type { WhatsAppStatusSnapshot } from '@/components/whatsapp-connect-modal'

export function InvoiceWhatsAppSettings() {
  const { dir, t } = useLang()
  const { currentUser, merchants } = useSaaSStore()
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN'

  const [selectedMerchantId, setSelectedMerchantId] = React.useState<string>(
    currentUser.merchantId || merchants[0]?.id || ''
  )

  React.useEffect(() => {
    if (!selectedMerchantId && merchants.length > 0) {
      setSelectedMerchantId(currentUser.merchantId || merchants[0].id)
    }
  }, [selectedMerchantId, merchants, currentUser.merchantId])

  const activeMerchantId = isSuperAdmin
    ? selectedMerchantId || merchants[0]?.id || ''
    : currentUser.merchantId || merchants[0]?.id || ''
  const activeMerchant = merchants.find((m) => m.id === activeMerchantId) || merchants[0]

  const [snapshot, setSnapshot] = React.useState<WhatsAppStatusSnapshot>({
    status: 'disconnected',
    qrDataUrl: null,
    phoneNumber: null,
    name: null,
    lastError: null,
  })
  const [isBusy, setIsBusy] = React.useState(false)
  const [testPhone, setTestPhone] = React.useState('')
  const [testMessage, setTestMessage] = React.useState('')
  const [isSendingTest, setIsSendingTest] = React.useState(false)
  const prevStatusRef = React.useRef<WhatsAppStatusSnapshot['status'] | null>(null)
  const isArRef = React.useRef(dir === 'rtl')
  isArRef.current = dir === 'rtl'

  const refreshStatus = React.useCallback(async () => {
    if (!activeMerchantId) return
    try {
      const data = await api.whatsapp.getStatus(activeMerchantId)
      setSnapshot(data)
      // Only fire connected toast when actively transitioning from pairing ('qr' / 'connecting') -> 'connected'
      if (
        (prevStatusRef.current === 'qr' || prevStatusRef.current === 'connecting') &&
        data.status === 'connected'
      ) {
        toast.success(
          isArRef.current
            ? `تم ربط واتساب بنجاح (${data.phoneNumber ? `+${data.phoneNumber}` : ''})`
            : `WhatsApp connected (${data.phoneNumber ? `+${data.phoneNumber}` : ''})`
        )
      }
      prevStatusRef.current = data.status
    } catch {
      // ignore transient errors
    }
  }, [activeMerchantId])

  React.useEffect(() => {
    prevStatusRef.current = null
    refreshStatus()
    const timer = setInterval(refreshStatus, 3000)
    return () => clearInterval(timer)
  }, [activeMerchantId, refreshStatus])

  const handleConnect = async () => {
    if (!activeMerchantId) return
    setIsBusy(true)
    try {
      const data = await api.whatsapp.connect(activeMerchantId)
      setSnapshot(data)
    } catch (err: any) {
      toast.error(err?.message || t('فشل بدء الاتصال بواتساب', 'Failed to start WhatsApp connection'))
    } finally {
      setIsBusy(false)
    }
  }

  const handleDisconnect = async () => {
    if (!activeMerchantId) return
    setIsBusy(true)
    try {
      await api.whatsapp.disconnect(activeMerchantId)
      setSnapshot({
        status: 'disconnected',
        qrDataUrl: null,
        phoneNumber: null,
        name: null,
        lastError: null,
      })
      prevStatusRef.current = 'disconnected'
      toast.info(t('تم فصل اتصال واتساب', 'WhatsApp disconnected'))
    } catch (err: any) {
      toast.error(err?.message || t('تعذر فصل الاتصال', 'Failed to disconnect'))
    } finally {
      setIsBusy(false)
    }
  }

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testPhone.trim() || !activeMerchantId) return
    setIsSendingTest(true)
    try {
      const msg =
        testMessage.trim() ||
        t(
          `رسالة تجريبية من نظام ${activeMerchant?.name || 'Green Scan'} ✓\nإرسال الفواتير PDF عبر واتساب يعمل بنجاح!`,
          `Test message from ${activeMerchant?.name || 'Green Scan'} ✓\nDirect WhatsApp PDF invoicing is active!`
        )
      const res = await api.whatsapp.send({
        merchantId: activeMerchantId,
        phone: testPhone.trim(),
        message: msg,
      })
      toast.success(
        t(
          `تم إرسال الرسالة التجريبية بنجاح إلى +${res.to} ✓`,
          `Test message delivered to +${res.to} ✓`
        )
      )
      setTestPhone('')
      setTestMessage('')
    } catch (err: any) {
      toast.error(err?.message || t('فشل إرسال الرسالة التجريبية', 'Failed to send test message'))
    } finally {
      setIsSendingTest(false)
    }
  }

  const isConnected = snapshot.status === 'connected'

  return (
    <>
      <Header fixed>
        <div className='ms-auto flex items-center gap-2'>
          <PosShortcutButton />
          <LanguageSwitch />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-5 p-4 sm:p-6' dir={dir}>
        {/* Top Heading + Merchant Switcher */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <div className='flex items-center gap-2.5 flex-wrap'>
              <h1 className='text-2xl font-bold tracking-tight text-foreground'>
                {t('إعدادات واتساب الفواتير', 'WhatsApp Receipts')}
              </h1>
              <Badge
                variant='outline'
                className={
                  isConnected
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-[#3EEA85] border-emerald-500/30 font-bold text-xs gap-1.5'
                    : 'bg-muted text-muted-foreground font-semibold text-xs'
                }
              >
                <span
                  className={`size-2 rounded-full ${
                    isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/50'
                  }`}
                />
                {isConnected
                  ? t('متصل وجاهز', 'Connected')
                  : snapshot.status === 'qr'
                    ? t('بانتظار مسح QR', 'Awaiting QR Scan')
                    : snapshot.status === 'connecting'
                      ? t('جاري الاتصال...', 'Connecting...')
                      : t('غير مربوط', 'Disconnected')}
              </Badge>
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              {t(
                'اربط رقم واتساب المتجر مرة واحدة بمسح كود الـ QR لإرسال فواتير الـ PDF مباشرة للعملاء من نقطة البيع بدون فتح واتساب ويب.',
                'Link your store WhatsApp once via QR code to send styled PDF receipts directly from POS without opening WhatsApp Web.'
              )}
            </p>
          </div>

          {isSuperAdmin && merchants.length > 0 && (
            <div className='flex items-center gap-2 shrink-0'>
              <span className='text-xs font-semibold text-muted-foreground'>
                {t('المتجر:', 'Store:')}
              </span>
              <select
                value={activeMerchantId}
                onChange={(e) => setSelectedMerchantId(e.target.value)}
                className='h-9 rounded-lg border border-border/80 bg-card px-3 text-xs font-bold text-foreground shadow-2xs'
              >
                {merchants.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 3 Compact Feature Highlight Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
          <Card className='p-4 rounded-xl border-border/80 bg-card shadow-2xs flex items-center gap-3'>
            <div className='size-9 rounded-xl bg-muted border border-border/70 flex items-center justify-center shrink-0'>
              <Wifi className='size-4 text-foreground' />
            </div>
            <div className='min-w-0'>
              <p className='text-xs font-bold text-foreground'>
                {t('جلسة دائمة محفوظة', 'Persistent Session')}
              </p>
              <p className='text-[11px] text-muted-foreground truncate'>
                {t('ربط مرة واحدة ويبقى متصلاً تلقائياً', 'Pair once and stay connected')}
              </p>
            </div>
          </Card>

          <Card className='p-4 rounded-xl border-border/80 bg-card shadow-2xs flex items-center gap-3'>
            <div className='size-9 rounded-xl bg-muted border border-border/70 flex items-center justify-center shrink-0'>
              <FileText className='size-4 text-foreground' />
            </div>
            <div className='min-w-0'>
              <p className='text-xs font-bold text-foreground'>
                {t('إرسال PDF بنفس التصميم', 'Styled PDF Receipts')}
              </p>
              <p className='text-[11px] text-muted-foreground truncate'>
                {t('يطابق تصميم فاتورة متجرك 100%', 'Matches your Invoice Designer 1:1')}
              </p>
            </div>
          </Card>

          <Card className='p-4 rounded-xl border-border/80 bg-card shadow-2xs flex items-center gap-3'>
            <div className='size-9 rounded-xl bg-muted border border-border/70 flex items-center justify-center shrink-0'>
              <ShieldCheck className='size-4 text-foreground' />
            </div>
            <div className='min-w-0'>
              <p className='text-xs font-bold text-foreground'>
                {t('معزول عن الكاشير', 'Cashier-Safe')}
              </p>
              <p className='text-[11px] text-muted-foreground truncate'>
                {t('الكاشير يرسل فقط بدون وصول للجلسة', 'Cashiers send without session access')}
              </p>
            </div>
          </Card>
        </div>

        {/* Main 2-Column Workspace */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-5 items-start'>
          {/* Primary Card: Connection & QR Pairing (7 cols) */}
          <Card className='lg:col-span-7 p-6 rounded-2xl border-border/80 bg-card shadow-xs space-y-5'>
            <div className='flex items-center justify-between gap-3 pb-4 border-b border-border/70'>
              <div className='flex items-center gap-3'>
                <div className='size-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0'>
                  <QrCode className='size-5' />
                </div>
                <div>
                  <h2 className='font-bold text-sm text-foreground'>
                    {t('حالة اتصال واتساب المتجر', 'Store WhatsApp Connection')}
                  </h2>
                  <p className='text-[11px] text-muted-foreground'>
                    {t('الجلسة المخصصة لـ', 'Dedicated session for')}{' '}
                    <span className='font-bold text-foreground'>{activeMerchant?.name || '—'}</span>
                  </p>
                </div>
              </div>

              {isConnected && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  disabled={isBusy}
                  onClick={handleDisconnect}
                  className='h-8 gap-1.5 text-xs font-semibold cursor-pointer'
                >
                  {isBusy ? <Loader2 className='size-3.5 animate-spin' /> : <Unplug className='size-3.5' />}
                  <span>{t('فصل الاتصال', 'Disconnect')}</span>
                </Button>
              )}
            </div>

            {isConnected ? (
              <div className='space-y-4'>
                <div className='rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5 flex items-center gap-4'>
                  <div className='size-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-[#3EEA85] flex items-center justify-center shrink-0'>
                    <CheckCircle2 className='size-6' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='font-bold text-sm text-foreground'>
                      {t('واتساب المتجر متصل ويعمل الآن', 'Store WhatsApp is Connected & Live')}
                    </p>
                    <p
                      className='text-xs font-mono text-muted-foreground mt-1 truncate'
                      dir='ltr'
                    >
                      {snapshot.phoneNumber ? `+${snapshot.phoneNumber}` : ''}
                      {snapshot.name ? ` • ${snapshot.name}` : ''}
                    </p>
                  </div>
                </div>

                <div className='rounded-xl border border-border/70 bg-muted/30 p-4 text-xs text-muted-foreground space-y-1.5 leading-relaxed'>
                  <p className='font-bold text-foreground'>
                    {t('كيف يتم إرسال الفواتير من الـ POS؟', 'How POS receipt delivery works:')}
                  </p>
                  <p>
                    {t(
                      'عند إتمام أي عملية بيع في شاشة الكاشير، يدخل الكاشير رقم هاتف العميل ويضغط «إرسال PDF» — يصل ملف الفاتورة المصمم للعميل فوراً على واتساب.',
                      'After completing any sale in POS, the cashier enters the customer phone number and clicks "Send PDF" — the styled receipt PDF is delivered immediately.'
                    )}
                  </p>
                </div>
              </div>
            ) : snapshot.status === 'qr' && snapshot.qrDataUrl ? (
              <div className='flex flex-col items-center text-center gap-4 py-2'>
                <div className='p-3.5 bg-white rounded-2xl border border-border shadow-md'>
                  <img
                    src={snapshot.qrDataUrl}
                    alt='WhatsApp QR Code'
                    className='size-56 rounded-lg'
                  />
                </div>
                <div className='space-y-1 max-w-sm'>
                  <p className='text-xs font-bold flex items-center justify-center gap-1.5 text-foreground'>
                    <Smartphone className='size-4' />
                    <span>
                      {t(
                        'افتح واتساب ← الأجهزة المرتبطة ← ربط جهاز',
                        'Open WhatsApp → Linked Devices → Link a Device'
                      )}
                    </span>
                  </p>
                  <p className='text-[11px] text-muted-foreground'>
                    {t(
                      'امسح الكود من هاتف المتجر وسيتم حفظ الاتصال تلقائياً.',
                      'Scan the QR code with your store phone to link permanently.'
                    )}
                  </p>
                </div>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  disabled={isBusy}
                  onClick={handleConnect}
                  className='gap-1.5 h-8 text-xs cursor-pointer'
                >
                  <RefreshCw className='size-3.5' />
                  <span>{t('تحديث الكود', 'Refresh QR')}</span>
                </Button>
              </div>
            ) : snapshot.status === 'connecting' ? (
              <div className='py-14 flex flex-col items-center gap-3 text-center'>
                <Loader2 className='size-9 animate-spin text-foreground' />
                <p className='text-xs font-semibold text-muted-foreground'>
                  {t('جاري الاتصال وتجهيز كود الـ QR...', 'Connecting & generating QR code...')}
                </p>
              </div>
            ) : (
              <div className='py-10 flex flex-col items-center gap-4 text-center'>
                <div className='size-14 rounded-2xl bg-muted border border-border/70 flex items-center justify-center'>
                  <MessageCircle className='size-7 text-foreground' />
                </div>
                <div className='space-y-1 max-w-xs'>
                  <h3 className='font-bold text-sm text-foreground'>
                    {t('لم يتم ربط واتساب المتجر بعد', 'Store WhatsApp Not Linked Yet')}
                  </h3>
                  <p className='text-xs text-muted-foreground'>
                    {t(
                      'اضغط الزر بالأسفل لإظهار كود الـ QR وربط رقم واتساب المتجر في ثوانٍ.',
                      'Click below to generate a QR code and pair your store WhatsApp number.'
                    )}
                  </p>
                </div>
                {snapshot.lastError && (
                  <p className='text-xs text-destructive bg-destructive/10 px-3 py-1.5 rounded-lg'>
                    {snapshot.lastError}
                  </p>
                )}
                <Button
                  type='button'
                  size='sm'
                  disabled={isBusy}
                  onClick={handleConnect}
                  className='h-10 px-5 gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold cursor-pointer'
                >
                  {isBusy ? <Loader2 className='size-4 animate-spin' /> : <QrCode className='size-4' />}
                  <span>{t('إظهار QR وربط واتساب', 'Generate QR & Connect')}</span>
                </Button>
              </div>
            )}
          </Card>

          {/* Secondary Card: Live Test Send (5 cols) */}
          <Card className='lg:col-span-5 p-6 rounded-2xl border-border/80 bg-card shadow-xs space-y-4'>
            <div className='pb-3.5 border-b border-border/70'>
              <h2 className='font-bold text-sm flex items-center gap-2 text-foreground'>
                <Send className='size-4' />
                <span>{t('تجربة الإرسال المباشر', 'Send Test Message')}</span>
              </h2>
              <p className='text-[11px] text-muted-foreground mt-0.5'>
                {t(
                  'اختبر وصول الرسائل مباشرة لأي رقم واتساب للتأكد من جاهزية الربط.',
                  'Verify direct message delivery to any WhatsApp number.'
                )}
              </p>
            </div>

            <form onSubmit={handleSendTest} className='space-y-3.5 text-xs'>
              <div className='space-y-1.5'>
                <label className='font-bold text-foreground block'>
                  {t('رقم واتساب العميل *', 'Recipient WhatsApp Number *')}
                </label>
                <Input
                  type='tel'
                  dir='ltr'
                  required
                  disabled={!isConnected}
                  placeholder='010XXXXXXXX'
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className='h-9 font-mono text-xs rounded-lg'
                />
              </div>

              <div className='space-y-1.5'>
                <label className='font-bold text-foreground block'>
                  {t('نص الرسالة (اختياري)', 'Message (Optional)')}
                </label>
                <Textarea
                  rows={3}
                  disabled={!isConnected}
                  placeholder={t(
                    'اتركه فارغاً لإرسال رسالة تجريبية جاهزة...',
                    'Leave empty to send a ready test message...'
                  )}
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className='text-xs rounded-lg'
                />
              </div>

              <Button
                type='submit'
                size='sm'
                disabled={!isConnected || !testPhone.trim() || isSendingTest}
                className='w-full h-9 rounded-lg gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold cursor-pointer'
              >
                {isSendingTest ? (
                  <Loader2 className='size-3.5 animate-spin' />
                ) : (
                  <Send className='size-3.5' />
                )}
                <span>
                  {isSendingTest
                    ? t('جاري الإرسال...', 'Sending...')
                    : t('إرسال رسالة تجريبية', 'Send Test Message')}
                </span>
              </Button>
            </form>
          </Card>
        </div>
      </Main>
    </>
  )
}
