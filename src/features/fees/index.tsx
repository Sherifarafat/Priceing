import * as React from 'react'
import {
  Plus,
  Percent,
  Receipt,
  Search,
  Edit2,
  Trash2,
  Building2,
  DollarSign,
  AlertTriangle,
} from 'lucide-react'
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
import { Fee, FeeType, EntityStatus } from '@/types/saas'
import { toast } from 'sonner'

export function FeesView() {
  const { fees, merchants, currentUser, createFee, updateFee, deleteFee } = useSaaSStore()

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN'

  // State
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedMerchantId, setSelectedMerchantId] = React.useState('all')
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingFee, setEditingFee] = React.useState<Fee | null>(null)
  const [deletingFee, setDeletingFee] = React.useState<Fee | null>(null)

  // Form Fields
  const [name, setName] = React.useState('')
  const [type, setType] = React.useState<FeeType>('PERCENTAGE')
  const [value, setValue] = React.useState<number | string>(0)
  const [description, setDescription] = React.useState('')
  const [status, setStatus] = React.useState<EntityStatus>('Active')
  const [merchantId, setMerchantId] = React.useState<string>('')
  const [error, setError] = React.useState<string | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  const openCreate = () => {
    setEditingFee(null)
    setName('')
    setType('PERCENTAGE')
    setValue(14)
    setDescription('')
    setStatus('Active')
    setMerchantId(isSuperAdmin ? (merchants[0]?.id || '') : (currentUser.merchantId || ''))
    setError(null)
    setIsDialogOpen(true)
  }

  const openEdit = (fee: Fee) => {
    setEditingFee(fee)
    setName(fee.name)
    setType(fee.type)
    setValue(fee.value)
    setDescription(fee.description || '')
    setStatus(fee.status)
    setMerchantId(fee.merchantId || merchants[0]?.id || '')
    setError(null)
    setIsDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Fee name is required.')
      return
    }

    const numVal = parseFloat(String(value))
    if (isNaN(numVal) || numVal < 0) {
      setError('Please provide a valid non-negative fee value.')
      return
    }

    setIsSaving(true)
    try {
      if (editingFee) {
        await updateFee(editingFee.id, {
          name: name.trim(),
          type,
          value: numVal,
          description: description.trim() || undefined,
          status,
          merchantId: isSuperAdmin ? (merchantId || null) : currentUser.merchantId,
        })
        toast.success(`Fee "${name}" updated successfully`)
      } else {
        await createFee({
          name: name.trim(),
          type,
          value: numVal,
          description: description.trim() || undefined,
          status,
          merchantId: isSuperAdmin ? (merchantId || null) : currentUser.merchantId,
        })
        toast.success(`Fee "${name}" created successfully`)
      }
      setIsDialogOpen(false)
    } catch (err: any) {
      setError(err.message || 'Failed to save fee')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (deletingFee) {
      await deleteFee(deletingFee.id)
      toast.success(`Fee "${deletingFee.name}" deleted`)
      setDeletingFee(null)
    }
  }

  const filteredFees = (fees || []).filter((f) => {
    const matchesMerchant =
      !isSuperAdmin ||
      selectedMerchantId === 'all' ||
      f.merchantId === selectedMerchantId ||
      !f.merchantId

    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesMerchant && matchesSearch
  })

  return (
    <>
      <Header fixed>
        <div className='flex items-center gap-2'>
          <h1 className='font-semibold text-sm'>
            {isSuperAdmin ? 'Platform Super Admin' : 'Store Management'}
          </h1>
          <Badge
            variant='outline'
            className='text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/50'
          >
            Fees & Taxes
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
            <h2 className='text-xl font-bold tracking-tight'>Fees & Taxes Management</h2>
            <p className='text-xs text-muted-foreground mt-0.5'>
              Define fixed amounts or percentages (VAT, service fees, delivery fees) and attach them to products.
            </p>
          </div>
          <Button onClick={openCreate} className='gap-2 shrink-0'>
            <Plus className='size-4' />
            Add Fee
          </Button>
        </div>

        {/* Filter Bar */}
        <Card className='p-4 border-border/60 shadow-2xs'>
          <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
              <Input
                placeholder='Search fee by name or description...'
                className='pl-9'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {isSuperAdmin && merchants.length > 0 && (
              <div className='w-full sm:w-60'>
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
          </div>
        </Card>

        {/* Fees Table */}
        <Card className='border-border/60 shadow-2xs overflow-hidden'>
          <Table>
            <TableHeader className='bg-muted/40'>
              <TableRow>
                <TableHead className='font-semibold'>Fee Name</TableHead>
                <TableHead className='font-semibold'>Type</TableHead>
                <TableHead className='font-semibold'>Rate / Amount</TableHead>
                {isSuperAdmin && <TableHead className='font-semibold'>Merchant</TableHead>}
                <TableHead className='font-semibold text-center'>Status</TableHead>
                <TableHead className='font-semibold text-end'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFees.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isSuperAdmin ? 6 : 5}
                    className='h-32 text-center text-muted-foreground'
                  >
                    <div className='flex flex-col items-center justify-center gap-2'>
                      <Receipt className='size-8 text-muted-foreground/40' />
                      <p className='text-sm font-medium'>No fees configured yet</p>
                      <p className='text-xs'>Click "Add Fee" to create VAT, service charges, or shipping fees.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredFees.map((fee) => {
                  const merchant = merchants.find((m) => m.id === fee.merchantId)
                  return (
                    <TableRow key={fee.id} className='hover:bg-muted/30 transition-colors'>
                      <TableCell>
                        <div className='font-semibold text-sm text-foreground flex items-center gap-2'>
                          <div className='size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0'>
                            {fee.type === 'PERCENTAGE' ? (
                              <Percent className='size-4' />
                            ) : (
                              <DollarSign className='size-4' />
                            )}
                          </div>
                          <div>
                            <div>{fee.name}</div>
                            {fee.description && (
                              <div className='text-xs text-muted-foreground font-normal line-clamp-1'>
                                {fee.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant='outline'
                          className={`text-xs font-semibold ${
                            fee.type === 'PERCENTAGE'
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200/50'
                              : 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 border-purple-200/50'
                          }`}
                        >
                          {fee.type === 'PERCENTAGE' ? 'Percentage (%)' : 'Fixed Amount'}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <span className='font-bold font-mono text-sm'>
                          {fee.type === 'PERCENTAGE' ? `${fee.value}%` : `${fee.value} EGP`}
                        </span>
                      </TableCell>

                      {isSuperAdmin && (
                        <TableCell>
                          <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                            <Building2 className='size-3.5 shrink-0' />
                            <span className='font-medium text-foreground'>
                              {merchant ? merchant.name : 'All Merchants'}
                            </span>
                          </div>
                        </TableCell>
                      )}

                      <TableCell className='text-center'>
                        <Badge
                          variant='outline'
                          className={`text-xs font-semibold ${
                            fee.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200/50'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {fee.status}
                        </Badge>
                      </TableCell>

                      <TableCell className='text-end'>
                        <div className='flex items-center justify-end gap-1'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='size-8'
                            onClick={() => openEdit(fee)}
                          >
                            <Edit2 className='size-3.5' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='size-8 text-destructive hover:bg-destructive/10'
                            onClick={() => setDeletingFee(fee)}
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

      {/* Add / Edit Fee Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader className='text-start'>
            <DialogTitle>{editingFee ? 'Edit Fee' : 'Add New Fee'}</DialogTitle>
            <DialogDescription>
              {editingFee
                ? 'Update fee rates or change fee settings.'
                : 'Configure a new fee or tax rule that can be attached to products.'}
            </DialogDescription>
          </DialogHeader>

          <div className='h-105 w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3'>
            <form id='fee-form' onSubmit={handleSave} className='space-y-4 px-0.5'>
              {/* Fee Name */}
              <div className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                <Label className='col-span-2 text-end'>Fee Name</Label>
                <Input
                  required
                  placeholder='e.g., Value Added Tax (VAT), Service Fee'
                  className='col-span-4'
                  autoComplete='off'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Fee Type */}
              <div className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                <Label className='col-span-2 text-end'>Fee Type</Label>
                <div className='col-span-4'>
                  <Select
                    value={type}
                    onValueChange={(val) => setType(val as FeeType)}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Select type' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='PERCENTAGE'>Percentage (%)</SelectItem>
                      <SelectItem value='FIXED'>Fixed Amount (EGP)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Fee Value */}
              <div className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                <Label className='col-span-2 text-end'>
                  {type === 'PERCENTAGE' ? 'Rate (%)' : 'Amount (EGP)'}
                </Label>
                <Input
                  type='number'
                  step='0.01'
                  min='0'
                  required
                  placeholder={type === 'PERCENTAGE' ? '14' : '10.00'}
                  className='col-span-4'
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>

              {/* Scope / Merchant */}
              {isSuperAdmin && (
                <div className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <Label className='col-span-2 text-end'>Merchant</Label>
                  <div className='col-span-4'>
                    <Select
                      value={merchantId || 'all'}
                      onValueChange={(val) => setMerchantId(val === 'all' ? '' : val)}
                    >
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Select merchant' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All Merchants (Global Fee)</SelectItem>
                        {merchants.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Status */}
              <div className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                <Label className='col-span-2 text-end'>Status</Label>
                <div className='col-span-4'>
                  <Select
                    value={status}
                    onValueChange={(val) => setStatus(val as EntityStatus)}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Select status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Active'>Active</SelectItem>
                      <SelectItem value='Inactive'>Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                <Label className='col-span-2 text-end'>Description</Label>
                <Input
                  placeholder='Optional notes or description...'
                  className='col-span-4'
                  autoComplete='off'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {error && (
                <div className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <div className='col-span-4 col-start-3 text-xs text-destructive font-medium'>
                    {error}
                  </div>
                </div>
              )}
            </form>
          </div>

          <DialogFooter>
            <Button type='submit' form='fee-form' disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Fee Dialog */}
      <Dialog open={!!deletingFee} onOpenChange={(open) => !open && setDeletingFee(null)}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-destructive'>
              <AlertTriangle className='size-5' /> Delete Fee?
            </DialogTitle>
            <DialogDescription className='text-xs'>
              Are you sure you want to delete <strong>{deletingFee?.name}</strong>? This fee will also be unassigned from any products linked to it.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className='gap-2 sm:gap-0'>
            <Button variant='outline' size='sm' onClick={() => setDeletingFee(null)}>
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
