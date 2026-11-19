import * as React from 'react'
import {
  Barcode,
  Package,
  Plus,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
          const matched = products.find(
            (p) => p.barcode.toLowerCase() === buffer.trim().toLowerCase()
          )
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
        p.name.toLowerCase().includes(query) ||
        p.barcode.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [products, selectedCategory, search])

  // Barcode input submit
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!search.trim()) return

    const matched = products.find(
      (p) =>
        p.barcode.toLowerCase() === search.trim().toLowerCase() ||
        p.name.toLowerCase().includes(search.trim().toLowerCase())
    )
    if (matched) {
      onAddToCart(matched)
      setSearch('')
    }
  }

  return (
    <div className='flex-1 flex flex-col h-full overflow-hidden bg-[#0F0F12] p-4 text-white'>
      {/* ── Top Bar: Search & Barcode Scanner ── */}
      <div className='flex items-center gap-3 mb-4 shrink-0'>
        <form onSubmit={handleBarcodeSubmit} className='relative flex-1'>
          <Barcode className='size-5 text-[#3EEA85] absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none' />
          <Input
            ref={barcodeInputRef}
            placeholder='امسح الباركود بجهاز الاسكانر أو ابحث بالاسم...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='ps-11 h-12 rounded-2xl bg-neutral-900 border-white/10 text-white placeholder:text-neutral-500 focus-visible:border-[#3EEA85] focus-visible:ring-1 focus-visible:ring-[#3EEA85] text-sm font-medium'
          />
        </form>

        <Badge
          variant='outline'
          className='hidden sm:flex h-12 px-3 rounded-2xl border-white/10 bg-neutral-900 text-neutral-400 items-center gap-2 text-xs shrink-0'
        >
          <span className='size-2 rounded-full bg-[#3EEA85] animate-pulse' />
          <span>الاسكانر جاهز</span>
        </Badge>
      </div>

      {/* ── Category Filter Pills ── */}
      <div className='flex items-center gap-2 overflow-x-auto pb-3 mb-3 shrink-0 no-scrollbar'>
        <button
          type='button'
          onClick={() => setSelectedCategory('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
            selectedCategory === 'ALL'
              ? 'bg-[#3EEA85] text-black border-[#3EEA85] shadow-sm'
              : 'bg-neutral-900 text-neutral-300 border-white/10 hover:border-white/20'
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
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                isSelected
                  ? 'bg-[#3EEA85] text-black border-[#3EEA85] shadow-sm'
                  : 'bg-neutral-900 text-neutral-300 border-white/10 hover:border-white/20'
              }`}
            >
              {cat.name} ({count})
            </button>
          )
        })}
      </div>

      {/* ── Product Cards Grid (Scrollable) ── */}
      <div className='flex-1 overflow-y-auto pr-1'>
        {filteredProducts.length === 0 ? (
          <div className='h-64 flex flex-col items-center justify-center text-center text-neutral-500'>
            <Package className='size-12 mb-2 text-neutral-600' />
            <p className='font-bold text-sm'>لا توجد منتجات مطابقة للبحث</p>
            <p className='text-xs mt-1'>تأكد من رقم الباركود أو اختر قسماً آخر</p>
          </div>
        ) : (
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'>
            {filteredProducts.map((prod) => {
              const inCartItem = cartItems.find((i) => i.product.id === prod.id)
              const qtyInCart = inCartItem?.quantity || 0

              return (
                <button
                  key={prod.id}
                  type='button'
                  onClick={() => onAddToCart(prod)}
                  className={`group relative p-3 rounded-2xl border text-left flex flex-col justify-between transition-all duration-150 active:scale-95 ${
                    qtyInCart > 0
                      ? 'bg-neutral-900/90 border-[#3EEA85] shadow-lg shadow-[#3EEA85]/10'
                      : 'bg-neutral-900/70 border-white/10 hover:border-white/25 hover:bg-neutral-900'
                  }`}
                >
                  {/* Cart Quantity Badge */}
                  {qtyInCart > 0 && (
                    <span className='absolute -top-2 -right-2 size-6 rounded-full bg-[#3EEA85] text-black text-xs font-black flex items-center justify-center shadow-md ring-2 ring-[#0F0F12]'>
                      {qtyInCart}
                    </span>
                  )}

                  <div>
                    {/* Image / Icon container */}
                    <div className='w-full aspect-square rounded-xl bg-neutral-800/80 mb-2.5 overflow-hidden flex items-center justify-center border border-white/5 relative'>
                      {prod.imageUrl ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className='w-full h-full object-cover group-hover:scale-105 transition-transform'
                        />
                      ) : (
                        <Package className='size-8 text-neutral-500 group-hover:text-[#3EEA85] transition-colors' />
                      )}

                      {/* Stock badge */}
                      <span className='absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-xs text-[10px] font-mono px-1.5 py-0.5 rounded text-neutral-300'>
                        {prod.stocks ?? 100} متوفر
                      </span>
                    </div>

                    {/* Product Name */}
                    <h3 className='font-bold text-xs text-white line-clamp-2 leading-snug'>
                      {prod.name}
                    </h3>
                  </div>

                  {/* Price & Barcode Footer */}
                  <div className='mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between'>
                    <div>
                      <span className='text-[10px] text-neutral-500 font-mono block'>
                        {prod.barcode}
                      </span>
                      <div className='text-sm font-extrabold text-[#3EEA85] font-mono'>
                        E£ {prod.price.toFixed(2)}
                      </div>
                    </div>

                    <div className='size-7 rounded-xl bg-white/5 group-hover:bg-[#3EEA85] group-hover:text-black flex items-center justify-center text-neutral-400 transition-colors'>
                      <Plus className='size-4' />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
