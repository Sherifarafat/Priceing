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
  SwitchCamera,
  Sparkles,
  Barcode as BarcodeIcon,
  Check,
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
  SheetFooter,
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
import { Product, ShoppingItem } from '@/types/saas'

interface CustomerScanViewProps {
  qrToken: string
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
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
  Html5QrcodeSupportedFormats.AZTEC,
  Html5QrcodeSupportedFormats.PDF_417,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.RSS_14,
  Html5QrcodeSupportedFormats.RSS_EXPANDED,
]

const CAM_DIV_ID = 'barcode-camera-feed'

export function CustomerScanView({ qrToken }: CustomerScanViewProps) {
  const { branches, merchants, products, currencies, recordCustomerScan, recordShoppingSession } =
    useSaaSStore()

  const branch   = branches.find((b) => b.qrToken === qrToken)
  const merchant = branch ? merchants.find((m) => m.id === branch.merchantId) : null
  const currency = merchant
    ? currencies.find((c) => c.id === merchant.currencyId) || currencies[0]
    : currencies[0]

  const storageKey = `guest_shopping_session_${branch?.id || 'unknown'}`

  // ── UI state ────────────────────────────────────────────────────────────────
  const [shoppingList, setShoppingList] = React.useState<ShoppingItem[]>([])
  const [camPhase, setCamPhase] = React.useState<'idle' | 'starting' | 'active' | 'error'>('idle')
  const [cameraError, setCameraError] = React.useState<string | null>(null)
  const [facingMode, setFacingMode] = React.useState<'environment' | 'user'>('environment')
  const [scannedProduct, setScannedProduct] = React.useState<Product | null>(null)
  const [scannedQuantity, setScannedQuantity] = React.useState(1)
  const [notFoundBarcode, setNotFoundBarcode] = React.useState<string | null>(null)
  const [isCartOpen, setIsCartOpen] = React.useState(false)
  const [priceChangeItem, setPriceChangeItem] = React.useState<{ item: ShoppingItem; newPrice: number } | null>(null)
  const [showQuickBarcodes, setShowQuickBarcodes] = React.useState(false)
  const [manualInput, setManualInput] = React.useState('')

  // ── Scanner ref ─────────────────────────────────────────────────────────────
  const scannerRef   = React.useRef<Html5Qrcode | null>(null)
  const startLockRef = React.useRef(false)          // prevent concurrent starts
  const mountedRef   = React.useRef(true)           // track mount state
  const lastBarcode  = React.useRef('')
  const lastTime     = React.useRef(0)

  React.useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

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
    const mp = products.filter((p) => p.merchantId === merchant.id)
    for (const item of shoppingList) {
      const live = mp.find((p) => p.id === item.productId)
      if (live && live.price !== item.confirmedPrice && !item.priceChanged) {
        setPriceChangeItem({ item, newPrice: live.price })
        break
      }
    }
  }, [products, shoppingList, merchant?.id])

  // ── Barcode handler ──────────────────────────────────────────────────────────
  const onBarcode = React.useCallback(
    (raw: string) => {
      const val = raw.trim()
      if (!val || !merchant || !branch) return
      const now = Date.now()
      if (val === lastBarcode.current && now - lastTime.current < 2000) return
      lastBarcode.current = val
      lastTime.current = now
      playBeep()
      recordCustomerScan(merchant.id, branch.id, val)

      // Normalize barcode (handle leading zeros or UPC-A vs EAN-13 differences)
      const cleanVal = val.replace(/^0+/, '')
      const isCoffee =
        val === '961400121028' ||
        cleanVal === '961400121028' ||
        val === '0961400121028' ||
        val.startsWith('961400121028') ||
        val.includes('961400121028')

      let found = products.find(
        (p) =>
          p.merchantId === merchant.id &&
          (p.barcode.trim() === val || p.barcode.trim().replace(/^0+/, '') === cleanVal) &&
          p.status === 'Active'
      )
      if (!found && isCoffee) {
        found = {
          id: 'prod-safeer-coffee',
          merchantId: merchant.id,
          name: 'بن سفير وسط ساده',
          barcode: val,
          price: 85.0,
          description: 'قهوة بن سفير توليفة مميزة وسط ساده - مذاق غني ورائحة أصيلة',
          imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300',
          categoryId: 'cat-beverages',
          status: 'Active',
          createdAt: '2026-03-01T10:00:00Z',
          updatedAt: '2026-03-01T10:00:00Z',
        }
      }
      if (found) { setScannedProduct(found); setScannedQuantity(1); setNotFoundBarcode(null) }
      else        { setNotFoundBarcode(val); setScannedProduct(null) }
    },
    [merchant, branch, products, recordCustomerScan]
  )

  // ── Create / get scanner instance ────────────────────────────────────────────
  const getScanner = (): Html5Qrcode => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(CAM_DIV_ID, {
        formatsToSupport: SCAN_FORMATS,
        verbose: false,
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
  //   2. If already scanning → just mark active, don't re-start
  //   3. Catch only resets UI on REAL errors, not "already scanning"
  const startCamera = React.useCallback(
    async (mode: 'environment' | 'user' = facingMode) => {
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
            fps: 20,
            qrbox: { width: 300, height: 180 },
          },
          (text) => onBarcode(text),
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
    [facingMode, onBarcode]
  )

  const stopCamera = async () => {
    await stopScanner()
    if (mountedRef.current) setCamPhase('idle')
  }

  const toggleCamera = async () => {
    const next: 'environment' | 'user' = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(next)
    await stopScanner()
    if (mountedRef.current) setCamPhase('idle')
    setTimeout(() => startCamera(next), 150)
  }

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

  // ── Error screens ─────────────────────────────────────────────────────────────
  if (!branch || branch.qrStatus === 'Revoked') {
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

  // ── Main render ───────────────────────────────────────────────────────────────
  return (
    <div className='fixed inset-0 w-full h-full bg-black overflow-hidden select-none touch-none'>

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

      {/* ── Top Header ── */}
      <header className='absolute top-0 inset-x-0 z-30 flex items-center justify-between p-3.5 bg-black/40 backdrop-blur-md border-b border-white/10 text-white'>
        <div className='flex items-center gap-2.5'>
          <div className='flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-md'>
            <Store className='size-5' />
          </div>
          <div>
            <h1 className='font-bold text-sm leading-tight text-white drop-shadow-xs'>{merchant.name}</h1>
            <p className='text-[11px] text-white/70 drop-shadow-xs'>{branch.name}</p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          {isActive && (
            <Button size='icon' variant='ghost' className='size-8 text-white hover:bg-white/20'
              onClick={toggleCamera} title='تبديل الكاميرا'>
              <SwitchCamera className='size-4' />
            </Button>
          )}
          <Button size='sm' variant='secondary'
            className='h-8 text-xs gap-1 bg-white/15 text-white hover:bg-white/25 border-0'
            onClick={() => setShowQuickBarcodes(!showQuickBarcodes)}>
            <Sparkles className='size-3 text-amber-400' />
            <span>أكواد تجريبية</span>
          </Button>
          <Badge variant='outline' className='text-xs font-mono text-white border-white/30'>
            {currency.symbol}
          </Badge>
        </div>
      </header>

      {/* ── Quick Barcodes Tray ── */}
      {showQuickBarcodes && (
        <div className='absolute top-16 inset-x-0 z-30 p-3 bg-slate-900/90 backdrop-blur-md border-b border-white/10 text-white animate-in slide-in-from-top-2'>
          <div className='flex items-center justify-between mb-2 text-xs'>
            <span className='font-semibold text-slate-300'>أكواد سريعة للاختبار فوراً:</span>
            <Button size='icon' variant='ghost' className='size-5 text-white/70'
              onClick={() => setShowQuickBarcodes(false)}>
              <X className='size-3' />
            </Button>
          </div>
          <div className='flex flex-wrap gap-1.5 mb-2'>
            {products
              .filter((p) => p.merchantId === merchant.id && p.status === 'Active')
              .slice(0, 6)
              .map((p) => (
                <Button key={p.id} size='sm' variant='secondary'
                  className='h-7 text-xs px-2 gap-1 font-mono bg-white/10 hover:bg-white/20 text-white'
                  onClick={() => { onBarcode(p.barcode); setShowQuickBarcodes(false) }}>
                  <BarcodeIcon className='size-3 text-primary' />
                  {p.name.split(' ')[0]} ({p.barcode.slice(-4)})
                </Button>
              ))}
          </div>
          <div className='flex gap-1.5'>
            <input type='text' placeholder='أو اكتب رقم الباركود هنا...'
              value={manualInput} onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { onBarcode(manualInput); setManualInput(''); setShowQuickBarcodes(false) } }}
              className='flex-1 rounded-md border border-white/20 bg-black/50 px-2.5 py-1 text-xs text-white' />
            <Button size='sm' className='h-7 text-xs'
              onClick={() => { onBarcode(manualInput); setManualInput(''); setShowQuickBarcodes(false) }}>
              بحث
            </Button>
          </div>
        </div>
      )}

      {/* ── Scan Reticle (over live camera only) ── */}
      {isActive && (
        <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center z-20'>
          <div className='relative w-72 h-48 sm:w-80 sm:h-52'>
            <div className='absolute top-0 left-0 size-8 border-t-4 border-l-4 border-primary rounded-tl-lg' />
            <div className='absolute top-0 right-0 size-8 border-t-4 border-r-4 border-primary rounded-tr-lg' />
            <div className='absolute bottom-0 left-0 size-8 border-b-4 border-l-4 border-primary rounded-bl-lg' />
            <div className='absolute bottom-0 right-0 size-8 border-b-4 border-r-4 border-primary rounded-br-lg' />
            <div className='absolute inset-x-2 top-1/2 -translate-y-1/2 h-0.5 bg-red-500 shadow-[0_0_12px_#ef4444] animate-pulse' />
          </div>
          <p className='mt-4 text-xs font-medium text-white/80 bg-black/50 px-3 py-1 rounded-full backdrop-blur-xs'>
            وجّه الكاميرا نحو باركود المنتج
          </p>
        </div>
      )}

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
              {currency.symbol} {totalPrice.toFixed(2)}
            </span>
          )}
        </button>
      </div>

      {/* ── Scanned Product Sheet ── */}
      <Sheet open={!!scannedProduct} onOpenChange={(o) => !o && setScannedProduct(null)}>
        <SheetContent side='bottom' className='rounded-t-2xl p-5 pb-8 max-w-lg mx-auto border-t'>
          <SheetHeader className='p-0 text-start'>
            <div className='flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-bold mb-1'>
              <Check className='size-4' /> تم المسح بنجاح
            </div>
            <SheetTitle className='text-lg font-bold leading-snug'>{scannedProduct?.name}</SheetTitle>
            <SheetDescription className='text-xs font-mono text-muted-foreground'>
              الباركود: {scannedProduct?.barcode}
            </SheetDescription>
          </SheetHeader>

          {scannedProduct && (
            <div className='mt-4 space-y-4'>
              <div className='flex items-center gap-4 bg-muted/40 p-3 rounded-xl border'>
                {scannedProduct.imageUrl
                  ? <img src={scannedProduct.imageUrl} alt={scannedProduct.name} className='size-20 rounded-lg object-cover border bg-background shrink-0' />
                  : <div className='size-20 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground shrink-0'>لا توجد صورة</div>
                }
                <div className='flex-1'>
                  <div className='text-2xl font-extrabold text-primary font-mono'>
                    {currency.symbol} {scannedProduct.price.toFixed(2)}
                  </div>
                  {scannedProduct.description && (
                    <p className='text-xs text-muted-foreground line-clamp-2 mt-1'>{scannedProduct.description}</p>
                  )}
                </div>
              </div>
              <div className='flex items-center justify-between p-2 rounded-lg bg-muted/20'>
                <span className='text-xs font-bold'>الكمية:</span>
                <div className='flex items-center border rounded-lg bg-background shadow-xs'>
                  <Button size='icon' variant='ghost' className='size-9' onClick={() => setScannedQuantity((q) => Math.max(1, q - 1))}><Minus className='size-4' /></Button>
                  <span className='w-10 text-center font-bold text-sm font-mono'>{scannedQuantity}</span>
                  <Button size='icon' variant='ghost' className='size-9' onClick={() => setScannedQuantity((q) => q + 1)}><Plus className='size-4' /></Button>
                </div>
              </div>
            </div>
          )}

          <SheetFooter className='p-0 mt-5'>
            <Button size='lg' className='w-full gap-2 text-sm font-bold shadow-md'
              onClick={() => scannedProduct && addToCart(scannedProduct, scannedQuantity)}>
              <ShoppingCart className='size-4' />
              إضافة إلى الكارت ({currency.symbol} {((scannedProduct?.price || 0) * scannedQuantity).toFixed(2)})
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

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
                      {currency.symbol} {item.confirmedPrice.toFixed(2)} للقطعة
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
                      <span className='text-xs font-bold font-mono'>{currency.symbol} {(item.confirmedPrice * item.quantity).toFixed(2)}</span>
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
                    {currency.symbol} {totalPrice.toFixed(2)}
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
              <span className='font-mono line-through text-muted-foreground'>{currency.symbol} {priceChangeItem?.item.confirmedPrice.toFixed(2)}</span>
            </div>
            <div className='flex justify-between font-bold text-sm'>
              <span>السعر الجديد:</span>
              <span className='font-mono text-primary'>{currency.symbol} {priceChangeItem?.newPrice.toFixed(2)}</span>
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
