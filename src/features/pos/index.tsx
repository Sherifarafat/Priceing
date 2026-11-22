import * as React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useSaaSStore } from '@/lib/saas-store'
import { PosPinScreen } from './components/pos-pin-screen'
import { PosHeader } from './components/pos-header'
import { PosCatalog } from './components/pos-catalog'
import { PosCart } from './components/pos-cart'
import { PosCheckoutModal } from './components/pos-checkout-modal'
import type { POSCartItem, PaymentMethod } from './types'
import type { Branch, User, Product, Invoice, Merchant, Category } from '@/types/saas'
import { toast } from 'sonner'

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
    invoiceTemplate,
    fetchInvoiceTemplate,
  } = useSaaSStore()

  // Fallback merchant descriptor ONLY if no merchant exists in system
  const defaultMerchant: Merchant = React.useMemo(
    () => ({
      id: 'merchant-pos-demo',
      name: 'متجر التجزئة العام (Finro POS)',
      email: 'pos@finro.com',
      phone: '+201000000000',
      address: 'القاهرة، مصر',
      merchantTypeId: 'type-1',
      currencyId: 'curr-egp',
      typeId: 'type-1',
      status: 'Active',
      currency: 'EGP',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    []
  )

  // Resolve target merchant
  const resolvedMerchantId =
    urlMerchantId ||
    currentUser.merchantId ||
    (merchants.length > 0 ? merchants[0].id : null)

  const activeMerchant: Merchant =
    merchants.find((m) => m.id === resolvedMerchantId) ||
    merchants[0] ||
    defaultMerchant

  // Branches strictly for this merchant
  const storeBranches: Branch[] = React.useMemo(() => {
    return branches.filter((b) => b.merchantId === activeMerchant.id)
  }, [branches, activeMerchant])

  // Categories strictly for this merchant
  const storeCategories: Category[] = React.useMemo(() => {
    return categories.filter((c) => c.merchantId === activeMerchant.id)
  }, [categories, activeMerchant])

  // Active POS Session state
  const [activeBranch, setActiveBranch] = React.useState<Branch | null>(null)
  const [activeCashier, setActiveCashier] = React.useState<User | null>(null)
  const [cartItems, setCartItems] = React.useState<POSCartItem[]>([])
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false)

  // Sync active branch on load
  React.useEffect(() => {
    if (storeBranches.length > 0) {
      if (!activeBranch || !storeBranches.some((b) => b.id === activeBranch.id)) {
        setActiveBranch(storeBranches[0])
      }
    } else {
      setActiveBranch(null)
    }
  }, [storeBranches, activeBranch])

  // Fetch merchant invoice template on load
  React.useEffect(() => {
    if (activeMerchant?.id) {
      fetchInvoiceTemplate(activeMerchant.id).catch(() => {})
    }
  }, [activeMerchant?.id, fetchInvoiceTemplate])

  // Products strictly for this merchant and branch (NO fake default products!)
  const storeProducts: Product[] = React.useMemo(() => {
    return products.filter((p) => {
      const matchMerchant = p.merchantId === activeMerchant.id
      const pBranchId = (p as unknown as { branchId?: string }).branchId
      const matchBranch = !activeBranch || !pBranchId || pBranchId === activeBranch.id
      return matchMerchant && matchBranch
    })
  }, [products, activeMerchant, activeBranch])

  // Cashiers & Staff strictly for this merchant
  const merchantStaff: User[] = React.useMemo(() => {
    const staffList = users.filter((u) => u.merchantId === activeMerchant.id)
    if (staffList.length > 0) return staffList

    return [
      {
        id: `cashier-1-${activeMerchant.id}`,
        name: 'الكاشير 1 (محمد أحمد)',
        email: `cashier1@finropos.com`,
        username: 'cashier1',
        role: 'CASHIER' as const,
        merchantId: activeMerchant.id,
        status: 'Active' as const,
        pin: '1234',
        createdAt: new Date().toISOString(),
      },
      {
        id: `cashier-2-${activeMerchant.id}`,
        name: 'الكاشير 2 (سارة محمود)',
        email: `cashier2@finropos.com`,
        username: 'cashier2',
        role: 'CASHIER' as const,
        merchantId: activeMerchant.id,
        status: 'Active' as const,
        pin: '1234',
        createdAt: new Date().toISOString(),
      },
    ]
  }, [users, activeMerchant])

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
      productId: i.product.id,
      productName: i.product.name,
      name: i.product.name,
      barcode: i.product.barcode || '',
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      total: i.total,
      totalPrice: i.total,
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
      try {
        localStorage.setItem('pos_latest_invoice', JSON.stringify(inv))
        if (activeMerchant?.id && activeBranch?.id) {
          localStorage.setItem(`pos_latest_invoice_${activeMerchant.id}_${activeBranch.id}`, JSON.stringify(inv))
        }
        if (activeBranch?.id) {
          localStorage.setItem(`pos_latest_invoice_${activeBranch.id}`, JSON.stringify(inv))
        }
        const bc = new BroadcastChannel('pos_receipt_sync')
        bc.postMessage({
          type: 'UPDATE_INVOICE',
          merchantId: activeMerchant.id,
          branchId: activeBranch?.id,
          invoice: inv,
        })
        bc.close()
      } catch {}
      toast.success(`تم استخراج الفاتورة رقم ${inv.invoiceNumber} بنجاح!`)
      return inv
    } catch (err: any) {
      toast.error(err.message || 'فشل تسجيل الفاتورة')
      return null
    }
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
    <div className='min-h-screen w-full bg-[#f5f7f5] text-[#101410] select-none font-sans flex flex-col p-3 sm:p-5 gap-4 overflow-x-hidden'>
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
      <div className='flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_390px] xl:grid-cols-[minmax(0,1fr)_420px] gap-4 items-start'>
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
        template={invoiceTemplate}
        onCompleteSale={handleCompleteSale}
        onNewOrder={() => {
          setCartItems([])
          try {
            localStorage.removeItem('pos_latest_invoice')
            if (activeMerchant?.id && activeBranch?.id) {
              localStorage.removeItem(`pos_latest_invoice_${activeMerchant.id}_${activeBranch.id}`)
            }
            if (activeBranch?.id) {
              localStorage.removeItem(`pos_latest_invoice_${activeBranch.id}`)
            }
            const bc = new BroadcastChannel('pos_receipt_sync')
            bc.postMessage({
              type: 'CLEAR_INVOICE',
              merchantId: activeMerchant?.id,
              branchId: activeBranch?.id,
            })
            bc.close()
          } catch {}
        }}
      />
    </div>
  )
}
