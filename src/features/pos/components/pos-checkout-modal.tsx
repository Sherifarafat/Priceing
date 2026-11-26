import * as React from 'react'
import {
  Banknote,
  CreditCard,
  QrCode,
  CheckCircle2,
  Printer,
  RotateCcw,
  Zap,
  ExternalLink,
  Copy,
  Check,
  MessageCircle,
  Send,
  Loader2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CustomizedInvoiceView } from '@/features/invoices/components/customized-invoice-view'
import { useDirection } from '@/context/direction-provider'
import { api } from '@/lib/api-client'
import { generateInvoicePdfBase64 } from '@/lib/invoice-pdf'
import { preparePaymentVoice, speakPaymentSuccess } from '@/lib/voice-alert'
import type { Merchant, Branch, User, Invoice, InvoiceTemplate } from '@/types/saas'
import type { POSCartItem, PaymentMethod } from '../types'
import { toast } from 'sonner'

interface PosCheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  merchant: Merchant
  branch: Branch | null
  cashier: User
  cartItems: POSCartItem[]
  vatRate?: number
  template?: InvoiceTemplate | null
  onCompleteSale: (paymentMethod: PaymentMethod, amountPaid: number) => Promise<Invoice | null>
  onNewOrder: () => void
}

// ── Instapay Overlay States
type InstapayStep = 'idle' | 'animating' | 'qr' | 'success'

export function PosCheckoutModal({
  isOpen,
  onClose,
  merchant,
  branch,
  cashier,
  cartItems,
  vatRate = 0.14,
  template,
  onCompleteSale,
  onNewOrder,
}: PosCheckoutModalProps) {
  const { dir } = useDirection()
  const isAr = dir === 'rtl'
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('CASH')
  const [tenderedAmount, setTenderedAmount] = React.useState<string>('')
  const [isProcessing, setIsProcessing] = React.useState<boolean>(false)
  const [completedInvoice, setCompletedInvoice] = React.useState<Invoice | null>(null)
  const [instapayStep, setInstapayStep] = React.useState<InstapayStep>('idle')
  const [copiedLink, setCopiedLink] = React.useState<boolean>(false)
  const [customerPhone, setCustomerPhone] = React.useState<string>('')
  const [waStatus, setWaStatus] = React.useState<'disconnected' | 'connecting' | 'qr' | 'connected'>('disconnected')
  const [isSendingWa, setIsSendingWa] = React.useState(false)
  const [waSentTo, setWaSentTo] = React.useState<string | null>(null)

  // Fetch WhatsApp status when modal opens
  React.useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    api.whatsapp
      .getStatus(merchant.id)
      .then((snap) => {
        if (!cancelled) setWaStatus(snap.status)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [isOpen, merchant.id])

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.total, 0)
  const taxAmount = subtotal * vatRate
  const grandTotal = subtotal + taxAmount

  const instapayTimersRef = React.useRef<number[]>([])

  const clearInstapayTimers = React.useCallback(() => {
    instapayTimersRef.current.forEach((id) => window.clearTimeout(id))
    instapayTimersRef.current = []
  }, [])

  React.useEffect(() => {
    return () => clearInstapayTimers()
  }, [clearInstapayTimers])

  // Set default tendered to exact total when modal opens
  React.useEffect(() => {
    if (isOpen) {
      clearInstapayTimers()
      setTenderedAmount(grandTotal.toFixed(2))
      setCompletedInvoice(null)
      setIsProcessing(false)
      setInstapayStep('idle')
      setCustomerPhone('')
      setWaSentTo(null)
    } else {
      clearInstapayTimers()
    }
  }, [isOpen, grandTotal, clearInstapayTimers])

  const numericTendered = parseFloat(tenderedAmount) || 0
  const changeDue = Math.max(0, numericTendered - grandTotal)
  const isTenderSufficient = paymentMethod !== 'CASH' || numericTendered >= grandTotal

  const handleQuickAddCash = (amount: number) => {
    const current = parseFloat(tenderedAmount) || 0
    setTenderedAmount((current + amount).toFixed(2))
  }

  const handleConfirmCheckout = async () => {
    if (!isTenderSufficient || isProcessing) return

    // Instapay: show in-modal flow
    if (paymentMethod === 'INSTAPAY') {
      clearInstapayTimers()
      // Preload & unlock Arabic voice audio inside the user click gesture
      preparePaymentVoice('تم الدفع بنجاح', 'ar')
      setInstapayStep('animating')

      // After 2.5s animation → show QR
      const t1 = window.setTimeout(() => {
        setInstapayStep('qr')

        // After 2.5s QR → success + voice confirmation + generate invoice
        const t2 = window.setTimeout(async () => {
          setInstapayStep('success')
          speakPaymentSuccess('تم الدفع بنجاح', 'ar')

          setIsProcessing(true)
          try {
            const inv = await onCompleteSale('INSTAPAY', grandTotal)
            if (inv) {
              setCompletedInvoice(inv)
            }
          } catch (e) {
            console.error('Invoice creation error:', e)
          } finally {
            setIsProcessing(false)
            const t3 = window.setTimeout(() => {
              setInstapayStep('idle')
            }, 1700)
            instapayTimersRef.current.push(t3)
          }
        }, 2500)
        instapayTimersRef.current.push(t2)
      }, 2500)
      instapayTimersRef.current.push(t1)
      return
    }

    setIsProcessing(true)
    try {
      const inv = await onCompleteSale(paymentMethod, numericTendered)
      if (inv) {
        setCompletedInvoice(inv)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // Dynamic fixed receipt URL scoped to this merchant and branch
  const fixedReceiptUrl = branch
    ? `${window.location.origin}/receipt?merchantId=${merchant.id}&branchId=${branch.id}`
    : `${window.location.origin}/receipt?merchantId=${merchant.id}`

  const formatWhatsAppPhone = (raw: string): string => {
    // Convert Arabic-Indic digits to Western digits and keep digits only
    const ascii = raw
      .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    let digits = ascii.replace(/\D/g, '')
    if (!digits) return ''
    if (digits.startsWith('00')) digits = digits.slice(2)
    // Auto-prefix Egypt country code (+20) for local 01X... or 1X... mobile numbers
    if (digits.length === 11 && digits.startsWith('01')) {
      digits = `2${digits}`
    } else if (digits.length === 10 && digits.startsWith('1')) {
      digits = `20${digits}`
    }
    return digits
  }

  const handleSendWhatsApp = async () => {
    if (!completedInvoice || isSendingWa) return

    if (waStatus !== 'connected') {
      toast.error(
        isAr
          ? 'واتساب المتجر غير مربوط — قم بربطه من الداشبورد ← الفواتير ← ربط واتساب'
          : 'Store WhatsApp is not connected — link it from Dashboard → Invoices → WhatsApp'
      )
      return
    }

    const phone = formatWhatsAppPhone(customerPhone)
    if (!phone || phone.length < 10) {
      toast.error(
        isAr
          ? 'من فضلك أدخل رقم واتساب العميل بشكل صحيح (مثال: 010XXXXXXXX)'
          : 'Please enter a valid customer WhatsApp number'
      )
      return
    }

    const totalFormatted = Number(completedInvoice.grandTotal ?? grandTotal).toFixed(2)
    const caption = isAr
      ? `مرحباً بك في ${merchant.name} 🌿\nشكراً لتسوقك معنا!\n🧾 فاتورة رقم: ${completedInvoice.invoiceNumber}\n💰 الإجمالي: E£ ${totalFormatted}`
      : `Thank you for shopping at ${merchant.name} 🌿\n🧾 Invoice #: ${completedInvoice.invoiceNumber}\n💰 Total: E£ ${totalFormatted}`

    setIsSendingWa(true)
    try {
      const pdfBase64 = await generateInvoicePdfBase64({
        invoice: completedInvoice,
        merchant,
        branch,
        template,
        cashierName: cashier.name,
        lang: isAr ? 'ar' : 'en',
      })

      const res = await api.whatsapp.sendDocument({
        merchantId: merchant.id,
        phone,
        pdfBase64,
        fileName: `${completedInvoice.invoiceNumber || 'invoice'}.pdf`,
        caption,
      })

      setWaSentTo(res.to)
      toast.success(
        isAr
          ? `تم إرسال الفاتورة PDF مباشرة إلى +${res.to} ✓`
          : `Invoice PDF sent directly to +${res.to} ✓`
      )
    } catch (err: any) {
      toast.error(
        err?.message ||
          (isAr ? 'فشل إرسال ملف الفاتورة عبر واتساب' : 'Failed to send invoice PDF via WhatsApp')
      )
    } finally {
      setIsSendingWa(false)
    }
  }

  // ── Instapay Modal Content (Same size as checkout view, project green #00d632)
  const renderInstapayContent = () => {
    return (
      <div className='flex flex-col items-center justify-center py-4 min-h-[380px] text-center select-none'>
        {instapayStep === 'animating' && (
          <div className='flex flex-col items-center gap-5 my-auto animate-fadeIn'>
            <div
              className='relative flex items-center justify-center rounded-full border-4 border-[#061006] bg-black/5 shadow-inner'
              style={{
                width: 170,
                height: 170,
                animation: 'instapayPulse 2.5s ease-in-out infinite',
              }}
            >
              <span className='text-3xl font-black text-[#061006] font-mono'>
                E£ {grandTotal.toFixed(2)}
              </span>
            </div>
            <div className='space-y-1.5'>
              <p className='text-[#061006] font-black text-lg animate-pulse'>
                {isAr ? 'في انتظار إتمام الدفع عبر Instapay...' : 'Waiting for Instapay payment...'}
              </p>
              <p className='text-[#061006]/75 text-xs font-bold'>
                {isAr
                  ? 'يتم التحقق من العملية وتأكيد المعاملة آلياً'
                  : 'Verifying and confirming transaction automatically'}
              </p>
            </div>
          </div>
        )}

        {instapayStep === 'qr' && (
          <div className='flex flex-col items-center gap-3.5 my-auto animate-fadeIn'>
            <p className='text-[#061006] font-black text-base'>
              {isAr ? 'امسح الكود للدفع عبر تطبيق Instapay' : 'Scan QR to pay via Instapay'}
            </p>
            <div className='bg-white p-3 rounded-2xl shadow-md border-2 border-[#061006]'>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=instapay:${grandTotal.toFixed(2)}`}
                alt='Instapay QR'
                className='size-44'
              />
            </div>
            <div className='bg-[#061006] text-white px-5 py-1.5 rounded-full font-mono font-black text-lg shadow-xs' dir='ltr'>
              E£ {grandTotal.toFixed(2)}
            </div>
          </div>
        )}

        {instapayStep === 'success' && (
          <div className='flex flex-col items-center gap-4 my-auto animate-fadeIn'>
            <div
              className='size-24 rounded-full bg-[#061006] text-[#00d632] flex items-center justify-center shadow-lg'
              style={{ animation: 'fadeInScale 0.4s ease-out' }}
            >
              <CheckCircle2 className='size-14 text-[#00d632]' />
            </div>
            <div className='space-y-1'>
              <p className='text-[#061006] font-black text-2xl'>
                {isAr ? 'تم استلام الدفع بنجاح!' : 'Payment Received!'}
              </p>
              <p className='text-[#061006] font-black text-lg font-mono' dir='ltr'>
                E£ {grandTotal.toFixed(2)}
              </p>
            </div>
            <p className='text-[#061006]/80 text-xs font-bold'>
              {isAr ? 'جاري تجهيز الفاتورة والإيصال...' : 'Preparing invoice & receipt...'}
            </p>
          </div>
        )}

        {instapayStep !== 'success' && (
          <button
            type='button'
            onClick={() => {
              clearInstapayTimers()
              setInstapayStep('idle')
              setIsProcessing(false)
            }}
            className='mt-3 text-xs font-bold text-[#061006]/75 hover:text-[#061006] hover:underline cursor-pointer'
          >
            {isAr ? 'إلغاء والعودة للدفع' : 'Cancel & Back to Payment'}
          </button>
        )}

        <style>{`
          @keyframes instapayPulse {
            0%   { transform: scale(0.94); opacity: 0.85; }
            50%  { transform: scale(1.04); opacity: 1; }
            100% { transform: scale(0.94); opacity: 0.85; }
          }
          @keyframes fadeInScale {
            0%   { transform: scale(0.4); opacity: 0; }
            100% { transform: scale(1);   opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && !completedInvoice && onClose()}>
        <DialogContent
          dir={dir}
          className={`rounded-[22px] shadow-2xl transition-all duration-300 w-full overflow-hidden ${
            completedInvoice
              ? 'sm:max-w-[700px] max-h-[88vh] p-4 flex flex-col bg-white dark:bg-[#1E1F20] border border-[#e8ece8] dark:border-neutral-800 text-[#101410] dark:text-neutral-100'
              : instapayStep !== 'idle'
              ? 'p-6 sm:max-w-lg bg-[#00d632] border-none text-[#061006]'
              : 'p-6 sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1E1F20] border border-[#e8ece8] dark:border-neutral-800 text-[#101410] dark:text-neutral-100'
          }`}
        >
          {instapayStep !== 'idle' ? (
            renderInstapayContent()
          ) : !completedInvoice ? (
            <>
              <DialogHeader className='text-start'>
                <DialogTitle className='text-lg font-black flex items-center justify-between text-[#101410] dark:text-white'>
                  <span>{isAr ? 'إتمام عملية الدفع' : 'Complete Payment'}</span>
                  <span className='font-mono text-xl text-[#101410] dark:text-white font-black' dir='ltr'>
                    E£ {grandTotal.toFixed(2)}
                  </span>
                </DialogTitle>
              </DialogHeader>

              <div className='space-y-5 my-4 text-xs'>
                {/* Payment Methods */}
                <div>
                  <label className='text-[#7a827b] dark:text-neutral-400 block mb-2 font-bold uppercase tracking-wider text-[11px]'>
                    {isAr ? 'طريقة الدفع:' : 'Payment Method:'}
                  </label>
                  <div className='grid grid-cols-4 gap-2.5'>
                    <button
                      type='button'
                      onClick={() => setPaymentMethod('CASH')}
                      className={`p-3 rounded-[10px] border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                        paymentMethod === 'CASH'
                          ? 'border-2 border-[#00d632] dark:border-white bg-[#f2fff4] dark:bg-white/10 text-[#16782a] dark:text-white font-extrabold shadow-xs'
                          : 'border border-[#e8ece8] dark:border-neutral-800 bg-white dark:bg-[#242628] text-[#606a61] dark:text-neutral-300 hover:border-[#00d632]/50 dark:hover:border-neutral-600'
                      }`}
                    >
                      <Banknote className='size-5' />
                      <span>{isAr ? 'نقداً' : 'Cash'}</span>
                    </button>

                    <button
                      type='button'
                      onClick={() => setPaymentMethod('CARD')}
                      className={`p-3 rounded-[10px] border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                        paymentMethod === 'CARD'
                          ? 'border-2 border-[#00d632] dark:border-white bg-[#f2fff4] dark:bg-white/10 text-[#16782a] dark:text-white font-extrabold shadow-xs'
                          : 'border border-[#e8ece8] dark:border-neutral-800 bg-white dark:bg-[#242628] text-[#606a61] dark:text-neutral-300 hover:border-[#00d632]/50 dark:hover:border-neutral-600'
                      }`}
                    >
                      <CreditCard className='size-5' />
                      <span>{isAr ? 'بطاقة' : 'Card'}</span>
                    </button>

                    <button
                      type='button'
                      onClick={() => setPaymentMethod('QR')}
                      className={`p-3 rounded-[10px] border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                        paymentMethod === 'QR'
                          ? 'border-2 border-[#00d632] dark:border-white bg-[#f2fff4] dark:bg-white/10 text-[#16782a] dark:text-white font-extrabold shadow-xs'
                          : 'border border-[#e8ece8] dark:border-neutral-800 bg-white dark:bg-[#242628] text-[#606a61] dark:text-neutral-300 hover:border-[#00d632]/50 dark:hover:border-neutral-600'
                      }`}
                    >
                      <QrCode className='size-5' />
                      <span>QR</span>
                    </button>

                    <button
                      type='button'
                      onClick={() => setPaymentMethod('INSTAPAY')}
                      className={`p-3 rounded-[10px] border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                        paymentMethod === 'INSTAPAY'
                          ? 'border-2 border-[#00d632] dark:border-white bg-[#00d632] dark:bg-white text-[#061006] dark:text-black font-black shadow-xs'
                          : 'border border-[#e8ece8] dark:border-neutral-800 bg-white dark:bg-[#242628] text-[#606a61] dark:text-neutral-300 hover:border-[#00d632]/50 dark:hover:border-neutral-600'
                      }`}
                    >
                      <Zap className='size-5' />
                      <span>Instapay</span>
                    </button>
                  </div>
                </div>

                {/* Cash Tender Calculation */}
                {paymentMethod === 'CASH' && (
                  <div className='space-y-3 bg-[#fafbfa] dark:bg-[#242628] border border-[#e8ece8] dark:border-neutral-800 p-4 rounded-[14px]'>
                    <div className='flex items-center justify-between'>
                      <label className='font-bold text-[#101410] dark:text-neutral-100'>
                        {isAr ? 'المبلغ المستلم من العميل:' : 'Amount Received:'}
                      </label>
                      <button
                        type='button'
                        onClick={() => setTenderedAmount(grandTotal.toFixed(2))}
                        className='h-6 text-[11px] text-[#16782a] dark:text-neutral-200 hover:bg-[#e8f9ec] dark:hover:bg-neutral-800 px-2 rounded-md font-extrabold cursor-pointer transition-colors'
                      >
                        {isAr ? 'المبلغ بالضبط' : 'Exact Amount'}
                      </button>
                    </div>

                    <div className='relative'>
                      <span className='absolute start-3 top-1/2 -translate-y-1/2 font-mono text-sm text-[#7a827b] dark:text-neutral-400 font-bold'>
                        E£
                      </span>
                      <Input
                        type='number'
                        step='any'
                        value={tenderedAmount}
                        onChange={(e) => setTenderedAmount(e.target.value)}
                        className='ps-10 h-12 text-lg font-mono font-black rounded-[10px] bg-white dark:bg-[#1E1F20] border-[#e8ece8] dark:border-neutral-800 text-[#101410] dark:text-white focus-visible:border-[#00d632] dark:focus-visible:border-neutral-400 shadow-2xs'
                      />
                    </div>

                    {/* Fast Add Cash Buttons */}
                    <div className='flex items-center gap-2'>
                      {[50, 100, 200, 500].map((val) => (
                        <button
                          key={val}
                          type='button'
                          onClick={() => handleQuickAddCash(val)}
                          className='flex-1 py-1.5 rounded-[8px] bg-white dark:bg-[#1E1F20] hover:bg-[#f0f3f0] dark:hover:bg-[#282A2C] active:scale-95 text-xs font-mono font-bold text-[#101410] dark:text-neutral-100 border border-[#e8ece8] dark:border-neutral-800 transition-all cursor-pointer'
                        >
                          +{val}
                        </button>
                      ))}
                    </div>

                    {/* Change Due Display */}
                    <div className='pt-2 border-t border-[#e8ece8] dark:border-neutral-800 flex items-center justify-between'>
                      <span className='text-[#7a827b] dark:text-neutral-400'>
                        {isAr ? 'المتبقي للعميل (الباقي):' : 'Change Due:'}
                      </span>
                      <span
                        dir='ltr'
                        className={`text-lg font-mono font-black ${
                          changeDue > 0 ? 'text-[#16782a] dark:text-white' : 'text-[#7a827b] dark:text-neutral-400'
                        }`}
                      >
                        E£ {changeDue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Instapay info panel */}
                {paymentMethod === 'INSTAPAY' && (
                  <div className='bg-[#e8f9ec] dark:bg-[#242628] border border-[#00d632]/40 dark:border-neutral-700 rounded-[14px] p-4 text-center space-y-2'>
                    <Zap className='size-8 text-[#00d632] dark:text-white mx-auto' />
                    <p className='text-[#101410] dark:text-white font-black text-sm'>
                      {isAr ? 'الدفع عبر Instapay' : 'Pay via Instapay'}
                    </p>
                    <p className='text-[#59635a] dark:text-neutral-300 text-[11px]'>
                      {isAr ? 'سيظهر QR Code للعميل لإتمام الدفع البالغ ' : 'A QR code will appear for the customer to pay '}
                      <span className='text-[#16782a] dark:text-white font-mono font-black' dir='ltr'>
                        E£ {grandTotal.toFixed(2)}
                      </span>
                    </p>
                  </div>
                )}

                {/* Order Quick Summary */}
                <div className='p-3.5 rounded-[12px] bg-[#fafbfa] dark:bg-[#242628] border border-[#e8ece8] dark:border-neutral-800 space-y-1.5 text-xs text-[#7a827b] dark:text-neutral-400'>
                  <div className='flex justify-between'>
                    <span>{isAr ? 'الفرع:' : 'Branch:'}</span>
                    <span className='text-[#101410] dark:text-neutral-100 font-bold'>
                      {branch?.name || (isAr ? 'الفرع الرئيسي' : 'Main Branch')}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>{isAr ? 'الكاشير المسؤول:' : 'Cashier:'}</span>
                    <span className='text-[#101410] dark:text-neutral-100 font-bold'>{cashier.name}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>{isAr ? 'عدد الأصناف:' : 'Items:'}</span>
                    <span className='text-[#101410] dark:text-neutral-100 font-mono font-bold'>
                      {isAr ? `${cartItems.length} صنف` : `${cartItems.length} items`}
                    </span>
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-3 mt-4'>
                <button
                  type='button'
                  onClick={onClose}
                  className='flex-1 h-12 rounded-[11px] border border-[#e8ece8] dark:border-neutral-800 bg-white dark:bg-[#242628] hover:bg-[#f0f3f0] dark:hover:bg-[#282A2C] text-[#59635a] dark:text-neutral-200 font-bold cursor-pointer transition-colors'
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type='button'
                  disabled={!isTenderSufficient || isProcessing}
                  onClick={handleConfirmCheckout}
                  className='flex-[2] h-12 rounded-[11px] bg-[#00d632] dark:bg-white hover:brightness-95 dark:hover:bg-neutral-200 text-[#061006] dark:text-black font-black text-sm shadow-sm disabled:opacity-40 cursor-pointer transition-all'
                >
                  {isProcessing
                    ? isAr
                      ? 'جاري الإصدار...'
                      : 'Processing...'
                    : isAr
                      ? 'تأكيد وحفظ الفاتورة'
                      : 'Confirm & Save Invoice'}
                </button>
              </div>
            </>
          ) : (
            /* ── Receipt Feedback View (Compact Balanced 2-Column Layout) ── */
            <div className='grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_275px] gap-3.5 flex-1 min-h-0 overflow-y-auto md:overflow-hidden'>
              {/* ── Left / Main Stage: Compact Well-Proportioned Receipt Preview ── */}
              <div
                id='pos-thermal-receipt'
                className='rounded-[16px] border border-[#e8ece8] dark:border-neutral-800 bg-[#f3f5f3] dark:bg-[#131314] p-3 overflow-y-auto max-h-[52vh] md:max-h-[76vh] flex justify-center items-start'
              >
                <CustomizedInvoiceView
                  invoice={completedInvoice}
                  template={template}
                  merchant={merchant}
                  branch={branch}
                  cashierName={cashier.name}
                  className='shadow-md overflow-hidden !max-w-[350px]'
                />
              </div>

              {/* ── Side Panel: Success Header + WhatsApp PDF + Live Link + Actions ── */}
              <div className='flex flex-col justify-between gap-3 min-w-0 md:overflow-y-auto'>
                <div className='space-y-3 min-w-0'>
                  {/* Compact Success Header */}
                  <div className='flex items-center gap-3 p-3.5 rounded-[16px] bg-[#fafbfa] dark:bg-[#242628] border border-[#e8ece8] dark:border-neutral-800'>
                    <div className='size-10 rounded-full bg-[#e9faed] dark:bg-neutral-800 text-[#18a23a] dark:text-white flex items-center justify-center shrink-0'>
                      <CheckCircle2 className='size-5 text-[#00d632] dark:text-white' />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <h3 className='text-sm font-black text-[#101410] dark:text-white leading-tight'>
                        {isAr ? 'تم تسجيل العملية بنجاح!' : 'Order Completed!'}
                      </h3>
                      <p className='text-[11px] text-[#7a827b] dark:text-neutral-400 mt-0.5 truncate'>
                        {isAr ? 'فاتورة ' : 'Invoice '}
                        <span className='font-mono font-bold text-[#101410] dark:text-white'>
                          #{completedInvoice.invoiceNumber}
                        </span>
                      </p>
                    </div>
                    <div className='text-end shrink-0'>
                      <span
                        dir='ltr'
                        className='inline-block font-mono font-black text-xs px-2 py-1 rounded-lg bg-[#e8f9ec] dark:bg-neutral-800 text-[#16782a] dark:text-white'
                      >
                        E£ {Number(completedInvoice.grandTotal ?? grandTotal).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* ── Direct Send Receipt PDF via WhatsApp Box ── */}
                  <div className='bg-[#fafbfa] dark:bg-[#242628] border border-[#e8ece8] dark:border-neutral-800 rounded-[16px] p-3.5 space-y-2.5 text-xs w-full min-w-0'>
                    <div className='flex items-center justify-between gap-2'>
                      <span className='font-bold text-[#101410] dark:text-neutral-100 flex items-center gap-1.5 min-w-0'>
                        <MessageCircle className='size-4 text-[#25D366] dark:text-neutral-200 shrink-0' />
                        <span className='truncate'>
                          {isAr ? 'إرسال الفاتورة PDF واتساب' : 'Send PDF via WhatsApp'}
                        </span>
                      </span>
                      {waStatus === 'connected' ? (
                        <span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e8f9ec] dark:bg-neutral-800 text-[#16782a] dark:text-neutral-200 shrink-0'>
                          {isAr ? 'متصل ✓' : 'Connected ✓'}
                        </span>
                      ) : (
                        <span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-200/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 shrink-0'>
                          {isAr ? 'غير مربوط' : 'Not linked'}
                        </span>
                      )}
                    </div>

                    <div className='space-y-2 w-full min-w-0'>
                      <Input
                        type='tel'
                        dir='ltr'
                        placeholder={isAr ? '010XXXXXXXX' : '010XXXXXXXX'}
                        value={customerPhone}
                        onChange={(e) => {
                          setCustomerPhone(e.target.value)
                          if (waSentTo) setWaSentTo(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleSendWhatsApp()
                          }
                        }}
                        className='h-9 w-full text-xs font-mono bg-white dark:bg-[#1E1F20] border-[#e8ece8] dark:border-neutral-800 text-[#101410] dark:text-white rounded-xl'
                      />
                      <button
                        type='button'
                        disabled={isSendingWa}
                        onClick={handleSendWhatsApp}
                        className='w-full h-9 px-3.5 rounded-xl bg-[#101410] dark:bg-white hover:bg-black dark:hover:bg-neutral-200 text-white dark:text-black font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs disabled:opacity-50'
                      >
                        {isSendingWa ? (
                          <Loader2 className='size-3.5 animate-spin' />
                        ) : waSentTo ? (
                          <Check className='size-3.5' />
                        ) : (
                          <Send className='size-3.5' />
                        )}
                        <span>
                          {isSendingWa
                            ? isAr
                              ? 'جاري تجهيز وإرسال PDF...'
                              : 'Generating & Sending PDF...'
                            : waSentTo
                              ? isAr
                                ? 'تم الإرسال ✓'
                                : 'Sent ✓'
                              : isAr
                                ? 'إرسال الفاتورة PDF'
                                : 'Send Invoice PDF'}
                        </span>
                      </button>
                    </div>

                    {waSentTo && (
                      <p className='text-[11px] font-bold text-[#16782a] dark:text-neutral-200 leading-snug'>
                        {isAr
                          ? `✓ تم إرسال الفاتورة PDF إلى +${waSentTo}`
                          : `✓ Invoice PDF sent to +${waSentTo}`}
                      </p>
                    )}
                  </div>

                  {/* ── Compact Live Receipt Screen Link Box ── */}
                  <div className='bg-[#fafbfa] dark:bg-[#242628] border border-[#e8ece8] dark:border-neutral-800 rounded-[16px] p-3 space-y-2 text-xs w-full min-w-0'>
                    <div className='flex items-center justify-between gap-2'>
                      <span className='font-bold text-[#101410] dark:text-neutral-100 truncate text-[11px]'>
                        {isAr ? 'شاشة الفاتورة المباشرة' : 'Live Receipt Screen'}
                      </span>
                      <span className='text-[10px] text-[#368449] dark:text-neutral-200 bg-[#e8f9ec] dark:bg-neutral-800 px-2 py-0.5 rounded-full font-bold shrink-0'>
                        {isAr ? 'تتحدث تلقائياً' : 'Live'}
                      </span>
                    </div>

                    <div className='flex items-center gap-1.5 bg-white dark:bg-[#1E1F20] border border-[#e8ece8] dark:border-neutral-800 rounded-xl p-1 ps-2 w-full min-w-0 overflow-hidden'>
                      <span
                        className='font-mono text-[11px] font-semibold text-[#59635a] dark:text-neutral-300 truncate min-w-0 flex-1 text-left'
                        dir='ltr'
                      >
                        {fixedReceiptUrl}
                      </span>

                      <button
                        type='button'
                        onClick={() => {
                          navigator.clipboard.writeText(fixedReceiptUrl)
                          setCopiedLink(true)
                          toast.success(isAr ? 'تم نسخ رابط شاشة الفاتورة!' : 'Receipt link copied!')
                          setTimeout(() => setCopiedLink(false), 2000)
                        }}
                        className='p-1.5 rounded-lg bg-[#f0f3f0] dark:bg-[#282A2C] hover:bg-[#e4eae4] dark:hover:bg-[#262c27] text-[#101410] dark:text-neutral-100 cursor-pointer transition-colors shrink-0'
                        title={isAr ? 'نسخ الرابط' : 'Copy Link'}
                      >
                        {copiedLink ? (
                          <Check className='size-3.5 text-[#16782a] dark:text-white' />
                        ) : (
                          <Copy className='size-3.5' />
                        )}
                      </button>

                      <a
                        href={fixedReceiptUrl}
                        target='_blank'
                        rel='noreferrer'
                        className='p-1.5 rounded-lg bg-[#00d632] dark:bg-white hover:brightness-95 dark:hover:bg-neutral-200 text-[#061006] dark:text-black cursor-pointer transition-all shrink-0'
                        title={isAr ? 'فتح الرابط في نافذة جديدة' : 'Open in new tab'}
                      >
                        <ExternalLink className='size-3.5' />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className='grid grid-cols-2 gap-2 pt-2 border-t border-[#e8ece8] dark:border-neutral-800'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={handlePrint}
                    className='h-11 rounded-xl border-[#e8ece8] dark:border-neutral-800 bg-white dark:bg-[#242628] hover:bg-slate-100 dark:hover:bg-[#282A2C] text-slate-800 dark:text-neutral-100 font-bold text-xs gap-1.5 shadow-xs cursor-pointer min-w-0'
                  >
                    <Printer className='size-4 shrink-0' />
                    <span className='truncate'>{isAr ? 'طباعة' : 'Print'}</span>
                  </Button>

                  <Button
                    type='button'
                    onClick={() => {
                      onNewOrder()
                      onClose()
                    }}
                    className='h-11 rounded-xl bg-[#00d632] dark:bg-white hover:brightness-95 dark:hover:bg-neutral-200 text-[#061006] dark:text-black font-black text-xs shadow-sm gap-1.5 border-none cursor-pointer min-w-0'
                  >
                    <RotateCcw className='size-4 shrink-0' />
                    <span className='truncate'>{isAr ? 'طلب جديد' : 'New Order'}</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
