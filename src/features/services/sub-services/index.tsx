import * as React from 'react'
import {
  Plus,
  Search as SearchIcon,
  Edit2,
  Trash2,
  GitFork,
  Sparkles,
  CheckCircle2,
  XCircle,
  Briefcase,
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
import { SubService, EntityStatus } from '@/types/saas'
import { toast } from 'sonner'

export function SubServicesView() {
  const {
    serviceItems,
    subServices,
    createSubService,
    updateSubService,
    deleteSubService,
  } = useSaaSStore()

  const [search, setSearch] = React.useState('')
  const [parentServiceFilter, setParentServiceFilter] = React.useState<string>('ALL')
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | EntityStatus>('ALL')

  // Modals state
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingSub, setEditingSub] = React.useState<SubService | null>(null)
  const [name, setName] = React.useState('')
  const [serviceId, setServiceId] = React.useState('')
  const [additionalPrice, setAdditionalPrice] = React.useState<number>(50)
  const [description, setDescription] = React.useState('')
  const [status, setStatus] = React.useState<EntityStatus>('Active')

  // Delete modal
  const [deletingSub, setDeletingSub] = React.useState<SubService | null>(null)

  const openCreateDialog = () => {
    setEditingSub(null)
    setName('')
    setServiceId(serviceItems[0]?.id || '')
    setAdditionalPrice(50)
    setDescription('')
    setStatus('Active')
    setIsDialogOpen(true)
  }

  const openEditDialog = (sub: SubService) => {
    setEditingSub(sub)
    setName(sub.name)
    setServiceId(sub.serviceId)
    setAdditionalPrice(sub.additionalPrice)
    setDescription(sub.description || '')
    setStatus(sub.status)
    setIsDialogOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Sub-service name is required')
      return
    }
    if (!serviceId) {
      toast.error('Please select a parent service')
      return
    }

    if (editingSub) {
      updateSubService(editingSub.id, {
        name: name.trim(),
        serviceId,
        additionalPrice,
        description: description.trim(),
        status,
      })
      toast.success(`Sub-service "${name}" updated successfully`)
    } else {
      createSubService({
        name: name.trim(),
        serviceId,
        additionalPrice,
        description: description.trim(),
        status,
      })
      toast.success(`Sub-service "${name}" created successfully`)
    }

    setIsDialogOpen(false)
  }

  const handleDelete = () => {
    if (!deletingSub) return
    deleteSubService(deletingSub.id)
    toast.success(`Sub-service "${deletingSub.name}" deleted`)
    setDeletingSub(null)
  }

  const filteredSubServices = (subServices || []).filter((sub) => {
    const matchesSearch =
      sub.name.toLowerCase().includes(search.toLowerCase()) ||
      (sub.description && sub.description.toLowerCase().includes(search.toLowerCase()))
    const matchesParent = parentServiceFilter === 'ALL' || sub.serviceId === parentServiceFilter
    const matchesStatus = statusFilter === 'ALL' || sub.status === statusFilter
    return matchesSearch && matchesParent && matchesStatus
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
                Sub Services
              </h1>
              <Badge variant='outline' className='text-xs font-mono font-bold bg-muted/50'>
                {filteredSubServices.length} Sub-Services
              </Badge>
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Manage granular options, add-on components, and extensions for main services.
            </p>
          </div>

          <Button
            onClick={openCreateDialog}
            className='gap-2 bg-primary text-primary-foreground font-semibold shadow-xs hover:bg-primary/90 h-9 px-4 rounded-lg'
          >
            <Plus className='size-4' />
            Add Sub Service
          </Button>
        </div>

        {/* Filters */}
        <div className='flex flex-col sm:flex-row items-center gap-3'>
          <div className='relative w-full sm:w-80'>
            <SearchIcon className='size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2' />
            <Input
              placeholder='Search sub services...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='ps-9 text-xs h-9 rounded-lg bg-card border-border/80'
            />
          </div>

          {/* Parent Service Dropdown Filter */}
          <select
            value={parentServiceFilter}
            onChange={(e) => setParentServiceFilter(e.target.value)}
            className='h-9 rounded-lg border border-border/80 bg-card px-3 text-xs text-foreground'
          >
            <option value='ALL'>All Parent Services</option>
            {(serviceItems || []).map((srv) => (
              <option key={srv.id} value={srv.id}>
                {srv.name}
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
                    Sub-Service Name
                  </TableHead>
                  <TableHead className='py-3.5 text-xs font-semibold text-foreground'>
                    Parent Service
                  </TableHead>
                  <TableHead className='py-3.5 text-xs font-semibold text-foreground text-center'>
                    Price
                  </TableHead>
                  <TableHead className='py-3.5 text-xs font-semibold text-foreground'>
                    Description
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
                {filteredSubServices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className='h-40 text-center text-muted-foreground text-xs'>
                      <GitFork className='size-8 mx-auto mb-2 opacity-25' />
                      <p className='font-semibold'>No sub-services found</p>
                      <p className='text-[11px] mt-0.5'>Click "Add Sub Service" above to create one.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubServices.map((sub) => {
                    const parentSrv = (serviceItems || []).find((s) => s.id === sub.serviceId)

                    return (
                      <TableRow
                        key={sub.id}
                        className='bg-white dark:bg-card hover:bg-slate-50/70 dark:hover:bg-neutral-800/40 border-b border-border/40 transition-colors'
                      >
                        <TableCell className='ps-5 py-3.5 font-semibold text-xs text-foreground'>
                          <div className='flex items-center gap-2.5'>
                            <div className='size-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 flex items-center justify-center font-bold shrink-0 border border-indigo-100 dark:border-indigo-900/40'>
                              <GitFork className='size-4' />
                            </div>
                            <div>
                              <div className='font-bold text-foreground'>{sub.name}</div>
                              <div className='text-[10px] text-muted-foreground font-mono'>
                                {sub.id}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className='py-3.5 text-xs'>
                          <Badge variant='outline' className='bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 font-medium inline-flex items-center gap-1'>
                            <Briefcase className='size-3 text-[#4F46E5] dark:text-indigo-400' />
                            {parentSrv?.name || 'Standalone'}
                          </Badge>
                        </TableCell>
                        <TableCell className='py-3.5 text-center'>
                          <span className='font-mono font-bold text-xs text-foreground inline-flex items-center gap-1'>
                            {sub.additionalPrice.toLocaleString()} E£
                          </span>
                        </TableCell>
                        <TableCell className='py-3.5 text-xs text-muted-foreground max-w-xs truncate'>
                          {sub.description || '—'}
                        </TableCell>
                        <TableCell className='py-3.5 text-center'>
                          <Badge
                            variant='outline'
                            className={
                              sub.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200/50'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200/50'
                            }
                          >
                            {sub.status === 'Active' ? (
                              <CheckCircle2 className='size-3 mr-1 inline' />
                            ) : (
                              <XCircle className='size-3 mr-1 inline' />
                            )}
                            {sub.status}
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
                                onClick={() => openEditDialog(sub)}
                                className='cursor-pointer gap-2'
                              >
                                <Edit2 className='size-3.5 text-primary' />
                                Edit Sub Service
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeletingSub(sub)}
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
                  {editingSub ? 'Edit Sub Service' : 'Create Sub Service'}
                </DialogTitle>
                <DialogDescription className='text-xs'>
                  Attach an option or sub-component under a parent service.
                </DialogDescription>
              </DialogHeader>

              <div className='space-y-4 my-4 text-xs'>
                <div>
                  <label className='font-semibold block mb-1.5 text-foreground'>
                    Sub-Service Name *
                  </label>
                  <Input
                    required
                    placeholder='e.g. Laser Precision Calibration'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className='text-xs'
                  />
                </div>

                <div>
                  <label className='font-semibold block mb-1.5 text-foreground'>
                    Parent Service *
                  </label>
                  <select
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    className='w-full rounded-md border bg-background px-3 py-2 text-xs text-foreground'
                  >
                    {(serviceItems || []).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='font-semibold block mb-1.5 text-foreground'>
                    Price
                  </label>
                  <Input
                    type='number'
                    min='0'
                    step='1'
                    placeholder='0'
                    value={additionalPrice}
                    onChange={(e) => setAdditionalPrice(parseFloat(e.target.value) || 0)}
                    className='text-xs font-mono'
                  />
                </div>

                <div>
                  <label className='font-semibold block mb-1.5 text-foreground'>
                    Description
                  </label>
                  <Input
                    placeholder='Specification details...'
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
                  {editingSub ? 'Save Changes' : 'Create Sub Service'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog
          open={!!deletingSub}
          onOpenChange={(open) => !open && setDeletingSub(null)}
        >
          <DialogContent className='sm:max-w-sm'>
            <DialogHeader>
              <DialogTitle className='text-destructive flex items-center gap-2'>
                <Trash2 className='size-4' />
                Delete Sub Service?
              </DialogTitle>
              <DialogDescription className='text-xs'>
                Are you sure you want to delete{' '}
                <span className='font-bold text-foreground'>
                  "{deletingSub?.name}"
                </span>
                ?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className='gap-2 sm:gap-0'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setDeletingSub(null)}
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
