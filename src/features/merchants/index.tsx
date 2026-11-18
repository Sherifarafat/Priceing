import * as React from 'react'
import {
  Plus,
  Store,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  MoreHorizontal,
  Mail,
  MapPin,
  Edit2,
  Eye,
  Camera,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { Merchant, MerchantStatus } from '@/types/saas'
import { MerchantDetailsSheet } from './components/merchant-details-sheet'

export function MerchantsView() {
  const {
    merchants,
    merchantTypes,
    currencies,
    branches,
    products,
    createMerchant,
    updateMerchant,
    setMerchantStatus,
  } = useSaaSStore()

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingMerchant, setEditingMerchant] = React.useState<Merchant | null>(null)
  const [selectedMerchantId, setSelectedMerchantId] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const activeSelectedMerchant = selectedMerchantId
    ? merchants.find((m) => m.id === selectedMerchantId) ?? null
    : null

  // Form Fields
  const [name, setName] = React.useState('')
  const [logo, setLogo] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [address, setAddress] = React.useState('')
  const [merchantTypeId, setMerchantTypeId] = React.useState('')
  const [currencyId, setCurrencyId] = React.useState('')
  const [status, setStatus] = React.useState<MerchantStatus>('Active')
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Search & Filter
  const [searchTerm, setSearchTerm] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')

  const resetForm = () => {
    setName('')
    setLogo('')
    setEmail('')
    setPhone('')
    setAddress('')
    setMerchantTypeId(merchantTypes[0]?.id || '')
    setCurrencyId(currencies[0]?.id || '')
    setStatus('Active')
    setError(null)
  }

  const openCreate = () => {
    resetForm()
    setIsCreateOpen(true)
  }

  const openEdit = (m: Merchant) => {
    setEditingMerchant(m)
    setName(m.name)
    setLogo(m.logo || '')
    setEmail(m.email)
    setPhone(m.phone)
    setAddress(m.address)
    setMerchantTypeId(m.merchantTypeId)
    setCurrencyId(m.currencyId)
    setStatus(m.status)
    setError(null)
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogo(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Merchant Name is required.')
      return
    }
    if (!email.trim()) {
      setError('Contact Email is required.')
      return
    }

    if (editingMerchant) {
      updateMerchant(editingMerchant.id, {
        name: name.trim(),
        logo: logo.trim() || undefined,
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        merchantTypeId,
        currencyId,
        status,
      })
      setEditingMerchant(null)
    } else {
      createMerchant({
        name: name.trim(),
        logo: logo.trim() || undefined,
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        merchantTypeId: merchantTypeId || merchantTypes[0].id,
        currencyId: currencyId || currencies[0].id,
        status,
      })
      setIsCreateOpen(false)
    }
    resetForm()
  }

  const filteredMerchants = merchants.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <>
      <Header>
        <div className='flex items-center gap-2'>
          <h1 className='font-semibold text-sm'>Platform Super Admin</h1>
          <Badge variant='default' className='text-xs'>
            Merchants Directory
          </Badge>
        </div>
        <div className='ms-auto flex items-center gap-2'>
          <LanguageSwitch />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-5 p-4 md:p-6'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Merchants & Tenants</h2>
            <p className='text-xs text-muted-foreground'>
              Platform Super Admin controls merchant onboarding, operational status, and currency assignment.
            </p>
          </div>
          <Button size='sm' onClick={openCreate}>
            <Plus className='mr-1.5 size-4' />
            Onboard Merchant
          </Button>
        </div>

        {/* Main Card with Filter Bar and Table */}
        <Card className='p-0 overflow-hidden border border-border/80 shadow-[0_2px_16px_rgba(0,0,0,0.04)] rounded-2xl'>
          {/* Filter Bar */}
          <div className='p-4 md:p-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card'>
            <div className='flex items-center gap-3 flex-1 max-w-sm'>
              <Input
                placeholder='Search merchants by name or email...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='text-xs h-9 rounded-xl bg-background border-border/80'
              />
            </div>
            <div className='flex items-center gap-3'>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className='rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs text-foreground font-medium h-9'
              >
                <option value='all'>All Statuses</option>
                <option value='Active'>Active</option>
                <option value='Pending'>Pending</option>
                <option value='Inactive'>Inactive</option>
                <option value='Suspended'>Suspended</option>
              </select>
              <Badge variant='outline' className='text-xs text-muted-foreground font-semibold px-2.5 py-1 rounded-lg'>
                {filteredMerchants.length} {filteredMerchants.length === 1 ? 'Merchant' : 'Merchants'}
              </Badge>
            </div>
          </div>

          {/* Table Container */}
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow className='hover:bg-transparent border-b border-border/60 bg-muted/25'>
                  <TableHead className='ps-5 py-3.5 text-xs font-semibold text-muted-foreground'>Merchant / Business</TableHead>
                  <TableHead className='py-3.5 text-xs font-semibold text-muted-foreground'>Contact Details</TableHead>
                  <TableHead className='py-3.5 text-xs font-semibold text-muted-foreground'>Headquarters</TableHead>
                  <TableHead className='py-3.5 text-xs font-semibold text-muted-foreground text-center'>Branches</TableHead>
                  <TableHead className='py-3.5 text-xs font-semibold text-muted-foreground text-center'>Products</TableHead>
                  <TableHead className='py-3.5 text-xs font-semibold text-muted-foreground text-center'>Status</TableHead>
                  <TableHead className='pe-5 py-3.5 text-xs font-semibold text-muted-foreground text-end'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMerchants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className='h-48 text-center text-muted-foreground text-xs'>
                      <Store className='size-8 mx-auto mb-2 opacity-20' />
                      <p className='font-semibold'>No merchants found</p>
                      <p className='text-[11px] mt-0.5'>Try adjusting your search or status filter.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMerchants.map((merchant) => {
                    const branchCount = branches.filter((b) => b.merchantId === merchant.id).length
                    const prodCount = products.filter((p) => p.merchantId === merchant.id).length

                    return (
                      <tr
                        key={merchant.id}
                        onClick={() => setSelectedMerchantId(merchant.id)}
                        className='group border-b border-border/40 hover:bg-muted/30 transition-colors cursor-pointer'
                      >
                        {/* Merchant / Business */}
                        <td className='ps-5 py-3.5'>
                          <div className='flex items-center gap-3'>
                            {merchant.logo ? (
                              <img
                                src={merchant.logo}
                                alt={merchant.name}
                                className='size-10 rounded-xl object-cover border border-border/80 shadow-2xs shrink-0'
                              />
                            ) : (
                              <div className='size-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs'>
                                {merchant.name[0]}
                              </div>
                            )}
                            <div className='min-w-0'>
                              <div className='font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors'>
                                {merchant.name}
                              </div>
                              <div className='text-xs text-muted-foreground font-mono truncate'>
                                {merchant.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact Details */}
                        <td className='py-3.5'>
                          <div className='space-y-1 text-xs'>
                            <div className='flex items-center gap-1.5 text-foreground'>
                              <Mail className='size-3 text-muted-foreground shrink-0' />
                              <span className='truncate'>{merchant.email}</span>
                            </div>
                            {merchant.phone && (
                              <div className='text-[11px] text-muted-foreground font-mono'>
                                {merchant.phone}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Headquarters */}
                        <td className='py-3.5'>
                          <div className='flex items-center gap-1.5 text-xs text-muted-foreground max-w-xs'>
                            <MapPin className='size-3.5 text-muted-foreground shrink-0' />
                            <span className='truncate'>{merchant.address || '—'}</span>
                          </div>
                        </td>

                        {/* Branches Count */}
                        <td className='py-3.5 text-center'>
                          <span className='inline-flex items-center justify-center min-w-7 px-2.5 py-0.5 rounded-lg bg-muted/60 text-xs font-bold font-mono text-foreground'>
                            {branchCount}
                          </span>
                        </td>

                        {/* Products Count */}
                        <td className='py-3.5 text-center'>
                          <span className='inline-flex items-center justify-center min-w-7 px-2.5 py-0.5 rounded-lg bg-muted/60 text-xs font-bold font-mono text-foreground'>
                            {prodCount}
                          </span>
                        </td>

                        {/* Status */}
                        <td className='py-3.5 text-center'>
                          <Badge
                            variant='outline'
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-lg border ${
                              merchant.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200/50'
                                : merchant.status === 'Suspended'
                                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200/50'
                                : merchant.status === 'Pending'
                                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200/50'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200/50'
                            }`}
                          >
                            {merchant.status}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td
                          className='pe-5 py-3.5 text-end'
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size='icon' variant='ghost' className='size-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground'>
                                <MoreHorizontal className='size-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end' className='w-44 text-xs rounded-xl shadow-lg'>
                              <DropdownMenuItem onClick={() => setSelectedMerchantId(merchant.id)} className='cursor-pointer rounded-lg'>
                                <Eye className='mr-2 size-3.5 text-muted-foreground' /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(merchant)} className='cursor-pointer rounded-lg'>
                                <Edit2 className='mr-2 size-3.5 text-primary' /> Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel className='text-[10px] text-muted-foreground uppercase tracking-wider font-semibold'>
                                Operational Status
                              </DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setMerchantStatus(merchant.id, 'Active')} className='cursor-pointer rounded-lg'>
                                <CheckCircle2 className='mr-2 size-3.5 text-emerald-500' /> Set Active
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setMerchantStatus(merchant.id, 'Pending')} className='cursor-pointer rounded-lg'>
                                <Clock className='mr-2 size-3.5 text-amber-500' /> Set Pending
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setMerchantStatus(merchant.id, 'Inactive')} className='cursor-pointer rounded-lg'>
                                <XCircle className='mr-2 size-3.5 text-slate-400' /> Set Inactive
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setMerchantStatus(merchant.id, 'Suspended')} className='cursor-pointer rounded-lg text-rose-600 dark:text-rose-400 focus:text-rose-600'>
                                <AlertTriangle className='mr-2 size-3.5 text-rose-500' /> Set Suspended
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </Main>

      {/* Onboard / Edit Dialog */}
      <Dialog
        open={isCreateOpen || !!editingMerchant}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false)
            setEditingMerchant(null)
          }
        }}
      >
        <DialogContent className='max-w-md'>
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{editingMerchant ? 'Edit Merchant' : 'Onboard New Merchant'}</DialogTitle>
              <DialogDescription className='text-xs'>
                Platform Super Admin provisions new tenant businesses and automatically sets up their primary manager account.
              </DialogDescription>
            </DialogHeader>

            {error && <p className='text-xs text-destructive mt-2'>{error}</p>}

            {/* Merchant Logo Avatar in Center */}
            <div className='flex flex-col items-center justify-center my-4 gap-2'>
              <div
                onClick={() => fileInputRef.current?.click()}
                className='relative group size-20 rounded-full border-2 border-dashed border-border/80 hover:border-primary transition-all flex items-center justify-center bg-muted/40 cursor-pointer overflow-hidden shadow-xs'
              >
                {logo ? (
                  <img src={logo} alt='Merchant Logo' className='size-full object-cover' />
                ) : (
                  <div className='flex flex-col items-center justify-center text-muted-foreground gap-1'>
                    <Camera className='size-6 opacity-40 group-hover:opacity-70 transition-opacity' />
                    <span className='text-[9px] font-medium'>Upload</span>
                  </div>
                )}
                <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-semibold'>
                  Change
                </div>
              </div>
              <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                className='hidden'
                onChange={handleLogoUpload}
              />
              <div className='flex items-center gap-1.5 w-full max-w-xs'>
                <Input
                  placeholder='Or paste image URL...'
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className='text-[10px] h-7 text-center rounded-lg bg-background'
                />
                {logo && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => setLogo('')}
                    className='h-7 px-2 text-[10px] text-destructive hover:bg-destructive/10'
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>

            <div className='space-y-3 my-4 text-xs'>
              <div>
                <label className='font-semibold block mb-1'>Merchant Name *</label>
                <Input
                  required
                  placeholder='e.g. Spinneys, Seoudi Market...'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className='text-xs'
                />
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='font-semibold block mb-1'>Contact Email *</label>
                  <Input
                    required
                    type='email'
                    placeholder='contact@merchant.com'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className='text-xs'
                  />
                </div>
                <div>
                  <label className='font-semibold block mb-1'>Phone</label>
                  <Input
                    placeholder='+20 ...'
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className='text-xs'
                  />
                </div>
              </div>

              <div>
                <label className='font-semibold block mb-1'>Headquarters Address</label>
                <Input
                  placeholder='City, Street, Country'
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className='text-xs'
                />
              </div>

              <div>
                <label className='font-semibold block mb-1'>Operational Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as MerchantStatus)}
                  className='w-full rounded-md border bg-background px-3 py-2 text-xs text-foreground'
                >
                  <option value='Active'>Active (Scanning & Dashboard open)</option>
                  <option value='Pending'>Pending (Onboarding)</option>
                  <option value='Inactive'>Inactive (Scanning blocked)</option>
                  <option value='Suspended'>Suspended (Access blocked)</option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => {
                  setIsCreateOpen(false)
                  setEditingMerchant(null)
                }}
              >
                Cancel
              </Button>
              <Button type='submit' size='sm'>
                {editingMerchant ? 'Save Changes' : 'Create Merchant'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Merchant Details Sheet (Side Drawer from Right) */}
      <MerchantDetailsSheet
        merchant={activeSelectedMerchant}
        open={!!activeSelectedMerchant}
        onOpenChange={(open) => {
          if (!open) setSelectedMerchantId(null)
        }}
        onEdit={(m) => {
          openEdit(m)
        }}
      />
    </>
  )
}
