import * as React from 'react'
import {
  Barcode,
  Package,
  Briefcase,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { useDirection } from '@/context/direction-provider'
import type { Product, Category, ServiceCategory } from '@/types/saas'
import type { POSCartItem } from '../types'

export interface PosSellableService {
  id: string
  name: string
  parentServiceName: string
  categoryId: string
  categoryName: string
  price: number
  description?: string
}

interface PosCatalogProps {
  products: Product[]
  categories: Category[]
  serviceCategories?: ServiceCategory[]
  services?: PosSellableService[]
  cartItems: POSCartItem[]
  onAddToCart: (product: Product) => void
  onAddServiceToCart?: (service: PosSellableService) => void
  onBarcodeNotFound?: (barcode: string) => void
  isScannerPaused?: boolean
}

function normalizeDigits(raw: string): string {
  return raw
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .trim()
}

function extractScannerChar(e: KeyboardEvent): string | null {
  if (e.ctrlKey || e.altKey || e.metaKey) return null
  if (
    e.key === 'Shift' ||
    e.key === 'Control' ||
    e.key === 'Alt' ||
    e.key === 'Meta' ||
    e.key === 'CapsLock' ||
    e.key === 'Dead'
  ) {
    return null
  }
  // Prefer physical key code for digits & Latin letters so scanning works even when Windows keyboard is Arabic
  if (e.code?.startsWith('Digit') && e.code.length === 6 && !e.shiftKey) {
    return e.code[5]
  }
  if (e.code?.startsWith('Numpad') && e.code.length === 7 && /\d/.test(e.code[6])) {
    return e.code[6]
  }
  if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
    return e.shiftKey ? '_' : '-'
  }
  if (e.key && e.key.length === 1) {
    const normalized = normalizeDigits(e.key)
    if (/^[a-zA-Z0-9\-_./]$/.test(normalized)) {
      return normalized
    }
  }
  if (e.code?.startsWith('Key') && e.code.length === 4) {
    const letter = e.code[3]
    return e.shiftKey ? letter.toUpperCase() : letter.toLowerCase()
  }
  return null
}

export function PosCatalog({
  products,
  categories,
  serviceCategories = [],
  services = [],
  cartItems,
  onAddToCart,
  onAddServiceToCart,
  onBarcodeNotFound,
  isScannerPaused = false,
}: PosCatalogProps) {
  const { dir } = useDirection()
  const isAr = dir === 'rtl'
  const [catalogMode, setCatalogMode] = React.useState<'PRODUCTS' | 'SERVICES'>('PRODUCTS')
  const [search, setSearch] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState<string>('ALL')
  const barcodeInputRef = React.useRef<HTMLInputElement>(null)
  const autoScanTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastHandledScanRef = React.useRef<{ code: string; at: number }>({ code: '', at: 0 })

  const handleSwitchMode = (next: 'PRODUCTS' | 'SERVICES') => {
    setCatalogMode(next)
    setSelectedCategory('ALL')
    setSearch('')
  }

  const findProductByBarcode = React.useCallback(
    (rawCode: string): Product | undefined => {
      const code = normalizeDigits(rawCode).toLowerCase()
      if (!code) return undefined
      const cleanCode = code.replace(/^0+/, '')
      return products.find((p) => {
        const pb = normalizeDigits(p.barcode || '').toLowerCase()
        const pbClean = pb.replace(/^0+/, '')
        return (
          (pb && pb === code) ||
          (pbClean && cleanCode && pbClean === cleanCode) ||
          p.id.toLowerCase() === code
        )
      })
    },
    [products]
  )

  const commitScannedBarcode = React.useCallback(
    (rawCode: string, notifyNotFound = false): boolean => {
      const normalized = normalizeDigits(rawCode)
      if (normalized.length < 2) return false

      const now = Date.now()
      // Prevent duplicate trigger from keydown + form submit on the exact same scan event
      if (
        lastHandledScanRef.current.code === normalized &&
        now - lastHandledScanRef.current.at < 180
      ) {
        return true
      }

      const matched = findProductByBarcode(normalized)
      if (matched) {
        lastHandledScanRef.current = { code: normalized, at: now }
        onAddToCart(matched)
        setSearch('')
        toast.success(isAr ? `تمت الإضافة: ${matched.name}` : `Added: ${matched.name}`, {
          duration: 1500,
        })
        return true
      }

      if (notifyNotFound) {
        lastHandledScanRef.current = { code: normalized, at: now }
        setSearch('')
        onBarcodeNotFound?.(normalized)
      }
      return false
    },
    [findProductByBarcode, onAddToCart, onBarcodeNotFound]
  )

  // Global Hardware Barcode Scanner listener (CAPTURE phase):
  // Works from ANYWHERE on the POS screen without needing to focus the search input,
  // with or without Enter/Tab suffix, and even when Windows keyboard is set to Arabic.
  React.useEffect(() => {
    if (isScannerPaused) return

    let buffer = ''
    let fastKeystrokes = 0
    let lastKeyTime = 0
    let burstTimer: ReturnType<typeof setTimeout> | null = null

    const clearBurstTimer = () => {
      if (burstTimer) {
        clearTimeout(burstTimer)
        burstTimer = null
      }
    }

    const resetBuffer = () => {
      buffer = ''
      fastKeystrokes = 0
      clearBurstTimer()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null
      const isInSearchInput = activeEl === barcodeInputRef.current
      const isInOtherTextInput = Boolean(
        activeEl &&
          !isInSearchInput &&
          (activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            activeEl.isContentEditable)
      )

      if (isInOtherTextInput) return

      // Ignore pure modifier keys without resetting lastKeyTime
      if (
        e.key === 'Shift' ||
        e.key === 'Control' ||
        e.key === 'Alt' ||
        e.key === 'Meta' ||
        e.key === 'CapsLock'
      ) {
        return
      }

      // Scanner terminator key (Enter or Tab)
      if (e.key === 'Enter' || e.key === 'Tab') {
        const candidate =
          buffer.length >= 2
            ? buffer
            : isInSearchInput && barcodeInputRef.current
              ? barcodeInputRef.current.value
              : ''

        if (candidate.trim().length >= 2) {
          const exactMatch = findProductByBarcode(candidate)
          if (exactMatch) {
            e.preventDefault()
            e.stopPropagation()
            commitScannedBarcode(candidate, false)
            resetBuffer()
            return
          }
          // Outside search input, any scanned barcode ended with Enter/Tab should notify if not found
          // and MUST NOT accidentally click whatever button happened to be focused
          if (!isInSearchInput || fastKeystrokes >= 2) {
            e.preventDefault()
            e.stopPropagation()
            commitScannedBarcode(candidate, true)
            resetBuffer()
            return
          }
        }
        resetBuffer()
        return
      }

      const ch = extractScannerChar(e)
      if (!ch) return

      // If focus is on a <select> (e.g. Branch dropdown) or <button>, prevent hijacking
      if (activeEl && activeEl.tagName === 'SELECT') {
        activeEl.blur()
      }

      const now = Date.now()
      const charDiff = lastKeyTime > 0 ? now - lastKeyTime : 999
      lastKeyTime = now

      // Outside search input use a generous 500ms window so USB & slower Bluetooth scanners never break mid-code
      const resetGapMs = isInSearchInput ? 180 : 500
      if (charDiff > resetGapMs) {
        buffer = ch
        fastKeystrokes = 0
      } else {
        buffer += ch
        if (charDiff < 120) {
          fastKeystrokes++
        }
      }

      // Support scanners that do NOT send Enter/Tab at the end:
      // once characters stop arriving (160ms silence), auto-add if it matches an exact barcode
      clearBurstTimer()
      if (buffer.length >= 3 && (!isInSearchInput || fastKeystrokes >= 2)) {
        const snapshot = buffer
        burstTimer = setTimeout(() => {
          if (findProductByBarcode(snapshot)) {
            commitScannedBarcode(snapshot, false)
          }
          resetBuffer()
        }, 160)
      }
    }

    // Use capture phase (true) so focused buttons never swallow Enter/Space during a barcode scan
    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      clearBurstTimer()
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [isScannerPaused, findProductByBarcode, commitScannedBarcode])

  // Also auto-add if user pastes or scans directly into the search input without Enter
  React.useEffect(() => {
    if (autoScanTimerRef.current) {
      clearTimeout(autoScanTimerRef.current)
      autoScanTimerRef.current = null
    }
    const trimmed = normalizeDigits(search)
    if (trimmed.length < 3) return

    const exact = findProductByBarcode(trimmed)
    if (!exact) return

    // Brief 140ms wait so longer barcodes sharing a prefix finish typing before auto-adding
    autoScanTimerRef.current = setTimeout(() => {
      commitScannedBarcode(trimmed, false)
    }, 140)

    return () => {
      if (autoScanTimerRef.current) {
        clearTimeout(autoScanTimerRef.current)
        autoScanTimerRef.current = null
      }
    }
  }, [search, findProductByBarcode, commitScannedBarcode])

  // Filter products by category and search
  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === 'ALL' || p.categoryId === selectedCategory
      const query = normalizeDigits(search).toLowerCase()
      const matchesSearch =
        !query ||
        (p.name || '').toLowerCase().includes(query) ||
        normalizeDigits(p.barcode || '').toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [products, selectedCategory, search])

  const filteredServices = React.useMemo(() => {
    const query = search.trim().toLowerCase()
    return services.filter((svc) => {
      const matchesCategory = selectedCategory === 'ALL' || svc.categoryId === selectedCategory
      const matchesSearch =
        !query ||
        svc.name.toLowerCase().includes(query) ||
        svc.parentServiceName.toLowerCase().includes(query) ||
        svc.categoryName.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [services, selectedCategory, search])

  // Barcode input submit (Enter key in search box)
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!search.trim()) return

    if (catalogMode === 'SERVICES') {
      const firstSvc = filteredServices[0]
      if (firstSvc && onAddServiceToCart) {
        onAddServiceToCart(firstSvc)
        setSearch('')
      }
      return
    }

    if (commitScannedBarcode(search, false)) return

    // Fallback: match by product name if user manually typed a name and pressed Enter
    const query = search.trim().toLowerCase()
    const matched = products.find(
      (p) =>
        (p.name || '').toLowerCase() === query ||
        (p.name || '').toLowerCase().includes(query)
    )
    if (matched) {
      onAddToCart(matched)
      setSearch('')
    } else {
      onBarcodeNotFound?.(search.trim())
    }
  }

  return (
    <main className='h-full min-h-0 bg-white dark:bg-[#1E1F20] border border-[#e8ece8] dark:border-neutral-800 rounded-[18px] p-4 sm:p-5 shadow-[0_4px_18px_rgba(16,32,16,0.024)] dark:shadow-none flex flex-col overflow-hidden transition-colors'>
      {/* ── Top Bar: Products/Services Switch + Heading + Search ── */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0'>
        <div className='flex items-center gap-3 flex-wrap'>
          <div>
            <div className='text-[11px] font-extrabold uppercase tracking-[1.5px] text-[#7a827b] dark:text-neutral-400'>
              {isAr ? 'نقطة البيع' : 'Point of sale'}
            </div>
            <h2 className='text-xl sm:text-2xl font-black text-[#101410] dark:text-neutral-100 tracking-tight mt-0.5'>
              {catalogMode === 'PRODUCTS'
                ? isAr
                  ? 'قائمة المنتجات'
                  : 'Products Catalog'
                : isAr
                  ? 'قائمة الخدمات'
                  : 'Services Catalog'}
            </h2>
          </div>

          {/* Segmented Products <-> Services Switch */}
          <div className='inline-flex items-center p-1 rounded-[12px] bg-[#f2f5f2] dark:bg-[#282A2C] border border-[#e8ece8] dark:border-neutral-800'>
            <button
              type='button'
              onClick={() => handleSwitchMode('PRODUCTS')}
              className={`h-8 px-3 rounded-[9px] text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                catalogMode === 'PRODUCTS'
                  ? 'bg-[#101410] text-white dark:bg-white dark:text-black shadow-xs'
                  : 'text-[#59635a] dark:text-neutral-300 hover:text-[#101410] dark:hover:text-white'
              }`}
            >
              <Package className='size-3.5' />
              <span>{isAr ? 'المنتجات' : 'Products'}</span>
              <span className='font-mono text-[10px] opacity-75'>({products.length})</span>
            </button>
            <button
              type='button'
              onClick={() => handleSwitchMode('SERVICES')}
              className={`h-8 px-3 rounded-[9px] text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                catalogMode === 'SERVICES'
                  ? 'bg-[#101410] text-white dark:bg-white dark:text-black shadow-xs'
                  : 'text-[#59635a] dark:text-neutral-300 hover:text-[#101410] dark:hover:text-white'
              }`}
            >
              <Briefcase className='size-3.5' />
              <span>{isAr ? 'الخدمات' : 'Services'}</span>
              <span className='font-mono text-[10px] opacity-75'>({services.length})</span>
            </button>
          </div>
        </div>

        <div className='flex items-center gap-2 w-full sm:w-auto'>
          {catalogMode === 'PRODUCTS' && (
            <span
              className='hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[9px] bg-[#f2f5f2] dark:bg-[#282A2C] border border-[#e8ece8] dark:border-neutral-800 text-[11px] font-bold text-[#101410] dark:text-neutral-200 shrink-0'
              title={
                isAr
                  ? 'يمكنك مسح أي باركود بالاسكانر مباشرة في أي وقت بدون الوقوف في خانة البحث'
                  : 'Scan any barcode anytime — no need to focus the search box'
              }
            >
              <span className='size-2 rounded-full bg-[#00d632] dark:bg-white animate-pulse' />
              <span>{isAr ? 'الاسكانر جاهز' : 'Scanner Ready'}</span>
            </span>
          )}
          <form onSubmit={handleBarcodeSubmit} className='relative w-full sm:w-[240px]'>
            {catalogMode === 'PRODUCTS' ? (
              <Barcode className='size-4 text-[#7a827b] dark:text-neutral-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none' />
            ) : (
              <Search className='size-4 text-[#7a827b] dark:text-neutral-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none' />
            )}
            <input
              ref={barcodeInputRef}
              type='text'
              placeholder={
                catalogMode === 'PRODUCTS'
                  ? isAr
                    ? 'بحث أو مسح باركود...'
                    : 'Search or scan barcode...'
                  : isAr
                    ? 'ابحث عن خدمة...'
                    : 'Search services...'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='w-full ps-9 pe-3 py-2.5 text-sm border border-[#e8ece8] dark:border-neutral-800 rounded-[10px] outline-none focus:border-[#00d632] dark:focus:border-neutral-400 bg-white dark:bg-[#242628] text-[#101410] dark:text-neutral-100 transition-colors placeholder:text-[#929a92] dark:placeholder:text-neutral-500'
            />
          </form>
        </div>
      </div>

      {/* ── Portal-Driven Category Filter Pills (Products OR Services) ── */}
      {catalogMode === 'PRODUCTS' && categories.length > 0 && (
        <div className='flex items-center gap-2 overflow-x-auto pb-2 mb-3 shrink-0 no-scrollbar'>
          <button
            type='button'
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-2 rounded-[9px] text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-[#101410] text-white dark:bg-white dark:text-black shadow-xs'
                : 'bg-[#f2f5f2] dark:bg-[#282A2C] text-[#59635a] dark:text-neutral-300 hover:bg-[#e8ece8] dark:hover:bg-[#323538]'
            }`}
          >
            {isAr ? `الكل (${products.length})` : `All (${products.length})`}
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
                    ? 'bg-[#101410] text-white dark:bg-white dark:text-black shadow-xs'
                    : 'bg-[#f2f5f2] dark:bg-[#282A2C] text-[#59635a] dark:text-neutral-300 hover:bg-[#e8ece8] dark:hover:bg-[#323538]'
                }`}
              >
                {cat.name} ({count})
              </button>
            )
          })}
        </div>
      )}

      {catalogMode === 'SERVICES' && serviceCategories.length > 0 && (
        <div className='flex items-center gap-2 overflow-x-auto pb-2 mb-3 shrink-0 no-scrollbar'>
          <button
            type='button'
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-2 rounded-[9px] text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-[#101410] text-white dark:bg-white dark:text-black shadow-xs'
                : 'bg-[#f2f5f2] dark:bg-[#282A2C] text-[#59635a] dark:text-neutral-300 hover:bg-[#e8ece8] dark:hover:bg-[#323538]'
            }`}
          >
            {isAr ? `الكل (${services.length})` : `All (${services.length})`}
          </button>

          {serviceCategories.map((cat) => {
            const isSelected = selectedCategory === cat.id
            const count = services.filter((s) => s.categoryId === cat.id).length
            return (
              <button
                key={cat.id}
                type='button'
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-[9px] text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#101410] text-white dark:bg-white dark:text-black shadow-xs'
                    : 'bg-[#f2f5f2] dark:bg-[#282A2C] text-[#59635a] dark:text-neutral-300 hover:bg-[#e8ece8] dark:hover:bg-[#323538]'
                }`}
              >
                {cat.name} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* ── Cards Grid (Scrollable — 5 items per row for BOTH Products & Services) ── */}
      <div className='flex-1 min-h-0 overflow-y-auto pe-1 pb-1'>
        {catalogMode === 'SERVICES' ? (
          filteredServices.length === 0 ? (
            <div className='text-center py-16 px-4 bg-[#fafbfa] dark:bg-[#242628] rounded-[14px] border border-dashed border-[#e8ece8] dark:border-neutral-800 text-[#7a827b] dark:text-neutral-400 my-auto'>
              <Briefcase className='size-10 mx-auto mb-2 text-[#929a92] dark:text-neutral-500' />
              <p className='font-bold text-sm text-[#101410] dark:text-neutral-100'>
                {isAr ? 'لا توجد خدمات مسجلة في هذا التصنيف' : 'No services found in this category'}
              </p>
              <p className='text-xs mt-1 text-[#7a827b] dark:text-neutral-400 max-w-sm mx-auto'>
                {isAr
                  ? 'يمكنك إضافة الخدمات وتصنيفاتها من الداشبورد ← الخدمات'
                  : 'Add services & categories from Dashboard → Services'}
              </p>
            </div>
          ) : (
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5 pt-2'>
              {filteredServices.map((svc) => {
                const cartKey = `svc-${svc.id}`
                const inCartItem = cartItems.find((i) => i.product.id === cartKey)
                const qtyInCart = inCartItem?.quantity || 0

                return (
                  <button
                    key={svc.id}
                    type='button'
                    onClick={() => onAddServiceToCart?.(svc)}
                    className={`group relative p-3 rounded-[13px] border text-start bg-white dark:bg-[#242628] transition-all hover:border-[#00d632] dark:hover:border-neutral-500 hover:-translate-y-0.5 hover:shadow-[0_7px_18px_rgba(16,32,16,0.06)] dark:hover:shadow-none flex flex-col justify-between cursor-pointer min-h-[148px] ${
                      qtyInCart > 0
                        ? 'border-[#00d632] dark:border-white shadow-[0_2px_10px_rgba(0,214,50,0.15)] dark:shadow-none ring-1 ring-[#00d632] dark:ring-white'
                        : 'border-[#e8ece8] dark:border-neutral-800'
                    }`}
                  >
                    {qtyInCart > 0 && (
                      <span className='absolute -top-2 -end-2 z-10 size-6 rounded-full bg-[#00d632] dark:bg-white text-[#061006] dark:text-black text-xs font-black flex items-center justify-center shadow-sm ring-2 ring-white dark:ring-[#1E1F20]'>
                        {qtyInCart}
                      </span>
                    )}

                    <div className='w-full space-y-1.5'>
                      <div className='flex items-center justify-between gap-1'>
                        <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#f2f5f2] dark:bg-[#282A2C] text-[10px] font-bold text-[#59635a] dark:text-neutral-300 truncate max-w-full'>
                          <Briefcase className='size-3 shrink-0' />
                          <span className='truncate'>{svc.categoryName}</span>
                        </span>
                      </div>

                      <h3 className='font-extrabold text-xs text-[#101410] dark:text-neutral-100 line-clamp-2 leading-snug'>
                        {svc.name}
                      </h3>

                      {svc.description && (
                        <p className='text-[10px] text-[#7a827b] dark:text-neutral-400 line-clamp-2 leading-relaxed'>
                          {svc.description}
                        </p>
                      )}
                    </div>

                    <div className='w-full mt-2 pt-2 border-t border-[#f0f2f0] dark:border-neutral-800/80 flex items-center justify-between gap-1'>
                      <span className='text-[9.5px] text-[#7a827b] dark:text-neutral-400 truncate max-w-[85px]'>
                        {svc.parentServiceName}
                      </span>
                      <strong className='text-xs font-black text-[#111] dark:text-white font-mono shrink-0' dir='ltr'>
                        E£ {svc.price.toFixed(2)}
                      </strong>
                    </div>
                  </button>
                )
              })}
            </div>
          )
        ) : filteredProducts.length === 0 ? (
          <div className='text-center py-16 px-4 bg-[#fafbfa] dark:bg-[#242628] rounded-[14px] border border-dashed border-[#e8ece8] dark:border-neutral-800 text-[#7a827b] dark:text-neutral-400 my-auto'>
            <Package className='size-10 mx-auto mb-2 text-[#929a92] dark:text-neutral-500' />
            <p className='font-bold text-sm text-[#101410] dark:text-neutral-100'>
              {isAr ? 'لا توجد منتجات مسجلة لهذا المتجر أو الفرع' : 'No products found for this store or branch'}
            </p>
            <p className='text-xs mt-1 text-[#7a827b] dark:text-neutral-400 max-w-sm mx-auto'>
              {isAr
                ? 'تأكد من تحديد الفرع المناسب أو قم بإضافة المنتجات من لوحة التحكم'
                : 'Make sure the right branch is selected or add products from the dashboard'}
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5 pt-2'>
            {filteredProducts.map((prod) => {
              const inCartItem = cartItems.find((i) => i.product.id === prod.id)
              const qtyInCart = inCartItem?.quantity || 0

              return (
                <button
                  key={prod.id}
                  type='button'
                  onClick={() => onAddToCart(prod)}
                  className={`group relative p-2.5 rounded-[13px] border text-start bg-white dark:bg-[#242628] transition-all hover:border-[#00d632] dark:hover:border-neutral-500 hover:-translate-y-0.5 hover:shadow-[0_7px_18px_rgba(16,32,16,0.06)] dark:hover:shadow-none flex flex-col justify-between cursor-pointer ${
                    qtyInCart > 0
                      ? 'border-[#00d632] dark:border-white shadow-[0_2px_10px_rgba(0,214,50,0.15)] dark:shadow-none ring-1 ring-[#00d632] dark:ring-white'
                      : 'border-[#e8ece8] dark:border-neutral-800'
                  }`}
                >
                  {/* Cart Quantity Badge */}
                  {qtyInCart > 0 && (
                    <span className='absolute -top-2 -end-2 z-10 size-6 rounded-full bg-[#00d632] dark:bg-white text-[#061006] dark:text-black text-xs font-black flex items-center justify-center shadow-sm ring-2 ring-white dark:ring-[#1E1F20]'>
                      {qtyInCart}
                    </span>
                  )}

                  <div className='w-full'>
                    {/* Product Image */}
                    <div className='w-full h-20 rounded-[10px] bg-[#f4f7f4] dark:bg-[#1e231f] flex items-center justify-center mb-2 overflow-hidden text-[#101410] dark:text-neutral-200 border border-[#edf1ed] dark:border-neutral-800'>
                      {prod.imageUrl ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          loading='lazy'
                          className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                        />
                      ) : (
                        <Package className='size-6 text-[#19832e]/70 dark:text-neutral-400' />
                      )}
                    </div>

                    {/* Product Name */}
                    <h3 className='font-extrabold text-xs text-[#101410] dark:text-neutral-100 line-clamp-2 leading-snug min-h-[2.1rem]'>
                      {prod.name}
                    </h3>
                  </div>

                  {/* Meta & Price */}
                  <div className='w-full mt-1.5 pt-1.5 border-t border-[#f0f2f0] dark:border-neutral-800/80 flex items-center justify-between gap-1'>
                    <span className='text-[9px] text-[#7a827b] dark:text-neutral-500 font-mono truncate max-w-[70px]'>
                      {prod.barcode || (isAr ? 'بدون باركود' : 'No code')}
                    </span>
                    <strong className='text-xs font-black text-[#111] dark:text-white font-mono shrink-0' dir='ltr'>
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
