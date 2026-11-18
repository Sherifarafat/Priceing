import * as React from 'react'
import {
  Plus,
  Search as SearchIcon,
  Edit2,
  Trash2,
  Tags,
  Layers,
  Sparkles,
  CheckCircle2,
  XCircle,
  FolderTree,
  Store,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { LanguageSwitch } from '@/components/language-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
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
import { useSaaSStore } from '@/lib/saas-store'
import { ServiceCategory, EntityStatus } from '@/types/saas'
import { toast } from 'sonner'

export function ServiceCategoriesView() {
  const {
    serviceCategories,
    serviceItems,
    branches,
    merchants,
    createServiceCategory,
    updateServiceCategory,
    deleteServiceCategory,
  } = useSaaSStore()

  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | EntityStatus>('ALL')
  const [branchFilter, setBranchFilter] = React.useState<string>('ALL')

  // Modals state
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<ServiceCategory | null>(null)
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [branchId, setBranchId] = React.useState<string | null>(null)
  const [status, setStatus] = React.useState<EntityStatus>('Active')

  // Delete confirm modal
  const [deletingCategory, setDeletingCategory] = React.useState<ServiceCategory | null>(null)

  const openCreateDialog = () => {
    setEditingCategory(null)
    setName('')
    setDescription('')
    setBranchId(null)
    setStatus('Active')
    setIsDialogOpen(true)
  }

  const openEditDialog = (cat: ServiceCategory) => {
    setEditingCategory(cat)
    setName(cat.name)
    setDescription(cat.description || '')
    setBranchId(cat.branchId || null)
    setStatus(cat.status)
    setIsDialogOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Category name is required')
      return
    }

    if (editingCategory) {
      updateServiceCategory(editingCategory.id, name.trim(), description.trim(), status, branchId)
      toast.success(`Category "${name}" updated successfully`)
    } else {
      createServiceCategory(name.trim(), description.trim(), branchId)
      toast.success(`Category "${name}" created successfully`)
    }

    setIsDialogOpen(false)
  }

  const handleDelete = () => {
    if (!deletingCategory) return
    deleteServiceCategory(deletingCategory.id)
    toast.success(`Category "${deletingCategory.name}" and its services deleted`)
    setDeletingCategory(null)
  }

  const filteredCategories = (serviceCategories || []).filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter
    const matchesBranch =
      branchFilter === 'ALL'
        ? true
        : branchFilter === 'GLOBAL'
          ? !c.branchId
          : c.branchId === branchFilter
    return matchesSearch && matchesStatus && matchesBranch
  })

  return (
    <>
      <Header fixed>
        <div className='ms-auto flex items-center gap-2'>
          <LanguageSwitch />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-5 p-4 sm:p-6'>
        {/* Title & Action Bar */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <div className='flex items-center gap-2'>
              <h1 className='text-2xl font-bold tracking-tight text-foreground'>
                Service Categories
              </h1>
              <Badge variant='outline' className='text-xs font-mono font-bold bg-muted/50'>
                {filteredCategories.length} Categories
              </Badge>
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Organize and classify all platform services, technical installations, and branch assignments.
            </p>
          </div>

          <Button
            onClick={openCreateDialog}
            className='gap-2 bg-[#4F46E5] hover:bg-indigo-700 text-white font-semibold shadow-xs h-9 px-4 rounded-lg'
          >
            <Plus className='size-4' />
            Add Category
          </Button>
        </div>

        {/* Filter and Search Bar */}
        <div className='flex flex-col sm:flex-row items-center gap-3'>
          <div className='relative w-full sm:w-80'>
            <SearchIcon className='size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2' />
            <Input
              placeholder='Filter by category name, keywords...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='ps-9 text-xs h-9 rounded-lg bg-card border-border/80'
            />
          </div>

          <div className='flex items-center gap-2 w-full sm:w-auto ms-auto flex-wrap'>
            {/* Filter by Branch */}
            <div className='flex items-center gap-1.5 text-xs'>
              <span className='font-medium text-muted-foreground whitespace-nowrap'>Branch:</span>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className='h-9 rounded-lg border border-border/80 bg-card px-3 text-xs text-foreground'
              >
                <option value='ALL'>All Branches</option>
                <option value='GLOBAL'>Global Only (All)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className='h-9 rounded-lg border border-border/80 bg-card px-3 text-xs text-foreground'
            >
              <option value='ALL'>All Statuses</option>
              <option value='Active'>Active Only</option>
              <option value='Inactive'>Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Categories Table */}
        <Card className='border-border/80 shadow-xs overflow-hidden bg-white dark:bg-card rounded-xl'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow className='border-b border-border/70 bg-slate-50/80 dark:bg-muted/40 hover:bg-slate-50/80 dark:hover:bg-muted/40'>
                  <TableHead className='ps-5 py-3.5 text-xs font-semibold text-foreground'>
                    Category Name
                  </TableHead>
                  <TableHead className='py-3.5 text-xs font-semibold text-foreground'>
                    Assigned Branch
                  </TableHead>
                  <TableHead className='py-3.5 text-xs font-semibold text-foreground'>
                    Description
                  </TableHead>
                  <TableHead className='py-3.5 text-xs font-semibold text-foreground text-center'>
                    Linked Services
                  </TableHead>
                  <TableHead className='py-3.5 text-xs font-semibold text-foreground text-center'>
                    Status
                  </TableHead>
                  <TableHead className='pe-5 py-3.5 text-xs font-semibold text-foreground text-end'>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className='h-40 text-center text-muted-foreground text-xs'>
                      <FolderTree className='size-8 mx-auto mb-2 opacity-25' />
                      <p className='font-semibold'>No service categories found</p>
                      <p className='text-[11px] mt-0.5'>Click "Add Category" above to create one.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((cat) => {
                    const linkedCount = (serviceItems || []).filter(
                      (s) => s.categoryId === cat.id
                    ).length
                    const assignedBranch = branches.find((b) => b.id === cat.branchId)

                    return (
                      <TableRow
                        key={cat.id}
                        className='bg-white dark:bg-card hover:bg-slate-50/70 dark:hover:bg-neutral-800/40 border-b border-border/40 transition-colors'
                      >
                        <TableCell className='ps-5 py-3.5 font-semibold text-xs text-foreground'>
                          <div className='flex items-center gap-2.5'>
                            <div className='size-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 flex items-center justify-center font-bold shrink-0 border border-indigo-100 dark:border-indigo-900/40'>
                              <Tags className='size-4' />
                            </div>
                            <div>
                              <div className='font-bold text-foreground'>{cat.name}</div>
                              <div className='text-[10px] text-muted-foreground font-mono'>
                                {cat.id}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Assigned Branch Column */}
                        <TableCell className='py-3.5 text-xs'>
                          {assignedBranch ? (
                            <Badge
                              variant='outline'
                              className='bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 border-indigo-200/50 inline-flex items-center gap-1 font-medium text-xs'
                            >
                              <Store className='size-3' />
                              {assignedBranch.name}
                            </Badge>
                          ) : (
                            <Badge variant='outline' className='bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-900/30 font-medium text-xs'>
                              All Branches (Global)
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className='py-3.5 text-xs text-muted-foreground max-w-xs truncate'>
                          {cat.description || '—'}
                        </TableCell>
                        <TableCell className='py-3.5 text-center'>
                          <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-indigo-50/70 dark:bg-indigo-950/40 text-[#4F46E5] dark:text-indigo-300 border border-indigo-100/60 dark:border-indigo-900/30'>
                            <Layers className='size-3 text-[#4F46E5] dark:text-indigo-400' />
                            {linkedCount}
                          </span>
                        </TableCell>
                        <TableCell className='py-3.5 text-center'>
                          <Badge
                            variant='outline'
                            className={
                              cat.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200/50'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200/50'
                            }
                          >
                            {cat.status === 'Active' ? (
                              <CheckCircle2 className='size-3 mr-1 inline' />
                            ) : (
                              <XCircle className='size-3 mr-1 inline' />
                            )}
                            {cat.status}
                          </Badge>
                        </TableCell>
                        <TableCell className='pe-5 py-3.5 text-end'>
                          <div className='flex items-center justify-end gap-1'>
                            <Button
                              variant='ghost'
                              size='icon'
                              title='Edit Category'
                              onClick={() => openEditDialog(cat)}
                              className='size-7 rounded-lg text-muted-foreground hover:text-foreground'
                            >
                              <Edit2 className='size-3.5' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              title='Delete Category'
                              onClick={() => setDeletingCategory(cat)}
                              className='size-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10'
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
          </div>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className='sm:max-w-md'>
            <form onSubmit={handleSave}>
              <DialogHeader>
                <DialogTitle className='flex items-center gap-2'>
                  <Sparkles className='size-4 text-[#4F46E5]' />
                  {editingCategory ? 'Edit Service Category' : 'Create Service Category'}
                </DialogTitle>
                <DialogDescription className='text-xs'>
                  Define category grouping and assign it to a specific branch or make it globally available.
                </DialogDescription>
              </DialogHeader>

              <div className='space-y-4 my-4 text-xs'>
                <div>
                  <label className='font-semibold block mb-1.5 text-foreground'>
                    Category Name *
                  </label>
                  <Input
                    required
                    placeholder='e.g. Installation & Maintenance'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className='text-xs h-9 rounded-lg'
                  />
                </div>

                {/* Branch Assignment Field */}
                <div>
                  <label className='font-semibold block mb-1.5 text-foreground'>
                    Assign to Branch
                  </label>
                  <select
                    value={branchId || 'ALL'}
                    onChange={(e) => setBranchId(e.target.value === 'ALL' ? null : e.target.value)}
                    className='w-full rounded-lg border border-border/80 bg-background px-3 py-2 text-xs text-foreground'
                  >
                    <option value='ALL'>All Branches (Global Availability)</option>
                    {branches.map((b) => {
                      const merch = merchants.find((m) => m.id === b.merchantId)
                      return (
                        <option key={b.id} value={b.id}>
                          {b.name} ({merch?.name || 'Branch'})
                        </option>
                      )
                    })}
                  </select>
                  <p className='text-[10px] text-muted-foreground mt-1'>
                    Select a specific branch or leave as All Branches for universal catalog access.
                  </p>
                </div>

                <div>
                  <label className='font-semibold block mb-1.5 text-foreground'>
                    Description
                  </label>
                  <Input
                    placeholder='Brief summary of services grouped under this category...'
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className='text-xs h-9 rounded-lg'
                  />
                </div>

                <div>
                  <label className='font-semibold block mb-1.5 text-foreground'>
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as EntityStatus)}
                    className='w-full rounded-lg border border-border/80 bg-background px-3 py-2 text-xs text-foreground'
                  >
                    <option value='Active'>Active</option>
                    <option value='Inactive'>Inactive</option>
                  </select>
                </div>
              </div>

              <DialogFooter className='gap-2 sm:gap-0'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type='submit' size='sm' className='gap-1.5 bg-[#4F46E5] hover:bg-indigo-700 text-white'>
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog
          open={!!deletingCategory}
          onOpenChange={(open) => !open && setDeletingCategory(null)}
        >
          <DialogContent className='sm:max-w-sm'>
            <DialogHeader>
              <DialogTitle className='text-destructive flex items-center gap-2'>
                <Trash2 className='size-4' />
                Delete Service Category?
              </DialogTitle>
              <DialogDescription className='text-xs'>
                Are you sure you want to delete{' '}
                <span className='font-bold text-foreground'>
                  "{deletingCategory?.name}"
                </span>
                ? Any linked services will also be removed.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className='gap-2 sm:gap-0'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setDeletingCategory(null)}
              >
                Cancel
              </Button>
              <Button
                variant='destructive'
                size='sm'
                onClick={handleDelete}
              >
                Confirm Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Main>
    </>
  )
}
