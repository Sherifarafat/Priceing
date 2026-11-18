import * as React from 'react'
import { Plus, Edit2, Trash2, Tags, Package, AlertTriangle, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { useSaaSStore } from '@/lib/saas-store'
import { Category } from '@/types/saas'

export function CategoriesView() {
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

  const merchantId = currentUser.merchantId || merchants[0]?.id || ''
  const merchant = merchants.find((m) => m.id === merchantId)
  const merchantBranches = branches.filter((b) => b.merchantId === merchantId)

  // Scoped to current merchant
  const merchantCategories = categories.filter((c) => c.merchantId === merchantId)
  const merchantProducts = products.filter((p) => p.merchantId === merchantId)

  // Dialogs
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = React.useState<Category | null>(null)
  const [catName, setCatName] = React.useState('')
  const [branchId, setBranchId] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const canManage = hasPermission('categories.manage')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!catName.trim()) {
      setError('Category Name is required.')
      return
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, catName.trim(), branchId)
      setEditingCategory(null)
    } else {
      createCategory(catName.trim(), branchId)
      setIsCreateOpen(false)
    }
    setCatName('')
    setBranchId(null)
  }

  // Section 8.2: Category Deletion rule
  const handleDeleteConfirm = () => {
    if (deletingCategory) {
      deleteCategory(deletingCategory.id)
      setDeletingCategory(null)
    }
  }

  // Count products in deleting category
  const productsAffected = deletingCategory
    ? merchantProducts.filter((p) => p.categoryId === deletingCategory.id).length
    : 0

  return (
    <>
      <Header>
        <div className='flex items-center gap-2'>
          <h1 className='font-semibold text-sm'>Categories Management</h1>
          <Badge variant='outline' className='text-xs'>
            {merchant?.name}
          </Badge>
        </div>
        <div className='ms-auto flex items-center gap-2'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-5 p-4 md:p-6'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Product Categories</h2>
            <p className='text-xs text-muted-foreground'>
              Organize your store items into logical sections. Deleting a category keeps all products safe as Uncategorized.
            </p>
          </div>
          {canManage && (
            <Button
              size='sm'
              onClick={() => {
                setCatName('')
                setError(null)
                setIsCreateOpen(true)
              }}
            >
              <Plus className='mr-1.5 size-4' />
              New Category
            </Button>
          )}
        </div>

        {/* Categories Grid */}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {merchantCategories.map((cat) => {
            const count = merchantProducts.filter((p) => p.categoryId === cat.id).length
            const assignedBranch = merchantBranches.find((b) => b.id === cat.branchId)
            return (
              <Card key={cat.id} className='hover:border-primary/50 transition-colors'>
                <CardContent className='p-4 flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='flex size-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40'>
                      <Tags className='size-5' />
                    </div>
                    <div>
                      <div className='flex items-center gap-2'>
                        <h4 className='font-bold text-sm text-foreground'>{cat.name}</h4>
                        {assignedBranch ? (
                          <Badge variant='outline' className='text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 border-indigo-200/50 py-0 px-1.5'>
                            {assignedBranch.name}
                          </Badge>
                        ) : (
                          <Badge variant='outline' className='text-[10px] bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-200/40 py-0 px-1.5'>
                            All Branches
                          </Badge>
                        )}
                      </div>
                      <div className='flex items-center gap-1 text-xs text-muted-foreground mt-0.5'>
                        <Package className='size-3' /> {count} products
                      </div>
                    </div>
                  </div>

                  {canManage && (
                    <div className='flex items-center gap-1'>
                      <Button
                        size='icon'
                        variant='ghost'
                        className='size-8'
                        onClick={() => {
                          setEditingCategory(cat)
                          setCatName(cat.name)
                          setBranchId(cat.branchId || null)
                          setError(null)
                        }}
                      >
                        <Edit2 className='size-3.5' />
                      </Button>
                      <Button
                        size='icon'
                        variant='ghost'
                        className='size-8 text-destructive hover:text-destructive'
                        onClick={() => setDeletingCategory(cat)}
                      >
                        <Trash2 className='size-3.5' />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Uncategorized products summary card */}
        {merchantProducts.filter((p) => !p.categoryId).length > 0 && (
          <div className='rounded-lg border border-dashed p-4 bg-muted/30 flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <Package className='size-5 text-muted-foreground' />
              <div>
                <p className='text-xs font-semibold'>Uncategorized Products</p>
                <p className='text-[11px] text-muted-foreground'>
                  {merchantProducts.filter((p) => !p.categoryId).length} products have no category assigned.
                </p>
              </div>
            </div>
            <Badge variant='outline' className='text-xs'>
              {merchantProducts.filter((p) => !p.categoryId).length} items
            </Badge>
          </div>
        )}
      </Main>

      {/* Create / Edit Dialog */}
      <Dialog
        open={isCreateOpen || !!editingCategory}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false)
            setEditingCategory(null)
          }
        }}
      >
        <DialogContent className='max-w-sm'>
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'Create Category'}</DialogTitle>
              <DialogDescription className='text-xs'>
                Enter the category name for your product classification.
              </DialogDescription>
            </DialogHeader>

            {error && <p className='text-xs text-destructive mt-2'>{error}</p>}

            <div className='my-4 space-y-3.5'>
              <div>
                <label className='font-semibold text-xs block mb-1'>Category Name *</label>
                <Input
                  required
                  placeholder='e.g. Beverages, Bakery, Snacks...'
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className='text-xs'
                />
              </div>

              <div>
                <label className='font-semibold text-xs block mb-1'>Assign to Branch</label>
                <select
                  value={branchId || 'ALL'}
                  onChange={(e) => setBranchId(e.target.value === 'ALL' ? null : e.target.value)}
                  className='w-full rounded-md border border-border/80 bg-background px-3 py-2 text-xs text-foreground'
                >
                  <option value='ALL'>All Branches (Global)</option>
                  {merchantBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <p className='text-[10px] text-muted-foreground mt-1'>
                  Optionally bind this category to a specific store branch.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => {
                  setIsCreateOpen(false)
                  setEditingCategory(null)
                }}
              >
                Cancel
              </Button>
              <Button type='submit' size='sm'>
                {editingCategory ? 'Save' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog (Section 8.2 Safe Deletion) */}
      <Dialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-destructive'>
              <AlertTriangle className='size-5' /> Delete Category?
            </DialogTitle>
            <DialogDescription className='text-xs'>
              Are you sure you want to delete category <strong>{deletingCategory?.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className='rounded-md bg-muted p-3 text-xs space-y-1 text-muted-foreground my-2'>
            <p className='font-bold text-foreground'>
              Section 8.2 Compliance Rule:
            </p>
            <p>
              Deleting this category will <strong>NOT</strong> delete any products. The{' '}
              <strong>{productsAffected}</strong> product(s) in this category will be marked as{' '}
              <strong>Uncategorized</strong>.
            </p>
          </div>

          <DialogFooter>
            <Button variant='outline' size='sm' onClick={() => setDeletingCategory(null)}>
              Cancel
            </Button>
            <Button variant='destructive' size='sm' onClick={handleDeleteConfirm}>
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
