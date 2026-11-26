import * as React from 'react'
import {
  RotateCcw,
  Search,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Minus,
  Plus,
  Loader2,
  ArrowLeft,
  PackageCheck,
  Lock,
  Delete,
  AlertCircle,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api-client'
import { useLang } from '@/lib/i18n'
import type { Invoice, ReturnPolicy } from '@/types/saas'
import { toast } from 'sonner'

interface PosReturnModalProps {
  isOpen: boolean
  onClose: () => void
  merchantId: string
  branchId?: string | null
  initialInvoice?: Invoice | null
  requireManagerPin?: boolean
  onReturnComplete?: (updatedInvoice: Invoice) => void
}

export function PosReturnModal({
  isOpen,
  onClose,
  merchantId,
  branchId,
  initialInvoice = null,
  requireManagerPin = true,
  onReturnComplete,
}: PosReturnModalProps) {
  const { isAr, dir, t } = useLang()

  const [policy, setPolicy] = React.useState<ReturnPolicy>({
    returnPolicyDays: 14,
    allowPartialReturn: true,
    returnPolicyNotes: '',
    requireManagerPin: true,
    isDefaultPin: true,
  })
  const [invoicesList, setInvoicesList] = React.useState<Invoice[]>([])
  const [isLoadingList, setIsLoadingList] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')

  // Branch Manager PIN Gate State
  const [isManagerAuthorized, setIsManagerAuthorized] = React.useState(!requireManagerPin)
  const [managerPin, setManagerPin] = React.useState('')
  const [pinError, setPinError] = React.useState<string | null>(null)
  const [isVerifyingPin, setIsVerifyingPin] = React.useState(false)
  const [pinShake, setPinShake] = React.useState(false)

  const [selectedInvoice, setSelectedInvoice] = React.useState<Invoice | null>(null)
  const [returnQuantities, setReturnQuantities] = React.useState<Record<string, number>>({})
  const [reason, setReason] = React.useState('')
  const [restock, setRestock] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Load merchant return policy & recent invoices whenever modal opens
  React.useEffect(() => {
    if (!isOpen) return
    let cancelled = false

    setSearchQuery('')
    setReason('')
    setRestock(true)
    setReturnQuantities({})
    setManagerPin('')
    setPinError(null)
    setPinShake(false)
    setIsManagerAuthorized(!requireManagerPin)

    api.invoices
      .getReturnPolicy(merchantId)
      .then((p) => {
        if (!cancelled && p) {
          setPolicy(p)
          if (!requireManagerPin || p.requireManagerPin === false) {
            setIsManagerAuthorized(true)
          }
        }
      })
      .catch(() => {})

    if (initialInvoice) {
      setSelectedInvoice(initialInvoice)
    } else {
      setSelectedInvoice(null)
      setIsLoadingList(true)
      api.invoices
        .list({ merchantId, branchId: branchId || undefined })
        .then((list) => {
          if (!cancelled) setInvoicesList(Array.isArray(list) ? list : [])
        })
        .catch(() => {
          if (!cancelled) setInvoicesList([])
        })
        .finally(() => {
          if (!cancelled) setIsLoadingList(false)
        })
    }

    return () => {
      cancelled = true
    }
  }, [isOpen, merchantId, branchId, initialInvoice, requireManagerPin])

  const verifyManagerPin = React.useCallback(
    async (pinToVerify: string) => {
      if (!pinToVerify || isVerifyingPin) return
      setIsVerifyingPin(true)
      setPinError(null)
      try {
        const res = await api.invoices.verifyReturnPin({
          merchantId,
          pin: pinToVerify,
        })
        if (res.valid) {
          setIsManagerAuthorized(true)
          setManagerPin('')
          toast.success(t('تم التحقق من تصريح مدير الفرع ✓', 'Branch Manager authorized ✓'))
        } else {
          setPinError(t('الرقم السري لمدير الفرع غير صحيح', 'Incorrect Branch Manager PIN'))
          setPinShake(true)
          setTimeout(() => {
            setPinShake(false)
            setManagerPin('')
          }, 420)
        }
      } catch (err: any) {
        setPinError(err?.message || t('الرقم السري لمدير الفرع غير صحيح', 'Incorrect Branch Manager PIN'))
        setPinShake(true)
        setTimeout(() => {
          setPinShake(false)
          setManagerPin('')
        }, 420)
      } finally {
        setIsVerifyingPin(false)
      }
    },
    [merchantId, isVerifyingPin, t]
  )

  const handlePinDigit = React.useCallback(
    (digit: string) => {
      if (isVerifyingPin) return
      setPinError(null)
      setManagerPin((prev) => {
        if (prev.length >= 6) return prev
        const next = prev + digit
        // Auto-submit on 4 digits if merchant is using standard 4-digit PIN (or user can press Confirm for 5-6 digits)
        if (next.length === 4 && policy.isDefaultPin) {
          window.setTimeout(() => verifyManagerPin(next), 80)
        }
        return next
      })
    },
    [isVerifyingPin, policy.isDefaultPin, verifyManagerPin]
  )

  const handlePinBackspace = React.useCallback(() => {
    setPinError(null)
    setManagerPin((prev) => prev.slice(0, -1))
  }, [])

  const handlePinClear = React.useCallback(() => {
    setPinError(null)
    setManagerPin('')
  }, [])

  // Physical keyboard support while on the Branch Manager PIN Gate
  React.useEffect(() => {
    if (!isOpen || isManagerAuthorized) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        handlePinDigit(e.key)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        handlePinBackspace()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        if (managerPin.length > 0) {
          handlePinClear()
        } else {
          onClose()
        }
      } else if (e.key === 'Enter' && managerPin.length >= 4) {
        e.preventDefault()
        verifyManagerPin(managerPin)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    isOpen,
    isManagerAuthorized,
    managerPin,
    handlePinDigit,
    handlePinBackspace,
    handlePinClear,
    verifyManagerPin,
    onClose,
  ])

  // Auto-select all remaining items if partial returns are disallowed
  React.useEffect(() => {
    if (!selectedInvoice) return
    if (!policy.allowPartialReturn) {
      const allMap: Record<string, number> = {}
      ;(selectedInvoice.items || []).forEach((it) => {
        const rem = Math.max(0, it.quantity - (it.returnedQty || 0))
        if (rem > 0) allMap[it.id] = rem
      })
      setReturnQuantities(allMap)
    } else {
      setReturnQuantities({})
    }
  }, [selectedInvoice, policy.allowPartialReturn])

  const filteredInvoices = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return invoicesList
      .filter((inv) => inv.status !== 'CANCELLED')
      .filter((inv) => {
        if (!q) return true
        return (
          inv.invoiceNumber.toLowerCase().includes(q) ||
          (inv.customerName || '').toLowerCase().includes(q) ||
          (inv.customerPhone || '').includes(q)
        )
      })
      .slice(0, 30)
  }, [invoicesList, searchQuery])

  // Compute policy window check for any invoice
  const getWindowInfo = (inv: Invoice) => {
    const issued = new Date(inv.issuedAt || inv.createdAt)
    const elapsedDays = Math.max(
      0,
      Math.floor((Date.now() - issued.getTime()) / (1000 * 60 * 60 * 24))
    )
    const maxDays = policy.returnPolicyDays ?? 14
    const remainingDays = maxDays - elapsedDays
    const isAllowed = maxDays > 0 && elapsedDays <= maxDays && inv.status !== 'REFUNDED' && inv.status !== 'CANCELLED'
    return { elapsedDays, maxDays, remainingDays, isAllowed }
  }

  const windowInfo = selectedInvoice ? getWindowInfo(selectedInvoice) : null

  const items = selectedInvoice?.items || []
  const totalRemainingItems = items.reduce(
    (sum, it) => sum + Math.max(0, it.quantity - (it.returnedQty || 0)),
    0
  )
  const totalSelectedQty = Object.values(returnQuantities).reduce((s, q) => s + (q || 0), 0)
  const isFullReturnSelection = totalSelectedQty > 0 && totalSelectedQty >= totalRemainingItems

  // Exact proportional refund preview matching backend logic
  const estimatedRefund = React.useMemo(() => {
    if (!selectedInvoice || totalSelectedQty <= 0) return 0
    const remainingGrand = Math.max(
      0,
      Number(selectedInvoice.grandTotal || 0) - Number(selectedInvoice.refundedTotal || 0)
    )
    if (isFullReturnSelection) {
      return Math.round(remainingGrand * 100) / 100
    }
    let returnedSub = 0
    for (const it of items) {
      const q = returnQuantities[it.id] || 0
      if (q > 0) returnedSub += q * Number(it.unitPrice || 0)
    }
    const ratio =
      selectedInvoice.subtotal > 0
        ? Number(selectedInvoice.grandTotal || 0) / Number(selectedInvoice.subtotal)
        : 1
    return Math.min(remainingGrand, Math.round(returnedSub * ratio * 100) / 100)
  }, [selectedInvoice, items, returnQuantities, totalSelectedQty, isFullReturnSelection])

  const handleSelectAllRemaining = () => {
    if (!selectedInvoice) return
    const allMap: Record<string, number> = {}
    items.forEach((it) => {
      const rem = Math.max(0, it.quantity - (it.returnedQty || 0))
      if (rem > 0) allMap[it.id] = rem
    })
    setReturnQuantities(allMap)
  }

  const handleStepQty = (itemId: string, delta: number, maxQty: number) => {
    if (!policy.allowPartialReturn) return
    setReturnQuantities((prev) => {
      const next = Math.max(0, Math.min(maxQty, (prev[itemId] || 0) + delta))
      return { ...prev, [itemId]: next }
    })
  }

  const handleSubmitReturn = async () => {
    if (!selectedInvoice || isSubmitting) return
    if (!windowInfo?.isAllowed) {
      toast.error(
        t(
          'هذه الفاتورة غير مؤهلة للمرتجع حسب سياسة المتجر.',
          'This invoice is outside the return policy window.'
        )
      )
      return
    }

    const payloadItems = Object.entries(returnQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([itemId, quantity]) => ({ itemId, quantity }))

    if (payloadItems.length === 0) {
      toast.error(t('يرجى تحديد صنف واحد على الأقل للاسترجاع', 'Select at least one item to return'))
      return
    }

    setIsSubmitting(true)
    try {
      const res = await api.invoices.returnItems(selectedInvoice.id, {
        items: payloadItems,
        reason: reason.trim() || undefined,
        restock,
      })

      toast.success(
        res.isFullReturn
          ? t(
              `✓ تم استرجاع الفاتورة بالكامل — المبلغ المسترد: E£ ${res.refundAmount.toFixed(2)}`,
              `✓ Full return completed — Refunded: E£ ${res.refundAmount.toFixed(2)}`
            )
          : t(
              `✓ تم تسجيل مرتجع جزئي — المبلغ المسترد: E£ ${res.refundAmount.toFixed(2)}`,
              `✓ Partial return recorded — Refunded: E£ ${res.refundAmount.toFixed(2)}`
            )
      )

      onReturnComplete?.(res.invoice)
      onClose()
    } catch (err: any) {
      toast.error(err?.message || t('فشل تنفيذ المرتجع', 'Failed to process return'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent
        dir={dir}
        className={`${
          !isManagerAuthorized ? 'sm:max-w-sm' : 'sm:max-w-2xl'
        } max-h-[90vh] p-5 rounded-[20px] flex flex-col overflow-hidden bg-white dark:bg-[#1E1F20] border border-border text-foreground`}
      >
        {/* ── STEP 0: BRANCH MANAGER PIN GATE ── */}
        {!isManagerAuthorized ? (
          <div className='flex flex-col items-center text-center space-y-4 py-1'>
            <div className='size-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm'>
              <Lock className='size-5' />
            </div>

            <div className='space-y-1'>
              <DialogTitle className='text-base font-black text-foreground'>
                {t('تصريح مدير الفرع للمرتجعات', 'Branch Manager PIN Required')}
              </DialogTitle>
              <p className='text-xs text-muted-foreground leading-relaxed'>
                {t(
                  'أدخل الرقم السري الخاص بمدير الفرع لفتح شاشة المرتجعات',
                  'Enter the Branch Manager PIN to unlock POS returns'
                )}
              </p>
            </div>

            {/* PIN Dots */}
            <div
              dir='ltr'
              className={`flex items-center justify-center gap-3 py-2 ${
                pinShake ? 'animate-[shake_0.35s_ease-in-out]' : ''
              }`}
            >
              {[0, 1, 2, 3, 4, 5].slice(0, Math.max(4, managerPin.length)).map((idx) => {
                const filled = idx < managerPin.length
                return (
                  <div
                    key={idx}
                    className={`size-4 rounded-full border-2 transition-all duration-150 ${
                      pinError
                        ? 'border-destructive bg-destructive'
                        : filled
                          ? 'border-primary bg-primary scale-110'
                          : 'border-muted-foreground/35 bg-transparent'
                    }`}
                  />
                )
              })}
            </div>

            {pinError && (
              <div className='flex items-center gap-1.5 text-xs font-bold text-destructive bg-destructive/10 px-3 py-1.5 rounded-xl'>
                <AlertCircle className='size-3.5 shrink-0' />
                <span>{pinError}</span>
              </div>
            )}

            {/* Tactile Numeric Keypad */}
            <div dir='ltr' className='grid grid-cols-3 gap-2 w-full max-w-[260px]'>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                <button
                  key={d}
                  type='button'
                  disabled={isVerifyingPin}
                  onClick={() => handlePinDigit(d)}
                  className='h-12 rounded-xl border border-border bg-muted/40 hover:bg-muted active:scale-95 text-base font-mono font-black text-foreground transition-all cursor-pointer'
                >
                  {d}
                </button>
              ))}
              <button
                type='button'
                disabled={isVerifyingPin}
                onClick={handlePinClear}
                className='h-12 rounded-xl border border-border bg-muted/20 hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer'
              >
                {t('مسح', 'Clear')}
              </button>
              <button
                type='button'
                disabled={isVerifyingPin}
                onClick={() => handlePinDigit('0')}
                className='h-12 rounded-xl border border-border bg-muted/40 hover:bg-muted active:scale-95 text-base font-mono font-black text-foreground transition-all cursor-pointer'
              >
                0
              </button>
              <button
                type='button'
                disabled={isVerifyingPin}
                onClick={handlePinBackspace}
                className='h-12 rounded-xl border border-border bg-muted/20 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer'
                title={t('حذف رقم', 'Backspace')}
              >
                <Delete className='size-4.5' />
              </button>
            </div>

            {/* Confirm / Cancel Buttons */}
            <div className='flex items-center gap-2 w-full max-w-[260px] pt-1'>
              <Button
                type='button'
                variant='outline'
                onClick={onClose}
                disabled={isVerifyingPin}
                className='flex-1 h-10 rounded-xl font-bold text-xs cursor-pointer'
              >
                {t('إلغاء', 'Cancel')}
              </Button>
              <Button
                type='button'
                disabled={managerPin.length < 4 || isVerifyingPin}
                onClick={() => verifyManagerPin(managerPin)}
                className='flex-[2] h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-black text-xs gap-1.5 cursor-pointer'
              >
                {isVerifyingPin && <Loader2 className='size-3.5 animate-spin' />}
                <span>{t('فتح المرتجعات', 'Unlock Returns')}</span>
              </Button>
            </div>

            {policy.isDefaultPin && (
              <p className='text-[10.5px] text-muted-foreground'>
                {t(
                  'الرمز الافتراضي: 0000 (يمكن تغييره من الفواتير ← سياسة المرتجع)',
                  'Default PIN: 0000 (customizable in Invoices → Return Policy)'
                )}
              </p>
            )}

            <style>{`
              @keyframes shake {
                0%, 100% { transform: translateX(0); }
                20%, 60% { transform: translateX(-6px); }
                40%, 80% { transform: translateX(6px); }
              }
            `}</style>
          </div>
        ) : (
          <>
        <DialogHeader className='text-start shrink-0 pb-2 border-b border-border/70'>
          <div className='flex items-center justify-between gap-2 flex-wrap'>
            <DialogTitle className='text-base font-black flex items-center gap-2'>
              <div className='size-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0'>
                <RotateCcw className='size-4' />
              </div>
              <span>
                {selectedInvoice
                  ? t(`مرتجع فاتورة #${selectedInvoice.invoiceNumber}`, `Return Invoice #${selectedInvoice.invoiceNumber}`)
                  : t('المرتجعات — استرجاع فاتورة أو جزء منها', 'POS Returns — Full or Partial Return')}
              </span>
            </DialogTitle>

            {/* Active Return Policy Pill */}
            <Badge variant='outline' className='gap-1.5 text-[11px] font-bold bg-muted/50'>
              <ShieldCheck className='size-3.5 text-emerald-600 dark:text-[#3EEA85]' />
              <span>
                {policy.returnPolicyDays === 0
                  ? t('المرتجع غير مسموح', 'Returns disabled')
                  : t(`مدة المرتجع: ${policy.returnPolicyDays} يوم`, `Policy: ${policy.returnPolicyDays} days`)}
              </span>
            </Badge>
          </div>
        </DialogHeader>

        {/* STEP 1: SEARCH & PICK INVOICE */}
        {!selectedInvoice ? (
          <div className='flex flex-col gap-3 flex-1 min-h-0 pt-3'>
            <div className='relative shrink-0'>
              <Search className='size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2' />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t(
                  'ابحث برقم الفاتورة (INV-...) أو اسم العميل أو الهاتف...',
                  'Search by invoice # (INV-...), customer name, or phone...'
                )}
                className='ps-9 h-10 text-xs rounded-xl bg-background'
                autoFocus
              />
            </div>

            {policy.returnPolicyNotes && (
              <div className='rounded-xl bg-muted/40 border border-border/70 px-3 py-2 text-[11px] text-muted-foreground flex items-center gap-2 shrink-0'>
                <ShieldCheck className='size-3.5 shrink-0 text-foreground' />
                <span>{policy.returnPolicyNotes}</span>
              </div>
            )}

            <div className='flex-1 min-h-0 overflow-y-auto rounded-xl border border-border/80 divide-y divide-border/50'>
              {isLoadingList ? (
                <div className='py-14 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground'>
                  <Loader2 className='size-5 animate-spin' />
                  <span>{t('جاري تحميل الفواتير...', 'Loading invoices...')}</span>
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className='py-14 text-center text-xs text-muted-foreground'>
                  {t('لا توجد فواتير مطابقة للبحث', 'No matching invoices found')}
                </div>
              ) : (
                filteredInvoices.map((inv) => {
                  const info = getWindowInfo(inv)
                  const isRefunded = inv.status === 'REFUNDED'
                  const isPartial = inv.status === 'PARTIALLY_RETURNED'

                  return (
                    <button
                      key={inv.id}
                      type='button'
                      disabled={isRefunded}
                      onClick={() => setSelectedInvoice(inv)}
                      className={`w-full p-3.5 flex items-center justify-between gap-3 text-start transition-colors ${
                        isRefunded
                          ? 'opacity-50 cursor-not-allowed bg-muted/20'
                          : 'hover:bg-muted/40 cursor-pointer'
                      }`}
                    >
                      <div className='min-w-0 space-y-1'>
                        <div className='flex items-center gap-2 flex-wrap'>
                          <span className='font-mono font-bold text-xs text-foreground'>
                            #{inv.invoiceNumber}
                          </span>
                          {isRefunded ? (
                            <Badge variant='outline' className='text-[10px] text-rose-600 border-rose-500/40'>
                              {t('مرتجع بالكامل', 'Fully Returned')}
                            </Badge>
                          ) : isPartial ? (
                            <Badge variant='outline' className='text-[10px] text-amber-600 border-amber-500/40'>
                              {t('مرتجع جزئي', 'Partial Return')}
                            </Badge>
                          ) : (
                            <Badge variant='outline' className='text-[10px] text-emerald-600 border-emerald-500/40'>
                              {t('مدفوعة', 'Paid')}
                            </Badge>
                          )}
                          {!isRefunded && !info.isAllowed && (
                            <Badge variant='outline' className='text-[10px] text-destructive border-destructive/40'>
                              {t('انتهت مدة المرتجع', 'Expired')}
                            </Badge>
                          )}
                        </div>
                        <p className='text-[11px] text-muted-foreground truncate'>
                          {inv.customerName || t('عميل نقدي', 'Walk-in')} &bull;{' '}
                          {new Date(inv.issuedAt || inv.createdAt).toLocaleString(isAr ? 'ar-EG' : 'en-GB', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          &bull; {(inv.items || []).length} {t('صنف', 'items')}
                        </p>
                      </div>

                      <div className='text-end shrink-0'>
                        <p className='font-mono font-black text-sm text-foreground' dir='ltr'>
                          E£ {Number(inv.grandTotal || 0).toFixed(2)}
                        </p>
                        {Number(inv.refundedTotal || 0) > 0 && (
                          <p className='font-mono text-[10px] text-amber-600 dark:text-amber-400' dir='ltr'>
                            -{Number(inv.refundedTotal).toFixed(2)} {t('مسترد', 'ref.')}
                          </p>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        ) : (
          /* STEP 2: SELECT ITEMS (FULL OR PARTIAL) */
          <div className='flex flex-col gap-3.5 flex-1 min-h-0 pt-3'>
            {/* Back button (only when opened from POS list) + Window Policy Banner */}
            <div className='flex items-center justify-between gap-2 flex-wrap shrink-0'>
              {!initialInvoice ? (
                <button
                  type='button'
                  onClick={() => setSelectedInvoice(null)}
                  className='inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer'
                >
                  <ArrowLeft className={`size-3.5 ${isAr ? 'rotate-180' : ''}`} />
                  <span>{t('العودة لقائمة الفواتير', 'Back to Invoices')}</span>
                </button>
              ) : (
                <span className='text-xs text-muted-foreground'>
                  {new Date(selectedInvoice.issuedAt || selectedInvoice.createdAt).toLocaleString(
                    isAr ? 'ar-EG' : 'en-GB'
                  )}
                </span>
              )}

              {windowInfo?.isAllowed ? (
                <span className='inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-[#3EEA85]'>
                  <CheckCircle2 className='size-3.5' />
                  {t(
                    `ضمن مدة المرتجع (متبقي ${windowInfo.remainingDays} يوم)`,
                    `Within return window (${windowInfo.remainingDays}d left)`
                  )}
                </span>
              ) : (
                <span className='inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-destructive/15 text-destructive'>
                  <AlertTriangle className='size-3.5' />
                  {policy.returnPolicyDays === 0
                    ? t('سياسة المتجر لا تسمح بالمرتجع', 'Store policy disables returns')
                    : t(
                        `انتهت مدة المرتجع (${windowInfo?.maxDays} يوم — مرّ ${windowInfo?.elapsedDays} يوم)`,
                        `Return window expired (${windowInfo?.elapsedDays}/${windowInfo?.maxDays} days)`
                      )}
                </span>
              )}
            </div>

            {/* Quick Select All / Partial Mode Notice */}
            <div className='flex items-center justify-between gap-2 shrink-0'>
              <span className='text-xs font-bold text-foreground'>
                {policy.allowPartialReturn
                  ? t('اختر الأصناف والكميات المطلوب إرجاعها:', 'Select items & quantities to return:')
                  : t('سياسة المتجر تسمح بالمرتجع الكامل فقط:', 'Full invoice return only (per store policy):')}
              </span>

              {policy.allowPartialReturn && windowInfo?.isAllowed && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={handleSelectAllRemaining}
                  className='h-7 px-2.5 text-[11px] font-bold rounded-lg cursor-pointer'
                >
                  {t('تحديد الفاتورة بالكامل', 'Select Full Invoice')}
                </Button>
              )}
            </div>

            {/* Items List with Steppers */}
            <div className='flex-1 min-h-0 overflow-y-auto rounded-xl border border-border/80 divide-y divide-border/50'>
              {items.map((item) => {
                const alreadyReturned = Number(item.returnedQty || 0)
                const remaining = Math.max(0, item.quantity - alreadyReturned)
                const selectedQty = returnQuantities[item.id] || 0

                return (
                  <div
                    key={item.id}
                    className={`p-3 flex items-center justify-between gap-3 ${
                      remaining === 0 ? 'opacity-50 bg-muted/20' : ''
                    }`}
                  >
                    <div className='min-w-0 flex-1'>
                      <p className='font-bold text-xs text-foreground truncate'>{item.productName}</p>
                      <div className='flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 flex-wrap'>
                        <span className='font-mono' dir='ltr'>
                          E£ {Number(item.unitPrice || 0).toFixed(2)}
                        </span>
                        <span>&bull;</span>
                        <span>
                          {t(`الأصلي: ${item.quantity}`, `Orig: ${item.quantity}`)}
                        </span>
                        {alreadyReturned > 0 && (
                          <span className='text-amber-600 dark:text-amber-400 font-semibold'>
                            ({t(`تم إرجاع ${alreadyReturned}`, `${alreadyReturned} returned`)})
                          </span>
                        )}
                      </div>
                    </div>

                    {remaining === 0 ? (
                      <Badge variant='outline' className='text-[10px] shrink-0'>
                        {t('مرتجع بالكامل', 'Returned')}
                      </Badge>
                    ) : (
                      <div className='flex items-center gap-1.5 shrink-0'>
                        <button
                          type='button'
                          disabled={!policy.allowPartialReturn || selectedQty <= 0 || !windowInfo?.isAllowed}
                          onClick={() => handleStepQty(item.id, -1, remaining)}
                          className='size-7 rounded-lg border border-border bg-background hover:bg-muted flex items-center justify-center disabled:opacity-40 cursor-pointer'
                        >
                          <Minus className='size-3.5' />
                        </button>
                        <span className='w-8 text-center font-mono font-black text-xs'>
                          {selectedQty}/{remaining}
                        </span>
                        <button
                          type='button'
                          disabled={!policy.allowPartialReturn || selectedQty >= remaining || !windowInfo?.isAllowed}
                          onClick={() => handleStepQty(item.id, 1, remaining)}
                          className='size-7 rounded-lg border border-border bg-background hover:bg-muted flex items-center justify-center disabled:opacity-40 cursor-pointer'
                        >
                          <Plus className='size-3.5' />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Reason + Restock + Refund Summary */}
            <div className='space-y-2.5 shrink-0 pt-1'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center'>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t('سبب المرتجع (اختياري)...', 'Return reason (optional)...')}
                  className='h-9 text-xs rounded-xl bg-background'
                  disabled={!windowInfo?.isAllowed}
                />

                <div className='flex items-center justify-between rounded-xl border border-border/80 bg-muted/30 px-3 h-9'>
                  <span className='text-[11px] font-semibold flex items-center gap-1.5'>
                    <PackageCheck className='size-3.5' />
                    {t('إعادة للمخزون تلقائياً', 'Auto-restock items')}
                  </span>
                  <Switch checked={restock} onCheckedChange={setRestock} disabled={!windowInfo?.isAllowed} />
                </div>
              </div>

              <div className='rounded-xl border border-border bg-muted/40 px-4 py-3 flex items-center justify-between'>
                <div>
                  <p className='text-xs font-bold text-foreground'>
                    {isFullReturnSelection
                      ? t('نوع العملية: مرتجع بالكامل', 'Type: Full Invoice Return')
                      : totalSelectedQty > 0
                        ? t(`نوع العملية: مرتجع جزئي (${totalSelectedQty} قطعة)`, `Type: Partial Return (${totalSelectedQty} pcs)`)
                        : t('اختر الكميات لحساب المبلغ المسترد', 'Select quantities to calculate refund')}
                  </p>
                  <p className='text-[10px] text-muted-foreground'>
                    {t('شامل نسبة الضريبة والرسوم تلقائياً', 'Includes proportional tax & fees')}
                  </p>
                </div>
                <span className='text-lg font-mono font-black text-foreground' dir='ltr'>
                  E£ {estimatedRefund.toFixed(2)}
                </span>
              </div>

              <div className='flex items-center gap-2.5 pt-1'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={onClose}
                  disabled={isSubmitting}
                  className='flex-1 h-10 rounded-xl font-bold cursor-pointer'
                >
                  {t('إلغاء', 'Cancel')}
                </Button>
                <Button
                  type='button'
                  disabled={!windowInfo?.isAllowed || totalSelectedQty <= 0 || isSubmitting}
                  onClick={handleSubmitReturn}
                  className='flex-[2] h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-black gap-2 cursor-pointer'
                >
                  {isSubmitting ? (
                    <Loader2 className='size-4 animate-spin' />
                  ) : (
                    <RotateCcw className='size-4' />
                  )}
                  <span>
                    {isSubmitting
                      ? t('جاري تنفيذ المرتجع...', 'Processing Return...')
                      : t('تأكيد المرتجع واسترداد المبلغ', 'Confirm Return & Refund')}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
