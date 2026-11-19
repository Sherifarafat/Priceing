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
  Sparkles,
  Copy,
  LogIn,
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
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
import { Merchant, MerchantStatus } from '@/types/saas'
import { MerchantDetailsSheet } from './components/merchant-details-sheet'

export function MerchantsView() {
  const navigate = useNavigate()
  const { auth } = useAuthStore()
  const {
    merchants,
    merchantTypes,
    currencies,
    branches,
    products,
    users,
    createMerchant,
    updateMerchant,
    setMerchantStatus,
    switchUser,
  } = useSaaSStore()

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [createdMerchantSuccess, setCreatedMerchantSuccess] = React.useState<{
    merchant: Merchant
    username: string
    password: string
    managerId: string
  } | null>(null)
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
      toast.success(`Merchant "${name}" updated successfully`)
    } else {
      const created = createMerchant({
        name: name.trim(),
        logo: logo.trim() || undefined,
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        merchantTypeId: merchantTypeId || merchantTypes[0].id,
        currencyId: currencyId || currencies[0].id,
        status,
      })
      const mgrUsername =
        email.trim().split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') ||
        `merchant_${created.id.slice(-4)}`
      setIsCreateOpen(false)
      setCreatedMerchantSuccess({
        merchant: created,
        username: mgrUsername,
        password: '123456',
        managerId: `user-${created.id}-mgr`,
      })
      toast.success(`Merchant "${created.name}" created with manager account!`)
    }
    resetForm()
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  const handleLoginAsManager = (info: { managerId: string; merchant: Merchant; username: string }) => {
    const mgrUser = users.find((u) => u.id === info.managerId) || {
      id: info.managerId,
      name: `${info.merchant.name} Manager`,
      email: info.merchant.email,
      username: info.username,
      role: 'MERCHANT_MANAGER' as const,
      merchantId: info.merchant.id,
      status: 'Active' as const,
      createdAt: new Date().toISOString(),
    }
    switchUser(mgrUser.id)
    auth.setUser({
      accountNo: mgrUser.id,
      email: mgrUser.email,
      role: [mgrUser.role],
      exp: Date.now() + 24 * 60 * 60 * 1000,
    })
    auth.setAccessToken(`auth-token-${mgrUser.id}`)
    toast.success(`Logged in as ${info.merchant.name} Store Manager!`)
    navigate({ to: '/' })
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
                              <div className='size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#3EEA85] border border-emerald-500/20 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs'>
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
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader className='text-start'>
            <DialogTitle>{editingMerchant ? 'Edit Merchant' : 'Add New Merchant'}</DialogTitle>
            <DialogDescription>
              {editingMerchant
                ? 'Update the merchant details here. '
                : 'Create new merchant here. '}
              Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>

          <div className='h-105 w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3'>
            <form id='merchant-form' onSubmit={handleSave} className='space-y-4 px-0.5'>
              {/* Merchant Name */}
              <div className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                <Label className='col-span-2 text-end'>Merchant Name</Label>
                <Input
                  required
                  placeholder='Spinneys'
                  className='col-span-4'
                  autoComplete='off'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Contact Email */}
              <div className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                <Label className='col-span-2 text-end'>Email</Label>
                <Input
                  required
                  type='email'
                  placeholder='contact@merchant.com'
                  className='col-span-4'
                  autoComplete='off'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Phone Number */}
              <div className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                <Label className='col-span-2 text-end'>Phone Number</Label>
                <Input
                  placeholder='+20 100 000 0000'
                  className='col-span-4'
                  autoComplete='off'
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {/* Headquarters Address */}
              <div className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                <Label className='col-span-2 text-end'>Address</Label>
                <Input
                  placeholder='City, Street, Country'
                  className='col-span-4'
                  autoComplete='off'
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              {/* Business Type */}
              {merchantTypes.length > 0 && (
                <div className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <Label className='col-span-2 text-end'>Business Type</Label>
                  <div className='col-span-4'>
                    <Select
                      value={merchantTypeId || merchantTypes[0]?.id}
                      onValueChange={(val) => setMerchantTypeId(val)}
                    >
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Select business type' />
                      </SelectTrigger>
                      <SelectContent>
                        {merchantTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Currency */}
              {currencies.length > 0 && (
                <div className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <Label className='col-span-2 text-end'>Currency</Label>
                  <div className='col-span-4'>
                    <Select
                      value={currencyId || currencies[0]?.id}
                      onValueChange={(val) => setCurrencyId(val)}
                    >
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Select currency' />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((curr) => (
                          <SelectItem key={curr.id} value={curr.id}>
                            {curr.code} - {curr.name} ({curr.symbol})
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
                    onValueChange={(val) => setStatus(val as MerchantStatus)}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Select status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Active'>Active</SelectItem>
                      <SelectItem value='Pending'>Pending</SelectItem>
                      <SelectItem value='Inactive'>Inactive</SelectItem>
                      <SelectItem value='Suspended'>Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Merchant Logo */}
              <div className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                <Label className='col-span-2 text-end'>Logo</Label>
                <div className='col-span-4 flex items-center gap-3'>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className='relative group size-11 rounded-xl border border-dashed border-border/80 hover:border-primary transition-all flex items-center justify-center bg-muted/40 cursor-pointer overflow-hidden shadow-2xs shrink-0'
                  >
                    {logo ? (
                      <img src={logo} alt='Merchant Logo' className='size-full object-cover' />
                    ) : (
                      <Camera className='size-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity' />
                    )}
                    <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-semibold'>
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
                  <div className='flex items-center gap-1.5 flex-1 min-w-0'>
                    <Input
                      placeholder='Image URL or click upload...'
                      value={logo}
                      onChange={(e) => setLogo(e.target.value)}
                      className='h-9 text-xs'
                    />
                    {logo && (
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => setLogo('')}
                        className='h-9 px-2 text-xs text-destructive hover:bg-destructive/10'
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
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
            <Button type='submit' form='merchant-form'>
              Save changes
            </Button>
          </DialogFooter>
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

      {/* Success Dialog with Merchant Manager Credentials */}
      <Dialog
        open={!!createdMerchantSuccess}
        onOpenChange={(open) => !open && setCreatedMerchantSuccess(null)}
      >
        <DialogContent className='max-w-md rounded-3xl p-6'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-emerald-600 dark:text-emerald-400'>
              <Sparkles className='size-5' /> Merchant & Store Manager Ready!
            </DialogTitle>
            <DialogDescription className='text-xs'>
              The merchant and dedicated Store Owner account have been provisioned. Use these credentials to sign in or manage the store.
            </DialogDescription>
          </DialogHeader>

          {createdMerchantSuccess && (
            <div className='my-3 space-y-4'>
              <div className='flex items-center gap-3 p-3 rounded-2xl border border-border/80 bg-muted/20'>
                {createdMerchantSuccess.merchant.logo ? (
                  <img
                    src={createdMerchantSuccess.merchant.logo}
                    alt={createdMerchantSuccess.merchant.name}
                    className='size-12 rounded-xl object-cover border border-border/80'
                  />
                ) : (
                  <div className='flex size-12 items-center justify-center rounded-xl bg-neutral-900 text-white font-black text-lg'>
                    {createdMerchantSuccess.merchant.name[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className='font-bold text-sm text-foreground'>
                    {createdMerchantSuccess.merchant.name}
                  </h4>
                  <p className='text-xs text-muted-foreground'>
                    {createdMerchantSuccess.merchant.email}
                  </p>
                </div>
              </div>

              <div className='p-4 rounded-2xl border border-primary/20 bg-primary/5 space-y-2.5 text-xs'>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground font-medium'>Manager Account:</span>
                  <Badge className='bg-neutral-900 text-white dark:bg-white dark:text-black font-bold text-[10px]'>
                    Store Owner / Manager
                  </Badge>
                </div>

                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground font-medium'>Login Username:</span>
                  <div className='flex items-center gap-1.5'>
                    <code className='rounded bg-muted px-2 py-0.5 font-mono font-bold text-foreground text-xs'>
                      {createdMerchantSuccess.username}
                    </code>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='size-6'
                      onClick={() =>
                        copyToClipboard(createdMerchantSuccess.username, 'Manager Username')
                      }
                    >
                      <Copy className='size-3' />
                    </Button>
                  </div>
                </div>

                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground font-medium'>Initial Password:</span>
                  <div className='flex items-center gap-1.5'>
                    <code className='rounded bg-muted px-2 py-0.5 font-mono font-bold text-foreground text-xs'>
                      {createdMerchantSuccess.password}
                    </code>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='size-6'
                      onClick={() =>
                        copyToClipboard(createdMerchantSuccess.password, 'Manager Password')
                      }
                    >
                      <Copy className='size-3' />
                    </Button>
                  </div>
                </div>
              </div>

              <div className='flex flex-col gap-2 pt-1'>
                <Button
                  className='w-full rounded-xl bg-[#3EEA85] text-black hover:bg-[#3EEA85]/90 font-bold'
                  onClick={() => {
                    const info = createdMerchantSuccess
                    setCreatedMerchantSuccess(null)
                    handleLoginAsManager(info)
                  }}
                >
                  <LogIn className='size-4 mr-2' /> Log in as Store Manager Now
                </Button>
                <Button
                  variant='outline'
                  className='w-full rounded-xl'
                  onClick={() => setCreatedMerchantSuccess(null)}
                >
                  Close & Continue as Admin
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
