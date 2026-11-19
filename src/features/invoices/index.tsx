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
import { useSaaSStore } from '@/lib/saas-store'
import { Invoice, InvoiceStatus, InvoicePaymentMethod } from '@/types/saas'
import { toast } from 'sonner'

export function InvoicesView() {
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
    const matchesMerchant =
      !isSuperAdmin ||
      selectedMerchantId === 'all' ||
      inv.merchantId === selectedMerchantId

    const matchesBranch =
      selectedBranchId === 'all' || inv.branchId === selectedBranchId

    const matchesStatus =
      selectedStatus === 'all' || inv.status === selectedStatus

    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.customerName && inv.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inv.customerPhone && inv.customerPhone.includes(searchQuery))

    return matchesMerchant && matchesBranch && matchesStatus && matchesSearch
  })

  // KPI Calculations
  const totalCount = filteredInvoices.length
  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0)
  const paidCount = filteredInvoices.filter((inv) => inv.status === 'PAID').length
  const avgValue = totalCount > 0 ? totalRevenue / totalCount : 0

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return (
          <Badge className='bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300/60 gap-1 font-semibold text-xs'>
            <CheckCircle2 className='size-3 text-emerald-600' /> Paid
          </Badge>
        )
      case 'PENDING':
        return (
          <Badge className='bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300/60 gap-1 font-semibold text-xs'>
            <Clock className='size-3 text-amber-600' /> Pending
          </Badge>
        )
      case 'REFUNDED':
        return (
          <Badge className='bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300/60 gap-1 font-semibold text-xs'>
            <ArrowLeftRight className='size-3 text-blue-600' /> Refunded
          </Badge>
        )
      case 'CANCELLED':
        return (
          <Badge className='bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300/60 gap-1 font-semibold text-xs'>
            <XCircle className='size-3 text-rose-600' /> Cancelled
          </Badge>
        )
    }
  }

  const getPaymentMethodBadge = (method: InvoicePaymentMethod) => {
    switch (method) {
      case 'CASH':
        return (
          <span className='inline-flex items-center gap-1 text-xs text-foreground font-medium'>
            <Coins className='size-3.5 text-amber-600' /> Cash
          </span>
        )
      case 'CARD':
        return (
          <span className='inline-flex items-center gap-1 text-xs text-foreground font-medium'>
            <CreditCard className='size-3.5 text-blue-600' /> Card / POS
          </span>
        )
      case 'QR_SCAN':
        return (
          <span className='inline-flex items-center gap-1 text-xs text-foreground font-medium'>
            <QrCode className='size-3.5 text-indigo-600' /> Customer QR
          </span>
        )
      default:
        return <span>{method}</span>
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
            {isSuperAdmin ? 'Platform Super Admin' : 'Store Management'}
          </h1>
          <Badge
            variant='outline'
            className='text-xs bg-emerald-500/10 text-emerald-600 dark:text-[#3EEA85] border-emerald-500/20'
          >
            Issued Invoices
          </Badge>
        </div>
        <div className='ms-auto flex items-center gap-2'>
          <LanguageSwitch />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='space-y-6'>
        {/* Top Control Bar */}
        <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3'>
          <div>
            <h2 className='text-xl font-bold tracking-tight'>Issued Invoices (جميع الفواتير المصدرة)</h2>
            <p className='text-xs text-muted-foreground mt-0.5'>
              Browse, view, print, or issue customer tax invoices with customizable store templates.
            </p>
          </div>
          <div className='flex items-center gap-2 shrink-0'>
            <Button asChild variant='outline' className='gap-2'>
              <Link to='/invoices/design'>
                Invoice Designer
                <ChevronRight className='size-4' />
              </Link>
            </Button>
            <Button onClick={openCreateDialog} className='gap-2 bg-black hover:bg-neutral-800 text-white font-bold'>
              <Plus className='size-4' />
              Issue New Invoice
            </Button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
          <Card className='p-4 border-border/60 shadow-2xs'>
            <div className='flex items-center justify-between'>
              <span className='text-xs text-muted-foreground font-medium'>Total Invoices</span>
              <FileText className='size-4 text-emerald-600 dark:text-[#3EEA85]' />
            </div>
            <div className='text-2xl font-bold font-mono mt-2'>{totalCount}</div>
          </Card>

          <Card className='p-4 border-border/60 shadow-2xs'>
            <div className='flex items-center justify-between'>
              <span className='text-xs text-muted-foreground font-medium'>Total Revenue</span>
              <DollarSign className='size-4 text-emerald-600' />
            </div>
            <div className='text-2xl font-bold font-mono mt-2'>
              {totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })} EGP
            </div>
          </Card>

          <Card className='p-4 border-border/60 shadow-2xs'>
            <div className='flex items-center justify-between'>
              <span className='text-xs text-muted-foreground font-medium'>Paid Invoices</span>
              <CheckCircle2 className='size-4 text-emerald-600' />
            </div>
            <div className='text-2xl font-bold font-mono mt-2 text-emerald-600'>{paidCount}</div>
          </Card>

          <Card className='p-4 border-border/60 shadow-2xs'>
            <div className='flex items-center justify-between'>
              <span className='text-xs text-muted-foreground font-medium'>Average Value</span>
              <Receipt className='size-4 text-amber-600' />
            </div>
            <div className='text-2xl font-bold font-mono mt-2'>
              {avgValue.toFixed(2)} EGP
            </div>
          </Card>
        </div>

        {/* Filter Controls Bar */}
        <Card className='p-4 border-border/60 shadow-2xs space-y-3'>
          <div className='grid grid-cols-1 sm:grid-cols-4 gap-3'>
            <div className='relative sm:col-span-2'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
              <Input
                placeholder='Search invoice #, customer name, or phone...'
                className='pl-9'
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
                    <SelectValue placeholder='Filter by Merchant' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Merchants</SelectItem>
                    {merchants.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {branches.length > 0 && (
              <div>
                <Select
                  value={selectedBranchId}
                  onValueChange={setSelectedBranchId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Branch' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Branches</SelectItem>
                    {branches.map((b) => (
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
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Statuses</SelectItem>
                  <SelectItem value='PAID'>Paid</SelectItem>
                  <SelectItem value='PENDING'>Pending</SelectItem>
                  <SelectItem value='REFUNDED'>Refunded</SelectItem>
                  <SelectItem value='CANCELLED'>Cancelled</SelectItem>
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
                <TableHead className='font-semibold'>Invoice #</TableHead>
                <TableHead className='font-semibold'>Date & Time</TableHead>
                <TableHead className='font-semibold'>Customer</TableHead>
                {isSuperAdmin && <TableHead className='font-semibold'>Merchant</TableHead>}
                <TableHead className='font-semibold'>Payment</TableHead>
                <TableHead className='font-semibold'>Total Amount</TableHead>
                <TableHead className='font-semibold text-center'>Status</TableHead>
                <TableHead className='font-semibold text-end'>Actions</TableHead>
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
                      <p className='text-sm font-medium'>No issued invoices found</p>
                      <p className='text-xs'>Click "Issue New Invoice" to generate an invoice for a customer.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((inv) => {
                  const merchant = merchants.find((m) => m.id === inv.merchantId)
                  return (
                    <TableRow key={inv.id} className='hover:bg-muted/30 transition-colors'>
                      <TableCell>
                        <div
                          onClick={() => setViewingInvoice(inv)}
                          className='font-bold font-mono text-sm text-primary hover:underline cursor-pointer flex items-center gap-1.5'
                        >
                          <FileText className='size-3.5' />
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
                          {inv.customerName || 'Walk-in Customer'}
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
                        <div className='font-bold font-mono text-sm text-foreground'>
                          {inv.grandTotal.toFixed(2)} EGP
                        </div>
                        {inv.feesTotal > 0 && (
                          <div className='text-[10px] text-emerald-600 font-mono'>
                            incl. fees
                          </div>
                        )}
                      </TableCell>

                      <TableCell className='text-center'>{getStatusBadge(inv.status)}</TableCell>

                      <TableCell className='text-end'>
                        <div className='flex items-center justify-end gap-1'>
                          <Button
                            variant='outline'
                            size='sm'
                            className='h-8 text-xs gap-1.5'
                            onClick={() => setViewingInvoice(inv)}
                          >
                            <Eye className='size-3.5' />
                            View
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='size-8 text-destructive hover:bg-destructive/10'
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
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-destructive'>Delete Invoice?</DialogTitle>
            <DialogDescription className='text-xs'>
              Are you sure you want to delete invoice <strong>{deletingInvoice?.invoiceNumber}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' size='sm' onClick={() => setDeletingInvoice(null)}>
              Cancel
            </Button>
            <Button variant='destructive' size='sm' onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
