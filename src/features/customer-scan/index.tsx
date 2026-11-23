import * as React from 'react'
import {
  Camera,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  AlertCircle,
  AlertTriangle,
  Store,
  X,
  XCircle,
  Search,
  Maximize2,
  Minimize2,
  Loader2,
} from 'lucide-react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSaaSStore } from '@/lib/saas-store'
import { Branch, Merchant, Product, ShoppingItem } from '@/types/saas'

interface CustomerScanViewProps {
  qrToken?: string
  merchantId?: string
}

// ─── Beep & Haptics ─────────────────────────────────────────────────────────
function playBeep() {
  // 1. Mobile Haptic Feedback (Vibration)
  try {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(70)
    }
  } catch { /* ignore */ }

  // 2. High-volume, crisp POS barcode scanner beep
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (AudioCtx) {
      const ctx = new AudioCtx()
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(2350, ctx.currentTime) // High-pitch crisp tone (like supermarket/Honeywell scanners)
      gain.gain.setValueAtTime(0.85, ctx.currentTime)      // Loud volume (was 0.18)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.14)
    }
  } catch { /* ignore */ }
}

const SCAN_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.QR_CODE,
]

const CAM_DIV_ID = 'barcode-camera-feed'

export function CustomerScanView({ qrToken, merchantId }: CustomerScanViewProps) {
  const { branches, merchants, products, recordCustomerScan, recordShoppingSession } =
    useSaaSStore()

  // Detect device language for Add to Cart button label
  const isArabicDevice = React.useMemo(() => {
    if (typeof navigator === 'undefined') return false
    const lang = (navigator.language || navigator.languages?.[0] || '').toLowerCase()
    return lang.startsWith('ar')
  }, [])

  const currencyLabel = 'LE'

  // Live catalog fetched directly from public backend API (essential for mobile devices with empty localStorage)
  const [liveMerchants, setLiveMerchants] = React.useState<Merchant[]>([])
  const [liveBranches, setLiveBranches] = React.useState<Branch[]>([])
  const [liveProducts, setLiveProducts] = React.useState<Product[]>([])

  React.useEffect(() => {
    let cancelled = false
    fetch('/api/scan/catalog')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        if (Array.isArray(data.merchants) && data.merchants.length > 0) setLiveMerchants(data.merchants)
        if (Array.isArray(data.branches) && data.branches.length > 0) setLiveBranches(data.branches)
        if (Array.isArray(data.products) && data.products.length > 0) setLiveProducts(data.products)
      })
      .catch(() => {
        // Offline / fallback to store
      })
    return () => {
      cancelled = true
    }
  }, [])

  const activeBranches = liveBranches.length > 0 ? liveBranches : branches
  const activeMerchants = liveMerchants.length > 0 ? liveMerchants : merchants
  const activeProducts = liveProducts.length > 0 ? liveProducts : products

  const defaultBranch: Branch = {
    id: 'branch-17951314',
    merchantId: 'a76d5225-c63d-4e8f-a74b-65baa4742ba1',
    name: 'Cairo Branch',
    address: 'Cairo, Egypt',
    qrToken: 'cairo-token',
    qrStatus: 'Active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  }
  const defaultMerchant: Merchant = {
    id: 'a76d5225-c63d-4e8f-a74b-65baa4742ba1',
    name: 'Karome',
    status: 'Active',
    currencyId: 'curr-egp',
    merchantTypeId: 'type-1',
    email: 'contact@karome.com',
    phone: '+20 100 000 0000',
    address: 'Cairo, Egypt',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  }

  const explicitMerchant = merchantId
    ? activeMerchants.find((m) => m.id === merchantId) || null
    : null

  const branch =
    (qrToken ? activeBranches.find((b) => b.qrToken === qrToken) : null) ||
    (merchantId ? activeBranches.find((b) => b.merchantId === merchantId) : null) ||
    (merchantId
      ? {
          ...defaultBranch,
          id: `store-${merchantId}`,
          merchantId,
          name: explicitMerchant?.name || 'Main Store',
        }
      : activeBranches[0] || defaultBranch)

  const merchant =
    explicitMerchant ||
    (branch ? activeMerchants.find((m) => m.id === branch.merchantId) : null) ||
    activeMerchants[0] ||
    defaultMerchant

  const isMerchantScoped = Boolean(qrToken || merchantId)

  const storageKey = `guest_shopping_session_${branch?.id || 'unknown'}`

  // ── UI state ────────────────────────────────────────────────────────────────
  const [shoppingList, setShoppingList] = React.useState<ShoppingItem[]>([])
  const [camPhase, setCamPhase] = React.useState<'idle' | 'starting' | 'active' | 'error'>('idle')
  const [cameraError, setCameraError] = React.useState<string | null>(null)
  const [scannedProduct, setScannedProduct] = React.useState<Product | null>(null)
  const [notFoundBarcode, setNotFoundBarcode] = React.useState<string | null>(null)
  const [isCartOpen, setIsCartOpen] = React.useState(false)
  const [priceChangeItem, setPriceChangeItem] = React.useState<{ item: ShoppingItem; newPrice: number } | null>(null)
  const [showSearch, setShowSearch] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [isFullscreen, setIsFullscreen] = React.useState(false)

  // ── Scanner ref ─────────────────────────────────────────────────────────────
  const rootRef           = React.useRef<HTMLDivElement | null>(null)
  const scannerRef        = React.useRef<Html5Qrcode | null>(null)
  const startLockRef      = React.useRef(false)          // prevent concurrent starts
  const mountedRef        = React.useRef(true)           // track mount state
  const lastBarcode       = React.useRef('')
  const lastTime          = React.useRef(0)
  const scannedProductRef = React.useRef<Product | null>(null)
  const touchStartYRef    = React.useRef<number | null>(null)

  React.useEffect(() => {
    scannedProductRef.current = scannedProduct
  }, [scannedProduct])

  React.useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // Track browser fullscreen state
  React.useEffect(() => {
    const onFsChange = () => {
      const doc = document as any
      setIsFullscreen(Boolean(document.fullscreenElement || doc.webkitFullscreenElement))
    }
    document.addEventListener('fullscreenchange', onFsChange)
    document.addEventListener('webkitfullscreenchange', onFsChange)
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange)
      document.removeEventListener('webkitfullscreenchange', onFsChange)
    }
  }, [])

  const toggleFullscreen = async () => {
    const doc = document as any
    const el = (rootRef.current || document.documentElement) as any
    try {
      if (!document.fullscreenElement && !doc.webkitFullscreenElement) {
        if (el.requestFullscreen) {
          await el.requestFullscreen()
        } else if (el.webkitRequestFullscreen) {
          await el.webkitRequestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen()
        }
      }
    } catch {
      // Fallback: scroll to hide mobile address bar if fullscreen API is restricted (e.g. iOS Safari)
      window.scrollTo(0, 1)
    }
  }

  // ── Session ──────────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!branch) return
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Date.now() - parsed.lastActivityAt > 86_400_000) {
          localStorage.removeItem(storageKey)
        } else {
          setShoppingList(parsed.items || [])
        }
      } catch { localStorage.removeItem(storageKey) }
    } else {
      recordShoppingSession()
    }
  }, [branch?.id])

  const saveSession = (items: ShoppingItem[]) => {
    if (!branch) return
    localStorage.setItem(storageKey, JSON.stringify({
      branchId: branch.id, merchantId: merchant?.id,
      sessionStartedAt: Date.now(), lastActivityAt: Date.now(), items,
    }))
  }

  // ── Price-change watcher ─────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!merchant || !shoppingList.length) return
    const mp = activeProducts.filter((p) => p.merchantId === merchant.id)
    for (const item of shoppingList) {
      const live = mp.find((p) => p.id === item.productId)
      if (live && live.price !== item.confirmedPrice && !item.priceChanged) {
        setPriceChangeItem({ item, newPrice: live.price })
        break
      }
    }
  }, [activeProducts, shoppingList, merchant?.id])

  // ── Barcode handler ──────────────────────────────────────────────────────────
  const onBarcode = React.useCallback(
    async (raw: string, fromManual = false) => {
      // Do not overwrite an open result sheet from background camera scans
      if (!fromManual && scannedProductRef.current) return
      const val = raw.trim()
      if (!val) return
      const now = Date.now()
      if (!fromManual && val === lastBarcode.current && now - lastTime.current < 2000) return
      lastBarcode.current = val
      lastTime.current = now
      playBeep()

      if (merchant?.id && branch?.id) {
        recordCustomerScan(merchant.id, branch.id, val)
      }

      // Normalize barcode (handle leading zeros or UPC-A vs EAN-13 differences)
      const cleanVal = val.replace(/^0+/, '')
      const targetMerchantId = merchant?.id || branch?.merchantId

      // Search strictly within live products catalog
      let found = activeProducts.find((p) => {
        const matchesMerchant = !targetMerchantId || p.merchantId === targetMerchantId
        const pBarcode = (p.barcode || '').trim()
        const pCleanBarcode = pBarcode.replace(/^0+/, '')
        return (
          matchesMerchant &&
          (pBarcode.toLowerCase() === val.toLowerCase() ||
            pCleanBarcode.toLowerCase() === cleanVal.toLowerCase() ||
            p.id.toLowerCase() === val.toLowerCase())
        )
      })

      // If not scoped to a specific merchant/branch, fall back to searching all merchant products
      if (!found && !isMerchantScoped) {
        found = activeProducts.find((p) => {
          const pBarcode = (p.barcode || '').trim()
          const pCleanBarcode = pBarcode.replace(/^0+/, '')
          return (
            pBarcode.toLowerCase() === val.toLowerCase() ||
            pCleanBarcode.toLowerCase() === cleanVal.toLowerCase() ||
            p.id.toLowerCase() === val.toLowerCase()
          )
        })
      }

      // Live backend fallback lookup (catches newly added products without refreshing phone)
      if (!found) {
        try {
          const res = await fetch('/api/scan/lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              qrToken: qrToken || undefined,
              merchantId: merchantId || (qrToken ? merchant?.id : undefined),
              barcode: val,
            }),
          })
          if (res.ok) {
            const liveProd: Product = await res.json()
            if (liveProd && liveProd.id) {
              found = liveProd
              setLiveProducts((prev) =>
                prev.some((p) => p.id === liveProd.id) ? prev : [liveProd, ...prev]
              )
            }
          }
        } catch {
          // ignore network error
        }
      }

      if (found) {
        setScannedProduct(found)
        setNotFoundBarcode(null)
      } else {
        setNotFoundBarcode(val)
        setScannedProduct(null)
      }
    },
    [merchant, branch, qrToken, merchantId, isMerchantScoped, activeProducts, recordCustomerScan]
  )

  // Always keep latest onBarcode in a ref so camera callback never captures stale products
  const onBarcodeRef = React.useRef(onBarcode)
  React.useEffect(() => {
    onBarcodeRef.current = onBarcode
  }, [onBarcode])

  // ── Create / get scanner instance ────────────────────────────────────────────
  const getScanner = (): Html5Qrcode => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(CAM_DIV_ID, {
        formatsToSupport: SCAN_FORMATS,
        verbose: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
      })
    }
    return scannerRef.current
  }

  // ── Stop helper ──────────────────────────────────────────────────────────────
  const stopScanner = async () => {
    const s = scannerRef.current
    if (s && s.isScanning) {
      try { await s.stop() } catch { /* ignore */ }
    }
    scannerRef.current = null
  }

  // ── Start camera ─────────────────────────────────────────────────────────────
  //   Fixes the original dimming bug:
  //   1. Lock prevents concurrent calls (StrictMode double-fire)
  //   2. If already scanning → just surface the active state
  //   3. Catch only resets UI on REAL errors, not "already scanning"
  const startCamera = React.useCallback(
    async (mode: 'environment' | 'user' = 'environment') => {
      if (startLockRef.current) return
      startLockRef.current = true

      // Already scanning → just surface the active state
      if (scannerRef.current?.isScanning) {
        if (mountedRef.current) setCamPhase('active')
        startLockRef.current = false
        return
      }

      if (mountedRef.current) { setCameraError(null); setCamPhase('starting') }

      try {
        const scanner = getScanner()
        await scanner.start(
          { facingMode: mode },
          {
            fps: 25,
            qrbox: { width: 280, height: 160 },
            aspectRatio: 1.777778,
          },
          (text) => onBarcodeRef.current(text),
          () => { /* scan error per frame — normal */ }
        )
        if (mountedRef.current) setCamPhase('active')
      } catch (err: any) {
        const msg = String(err?.message || err || '')
        // "already scanning" / "already active" → scanner is fine, just show video
        if (
          scannerRef.current?.isScanning ||
          msg.toLowerCase().includes('already') ||
          msg.toLowerCase().includes('active')
        ) {
          if (mountedRef.current) setCamPhase('active')
        } else {
          // Real error (permission denied, no camera …)
          const userMsg =
            msg.includes('NotAllowed') || msg.includes('Permission')
              ? 'تم رفض إذن الكاميرا. اسمح بالوصول من إعدادات المتصفح ثم حاول مجدداً.'
              : msg.includes('NotFound')
                ? 'لم يتم العثور على كاميرا على هذا الجهاز.'
                : 'تعذّر تشغيل الكاميرا: ' + (msg || 'خطأ غير معروف')
          if (mountedRef.current) { setCameraError(userMsg); setCamPhase('error') }
          // Reset ref so a retry creates a fresh instance
          scannerRef.current = null
        }
      } finally {
        startLockRef.current = false
      }
    },
    []
  )

  // ── Hardware Barcode Scanner Listener (USB / Bluetooth scanner guns) ─────────
  React.useEffect(() => {
    let buffer = ''
    let lastKeyTime = Date.now()

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement
      if (
        activeEl &&
        activeEl.tagName === 'INPUT' &&
        activeEl.getAttribute('type') === 'text'
      ) {
        return
      }

      const currentTime = Date.now()
      const charDiff = currentTime - lastKeyTime
      lastKeyTime = currentTime

      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          onBarcode(buffer.trim())
          buffer = ''
        }
      } else if (e.key.length === 1) {
        if (charDiff > 90) {
          buffer = e.key
        } else {
          buffer += e.key
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onBarcode])

  // ── Auto-start (StrictMode safe) ─────────────────────────────────────────────
  React.useEffect(() => {
    if (branch?.qrStatus === 'Active' && merchant?.status === 'Active') {
      startCamera('environment')
    }
    return () => {
      // StrictMode cleanup: stop synchronously if possible
      startLockRef.current = false
      stopScanner()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch?.id])

  // ── Cart helpers ─────────────────────────────────────────────────────────────
  const addToCart = (prod: Product, qty: number) => {
    setShoppingList((prev) => {
      const idx = prev.findIndex((i) => i.productId === prod.id)
      const next =
        idx !== -1
          ? prev.map((i, n) => n === idx ? { ...i, quantity: i.quantity + qty } : i)
          : [{ productId: prod.id, barcode: prod.barcode, name: prod.name,
                imageUrl: prod.imageUrl, price: prod.price, confirmedPrice: prod.price,
                quantity: qty, priceStatus: 'CONFIRMED' as const }, ...prev]
      saveSession(next)
      return next
    })
    setScannedProduct(null)
  }

  const changeQty = (productId: string, delta: number) => {
    setShoppingList((prev) => {
      const next = prev.map((i) => {
        if (i.productId !== productId) return i
        const q = i.quantity + delta
        return q > 0 ? { ...i, quantity: q } : null
      }).filter(Boolean) as ShoppingItem[]
      saveSession(next)
      return next
    })
  }

  const removeItem = (productId: string) => {
    setShoppingList((prev) => {
      const next = prev.filter((i) => i.productId !== productId)
      saveSession(next)
      return next
    })
  }

  const clearList = () => { setShoppingList([]); localStorage.removeItem(storageKey) }

  const handlePriceDecision = (accept: boolean) => {
    if (!priceChangeItem) return
    const { item, newPrice } = priceChangeItem
    setShoppingList((prev) => {
      const next = prev.map((it) => {
        if (it.productId !== item.productId) return it
        return accept
          ? { ...it, price: newPrice, confirmedPrice: newPrice, priceChanged: false, priceStatus: 'CONFIRMED' as const }
          : { ...it, priceChanged: true, newPrice, priceStatus: 'UNCONFIRMED' as const }
      })
      saveSession(next)
      return next
    })
    setPriceChangeItem(null)
  }

  const totalCount = shoppingList.reduce((s, i) => s + i.quantity, 0)
  const totalPrice = shoppingList.reduce((s, i) => s + i.confirmedPrice * i.quantity, 0)

  // ── Error screens ── Only show revoked/invalid error if a specific qrToken was provided
  if (qrToken && (!branch || branch.qrStatus === 'Revoked')) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center p-6 text-center bg-background'>
        <div className='rounded-full bg-red-100 p-4 text-red-600 dark:bg-red-950 dark:text-red-400 mb-4'>
          <XCircle className='size-12' />
        </div>
        <h1 className='text-2xl font-bold'>QR Code غير صالح أو ملغى</h1>
        <p className='text-muted-foreground mt-2 max-w-sm text-sm'>الرجاء مسح رمز QR الصحيح في الفرع.</p>
      </div>
    )
  }

  if (!merchant || merchant.status !== 'Active') {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center p-6 text-center bg-background'>
        <div className='rounded-full bg-amber-100 p-4 text-amber-600 dark:bg-amber-950 dark:text-amber-400 mb-4'>
          <AlertTriangle className='size-12' />
        </div>
        <h1 className='text-2xl font-bold'>الخدمة غير متاحة مؤقتاً</h1>
        <p className='text-muted-foreground mt-2 max-w-sm text-sm'>
          كتالوج <strong>{merchant?.name || 'هذا المتجر'}</strong> غير متاح حالياً.
        </p>
      </div>
    )
  }

  const isActive   = camPhase === 'active'
  const isStarting = camPhase === 'starting'

  const scopedSearchCatalog = isMerchantScoped
    ? activeProducts.filter((p) => !merchant?.id || p.merchantId === merchant.id)
    : activeProducts

  const filteredSearchProducts = searchQuery.trim()
    ? scopedSearchCatalog.filter((p) => {
        const q = searchQuery.trim().toLowerCase()
        return (
          p.name.toLowerCase().includes(q) ||
          (p.barcode || '').toLowerCase().includes(q)
        )
      })
    : []

  // ── Main render ───────────────────────────────────────────────────────────────
  return (
    <div
      ref={rootRef}
      className='fixed inset-0 w-screen h-[100dvh] bg-black overflow-hidden select-none touch-none'
    >

      {/* ── Camera container: Html5Qrcode renders <video> inside here ── */}
      <div
        id={CAM_DIV_ID}
        className='absolute inset-0 w-full h-full [&>video]:!w-full [&>video]:!h-full [&>video]:!object-cover'
        style={{ display: isActive ? 'block' : 'none' }}
      />

      {/* ── Overlay when not active ── */}
      {!isActive && (
        <div className='absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-slate-950 z-10'>
          {isStarting ? (
            <>
              <Loader2 className='size-12 text-primary animate-spin mb-4' />
              <p className='text-sm text-slate-300'>جارٍ تشغيل الكاميرا…</p>
            </>
          ) : (
            <>
              <div className='size-16 rounded-full bg-white/10 flex items-center justify-center mb-4'>
                <Camera className='size-8 text-primary' />
              </div>
              <h2 className='text-lg font-bold'>كاميرا المسح الضوئي</h2>
              <p className='text-xs text-slate-400 max-w-xs mt-1 mb-5'>
                اضغط الزر لتفعيل الكاميرا ومسح باركود المنتجات.
              </p>
              <Button onClick={() => startCamera()} className='gap-2 shadow-lg'>
                <Camera className='size-4' /> تشغيل الكاميرا الآن
              </Button>
              {cameraError && (
                <p className='text-xs text-red-400 mt-3 bg-red-950/60 p-2 rounded max-w-xs'>
                  {cameraError}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Floating Top Controls (No Header Bar: Merchant Avatar Left, Search & Fullscreen Right) ── */}
      <div
        dir='ltr'
        className='pointer-events-none absolute top-4 inset-x-4 z-30 flex items-center justify-between'
      >
        {/* Left: Merchant Avatar Only */}
        <div
          className='pointer-events-auto size-11 rounded-full overflow-hidden bg-black/50 backdrop-blur-md border border-white/25 shadow-lg flex items-center justify-center shrink-0'
          title={merchant.name}
        >
          {merchant.logo ? (
            <img
              src={merchant.logo}
              alt={merchant.name}
              className='size-full object-cover'
            />
          ) : (
            <div className='size-full flex items-center justify-center text-white font-black text-base'>
              {merchant.name?.[0]?.toUpperCase() || <Store className='size-5' />}
            </div>
          )}
        </div>

        {/* Right: Fullscreen & Search Icons */}
        <div className='pointer-events-auto flex items-center gap-2'>
          <button
            type='button'
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            title={isFullscreen ? 'إنهاء ملء الشاشة' : 'ملء الشاشة'}
            className='size-11 rounded-full bg-black/50 hover:bg-black/70 active:scale-95 backdrop-blur-md border border-white/20 text-white shadow-lg flex items-center justify-center transition-all cursor-pointer'
          >
            {isFullscreen ? <Minimize2 className='size-5' /> : <Maximize2 className='size-5' />}
          </button>

          <button
            type='button'
            onClick={() => setShowSearch((prev) => !prev)}
            aria-label='Search'
            title='بحث بالباركود أو اسم المنتج'
            className='size-11 rounded-full bg-black/50 hover:bg-black/70 active:scale-95 backdrop-blur-md border border-white/20 text-white shadow-lg flex items-center justify-center transition-all cursor-pointer'
          >
            {showSearch ? <X className='size-5' /> : <Search className='size-5' />}
          </button>
        </div>
      </div>

      {/* ── Floating Search Panel ── */}
      {showSearch && (
        <div className='absolute top-18 inset-x-4 z-30 p-3 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/15 text-white shadow-2xl animate-in fade-in slide-in-from-top-2'>
          <div className='flex items-center gap-2'>
            <div className='relative flex-1'>
              <Search className='size-4 text-white/50 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none' />
              <input
                type='text'
                autoFocus
                placeholder={isArabicDevice ? 'ابحث بالباركود أو اسم المنتج...' : 'Search by barcode or product name...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    onBarcode(searchQuery, true)
                    setSearchQuery('')
                    setShowSearch(false)
                  }
                }}
                className='w-full h-10 rounded-xl border border-white/20 bg-white/10 ps-9 pe-3 text-xs text-white placeholder:text-white/50 outline-none focus:border-white/40'
              />
            </div>
            <Button
              size='sm'
              className='h-10 px-4 rounded-xl text-xs font-bold'
              onClick={() => {
                if (searchQuery.trim()) {
                  onBarcode(searchQuery, true)
                  setSearchQuery('')
                  setShowSearch(false)
                }
              }}
            >
              {isArabicDevice ? 'بحث' : 'Search'}
            </Button>
          </div>

          {filteredSearchProducts.length > 0 && (
            <div className='mt-2.5 max-h-52 overflow-y-auto divide-y divide-white/10'>
              {filteredSearchProducts.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  type='button'
                  onClick={() => {
                    playBeep()
                    setScannedProduct(p)
                    setNotFoundBarcode(null)
                    setSearchQuery('')
                    setShowSearch(false)
                  }}
                  className='w-full py-2 px-2 flex items-center justify-between text-start hover:bg-white/10 rounded-lg transition-colors cursor-pointer'
                >
                  <div className='min-w-0'>
                    <p className='text-xs font-bold text-white truncate'>{p.name}</p>
                    <p className='text-[10px] font-mono text-white/60'>{p.barcode}</p>
                  </div>
                  <span className='text-xs font-mono font-bold text-[#00d632] shrink-0 ms-3'>
                    {p.price.toFixed(2)} {currencyLabel}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Scan Guide (Single clean scan box with helper label) ── */}
      {isActive && (
        <div className='pointer-events-none absolute inset-x-0 bottom-24 flex flex-col items-center justify-center z-20'>
          <p className='text-xs font-bold text-white bg-black/60 px-4 py-1.5 rounded-full backdrop-blur-md shadow-lg border border-white/10'>
            وجّه الكاميرا نحو باركود المنتج
          </p>
        </div>
      )}

      {/* Style html5-qrcode's built-in box to match project green */}
      <style>{`
        #barcode-camera-feed #qr-shaded-region div {
          border-color: #00d632 !important;
        }
      `}</style>

      {/* ── 80% Green Bottom Sheet for Scanned Product Result (Stays open until user dismisses) ── */}
      <Sheet open={!!scannedProduct} onOpenChange={(open) => !open && setScannedProduct(null)}>
        <SheetContent
          side='bottom'
          hideCloseButton
          onTouchStart={(e) => {
            touchStartYRef.current = e.touches[0]?.clientY ?? null
          }}
          onTouchEnd={(e) => {
            const startY = touchStartYRef.current
            const endY = e.changedTouches[0]?.clientY ?? null
            touchStartYRef.current = null
            if (startY !== null && endY !== null && endY - startY > 70) {
              setScannedProduct(null)
            }
          }}
          className='h-[80vh] max-h-[80vh] min-h-[80vh] rounded-t-[36px] bg-[#00d632] border-none text-[#061006] p-6 pb-7 flex flex-col justify-between shadow-[0_-16px_50px_rgba(0,0,0,0.45)] z-50 overflow-hidden'
        >
          {/* Top Drag Handle Only (no "تم العثور على المنتج", no close X button) */}
          <div className='w-full shrink-0 flex justify-center pt-1'>
            <div className='w-14 h-1.5 rounded-full bg-[#061006]/25' />
          </div>

          {/* Middle Content: Product Name and Price in large font */}
          <div className='flex-1 flex flex-col items-center justify-center text-center px-2'>
            {scannedProduct && (
              <>
                {/* Product Name */}
                <h2 className='text-3xl sm:text-4xl font-black text-[#061006] leading-tight max-w-md line-clamp-3 mb-2'>
                  {scannedProduct.name}
                </h2>

                {/* Product Price with LE */}
                <div className='my-4 flex items-baseline justify-center gap-2' dir='ltr'>
                  <span className='text-6xl sm:text-7xl font-mono font-black text-[#061006] tracking-tight'>
                    {scannedProduct.price.toFixed(2)}
                  </span>
                  <span className='text-2xl sm:text-3xl font-black text-[#061006]/85'>
                    {currencyLabel}
                  </span>
                </div>

                {scannedProduct.barcode && (
                  <div className='text-xs font-mono font-bold text-[#061006]/70 bg-[#061006]/10 px-3.5 py-1 rounded-full inline-block mt-1'>
                    {scannedProduct.barcode}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Bottom Action: Add to Cart anchored at the bottom */}
          <div className='w-full shrink-0 mt-auto pt-2'>
            <button
              type='button'
              onClick={() => {
                if (scannedProduct) {
                  addToCart(scannedProduct, 1)
                  setScannedProduct(null)
                }
              }}
              className='w-full h-15 rounded-[20px] bg-[#061006] hover:bg-black text-white text-lg font-black flex items-center justify-center gap-3 shadow-2xl active:scale-[0.98] transition-all cursor-pointer'
            >
              <ShoppingCart className='size-5' />
              <span>{isArabicDevice ? 'أضف للسلة' : 'Add to Cart'}</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Not-found banner ── */}
      {notFoundBarcode && (
        <div className='absolute top-20 inset-x-4 z-40 rounded-xl bg-red-500/95 text-white p-3.5 flex items-center justify-between shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-3'>
          <div className='flex items-center gap-2.5 text-xs'>
            <AlertCircle className='size-5 shrink-0' />
            <div>
              <p className='font-bold'>المنتج غير مسجل</p>
              <p className='text-[11px] opacity-90'>
                الباركود <code className='font-mono font-bold'>{notFoundBarcode}</code> غير موجود في كتالوج {merchant.name}
              </p>
            </div>
          </div>
          <Button size='icon' variant='ghost' className='size-7 text-white hover:bg-white/20'
            onClick={() => setNotFoundBarcode(null)}>
            <X className='size-4' />
          </Button>
        </div>
      )}

      {/* ── Cart FAB ── */}
      <div className='absolute bottom-8 inset-x-0 flex items-center justify-center z-30 pointer-events-auto'>
        <button onClick={() => setIsCartOpen(true)}
          className='relative flex items-center justify-center size-16 rounded-full bg-primary text-primary-foreground shadow-[0_8px_30px_rgba(0,0,0,0.5)] border-4 border-white/20 active:scale-95 transition-all hover:scale-105 group'
          aria-label='عربة التسوق'>
          <ShoppingCart className='size-7 group-hover:scale-110 transition-transform' />
          {totalCount > 0 && (
            <span className='absolute -top-1 -right-1 flex items-center justify-center min-w-6 h-6 px-1 rounded-full bg-red-500 text-white font-bold text-xs shadow-md border-2 border-background'>
              {totalCount}
            </span>
          )}
          {totalCount > 0 && (
            <span className='absolute -bottom-6 font-bold text-[11px] text-white bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs whitespace-nowrap shadow-xs'>
              {currencyLabel} {totalPrice.toFixed(2)}
            </span>
          )}
        </button>
      </div>

      {/* ── Cart Sheet ── */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent side='bottom' className='rounded-t-2xl p-5 max-h-[85vh] flex flex-col max-w-lg mx-auto border-t'>
          <SheetHeader className='p-0 text-start flex-row items-center justify-between'>
            <div>
              <SheetTitle className='text-base font-bold flex items-center gap-2'>
                <ShoppingCart className='size-5 text-primary' /> عربة التسوق
              </SheetTitle>
              <SheetDescription className='text-xs'>{totalCount} عنصر في القائمة</SheetDescription>
            </div>
            {shoppingList.length > 0 && (
              <Button variant='ghost' size='sm' onClick={clearList} className='text-xs text-muted-foreground hover:text-destructive'>
                تفريغ السلة
              </Button>
            )}
          </SheetHeader>

          <div className='flex-1 overflow-y-auto space-y-2.5 my-4 pr-1'>
            {shoppingList.length === 0 ? (
              <div className='py-12 text-center text-muted-foreground'>
                <ShoppingCart className='size-12 mx-auto mb-2 opacity-20' />
                <p className='text-sm font-semibold'>السلة فارغة</p>
                <p className='text-xs mt-0.5'>امسح باركود أي منتج لإضافته هنا.</p>
              </div>
            ) : (
              shoppingList.map((item) => (
                <div key={item.productId} className='rounded-xl border bg-card p-3 flex items-center justify-between gap-3 shadow-2xs'>
                  <div className='flex-1 min-w-0'>
                    <h5 className='font-bold text-xs leading-snug truncate'>{item.name}</h5>
                    <div className='text-[11px] text-muted-foreground font-mono mt-0.5'>
                      {currencyLabel} {item.confirmedPrice.toFixed(2)} للقطعة
                    </div>
                    {item.priceStatus === 'UNCONFIRMED' && (
                      <Badge variant='destructive' className='text-[9px] px-1 py-0 mt-1'>تغير السعر معلق</Badge>
                    )}
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='flex items-center border rounded-md bg-background'>
                      <Button size='icon' variant='ghost' className='size-7' onClick={() => changeQty(item.productId, -1)}><Minus className='size-3' /></Button>
                      <span className='w-6 text-center text-xs font-bold font-mono'>{item.quantity}</span>
                      <Button size='icon' variant='ghost' className='size-7' onClick={() => changeQty(item.productId, 1)}><Plus className='size-3' /></Button>
                    </div>
                    <div className='text-end min-w-16'>
                      <span className='text-xs font-bold font-mono'>{currencyLabel} {(item.confirmedPrice * item.quantity).toFixed(2)}</span>
                    </div>
                    <Button size='icon' variant='ghost' className='size-7 text-muted-foreground hover:text-destructive' onClick={() => removeItem(item.productId)}>
                      <Trash2 className='size-3.5' />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {shoppingList.length > 0 && (
            <div className='border-t pt-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <span className='text-xs text-muted-foreground font-semibold uppercase'>المجموع التقديري:</span>
                  <div className='text-2xl font-extrabold text-primary font-mono'>
                    {currencyLabel} {totalPrice.toFixed(2)}
                  </div>
                </div>
                <Button size='sm' onClick={() => window.print()} className='gap-1.5 text-xs'>مشاركة / طباعة</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Price Change Dialog ── */}
      <Dialog open={!!priceChangeItem} onOpenChange={(o) => !o && setPriceChangeItem(null)}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-amber-600 dark:text-amber-400'>
              <AlertTriangle className='size-5' /> تحديث سعر المنتج
            </DialogTitle>
            <DialogDescription className='text-xs'>
              تغير سعر <strong>{priceChangeItem?.item.name}</strong> في كتالوج المتجر.
            </DialogDescription>
          </DialogHeader>
          <div className='my-3 rounded-lg border bg-muted/50 p-3 space-y-2 text-xs'>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>السعر السابق:</span>
              <span className='font-mono line-through text-muted-foreground'>{currencyLabel} {priceChangeItem?.item.confirmedPrice.toFixed(2)}</span>
            </div>
            <div className='flex justify-between font-bold text-sm'>
              <span>السعر الجديد:</span>
              <span className='font-mono text-primary'>{currencyLabel} {priceChangeItem?.newPrice.toFixed(2)}</span>
            </div>
          </div>
          <DialogFooter className='flex-col sm:flex-row gap-2'>
            <Button variant='outline' size='sm' className='w-full sm:w-auto text-xs' onClick={() => handlePriceDecision(false)}>رفض</Button>
            <Button size='sm' className='w-full sm:w-auto text-xs' onClick={() => handlePriceDecision(true)}>موافقة وتحديث السعر</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
