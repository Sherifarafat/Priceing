import * as React from 'react'
import {
  Plus,
  Search as SearchIcon,
  Edit2,
  Trash2,
  Briefcase,
  Layers,
  Sparkles,
  CheckCircle2,
  XCircle,
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
import { ServiceItem, EntityStatus } from '@/types/saas'
import { toast } from 'sonner'

export function ServicesView() {
  const {
    serviceCategories,
    serviceItems,
    subServices,
    createServiceItem,
    updateServiceItem,
    deleteServiceItem,
  } = useSaaSStore()

  const [search, setSearch] = React.useState('')
  const [categoryFilter, setCategoryFilter] = React.useState<string>('ALL')
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | EntityStatus>('ALL')

  // Modals state
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingService, setEditingService] = React.useState<ServiceItem | null>(null)
  const [name, setName] = React.useState('')
  const [categoryId, setCategoryId] = React.useState('')
  const [basePrice, setBasePrice] = React.useState<number>(100)
  const [durationMinutes, setDurationMinutes] = React.useState<number>(60)
  const [description, setDescription] = React.useState('')
  const [status, setStatus] = React.useState<EntityStatus>('Active')

  // Delete modal
  const [deletingService, setDeletingService] = React.useState<ServiceItem | null>(null)

  const openCreateDialog = () => {
    setEditingService(null)
    setName('')
    setCategoryId(serviceCategories[0]?.id || '')
    setBasePrice(100)
    setDurationMinutes(60)
    setDescription('')
    setStatus('Active')
    setIsDialogOpen(true)
  }

  const openEditDialog = (srv: ServiceItem) => {
    setEditingService(srv)
    setName(srv.name)
    setCategoryId(srv.categoryId)
    setBasePrice(srv.basePrice)
    setDurationMinutes(srv.durationMinutes || 60)
    setDescription(srv.description || '')
    setStatus(srv.status)
    setIsDialogOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Service name is required')
      return
    }
    if (!categoryId) {
      toast.error('Please select a category')
      return
    }

    if (editingService) {
      updateServiceItem(editingService.id, {
        name: name.trim(),
        categoryId,
        basePrice,
        durationMinutes,
        description: description.trim(),
        status,
      })
      toast.success(`Service "${name}" updated successfully`)
    } else {
      createServiceItem({
        name: name.trim(),
        categoryId,
        basePrice,
        durationMinutes,
        description: description.trim(),
        status,
      })
      toast.success(`Service "${name}" created successfully`)
    }

    setIsDialogOpen(false)
  }

  const handleDelete = () => {
    if (!deletingService) return
    deleteServiceItem(deletingService.id)
    toast.success(`Service "${deletingService.name}" deleted`)
    setDeletingService(null)
  }

  const filteredServices = (serviceItems || []).filter((srv) => {
    const matchesSearch =
      srv.name.toLowerCase().includes(search.toLowerCase()) ||
      (srv.description && srv.description.toLowerCase().includes(search.toLowerCase()))
    const matchesCategory = categoryFilter === 'ALL' || srv.categoryId === categoryFilter
    const matchesStatus = statusFilter === 'ALL' || srv.status === statusFilter
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
                Services Catalog
              </h1>
              <Badge variant='outline' className='text-xs font-mono font-bold bg-muted/50'>
                {filteredServices.length} Services
              </Badge>
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Manage technical, operational, and consulting services available to stores and merchants.
            </p>
          </div>

          <Button
            onClick={openCreateDialog}
            className='gap-2 bg-primary text-primary-foreground font-semibold shadow-xs hover:bg-primary/90 h-9 px-4 rounded-lg'
          >
            <Plus className='size-4' />
            Add Service
          </Button>
        </div>

        {/* Filters */}
        <div className='flex flex-col sm:flex-row items-center gap-3'>
          <div className='relative w-full sm:w-80'>
            <SearchIcon className='size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2' />
            <Input
              placeholder='Search services...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='ps-9 text-xs h-9 rounded-lg bg-card border-border/80'
            />
          </div>

          {/* Category Dropdown Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className='h-9 rounded-lg border border-border/80 bg-card px-3 text-xs text-foreground'
          >
            <option value='ALL'>All Categories</option>
            {(serviceCategories || []).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
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

        {/* Table View (Crisp White Card) */}
        <Card className='border-border/80 shadow-xs overflow-hidden bg-white dark:bg-card rounded-xl'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow className='border-b border-border/70 bg-slate-50/80 dark:bg-muted/40 hover:bg-slate-50/80 dark:hover:bg-muted/40'>
                  <TableHead className='ps-5 py-3.5 text-xs font-semibold text-foreground'>
                    Service Name
                  </TableHead>
                  <TableHead className='py-3.5 text-xs font-semibold text-foreground'>
                    Category
                  </TableHead>
                  <TableHead className='py-3.5 text-xs font-semibold text-foreground text-center'>
                    Sub-Services
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
                {filteredServices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className='h-40 text-center text-muted-foreground text-xs'>
                      <Briefcase className='size-8 mx-auto mb-2 opacity-25' />
                      <p className='font-semibold'>No services found</p>
                      <p className='text-[11px] mt-0.5'>Click "Add Service" above to add one.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServices.map((srv) => {
                    const cat = (serviceCategories || []).find((c) => c.id === srv.categoryId)
                    const subCount = (subServices || []).filter((sub) => sub.serviceId === srv.id).length

                    return (
                      <TableRow
                        key={srv.id}
                        className='bg-white dark:bg-card hover:bg-slate-50/70 dark:hover:bg-neutral-800/40 border-b border-border/40 transition-colors'
                      >
                        <TableCell className='ps-5 py-3.5 font-semibold text-xs text-foreground'>
                          <div className='flex items-center gap-2.5'>
                            <div className='size-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 flex items-center justify-center font-bold shrink-0 border border-indigo-100 dark:border-indigo-900/40'>
                              <Briefcase className='size-4' />
                            </div>
                            <div>
                              <div className='font-bold text-foreground'>{srv.name}</div>
                              <div className='text-[10px] text-muted-foreground max-w-xs truncate'>
                                {srv.description || srv.id}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className='py-3.5 text-xs'>
                          <Badge variant='outline' className='bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 font-medium'>
                            {cat?.name || 'Uncategorized'}
                          </Badge>
                        </TableCell>
                        <TableCell className='py-3.5 text-center'>
                          <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-indigo-50/70 dark:bg-indigo-950/40 text-[#4F46E5] dark:text-indigo-300 border border-indigo-100/60 dark:border-indigo-900/30'>
                            <Layers className='size-3 text-[#4F46E5] dark:text-indigo-400' />
                            {subCount}
                          </span>
                        </TableCell>
                        <TableCell className='py-3.5 text-center'>
                          <Badge
                            variant='outline'
                            className={
                              srv.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200/50'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200/50'
                            }
                          >
                            {srv.status === 'Active' ? (
                              <CheckCircle2 className='size-3 mr-1 inline' />
                            ) : (
                              <XCircle className='size-3 mr-1 inline' />
                            )}
                            {srv.status}
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
                                onClick={() => openEditDialog(srv)}
                                className='cursor-pointer gap-2'
                              >
                                <Edit2 className='size-3.5 text-primary' />
                                Edit Service
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeletingService(srv)}
                                className='cursor-pointer gap-2 text-destructive focus:text-destructive'
                              >
                                <Trash2 className='size-3.5' />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
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
                  {editingService ? 'Edit Service' : 'Create New Service'}
                </DialogTitle>
                <DialogDescription className='text-xs'>
                  Configure service properties, base pricing, and execution details.
                </DialogDescription>
              </DialogHeader>

              <div className='space-y-4 my-4 text-xs'>
                <div>
                  <label className='font-semibold block mb-1.5 text-foreground'>
                    Service Name *
                  </label>
                  <Input
                    required
                    placeholder='e.g. Smart Shelf Sensor Setup'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className='text-xs'
                  />
                </div>

                <div>
                  <label className='font-semibold block mb-1.5 text-foreground'>
                    Parent Category *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className='w-full rounded-md border bg-background px-3 py-2 text-xs text-foreground'
                  >
                    {(serviceCategories || []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='font-semibold block mb-1.5 text-foreground'>
                    Description
                  </label>
                  <Input
                    placeholder='Scope of work and deliverables...'
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className='text-xs'
                  />
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
                  {editingService ? 'Save Changes' : 'Create Service'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog
          open={!!deletingService}
          onOpenChange={(open) => !open && setDeletingService(null)}
        >
          <DialogContent className='sm:max-w-sm'>
            <DialogHeader>
              <DialogTitle className='text-destructive flex items-center gap-2'>
                <Trash2 className='size-4' />
                Delete Service?
              </DialogTitle>
              <DialogDescription className='text-xs'>
                Are you sure you want to delete{' '}
                <span className='font-bold text-foreground'>
                  "{deletingService?.name}"
                </span>
                ? Any linked sub-services will also be removed.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className='gap-2 sm:gap-0'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setDeletingService(null)}
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
