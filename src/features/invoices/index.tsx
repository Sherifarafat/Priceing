import * as React from 'react'
import {
  FileText,
  Plus,
  Search,
  Printer,
  Eye,
  Trash2,
  QrCode,
  DollarSign,
  Receipt,
  CheckCircle2,
  Clock,
  ArrowLeftRight,
  XCircle,
  CreditCard,
  Coins,
  ChevronRight,
  RotateCcw,
  ShieldCheck,
  Loader2,
  Zap,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { LanguageSwitch } from '@/components/language-switch'
import { PosShortcutButton } from '@/components/pos-shortcut-button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useSaaSStore } from '@/lib/saas-store'
import { useLang } from '@/lib/i18n'
import { api } from '@/lib/api-client'
import { PosReturnModal } from '@/features/pos/components/pos-return-modal'
import { Invoice, InvoiceStatus, InvoicePaymentMethod, ReturnPolicy } from '@/types/saas'
import { toast } from 'sonner'

export function InvoicesView() {
  const { isAr, dir, t } = useLang()
  const {
    invoices,
    merchants,
    branches,
    products,
    fees,
    invoiceTemplate,
    currentUser,
    createInvoice,
    deleteInvoice,
    fetchInvoices,
    fetchInvoiceTemplate,
    fetchFromBackend,
  } = useSaaSStore()

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN'
  const merchantId = currentUser.merchantId || merchants[0]?.id || ''

  // Filters
  const [selectedMerchantId, setSelectedMerchantId] = React.useState('all')
  const [selectedBranchId, setSelectedBranchId] = React.useState('all')
  const [selectedStatus, setSelectedStatus] = React.useState('all')
  const [searchQuery, setSearchQuery] = React.useState('')

  // Dialogs
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [viewingInvoice, setViewingInvoice] = React.useState<Invoice | null>(null)
  const [deletingInvoice, setDeletingInvoice] = React.useState<Invoice | null>(null)
  const [returningInvoice, setReturningInvoice] = React.useState<Invoice | null>(null)

  // Merchant Return Policy State
  const [isPolicyOpen, setIsPolicyOpen] = React.useState(false)
  const [isSavingPolicy, setIsSavingPolicy] = React.useState(false)
  const [returnPolicy, setReturnPolicy] = React.useState<ReturnPolicy>({
    returnPolicyDays: 14,
    allowPartialReturn: true,
    returnPolicyNotes: '',
  })
  const [policyDaysInput, setPolicyDaysInput] = React.useState('14')
  const [policyAllowPartial, setPolicyAllowPartial] = React.useState(true)
  const [policyNotesInput, setPolicyNotesInput] = React.useState('')
  const [policyRequirePin, setPolicyRequirePin] = React.useState(true)
  const [policyManagerPinInput, setPolicyManagerPinInput] = React.useState('0000')

  const policyMerchantId = isSuperAdmin
    ? selectedMerchantId !== 'all'
      ? selectedMerchantId
      : merchants[0]?.id || ''
    : merchantId

  React.useEffect(() => {
    if (!policyMerchantId) return
    let cancelled = false
    api.invoices
      .getReturnPolicy(policyMerchantId)
      .then((pol) => {
        if (!cancelled && pol) {
          setReturnPolicy(pol)
          setPolicyDaysInput(String(pol.returnPolicyDays ?? 14))
          setPolicyAllowPartial(pol.allowPartialReturn !== false)
          setPolicyNotesInput(pol.returnPolicyNotes || '')
          setPolicyRequirePin(pol.requireManagerPin !== false)
          if (pol.managerPin) setPolicyManagerPinInput(pol.managerPin)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [policyMerchantId])

  const handleSaveReturnPolicy = async (e: React.FormEvent) => {
    e.preventDefault()
    const days = Math.max(0, Math.min(365, Math.floor(Number(policyDaysInput) || 0)))
    const cleanPin = policyManagerPinInput.replace(/\D/g, '').trim()
    if (policyRequirePin && (cleanPin.length < 4 || cleanPin.length > 6)) {
      toast.error(
        t(
          'الرقم السري لمدير الفرع يجب أن يتكون من 4 إلى 6 أرقام',
          'Branch Manager PIN must be 4 to 6 digits'
        )
      )
      return
    }
    setIsSavingPolicy(true)
    try {
      const saved = await api.invoices.saveReturnPolicy({
        merchantId: policyMerchantId,
        returnPolicyDays: days,
        allowPartialReturn: policyAllowPartial,
        returnPolicyNotes: policyNotesInput.trim(),
        requireManagerPin: policyRequirePin,
        managerPin: cleanPin || undefined,
      })
      setReturnPolicy(saved)
      setPolicyDaysInput(String(saved.returnPolicyDays))
      if (saved.managerPin) setPolicyManagerPinInput(saved.managerPin)
      setIsPolicyOpen(false)
      toast.success(
        t(
          `تم حفظ سياسة المرتجع (${saved.returnPolicyDays} يوم) بنجاح ✓`,
          `Return policy (${saved.returnPolicyDays} days) saved ✓`
        )
      )
    } catch (err: any) {
      toast.error(err?.message || t('فشل حفظ سياسة المرتجع', 'Failed to save return policy'))
    } finally {
      setIsSavingPolicy(false)
    }
  }

  // Issue Invoice Form State
  const [targetMerchantId, setTargetMerchantId] = React.useState(merchantId)
  const [targetBranchId, setTargetBranchId] = React.useState('')
  const [customerName, setCustomerName] = React.useState('')
  const [customerPhone, setCustomerPhone] = React.useState('')
  const [customerTaxNo, setCustomerTaxNo] = React.useState('')
  const [paymentMethod, setPaymentMethod] = React.useState<InvoicePaymentMethod>('CASH')
  const [invoiceStatus, setInvoiceStatus] = React.useState<InvoiceStatus>('PAID')
  const [notes, setNotes] = React.useState('')
  const [selectedProductIds, setSelectedProductIds] = React.useState<
    Array<{ productId: string; qty: number }>
  >([])
  const [selectedFeeIds, setSelectedFeeIds] = React.useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    fetchInvoices()
    fetchInvoiceTemplate(targetMerchantId)
  }, [fetchInvoices, fetchInvoiceTemplate, targetMerchantId])

  // Filter products by merchant
  const availableProducts = products.filter(
    (p) => p.merchantId === (isSuperAdmin && targetMerchantId ? targetMerchantId : merchantId)
  )
  const availableBranches = branches.filter(
    (b) => b.merchantId === (isSuperAdmin && targetMerchantId ? targetMerchantId : merchantId)
  )
  const availableFees = fees.filter(
    (f) => !f.merchantId || f.merchantId === (isSuperAdmin && targetMerchantId ? targetMerchantId : merchantId)
  )

  const openCreateDialog = () => {
    setTargetMerchantId(isSuperAdmin ? (merchants[0]?.id || '') : merchantId)
    setTargetBranchId(availableBranches[0]?.id || '')
    setCustomerName('')
    setCustomerPhone('')
    setCustomerTaxNo('')
    setPaymentMethod('CASH')
    setInvoiceStatus('PAID')
    setNotes('')
    setSelectedFeeIds(availableFees.filter((f) => f.status === 'Active').map((f) => f.id))
    if (availableProducts.length > 0) {
      setSelectedProductIds([{ productId: availableProducts[0].id, qty: 1 }])
    } else {
      setSelectedProductIds([])
    }
    setIsCreateOpen(true)
  }

  // Calculate totals for issue dialog
  const calculatedItems = selectedProductIds.map((item) => {
    const prod = availableProducts.find((p) => p.id === item.productId)
    const unitPrice = prod?.price || 0
    const totalPrice = unitPrice * item.qty
    return {
      productId: prod?.id,
      productName: prod?.name || 'Custom Item',
      barcode: prod?.barcode,
      quantity: item.qty,
      unitPrice,
      totalPrice,
      feeIds: prod?.feeIds || [],
    }
  })

  const formSubtotal = calculatedItems.reduce((acc, it) => acc + it.totalPrice, 0)

  // Calculate fees total
  let formFeesTotal = 0
  selectedFeeIds.forEach((fid) => {
    const fee = availableFees.find((f) => f.id === fid)
    if (fee) {
      if (fee.type === 'PERCENTAGE') {
        formFeesTotal += (formSubtotal * fee.value) / 100
      } else {
        formFeesTotal += fee.value
      }
    }
  })

  const formGrandTotal = formSubtotal + formFeesTotal

  const handleIssueInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (calculatedItems.length === 0) {
      toast.error('Please add at least one product to the invoice')
      return
    }

    setIsSubmitting(true)
    try {
      await createInvoice({
        merchantId: isSuperAdmin ? targetMerchantId : merchantId,
        branchId: targetBranchId || null,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        customerTaxNo: customerTaxNo.trim() || undefined,
        paymentMethod,
        status: invoiceStatus,
        subtotal: formSubtotal,
        taxTotal: 0,
        feesTotal: formFeesTotal,
        discountTotal: 0,
        grandTotal: formGrandTotal,
        appliedFees: selectedFeeIds,
        notes: notes.trim() || undefined,
        items: calculatedItems,
      })

      toast.success('Invoice issued successfully!')
      setIsCreateOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to issue invoice')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (deletingInvoice) {
      await deleteInvoice(deletingInvoice.id)
      toast.success(`Invoice "${deletingInvoice.invoiceNumber}" deleted`)
      setDeletingInvoice(null)
    }
  }

  // Filter invoices
  const filteredInvoices = (invoices || []).filter((inv) => {
    const matchesMerchant = isSuperAdmin
      ? selectedMerchantId === 'all' || inv.merchantId === selectedMerchantId
      : inv.merchantId === merchantId

    const matchesBranch = currentUser.branchId
      ? inv.branchId === currentUser.branchId
      : selectedBranchId === 'all' || inv.branchId === selectedBranchId

    const matchesStatus =
      selectedStatus === 'all' || inv.status === selectedStatus

    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.customerName && inv.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inv.customerPhone && inv.customerPhone.includes(searchQuery))

    return matchesMerchant && matchesBranch && matchesStatus && matchesSearch
  })

  // KPI Calculations (Net revenue accounts for refundedTotal)
  const totalCount = filteredInvoices.length
  const totalRefunded = filteredInvoices.reduce((sum, inv) => sum + Number(inv.refundedTotal || 0), 0)
  const totalRevenue = filteredInvoices.reduce(
    (sum, inv) => sum + Math.max(0, Number(inv.grandTotal || 0) - Number(inv.refundedTotal || 0)),
    0
  )
  const paidCount = filteredInvoices.filter((inv) => inv.status === 'PAID').length
  const returnedCount = filteredInvoices.filter(
    (inv) => inv.status === 'REFUNDED' || inv.status === 'PARTIALLY_RETURNED'
  ).length

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return (
          <Badge className='bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-[#3EEA85] border-emerald-300/60 gap-1 font-semibold text-xs'>
            <CheckCircle2 className='size-3 text-emerald-600 dark:text-[#3EEA85]' />{' '}
            {t('مدفوعة', 'Paid')}
          </Badge>
        )
      case 'PARTIALLY_RETURNED':
        return (
          <Badge className='bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300/60 gap-1 font-semibold text-xs'>
            <RotateCcw className='size-3 text-amber-600 dark:text-amber-400' />{' '}
            {t('مرتجع جزئي', 'Partial Return')}
          </Badge>
        )
      case 'PENDING':
        return (
          <Badge className='bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-border gap-1 font-semibold text-xs'>
            <Clock className='size-3 text-neutral-500' /> {t('قيد الانتظار', 'Pending')}
          </Badge>
        )
      case 'REFUNDED':
        return (
          <Badge className='bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300/60 gap-1 font-semibold text-xs'>
            <ArrowLeftRight className='size-3 text-rose-600 dark:text-rose-400' />{' '}
            {t('مرتجع بالكامل', 'Full Return')}
          </Badge>
        )
      case 'CANCELLED':
        return (
          <Badge className='bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300/60 gap-1 font-semibold text-xs'>
            <XCircle className='size-3 text-rose-600' /> {t('ملغاة', 'Cancelled')}
          </Badge>
        )
    }
  }

  const getPaymentMethodBadge = (method: InvoicePaymentMethod) => {
    switch (method) {
      case 'CASH':
        return (
          <span className='inline-flex items-center gap-1 text-xs text-foreground font-medium'>
            <Coins className='size-3.5 text-amber-600' /> {t('نقداً', 'Cash')}
          </span>
        )
      case 'CARD':
        return (
          <span className='inline-flex items-center gap-1 text-xs text-foreground font-medium'>
            <CreditCard className='size-3.5 text-foreground' /> {t('بطاقة', 'Card')}
          </span>
        )
      case 'INSTAPAY':
        return (
          <span className='inline-flex items-center gap-1 text-xs text-foreground font-medium'>
            <Zap className='size-3.5 text-emerald-600 dark:text-[#3EEA85]' /> Instapay
          </span>
        )
      case 'QR_SCAN':
      case 'QR':
        return (
          <span className='inline-flex items-center gap-1 text-xs text-foreground font-medium'>
            <QrCode className='size-3.5 text-foreground' /> QR
          </span>
        )
      default:
        return <span className='text-xs font-medium'>{method}</span>
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      <Header fixed>
        <div className='flex items-center gap-2'>
          <h1 className='font-semibold text-sm'>
            {isSuperAdmin ? t('إدارة المنصة', 'Platform Super Admin') : t('إدارة المتجر', 'Store Management')}
          </h1>
          <Badge
            variant='outline'
            className='text-xs bg-emerald-500/10 text-emerald-600 dark:text-[#3EEA85] border-emerald-500/20'
          >
            {t('الفواتير المصدرة', 'Issued Invoices')}
          </Badge>
        </div>
        <div className='ms-auto flex items-center gap-2'>
          <PosShortcutButton />
          <LanguageSwitch />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='space-y-6'>
        {/* Top Control Bar */}
        <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3'>
          <div>
            <h2 className='text-xl font-bold tracking-tight'>
              {t('الفواتير المصدرة والمرتجعات', 'Issued Invoices & Returns')}
            </h2>
            <p className='text-xs text-muted-foreground mt-0.5'>
              {t(
                'استعرض الفواتير المصدرة، تابع المرتجعات الكاملة والجزئية، وحدد سياسة المرتجع الخاصة بمتجرك.',
                'Browse issued invoices, track full & partial returns, and configure your store return policy.'
              )}
            </p>
          </div>
          <div className='flex items-center gap-2 shrink-0 flex-wrap'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setIsPolicyOpen(true)}
              className='gap-2 cursor-pointer'
            >
              <ShieldCheck className='size-4 text-emerald-600 dark:text-[#3EEA85]' />
              <span>
                {t(
                  `سياسة المرتجع (${returnPolicy.returnPolicyDays} يوم)`,
                  `Return Policy (${returnPolicy.returnPolicyDays}d)`
                )}
              </span>
            </Button>
            <Button asChild variant='outline' className='gap-2'>
              <Link to='/invoices/design'>
                {t('تصميم الفاتورة', 'Invoice Designer')}
                <ChevronRight className={`size-4 ${isAr ? 'rotate-180' : ''}`} />
              </Link>
            </Button>
            <Button
              onClick={openCreateDialog}
              className='gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold cursor-pointer'
            >
              <Plus className='size-4' />
              {t('إصدار فاتورة جديدة', 'Issue New Invoice')}
            </Button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
          <Card className='p-4 border-border/60 shadow-2xs'>
            <div className='flex items-center justify-between'>
              <span className='text-xs text-muted-foreground font-medium'>
                {t('إجمالي الفواتير', 'Total Invoices')}
              </span>
              <FileText className='size-4 text-emerald-600 dark:text-[#3EEA85]' />
            </div>
            <div className='text-2xl font-bold font-mono mt-2'>{totalCount}</div>
          </Card>

          <Card className='p-4 border-border/60 shadow-2xs'>
            <div className='flex items-center justify-between'>
              <span className='text-xs text-muted-foreground font-medium'>
                {t('صافي الإيرادات', 'Net Revenue')}
              </span>
              <DollarSign className='size-4 text-emerald-600 dark:text-[#3EEA85]' />
            </div>
            <div className='text-2xl font-bold font-mono mt-2' dir='ltr'>
              {totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })} EGP
            </div>
          </Card>

          <Card className='p-4 border-border/60 shadow-2xs'>
            <div className='flex items-center justify-between'>
              <span className='text-xs text-muted-foreground font-medium'>
                {t('الفواتير المدفوعة', 'Paid Invoices')}
              </span>
              <CheckCircle2 className='size-4 text-emerald-600 dark:text-[#3EEA85]' />
            </div>
            <div className='text-2xl font-bold font-mono mt-2 text-emerald-600 dark:text-[#3EEA85]'>
              {paidCount}
            </div>
          </Card>

          <Card className='p-4 border-border/60 shadow-2xs'>
            <div className='flex items-center justify-between'>
              <span className='text-xs text-muted-foreground font-medium'>
                {t('المرتجعات (كامل / جزئي)', 'Returns (Full / Partial)')}
              </span>
              <RotateCcw className='size-4 text-amber-600 dark:text-amber-400' />
            </div>
            <div className='text-2xl font-bold font-mono mt-2 text-amber-600 dark:text-amber-400'>
              {returnedCount}
            </div>
            {totalRefunded > 0 && (
              <div className='text-[11px] font-mono text-muted-foreground mt-0.5' dir='ltr'>
                -{totalRefunded.toFixed(2)} EGP
              </div>
            )}
          </Card>
        </div>

        {/* Filter Controls Bar */}
        <Card className='p-4 border-border/60 shadow-2xs space-y-3'>
          <div className='grid grid-cols-1 sm:grid-cols-4 gap-3'>
            <div className='relative sm:col-span-2'>
              <Search className='absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
              <Input
                placeholder={t(
                  'ابحث برقم الفاتورة أو اسم العميل أو الهاتف...',
                  'Search invoice #, customer name, or phone...'
                )}
                className='ps-9'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {isSuperAdmin && (
              <div>
                <Select
                  value={selectedMerchantId}
                  onValueChange={setSelectedMerchantId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('تصفية حسب المتجر', 'Filter by Merchant')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>{t('كل المتاجر', 'All Merchants')}</SelectItem>
                    {merchants.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {availableBranches.length > 0 && !currentUser.branchId && (
              <div>
                <Select
                  value={selectedBranchId}
                  onValueChange={setSelectedBranchId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('الفرع', 'Branch')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>{t('كل الفروع', 'All Branches')}</SelectItem>
                    {availableBranches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Select
                value={selectedStatus}
                onValueChange={setSelectedStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('الحالة', 'Status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>{t('كل الحالات', 'All Statuses')}</SelectItem>
                  <SelectItem value='PAID'>{t('مدفوعة', 'Paid')}</SelectItem>
                  <SelectItem value='PARTIALLY_RETURNED'>{t('مرتجع جزئي', 'Partial Return')}</SelectItem>
                  <SelectItem value='REFUNDED'>{t('مرتجع بالكامل', 'Full Return')}</SelectItem>
                  <SelectItem value='PENDING'>{t('قيد الانتظار', 'Pending')}</SelectItem>
                  <SelectItem value='CANCELLED'>{t('ملغاة', 'Cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Invoices Table */}
        <Card className='border-border/60 shadow-2xs overflow-hidden'>
          <Table>
            <TableHeader className='bg-muted/40'>
              <TableRow>
                <TableHead className='font-semibold'>{t('رقم الفاتورة', 'Invoice #')}</TableHead>
                <TableHead className='font-semibold'>{t('التاريخ والوقت', 'Date & Time')}</TableHead>
                <TableHead className='font-semibold'>{t('العميل', 'Customer')}</TableHead>
                {isSuperAdmin && <TableHead className='font-semibold'>{t('المتجر', 'Merchant')}</TableHead>}
                <TableHead className='font-semibold'>{t('الدفع', 'Payment')}</TableHead>
                <TableHead className='font-semibold'>{t('الإجمالي / المسترد', 'Total / Refunded')}</TableHead>
                <TableHead className='font-semibold text-center'>{t('الحالة', 'Status')}</TableHead>
                <TableHead className='font-semibold text-end'>{t('إجراءات', 'Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isSuperAdmin ? 8 : 7}
                    className='h-36 text-center text-muted-foreground'
                  >
                    <div className='flex flex-col items-center justify-center gap-2'>
                      <FileText className='size-8 text-muted-foreground/40' />
                      <p className='text-sm font-medium'>
                        {t('لا توجد فواتير مصدرة مطابقة', 'No issued invoices found')}
                      </p>
                      <p className='text-xs'>
                        {t(
                          'اضغط على "إصدار فاتورة جديدة" أو استخدم شاشة الـ POS.',
                          'Click "Issue New Invoice" or complete a sale in POS.'
                        )}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((inv) => {
                  const merchant = merchants.find((m) => m.id === inv.merchantId)
                  const refunded = Number(inv.refundedTotal || 0)
                  const canReturn = inv.status === 'PAID' || inv.status === 'PARTIALLY_RETURNED'

                  return (
                    <TableRow key={inv.id} className='hover:bg-muted/30 transition-colors'>
                      <TableCell>
                        <div
                          onClick={() => setViewingInvoice(inv)}
                          className='font-bold font-mono text-sm text-foreground hover:underline cursor-pointer flex items-center gap-1.5'
                        >
                          <FileText className='size-3.5 text-muted-foreground' />
                          {inv.invoiceNumber}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className='text-xs text-foreground'>
                          {new Date(inv.issuedAt).toLocaleDateString('en-GB')}
                        </div>
                        <div className='text-[10px] text-muted-foreground font-mono'>
                          {new Date(inv.issuedAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className='font-semibold text-xs text-foreground'>
                          {inv.customerName || t('عميل نقدي', 'Walk-in Customer')}
                        </div>
                        {inv.customerPhone && (
                          <div className='text-[10px] text-muted-foreground font-mono'>
                            {inv.customerPhone}
                          </div>
                        )}
                      </TableCell>

                      {isSuperAdmin && (
                        <TableCell>
                          <div className='text-xs font-medium text-foreground'>
                            {merchant?.name || '—'}
                          </div>
                        </TableCell>
                      )}

                      <TableCell>{getPaymentMethodBadge(inv.paymentMethod)}</TableCell>

                      <TableCell>
                        <div className='font-bold font-mono text-sm text-foreground' dir='ltr'>
                          {inv.grandTotal.toFixed(2)} EGP
                        </div>
                        {refunded > 0 && (
                          <div className='text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold' dir='ltr'>
                            {t('مسترد:', 'Refunded:')} -{refunded.toFixed(2)} EGP
                          </div>
                        )}
                      </TableCell>

                      <TableCell className='text-center'>{getStatusBadge(inv.status)}</TableCell>

                      <TableCell className='text-end'>
                        <div className='flex items-center justify-end gap-1'>
                          {canReturn && (
                            <Button
                              variant='outline'
                              size='sm'
                              className='h-8 text-xs gap-1 cursor-pointer'
                              onClick={() => setReturningInvoice(inv)}
                              title={t('عمل مرتجع كامل أو جزئي', 'Full or partial return')}
                            >
                              <RotateCcw className='size-3.5' />
                              <span>{t('مرتجع', 'Return')}</span>
                            </Button>
                          )}
                          <Button
                            variant='outline'
                            size='sm'
                            className='h-8 text-xs gap-1.5 cursor-pointer'
                            onClick={() => setViewingInvoice(inv)}
                          >
                            <Eye className='size-3.5' />
                            {t('عرض', 'View')}
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='size-8 text-destructive hover:bg-destructive/10 cursor-pointer'
                            onClick={() => setDeletingInvoice(inv)}
                          >
                            <Trash2 className='size-3.5' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </Main>

      {/* Issue New Invoice Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className='sm:max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Issue New Tax Invoice</DialogTitle>
            <DialogDescription>
              Create and issue a customer invoice linked to your products and fees.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleIssueInvoice} className='space-y-4 text-xs'>
            {/* Merchant Scope if Super Admin */}
            {isSuperAdmin && (
              <div className='space-y-1'>
                <Label>Merchant</Label>
                <Select
                  value={targetMerchantId}
                  onValueChange={(val) => setTargetMerchantId(val)}
                >
                  <SelectTrigger className='h-9'>
                    <SelectValue placeholder='Select merchant' />
                  </SelectTrigger>
                  <SelectContent>
                    {merchants.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Branch */}
            {availableBranches.length > 0 && (
              <div className='space-y-1'>
                <Label>Branch</Label>
                <Select
                  value={targetBranchId}
                  onValueChange={setTargetBranchId}
                >
                  <SelectTrigger className='h-9'>
                    <SelectValue placeholder='Select branch' />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBranches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name} ({b.address || 'Main'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Customer Information */}
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 border p-3 rounded-lg bg-muted/20'>
              <div>
                <Label>Customer Name</Label>
                <Input
                  className='h-8.5 text-xs mt-1'
                  placeholder='Walk-in Customer'
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div>
                <Label>Customer Phone</Label>
                <Input
                  className='h-8.5 text-xs mt-1'
                  placeholder='01xxxxxxxxx'
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
              <div>
                <Label>Tax ID (Optional)</Label>
                <Input
                  className='h-8.5 text-xs mt-1 font-mono'
                  placeholder='Customer Tax #'
                  value={customerTaxNo}
                  onChange={(e) => setCustomerTaxNo(e.target.value)}
                />
              </div>
            </div>

            {/* Products Selector */}
            <div className='border p-3 rounded-lg space-y-2.5'>
              <div className='flex items-center justify-between font-semibold'>
                <span>Invoice Items</span>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='h-7 text-xs gap-1'
                  onClick={() => {
                    if (availableProducts.length > 0) {
                      setSelectedProductIds([
                        ...selectedProductIds,
                        { productId: availableProducts[0].id, qty: 1 },
                      ])
                    }
                  }}
                >
                  <Plus className='size-3' /> Add Product
                </Button>
              </div>

              {selectedProductIds.length === 0 ? (
                <div className='text-center py-4 text-muted-foreground'>
                  No items added. Click "Add Product" above.
                </div>
              ) : (
                <div className='space-y-2'>
                  {selectedProductIds.map((item, idx) => {
                    const prod = availableProducts.find((p) => p.id === item.productId)
                    return (
                      <div
                        key={idx}
                        className='flex items-center gap-2 bg-muted/40 p-2 rounded-md border'
                      >
                        <div className='flex-1 min-w-0'>
                          <Select
                            value={item.productId}
                            onValueChange={(val) => {
                              const updated = [...selectedProductIds]
                              updated[idx].productId = val
                              setSelectedProductIds(updated)
                            }}
                          >
                            <SelectTrigger className='h-8 text-xs'>
                              <SelectValue placeholder='Select Product' />
                            </SelectTrigger>
                            <SelectContent>
                              {availableProducts.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name} — {p.price.toFixed(2)} EGP
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className='w-20'>
                          <Input
                            type='number'
                            min='1'
                            className='h-8 text-xs font-mono'
                            value={item.qty}
                            onChange={(e) => {
                              const updated = [...selectedProductIds]
                              updated[idx].qty = Math.max(1, parseInt(e.target.value) || 1)
                              setSelectedProductIds(updated)
                            }}
                          />
                        </div>
                        <div className='w-24 text-right font-mono font-bold text-xs'>
                          {((prod?.price || 0) * item.qty).toFixed(2)} EGP
                        </div>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          className='size-8 text-destructive'
                          onClick={() => {
                            setSelectedProductIds(
                              selectedProductIds.filter((_, i) => i !== idx)
                            )
                          }}
                        >
                          <Trash2 className='size-3.5' />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Applicable Fees Selector */}
            {availableFees.length > 0 && (
              <div className='border p-3 rounded-lg space-y-2'>
                <Label className='font-semibold'>Applied Fees & Taxes</Label>
                <div className='grid grid-cols-2 gap-2'>
                  {availableFees.map((f) => {
                    const isChecked = selectedFeeIds.includes(f.id)
                    return (
                      <label
                        key={f.id}
                        className={`flex items-center gap-2 p-2 rounded border cursor-pointer text-xs ${
                          isChecked ? 'bg-emerald-50 border-emerald-300' : 'bg-background'
                        }`}
                      >
                        <input
                          type='checkbox'
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFeeIds([...selectedFeeIds, f.id])
                            } else {
                              setSelectedFeeIds(selectedFeeIds.filter((id) => id !== f.id))
                            }
                          }}
                          className='size-3.5 rounded text-emerald-600'
                        />
                        <span className='font-medium'>{f.name}</span>
                        <span className='text-[10px] text-muted-foreground ml-auto font-mono'>
                          {f.type === 'PERCENTAGE' ? `${f.value}%` : `${f.value} EGP`}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Payment & Status */}
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <Label>Payment Method</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(val) => setPaymentMethod(val as InvoicePaymentMethod)}
                >
                  <SelectTrigger className='h-9 mt-1'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='CASH'>Cash</SelectItem>
                    <SelectItem value='CARD'>Credit / Debit Card</SelectItem>
                    <SelectItem value='QR_SCAN'>Customer QR Scan</SelectItem>
                    <SelectItem value='ONLINE'>Online Gateway</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Invoice Status</Label>
                <Select
                  value={invoiceStatus}
                  onValueChange={(val) => setInvoiceStatus(val as InvoiceStatus)}
                >
                  <SelectTrigger className='h-9 mt-1'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='PAID'>Paid</SelectItem>
                    <SelectItem value='PENDING'>Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Summary Box */}
            <div className='bg-muted/50 p-3 rounded-lg flex flex-col items-end space-y-1 font-mono text-xs'>
              <div className='flex justify-between w-56 text-muted-foreground'>
                <span>Subtotal:</span>
                <span>{formSubtotal.toFixed(2)} EGP</span>
              </div>
              <div className='flex justify-between w-56 text-muted-foreground'>
                <span>Fees & Taxes:</span>
                <span>+{formFeesTotal.toFixed(2)} EGP</span>
              </div>
              <div className='flex justify-between w-56 pt-1 border-t font-bold text-sm text-foreground'>
                <span>Grand Total:</span>
                <span>{formGrandTotal.toFixed(2)} EGP</span>
              </div>
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Issuing...' : 'Issue Invoice'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View & Print Invoice Modal */}
      <Dialog open={!!viewingInvoice} onOpenChange={(open) => !open && setViewingInvoice(null)}>
        <DialogContent className='sm:max-w-xl max-h-[90vh] overflow-y-auto p-0'>
          {viewingInvoice && (
            <div>
              {/* Top Print Action Bar */}
              <div className='p-3 bg-muted/40 border-b flex items-center justify-between'>
                <div className='font-mono font-bold text-xs'>
                  {viewingInvoice.invoiceNumber}
                </div>
                <div className='flex items-center gap-2'>
                  <Button size='sm' onClick={handlePrint} className='gap-1.5 h-8'>
                    <Printer className='size-3.5' /> Print / Save PDF
                  </Button>
                </div>
              </div>

              {/* Printable Invoice Container */}
              <div
                className='p-6 sm:p-8 bg-white text-zinc-900 text-xs'
                style={{
                  borderTop: `6px solid ${invoiceTemplate?.primaryColor || '#4F46E5'}`,
                }}
              >
                {/* Header */}
                <div className='flex items-start justify-between border-b pb-4 border-zinc-200'>
                  <div>
                    {invoiceTemplate?.showLogo && (invoiceTemplate?.logoUrl || viewingInvoice.merchant?.logo) && (
                      <img
                        src={invoiceTemplate?.logoUrl || viewingInvoice.merchant?.logo || ''}
                        alt='Logo'
                        className='size-12 object-contain mb-2'
                      />
                    )}
                    <h3
                      className='text-base font-bold'
                      style={{ color: invoiceTemplate?.primaryColor || '#4F46E5' }}
                    >
                      {invoiceTemplate?.businessName || viewingInvoice.merchant?.name || 'Store'}
                    </h3>
                    {invoiceTemplate?.showBranchInfo && viewingInvoice.branch && (
                      <p className='text-zinc-500 text-[11px]'>
                        {viewingInvoice.branch.name} • {viewingInvoice.branch.address || 'Cairo'}
                      </p>
                    )}
                    {invoiceTemplate?.taxNumber && (
                      <p className='text-[10px] text-zinc-500 font-mono'>
                        Tax ID: {invoiceTemplate.taxNumber}
                      </p>
                    )}
                  </div>

                  <div className='text-right'>
                    <div
                      className='inline-block px-2.5 py-0.5 rounded font-mono font-bold text-xs text-white'
                      style={{ backgroundColor: invoiceTemplate?.primaryColor || '#4F46E5' }}
                    >
                      TAX INVOICE
                    </div>
                    <p className='font-mono font-bold text-xs mt-1'>
                      #{viewingInvoice.invoiceNumber}
                    </p>
                    <p className='text-[10px] text-zinc-500'>
                      Date: {new Date(viewingInvoice.issuedAt).toLocaleDateString('en-GB')}
                    </p>
                    <Badge variant='outline' className='text-[9px] mt-1 bg-emerald-50 text-emerald-700'>
                      {viewingInvoice.status} ({viewingInvoice.paymentMethod})
                    </Badge>
                  </div>
                </div>

                {/* Customer Details */}
                <div className='my-3 p-2.5 bg-zinc-50 rounded border border-zinc-200 text-[11px] flex justify-between'>
                  <div>
                    <span className='text-zinc-500'>Billed To: </span>
                    <span className='font-bold'>{viewingInvoice.customerName || 'Walk-in Customer'}</span>
                    {viewingInvoice.customerPhone && (
                      <span className='text-zinc-500 ml-2'>• {viewingInvoice.customerPhone}</span>
                    )}
                  </div>
                  {viewingInvoice.customerTaxNo && (
                    <span className='font-mono text-zinc-500'>Tax: {viewingInvoice.customerTaxNo}</span>
                  )}
                </div>

                {/* Items */}
                <table className='w-full my-3 border-collapse text-left'>
                  <thead>
                    <tr
                      className='border-b border-zinc-300 font-bold text-[11px]'
                      style={{ color: invoiceTemplate?.primaryColor || '#4F46E5' }}
                    >
                      <th className='py-1.5'>Item</th>
                      <th className='py-1.5 text-center'>Qty</th>
                      <th className='py-1.5 text-right'>Unit Price</th>
                      <th className='py-1.5 text-right'>Total</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-zinc-100 text-[11px] text-zinc-700'>
                    {(viewingInvoice.items || []).map((it) => (
                      <tr key={it.id}>
                        <td className='py-1.5 font-medium'>{it.productName}</td>
                        <td className='py-1.5 text-center font-mono'>{it.quantity}</td>
                        <td className='py-1.5 text-right font-mono'>{it.unitPrice.toFixed(2)}</td>
                        <td className='py-1.5 text-right font-mono font-bold'>{it.totalPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className='border-t border-zinc-200 pt-3 flex flex-col items-end space-y-1 text-[11px]'>
                  <div className='flex justify-between w-48 text-zinc-600'>
                    <span>Subtotal:</span>
                    <span className='font-mono'>{viewingInvoice.subtotal.toFixed(2)} EGP</span>
                  </div>
                  {viewingInvoice.feesTotal > 0 && (
                    <div className='flex justify-between w-48 text-zinc-600'>
                      <span>Fees & Taxes:</span>
                      <span className='font-mono'>+{viewingInvoice.feesTotal.toFixed(2)} EGP</span>
                    </div>
                  )}
                  <div
                    className='flex justify-between w-48 pt-1.5 border-t border-zinc-300 font-bold text-xs'
                    style={{ color: invoiceTemplate?.primaryColor || '#4F46E5' }}
                  >
                    <span>Grand Total:</span>
                    <span className='font-mono text-sm'>{viewingInvoice.grandTotal.toFixed(2)} EGP</span>
                  </div>
                </div>

                {/* Footer with QR */}
                <div className='mt-6 pt-3 border-t border-dashed border-zinc-300 flex items-center justify-between text-zinc-500 text-[10px]'>
                  <p className='max-w-xs'>
                    {invoiceTemplate?.footerNotice ||
                      'Thank you for your business! Goods once sold can be returned or exchanged within 14 days with original receipt.'}
                  </p>
                  {invoiceTemplate?.showQrCode !== false && (
                    <div className='flex flex-col items-center'>
                      <div className='size-12 bg-zinc-100 border rounded flex items-center justify-center'>
                        <QrCode className='size-10 text-zinc-800' />
                      </div>
                      <span className='text-[8px] text-zinc-400 font-mono'>Verify E-Invoice</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Invoice Dialog */}
      <Dialog open={!!deletingInvoice} onOpenChange={(open) => !open && setDeletingInvoice(null)}>
        <DialogContent className='max-w-md' dir={dir}>
          <DialogHeader className='text-start'>
            <DialogTitle className='text-destructive'>
              {t('حذف الفاتورة؟', 'Delete Invoice?')}
            </DialogTitle>
            <DialogDescription className='text-xs'>
              {t('هل أنت متأكد من حذف الفاتورة', 'Are you sure you want to delete invoice')}{' '}
              <strong>{deletingInvoice?.invoiceNumber}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2'>
            <Button variant='outline' size='sm' onClick={() => setDeletingInvoice(null)}>
              {t('إلغاء', 'Cancel')}
            </Button>
            <Button variant='destructive' size='sm' onClick={handleDeleteConfirm}>
              {t('حذف', 'Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merchant Return Policy Settings Dialog */}
      <Dialog open={isPolicyOpen} onOpenChange={(open) => !isSavingPolicy && setIsPolicyOpen(open)}>
        <DialogContent className='sm:max-w-md rounded-2xl' dir={dir}>
          <DialogHeader className='text-start'>
            <DialogTitle className='flex items-center gap-2 text-base font-bold'>
              <div className='size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0'>
                <ShieldCheck className='size-4' />
              </div>
              <span>{t('سياسة المرتجعات للمتجر', 'Store Return Policy')}</span>
            </DialogTitle>
            <DialogDescription className='text-xs'>
              {t(
                'حدد المدة المسموح فيها بإرجاع الفواتير من الـ POS ومن قسم الفواتير المصدرة، وما إذا كان المرتجع الجزئي مسموحاً.',
                'Configure the allowed return window (in days) and whether partial item returns are permitted in POS and Invoices.'
              )}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveReturnPolicy} className='space-y-4 text-xs mt-1'>
            <div className='space-y-2'>
              <Label className='text-xs font-bold'>
                {t('المدة المسموحة للمرتجع (بالأيام)', 'Allowed Return Window (Days)')}
              </Label>
              <Input
                type='number'
                min={0}
                max={365}
                dir='ltr'
                value={policyDaysInput}
                onChange={(e) => setPolicyDaysInput(e.target.value)}
                className='h-10 font-mono text-sm rounded-xl'
              />
              <div className='flex items-center gap-1.5 flex-wrap'>
                {[0, 3, 7, 14, 30].map((d) => (
                  <button
                    key={d}
                    type='button'
                    onClick={() => setPolicyDaysInput(String(d))}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors ${
                      Number(policyDaysInput) === d
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border text-muted-foreground'
                    }`}
                  >
                    {d === 0
                      ? t('بدون مرتجع (0)', 'No Returns (0)')
                      : t(`${d} يوم`, `${d} days`)}
                  </button>
                ))}
              </div>
            </div>

            <div className='flex items-center justify-between rounded-xl border border-border/80 bg-muted/30 px-3.5 py-3'>
              <div>
                <p className='text-xs font-bold text-foreground'>
                  {t('السماح بالمرتجع الجزئي', 'Allow Partial Returns')}
                </p>
                <p className='text-[11px] text-muted-foreground'>
                  {t(
                    'إمكانية إرجاع صنف أو كمية محددة من الفاتورة بدلاً من الفاتورة بالكامل.',
                    'Allow returning specific items or quantities instead of the whole invoice.'
                  )}
                </p>
              </div>
              <Switch checked={policyAllowPartial} onCheckedChange={setPolicyAllowPartial} />
            </div>

            <div className='rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-3'>
              <div className='flex items-center justify-between gap-2'>
                <div>
                  <p className='text-xs font-bold text-foreground'>
                    {t('حماية المرتجع برقم سري لمدير الفرع (POS)', 'Require Branch Manager PIN in POS')}
                  </p>
                  <p className='text-[11px] text-muted-foreground'>
                    {t(
                      'يُطلب الرقم السري عند فتح شاشة المرتجعات في نقطة البيع.',
                      'Cashiers must get Branch Manager PIN approval to open POS returns.'
                    )}
                  </p>
                </div>
                <Switch checked={policyRequirePin} onCheckedChange={setPolicyRequirePin} />
              </div>

              {policyRequirePin && (
                <div className='space-y-1.5 pt-2 border-t border-border/60'>
                  <Label className='text-xs font-bold'>
                    {t('الرقم السري لمدير الفرع (4 إلى 6 أرقام)', 'Branch Manager PIN (4–6 digits)')}
                  </Label>
                  <Input
                    type='password'
                    inputMode='numeric'
                    maxLength={6}
                    dir='ltr'
                    value={policyManagerPinInput}
                    onChange={(e) => setPolicyManagerPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder='0000'
                    className='h-9 font-mono text-sm tracking-widest rounded-xl bg-background'
                  />
                </div>
              )}
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs font-bold'>
                {t('شروط وملاحظات سياسة المرتجع', 'Return Policy Notes / Terms')}
              </Label>
              <Textarea
                rows={3}
                value={policyNotesInput}
                onChange={(e) => setPolicyNotesInput(e.target.value)}
                placeholder={t(
                  'مثال: يجب إحضار الفاتورة الأصلية وأن يكون المنتج في حالته الأصلية غير مفتوح.',
                  'e.g. Original receipt required and items must be unopened in original condition.'
                )}
                className='rounded-xl text-xs'
              />
            </div>

            <DialogFooter className='gap-2 pt-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={isSavingPolicy}
                onClick={() => setIsPolicyOpen(false)}
              >
                {t('إلغاء', 'Cancel')}
              </Button>
              <Button
                type='submit'
                size='sm'
                disabled={isSavingPolicy}
                className='gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold cursor-pointer'
              >
                {isSavingPolicy && <Loader2 className='size-3.5 animate-spin' />}
                <span>{t('حفظ السياسة', 'Save Policy')}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Process Full / Partial Return Modal directly from Issued Invoices */}
      <PosReturnModal
        isOpen={!!returningInvoice}
        onClose={() => setReturningInvoice(null)}
        merchantId={returningInvoice?.merchantId || policyMerchantId}
        branchId={returningInvoice?.branchId || null}
        initialInvoice={returningInvoice}
        requireManagerPin={false}
        onReturnComplete={() => {
          fetchInvoices()
          fetchFromBackend().catch(() => {})
        }}
      />
    </>
  )
}
