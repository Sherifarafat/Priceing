import * as React from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  Tags,
  Package,
  AlertTriangle,
  Search,
  Store,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
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
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { LanguageSwitch } from '@/components/language-switch'
import { PosShortcutButton } from '@/components/pos-shortcut-button'
import { useSaaSStore } from '@/lib/saas-store'
import { useLang } from '@/lib/i18n'
import { Category } from '@/types/saas'

export function CategoriesView() {
  const { dir, t } = useLang()
  const {
    currentUser,
    merchants,
    branches,
    categories,
    products,
    createCategory,
    updateCategory,
    deleteCategory,
    hasPermission,
  } = useSaaSStore()

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN'
  const defaultMerchantId = currentUser.merchantId || merchants[0]?.id || ''
  const [selectedMerchantFilter, setSelectedMerchantFilter] = React.useState<string>(
    isSuperAdmin ? 'all' : defaultMerchantId
  )
  const [searchTerm, setSearchTerm] = React.useState('')
  const [branchFilter, setBranchFilter] = React.useState<string>('ALL')

  const activeMerchantId = isSuperAdmin
    ? selectedMerchantFilter !== 'all'
      ? selectedMerchantFilter
      : merchants[0]?.id || ''
    : defaultMerchantId

  // Scoped categories, products & branches
  const scopedCategories = React.useMemo(() => {
    return categories.filter((c) => {
      if (isSuperAdmin) {
        if (selectedMerchantFilter !== 'all' && c.merchantId !== selectedMerchantFilter) return false
      } else if (c.merchantId !== defaultMerchantId) {
        return false
      }
      if (branchFilter === 'GLOBAL' && c.branchId) return false
      if (branchFilter !== 'ALL' && branchFilter !== 'GLOBAL' && c.branchId !== branchFilter) return false
      if (searchTerm.trim() && !c.name.toLowerCase().includes(searchTerm.trim().toLowerCase())) {
        return false
      }
      return true
    })
  }, [categories, isSuperAdmin, selectedMerchantFilter, defaultMerchantId, branchFilter, searchTerm])

  const scopedProducts = React.useMemo(() => {
    if (isSuperAdmin) {
      return selectedMerchantFilter === 'all'
        ? products
        : products.filter((p) => p.merchantId === selectedMerchantFilter)
    }
    return products.filter((p) => p.merchantId === defaultMerchantId)
  }, [products, isSuperAdmin, selectedMerchantFilter, defaultMerchantId])

  const scopedBranches = React.useMemo(() => {
    if (isSuperAdmin) {
      return selectedMerchantFilter === 'all'
        ? branches
        : branches.filter((b) => b.merchantId === selectedMerchantFilter)
    }
    return branches.filter((b) => b.merchantId === defaultMerchantId)
  }, [branches, isSuperAdmin, selectedMerchantFilter, defaultMerchantId])

  // Dialogs
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = React.useState<Category | null>(null)
  const [catName, setCatName] = React.useState('')
  const [formMerchantId, setFormMerchantId] = React.useState<string>(activeMerchantId)
  const [branchId, setBranchId] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const canManage =
    isSuperAdmin || currentUser.role === 'MERCHANT_MANAGER' || hasPermission('categories.manage')

  const formBranches = branches.filter((b) => b.merchantId === (formMerchantId || activeMerchantId))

  const openCreate = () => {
    setEditingCategory(null)
    setCatName('')
    setFormMerchantId(activeMerchantId || merchants[0]?.id || '')
    setBranchId(null)
    setError(null)
    setIsCreateOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditingCategory(cat)
    setCatName(cat.name)
    setFormMerchantId(cat.merchantId)
    setBranchId(cat.branchId || null)
    setError(null)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!catName.trim()) {
      setError(t('اسم القسم مطلوب.', 'Category name is required.'))
      return
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, catName.trim(), branchId)
      toast.success(t(`تم تحديث القسم "${catName.trim()}" ✓`, `Category "${catName.trim()}" updated ✓`))
      setEditingCategory(null)
    } else {
      createCategory(catName.trim(), branchId, formMerchantId || activeMerchantId)
      toast.success(t(`تمت إضافة القسم "${catName.trim()}" ✓`, `Category "${catName.trim()}" created ✓`))
      setIsCreateOpen(false)
    }
    setCatName('')
    setBranchId(null)
  }

  const handleDeleteConfirm = () => {
    if (deletingCategory) {
      const name = deletingCategory.name
      deleteCategory(deletingCategory.id)
      setDeletingCategory(null)
      toast.success(t(`تم حذف القسم "${name}"`, `Category "${name}" deleted`))
    }
  }

  const uncategorizedCount = scopedProducts.filter((p) => !p.categoryId).length
  const categorizedCount = scopedProducts.length - uncategorizedCount
  const productsAffected = deletingCategory
    ? scopedProducts.filter((p) => p.categoryId === deletingCategory.id).length
    : 0

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

      <Main className='flex flex-1 flex-col gap-5 p-4 sm:p-6' dir={dir}>
        {/* Top Title & Action Bar */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <div className='flex items-center gap-2'>
              <h1 className='text-2xl font-bold tracking-tight text-foreground'>
                {t('أقسام المنتجات', 'Product Categories')}
              </h1>
              <Badge variant='outline' className='text-xs font-mono font-bold bg-muted/50'>
                {scopedCategories.length} {t('قسم', 'Categories')}
              </Badge>
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              {t(
                'نظّم منتجاتك في أقسام واضحة — تظهر تلقائياً في شاشة إضافة المنتجات وفلاتر نقطة البيع (POS).',
                'Organize your store products into categories — synced automatically with Add Product and POS filters.'
              )}
            </p>
          </div>

          {canManage && (
            <Button
              size='sm'
              onClick={openCreate}
              className='gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-xs cursor-pointer shrink-0'
            >
              <Plus className='size-4' />
              <span>{t('إضافة قسم جديد', 'New Category')}</span>
            </Button>
          )}
        </div>

        {/* Summary KPI Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3.5'>
          <Card className='p-4 rounded-xl border-border/80 bg-card shadow-2xs flex items-center justify-between'>
            <div>
              <p className='text-xs text-muted-foreground font-medium'>
                {t('إجمالي الأقسام', 'Total Categories')}
              </p>
              <p className='text-2xl font-bold mt-1 font-mono text-foreground'>
                {scopedCategories.length}
              </p>
            </div>
            <div className='size-10 rounded-xl bg-muted border border-border/70 flex items-center justify-center'>
              <Tags className='size-5 text-foreground' />
            </div>
          </Card>

          <Card className='p-4 rounded-xl border-border/80 bg-card shadow-2xs flex items-center justify-between'>
            <div>
              <p className='text-xs text-muted-foreground font-medium'>
                {t('منتجات مصنّفة', 'Categorized Products')}
              </p>
              <p className='text-2xl font-bold mt-1 font-mono text-foreground'>
                {categorizedCount}
              </p>
            </div>
            <div className='size-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-[#3EEA85] flex items-center justify-center'>
              <Package className='size-5' />
            </div>
          </Card>

          <Card className='p-4 rounded-xl border-border/80 bg-card shadow-2xs flex items-center justify-between'>
            <div>
              <p className='text-xs text-muted-foreground font-medium'>
                {t('منتجات بدون قسم', 'Uncategorized Products')}
              </p>
              <p className='text-2xl font-bold mt-1 font-mono text-foreground'>
                {uncategorizedCount}
              </p>
            </div>
            <div className='size-10 rounded-xl bg-muted border border-border/70 flex items-center justify-center'>
              <Store className='size-5 text-muted-foreground' />
            </div>
          </Card>
        </div>

        {/* Search & Filter Toolbar */}
        <div className='flex flex-col sm:flex-row items-center gap-3'>
          <div className='relative w-full sm:w-80'>
            <Search className='size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2' />
            <Input
              placeholder={t('ابحث باسم القسم...', 'Search by category name...')}
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

            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className='h-9 rounded-lg border border-border/80 bg-card px-3 text-xs text-foreground font-medium'
            >
              <option value='ALL'>{t('كل الفروع', 'All Branches')}</option>
              <option value='GLOBAL'>{t('عام لكل الفروع', 'Global Only')}</option>
              {scopedBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Categories Data Table */}
        <Card className='border-border/80 shadow-xs overflow-hidden bg-card rounded-xl'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow className='border-b border-border/70 bg-muted/40 hover:bg-muted/40'>
                  <TableHead className='ps-5 py-3 text-xs font-semibold text-foreground'>
                    {t('اسم القسم', 'Category Name')}
                  </TableHead>
                  {isSuperAdmin && (
                    <TableHead className='py-3 text-xs font-semibold text-foreground'>
                      {t('المتجر', 'Merchant')}
                    </TableHead>
                  )}
                  <TableHead className='py-3 text-xs font-semibold text-foreground'>
                    {t('الفرع المرتبط', 'Assigned Branch')}
                  </TableHead>
                  <TableHead className='py-3 text-xs font-semibold text-foreground text-center'>
                    {t('عدد المنتجات', 'Products Count')}
                  </TableHead>
                  <TableHead className='pe-5 py-3 text-xs font-semibold text-foreground text-end'>
                    {t('إجراءات', 'Actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {scopedCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isSuperAdmin ? 5 : 4} className='h-44 text-center text-muted-foreground'>
                      <div className='flex flex-col items-center justify-center gap-2'>
                        <Tags className='size-9 opacity-25' />
                        <p className='font-semibold text-sm text-foreground'>
                          {t('لا توجد أقسام منتجات بعد', 'No product categories found')}
                        </p>
                        <p className='text-xs'>
                          {t('اضغط على "إضافة قسم جديد" لإنشاء أول قسم لمنتجاتك.', 'Click "New Category" above to create your first product category.')}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  scopedCategories.map((cat) => {
                    const count = scopedProducts.filter((p) => p.categoryId === cat.id).length
                    const assignedBranch = branches.find((b) => b.id === cat.branchId)
                    const catMerchant = merchants.find((m) => m.id === cat.merchantId)

                    return (
                      <TableRow key={cat.id} className='border-b border-border/50 hover:bg-muted/30 transition-colors'>
                        <TableCell className='ps-5 py-3.5'>
                          <div className='flex items-center gap-3'>
                            <div className='size-9 rounded-lg bg-muted border border-border/70 flex items-center justify-center shrink-0'>
                              <Tags className='size-4 text-foreground' />
                            </div>
                            <span className='font-bold text-xs sm:text-sm text-foreground'>
                              {cat.name}
                            </span>
                          </div>
                        </TableCell>

                        {isSuperAdmin && (
                          <TableCell className='py-3.5 text-xs font-medium text-muted-foreground'>
                            {catMerchant?.name || '—'}
                          </TableCell>
                        )}

                        <TableCell className='py-3.5'>
                          <Badge variant='outline' className='text-[11px] font-medium'>
                            {assignedBranch ? assignedBranch.name : t('كل الفروع', 'All Branches')}
                          </Badge>
                        </TableCell>

                        <TableCell className='py-3.5 text-center'>
                          <Badge variant='secondary' className='font-mono text-xs gap-1'>
                            <Package className='size-3' />
                            {count}
                          </Badge>
                        </TableCell>

                        <TableCell className='pe-5 py-3.5 text-end'>
                          {canManage && (
                            <div className='inline-flex items-center justify-end gap-1'>
                              <Button
                                size='icon'
                                variant='ghost'
                                className='size-8 text-muted-foreground hover:text-foreground cursor-pointer'
                                onClick={() => openEdit(cat)}
                                title={t('تعديل', 'Edit')}
                              >
                                <Edit2 className='size-4' />
                              </Button>
                              <Button
                                size='icon'
                                variant='ghost'
                                className='size-8 text-muted-foreground hover:text-destructive cursor-pointer'
                                onClick={() => setDeletingCategory(cat)}
                                title={t('حذف', 'Delete')}
                              >
                                <Trash2 className='size-4' />
                              </Button>
                            </div>
                          )}
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

      {/* Create / Edit Category Dialog */}
      <Dialog
        open={isCreateOpen || !!editingCategory}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false)
            setEditingCategory(null)
          }
        }}
      >
        <DialogContent className='max-w-sm rounded-2xl' dir={dir}>
          <form onSubmit={handleSave}>
            <DialogHeader className='text-start'>
              <DialogTitle className='text-base font-bold'>
                {editingCategory
                  ? t('تعديل القسم', 'Edit Category')
                  : t('إضافة قسم منتجات جديد', 'New Product Category')}
              </DialogTitle>
              <DialogDescription className='text-xs'>
                {t(
                  'سيظهر هذا القسم تلقائياً عند إضافة المنتجات وفي فلاتر نقطة البيع.',
                  'This category will appear automatically in Add Product and POS filters.'
                )}
              </DialogDescription>
            </DialogHeader>

            {error && <p className='text-xs text-destructive mt-2 font-medium'>{error}</p>}

            <div className='my-4 space-y-3.5'>
              {isSuperAdmin && !editingCategory && (
                <div>
                  <label className='font-semibold text-xs block mb-1'>{t('المتجر', 'Merchant')}</label>
                  <select
                    value={formMerchantId}
                    onChange={(e) => {
                      setFormMerchantId(e.target.value)
                      setBranchId(null)
                    }}
                    className='w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground'
                  >
                    {merchants.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className='font-semibold text-xs block mb-1'>
                  {t('اسم القسم *', 'Category Name *')}
                </label>
                <Input
                  required
                  placeholder={t('مثال: مشروبات، ألبان، مخبوزات...', 'e.g. Beverages, Dairy, Bakery...')}
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className='h-9 text-xs rounded-lg'
                  autoFocus
                />
              </div>

              <div>
                <label className='font-semibold text-xs block mb-1'>
                  {t('الفرع المرتبط', 'Assign to Branch')}
                </label>
                <select
                  value={branchId || 'ALL'}
                  onChange={(e) => setBranchId(e.target.value === 'ALL' ? null : e.target.value)}
                  className='w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground'
                >
                  <option value='ALL'>{t('كل الفروع (عام)', 'All Branches (Global)')}</option>
                  {formBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <DialogFooter className='gap-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => {
                  setIsCreateOpen(false)
                  setEditingCategory(null)
                }}
              >
                {t('إلغاء', 'Cancel')}
              </Button>
              <Button
                type='submit'
                size='sm'
                className='bg-primary text-primary-foreground hover:bg-primary/90 font-bold cursor-pointer'
              >
                {editingCategory ? t('حفظ التعديلات', 'Save Changes') : t('إنشاء القسم', 'Create Category')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <DialogContent className='max-w-sm rounded-2xl' dir={dir}>
          <DialogHeader className='text-start'>
            <DialogTitle className='text-destructive flex items-center gap-2 text-base'>
              <AlertTriangle className='size-4' />
              <span>{t('حذف القسم؟', 'Delete Category?')}</span>
            </DialogTitle>
            <DialogDescription className='text-xs'>
              {t('هل أنت متأكد من حذف القسم', 'Are you sure you want to delete')}{' '}
              <span className='font-bold text-foreground'>"{deletingCategory?.name}"</span>?
              {productsAffected > 0 && (
                <span className='block mt-1.5 text-amber-600 dark:text-amber-400 font-medium'>
                  {t(
                    `سيتم الاحتفاظ بعدد ${productsAffected} منتج وتصنيفهم كـ "بدون قسم".`,
                    `${productsAffected} products will be kept safely as Uncategorized.`
                  )}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2'>
            <Button variant='outline' size='sm' onClick={() => setDeletingCategory(null)}>
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
