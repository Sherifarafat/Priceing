import * as React from 'react'
import {
  Banknote,
  CreditCard,
  QrCode,
  CheckCircle2,
  Printer,
  RotateCcw,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Merchant, Branch, User, Invoice } from '@/types/saas'
import type { POSCartItem, PaymentMethod } from '../types'

interface PosCheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  merchant: Merchant
  branch: Branch | null
  cashier: User
  cartItems: POSCartItem[]
  vatRate?: number
  onCompleteSale: (paymentMethod: PaymentMethod, amountPaid: number) => Promise<Invoice | null>
  onNewOrder: () => void
}

export function PosCheckoutModal({
  isOpen,
  onClose,
  merchant,
  branch,
  cashier,
  cartItems,
  vatRate = 0.14,
  onCompleteSale,
  onNewOrder,
}: PosCheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('CASH')
  const [tenderedAmount, setTenderedAmount] = React.useState<string>('')
  const [isProcessing, setIsProcessing] = React.useState<boolean>(false)
  const [completedInvoice, setCompletedInvoice] = React.useState<Invoice | null>(null)

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !completedInvoice && onClose()}>
      <DialogContent className='sm:max-w-lg bg-[#0F0F12] border border-white/10 text-white p-6 rounded-3xl'>
        {!completedInvoice ? (
          <>
            <DialogHeader className='text-right'>
              <DialogTitle className='text-lg font-bold flex items-center justify-between'>
                <span>إتمام عملية الدفع</span>
                <span className='font-mono text-xl text-[#3EEA85] font-black'>
                  E£ {grandTotal.toFixed(2)}
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className='space-y-5 my-4 text-xs'>
              {/* Payment Methods */}
              <div>
                <label className='text-neutral-400 block mb-2 font-semibold'>
                  طريقة الدفع:
                </label>
                <div className='grid grid-cols-3 gap-2.5'>
                  <button
                    type='button'
                    onClick={() => setPaymentMethod('CASH')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'CASH'
                        ? 'bg-[#3EEA85] text-black border-[#3EEA85] font-bold shadow-md shadow-[#3EEA85]/20'
                        : 'bg-neutral-900 border-white/10 text-neutral-300 hover:border-white/20'
                    }`}
                  >
                    <Banknote className='size-5' />
                    <span>نقداً (Cash)</span>
                  </button>

                  <button
                    type='button'
                    onClick={() => setPaymentMethod('CARD')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'CARD'
                        ? 'bg-[#3EEA85] text-black border-[#3EEA85] font-bold shadow-md shadow-[#3EEA85]/20'
                        : 'bg-neutral-900 border-white/10 text-neutral-300 hover:border-white/20'
                    }`}
                  >
                    <CreditCard className='size-5' />
                    <span>فيزا / بطاقة (Card)</span>
                  </button>

                  <button
                    type='button'
                    onClick={() => setPaymentMethod('QR')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'QR'
                        ? 'bg-[#3EEA85] text-black border-[#3EEA85] font-bold shadow-md shadow-[#3EEA85]/20'
                        : 'bg-neutral-900 border-white/10 text-neutral-300 hover:border-white/20'
                    }`}
                  >
                    <QrCode className='size-5' />
                    <span>محفظة / QR</span>
                  </button>
                </div>
              </div>

              {/* Cash Tender Calculation */}
              {paymentMethod === 'CASH' && (
                <div className='space-y-3 bg-neutral-900/90 border border-white/10 p-4 rounded-2xl'>
                  <div className='flex items-center justify-between'>
                    <label className='font-semibold text-neutral-300'>
                      المبلغ المستلم من العميل:
                    </label>
                    <Button
                      type='button'
                      size='sm'
                      variant='ghost'
                      onClick={() => setTenderedAmount(grandTotal.toFixed(2))}
                      className='h-6 text-[11px] text-[#3EEA85] hover:bg-[#3EEA85]/10 p-1'
                    >
                      المبلغ بالضبط
                    </Button>
                  </div>

                  <div className='relative'>
                    <span className='absolute start-3 top-1/2 -translate-y-1/2 font-mono text-sm text-neutral-400 font-bold'>
                      E£
                    </span>
                    <Input
                      type='number'
                      step='any'
                      value={tenderedAmount}
                      onChange={(e) => setTenderedAmount(e.target.value)}
                      className='ps-10 h-12 text-lg font-mono font-black rounded-xl bg-black border-white/10 text-white focus-visible:border-[#3EEA85]'
                    />
                  </div>

                  {/* Fast Add Cash Buttons */}
                  <div className='flex items-center gap-2'>
                    {[50, 100, 200, 500].map((val) => (
                      <button
                        key={val}
                        type='button'
                        onClick={() => handleQuickAddCash(val)}
                        className='flex-1 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-xs font-mono font-bold text-neutral-200 border border-white/5 transition-all'
                      >
                        +{val}
                      </button>
                    ))}
                  </div>

                  {/* Change Due Display */}
                  <div className='pt-2 border-t border-white/10 flex items-center justify-between'>
                    <span className='text-neutral-400'>المتبقي للعميل (الباقي):</span>
                    <span
                      className={`text-lg font-mono font-black ${
                        changeDue > 0 ? 'text-[#3EEA85]' : 'text-neutral-400'
                      }`}
                    >
                      E£ {changeDue.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Order Quick Summary */}
              <div className='p-3 rounded-2xl bg-black border border-white/10 space-y-1 text-xs text-neutral-400'>
                <div className='flex justify-between'>
                  <span>الفرع:</span>
                  <span className='text-white font-medium'>{branch?.name || 'الفرع الرئيسي'}</span>
                </div>
                <div className='flex justify-between'>
                  <span>الكاشير المسؤول:</span>
                  <span className='text-white font-medium'>{cashier.name}</span>
                </div>
                <div className='flex justify-between'>
                  <span>عدد الأصناف:</span>
                  <span className='text-white font-mono'>{cartItems.length} صنف</span>
                </div>
              </div>
            </div>

            <div className='flex items-center gap-3 mt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={onClose}
                className='flex-1 h-12 rounded-2xl border-white/15 bg-white/5 hover:bg-white/10 text-neutral-300 font-bold'
              >
                إلغاء
              </Button>
              <Button
                type='button'
                disabled={!isTenderSufficient || isProcessing}
                onClick={handleConfirmCheckout}
                className='flex-[2] h-12 rounded-2xl bg-[#3EEA85] hover:bg-[#3EEA85]/90 text-black font-extrabold text-sm shadow-lg shadow-[#3EEA85]/20 disabled:opacity-40'
              >
                {isProcessing ? 'جاري الإصدار...' : 'تأكيد وحفظ الفاتورة'}
              </Button>
            </div>
          </>
        ) : (
          /* ── Thermal Receipt View (80mm) ── */
          <div className='space-y-4'>
            <div className='text-center'>
              <div className='size-12 rounded-full bg-[#3EEA85]/20 text-[#3EEA85] flex items-center justify-center mx-auto mb-2'>
                <CheckCircle2 className='size-7' />
              </div>
              <h3 className='text-base font-extrabold text-white'>تم تسجيل العملية بنجاح!</h3>
              <p className='text-xs text-neutral-400'>
                فاتورة رقم <span className='font-mono font-bold text-[#3EEA85]'>{completedInvoice.invoiceNumber}</span>
              </p>
            </div>

            {/* Printable Thermal Receipt Container */}
            <div
              id='pos-thermal-receipt'
              className='bg-white text-black p-5 rounded-2xl font-mono text-xs shadow-xl space-y-3 max-h-[380px] overflow-y-auto'
            >
              <div className='text-center border-b pb-2.5'>
                <h4 className='font-black text-sm uppercase'>{merchant.name}</h4>
                <p className='text-[10px] text-neutral-600'>{branch?.name || 'الفرع الرئيسي'}</p>
                <p className='text-[9px] text-neutral-500'>فاتورة ضريبية مبسطة</p>
              </div>

              <div className='text-[10px] space-y-0.5 border-b pb-2 text-neutral-700'>
                <div className='flex justify-between'>
                  <span>رقم الفاتورة:</span>
                  <strong>{completedInvoice.invoiceNumber}</strong>
                </div>
                <div className='flex justify-between'>
                  <span>التاريخ:</span>
                  <span>{new Date(completedInvoice.issuedAt).toLocaleDateString('ar-EG')}</span>
                </div>
                <div className='flex justify-between'>
                  <span>الكاشير:</span>
                  <span>{cashier.name}</span>
                </div>
                <div className='flex justify-between'>
                  <span>طريقة الدفع:</span>
                  <strong>{completedInvoice.paymentMethod}</strong>
                </div>
              </div>

              {/* Items Table */}
              <div className='space-y-1.5 border-b pb-2 text-[11px]'>
                <div className='flex justify-between font-bold text-neutral-900 border-b pb-1'>
                  <span>الصنف</span>
                  <span>الكمية × السعر</span>
                  <span>الإجمالي</span>
                </div>
                {(completedInvoice.items || []).map((item, idx) => (
                  <div key={idx} className='flex justify-between text-neutral-800'>
                    <span className='truncate max-w-[120px] font-sans'>{item.productName}</span>
                    <span className='font-mono text-[10px]'>{item.quantity} × {item.unitPrice}</span>
                    <span className='font-mono font-bold'>{item.totalPrice.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className='space-y-1 text-xs border-b pb-2'>
                <div className='flex justify-between text-neutral-600'>
                  <span>المجموع الفرعي:</span>
                  <span className='font-mono'>{completedInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div className='flex justify-between text-neutral-600'>
                  <span>ضريبة القيمة المضافة:</span>
                  <span className='font-mono'>{completedInvoice.taxTotal.toFixed(2)}</span>
                </div>
                <div className='flex justify-between font-black text-sm text-neutral-900 pt-1 border-t'>
                  <span>الإجمالي النهائي:</span>
                  <span className='font-mono'>E£ {completedInvoice.grandTotal.toFixed(2)}</span>
                </div>
                {paymentMethod === 'CASH' && (
                  <>
                    <div className='flex justify-between text-neutral-600 text-[10px] pt-1'>
                      <span>المدفوع:</span>
                      <span className='font-mono'>E£ {numericTendered.toFixed(2)}</span>
                    </div>
                    <div className='flex justify-between text-neutral-900 font-bold text-[10px]'>
                      <span>الباقي:</span>
                      <span className='font-mono'>E£ {changeDue.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className='text-center pt-1 text-[9px] text-neutral-500'>
                <p>شكراً لزيارتكم - نتمنى لكم يوماً سعيداً</p>
                <p className='font-mono text-[8px] mt-0.5'>Powered by Saller Finro POS</p>
              </div>
            </div>

            {/* Actions */}
            <div className='flex items-center gap-2 pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={handlePrint}
                className='flex-1 h-12 rounded-2xl border-white/15 bg-white/5 hover:bg-white/10 text-white font-bold gap-2'
              >
                <Printer className='size-4 text-[#3EEA85]' />
                <span>طباعة الإيصال</span>
              </Button>

              <Button
                type='button'
                onClick={() => {
                  onNewOrder()
                  onClose()
                }}
                className='flex-1 h-12 rounded-2xl bg-[#3EEA85] hover:bg-[#3EEA85]/90 text-black font-extrabold text-sm shadow-lg shadow-[#3EEA85]/20 gap-2'
              >
                <RotateCcw className='size-4' />
                <span>طلب جديد</span>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
