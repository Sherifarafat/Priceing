import * as React from 'react'
import {
  Plus,
  Minus,
  RotateCcw,
  Percent,
} from 'lucide-react'
import { useDirection } from '@/context/direction-provider'
import type { POSCartItem } from '../types'

interface PosCartProps {
  cartItems: POSCartItem[]
  onUpdateQuantity: (productId: string, delta: number) => void
  onRemoveItem?: (productId: string) => void
  onClearCart: () => void
  onOpenCheckout: () => void
  vatRate?: number
}

export function PosCart({
  cartItems,
  onUpdateQuantity,
  onRemoveItem: _onRemoveItem,
  onClearCart,
  onOpenCheckout,
  vatRate = 0.14,
}: PosCartProps) {
  const { dir } = useDirection()
  const isAr = dir === 'rtl'
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
    <aside className='w-full lg:w-[390px] xl:w-[420px] h-full min-h-0 bg-white dark:bg-[#1E1F20] border border-[#e8ece8] dark:border-neutral-800 rounded-[18px] p-4 sm:p-5 shadow-[0_4px_18px_rgba(16,32,16,0.024)] dark:shadow-none flex flex-col overflow-hidden shrink-0 select-none transition-colors'>
      {/* ── Cart Top Bar (Compact — count + clear only, no "سلة الطلب" title) ── */}
      <div className='shrink-0 flex items-center justify-between pb-3 border-b border-[#e8ece8] dark:border-neutral-800'>
        <span className='bg-[#e9f9ec] dark:bg-neutral-800 text-[#19832e] dark:text-neutral-200 rounded-full px-3 py-1 text-xs font-black tracking-wide'>
          {isAr ? `${totalItemCount} عناصر` : `${totalItemCount} ${totalItemCount === 1 ? 'item' : 'items'}`}
        </span>

        {cartItems.length > 0 && (
          <button
            type='button'
            onClick={onClearCart}
            className='h-7 px-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-[#7a827b] dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 text-[11px] font-bold transition-colors cursor-pointer'
            title={isAr ? 'مسح الكل' : 'Clear all'}
          >
            <RotateCcw className='size-3.5' />
            <span>{isAr ? 'مسح' : 'Clear'}</span>
          </button>
        )}
      </div>

      {/* ── Cart Items List (Full Flex Scrollable) ── */}
      <div className='flex-1 min-h-0 my-3 overflow-y-auto space-y-1 pe-1'>
        {cartItems.length === 0 ? (
          <div className='h-full min-h-[160px] flex items-center justify-center text-[#7a827b] dark:text-neutral-400 text-[13px] text-center py-10 px-3 bg-[#fafbfa] dark:bg-[#242628] rounded-xl border border-dashed border-[#e8ece8] dark:border-neutral-800 leading-relaxed'>
            <span>
              {isAr ? (
                <>
                  السلة فارغة حالياً.<br />
                  اختر منتجاً أو امسح الباركود للبدء.
                </>
              ) : (
                <>
                  Cart is currently empty.<br />
                  Select a product or scan a barcode to start.
                </>
              )}
            </span>
          </div>
        ) : (
          cartItems.map((item) => (
            <div
              key={item.product.id}
              className='grid grid-cols-[1fr_auto] gap-2 py-3 border-b border-[#f0f2f0] dark:border-neutral-800/80 items-center'
            >
              {/* Product Info */}
              <div className='min-w-0 pe-2'>
                <div className='text-[13px] font-extrabold text-[#101410] dark:text-neutral-100 truncate'>
                  {item.product.name}
                </div>
                <div className='text-xs text-[#7a827b] dark:text-neutral-400 font-mono mt-0.5'>
                  E£ {item.unitPrice.toFixed(2)} {isAr ? 'للقطعة' : 'each'}
                </div>
              </div>

              {/* Controls & Total */}
              <div className='flex items-center gap-3'>
                <div className='flex items-center gap-1.5 bg-[#f0f3f0] dark:bg-[#282A2C] p-1 rounded-lg'>
                  <button
                    type='button'
                    onClick={() => onUpdateQuantity(item.product.id, -1)}
                    className='size-[24px] rounded-[6px] bg-white dark:bg-[#2a302b] hover:bg-slate-200 dark:hover:bg-[#353d36] text-[#101410] dark:text-neutral-100 font-black text-xs flex items-center justify-center active:scale-90 transition-all cursor-pointer'
                  >
                    <Minus className='size-3' />
                  </button>

                  <span className='min-w-[16px] text-center text-xs font-black text-[#101410] dark:text-neutral-100 font-mono'>
                    {item.quantity}
                  </span>

                  <button
                    type='button'
                    onClick={() => onUpdateQuantity(item.product.id, 1)}
                    className='size-[24px] rounded-[6px] bg-[#00d632] dark:bg-white hover:brightness-95 dark:hover:bg-neutral-200 text-[#061006] dark:text-black font-black text-xs flex items-center justify-center active:scale-90 transition-all cursor-pointer'
                  >
                    <Plus className='size-3' />
                  </button>
                </div>

                <strong className='font-mono font-black text-xs text-[#111] dark:text-white min-w-[65px] text-end' dir='ltr'>
                  E£ {item.total.toFixed(2)}
                </strong>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Summary & Checkout Button (Pinned Bottom) ── */}
      <div className='shrink-0 pt-3 border-t border-[#e8ece8] dark:border-neutral-800 space-y-2.5'>
        <div className='flex justify-between items-center text-xs text-[#687168] dark:text-neutral-400'>
          <span>{isAr ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
          <strong className='font-mono text-[#101410] dark:text-neutral-100 font-bold' dir='ltr'>
            E£ {subtotal.toFixed(2)}
          </strong>
        </div>

        {/* Quick Discount Toggle */}
        <div className='flex justify-between items-center text-xs text-[#687168] dark:text-neutral-400'>
          <button
            type='button'
            onClick={() => setShowDiscountInput(!showDiscountInput)}
            className='text-[#7a827b] dark:text-neutral-400 hover:text-[#00d632] dark:hover:text-white flex items-center gap-1 text-[11px] font-bold cursor-pointer'
          >
            <Percent className='size-3' />
            <span>
              {discountPercent > 0
                ? isAr
                  ? `خصم (${discountPercent}%)`
                  : `Discount (${discountPercent}%)`
                : isAr
                  ? 'إضافة خصم'
                  : 'Add Discount'}
            </span>
          </button>
          {discountPercent > 0 && (
            <span className='font-mono text-rose-600 dark:text-rose-400 font-bold' dir='ltr'>
              - E£ {discountAmount.toFixed(2)}
            </span>
          )}
        </div>

        {showDiscountInput && (
          <div className='flex items-center gap-1.5 pt-1'>
            {[5, 10, 15, 20].map((pct) => (
              <button
                key={pct}
                type='button'
                onClick={() => {
                  setDiscountPercent(discountPercent === pct ? 0 : pct)
                }}
                className={`flex-1 py-1 rounded-[7px] text-[10px] font-bold border transition-all cursor-pointer ${
                  discountPercent === pct
                    ? 'bg-[#101410] text-white border-[#101410] dark:bg-white dark:text-black dark:border-white'
                    : 'bg-[#f0f3f0] dark:bg-[#282A2C] text-[#59635a] dark:text-neutral-300 border-transparent hover:bg-[#e4e9e4] dark:hover:bg-[#262c27]'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
        )}

        <div className='flex justify-between items-center text-xs text-[#687168] dark:text-neutral-400'>
          <span>
            {isAr
              ? `ضريبة القيمة المضافة (${(vatRate * 100).toFixed(0)}%):`
              : `VAT (${(vatRate * 100).toFixed(0)}%):`}
          </span>
          <strong className='font-mono text-[#101410] dark:text-neutral-100 font-bold' dir='ltr'>
            E£ {taxAmount.toFixed(2)}
          </strong>
        </div>

        {/* Total Row */}
        <div className='flex justify-between items-center text-lg font-black text-[#101410] dark:text-white pt-2 border-t border-[#f0f2f0] dark:border-neutral-800/80'>
          <span>{isAr ? 'الإجمالي النهائي:' : 'Grand Total:'}</span>
          <span className='font-mono text-xl text-[#101410] dark:text-white' dir='ltr'>
            E£ {grandTotal.toFixed(2)}
          </span>
        </div>

        {/* Checkout Button (Clean text only — no price, no footer text underneath) */}
        <button
          type='button'
          disabled={cartItems.length === 0}
          onClick={onOpenCheckout}
          className='w-full bg-[#00d632] hover:brightness-95 text-[#061006] p-4 rounded-[11px] font-black text-base mt-2 shadow-sm active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center'
        >
          <span>{isAr ? 'إتمام الطلب' : 'Complete Order'}</span>
        </button>
      </div>
    </aside>
  )
}
