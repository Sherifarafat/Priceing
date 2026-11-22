import * as React from 'react'
import { Printer, CheckCircle2, Clock, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CustomizedInvoiceView } from '@/features/invoices/components/customized-invoice-view'
import { useSaaSStore } from '@/lib/saas-store'
import type { Invoice } from '@/types/saas'
import { toast } from 'sonner'

interface ReceiptPublicViewProps {
  invoiceId: string
}

export function ReceiptPublicView({ invoiceId }: ReceiptPublicViewProps) {
  const { invoices, merchants, branches, invoiceTemplate, fetchInvoiceTemplate } = useSaaSStore()
  const isLiveMode = invoiceId === 'live' || invoiceId === 'current' || !invoiceId

  // Scope parameters from query string
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const paramMerchantId = searchParams?.get('merchantId') || searchParams?.get('merchant') || ''
  const paramBranchId = searchParams?.get('branchId') || searchParams?.get('branch') || ''

  // If invoiceId passed matches a branch ID or token directly (e.g. /receipt/:branchId)
  const matchedBranch = branches.find(
    (b) => b.id === invoiceId || b.qrToken === invoiceId || b.id === paramBranchId
  )
  const targetBranchId = matchedBranch?.id || paramBranchId
  const targetMerchantId = matchedBranch?.merchantId || paramMerchantId

  const [liveInvoice, setLiveInvoice] = React.useState<Invoice | null>(() => {
    try {
      if (targetBranchId && targetMerchantId) {
        const stored = localStorage.getItem(`pos_latest_invoice_${targetMerchantId}_${targetBranchId}`)
        if (stored) return JSON.parse(stored)
      }
      if (targetBranchId) {
        const stored = localStorage.getItem(`pos_latest_invoice_${targetBranchId}`)
        if (stored) return JSON.parse(stored)
      }
      const stored = localStorage.getItem('pos_latest_invoice')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const [copied, setCopied] = React.useState(false)

  // Curtain animation state: opens from center swiftly
  const [curtainOpen, setCurtainOpen] = React.useState<boolean>(false)
  const [curtainMounted, setCurtainMounted] = React.useState<boolean>(true)
  const lastInvoiceIdRef = React.useRef<string | null>(null)

  // Sync with BroadcastChannel and localStorage for instant real-time updates
  React.useEffect(() => {
    const handleStorageChange = () => {
      try {
        if (targetBranchId && targetMerchantId) {
          const stored = localStorage.getItem(`pos_latest_invoice_${targetMerchantId}_${targetBranchId}`)
          if (stored) {
            setLiveInvoice(JSON.parse(stored))
            return
          }
        }
        if (targetBranchId) {
          const stored = localStorage.getItem(`pos_latest_invoice_${targetBranchId}`)
          if (stored) {
            setLiveInvoice(JSON.parse(stored))
            return
          }
        }
        const stored = localStorage.getItem('pos_latest_invoice')
        setLiveInvoice(stored ? JSON.parse(stored) : null)
      } catch {
        setLiveInvoice(null)
      }
    }

    // 1. Instant cross-tab messaging via BroadcastChannel
    let bc: BroadcastChannel | null = null
    try {
      bc = new BroadcastChannel('pos_receipt_sync')
      bc.onmessage = (event) => {
        const data = event.data
        if (data?.type === 'UPDATE_INVOICE') {
          // If this view is scoped to a specific branch/merchant, filter accordingly
          if (targetBranchId && data.branchId && data.branchId !== targetBranchId) return
          if (targetMerchantId && data.merchantId && data.merchantId !== targetMerchantId) return
          setLiveInvoice(data.invoice)
        } else if (data?.type === 'CLEAR_INVOICE') {
          if (targetBranchId && data.branchId && data.branchId !== targetBranchId) return
          if (targetMerchantId && data.merchantId && data.merchantId !== targetMerchantId) return
          setLiveInvoice(null)
        }
      }
    } catch {}

    // 2. Storage event listener
    window.addEventListener('storage', handleStorageChange)
    // 3. Polling fallback (250ms)
    const interval = setInterval(handleStorageChange, 250)

    return () => {
      if (bc) bc.close()
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [targetBranchId, targetMerchantId])

  // Resolve target invoice
  const activeInvoice: Invoice | null = React.useMemo(() => {
    if (isLiveMode || targetBranchId || !invoiceId) return liveInvoice
    return (
      invoices.find((inv) => inv.id === invoiceId || inv.invoiceNumber === invoiceId) ||
      (liveInvoice && (liveInvoice.id === invoiceId || liveInvoice.invoiceNumber === invoiceId)
        ? liveInvoice
        : liveInvoice)
    )
  }, [isLiveMode, targetBranchId, liveInvoice, invoices, invoiceId])

  // Active Merchant & Branch
  const merchantId = activeInvoice?.merchantId || targetMerchantId || merchants[0]?.id || ''
  const merchant = merchants.find((m) => m.id === merchantId) || merchants[0]
  const branch = branches.find((b) => b.id === (activeInvoice?.branchId || targetBranchId)) || matchedBranch || branches[0]

  // Ensure template is loaded
  React.useEffect(() => {
    if (merchantId) {
      fetchInvoiceTemplate(merchantId).catch(() => {})
    }
  }, [merchantId, fetchInvoiceTemplate])

  // Trigger solid green curtain opening animation from center whenever invoice appears/changes
  React.useEffect(() => {
    if (activeInvoice) {
      if (activeInvoice.id !== lastInvoiceIdRef.current) {
        lastInvoiceIdRef.current = activeInvoice.id
        setCurtainMounted(true)
        setCurtainOpen(false)

        // Fast split open from middle like a curtain (150ms delay, then 450ms fast transition)
        const t1 = setTimeout(() => {
          setCurtainOpen(true)
        }, 150)
        const t2 = setTimeout(() => {
          setCurtainMounted(false)
        }, 750)

        return () => {
          clearTimeout(t1)
          clearTimeout(t2)
        }
      }
    } else {
      lastInvoiceIdRef.current = null
      setCurtainMounted(false)
      setCurtainOpen(false)
    }
  }, [activeInvoice])

  const handlePrint = () => {
    window.print()
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    toast.success('تم نسخ الرابط المباشر للفواتير بنجاح!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className='min-h-screen bg-[#f5f7f5] text-[#101410] font-sans flex flex-col items-center justify-between p-4 sm:p-8 select-none relative overflow-x-hidden'>
      {/* ── Plain Solid Green Curtains (Opens from center swiftly) ── */}
      {curtainMounted && activeInvoice && (
        <div className='fixed inset-0 z-50 pointer-events-none overflow-hidden'>
          {/* Left Curtain Panel (Slides left) */}
          <div
            className='absolute top-0 left-0 w-1/2 h-full bg-[#00d632] shadow-2xl'
            style={{
              transform: curtainOpen ? 'translateX(-100%)' : 'translateX(0)',
              transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
          {/* Right Curtain Panel (Slides right) */}
          <div
            className='absolute top-0 right-0 w-1/2 h-full bg-[#00d632] shadow-2xl'
            style={{
              transform: curtainOpen ? 'translateX(100%)' : 'translateX(0)',
              transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </div>
      )}

      {/* ── Top Bar ── */}
      <header className='w-full max-w-2xl bg-white border border-[#e8ece8] rounded-[18px] p-4 flex items-center justify-between shadow-xs mb-6'>
        <div className='flex items-center gap-3'>
          {merchant?.logo ? (
            <img
              src={merchant.logo}
              alt={merchant.name}
              className='size-10 rounded-xl object-cover border border-[#e8ece8]'
            />
          ) : (
            <div className='size-10 rounded-xl bg-[#00d632] text-[#061006] flex items-center justify-center font-black text-xl'>
              {merchant?.name ? merchant.name.charAt(0).toUpperCase() : 'G'}
            </div>
          )}
          <div>
            <div className='flex items-center gap-2'>
              <h1 className='font-black text-sm text-[#101410] leading-tight'>
                {merchant?.name || 'GREEN STORE'}
              </h1>
              {branch && (
                <span className='text-[10px] text-[#368449] bg-[#e8f9ec] px-2 py-0.5 rounded-md font-bold'>
                  {branch.name}
                </span>
              )}
            </div>
            <p className='text-[11px] text-[#7a827b] mt-0.5'>
              شاشة العرض المباشر للفواتير • يتم التحديث تلقائياً
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Button
            size='sm'
            variant='outline'
            onClick={handleCopyLink}
            className='rounded-xl border-[#e8ece8] text-xs font-bold gap-1.5 hover:bg-[#f0f8f1] cursor-pointer'
          >
            {copied ? <Check className='size-3.5 text-[#16782a]' /> : <Copy className='size-3.5' />}
            <span className='hidden sm:inline'>{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
          </Button>

          {activeInvoice && (
            <Button
              size='sm'
              onClick={handlePrint}
              className='rounded-xl bg-[#00d632] hover:brightness-95 text-[#061006] text-xs font-black gap-1.5 shadow-xs cursor-pointer'
            >
              <Printer className='size-3.5' />
              <span>طباعة</span>
            </Button>
          )}
        </div>
      </header>

      {/* ── Main Stage ── */}
      <main className='w-full flex-1 flex flex-col items-center justify-center my-auto'>
        {activeInvoice ? (
          <div className='flex flex-col items-center gap-4 w-full animate-fadeIn'>
            <div className='inline-flex items-center gap-2 bg-[#e8f9ec] text-[#19832e] px-4 py-1.5 rounded-full text-xs font-bold'>
              <CheckCircle2 className='size-4 text-[#00d632]' />
              <span>
                فاتورة صادرة لفرع {branch?.name || 'الرئيسي'} • معروضة حتى بدء طلب جديد
              </span>
            </div>

            {/* Customized Invoice Design from Portal */}
            <div className='shadow-lg rounded-2xl overflow-hidden'>
              <CustomizedInvoiceView
                invoice={activeInvoice}
                template={invoiceTemplate}
                merchant={merchant}
                branch={branch}
                cashierName='محمد أحمد (كاشير 1)'
              />
            </div>
          </div>
        ) : (
          /* Waiting for Next Order Screen (for live display mode) */
          <div className='max-w-md w-full bg-white border border-[#e8ece8] rounded-[24px] p-8 text-center shadow-xs flex flex-col items-center gap-4 my-auto'>
            <div className='size-16 rounded-full bg-[#e8f9ec] text-[#00d632] flex items-center justify-center animate-pulse'>
              <Clock className='size-8' />
            </div>
            <div>
              <h2 className='text-lg font-black text-[#101410]'>في انتظار تسجيل الطلب التالي...</h2>
              <p className='text-xs text-[#7a827b] mt-1.5 leading-relaxed'>
                مرحباً بكم في {merchant?.name || 'المتجر'} - فرع {branch?.name || 'الرئيسي'}! سيتم فتح الإيصال وعرضه تلقائياً فور إتمام عملية الشراء بواسطة الكاشير.
              </p>
            </div>
            <div className='flex items-center gap-2 text-[11px] text-[#368449] font-bold bg-[#f2fff4] border border-[#00d632]/20 px-3 py-1.5 rounded-full mt-2'>
              <span className='size-2 rounded-full bg-[#00d632] animate-ping' />
              <span>الشاشة متصلة بنقطة البيع لفرع {branch?.name || 'الرئيسي'}</span>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className='w-full max-w-2xl text-center text-xs text-[#7a827b] pt-6 flex items-center justify-between border-t border-[#e8ece8] mt-6'>
        <span>GREEN POS • Paperless Smart Terminal</span>
        <span>فاتورة إلكترونية معتمدة</span>
      </footer>
    </div>
  )
}
