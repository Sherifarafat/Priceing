import * as React from 'react'
import {
  Plus,
  Minus,
  ShoppingCart,
  Receipt,
  Banknote,
  RotateCcw,
  Percent,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { POSCartItem } from '../types'

interface PosCartProps {
  cartItems: POSCartItem[]
  onUpdateQuantity: (productId: string, delta: number) => void
  onRemoveItem: (productId: string) => void
  onClearCart: () => void
  onOpenCheckout: () => void
  vatRate?: number
}

export function PosCart({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenCheckout,
  vatRate = 0.14,
}: PosCartProps) {
  const [discountPercent, setDiscountPercent] = React.useState<number>(0)
  const [showDiscountInput, setShowDiscountInput] = React.useState(false)

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.total, 0)
  const discountAmount = subtotal * (discountPercent / 100)
  const taxableAmount = Math.max(0, subtotal - discountAmount)
  const taxAmount = taxableAmount * vatRate
  const grandTotal = taxableAmount + taxAmount
  const totalItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <div className='w-full lg:w-[400px] xl:w-[440px] h-full flex flex-col bg-[#09090B] border-t lg:border-t-0 lg:border-s border-white/10 shrink-0 text-white'>
      {/* ── Cart Header ── */}
      <div className='p-4 border-b border-white/10 flex items-center justify-between shrink-0'>
        <div className='flex items-center gap-2'>
          <ShoppingCart className='size-5 text-[#3EEA85]' />
          <h2 className='font-bold text-sm tracking-tight'>طلب العميل الحالي</h2>
          <Badge className='bg-[#3EEA85]/20 text-[#3EEA85] text-xs font-mono font-bold border-none'>
            {totalItemCount} عناصر
          </Badge>
        </div>

        {cartItems.length > 0 && (
          <Button
            size='sm'
            variant='ghost'
            onClick={onClearCart}
            className='h-7 px-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg gap-1'
          >
            <RotateCcw className='size-3' />
            <span>مسح الكل</span>
          </Button>
        )}
      </div>

      {/* ── Cart Items List (Scrollable) ── */}
      <div className='flex-1 overflow-y-auto p-4 space-y-2.5'>
        {cartItems.length === 0 ? (
          <div className='h-full flex flex-col items-center justify-center text-center text-neutral-500 p-6'>
            <div className='size-16 rounded-3xl bg-neutral-900 border border-white/5 flex items-center justify-center mb-3'>
              <Receipt className='size-8 text-neutral-600' />
            </div>
            <p className='font-bold text-sm text-neutral-300'>السلة فارغة حالياً</p>
            <p className='text-xs text-neutral-500 mt-1 max-w-[220px]'>
              امسح باركود المنتج أو اضغط على أي عنصر في القائمة لإضافته للطلب
            </p>
          </div>
        ) : (
          cartItems.map((item) => (
            <div
              key={item.product.id}
              className='p-3 rounded-2xl bg-neutral-900/80 border border-white/10 flex items-center justify-between gap-3 group hover:border-white/20 transition-all'
            >
              {/* Product Info */}
              <div className='flex-1 min-w-0'>
                <h4 className='font-bold text-xs text-white truncate'>
                  {item.product.name}
                </h4>
                <div className='flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5 font-mono'>
                  <span>E£ {item.unitPrice.toFixed(2)}</span>
                  <span>×</span>
                  <span className='text-white font-bold'>{item.quantity}</span>
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className='flex items-center gap-1.5 bg-neutral-800/80 border border-white/10 rounded-xl p-1 shrink-0'>
                <button
                  type='button'
                  onClick={() => onUpdateQuantity(item.product.id, -1)}
                  className='size-6 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-neutral-300 hover:text-white transition-colors active:scale-90'
                >
                  <Minus className='size-3' />
                </button>

                <span className='w-6 text-center text-xs font-mono font-bold text-white'>
                  {item.quantity}
                </span>

                <button
                  type='button'
                  onClick={() => onUpdateQuantity(item.product.id, 1)}
                  className='size-6 rounded-lg bg-[#3EEA85]/20 hover:bg-[#3EEA85]/30 flex items-center justify-center text-[#3EEA85] transition-colors active:scale-90'
                >
                  <Plus className='size-3' />
                </button>
              </div>

              {/* Line Total */}
              <div className='text-right shrink-0 min-w-[70px]'>
                <div className='font-mono font-extrabold text-xs text-[#3EEA85]'>
                  E£ {item.total.toFixed(2)}
                </div>
                <button
                  type='button'
                  onClick={() => onRemoveItem(item.product.id)}
                  className='text-neutral-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] mt-0.5'
                >
                  حذف
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Summary & Checkout Footer ── */}
      <div className='p-4 border-t border-white/10 bg-neutral-900/90 space-y-3 shrink-0'>
        {/* Subtotal & Discounts */}
        <div className='space-y-1.5 text-xs text-neutral-400'>
          <div className='flex items-center justify-between'>
            <span>المجموع الفرعي:</span>
            <span className='font-mono text-white font-bold'>
              E£ {subtotal.toFixed(2)}
            </span>
          </div>

          {/* Quick Discount Toggle */}
          <div className='flex items-center justify-between'>
            <button
              type='button'
              onClick={() => setShowDiscountInput(!showDiscountInput)}
              className='text-neutral-400 hover:text-[#3EEA85] flex items-center gap-1 text-[11px]'
            >
              <Percent className='size-3' />
              <span>{discountPercent > 0 ? `خصم (${discountPercent}%)` : 'إضافة خصم'}</span>
            </button>
            {discountPercent > 0 && (
              <span className='font-mono text-rose-400 font-bold'>
                - E£ {discountAmount.toFixed(2)}
              </span>
            )}
          </div>

          {showDiscountInput && (
            <div className='flex items-center gap-2 pt-1'>
              {[5, 10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  type='button'
                  onClick={() => {
                    setDiscountPercent(discountPercent === pct ? 0 : pct)
                  }}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-bold border ${
                    discountPercent === pct
                      ? 'bg-[#3EEA85] text-black border-[#3EEA85]'
                      : 'bg-neutral-800 text-neutral-300 border-white/10'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          )}

          <div className='flex items-center justify-between'>
            <span>ضريبة القيمة المضافة ({(vatRate * 100).toFixed(0)}%):</span>
            <span className='font-mono text-white font-bold'>
              E£ {taxAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Grand Total Display */}
        <div className='p-3.5 rounded-2xl bg-black border border-white/10 flex items-center justify-between'>
          <div>
            <span className='text-[11px] text-neutral-400 block'>المبلغ الإجمالي للدفع</span>
            <span className='text-xs text-neutral-500 font-mono'>شامل الضريبة</span>
          </div>
          <div className='text-2xl font-black text-[#3EEA85] font-mono tracking-tight'>
            E£ {grandTotal.toFixed(2)}
          </div>
        </div>

        {/* Checkout Button */}
        <Button
          disabled={cartItems.length === 0}
          onClick={onOpenCheckout}
          className='w-full h-14 rounded-2xl bg-[#3EEA85] hover:bg-[#3EEA85]/90 text-black font-extrabold text-base flex items-center justify-between px-5 shadow-lg shadow-[#3EEA85]/20 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] transition-all'
        >
          <div className='flex items-center gap-2'>
            <Banknote className='size-5' />
            <span>الدفع وإصدار الفاتورة</span>
          </div>
          <div className='font-mono text-lg font-black'>
            E£ {grandTotal.toFixed(2)}
          </div>
        </Button>
      </div>
    </div>
  )
}
