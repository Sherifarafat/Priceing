import * as React from 'react'
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  Barcode as BarcodeIcon,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Camera,
  Percent,
  Banknote,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Check,
} from 'lucide-react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { toast } from 'sonner'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { useSaaSStore } from '@/lib/saas-store'
import { useLang } from '@/lib/i18n'
import { getPageNumbers } from '@/lib/utils'
import { Product, EntityStatus } from '@/types/saas'

function playBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.15)
  } catch {}
}

export function ProductsView() {
  const { t } = useLang()
  const {
    currentUser,
    merchants,
    currencies,
    categories,
    products,
    fees,
    createCategory,
    createProduct,
    updateProduct,
    deleteProduct,
    bulkAdjustProductPrices,
    hasPermission,
  } = useSaaSStore()

  // Current merchant context
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN'
  const merchantId = currentUser.merchantId || merchants[0]?.id || ''
  const [selectedMerchantFilter, setSelectedMerchantFilter] = React.useState<string>('all')
  const [targetMerchantId, setTargetMerchantId] = React.useState<string>(merchantId || merchants[0]?.id || '')

  const currentActiveMerchantId = isSuperAdmin
    ? (targetMerchantId || merchantId)
    : merchantId
  const merchant = merchants.find((m) => m.id === currentActiveMerchantId)
  const currency = currencies.find((c) => c.id === merchant?.currencyId) || currencies[0]

  // Scoped to this merchant only! (Section 2.1)
  const merchantProducts = isSuperAdmin
    ? (selectedMerchantFilter === 'all'
        ? products
        : products.filter((p) => p.merchantId === selectedMerchantFilter))
    : products.filter((p) => p.merchantId === merchantId)

  const merchantCategories = isSuperAdmin
    ? selectedMerchantFilter === 'all'
      ? categories
      : categories.filter((c) => c.merchantId === selectedMerchantFilter)
    : categories.filter((c) => c.merchantId === merchantId)

  const [quickModalCatName, setQuickModalCatName] = React.useState('')
  const [showQuickModalCat, setShowQuickModalCat] = React.useState(false)

  const handleQuickCreateModalCategory = () => {
    const trimmed = quickModalCatName.trim()
    if (!trimmed) return
    const mId = isSuperAdmin ? targetMerchantId || merchants[0]?.id || '' : merchantId
    const created = createCategory(trimmed, null, mId)
    setFormCategoryId(created.id)
    setQuickModalCatName('')
    setShowQuickModalCat(false)
    toast.success(t(`تم إنشاء وتحديد القسم "${trimmed}" ✓`, `Category "${trimmed}" created & selected ✓`))
  }

  const applicableFees = (fees || []).filter(
    (f) => f.status === 'Active' && (!f.merchantId || f.merchantId === currentActiveMerchantId)
  )

  // Filters & Search
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all')
  const [selectedStatus, setSelectedStatus] = React.useState<string>('all')

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCategory, selectedStatus, selectedMerchantFilter, pageSize])

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = React.useState<Product | null>(null)
  const [formError, setFormError] = React.useState<string | null>(null)

  // Bulk Price Update Modal state
  const [isBulkPriceOpen, setIsBulkPriceOpen] = React.useState(false)
  const [bulkPriceMode, setBulkPriceMode] = React.useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE')
  const [bulkPriceDirection, setBulkPriceDirection] = React.useState<'INCREASE' | 'DECREASE'>('INCREASE')
  const [bulkPriceValue, setBulkPriceValue] = React.useState('')
  const [bulkPriceCategoryId, setBulkPriceCategoryId] = React.useState<string>('all')
  const [isBulkPriceSaving, setIsBulkPriceSaving] = React.useState(false)
  const [bulkPriceError, setBulkPriceError] = React.useState<string | null>(null)

  const openBulkPriceDialog = () => {
    setBulkPriceMode('PERCENTAGE')
    setBulkPriceDirection('INCREASE')
    setBulkPriceValue('')
    setBulkPriceCategoryId('all')
    setBulkPriceError(null)
    setIsBulkPriceOpen(true)
  }

  const bulkTargetProducts = React.useMemo(() => {
    return merchantProducts.filter((p) => {
      if (bulkPriceCategoryId === 'all') return true
      if (bulkPriceCategoryId === 'uncategorized') return !p.categoryId
      return p.categoryId === bulkPriceCategoryId
    })
  }, [merchantProducts, bulkPriceCategoryId])

  const parsedBulkValue = parseFloat(bulkPriceValue)
  const isBulkValueValid = Number.isFinite(parsedBulkValue) && parsedBulkValue > 0

  const computeBulkPreviewPrice = (oldPrice: number) => {
    if (!isBulkValueValid) return oldPrice
    const sign = bulkPriceDirection === 'DECREASE' ? -1 : 1
    const raw =
      bulkPriceMode === 'PERCENTAGE'
        ? oldPrice * (1 + (sign * parsedBulkValue) / 100)
        : oldPrice + sign * parsedBulkValue
    return Math.max(0, Math.round(raw * 100) / 100)
  }

  const handleBulkPriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBulkPriceError(null)

    if (!isBulkValueValid) {
      setBulkPriceError('من فضلك أدخل قيمة صحيحة أكبر من صفر.')
      return
    }
    if (bulkTargetProducts.length === 0) {
      setBulkPriceError('لا توجد منتجات في هذا النطاق لتعديل سعرها.')
      return
    }

    setIsBulkPriceSaving(true)
    try {
      const res = await bulkAdjustProductPrices({
        mode: bulkPriceMode,
        direction: bulkPriceDirection,
        value: parsedBulkValue,
        merchantId: isSuperAdmin ? selectedMerchantFilter : merchantId,
        categoryId: bulkPriceCategoryId,
        status: 'all',
      })

      if (!res.success) {
        setBulkPriceError(res.error || 'حدث خطأ أثناء تعديل الأسعار.')
        return
      }

      const labelValue =
        bulkPriceMode === 'PERCENTAGE'
          ? `${parsedBulkValue}%`
          : `${parsedBulkValue} ${currency.symbol}`
      const labelDir = bulkPriceDirection === 'INCREASE' ? 'زيادة' : 'خصم'
      toast.success(`تم تطبيق ${labelDir} بقيمة ${labelValue} على ${res.updatedCount} منتج بنجاح`)
      setIsBulkPriceOpen(false)
    } finally {
      setIsBulkPriceSaving(false)
    }
  }

  // Form Fields
  const [formName, setFormName] = React.useState('')
  const [formBarcode, setFormBarcode] = React.useState('')
  const [formPrice, setFormPrice] = React.useState('')
  const [formDescription, setFormDescription] = React.useState('')
  const [formImageUrl, setFormImageUrl] = React.useState('')
  const [formCategoryId, setFormCategoryId] = React.useState<string>('')
  const [formStatus, setFormStatus] = React.useState<EntityStatus>('Active')
  const [formFeeIds, setFormFeeIds] = React.useState<string[]>([])

  // Reset form
  const resetForm = () => {
    setFormName('')
    setFormBarcode('')
    setFormPrice('')
    setFormDescription('')
    setFormImageUrl('')
    setFormCategoryId('')
    setFormStatus('Active')
    setFormFeeIds([])
    setFormError(null)
  }

  const openCreateDialog = () => {
    resetForm()
    setTargetMerchantId(
      isSuperAdmin
        ? (selectedMerchantFilter !== 'all' ? selectedMerchantFilter : (merchants[0]?.id || ''))
        : merchantId
    )
    setIsCreateOpen(true)
  }

  const openEditDialog = (prod: Product) => {
    setEditingProduct(prod)
    setFormName(prod.name)
    setFormBarcode(prod.barcode)
    setFormPrice(prod.price.toString())
    setFormDescription(prod.description || '')
    setFormImageUrl(prod.imageUrl || '')
    setFormCategoryId(prod.categoryId || '')
    setFormStatus(prod.status)
    setFormFeeIds(prod.feeIds || [])
    setFormError(null)
  }

  // Handle Save
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formName.trim()) {
      setFormError('Product Name is required.')
      return
    }
    if (!formBarcode.trim()) {
      setFormError('Barcode is required.')
      return
    }
    const priceNum = parseFloat(formPrice)
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError('Price must be a valid positive number.')
      return
    }

    if (editingProduct) {
      // Edit
      const res = updateProduct(editingProduct.id, {
        name: formName.trim(),
        barcode: formBarcode.trim(),
        price: priceNum,
        description: formDescription.trim(),
        imageUrl: formImageUrl.trim(),
        categoryId: formCategoryId || null,
        feeIds: formFeeIds,
        status: formStatus,
      })
      if (!res.success) {
        setFormError(res.error || 'Failed to update product.')
        return
      }
      setEditingProduct(null)
    } else {
      // Create
      const res = createProduct({
        name: formName.trim(),
        barcode: formBarcode.trim(),
        price: priceNum,
        description: formDescription.trim(),
        imageUrl: formImageUrl.trim(),
        categoryId: formCategoryId || null,
        feeIds: formFeeIds,
        status: formStatus,
        merchantId: isSuperAdmin ? targetMerchantId : merchantId,
      })
      if (!res.success) {
        setFormError(res.error || 'Failed to create product.')
        return
      }
      setIsCreateOpen(false)
    }
    resetForm()
  }

  const handleDeleteConfirm = () => {
    if (deletingProduct) {
      deleteProduct(deletingProduct.id)
      setDeletingProduct(null)
    }
  }

  // Barcode Scanner state
  const [isScannerOpen, setIsScannerOpen] = React.useState(false)
  const [cameraScannedProduct, setCameraScannedProduct] = React.useState<Product | null>(null)
  const scannerRef = React.useRef<Html5Qrcode | null>(null)

  const handleBarcodeScanned = React.useCallback(
    (scannedVal: string) => {
      const val = scannedVal.trim()
      if (!val) return
      playBeep()

      const cleanVal = val.replace(/^0+/, '')
      const matched = merchantProducts.find((p) => {
        const pb = (p.barcode || '').trim().toLowerCase()
        const pbClean = pb.replace(/^0+/, '')
        return (
          pb === val.toLowerCase() ||
          pbClean === cleanVal.toLowerCase() ||
          p.id.toLowerCase() === val.toLowerCase()
        )
      })

      setSearchTerm(val)

      if (matched) {
        setCameraScannedProduct(matched)
        toast.success(`تم العثور على: ${matched.name} (${currency.symbol} ${matched.price})`)
        setTimeout(() => {
          handleCloseScanner()
        }, 2200)
      } else {
        toast.info(`تم مسح الباركود: ${val} (غير مسجل في الكتالوج)`)
        handleCloseScanner()
      }
    },
    [merchantProducts, currency.symbol]
  )

  const handleCloseScanner = () => {
    if (scannerRef.current?.isScanning) {
      scannerRef.current
        .stop()
        .catch(() => {})
        .finally(() => {
          scannerRef.current = null
        })
    }
    setIsScannerOpen(false)
    setCameraScannedProduct(null)
  }

  // Camera scanner lifecycle
  React.useEffect(() => {
    if (!isScannerOpen) return

    let isMounted = true
    const timer = setTimeout(() => {
      if (!isMounted) return
      try {
        const scanner = new Html5Qrcode('products-camera-feed', {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        })
        scannerRef.current = scanner

        scanner
          .start(
            { facingMode: 'environment' },
            { fps: 20, qrbox: { width: 250, height: 160 } },
            (decodedText) => {
              handleBarcodeScanned(decodedText)
            },
            () => {}
          )
          .catch((err) => {
            console.warn('Camera scanner start error:', err)
          })
      } catch (err) {
        console.warn('Scanner init error:', err)
      }
    }, 250)

    return () => {
      isMounted = false
      clearTimeout(timer)
      if (scannerRef.current?.isScanning) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current = null
          })
      }
    }
  }, [isScannerOpen, handleBarcodeScanned])

  // Hardware barcode scanner listener
  React.useEffect(() => {
    let buffer = ''
    let lastKeyTime = Date.now()

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT') &&
        !activeEl.classList.contains('barcode-search-input')
      ) {
        return
      }

      const currentTime = Date.now()
      const charDiff = currentTime - lastKeyTime
      lastKeyTime = currentTime

      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          const scanned = buffer.trim()
          setSearchTerm(scanned)
          playBeep()
          const clean = scanned.replace(/^0+/, '').toLowerCase()
          const matched = merchantProducts.find((p) => {
            const pb = (p.barcode || '').trim().toLowerCase()
            const pbClean = pb.replace(/^0+/, '')
            return (
              pb === scanned.toLowerCase() ||
              pbClean === clean ||
              p.id.toLowerCase() === scanned.toLowerCase()
            )
          })
          if (matched) {
            toast.success(`تم العثور على المنتج: ${matched.name} (${currency.symbol} ${matched.price})`)
          } else {
            toast.info(`تم مسح الباركود: ${scanned} (غير مسجل في الكتالوج)`)
          }
        }
        buffer = ''
      } else if (e.key.length === 1) {
        if (charDiff < 60 || buffer.length > 0) {
          buffer += e.key
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [merchantProducts, currency.symbol])

  // Filtering
  const filteredProducts = merchantProducts.filter((p) => {
    const q = searchTerm.trim().toLowerCase()
    const cleanQ = q.replace(/^0+/, '')
    const pBarcode = (p.barcode || '').trim().toLowerCase()
    const pCleanBarcode = pBarcode.replace(/^0+/, '')
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      pBarcode.includes(q) ||
      pCleanBarcode.includes(cleanQ) ||
      p.id.toLowerCase().includes(q)
    const matchesCat =
      selectedCategory === 'all' ||
      (selectedCategory === 'uncategorized' && !p.categoryId) ||
      p.categoryId === selectedCategory
    const matchesStatus = selectedStatus === 'all' || p.status === selectedStatus
    return matchesSearch && matchesCat && matchesStatus
  })

  // Pagination calculation
  const totalProducts = filteredProducts.length
  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + pageSize)
  const pageNumbers = getPageNumbers(safeCurrentPage, totalPages)
  const showingFrom = totalProducts === 0 ? 0 : startIndex + 1
  const showingTo = Math.min(startIndex + pageSize, totalProducts)

  // Permissions
  const canCreate = hasPermission('products.create')
  const canEdit = hasPermission('products.edit')
  const canDelete = hasPermission('products.delete')

  return (
    <>
      <Header>
        <div className='flex items-center gap-2'>
          <h1 className='font-semibold text-sm'>Products Catalog</h1>
          <Badge variant='outline' className='text-xs'>
            {merchant?.name} &bull; Currency: {currency.code} ({currency.symbol})
          </Badge>
        </div>
        <div className='ms-auto flex items-center gap-2'>
          <LanguageSwitch />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-5 p-4 md:p-6'>
        {/* Top Actions & Statistics */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Product Catalog</h2>
            <p className='text-xs text-muted-foreground'>
              Manage products, barcodes, and prices for {merchant?.name}. Catalog is shared across all branches.
            </p>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            {canEdit && (
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={openBulkPriceDialog}
                disabled={merchantProducts.length === 0}
                className='gap-1.5 bg-white text-black border-neutral-300 hover:bg-neutral-100 dark:bg-black dark:text-white dark:border-neutral-700 dark:hover:bg-neutral-900 font-semibold cursor-pointer'
              >
                <Percent className='size-3.5' />
                <span>تعديل الأسعار</span>
              </Button>
            )}
            <Button
              asChild
              variant='outline'
              size='sm'
              className='bg-white text-black border-neutral-300 hover:bg-neutral-100 dark:bg-black dark:text-white dark:border-neutral-700 dark:hover:bg-neutral-900'
            >
              <Link to='/excel'>
                <FileSpreadsheet className='mr-1.5 size-4' />
                Bulk Operations
              </Link>
            </Button>
            {canCreate && (
              <Button
                size='sm'
                onClick={openCreateDialog}
                className='bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 cursor-pointer'
              >
                <Plus className='mr-1.5 size-4' />
                Add Product
              </Button>
            )}
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <Card className='p-3 bg-card'>
          <div className='flex flex-col sm:flex-row gap-3 items-center justify-between'>
            <div className='flex items-center gap-2 w-full sm:w-auto'>
              <div className='relative w-full sm:w-80'>
                <Search className='absolute left-2.5 top-2.5 size-4 text-muted-foreground' />
                <Input
                  placeholder='Search by product name or barcode...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-9 pr-8 text-xs barcode-search-input'
                />
                {searchTerm && (
                  <button
                    type='button'
                    onClick={() => setSearchTerm('')}
                    className='absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer'
                    title='مسح البحث'
                  >
                    <XCircle className='size-4' />
                  </button>
                )}
              </div>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => setIsScannerOpen(true)}
                className='h-9 gap-1.5 text-xs shrink-0 bg-white text-black border-neutral-300 hover:bg-neutral-100 dark:bg-black dark:text-white dark:border-neutral-700 dark:hover:bg-neutral-900 font-bold cursor-pointer'
                title='مسح باركود بالكاميرا'
              >
                <Camera className='size-3.5' />
                <span>مسح باركود</span>
              </Button>
            </div>
            <div className='flex items-center gap-2 w-full sm:w-auto'>
              {isSuperAdmin && (
                <select
                  value={selectedMerchantFilter}
                  onChange={(e) => setSelectedMerchantFilter(e.target.value)}
                  className='rounded-md border bg-background px-2.5 py-1.5 text-xs text-foreground shadow-2xs font-semibold'
                >
                  <option value='all'>All Merchants</option>
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              )}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className='rounded-md border bg-background px-2.5 py-1.5 text-xs text-foreground shadow-2xs'
              >
                <option value='all'>All Categories</option>
                <option value='uncategorized'>Uncategorized</option>
                {merchantCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className='rounded-md border bg-background px-2.5 py-1.5 text-xs text-foreground shadow-2xs'
              >
                <option value='all'>All Statuses</option>
                <option value='Active'>Active</option>
                <option value='Inactive'>Inactive</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Products Table */}
        <Card>
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead className='border-b bg-muted/50 font-medium text-muted-foreground uppercase text-[10px] tracking-wider'>
                <tr>
                  <th className='p-3.5'>Product</th>
                  <th className='p-3.5'>Barcode</th>
                  <th className='p-3.5'>Category</th>
                  <th className='p-3.5'>Price</th>
                  <th className='p-3.5'>Status</th>
                  <th className='p-3.5 text-right'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className='p-8 text-center text-muted-foreground'>
                      No products found. Click &quot;Add Product&quot; or &quot;Bulk Operations&quot; to populate catalog.
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((prod) => {
                    const cat = categories.find((c) => c.id === prod.categoryId)
                    return (
                      <tr key={prod.id} className='hover:bg-muted/30 transition-colors'>
                        <td className='p-3.5 flex items-center gap-3'>
                          {prod.imageUrl ? (
                            <img
                              src={prod.imageUrl}
                              alt={prod.name}
                              className='size-10 rounded-md object-cover border bg-muted shrink-0'
                            />
                          ) : (
                            <div className='size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-[#3EEA85] border border-emerald-500/20 shrink-0'>
                              <ImageIcon className='size-4' />
                            </div>
                          )}
                          <div className='min-w-0'>
                            <div className='font-semibold text-foreground truncate max-w-xs'>
                              {prod.name}
                            </div>
                            <div className='text-[11px] text-muted-foreground truncate max-w-xs'>
                              {prod.description || 'No description'}
                            </div>
                          </div>
                        </td>
                        <td className='p-3.5'>
                          <Badge variant='outline' className='font-mono text-[11px] font-semibold'>
                            <BarcodeIcon className='mr-1 size-3' />
                            {prod.barcode}
                          </Badge>
                        </td>
                        <td className='p-3.5'>
                          {cat ? (
                            <Badge variant='secondary' className='text-[11px]'>
                              {cat.name}
                            </Badge>
                          ) : (
                            <span className='text-muted-foreground italic text-[11px]'>
                              Uncategorized
                            </span>
                          )}
                        </td>
                        <td className='p-3.5'>
                          <div className='font-bold font-mono text-sm text-foreground'>
                            {currency.symbol} {prod.price.toFixed(2)}
                          </div>
                          {prod.feeIds && prod.feeIds.length > 0 && (
                            <div className='flex flex-wrap gap-1 mt-1'>
                              {prod.feeIds.map((fid) => {
                                const fee = fees.find((f) => f.id === fid)
                                if (!fee) return null
                                return (
                                  <Badge
                                    key={fid}
                                    variant='outline'
                                    className='text-[10px] py-0 px-1.5 font-normal bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60'
                                  >
                                    +{fee.name} ({fee.type === 'PERCENTAGE' ? `${fee.value}%` : `${fee.value} EGP`})
                                  </Badge>
                                )
                              })}
                            </div>
                          )}
                        </td>
                        <td className='p-3.5'>
                          <Badge
                            variant={prod.status === 'Active' ? 'default' : 'secondary'}
                            className='text-[10px]'
                          >
                            {prod.status === 'Active' ? (
                              <CheckCircle2 className='mr-1 size-3 text-green-400' />
                            ) : (
                              <XCircle className='mr-1 size-3' />
                            )}
                            {prod.status}
                          </Badge>
                        </td>
                        <td className='p-3.5 text-right'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size='icon' variant='ghost' className='size-7'>
                                <MoreHorizontal className='size-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end' className='w-36 text-xs'>
                              {canEdit && (
                                <DropdownMenuItem onClick={() => openEditDialog(prod)}>
                                  <Edit2 className='mr-2 size-3.5' /> Edit
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => setDeletingProduct(prod)}
                                    className='text-destructive focus:text-destructive'
                                  >
                                    <Trash2 className='mr-2 size-3.5' /> Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalProducts > 0 && (
            <div className='flex flex-col sm:flex-row items-center justify-between gap-3 border-t bg-muted/20 px-4 py-3 text-xs'>
              <div className='flex flex-wrap items-center gap-3 text-muted-foreground'>
                <span>
                  Showing{' '}
                  <span className='font-semibold text-foreground'>
                    {showingFrom}–{showingTo}
                  </span>{' '}
                  of <span className='font-semibold text-foreground'>{totalProducts}</span> products
                </span>
                <div className='flex items-center gap-1.5'>
                  <span>Rows:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className='h-7 rounded-md border bg-background px-2 text-xs font-medium text-foreground shadow-2xs cursor-pointer'
                  >
                    {[10, 20, 30, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className='flex items-center gap-1.5'>
                <span className='hidden md:inline text-muted-foreground mr-2'>
                  Page <span className='font-semibold text-foreground'>{safeCurrentPage}</span> of{' '}
                  <span className='font-semibold text-foreground'>{totalPages}</span>
                </span>

                <Button
                  type='button'
                  variant='outline'
                  size='icon'
                  className='size-7 hidden sm:inline-flex bg-white text-black border-neutral-300 hover:bg-neutral-100 dark:bg-black dark:text-white dark:border-neutral-700 dark:hover:bg-neutral-900 cursor-pointer'
                  onClick={() => setCurrentPage(1)}
                  disabled={safeCurrentPage <= 1}
                  title='First page'
                >
                  <ChevronsLeft className='size-3.5' />
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='icon'
                  className='size-7 bg-white text-black border-neutral-300 hover:bg-neutral-100 dark:bg-black dark:text-white dark:border-neutral-700 dark:hover:bg-neutral-900 cursor-pointer'
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  title='Previous page'
                >
                  <ChevronLeft className='size-3.5' />
                </Button>

                <div className='flex items-center gap-1'>
                  {pageNumbers.map((pageNumber, idx) =>
                    pageNumber === '...' ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className='px-1.5 text-muted-foreground select-none'
                      >
                        ...
                      </span>
                    ) : (
                      <Button
                        key={pageNumber}
                        type='button'
                        variant={safeCurrentPage === pageNumber ? 'default' : 'outline'}
                        size='sm'
                        className={`h-7 min-w-7 px-2 text-xs font-mono cursor-pointer ${
                          safeCurrentPage === pageNumber
                            ? 'bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200'
                            : 'bg-white text-black border-neutral-300 hover:bg-neutral-100 dark:bg-black dark:text-white dark:border-neutral-700 dark:hover:bg-neutral-900'
                        }`}
                        onClick={() => setCurrentPage(pageNumber as number)}
                      >
                        {pageNumber}
                      </Button>
                    )
                  )}
                </div>

                <Button
                  type='button'
                  variant='outline'
                  size='icon'
                  className='size-7 bg-white text-black border-neutral-300 hover:bg-neutral-100 dark:bg-black dark:text-white dark:border-neutral-700 dark:hover:bg-neutral-900 cursor-pointer'
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  title='Next page'
                >
                  <ChevronRight className='size-3.5' />
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='icon'
                  className='size-7 hidden sm:inline-flex bg-white text-black border-neutral-300 hover:bg-neutral-100 dark:bg-black dark:text-white dark:border-neutral-700 dark:hover:bg-neutral-900 cursor-pointer'
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safeCurrentPage >= totalPages}
                  title='Last page'
                >
                  <ChevronsRight className='size-3.5' />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </Main>

      {/* Create / Edit Product Dialog (Section 6.1 of SRS) */}
      <Dialog
        open={isCreateOpen || !!editingProduct}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false)
            setEditingProduct(null)
          }
        }}
      >
        <DialogContent className='max-w-md'>
          <form onSubmit={handleSaveProduct}>
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              <DialogDescription className='text-xs'>
                {editingProduct
                  ? 'Update product details, barcode, or price in catalog.'
                  : 'Add a new product to your merchant catalog. Barcode must be unique.'}
              </DialogDescription>
            </DialogHeader>

            {formError && (
              <div className='my-3 rounded-md bg-destructive/15 p-2.5 text-xs text-destructive font-medium'>
                {formError}
              </div>
            )}

            <div className='space-y-3 my-4 text-xs'>
              {/* Super Admin: Merchant Selector */}
              {isSuperAdmin && !editingProduct && merchants.length > 0 && (
                <div>
                  <label className='font-semibold block mb-1'>Assign to Merchant *</label>
                  <select
                    value={targetMerchantId}
                    onChange={(e) => setTargetMerchantId(e.target.value)}
                    className='w-full rounded-md border bg-background px-2.5 py-1.5 text-xs text-foreground shadow-2xs font-medium'
                  >
                    {merchants.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Product Name */}
              <div>
                <label className='font-semibold block mb-1'>Product Name *</label>
                <Input
                  required
                  placeholder='e.g. Coca Cola Can 330ml'
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className='text-xs'
                />
              </div>

              {/* Barcode & Price */}
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='font-semibold block mb-1'>Barcode *</label>
                  <Input
                    required
                    placeholder='e.g. 5449000000996'
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    className='text-xs font-mono'
                  />
                </div>
                <div>
                  <label className='font-semibold block mb-1'>
                    Price ({currency.symbol}) *
                  </label>
                  <Input
                    required
                    type='number'
                    step='0.01'
                    min='0'
                    placeholder='0.00'
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className='text-xs font-mono'
                  />
                </div>
              </div>

              {/* Category & Status */}
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <div className='flex items-center justify-between mb-1'>
                    <label className='font-semibold block'>{t('القسم', 'Category')}</label>
                    <button
                      type='button'
                      onClick={() => setShowQuickModalCat((v) => !v)}
                      className='text-[10.5px] font-bold text-foreground underline underline-offset-2 cursor-pointer flex items-center gap-0.5'
                    >
                      <Plus className='size-3' />
                      <span>{t('قسم جديد', 'New')}</span>
                    </button>
                  </div>
                  {showQuickModalCat ? (
                    <div className='flex items-center gap-1'>
                      <Input
                        value={quickModalCatName}
                        onChange={(e) => setQuickModalCatName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleQuickCreateModalCategory()
                          }
                        }}
                        placeholder={t('اسم القسم...', 'Category name...')}
                        className='h-8.5 text-xs flex-1'
                        autoFocus
                      />
                      <Button
                        type='button'
                        size='sm'
                        onClick={handleQuickCreateModalCategory}
                        className='h-8.5 px-2.5 bg-primary text-primary-foreground text-xs cursor-pointer'
                      >
                        <Check className='size-3.5' />
                      </Button>
                    </div>
                  ) : (
                    <select
                      value={formCategoryId}
                      onChange={(e) => setFormCategoryId(e.target.value)}
                      className='w-full rounded-md border bg-background px-3 py-2 text-xs text-foreground shadow-2xs'
                    >
                      <option value=''>{t('بدون قسم', 'Uncategorized')}</option>
                      {merchantCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className='font-semibold block mb-1'>Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as EntityStatus)}
                    className='w-full rounded-md border bg-background px-3 py-2 text-xs text-foreground shadow-2xs'
                  >
                    <option value='Active'>Active</option>
                    <option value='Inactive'>Inactive</option>
                  </select>
                </div>
              </div>

              {/* Image URL (Direct device upload or URL supported - Section 6.3) */}
              <div>
                <label className='font-semibold block mb-1'>Product Image URL</label>
                <Input
                  placeholder='https://images.unsplash.com/... or relative path'
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className='text-xs'
                />
                {formImageUrl && (
                  <div className='mt-2 flex items-center gap-2'>
                    <img
                      src={formImageUrl}
                      alt='Preview'
                      className='size-12 rounded object-cover border'
                      onError={(e) => {
                        ;(e.target as HTMLElement).style.display = 'none'
                      }}
                    />
                    <span className='text-[10px] text-muted-foreground'>Image Preview</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className='font-semibold block mb-1'>Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder='Short product description...'
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className='w-full rounded-md border bg-background p-2 text-xs text-foreground'
                />
              </div>

              {/* Applicable Fees & Taxes */}
              <div>
                <label className='font-semibold block mb-1.5'>
                  Applied Fees & Taxes (الرسوم والضرائب)
                </label>
                {applicableFees.length === 0 ? (
                  <div className='text-xs text-muted-foreground italic rounded-md border border-dashed p-2 text-center'>
                    No fees defined yet. Create fees from the Fees & Taxes section in the sidebar.
                  </div>
                ) : (
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 border rounded-lg p-2.5 bg-muted/20'>
                    {applicableFees.map((f) => {
                      const isChecked = formFeeIds.includes(f.id)
                      return (
                        <label
                          key={f.id}
                          className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors text-xs ${
                            isChecked
                              ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800'
                              : 'bg-background hover:bg-muted/50 border-border/60'
                          }`}
                        >
                          <input
                            type='checkbox'
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormFeeIds([...formFeeIds, f.id])
                              } else {
                                setFormFeeIds(formFeeIds.filter((id) => id !== f.id))
                              }
                            }}
                            className='size-3.5 rounded text-emerald-600 accent-emerald-600'
                          />
                          <div className='min-w-0 flex-1'>
                            <div className='font-medium text-foreground truncate'>{f.name}</div>
                            <div className='text-[10px] text-muted-foreground'>
                              {f.type === 'PERCENTAGE' ? `${f.value}% rate` : `${f.value} EGP fixed`}
                            </div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='bg-white text-black border-neutral-300 hover:bg-neutral-100 dark:bg-black dark:text-white dark:border-neutral-700 dark:hover:bg-neutral-900 cursor-pointer'
                onClick={() => {
                  setIsCreateOpen(false)
                  setEditingProduct(null)
                }}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                size='sm'
                className='bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 cursor-pointer'
              >
                {editingProduct ? 'Save Changes' : 'Create Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle>Delete Product?</DialogTitle>
            <DialogDescription className='text-xs'>
              Are you sure you want to delete <strong>{deletingProduct?.name}</strong> (Barcode:{' '}
              {deletingProduct?.barcode}) from your catalog?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' size='sm' onClick={() => setDeletingProduct(null)}>
              Cancel
            </Button>
            <Button variant='destructive' size='sm' onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Camera Barcode Scanner Dialog ── */}
      <Dialog open={isScannerOpen} onOpenChange={(open) => !open && handleCloseScanner()}>
        <DialogContent className='sm:max-w-md p-5 rounded-2xl'>
          <DialogHeader className='text-center'>
            <DialogTitle className='flex items-center justify-center gap-2 text-base font-black'>
              <Camera className='size-5 text-foreground' />
              <span>مسح باركود المنتج بالكاميرا</span>
            </DialogTitle>
            <DialogDescription className='text-xs'>
              وجّه الكاميرا نحو باركود المنتج للبحث عنه فوراً وعرض نتيجته في جدول المنتجات
            </DialogDescription>
          </DialogHeader>

          <div className='relative my-2 rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center'>
            <div id='products-camera-feed' className='w-full h-full' />
            {/* Scan Reticle or Solid Green Result Box */}
            <div className='absolute inset-0 flex items-center justify-center p-3 pointer-events-none'>
              {cameraScannedProduct ? (
                <div className='relative w-[85%] rounded-2xl bg-[#00d632] shadow-2xl p-4 flex flex-col items-center justify-center text-center text-[#061006] animate-in zoom-in-95 pointer-events-auto border-2 border-white/40'>
                  <span className='text-[10px] font-black uppercase tracking-wider bg-black/10 px-2 py-0.5 rounded-full mb-1'>
                    تم العثور على المنتج ✓
                  </span>
                  <h4 className='text-xl sm:text-2xl font-black leading-tight line-clamp-1 mb-1'>
                    {cameraScannedProduct.name}
                  </h4>
                  <div className='flex items-baseline gap-1 my-1'>
                    <span className='text-3xl sm:text-4xl font-black font-mono tracking-tight'>
                      {cameraScannedProduct.price.toFixed(2)}
                    </span>
                    <span className='text-sm font-black'>{currency.symbol}</span>
                  </div>
                  <Button
                    size='sm'
                    onClick={handleCloseScanner}
                    className='mt-2 h-8 px-4 bg-[#061006] hover:bg-black text-white text-xs font-bold rounded-lg cursor-pointer'
                  >
                    عرض في الجدول
                  </Button>
                </div>
              ) : (
                <div className='relative w-48 h-32 border-2 border-emerald-500/80 rounded-lg'>
                  <div className='absolute inset-x-2 top-1/2 -translate-y-1/2 h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse' />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className='flex justify-between items-center sm:justify-between'>
            <p className='text-[11px] text-muted-foreground'>
              يمكنك أيضاً استخدام قارئ الباركود اليدوي مباشرة
            </p>
            <Button variant='outline' size='sm' onClick={handleCloseScanner}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bulk Price Adjustment Dialog ── */}
      <Dialog open={isBulkPriceOpen} onOpenChange={(open) => !isBulkPriceSaving && setIsBulkPriceOpen(open)}>
        <DialogContent className='max-w-md' dir='rtl'>
          <form onSubmit={handleBulkPriceSubmit}>
            <DialogHeader className='text-right'>
              <DialogTitle className='flex items-center gap-2 text-base font-bold'>
                <div className='size-8 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shrink-0'>
                  <Percent className='size-4' />
                </div>
                <span>تعديل أسعار المنتجات جماعياً</span>
              </DialogTitle>
              <DialogDescription className='text-xs text-right'>
                عدّل أسعار كل المنتجات دفعة واحدة بمبلغ ثابت ({currency.symbol}) أو بنسبة مئوية (%).
              </DialogDescription>
            </DialogHeader>

            {bulkPriceError && (
              <div className='my-3 rounded-md bg-destructive/15 p-2.5 text-xs text-destructive font-medium'>
                {bulkPriceError}
              </div>
            )}

            <div className='space-y-4 my-4 text-xs'>
              {/* Adjustment Mode */}
              <div>
                <label className='font-semibold block mb-1.5 text-foreground'>نوع التعديل</label>
                <div className='grid grid-cols-2 gap-2'>
                  <button
                    type='button'
                    onClick={() => {
                      setBulkPriceMode('PERCENTAGE')
                      setBulkPriceError(null)
                    }}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                      bulkPriceMode === 'PERCENTAGE'
                        ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black shadow-2xs'
                        : 'border-neutral-300 bg-white text-black hover:bg-neutral-100 dark:border-neutral-700 dark:bg-black dark:text-white dark:hover:bg-neutral-900'
                    }`}
                  >
                    <Percent className='size-3.5' />
                    <span>نسبة مئوية (%)</span>
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      setBulkPriceMode('FIXED')
                      setBulkPriceError(null)
                    }}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                      bulkPriceMode === 'FIXED'
                        ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black shadow-2xs'
                        : 'border-neutral-300 bg-white text-black hover:bg-neutral-100 dark:border-neutral-700 dark:bg-black dark:text-white dark:hover:bg-neutral-900'
                    }`}
                  >
                    <Banknote className='size-3.5' />
                    <span>مبلغ ثابت ({currency.symbol})</span>
                  </button>
                </div>
              </div>

              {/* Direction */}
              <div>
                <label className='font-semibold block mb-1.5 text-foreground'>اتجاه التعديل</label>
                <div className='grid grid-cols-2 gap-2'>
                  <button
                    type='button'
                    onClick={() => setBulkPriceDirection('INCREASE')}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                      bulkPriceDirection === 'INCREASE'
                        ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black shadow-2xs'
                        : 'border-neutral-300 bg-white text-black hover:bg-neutral-100 dark:border-neutral-700 dark:bg-black dark:text-white dark:hover:bg-neutral-900'
                    }`}
                  >
                    <TrendingUp className='size-3.5' />
                    <span>زيادة (+)</span>
                  </button>
                  <button
                    type='button'
                    onClick={() => setBulkPriceDirection('DECREASE')}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                      bulkPriceDirection === 'DECREASE'
                        ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black shadow-2xs'
                        : 'border-neutral-300 bg-white text-black hover:bg-neutral-100 dark:border-neutral-700 dark:bg-black dark:text-white dark:hover:bg-neutral-900'
                    }`}
                  >
                    <TrendingDown className='size-3.5' />
                    <span>خصم / تقليل (-)</span>
                  </button>
                </div>
              </div>

              {/* Value Input & Quick Presets */}
              <div>
                <label className='font-semibold block mb-1.5 text-foreground'>
                  {bulkPriceMode === 'PERCENTAGE'
                    ? 'قيمة النسبة المئوية (%)'
                    : `قيمة المبلغ الثابت (${currency.symbol})`}
                </label>
                <div className='relative'>
                  <Input
                    type='number'
                    step='0.01'
                    min='0.01'
                    max={bulkPriceMode === 'PERCENTAGE' && bulkPriceDirection === 'DECREASE' ? '100' : undefined}
                    placeholder={bulkPriceMode === 'PERCENTAGE' ? 'مثال: 10' : 'مثال: 25'}
                    value={bulkPriceValue}
                    onChange={(e) => {
                      setBulkPriceValue(e.target.value)
                      setBulkPriceError(null)
                    }}
                    className='pl-14 text-sm font-mono font-bold'
                    dir='ltr'
                    autoFocus
                  />
                  <span className='absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground'>
                    {bulkPriceMode === 'PERCENTAGE' ? '%' : currency.symbol}
                  </span>
                </div>
                <div className='flex flex-wrap items-center gap-1.5 mt-2'>
                  {(bulkPriceMode === 'PERCENTAGE' ? [5, 10, 15, 20, 25] : [5, 10, 25, 50, 100]).map(
                    (preset) => (
                      <button
                        key={preset}
                        type='button'
                        onClick={() => {
                          setBulkPriceValue(String(preset))
                          setBulkPriceError(null)
                        }}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold border transition-colors cursor-pointer ${
                          bulkPriceValue === String(preset)
                            ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                            : 'bg-white text-black border-neutral-300 hover:bg-neutral-100 dark:bg-black dark:text-white dark:border-neutral-700 dark:hover:bg-neutral-900'
                        }`}
                      >
                        {bulkPriceDirection === 'INCREASE' ? '+' : '-'}
                        {preset}
                        {bulkPriceMode === 'PERCENTAGE' ? '%' : ` ${currency.symbol}`}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Scope Selector */}
              <div>
                <div className='flex items-center justify-between mb-1.5'>
                  <label className='font-semibold text-foreground'>تطبيق على</label>
                  <Badge variant='secondary' className='text-[10px] font-semibold'>
                    {bulkTargetProducts.length} منتج
                  </Badge>
                </div>
                <select
                  value={bulkPriceCategoryId}
                  onChange={(e) => setBulkPriceCategoryId(e.target.value)}
                  className='w-full rounded-md border bg-background px-3 py-2 text-xs text-foreground shadow-2xs font-medium'
                >
                  <option value='all'>كل المنتجات ({merchantProducts.length})</option>
                  <option value='uncategorized'>
                    بدون تصنيف ({merchantProducts.filter((p) => !p.categoryId).length})
                  </option>
                  {merchantCategories.map((c) => {
                    const count = merchantProducts.filter((p) => p.categoryId === c.id).length
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} ({count})
                      </option>
                    )
                  })}
                </select>
                {isSuperAdmin && (
                  <p className='text-[10px] text-muted-foreground mt-1'>
                    نطاق التاجر:{' '}
                    <span className='font-semibold text-foreground'>
                      {selectedMerchantFilter === 'all'
                        ? 'كل التجار'
                        : merchants.find((m) => m.id === selectedMerchantFilter)?.name || 'التاجر المحدد'}
                    </span>
                  </p>
                )}
              </div>

              {/* Live Preview */}
              {isBulkValueValid && bulkTargetProducts.length > 0 && (
                <div className='rounded-xl border bg-muted/30 p-3 space-y-2'>
                  <div className='flex items-center justify-between text-[11px] font-semibold text-muted-foreground'>
                    <span>معاينة الأسعار قبل وبعد التعديل</span>
                    <span>
                      {bulkPriceDirection === 'INCREASE' ? '+' : '-'}
                      {parsedBulkValue}
                      {bulkPriceMode === 'PERCENTAGE' ? '%' : ` ${currency.symbol}`}
                    </span>
                  </div>
                  <div className='divide-y divide-border/50'>
                    {bulkTargetProducts.slice(0, 3).map((prod) => {
                      const nextPrice = computeBulkPreviewPrice(prod.price)
                      return (
                        <div
                          key={prod.id}
                          className='py-1.5 flex items-center justify-between gap-2 text-xs'
                        >
                          <span className='truncate font-medium text-foreground max-w-[160px]'>
                            {prod.name}
                          </span>
                          <div className='flex items-center gap-1.5 font-mono shrink-0' dir='ltr'>
                            <span className='text-muted-foreground line-through text-[11px]'>
                              {prod.price.toFixed(2)}
                            </span>
                            <ArrowRight className='size-3 text-muted-foreground' />
                            <span className='font-bold text-foreground'>
                              {nextPrice.toFixed(2)} {currency.symbol}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {bulkTargetProducts.length > 3 && (
                    <div className='text-[10px] text-muted-foreground text-center pt-1'>
                      و {bulkTargetProducts.length - 3} منتج آخر سيتم تحديث سعره بنفس القاعدة
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className='gap-2 sm:justify-start'>
              <Button
                type='submit'
                size='sm'
                disabled={!isBulkValueValid || bulkTargetProducts.length === 0 || isBulkPriceSaving}
                className='gap-1.5 bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 cursor-pointer'
              >
                {isBulkPriceSaving && <Loader2 className='size-3.5 animate-spin' />}
                <span>تطبيق على {bulkTargetProducts.length} منتج</span>
              </Button>
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={isBulkPriceSaving}
                onClick={() => setIsBulkPriceOpen(false)}
                className='bg-white text-black border-neutral-300 hover:bg-neutral-100 dark:bg-black dark:text-white dark:border-neutral-700 dark:hover:bg-neutral-900 cursor-pointer'
              >
                إلغاء
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
