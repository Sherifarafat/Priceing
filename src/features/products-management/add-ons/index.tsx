import * as React from 'react'
import {
  Plus,
  Search as SearchIcon,
  Edit2,
  Trash2,
  PackagePlus,
  Sparkles,
  CheckCircle2,
  XCircle,
  DollarSign,
  Tag,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSaaSStore } from '@/lib/saas-store'
import { ProductAddon, EntityStatus } from '@/types/saas'
import { toast } from 'sonner'

export function ProductAddonsView() {
  const {
    productAddons,
    createProductAddon,
    updateProductAddon,
    deleteProductAddon,
  } = useSaaSStore()

  const [search, setSearch] = React.useState('')
  const [categoryFilter, setCategoryFilter] = React.useState<string>('ALL')
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | EntityStatus>('ALL')

  // Modals state
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingAddon, setEditingAddon] = React.useState<ProductAddon | null>(null)
  const [name, setName] = React.useState('')
  const [category, setCategory] = React.useState('Packaging')
  const [price, setPrice] = React.useState<number>(15)
  const [description, setDescription] = React.useState('')
  const [isRequired, setIsRequired] = React.useState(false)
  const [status, setStatus] = React.useState<EntityStatus>('Active')

  // Delete modal
  const [deletingAddon, setDeletingAddon] = React.useState<ProductAddon | null>(null)

  const openCreateDialog = () => {
    setEditingAddon(null)
    setName('')
    setCategory('Packaging')
    setPrice(15)
    setDescription('')
    setIsRequired(false)
    setStatus('Active')
    setIsDialogOpen(true)
  }

  const openEditDialog = (addon: ProductAddon) => {
    setEditingAddon(addon)
    setName(addon.name)
    setCategory(addon.category || 'General')
    setPrice(addon.price)
    setDescription(addon.description || '')
    setIsRequired(!!addon.isRequired)
    setStatus(addon.status)
    setIsDialogOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Add-on name is required')
      return
    }

    if (editingAddon) {
      updateProductAddon(editingAddon.id, {
        name: name.trim(),
        category: category.trim(),
        price,
        description: description.trim(),
        isRequired,
        status,
      })
      toast.success(`Add-on "${name}" updated successfully`)
    } else {
      createProductAddon({
        name: name.trim(),
        category: category.trim(),
        price,
        description: description.trim(),
        isRequired,
        status,
      })
      toast.success(`Add-on "${name}" created successfully`)
    }

    setIsDialogOpen(false)
  }

  const handleDelete = () => {
    if (!deletingAddon) return
    deleteProductAddon(deletingAddon.id)
    toast.success(`Add-on "${deletingAddon.name}" deleted`)
    setDeletingAddon(null)
  }

  // Categories list
  const existingCategories = Array.from(
    new Set((productAddons || []).map((a) => a.category).filter(Boolean))
  )

  const filteredAddons = (productAddons || []).filter((addon) => {
    const matchesSearch =
      addon.name.toLowerCase().includes(search.toLowerCase()) ||
      (addon.description && addon.description.toLowerCase().includes(search.toLowerCase())) ||
      (addon.category && addon.category.toLowerCase().includes(search.toLowerCase()))
    const matchesCategory = categoryFilter === 'ALL' || addon.category === categoryFilter
    const matchesStatus = statusFilter === 'ALL' || addon.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
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
        {/* Title Bar */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <div className='flex items-center gap-2'>
              <h1 className='text-2xl font-bold tracking-tight text-foreground'>
                Product Add-ons & Extras
              </h1>
              <Badge variant='outline' className='text-xs font-mono font-bold bg-muted/50'>
                {filteredAddons.length} Add-ons
              </Badge>
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Manage optional and required product attachments, gift boxing, warranties, and special handling.
            </p>
          </div>

          <Button
            onClick={openCreateDialog}
            className='gap-2 bg-primary text-primary-foreground font-semibold shadow-xs hover:bg-primary/90 h-9 px-4 rounded-lg'
          >
            <Plus className='size-4' />
            Add New Add-on
          </Button>
        </div>

        {/* Filters */}
        <div className='flex flex-col sm:flex-row items-center gap-3'>
          <div className='relative w-full sm:w-80'>
            <SearchIcon className='size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2' />
            <Input
              placeholder='Search add-ons by name or tag...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='ps-9 text-xs h-9 rounded-lg bg-card border-border/80'
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className='h-9 rounded-lg border border-border/80 bg-card px-3 text-xs text-foreground'
          >
            <option value='ALL'>All Add-on Categories</option>
            {existingCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status Pills */}
          <div className='flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto'>
            {(['ALL', 'Active', 'Inactive'] as const).map((st) => (
              <Button
                key={st}
                size='sm'
                variant={statusFilter === st ? 'default' : 'outline'}
                onClick={() => setStatusFilter(st)}
                className='h-8 text-xs rounded-lg'
              >
                {st === 'ALL' ? 'All Status' : st}
              </Button>
            ))}
          </div>
        </div>

        {/* Table View (Clean White Card) */}
        <Card className='border-border/80 shadow-xs overflow-hidden bg-white dark:bg-card rounded-xl'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow className='border-b border-border/70 bg-slate-50/80 dark:bg-muted/40 hover:bg-slate-50/80 dark:hover:bg-muted/40'>
                  <TableHead className='ps-5 py-3.5 text-xs font-semibold text-foreground'>
                    Add-on Name
                  </TableHead>
                  <TableHead className='py-3.5 text-xs font-semibold text-foreground'>
                    Add-on Category
                  </TableHead>
                  <TableHead className='py-3.5 text-xs font-semibold text-foreground text-center'>
                    Price (E£)
                  </TableHead>
                  <TableHead className='py-3.5 text-xs font-semibold text-foreground'>
                    Description
                  </TableHead>
                  <TableHead className='py-3.5 text-xs font-semibold text-foreground text-center'>
                    Selection Type
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
                {filteredAddons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className='h-40 text-center text-muted-foreground text-xs'>
                      <PackagePlus className='size-8 mx-auto mb-2 opacity-25' />
                      <p className='font-semibold'>No product add-ons found</p>
                      <p className='text-[11px] mt-0.5'>Click "Add New Add-on" above to add one.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAddons.map((addon) => (
                    <TableRow
                      key={addon.id}
                      className='bg-white dark:bg-card hover:bg-slate-50/70 dark:hover:bg-neutral-800/40 border-b border-border/40 transition-colors'
                    >
                      <TableCell className='ps-5 py-3.5 font-semibold text-xs text-foreground'>
                        <div className='flex items-center gap-2.5'>
                          <div className='size-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 flex items-center justify-center font-bold shrink-0 border border-indigo-100 dark:border-indigo-900/40'>
                            <PackagePlus className='size-4' />
                          </div>
                          <div>
                            <div className='font-bold text-foreground'>{addon.name}</div>
                            <div className='text-[10px] text-muted-foreground font-mono'>
                              {addon.id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className='py-3.5 text-xs'>
                        <Badge variant='outline' className='bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 font-medium inline-flex items-center gap-1'>
                          <Tag className='size-3 text-[#4F46E5] dark:text-indigo-400' />
                          {addon.category || 'General'}
                        </Badge>
                      </TableCell>
                      <TableCell className='py-3.5 text-center'>
                        <span className='font-mono font-bold text-xs text-foreground inline-flex items-center gap-0.5'>
                          +{addon.price.toLocaleString()} E£
                        </span>
                      </TableCell>
                      <TableCell className='py-3.5 text-xs text-muted-foreground max-w-xs truncate'>
                        {addon.description || '—'}
                      </TableCell>
                      <TableCell className='py-3.5 text-center'>
                        <Badge
                          variant='secondary'
                          className={
                            addon.isRequired
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/50 text-[11px]'
                              : 'bg-muted/70 text-muted-foreground text-[11px]'
                          }
                        >
                          {addon.isRequired ? 'Mandatory' : 'Optional'}
                        </Badge>
                      </TableCell>
                      <TableCell className='py-3.5 text-center'>
                        <Badge
                          variant='outline'
                          className={
                            addon.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200/50'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200/50'
                          }
                        >
                          {addon.status === 'Active' ? (
                            <CheckCircle2 className='size-3 mr-1 inline' />
                          ) : (
                            <XCircle className='size-3 mr-1 inline' />
                          )}
                          {addon.status}
                        </Badge>
                      </TableCell>
                      <TableCell className='pe-5 py-3.5 text-end'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                              <Edit2 className='size-3.5 text-muted-foreground' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end' className='text-xs'>
                            <DropdownMenuItem
                              onClick={() => openEditDialog(addon)}
                              className='cursor-pointer gap-2'
                            >
                              <Edit2 className='size-3.5 text-primary' />
                              Edit Add-on
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeletingAddon(addon)}
                              className='cursor-pointer gap-2 text-destructive focus:text-destructive'
                            >
                              <Trash2 className='size-3.5' />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Add/Edit Modal */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className='sm:max-w-md'>
            <form onSubmit={handleSave}>
              <DialogHeader>
                <DialogTitle className='flex items-center gap-2'>
                  <Sparkles className='size-4 text-primary' />
                  {editingAddon ? 'Edit Add-on' : 'Create New Add-on'}
                </DialogTitle>
                <DialogDescription className='text-xs'>
                  Add-ons can be selected by shoppers when purchasing items in store or online.
                </DialogDescription>
              </DialogHeader>

              <div className='space-y-4 my-4 text-xs'>
                <div>
                  <label className='font-semibold block mb-1.5 text-foreground'>
                    Add-on Name *
                  </label>
                  <Input
                    required
                    placeholder='e.g. Luxury Gift Box'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className='text-xs'
                  />
                </div>

                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label className='font-semibold block mb-1.5 text-foreground'>
                      Category Tag
                    </label>
                    <Input
                      placeholder='e.g. Packaging, Warranty'
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className='text-xs'
                    />
                  </div>
                  <div>
                    <label className='font-semibold block mb-1.5 text-foreground'>
                      Price (E£)
                    </label>
                    <Input
                      type='number'
                      min='0'
                      step='0.5'
                      value={price}
                      onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                      className='text-xs font-mono'
                    />
                  </div>
                </div>

                <div>
                  <label className='font-semibold block mb-1.5 text-foreground'>
                    Description
                  </label>
                  <Input
                    placeholder='Details about what this add-on includes...'
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className='text-xs'
                  />
                </div>

                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label className='font-semibold block mb-1.5 text-foreground'>
                      Requirement
                    </label>
                    <select
                      value={isRequired ? 'true' : 'false'}
                      onChange={(e) => setIsRequired(e.target.value === 'true')}
                      className='w-full rounded-md border bg-background px-3 py-2 text-xs text-foreground'
                    >
                      <option value='false'>Optional choice</option>
                      <option value='true'>Mandatory add-on</option>
                    </select>
                  </div>

                  <div>
                    <label className='font-semibold block mb-1.5 text-foreground'>
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as EntityStatus)}
                      className='w-full rounded-md border bg-background px-3 py-2 text-xs text-foreground'
                    >
                      <option value='Active'>Active</option>
                      <option value='Inactive'>Inactive</option>
                    </select>
                  </div>
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
                <Button type='submit' size='sm' className='gap-1.5'>
                  {editingAddon ? 'Save Changes' : 'Create Add-on'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog
          open={!!deletingAddon}
          onOpenChange={(open) => !open && setDeletingAddon(null)}
        >
          <DialogContent className='sm:max-w-sm'>
            <DialogHeader>
              <DialogTitle className='text-destructive flex items-center gap-2'>
                <Trash2 className='size-4' />
                Delete Add-on?
              </DialogTitle>
              <DialogDescription className='text-xs'>
                Are you sure you want to delete{' '}
                <span className='font-bold text-foreground'>
                  "{deletingAddon?.name}"
                </span>
                ?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className='gap-2 sm:gap-0'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setDeletingAddon(null)}
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
