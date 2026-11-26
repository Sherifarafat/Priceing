import * as React from 'react'
import { Printer, CheckCircle2, Clock, Copy, Check, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CustomizedInvoiceView } from '@/features/invoices/components/customized-invoice-view'
import { useSaaSStore } from '@/lib/saas-store'
import type { Branch, Invoice, InvoiceTemplate, Merchant } from '@/types/saas'
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

  const readStoredInvoice = React.useCallback((): Invoice | null => {
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
  }, [targetBranchId, targetMerchantId])

  const [liveInvoice, setLiveInvoice] = React.useState<Invoice | null>(() => {
    if (!isLiveMode) {
      const fromStore = invoices.find(
        (inv) => inv.id === invoiceId || inv.invoiceNumber === invoiceId
      )
      if (fromStore) return fromStore
      const stored = readStoredInvoice()
      if (stored && (stored.id === invoiceId || stored.invoiceNumber === invoiceId)) {
        return stored
      }
      return null
    }
    return readStoredInvoice()
  })
  const [remoteMerchant, setRemoteMerchant] = React.useState<Merchant | null>(null)
  const [remoteBranch, setRemoteBranch] = React.useState<Branch | null>(null)
  const [remoteTemplate, setRemoteTemplate] = React.useState<InvoiceTemplate | null>(null)
  const [copied, setCopied] = React.useState(false)

  // Signature Green Scan Brand Intro Curtain ('enter' -> 'exit' -> 'done')
  const [introPhase, setIntroPhase] = React.useState<'enter' | 'exit' | 'done'>('enter')
  const exitTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const doneTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastAnimatedInvoiceIdRef = React.useRef<string | null>(null)
  const clearedManuallyRef = React.useRef<boolean>(false)

  const playIntroAnimation = React.useCallback(() => {
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
    if (doneTimerRef.current) clearTimeout(doneTimerRef.current)

    setIntroPhase('enter')
    exitTimerRef.current = setTimeout(() => {
      setIntroPhase('exit')
    }, 1100)
    doneTimerRef.current = setTimeout(() => {
      setIntroPhase('done')
    }, 1800)
  }, [])

  // Play brand intro animation immediately on page load so it NEVER gets stuck
  React.useEffect(() => {
    playIntroAnimation()
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
      if (doneTimerRef.current) clearTimeout(doneTimerRef.current)
    }
  }, [playIntroAnimation])

  // Fetch public latest invoice from backend (essential when opened on another device/phone with empty localStorage)
  const fetchPublicInvoice = React.useCallback(async () => {
    try {
      const qs = new URLSearchParams()
      if (invoiceId && !isLiveMode) qs.set('id', invoiceId)
      if (targetMerchantId) qs.set('merchantId', targetMerchantId)
      if (targetBranchId) qs.set('branchId', targetBranchId)

      const res = await fetch(`/api/invoices/public/latest?${qs.toString()}`)
      if (!res.ok) return
      const data = await res.json()
      if (data?.merchant) setRemoteMerchant(data.merchant)
      if (data?.branch) setRemoteBranch(data.branch)
      if (data?.template) setRemoteTemplate(data.template)
      if (data?.invoice && !clearedManuallyRef.current) {
        setLiveInvoice((prev) => {
          if (prev?.id === data.invoice.id) return prev
          return data.invoice
        })
      }
    } catch {
      // ignore offline
    }
  }, [invoiceId, isLiveMode, targetMerchantId, targetBranchId])

  React.useEffect(() => {
    fetchPublicInvoice()
    if (!isLiveMode) return
    const remoteInterval = setInterval(fetchPublicInvoice, 3000)
    return () => clearInterval(remoteInterval)
  }, [fetchPublicInvoice, isLiveMode])

  // Sync with BroadcastChannel and localStorage for instant same-device POS updates (Live mode only!)
  // Specific invoice links (/receipt/:id) stay locked permanently to that customer's invoice.
  React.useEffect(() => {
    if (!isLiveMode) return

    const syncFromStorage = () => {
      const next = readStoredInvoice()
      setLiveInvoice((prev) => {
        if (!next && !prev) return prev
        if (next && prev && next.id === prev.id) return prev
        if (next) clearedManuallyRef.current = false
        return next
      })
    }

    let bc: BroadcastChannel | null = null
    try {
      bc = new BroadcastChannel('pos_receipt_sync')
      bc.onmessage = (event) => {
        const data = event.data
        if (data?.type === 'UPDATE_INVOICE') {
          if (targetBranchId && data.branchId && data.branchId !== targetBranchId) return
          if (targetMerchantId && data.merchantId && data.merchantId !== targetMerchantId) return
          clearedManuallyRef.current = false
          setLiveInvoice((prev) =>
            prev?.id === data.invoice?.id ? prev : data.invoice
          )
        } else if (data?.type === 'CLEAR_INVOICE') {
          if (targetBranchId && data.branchId && data.branchId !== targetBranchId) return
          if (targetMerchantId && data.merchantId && data.merchantId !== targetMerchantId) return
          clearedManuallyRef.current = true
          setLiveInvoice(null)
        }
      }
    } catch {}

    window.addEventListener('storage', syncFromStorage)
    const interval = setInterval(syncFromStorage, 500)

    return () => {
      if (bc) bc.close()
      window.removeEventListener('storage', syncFromStorage)
      clearInterval(interval)
    }
  }, [isLiveMode, readStoredInvoice, targetBranchId, targetMerchantId])

  // Resolve target invoice
  const activeInvoice: Invoice | null = React.useMemo(() => {
    if (isLiveMode) return liveInvoice
    return (
      liveInvoice ||
      invoices.find((inv) => inv.id === invoiceId || inv.invoiceNumber === invoiceId) ||
      null
    )
  }, [isLiveMode, liveInvoice, invoices, invoiceId])

  const activeInvoiceId = activeInvoice?.id || null

  // Re-play our signature Green Scan reveal animation when a NEW invoice arrives after initial mount
  React.useEffect(() => {
    if (!activeInvoiceId) {
      lastAnimatedInvoiceIdRef.current = null
      return
    }
    if (lastAnimatedInvoiceIdRef.current === null) {
      // Initial mount already triggered playIntroAnimation()
      lastAnimatedInvoiceIdRef.current = activeInvoiceId
      return
    }
    if (lastAnimatedInvoiceIdRef.current !== activeInvoiceId) {
      lastAnimatedInvoiceIdRef.current = activeInvoiceId
      playIntroAnimation()
    }
  }, [activeInvoiceId, playIntroAnimation])

  // Active Merchant, Branch & Template
  const merchantId = activeInvoice?.merchantId || targetMerchantId || merchants[0]?.id || ''
  const merchant =
    remoteMerchant ||
    merchants.find((m) => m.id === merchantId) ||
    merchants[0]
  const branch =
    remoteBranch ||
    branches.find((b) => b.id === (activeInvoice?.branchId || targetBranchId)) ||
    matchedBranch ||
    branches[0]
  const activeTemplate = remoteTemplate || invoiceTemplate

  // Ensure template is loaded if authenticated
  React.useEffect(() => {
    if (merchantId && !remoteTemplate) {
      fetchInvoiceTemplate(merchantId).catch(() => {})
    }
  }, [merchantId, remoteTemplate, fetchInvoiceTemplate])

  const handlePrint = () => {
    window.print()
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    toast.success('تم نسخ الرابط المباشر للفواتير بنجاح!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShareWhatsApp = () => {
    if (!activeInvoice) return
    const storeName = merchant?.name || 'Green Scan'
    const receiptUrl = activeInvoice.id
      ? `${window.location.origin}/receipt/${activeInvoice.id}${merchant?.id ? `?merchantId=${merchant.id}` : ''}`
      : window.location.href
    const message = [
      `مرحباً بك في ${storeName} 🌿`,
      `شكراً لتسوقك معنا!`,
      ``,
      `🧾 رقم الفاتورة: ${activeInvoice.invoiceNumber}`,
      `💰 الإجمالي: E£ ${Number(activeInvoice.grandTotal || 0).toFixed(2)}`,
      ``,
      `📄 رابط فاتورتك الإلكترونية:`,
      receiptUrl,
    ].join('\n')
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className='min-h-screen bg-[#f5f7f5] text-[#101410] font-sans flex flex-col items-center justify-between p-4 sm:p-8 select-none relative overflow-x-hidden'>
      {/* ── Signature Green Scan Brand Intro Curtain (Slides up to reveal the receipt) ── */}
      {introPhase !== 'done' && (
        <div
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#00d632] text-[#061006] overflow-hidden will-change-transform transition-all duration-[680ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${
            introPhase === 'exit'
              ? '-translate-y-full rounded-b-[48px] shadow-[0_24px_60px_rgba(0,0,0,0.45)] pointer-events-none'
              : 'translate-y-0 rounded-b-none'
          }`}
        >
          {/* Ambient Rippling Rings */}
          <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
            <div
              className='size-52 rounded-full border-2 border-[#061006]/15'
              style={{ animation: 'receiptRipple 1.5s cubic-bezier(0.22,1,0.36,1) infinite' }}
            />
            <div
              className='absolute size-52 rounded-full border-2 border-[#061006]/10'
              style={{ animation: 'receiptRipple 1.5s cubic-bezier(0.22,1,0.36,1) 0.45s infinite' }}
            />
          </div>

          {/* Center Brand Identity Mark */}
          <div
            className={`relative z-10 flex flex-col items-center text-center px-6 transition-all duration-300 ${
              introPhase === 'exit' ? 'opacity-0 scale-90 -translate-y-4' : 'opacity-100 scale-100'
            }`}
          >
            {/* Dark Squircle Viewfinder Emblem */}
            <div
              className='relative size-24 rounded-[28px] bg-[#061006] shadow-[0_20px_50px_rgba(6,16,6,0.35)] flex items-center justify-center overflow-hidden mb-5'
              style={{ animation: 'receiptBadgePop 0.6s cubic-bezier(0.22,1,0.36,1) forwards' }}
            >
              <div className='relative size-12'>
                <span className='absolute top-0 left-0 w-3.5 h-3.5 border-t-[3px] border-l-[3px] border-[#00d632] rounded-tl-md' />
                <span className='absolute top-0 right-0 w-3.5 h-3.5 border-t-[3px] border-r-[3px] border-[#00d632] rounded-tr-md' />
                <span className='absolute bottom-0 left-0 w-3.5 h-3.5 border-b-[3px] border-l-[3px] border-[#00d632] rounded-bl-md' />
                <span className='absolute bottom-0 right-0 w-3.5 h-3.5 border-b-[3px] border-r-[3px] border-[#00d632] rounded-br-md' />
                <div
                  className='absolute inset-x-0.5 h-[3px] rounded-full bg-[#00d632] shadow-[0_0_12px_#00d632]'
                  style={{ animation: 'receiptLaserSweep 1.1s ease-in-out infinite' }}
                />
              </div>
            </div>

            {/* Brand Title */}
            <div
              className='space-y-1.5'
              style={{ animation: 'receiptFadeUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.15s both' }}
            >
              <h1 className='text-3xl font-black tracking-tight text-[#061006]'>
                Green Scan
              </h1>
              <p className='text-xs font-extrabold tracking-wide text-[#061006]/75'>
                فاتورتك الرقمية الذكية
              </p>
            </div>

            {/* Store Pill */}
            {merchant?.name && (
              <div
                className='mt-5 inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#061006]/10 border border-[#061006]/15'
                style={{ animation: 'receiptFadeUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.25s both' }}
              >
                {merchant.logo ? (
                  <img
                    src={merchant.logo}
                    alt={merchant.name}
                    className='size-6 rounded-full object-cover border border-[#061006]/20'
                  />
                ) : (
                  <div className='size-6 rounded-full bg-[#061006] text-[#00d632] flex items-center justify-center text-[11px] font-black'>
                    {merchant.name[0]?.toUpperCase() || 'G'}
                  </div>
                )}
                <span className='text-xs font-black text-[#061006]'>{merchant.name}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes receiptBadgePop {
          0%   { transform: scale(0.55); opacity: 0; }
          65%  { transform: scale(1.06); opacity: 1; }
          100% { transform: scale(1);    opacity: 1; }
        }
        @keyframes receiptFadeUp {
          0%   { transform: translateY(14px); opacity: 0; }
          100% { transform: translateY(0);    opacity: 1; }
        }
        @keyframes receiptLaserSweep {
          0%, 100% { top: 4px; opacity: 0.9; }
          50%      { top: calc(100% - 7px); opacity: 1; }
        }
        @keyframes receiptRipple {
          0%   { transform: scale(0.7); opacity: 0.7; }
          100% { transform: scale(2.15); opacity: 0; }
        }
      `}</style>

      {/* ── Top Bar ── */}
      <header className='w-full max-w-2xl bg-white border border-[#e8ece8] rounded-[18px] p-4 flex items-center justify-between shadow-xs mb-6 print:hidden'>
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
              variant='outline'
              onClick={handleShareWhatsApp}
              className='rounded-xl border-[#e8ece8] text-xs font-bold gap-1.5 hover:bg-[#e8f9ec] hover:text-[#16782a] cursor-pointer'
            >
              <MessageCircle className='size-3.5 text-[#25D366]' />
              <span className='hidden sm:inline'>واتساب</span>
            </Button>
          )}

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
          <div className='flex flex-col items-center gap-4 w-full animate-in fade-in slide-in-from-bottom-3 duration-500'>
            <div className='inline-flex items-center gap-2 bg-[#e8f9ec] text-[#19832e] px-4 py-1.5 rounded-full text-xs font-bold print:hidden'>
              <CheckCircle2 className='size-4 text-[#00d632]' />
              <span>
                فاتورة صادرة لفرع {branch?.name || 'الرئيسي'} • معروضة حتى بدء طلب جديد
              </span>
            </div>

            {/* Customized Invoice Design from Portal */}
            <div className='shadow-lg rounded-2xl overflow-hidden'>
              <CustomizedInvoiceView
                invoice={activeInvoice}
                template={activeTemplate}
                merchant={merchant}
                branch={branch}
                cashierName='الكاشير'
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
      <footer className='w-full max-w-2xl text-center text-xs text-[#7a827b] pt-6 flex items-center justify-between border-t border-[#e8ece8] mt-6 print:hidden'>
        <span>GREEN SCAN POS • Paperless Smart Terminal</span>
        <span>فاتورة إلكترونية معتمدة</span>
      </footer>
    </div>
  )
}
