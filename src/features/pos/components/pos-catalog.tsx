import * as React from 'react'
import {
  Barcode,
  Package,
} from 'lucide-react'
import type { Product, Category } from '@/types/saas'
import type { POSCartItem } from '../types'

interface PosCatalogProps {
  products: Product[]
  categories: Category[]
  cartItems: POSCartItem[]
  onAddToCart: (product: Product) => void
}

export function PosCatalog({
  products,
  categories,
  cartItems,
  onAddToCart,
}: PosCatalogProps) {
  const [search, setSearch] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState<string>('ALL')
  const barcodeInputRef = React.useRef<HTMLInputElement>(null)

  // Hardware Barcode Scanner listener
  React.useEffect(() => {
    let buffer = ''
    let lastKeyTime = Date.now()

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in regular text fields other than barcode
      const activeEl = document.activeElement
      if (
        activeEl &&
        activeEl.tagName === 'INPUT' &&
        activeEl !== barcodeInputRef.current &&
        activeEl.getAttribute('type') === 'text'
      ) {
        return
      }

      const currentTime = Date.now()
      const charDiff = currentTime - lastKeyTime
      lastKeyTime = currentTime

      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          const buf = buffer.trim().toLowerCase()
          const cleanBuf = buf.replace(/^0+/, '')
          const matched = products.find((p) => {
            const pb = (p.barcode || '').trim().toLowerCase()
            const pbClean = pb.replace(/^0+/, '')
            return pb === buf || pbClean === cleanBuf || p.id.toLowerCase() === buf
          })
          if (matched) {
            onAddToCart(matched)
            buffer = ''
            if (barcodeInputRef.current) barcodeInputRef.current.value = ''
            return
          }
        }
        buffer = ''
      } else if (e.key.length === 1) {
        // Fast keystrokes under 60ms typical for barcode scanner
        if (charDiff < 60 || buffer.length > 0) {
          buffer += e.key
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [products, onAddToCart])

  // Filter products by category and search
  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === 'ALL' || p.categoryId === selectedCategory
      const query = search.trim().toLowerCase()
      const matchesSearch =
        !query ||
        (p.name || '').toLowerCase().includes(query) ||
        (p.barcode || '').toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [products, selectedCategory, search])

  // Barcode input submit
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!search.trim()) return

    const query = search.trim().toLowerCase()
    const cleanQuery = query.replace(/^0+/, '')
    const matched = products.find((p) => {
      const pb = (p.barcode || '').trim().toLowerCase()
      const pbClean = pb.replace(/^0+/, '')
      return (
        pb === query ||
        pbClean === cleanQuery ||
        (p.name || '').toLowerCase() === query ||
        (p.name || '').toLowerCase().includes(query)
      )
    })
    if (matched) {
      onAddToCart(matched)
      setSearch('')
    }
  }

  return (
    <main className='flex-1 bg-white border border-[#e8ece8] rounded-[18px] p-5 shadow-[0_4px_18px_rgba(16,32,16,0.024)] flex flex-col overflow-hidden min-h-[500px]'>
      {/* ── Top Bar: Eyebrow + Heading + Search ── */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 shrink-0'>
        <div>
          <div className='text-[11px] font-extrabold uppercase tracking-[1.5px] text-[#7a827b]'>
            Point of sale
          </div>
          <h2 className='text-2xl font-black text-[#101410] tracking-tight mt-0.5'>
            قائمة المنتجات
          </h2>
        </div>

        <form onSubmit={handleBarcodeSubmit} className='relative w-full sm:w-[280px]'>
          <Barcode className='size-4 text-[#7a827b] absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none' />
          <input
            ref={barcodeInputRef}
            type='text'
            placeholder='بحث أو مسح باركود...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-full ps-9 pe-3 py-2.5 text-sm border border-[#e8ece8] rounded-[10px] outline-none focus:border-[#00d632] bg-white text-[#101410] transition-colors placeholder:text-[#929a92]'
          />
        </form>
      </div>

      {/* ── Category Filter Pills ── */}
      {categories.length > 0 && (
        <div className='flex items-center gap-2 overflow-x-auto pb-2 mb-4 shrink-0 no-scrollbar'>
          <button
            type='button'
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-2 rounded-[9px] text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-[#101410] text-white shadow-xs'
                : 'bg-[#f2f5f2] text-[#59635a] hover:bg-[#e8ece8]'
            }`}
          >
            الكل ({products.length})
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id
            const count = products.filter((p) => p.categoryId === cat.id).length
            return (
              <button
                key={cat.id}
                type='button'
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-[9px] text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#101410] text-white shadow-xs'
                    : 'bg-[#f2f5f2] text-[#59635a] hover:bg-[#e8ece8]'
                }`}
              >
                {cat.name} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* ── Product Cards Grid (Scrollable) ── */}
      <div className='flex-1 overflow-y-auto pr-1'>
        {filteredProducts.length === 0 ? (
          <div className='text-center py-16 px-4 bg-[#fafbfa] rounded-[14px] border border-dashed border-[#e8ece8] text-[#7a827b] my-auto'>
            <Package className='size-10 mx-auto mb-2 text-[#929a92]' />
            <p className='font-bold text-sm text-[#101410]'>
              لا توجد منتجات مسجلة لهذا المتجر أو الفرع
            </p>
            <p className='text-xs mt-1 text-[#7a827b] max-w-sm mx-auto'>
              تأكد من تحديد الفرع المناسب أو قم بإضافة المنتجات وتعيينها لهذا الفرع من لوحة التحكم
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-3'>
            {filteredProducts.map((prod) => {
              const inCartItem = cartItems.find((i) => i.product.id === prod.id)
              const qtyInCart = inCartItem?.quantity || 0

              return (
                <button
                  key={prod.id}
                  type='button'
                  onClick={() => onAddToCart(prod)}
                  className={`group relative p-3.5 rounded-[14px] border text-left bg-white transition-all hover:border-[#00d632] hover:-translate-y-0.5 hover:shadow-[0_7px_18px_rgba(16,32,16,0.06)] min-h-[145px] flex flex-col justify-between cursor-pointer ${
                    qtyInCart > 0
                      ? 'border-[#00d632] shadow-[0_2px_10px_rgba(0,214,50,0.15)] ring-1 ring-[#00d632]'
                      : 'border-[#e8ece8]'
                  }`}
                >
                  {/* Cart Quantity Badge */}
                  {qtyInCart > 0 && (
                    <span className='absolute -top-2 -right-2 size-6 rounded-full bg-[#00d632] text-[#061006] text-xs font-black flex items-center justify-center shadow-sm ring-2 ring-white'>
                      {qtyInCart}
                    </span>
                  )}

                  <div>
                    {/* Icon container */}
                    <div className='size-12 rounded-[13px] bg-[#f0f8f1] flex items-center justify-center text-2xl mb-2.5 overflow-hidden text-[#101410]'>
                      {prod.imageUrl ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className='w-full h-full object-cover group-hover:scale-105 transition-transform'
                        />
                      ) : (
                        <Package className='size-6 text-[#19832e]' />
                      )}
                    </div>

                    {/* Product Name */}
                    <h3 className='font-extrabold text-sm text-[#101410] line-clamp-2 leading-snug'>
                      {prod.name}
                    </h3>
                  </div>

                  {/* Meta & Price */}
                  <div className='mt-2.5 pt-2 border-t border-[#f0f2f0] flex items-center justify-between'>
                    <span className='text-[11px] text-[#7a827b] font-mono truncate max-w-[90px]'>
                      {prod.barcode || 'بدون باركود'}
                    </span>
                    <strong className='text-sm font-black text-[#111] font-mono'>
                      E£ {prod.price.toFixed(2)}
                    </strong>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
