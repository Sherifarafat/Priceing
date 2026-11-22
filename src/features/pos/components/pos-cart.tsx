import * as React from 'react'
import {
  Plus,
  Minus,
  RotateCcw,
  Percent,
} from 'lucide-react'
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
    <aside className='w-full lg:w-[390px] xl:w-[420px] bg-white border border-[#e8ece8] rounded-[18px] p-5 shadow-[0_4px_18px_rgba(16,32,16,0.024)] flex flex-col justify-between shrink-0 select-none'>
      <div>
        {/* ── Cart Header ── */}
        <div className='flex items-center justify-between pb-4 border-b border-[#e8ece8]'>
          <div>
            <div className='text-[11px] font-extrabold uppercase tracking-[1.5px] text-[#7a827b]'>
              Current order
            </div>
            <h2 className='text-2xl font-black text-[#101410] tracking-tight mt-0.5'>
              سلة الطلب
            </h2>
          </div>

          <div className='flex items-center gap-2'>
            <span className='bg-[#e9f9ec] text-[#19832e] rounded-full px-2.5 py-1 text-[11px] font-black tracking-wide'>
              {totalItemCount} عناصر
            </span>

            {cartItems.length > 0 && (
              <button
                type='button'
                onClick={onClearCart}
                className='size-7 rounded-lg hover:bg-rose-50 text-[#7a827b] hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer'
                title='مسح الكل'
              >
                <RotateCcw className='size-3.5' />
              </button>
            )}
          </div>
        </div>

        {/* ── Cart Items List (Scrollable) ── */}
        <div className='my-4 max-h-[300px] xl:max-h-[340px] overflow-y-auto space-y-1 pr-1'>
          {cartItems.length === 0 ? (
            <div className='text-[#7a827b] text-[13px] text-center py-10 px-3 bg-[#fafbfa] rounded-xl border border-dashed border-[#e8ece8] leading-relaxed'>
              السلة فارغة حالياً.<br />
              اختر منتجاً أو امسح الباركود للبدء.
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.product.id}
                className='grid grid-cols-[1fr_auto] gap-2 py-3 border-b border-[#f0f2f0] items-center'
              >
                {/* Product Info */}
                <div className='min-w-0 pe-2'>
                  <div className='text-[13px] font-extrabold text-[#101410] truncate'>
                    {item.product.name}
                  </div>
                  <div className='text-xs text-[#7a827b] font-mono mt-0.5'>
                    E£ {item.unitPrice.toFixed(2)} للكيلو/القطعة
                  </div>
                </div>

                {/* Controls & Total */}
                <div className='flex items-center gap-3'>
                  <div className='flex items-center gap-1.5 bg-[#f0f3f0] p-1 rounded-lg'>
                    <button
                      type='button'
                      onClick={() => onUpdateQuantity(item.product.id, -1)}
                      className='size-[24px] rounded-[6px] bg-white hover:bg-slate-200 text-[#101410] font-black text-xs flex items-center justify-center active:scale-90 transition-all cursor-pointer'
                    >
                      <Minus className='size-3' />
                    </button>

                    <span className='min-w-[16px] text-center text-xs font-black text-[#101410] font-mono'>
                      {item.quantity}
                    </span>

                    <button
                      type='button'
                      onClick={() => onUpdateQuantity(item.product.id, 1)}
                      className='size-[24px] rounded-[6px] bg-[#00d632] hover:brightness-95 text-[#061006] font-black text-xs flex items-center justify-center active:scale-90 transition-all cursor-pointer'
                    >
                      <Plus className='size-3' />
                    </button>
                  </div>

                  <strong className='font-mono font-black text-xs text-[#111] min-w-[65px] text-right'>
                    E£ {item.total.toFixed(2)}
                  </strong>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Summary & Checkout Button ── */}
      <div className='pt-3 border-t border-[#e8ece8] space-y-2.5'>
        <div className='flex justify-between items-center text-xs text-[#687168]'>
          <span>المجموع الفرعي:</span>
          <strong className='font-mono text-[#101410] font-bold'>
            E£ {subtotal.toFixed(2)}
          </strong>
        </div>

        {/* Quick Discount Toggle */}
        <div className='flex justify-between items-center text-xs text-[#687168]'>
          <button
            type='button'
            onClick={() => setShowDiscountInput(!showDiscountInput)}
            className='text-[#7a827b] hover:text-[#00d632] flex items-center gap-1 text-[11px] font-bold cursor-pointer'
          >
            <Percent className='size-3' />
            <span>{discountPercent > 0 ? `خصم (${discountPercent}%)` : 'إضافة خصم'}</span>
          </button>
          {discountPercent > 0 && (
            <span className='font-mono text-rose-600 font-bold'>
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
                    ? 'bg-[#101410] text-white border-[#101410]'
                    : 'bg-[#f0f3f0] text-[#59635a] border-transparent hover:bg-[#e4e9e4]'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
        )}

        <div className='flex justify-between items-center text-xs text-[#687168]'>
          <span>ضريبة القيمة المضافة ({(vatRate * 100).toFixed(0)}%):</span>
          <strong className='font-mono text-[#101410] font-bold'>
            E£ {taxAmount.toFixed(2)}
          </strong>
        </div>

        {/* Total Row */}
        <div className='flex justify-between items-center text-lg font-black text-[#101410] pt-2 border-t border-[#f0f2f0]'>
          <span>الإجمالي النهائي:</span>
          <span className='font-mono text-xl text-[#101410]'>
            E£ {grandTotal.toFixed(2)}
          </span>
        </div>

        {/* Checkout Button */}
        <button
          type='button'
          disabled={cartItems.length === 0}
          onClick={onOpenCheckout}
          className='w-full bg-[#00d632] hover:brightness-95 text-[#061006] p-4 rounded-[11px] font-black text-base mt-2 shadow-sm active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-between'
        >
          <span>إتمام الطلب وإصدار الإيصال ←</span>
          <span className='font-mono text-lg font-black'>E£ {grandTotal.toFixed(2)}</span>
        </button>

        <div className='text-[10px] text-[#929a92] text-center mt-2 leading-relaxed'>
          No paper. No clutter. Just a smarter way to sell.<br />
          GREEN POS • SMART TERMINAL
        </div>
      </div>
    </aside>
  )
}
