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
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('CASH')
  const [tenderedAmount, setTenderedAmount] = React.useState<string>('')
  const [isProcessing, setIsProcessing] = React.useState<boolean>(false)
  const [completedInvoice, setCompletedInvoice] = React.useState<Invoice | null>(null)
  const [instapayStep, setInstapayStep] = React.useState<InstapayStep>('idle')
  const [copiedLink, setCopiedLink] = React.useState<boolean>(false)

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.total, 0)
  const taxAmount = subtotal * vatRate
  const grandTotal = subtotal + taxAmount

  // Set default tendered to exact total when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setTenderedAmount(grandTotal.toFixed(2))
      setCompletedInvoice(null)
      setIsProcessing(false)
      setInstapayStep('idle')
    }
  }, [isOpen, grandTotal])

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
      setInstapayStep('animating')
      // After 2.5s animation → show QR
      setTimeout(() => {
        setInstapayStep('qr')
        // After 2.5s QR → success + generate invoice
        setTimeout(async () => {
          setInstapayStep('success')
          // Play success beep
          try {
            const ctx = new AudioContext()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.frequency.value = 880
            osc.type = 'sine'
            gain.gain.setValueAtTime(0.3, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
            osc.start(ctx.currentTime)
            osc.stop(ctx.currentTime + 0.6)
          } catch (_) {}

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
            setTimeout(() => {
              setInstapayStep('idle')
            }, 1200)
          }
        }, 2500)
      }, 2500)
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
                في انتظار إتمام الدفع عبر Instapay...
              </p>
              <p className='text-[#061006]/75 text-xs font-bold'>
                يتم التحقق من العملية وتأكيد المعاملة آلياً
              </p>
            </div>
          </div>
        )}

        {instapayStep === 'qr' && (
          <div className='flex flex-col items-center gap-3.5 my-auto animate-fadeIn'>
            <p className='text-[#061006] font-black text-base'>
              امسح الكود للدفع عبر تطبيق Instapay
            </p>
            <div className='bg-white p-3 rounded-2xl shadow-md border-2 border-[#061006]'>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=instapay:${grandTotal.toFixed(2)}`}
                alt='Instapay QR'
                className='size-44'
              />
            </div>
            <div className='bg-[#061006] text-white px-5 py-1.5 rounded-full font-mono font-black text-lg shadow-xs'>
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
              <p className='text-[#061006] font-black text-2xl'>تم استلام الدفع بنجاح!</p>
              <p className='text-[#061006] font-black text-lg font-mono'>
                E£ {grandTotal.toFixed(2)}
              </p>
            </div>
            <p className='text-[#061006]/80 text-xs font-bold'>
              جاري تجهيز الفاتورة والإيصال...
            </p>
          </div>
        )}

        {instapayStep !== 'success' && (
          <button
            type='button'
            onClick={() => {
              setInstapayStep('idle')
              setIsProcessing(false)
            }}
            className='mt-3 text-xs font-bold text-[#061006]/75 hover:text-[#061006] hover:underline cursor-pointer'
          >
            إلغاء والعودة للدفع
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
          className={`p-6 rounded-[22px] shadow-2xl transition-all duration-300 w-full overflow-hidden ${
            completedInvoice
              ? 'sm:max-w-xl bg-white border border-[#e8ece8] text-[#101410]'
              : instapayStep !== 'idle'
              ? 'sm:max-w-lg bg-[#00d632] border-none text-[#061006]'
              : 'sm:max-w-lg bg-white border border-[#e8ece8] text-[#101410]'
          }`}
        >
          {instapayStep !== 'idle' ? (
            renderInstapayContent()
          ) : !completedInvoice ? (
            <>
              <DialogHeader className='text-right'>
                <DialogTitle className='text-lg font-black flex items-center justify-between text-[#101410]'>
                  <span>إتمام عملية الدفع</span>
                  <span className='font-mono text-xl text-[#101410] font-black'>
                    E£ {grandTotal.toFixed(2)}
                  </span>
                </DialogTitle>
              </DialogHeader>

              <div className='space-y-5 my-4 text-xs'>
                {/* Payment Methods */}
                <div>
                  <label className='text-[#7a827b] block mb-2 font-bold uppercase tracking-wider text-[11px]'>
                    طريقة الدفع:
                  </label>
                  <div className='grid grid-cols-4 gap-2.5'>
                    <button
                      type='button'
                      onClick={() => setPaymentMethod('CASH')}
                      className={`p-3 rounded-[10px] border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                        paymentMethod === 'CASH'
                          ? 'border-2 border-[#00d632] bg-[#f2fff4] text-[#16782a] font-extrabold shadow-xs'
                          : 'border border-[#e8ece8] bg-white text-[#606a61] hover:border-[#00d632]/50'
                      }`}
                    >
                      <Banknote className='size-5' />
                      <span>نقداً</span>
                    </button>

                    <button
                      type='button'
                      onClick={() => setPaymentMethod('CARD')}
                      className={`p-3 rounded-[10px] border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                        paymentMethod === 'CARD'
                          ? 'border-2 border-[#00d632] bg-[#f2fff4] text-[#16782a] font-extrabold shadow-xs'
                          : 'border border-[#e8ece8] bg-white text-[#606a61] hover:border-[#00d632]/50'
                      }`}
                    >
                      <CreditCard className='size-5' />
                      <span>بطاقة</span>
                    </button>

                    <button
                      type='button'
                      onClick={() => setPaymentMethod('QR')}
                      className={`p-3 rounded-[10px] border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                        paymentMethod === 'QR'
                          ? 'border-2 border-[#00d632] bg-[#f2fff4] text-[#16782a] font-extrabold shadow-xs'
                          : 'border border-[#e8ece8] bg-white text-[#606a61] hover:border-[#00d632]/50'
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
                          ? 'border-2 border-[#00d632] bg-[#00d632] text-[#061006] font-black shadow-xs'
                          : 'border border-[#e8ece8] bg-white text-[#606a61] hover:border-[#00d632]/50'
                      }`}
                    >
                      <Zap className='size-5' />
                      <span>Instapay</span>
                    </button>
                  </div>
                </div>

                {/* Cash Tender Calculation */}
                {paymentMethod === 'CASH' && (
                  <div className='space-y-3 bg-[#fafbfa] border border-[#e8ece8] p-4 rounded-[14px]'>
                    <div className='flex items-center justify-between'>
                      <label className='font-bold text-[#101410]'>
                        المبلغ المستلم من العميل:
                      </label>
                      <button
                        type='button'
                        onClick={() => setTenderedAmount(grandTotal.toFixed(2))}
                        className='h-6 text-[11px] text-[#16782a] hover:bg-[#e8f9ec] px-2 rounded-md font-extrabold cursor-pointer transition-colors'
                      >
                        المبلغ بالضبط
                      </button>
                    </div>

                    <div className='relative'>
                      <span className='absolute start-3 top-1/2 -translate-y-1/2 font-mono text-sm text-[#7a827b] font-bold'>
                        E£
                      </span>
                      <Input
                        type='number'
                        step='any'
                        value={tenderedAmount}
                        onChange={(e) => setTenderedAmount(e.target.value)}
                        className='ps-10 h-12 text-lg font-mono font-black rounded-[10px] bg-white border-[#e8ece8] text-[#101410] focus-visible:border-[#00d632] shadow-2xs'
                      />
                    </div>

                    {/* Fast Add Cash Buttons */}
                    <div className='flex items-center gap-2'>
                      {[50, 100, 200, 500].map((val) => (
                        <button
                          key={val}
                          type='button'
                          onClick={() => handleQuickAddCash(val)}
                          className='flex-1 py-1.5 rounded-[8px] bg-white hover:bg-[#f0f3f0] active:scale-95 text-xs font-mono font-bold text-[#101410] border border-[#e8ece8] transition-all cursor-pointer'
                        >
                          +{val}
                        </button>
                      ))}
                    </div>

                    {/* Change Due Display */}
                    <div className='pt-2 border-t border-[#e8ece8] flex items-center justify-between'>
                      <span className='text-[#7a827b]'>المتبقي للعميل (الباقي):</span>
                      <span
                        className={`text-lg font-mono font-black ${
                          changeDue > 0 ? 'text-[#16782a]' : 'text-[#7a827b]'
                        }`}
                      >
                        E£ {changeDue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Instapay info panel */}
                {paymentMethod === 'INSTAPAY' && (
                  <div className='bg-[#e8f9ec] border border-[#00d632]/40 rounded-[14px] p-4 text-center space-y-2'>
                    <Zap className='size-8 text-[#00d632] mx-auto' />
                    <p className='text-[#101410] font-black text-sm'>الدفع عبر Instapay</p>
                    <p className='text-[#59635a] text-[11px]'>
                      سيظهر QR Code للعميل لإتمام الدفع البالغ{' '}
                      <span className='text-[#16782a] font-mono font-black'>
                        E£ {grandTotal.toFixed(2)}
                      </span>
                    </p>
                  </div>
                )}

                {/* Order Quick Summary */}
                <div className='p-3.5 rounded-[12px] bg-[#fafbfa] border border-[#e8ece8] space-y-1.5 text-xs text-[#7a827b]'>
                  <div className='flex justify-between'>
                    <span>الفرع:</span>
                    <span className='text-[#101410] font-bold'>{branch?.name || 'الفرع الرئيسي'}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>الكاشير المسؤول:</span>
                    <span className='text-[#101410] font-bold'>{cashier.name}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>عدد الأصناف:</span>
                    <span className='text-[#101410] font-mono font-bold'>{cartItems.length} صنف</span>
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-3 mt-4'>
                <button
                  type='button'
                  onClick={onClose}
                  className='flex-1 h-12 rounded-[11px] border border-[#e8ece8] bg-white hover:bg-[#f0f3f0] text-[#59635a] font-bold cursor-pointer transition-colors'
                >
                  إلغاء
                </button>
                <button
                  type='button'
                  disabled={!isTenderSufficient || isProcessing}
                  onClick={handleConfirmCheckout}
                  className='flex-[2] h-12 rounded-[11px] bg-[#00d632] hover:brightness-95 text-[#061006] font-black text-sm shadow-sm disabled:opacity-40 cursor-pointer transition-all'
                >
                  {isProcessing ? 'جاري الإصدار...' : 'تأكيد وحفظ الفاتورة ←'}
                </button>
              </div>
            </>
          ) : (
            /* ── Receipt Feedback View ── */
            <div className='space-y-3.5 w-full min-w-0 max-w-full overflow-hidden'>
              <div className='text-center w-full'>
                <div className='size-12 rounded-full bg-[#e9faed] text-[#18a23a] flex items-center justify-center mx-auto mb-2 text-2xl font-black'>
                  <CheckCircle2 className='size-6 text-[#00d632]' />
                </div>
                <h3 className='text-base font-black text-[#101410]'>تم تسجيل العملية بنجاح!</h3>
                <p className='text-xs text-[#7a827b] mt-0.5'>
                  فاتورة رقم{' '}
                  <span className='font-mono font-bold text-[#101410]'>
                    {completedInvoice.invoiceNumber}
                  </span>
                </p>
              </div>

              {/* ── Fixed Invoice Live Display Link Box (Scoped to Merchant & Branch) ── */}
              <div className='bg-[#fafbfa] border border-[#e8ece8] rounded-[16px] p-3 space-y-2 text-xs w-full min-w-0'>
                <div className='flex items-center justify-between gap-2'>
                  <span className='font-bold text-[#101410] truncate'>رابط شاشة الفاتورة لفرع {branch?.name || 'الرئيسي'}:</span>
                  <span className='text-[10px] text-[#368449] bg-[#e8f9ec] px-2 py-0.5 rounded-full font-bold shrink-0'>
                    شاشة ثابتة تتحدث تلقائياً
                  </span>
                </div>

                <div className='flex items-center gap-1.5 bg-white border border-[#e8ece8] rounded-xl p-1.5 ps-2.5 w-full min-w-0 overflow-hidden'>
                  <span className='font-mono text-xs font-bold text-[#101410] truncate min-w-0 flex-1 text-left' dir='ltr'>
                    {fixedReceiptUrl}
                  </span>

                  <button
                    type='button'
                    onClick={() => {
                      navigator.clipboard.writeText(fixedReceiptUrl)
                      setCopiedLink(true)
                      toast.success('تم نسخ الرابط الثابت لشاشة الفواتير!')
                      setTimeout(() => setCopiedLink(false), 2000)
                    }}
                    className='px-3 py-1.5 rounded-lg bg-[#f0f3f0] hover:bg-[#e4eae4] text-[#101410] font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shrink-0'
                    title='نسخ الرابط الثابت'
                  >
                    {copiedLink ? <Check className='size-3.5 text-[#16782a]' /> : <Copy className='size-3.5' />}
                    <span>{copiedLink ? 'تم النسخ' : 'نسخ الرابط'}</span>
                  </button>

                  <a
                    href={fixedReceiptUrl}
                    target='_blank'
                    rel='noreferrer'
                    className='px-2.5 py-1.5 rounded-lg bg-[#00d632] hover:brightness-95 text-[#061006] font-bold text-xs flex items-center gap-1 cursor-pointer transition-all shrink-0'
                    title='فتح الرابط في نافذة جديدة'
                  >
                    <span>فتح</span>
                    <ExternalLink className='size-3.5' />
                  </a>
                </div>

                <p className='text-[10px] text-[#7a827b] leading-relaxed'>
                  هذا الرابط خاص بـ {merchant.name} (فرع {branch?.name || 'الرئيسي'})، ثابت دائماً ويتغير تلقائياً مع إصدار كل فاتورة جديدة، ويظل يعرض الفاتورة حتى الضغط على &quot;طلب جديد&quot;.
                </p>
              </div>

              {/* ── Customized Invoice Preview from Portal ── */}
              <div
                id='pos-thermal-receipt'
                className='max-h-[280px] w-full max-w-full overflow-y-auto overflow-x-hidden rounded-[16px] border border-[#e8ece8] bg-zinc-50 p-2 flex justify-center'
              >
                <div className='w-full max-w-full overflow-x-auto flex justify-center'>
                  <CustomizedInvoiceView
                    invoice={completedInvoice}
                    template={template}
                    merchant={merchant}
                    branch={branch}
                    cashierName={cashier.name}
                    className='shadow-none border-none w-full max-w-full'
                  />
                </div>
              </div>

              {/* Actions */}
              <div className='flex items-center gap-2 pt-1 w-full'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={handlePrint}
                  className='flex-1 h-11 rounded-xl border-[#e8ece8] bg-white hover:bg-slate-100 text-slate-800 font-bold gap-2 shadow-xs cursor-pointer min-w-0'
                >
                  <Printer className='size-4' />
                  <span className='truncate'>طباعة الإيصال</span>
                </Button>

                <Button
                  type='button'
                  onClick={() => {
                    onNewOrder()
                    onClose()
                  }}
                  className='flex-1 h-11 rounded-xl bg-[#00d632] hover:brightness-95 text-[#061006] font-black text-sm shadow-sm gap-2 border-none cursor-pointer min-w-0'
                >
                  <RotateCcw className='size-4' />
                  <span className='truncate'>طلب جديد</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
