import * as React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useSaaSStore } from '@/lib/saas-store'
import { PosPinScreen } from './components/pos-pin-screen'
import { PosHeader } from './components/pos-header'
import { PosCatalog } from './components/pos-catalog'
import { PosCart } from './components/pos-cart'
import { PosCheckoutModal } from './components/pos-checkout-modal'
import type { POSCartItem, PaymentMethod } from './types'
import type { Branch, User, Product, Invoice } from '@/types/saas'
import { toast } from 'sonner'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Pleasant POS audio beep synthesizer
function playBeep(type: 'scan' | 'success' | 'error') {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === 'scan') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime) // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.1)
    } else if (type === 'success') {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08) // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16) // G5
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.3)
    }
  } catch {
    // Ignore audio autoplay restrictions
  }
}

export function POSTerminalView() {
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(window.location.search)
  const urlMerchantId = searchParams.get('merchantId')

  const {
    currentUser,
    merchants,
    branches,
    products,
    categories,
    users,
    createInvoice,
  } = useSaaSStore()

  // Resolve target merchant
  const resolvedMerchantId =
    urlMerchantId ||
    currentUser.merchantId ||
    (merchants.length > 0 ? merchants[0].id : null)

  const activeMerchant = merchants.find((m) => m.id === resolvedMerchantId) || null

  // Branches & Categories for this merchant
  const storeBranches = React.useMemo(() => {
    if (!activeMerchant) return []
    return branches.filter((b) => b.merchantId === activeMerchant.id)
  }, [branches, activeMerchant])

  const storeCategories = React.useMemo(() => {
    if (!activeMerchant) return []
    return categories.filter((c) => c.merchantId === activeMerchant.id)
  }, [categories, activeMerchant])

  const storeProducts = React.useMemo(() => {
    if (!activeMerchant) return []
    return products.filter((p) => p.merchantId === activeMerchant.id)
  }, [products, activeMerchant])

  // Cashiers & Staff for this merchant
  const merchantStaff: User[] = React.useMemo(() => {
    if (!activeMerchant) return []
    const staffList = users.filter((u) => u.merchantId === activeMerchant.id)

    // If no cashiers found for this merchant, provide a default cashier entry
    if (staffList.length === 0) {
      return [
        {
          id: `default-cashier-${activeMerchant.id}`,
          name: 'الكاشير الافتراضي (Cashier 1)',
          email: `cashier@${activeMerchant.name.replace(/\s+/g, '').toLowerCase()}.com`,
          username: 'cashier1',
          role: 'CASHIER' as const,
          merchantId: activeMerchant.id,
          status: 'Active' as const,
          pin: '1234',
          createdAt: new Date().toISOString(),
        },
      ]
    }
    return staffList
  }, [users, activeMerchant])

  // Active POS Session state
  const [activeBranch, setActiveBranch] = React.useState<Branch | null>(null)
  const [activeCashier, setActiveCashier] = React.useState<User | null>(null)
  const [cartItems, setCartItems] = React.useState<POSCartItem[]>([])
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false)

  // Sync active branch on load
  React.useEffect(() => {
    if (storeBranches.length > 0 && !activeBranch) {
      setActiveBranch(storeBranches[0])
    }
  }, [storeBranches, activeBranch])

  // Add product to cart
  const handleAddToCart = (product: Product) => {
    playBeep('scan')
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? {
                ...i,
                quantity: i.quantity + 1,
                total: (i.quantity + 1) * i.unitPrice,
              }
            : i
        )
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            unitPrice: product.price,
            total: product.price,
          },
        ]
      }
    })
  }

  // Update quantity
  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta
            if (nextQty <= 0) return null
            return {
              ...item,
              quantity: nextQty,
              total: nextQty * item.unitPrice,
            }
          }
          return item
        })
        .filter(Boolean) as POSCartItem[]
    })
  }

  // Remove item
  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((i) => i.product.id !== productId))
  }

  // Clear cart
  const handleClearCart = () => {
    setCartItems([])
  }

  // Complete Sale & Create Invoice
  const handleCompleteSale = async (
    paymentMethod: PaymentMethod,
    _amountPaid: number
  ): Promise<Invoice | null> => {
    if (!activeMerchant || !activeCashier) return null

    const subtotal = cartItems.reduce((acc, item) => acc + item.total, 0)
    const taxTotal = subtotal * 0.14
    const grandTotal = subtotal + taxTotal

    const invItems = cartItems.map((i) => ({
      name: i.product.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      total: i.total,
    }))

    try {
      const inv = await createInvoice({
        merchantId: activeMerchant.id,
        branchId: activeBranch?.id,
        cashierId: activeCashier.id,
        customerName: 'عميل نقدي (Walk-in)',
        items: invItems,
        subtotal,
        taxTotal,
        grandTotal,
        status: 'PAID',
        paymentMethod,
      })

      playBeep('success')
      toast.success(`تم استخراج الفاتورة رقم ${inv.invoiceNumber} بنجاح!`)
      return inv
    } catch (err: any) {
      toast.error(err.message || 'فشل تسجيل الفاتورة')
      return null
    }
  }

  // If merchant not found
  if (!activeMerchant) {
    return (
      <div className='min-h-screen w-full bg-[#09090B] text-white flex flex-col items-center justify-center p-6'>
        <div className='max-w-md w-full text-center space-y-4'>
          <div className='size-16 rounded-3xl bg-neutral-900 border border-white/10 flex items-center justify-center mx-auto'>
            <AlertTriangle className='size-8 text-[#3EEA85]' />
          </div>
          <h2 className='text-xl font-bold'>لم يتم تحديد متجر نشط لنقطة البيع</h2>
          <p className='text-xs text-neutral-400'>
            يرجى تسجيل الدخول كتاجر أو فتح نقطة البيع من لوحة تحكم المتجر
          </p>

          {merchants.length > 0 && (
            <div className='pt-4 space-y-2 text-left'>
              <p className='text-xs font-bold text-neutral-300'>المتاجر المسجلة:</p>
              {merchants.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    window.location.search = `?merchantId=${m.id}`
                  }}
                  className='w-full p-3 rounded-2xl bg-neutral-900 border border-white/10 hover:border-[#3EEA85] flex items-center justify-between text-xs transition-colors'
                >
                  <span className='font-bold'>{m.name}</span>
                  <ArrowRight className='size-4 text-[#3EEA85]' />
                </button>
              ))}
            </div>
          )}

          <Button
            variant='outline'
            onClick={() => navigate({ to: '/' })}
            className='mt-4 rounded-xl border-white/15'
          >
            العودة للوحة التحكم
          </Button>
        </div>
      </div>
    )
  }

  // If cashier session is locked, show PIN Unlock Screen
  if (!activeCashier) {
    return (
      <PosPinScreen
        merchant={activeMerchant}
        cashiers={merchantStaff}
        onUnlock={(cashier) => {
          playBeep('success')
          setActiveCashier(cashier)
          toast.success(`مرحباً بك ${cashier.name}! تم فتح نقطة البيع`)
        }}
        onExit={() => {
          if (window.opener) {
            window.close()
          } else {
            navigate({ to: '/' })
          }
        }}
      />
    )
  }

  // Active POS Terminal Workspace
  return (
    <div className='h-screen w-screen overflow-hidden flex flex-col bg-[#09090B] text-white select-none font-sans'>
      {/* ── POS Top Header ── */}
      <PosHeader
        merchant={activeMerchant}
        branch={activeBranch}
        branches={storeBranches}
        cashier={activeCashier}
        onSelectBranch={(b) => setActiveBranch(b)}
        onLockTerminal={() => {
          setActiveCashier(null)
          toast.info('تم قفل شاشة الكاشير')
        }}
        onExitPOS={() => {
          if (window.opener) {
            window.close()
          } else {
            navigate({ to: '/' })
          }
        }}
      />

      {/* ── Main POS Workspace: Catalog (Left) + Cart (Right) ── */}
      <div className='flex-1 flex flex-col lg:flex-row overflow-hidden'>
        <PosCatalog
          products={storeProducts}
          categories={storeCategories}
          cartItems={cartItems}
          onAddToCart={handleAddToCart}
        />

        <PosCart
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          onOpenCheckout={() => setIsCheckoutOpen(true)}
        />
      </div>

      {/* ── Checkout & Thermal Receipt Modal ── */}
      <PosCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        merchant={activeMerchant}
        branch={activeBranch}
        cashier={activeCashier}
        cartItems={cartItems}
        onCompleteSale={handleCompleteSale}
        onNewOrder={() => {
          setCartItems([])
        }}
      />
    </div>
  )
}
