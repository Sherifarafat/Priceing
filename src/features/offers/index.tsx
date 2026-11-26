import * as React from 'react'
import {
  Plus,
  Search,
  BadgePercent,
  Percent,
  Banknote,
  Edit2,
  Trash2,
  Package,
  ArrowRight,
  CheckCircle2,
  Loader2,
  XCircle,
  Eye,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
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
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { LanguageSwitch } from '@/components/language-switch'
import { PosShortcutButton } from '@/components/pos-shortcut-button'
import { useSaaSStore } from '@/lib/saas-store'
import { useLang } from '@/lib/i18n'
import { Offer, OfferDiscountType } from '@/types/saas'

function computeDiscountedPrice(
  price: number,
  discountType: OfferDiscountType,
  discountValue: number
): number {
  if (!Number.isFinite(discountValue) || discountValue <= 0) return price
  const raw =
    discountType === 'PERCENTAGE'
      ? price * (1 - discountValue / 100)
      : price - discountValue
  return Math.max(0, Math.round(raw * 100) / 100)
}

export function OffersView() {
  const { isAr, dir, t } = useLang()
  const {
    currentUser,
    merchants,
    currencies,
    products,
    offers = [],
    createOffer,
    updateOffer,
    toggleOffer,
    deleteOffer,
    hasPermission,
  } = useSaaSStore()

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN'
  const merchantId = currentUser.merchantId || merchants[0]?.id || ''
  const [selectedMerchantFilter, setSelectedMerchantFilter] = React.useState<string>('all')
  const [targetMerchantId, setTargetMerchantId] = React.useState<string>(
    merchantId || merchants[0]?.id || ''
  )

  const activeMerchantId = isSuperAdmin
    ? selectedMerchantFilter !== 'all'
      ? selectedMerchantFilter
      : targetMerchantId || merchantId
    : merchantId
  const merchant = merchants.find((m) => m.id === activeMerchantId) || merchants[0]
  const currency = currencies.find((c) => c.id === merchant?.currencyId) || currencies[0]
  const currSymbol = currency?.symbol || 'EGP'

  const canManage =
    isSuperAdmin || currentUser.role === 'MERCHANT_MANAGER' || hasPermission('products.edit')

  // Scope offers to merchant
  const scopedOffers = React.useMemo(() => {
    const list = Array.isArray(offers) ? offers : []
    if (isSuperAdmin) {
      return selectedMerchantFilter === 'all'
        ? list
        : list.filter((o) => o.merchantId === selectedMerchantFilter)
    }
    return list.filter((o) => o.merchantId === merchantId)
  }, [offers, isSuperAdmin, selectedMerchantFilter, merchantId])

  // Filters
  const [searchTerm, setSearchTerm] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all')

  const filteredOffers = React.useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return scopedOffers.filter((offer) => {
      if (statusFilter === 'active' && !offer.isActive) return false
      if (statusFilter === 'inactive' && offer.isActive) return false
      if (!q) return true
      const titleMatch = offer.title.toLowerCase().includes(q)
      const descMatch = (offer.description || '').toLowerCase().includes(q)
      const prodMatch = (offer.productIds || []).some((pid) => {
        const prod = products.find((p) => p.id === pid)
        return (
          prod &&
          (prod.name.toLowerCase().includes(q) ||
            (prod.barcode || '').toLowerCase().includes(q))
        )
      })
      return titleMatch || descMatch || prodMatch
    })
  }, [scopedOffers, statusFilter, searchTerm, products])

  // Stats
  const activeOffersCount = scopedOffers.filter((o) => o.isActive).length
  const activeOfferProductIds = React.useMemo(() => {
    const set = new Set<string>()
    scopedOffers
      .filter((o) => o.isActive)
      .forEach((o) => (o.productIds || []).forEach((pid) => set.add(pid)))
    return set.size
  }, [scopedOffers])

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingOffer, setEditingOffer] = React.useState<Offer | null>(null)
  const [viewingOffer, setViewingOffer] = React.useState<Offer | null>(null)
  const [deletingOffer, setDeletingOffer] = React.useState<Offer | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  // Form fields
  const [formTitle, setFormTitle] = React.useState('')
  const [formDescription, setFormDescription] = React.useState('')
  const [formDiscountType, setFormDiscountType] = React.useState<OfferDiscountType>('PERCENTAGE')
  const [formDiscountValue, setFormDiscountValue] = React.useState('')
  const [formProductIds, setFormProductIds] = React.useState<string[]>([])
  const [formIsActive, setFormIsActive] = React.useState(true)
  const [productPickerSearch, setProductPickerSearch] = React.useState('')

  const formMerchantId = isSuperAdmin
    ? editingOffer
      ? editingOffer.merchantId
      : targetMerchantId
    : merchantId

  const formMerchantProducts = React.useMemo(() => {
    const base = products.filter((p) => !formMerchantId || p.merchantId === formMerchantId)
    const q = productPickerSearch.trim().toLowerCase()
    if (!q) return base
    return base.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.barcode || '').toLowerCase().includes(q)
    )
  }, [products, formMerchantId, productPickerSearch])

  const openCreateDialog = () => {
    setEditingOffer(null)
    setTargetMerchantId(
      isSuperAdmin
        ? selectedMerchantFilter !== 'all'
          ? selectedMerchantFilter
          : merchants[0]?.id || ''
        : merchantId
    )
    setFormTitle('')
    setFormDescription('')
    setFormDiscountType('PERCENTAGE')
    setFormDiscountValue('')
    setFormProductIds([])
    setFormIsActive(true)
    setProductPickerSearch('')
    setFormError(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (offer: Offer) => {
    setEditingOffer(offer)
    setTargetMerchantId(offer.merchantId)
    setFormTitle(offer.title)
    setFormDescription(offer.description || '')
    setFormDiscountType(offer.discountType)
    setFormDiscountValue(String(offer.discountValue))
    setFormProductIds(offer.productIds || [])
    setFormIsActive(offer.isActive)
    setProductPickerSearch('')
    setFormError(null)
    setIsDialogOpen(true)
  }

  const toggleProductSelection = (pid: string) => {
    setFormProductIds((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid]
    )
  }

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formTitle.trim()) {
      setFormError(t('من فضلك أدخل عنوان العرض.', 'Please enter an offer title.'))
      return
    }
    const numVal = parseFloat(formDiscountValue)
    if (!Number.isFinite(numVal) || numVal <= 0) {
      setFormError(t('من فضلك أدخل قيمة خصم صحيحة أكبر من صفر.', 'Please enter a valid discount greater than zero.'))
      return
    }
    if (formDiscountType === 'PERCENTAGE' && numVal > 100) {
      setFormError(t('نسبة الخصم لا يمكن أن تتجاوز 100%.', 'Percentage discount cannot exceed 100%.'))
      return
    }
    if (formProductIds.length === 0) {
      setFormError(t('من فضلك اختر منتجاً واحداً على الأقل.', 'Please select at least one product.'))
      return
    }

    setIsSaving(true)
    try {
      if (editingOffer) {
        await updateOffer(editingOffer.id, {
          title: formTitle.trim(),
          description: formDescription.trim(),
          discountType: formDiscountType,
          discountValue: numVal,
          productIds: formProductIds,
          isActive: formIsActive,
        })
        toast.success(t(`تم تحديث العرض "${formTitle.trim()}" بنجاح`, `Offer "${formTitle.trim()}" updated`))
      } else {
        const res = await createOffer({
          merchantId: isSuperAdmin ? targetMerchantId : merchantId,
          title: formTitle.trim(),
          description: formDescription.trim(),
          discountType: formDiscountType,
          discountValue: numVal,
          productIds: formProductIds,
          isActive: formIsActive,
        })
        if (!res.success) {
          setFormError(res.error || t('حدث خطأ أثناء إنشاء العرض.', 'Failed to create offer.'))
          return
        }
        toast.success(
          t(
            `تم إنشاء العرض "${formTitle.trim()}" وربطه بـ ${formProductIds.length} منتج`,
            `Offer "${formTitle.trim()}" created for ${formProductIds.length} products`
          )
        )
      }
      setIsDialogOpen(false)
      setEditingOffer(null)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (offer: Offer, checked: boolean) => {
    await toggleOffer(offer.id, checked)
    toast.success(
      checked
        ? t(`تم تفعيل العرض "${offer.title}"`, `Offer "${offer.title}" activated`)
        : t(`تم إيقاف العرض "${offer.title}"`, `Offer "${offer.title}" paused`)
    )
  }

  const handleDeleteConfirm = async () => {
    if (!deletingOffer) return
    const title = deletingOffer.title
    await deleteOffer(deletingOffer.id)
    setDeletingOffer(null)
    toast.success(t(`تم حذف العرض "${title}"`, `Offer "${title}" deleted`))
  }

  const parsedFormDiscount = parseFloat(formDiscountValue)
  const hasValidPreviewDiscount =
    Number.isFinite(parsedFormDiscount) &&
    parsedFormDiscount > 0 &&
    (formDiscountType !== 'PERCENTAGE' || parsedFormDiscount <= 100)

  return (
    <>
      <Header fixed>
        <div className='ms-auto flex items-center gap-2'>
          <PosShortcutButton />
          <LanguageSwitch />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-5 p-4 sm:p-6'>
        {/* Top Title & Action Bar (Matches Products & Invoices) */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <div className='flex items-center gap-2'>
              <h1 className='text-2xl font-bold tracking-tight text-foreground'>
                {t('العروض والخصومات', 'Offers & Promotions')}
              </h1>
              <Badge variant='outline' className='text-xs font-mono font-bold bg-muted/50'>
                {filteredOffers.length} {t('عرض', 'Offers')}
              </Badge>
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              {t(
                'أنشئ عروضاً وخصومات على منتجاتك وفعّلها فوراً — تظهر للعملاء بالسعر قبل وبعد الخصم في السكانر.',
                'Create and manage live product discounts — reflected immediately with before/after prices on the customer scanner.'
              )}
            </p>
          </div>

          {canManage && (
            <Button
              type='button'
              size='sm'
              onClick={openCreateDialog}
              className='gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-xs cursor-pointer shrink-0'
            >
              <Plus className='size-4' />
              <span>{t('إنشاء عرض جديد', 'New Offer')}</span>
            </Button>
          )}
        </div>

        {/* Summary KPI Cards (Consistent with Dashboard & Invoices) */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3.5'>
          <Card className='p-4 rounded-xl border-border/80 bg-card shadow-2xs flex items-center justify-between'>
            <div>
              <p className='text-xs text-muted-foreground font-medium'>
                {t('إجمالي العروض', 'Total Offers')}
              </p>
              <p className='text-2xl font-bold mt-1 font-mono text-foreground'>
                {scopedOffers.length}
              </p>
            </div>
            <div className='size-10 rounded-xl bg-muted border border-border/70 flex items-center justify-center'>
              <BadgePercent className='size-5 text-foreground' />
            </div>
          </Card>

          <Card className='p-4 rounded-xl border-border/80 bg-card shadow-2xs flex items-center justify-between'>
            <div>
              <p className='text-xs text-muted-foreground font-medium'>
                {t('العروض النشطة الآن', 'Active Offers')}
              </p>
              <p className='text-2xl font-bold mt-1 font-mono text-foreground'>
                {activeOffersCount}
              </p>
            </div>
            <div className='size-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-[#3EEA85] flex items-center justify-center'>
              <CheckCircle2 className='size-5' />
            </div>
          </Card>

          <Card className='p-4 rounded-xl border-border/80 bg-card shadow-2xs flex items-center justify-between'>
            <div>
              <p className='text-xs text-muted-foreground font-medium'>
                {t('المنتجات عليها خصم فعّال', 'Discounted Products')}
              </p>
              <p className='text-2xl font-bold mt-1 font-mono text-foreground'>
                {activeOfferProductIds}
              </p>
            </div>
            <div className='size-10 rounded-xl bg-muted border border-border/70 flex items-center justify-center'>
              <Package className='size-5 text-foreground' />
            </div>
          </Card>
        </div>

        {/* Search & Filter Toolbar */}
        <div className='flex flex-col sm:flex-row items-center gap-3'>
          <div className='relative w-full sm:w-80'>
            <Search className='size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2' />
            <Input
              placeholder={t(
                'ابحث باسم العرض أو المنتج أو الباركود...',
                'Search by offer title, product, or barcode...'
              )}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='ps-9 pe-8 h-9 text-xs rounded-lg bg-card border-border/80'
            />
            {searchTerm && (
              <button
                type='button'
                onClick={() => setSearchTerm('')}
                className='absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer'
              >
                <XCircle className='size-4' />
              </button>
            )}
          </div>

          <div className='flex items-center gap-2 w-full sm:w-auto ms-auto flex-wrap'>
            {isSuperAdmin && (
              <select
                value={selectedMerchantFilter}
                onChange={(e) => setSelectedMerchantFilter(e.target.value)}
                className='h-9 rounded-lg border border-border/80 bg-card px-3 text-xs text-foreground font-medium'
              >
                <option value='all'>{t('كل المتاجر', 'All Merchants')}</option>
                {merchants.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}

            <div className='flex items-center rounded-lg border border-border/80 p-0.5 bg-card'>
              {(
                [
                  { key: 'all', label: t('الكل', 'All') },
                  { key: 'active', label: t('نشط', 'Active') },
                  { key: 'inactive', label: t('متوقف', 'Paused') },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type='button'
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    statusFilter === tab.key
                      ? 'bg-primary text-primary-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Clean Offers Table (Exact match with Products / Invoices / Categories tables) */}
        <Card className='border-border/80 shadow-xs overflow-hidden bg-card rounded-xl'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow className='border-b border-border/70 bg-muted/40 hover:bg-muted/40'>
                  <TableHead className='ps-5 py-3 text-xs font-semibold text-foreground'>
                    {t('العرض', 'Offer')}
                  </TableHead>
                  <TableHead className='py-3 text-xs font-semibold text-foreground'>
                    {t('قيمة الخصم', 'Discount')}
                  </TableHead>
                  <TableHead className='py-3 text-xs font-semibold text-foreground'>
                    {t('المنتجات المشمولة', 'Included Products')}
                  </TableHead>
                  <TableHead className='py-3 text-xs font-semibold text-foreground text-center'>
                    {t('الحالة', 'Status')}
                  </TableHead>
                  <TableHead className='pe-5 py-3 text-xs font-semibold text-foreground text-end'>
                    {t('إجراءات', 'Actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredOffers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className='h-48 text-center text-muted-foreground'>
                      <div className='flex flex-col items-center justify-center gap-2'>
                        <BadgePercent className='size-9 opacity-25' />
                        <p className='font-semibold text-sm text-foreground'>
                          {t('لا توجد عروض مطابقة', 'No offers found')}
                        </p>
                        <p className='text-xs max-w-sm'>
                          {t(
                            'اضغط على "إنشاء عرض جديد" لتطبيق خصم على منتجاتك وعرضه مباشرة للعملاء.',
                            'Click "New Offer" above to create a promotion and apply it to your products.'
                          )}
                        </p>
                        {canManage && (
                          <Button
                            type='button'
                            size='sm'
                            onClick={openCreateDialog}
                            className='mt-2 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                          >
                            <Plus className='size-3.5' />
                            <span>{t('إنشاء عرض جديد', 'New Offer')}</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOffers.map((offer) => {
                    const assignedProducts = (offer.productIds || [])
                      .map((pid) => products.find((p) => p.id === pid))
                      .filter(Boolean) as typeof products
                    const offerMerchant = merchants.find((m) => m.id === offer.merchantId)

                    return (
                      <TableRow
                        key={offer.id}
                        className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${
                          !offer.isActive ? 'opacity-65' : ''
                        }`}
                      >
                        {/* Offer Title & Description */}
                        <TableCell className='ps-5 py-3.5'>
                          <div className='flex items-center gap-3'>
                            <div className='size-9 rounded-lg bg-muted border border-border/70 flex items-center justify-center shrink-0'>
                              <BadgePercent className='size-4 text-foreground' />
                            </div>
                            <div className='min-w-0'>
                              <div className='flex items-center gap-2 flex-wrap'>
                                <span className='font-bold text-xs sm:text-sm text-foreground'>
                                  {offer.title}
                                </span>
                                {isSuperAdmin && offerMerchant && (
                                  <Badge variant='outline' className='text-[10px] font-medium'>
                                    {offerMerchant.name}
                                  </Badge>
                                )}
                              </div>
                              {offer.description && (
                                <p className='text-[11px] text-muted-foreground truncate max-w-xs mt-0.5'>
                                  {offer.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Discount Badge */}
                        <TableCell className='py-3.5 whitespace-nowrap'>
                          <Badge className='bg-primary text-primary-foreground font-mono text-xs px-2.5 py-0.5 border-0'>
                            {offer.discountType === 'PERCENTAGE'
                              ? `${offer.discountValue}%`
                              : `${offer.discountValue} ${currSymbol}`}
                          </Badge>
                        </TableCell>

                        {/* Assigned Products Preview */}
                        <TableCell className='py-3.5'>
                          <div className='flex items-center gap-2 flex-wrap'>
                            <Badge variant='secondary' className='font-mono text-[11px] gap-1'>
                              <Package className='size-3' />
                              {assignedProducts.length} {t('منتج', 'items')}
                            </Badge>
                            {assignedProducts.slice(0, 2).map((p) => (
                              <span
                                key={p.id}
                                className='text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md truncate max-w-[130px]'
                              >
                                {p.name}
                              </span>
                            ))}
                            {assignedProducts.length > 2 && (
                              <button
                                type='button'
                                onClick={() => setViewingOffer(offer)}
                                className='text-[11px] font-semibold text-foreground underline underline-offset-2 cursor-pointer'
                              >
                                +{assignedProducts.length - 2} {t('المزيد', 'more')}
                              </button>
                            )}
                          </div>
                        </TableCell>

                        {/* Status Toggle */}
                        <TableCell className='py-3.5 text-center'>
                          <div className='inline-flex items-center gap-2 justify-center'>
                            {canManage && (
                              <Switch
                                checked={offer.isActive}
                                onCheckedChange={(checked) => handleToggleActive(offer, checked)}
                                aria-label={offer.isActive ? t('إيقاف العرض', 'Pause') : t('تفعيل العرض', 'Activate')}
                                className='cursor-pointer'
                              />
                            )}
                            <Badge
                              variant='outline'
                              className={
                                offer.isActive
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-[#3EEA85] border-emerald-500/30 text-[11px]'
                                  : 'text-muted-foreground text-[11px]'
                              }
                            >
                              {offer.isActive ? t('نشط', 'Active') : t('متوقف', 'Paused')}
                            </Badge>
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className='pe-5 py-3.5 text-end'>
                          <div className='inline-flex items-center justify-end gap-1'>
                            <Button
                              type='button'
                              variant='ghost'
                              size='icon'
                              className='size-8 text-muted-foreground hover:text-foreground cursor-pointer'
                              onClick={() => setViewingOffer(offer)}
                              title={t('عرض المنتجات والأسعار', 'Preview products & prices')}
                            >
                              <Eye className='size-4' />
                            </Button>
                            {canManage && (
                              <>
                                <Button
                                  type='button'
                                  variant='ghost'
                                  size='icon'
                                  className='size-8 text-muted-foreground hover:text-foreground cursor-pointer'
                                  onClick={() => openEditDialog(offer)}
                                  title={t('تعديل', 'Edit')}
                                >
                                  <Edit2 className='size-4' />
                                </Button>
                                <Button
                                  type='button'
                                  variant='ghost'
                                  size='icon'
                                  className='size-8 text-muted-foreground hover:text-destructive cursor-pointer'
                                  onClick={() => setDeletingOffer(offer)}
                                  title={t('حذف', 'Delete')}
                                >
                                  <Trash2 className='size-4' />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </Main>

      {/* ── View Offer Products & Before/After Prices Dialog ── */}
      <Dialog open={!!viewingOffer} onOpenChange={(open) => !open && setViewingOffer(null)}>
        <DialogContent className='sm:max-w-lg max-h-[85vh] flex flex-col' dir={dir}>
          {viewingOffer && (
            <>
              <DialogHeader className='text-start'>
                <DialogTitle className='flex items-center gap-2 text-base font-bold'>
                  <BadgePercent className='size-5' />
                  <span>{viewingOffer.title}</span>
                  <Badge className='bg-primary text-primary-foreground font-mono text-xs border-0'>
                    {viewingOffer.discountType === 'PERCENTAGE'
                      ? `-${viewingOffer.discountValue}%`
                      : `-${viewingOffer.discountValue} ${currSymbol}`}
                  </Badge>
                </DialogTitle>
                {viewingOffer.description && (
                  <DialogDescription className='text-xs'>{viewingOffer.description}</DialogDescription>
                )}
              </DialogHeader>

              <div className='overflow-y-auto rounded-xl border border-border/80 divide-y divide-border/50 mt-2'>
                {(viewingOffer.productIds || [])
                  .map((pid) => products.find((p) => p.id === pid))
                  .filter(Boolean)
                  .map((prod) => {
                    if (!prod) return null
                    const after = computeDiscountedPrice(
                      prod.price,
                      viewingOffer.discountType,
                      viewingOffer.discountValue
                    )
                    return (
                      <div key={prod.id} className='p-3 flex items-center justify-between gap-3 text-xs'>
                        <div className='min-w-0'>
                          <p className='font-semibold text-foreground truncate'>{prod.name}</p>
                          <p className='text-[10px] font-mono text-muted-foreground'>{prod.barcode}</p>
                        </div>
                        <div className='flex items-center gap-2 font-mono shrink-0' dir='ltr'>
                          <span className='line-through text-muted-foreground'>
                            {prod.price.toFixed(2)}
                          </span>
                          <ArrowRight className='size-3 text-muted-foreground' />
                          <span className='font-bold text-emerald-600 dark:text-[#3EEA85]'>
                            {after.toFixed(2)} {currSymbol}
                          </span>
                        </div>
                      </div>
                    )
                  })}
              </div>

              <DialogFooter className='pt-2'>
                <Button variant='outline' size='sm' onClick={() => setViewingOffer(null)}>
                  {t('إغلاق', 'Close')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Create / Edit Offer Dialog ── */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!isSaving) {
            setIsDialogOpen(open)
            if (!open) setEditingOffer(null)
          }
        }}
      >
        <DialogContent className='max-w-lg max-h-[90vh] flex flex-col' dir={dir}>
          <form onSubmit={handleSaveOffer} className='flex flex-col min-h-0 flex-1'>
            <DialogHeader className='text-start'>
              <DialogTitle className='flex items-center gap-2 text-base font-bold'>
                <div className='size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0'>
                  <BadgePercent className='size-4' />
                </div>
                <span>
                  {editingOffer
                    ? t('تعديل العرض', 'Edit Offer')
                    : t('إنشاء عرض جديد', 'Create New Offer')}
                </span>
              </DialogTitle>
              <DialogDescription className='text-xs'>
                {t(
                  'حدد قيمة الخصم واختر المنتجات التي يطبق عليها هذا العرض.',
                  'Set the discount value and select the products included in this promotion.'
                )}
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4 py-4 overflow-y-auto flex-1 min-h-0 pe-1'>
              {formError && (
                <div className='rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive font-medium'>
                  {formError}
                </div>
              )}

              {isSuperAdmin && !editingOffer && (
                <div className='space-y-1.5'>
                  <label className='text-xs font-semibold'>{t('المتجر', 'Merchant')}</label>
                  <select
                    value={targetMerchantId}
                    onChange={(e) => {
                      setTargetMerchantId(e.target.value)
                      setFormProductIds([])
                    }}
                    className='w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-medium'
                  >
                    {merchants.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className='space-y-1.5'>
                <label className='text-xs font-semibold'>{t('عنوان العرض *', 'Offer Title *')}</label>
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={t('مثال: عروض نهاية الأسبوع 20%', 'e.g. Weekend Flash Sale 20%')}
                  className='h-9 text-xs'
                />
              </div>

              <div className='space-y-1.5'>
                <label className='text-xs font-semibold'>{t('وصف مختصر (اختياري)', 'Description (Optional)')}</label>
                <Input
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder={t('مثال: خصم خاص لفترة محدودة', 'e.g. Limited time store offer')}
                  className='h-9 text-xs'
                />
              </div>

              {/* Discount Type & Value */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <div className='space-y-1.5'>
                  <label className='text-xs font-semibold'>{t('نوع الخصم', 'Discount Type')}</label>
                  <div className='grid grid-cols-2 gap-1.5'>
                    <button
                      type='button'
                      onClick={() => setFormDiscountType('PERCENTAGE')}
                      className={`h-9 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        formDiscountType === 'PERCENTAGE'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground hover:text-foreground border-border'
                      }`}
                    >
                      <Percent className='size-3.5' />
                      <span>{t('نسبة %', 'Percent %')}</span>
                    </button>
                    <button
                      type='button'
                      onClick={() => setFormDiscountType('FIXED')}
                      className={`h-9 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        formDiscountType === 'FIXED'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground hover:text-foreground border-border'
                      }`}
                    >
                      <Banknote className='size-3.5' />
                      <span>{t('مبلغ ثابت', 'Fixed')}</span>
                    </button>
                  </div>
                </div>

                <div className='space-y-1.5'>
                  <label className='text-xs font-semibold'>
                    {formDiscountType === 'PERCENTAGE'
                      ? t('نسبة الخصم (%) *', 'Discount (%) *')
                      : t(`قيمة الخصم (${currSymbol}) *`, `Discount (${currSymbol}) *`)}
                  </label>
                  <Input
                    type='number'
                    step='0.01'
                    min='0.01'
                    max={formDiscountType === 'PERCENTAGE' ? '100' : undefined}
                    dir='ltr'
                    value={formDiscountValue}
                    onChange={(e) => setFormDiscountValue(e.target.value)}
                    placeholder={formDiscountType === 'PERCENTAGE' ? '15' : '25'}
                    className='h-9 text-xs font-mono'
                  />
                </div>
              </div>

              {/* Active Switch */}
              <div className='flex items-center justify-between rounded-xl border border-border/80 bg-muted/30 px-3.5 py-2.5'>
                <div>
                  <p className='text-xs font-semibold'>{t('تفعيل العرض فوراً', 'Activate Immediately')}</p>
                  <p className='text-[11px] text-muted-foreground'>
                    {t('يظهر مباشرة للعملاء عند المسح بالباركود', 'Visible right away on the barcode scanner')}
                  </p>
                </div>
                <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
              </div>

              {/* Product Selector */}
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <label className='text-xs font-semibold'>
                    {t('المنتجات المشمولة *', 'Select Products *')}{' '}
                    <span className='font-mono text-muted-foreground'>({formProductIds.length})</span>
                  </label>
                  {formMerchantProducts.length > 0 && (
                    <button
                      type='button'
                      onClick={() => {
                        if (formProductIds.length === formMerchantProducts.length) {
                          setFormProductIds([])
                        } else {
                          setFormProductIds(formMerchantProducts.map((p) => p.id))
                        }
                      }}
                      className='text-[11px] font-semibold underline cursor-pointer text-foreground'
                    >
                      {formProductIds.length === formMerchantProducts.length
                        ? t('إلغاء تحديد الكل', 'Deselect all')
                        : t('تحديد الكل', 'Select all')}
                    </button>
                  )}
                </div>

                <div className='relative'>
                  <Search className='size-3.5 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2' />
                  <Input
                    value={productPickerSearch}
                    onChange={(e) => setProductPickerSearch(e.target.value)}
                    placeholder={t('ابحث عن منتج بالاسم أو الباركود...', 'Search products...')}
                    className='ps-8 h-8 text-xs'
                  />
                </div>

                <div className='rounded-xl border border-border/80 max-h-48 overflow-y-auto divide-y divide-border/50'>
                  {formMerchantProducts.length === 0 ? (
                    <p className='p-4 text-center text-xs text-muted-foreground'>
                      {t('لا توجد منتجات متاحة', 'No products available')}
                    </p>
                  ) : (
                    formMerchantProducts.map((prod) => {
                      const selected = formProductIds.includes(prod.id)
                      const previewAfter = hasValidPreviewDiscount
                        ? computeDiscountedPrice(prod.price, formDiscountType, parsedFormDiscount)
                        : null
                      return (
                        <button
                          key={prod.id}
                          type='button'
                          onClick={() => toggleProductSelection(prod.id)}
                          className={`w-full px-3 py-2 flex items-center justify-between gap-2 text-start text-xs transition-colors cursor-pointer ${
                            selected ? 'bg-muted/70' : 'hover:bg-muted/30'
                          }`}
                        >
                          <div className='flex items-center gap-2.5 min-w-0'>
                            <div
                              className={`size-4 rounded flex items-center justify-center border shrink-0 ${
                                selected
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'border-muted-foreground/40'
                              }`}
                            >
                              {selected && <Check className='size-3' />}
                            </div>
                            <div className='min-w-0'>
                              <p className='font-medium truncate text-foreground'>{prod.name}</p>
                              <p className='text-[10px] font-mono text-muted-foreground'>{prod.barcode}</p>
                            </div>
                          </div>
                          <div className='font-mono text-[11px] shrink-0' dir='ltr'>
                            {previewAfter !== null ? (
                              <span className='flex items-center gap-1'>
                                <span className='line-through text-muted-foreground'>
                                  {prod.price.toFixed(2)}
                                </span>
                                <span className='font-bold text-emerald-600 dark:text-[#3EEA85]'>
                                  {previewAfter.toFixed(2)}
                                </span>
                              </span>
                            ) : (
                              <span>{prod.price.toFixed(2)}</span>
                            )}
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className='gap-2 pt-3 border-t'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={isSaving}
                onClick={() => setIsDialogOpen(false)}
              >
                {t('إلغاء', 'Cancel')}
              </Button>
              <Button
                type='submit'
                size='sm'
                disabled={isSaving}
                className='gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
              >
                {isSaving && <Loader2 className='size-3.5 animate-spin' />}
                <span>
                  {editingOffer ? t('حفظ التعديلات', 'Save Changes') : t('إنشاء العرض', 'Create Offer')}
                </span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Offer Confirmation Dialog ── */}
      <Dialog open={!!deletingOffer} onOpenChange={(open) => !open && setDeletingOffer(null)}>
        <DialogContent className='sm:max-w-sm' dir={dir}>
          <DialogHeader className='text-start'>
            <DialogTitle className='text-destructive flex items-center gap-2 text-base'>
              <Trash2 className='size-4' />
              <span>{t('حذف العرض؟', 'Delete Offer?')}</span>
            </DialogTitle>
            <DialogDescription className='text-xs'>
              {t('هل أنت متأكد من حذف العرض', 'Are you sure you want to delete')}{' '}
              <span className='font-bold text-foreground'>"{deletingOffer?.title}"</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2'>
            <Button variant='outline' size='sm' onClick={() => setDeletingOffer(null)}>
              {t('إلغاء', 'Cancel')}
            </Button>
            <Button variant='destructive' size='sm' onClick={handleDeleteConfirm}>
              {t('حذف نهائياً', 'Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
