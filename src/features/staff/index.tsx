import * as React from 'react'
import {
  Plus,
  Users,
  Shield,
  KeyRound,
  Check,
  X,
  CreditCard,
  UserCheck,
  Copy,
  LogIn,
  Store,
  Layers,
  Sparkles,
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
import { useAuthStore } from '@/stores/auth-store'
import { User, UserRole, StaffPermissionKey } from '@/types/saas'

interface StaffPermItem {
  key: StaffPermissionKey
  label: string
  desc: string
  category: 'POS & Invoicing' | 'Products Hub' | 'Excel Operations' | 'Store Management'
}

const ALL_STAFF_PERMISSIONS: StaffPermItem[] = [
  // POS & Invoicing
  {
    key: 'invoices.issue',
    label: 'Issue Invoices / POS',
    desc: 'Access checkout, barcode scanning, and issue sales invoices',
    category: 'POS & Invoicing',
  },
  {
    key: 'invoices.view',
    label: 'View Invoices List',
    desc: 'Browse transaction history and print previous receipts',
    category: 'POS & Invoicing',
  },
  {
    key: 'invoices.design',
    label: 'Invoice Template Designer',
    desc: 'Customize receipt styles, thermal paper size, and logos',
    category: 'POS & Invoicing',
  },

  // Products
  {
    key: 'products.view',
    label: 'View Products Catalog',
    desc: 'Look up retail prices, barcodes, and stock availability',
    category: 'Products Hub',
  },
  {
    key: 'products.create',
    label: 'Add New Products',
    desc: 'Register new products, barcodes, and pricing',
    category: 'Products Hub',
  },
  {
    key: 'products.edit',
    label: 'Edit Products & Prices',
    desc: 'Modify product information, images, and prices',
    category: 'Products Hub',
  },
  {
    key: 'products.delete',
    label: 'Delete Products',
    desc: 'Remove products permanently from the catalog',
    category: 'Products Hub',
  },
  {
    key: 'categories.manage',
    label: 'Manage Categories',
    desc: 'Create and organize product categories',
    category: 'Products Hub',
  },

  // Excel
  {
    key: 'excel.import',
    label: 'Excel Bulk Import',
    desc: 'Import product spreadsheets in bulk',
    category: 'Excel Operations',
  },
  {
    key: 'excel.bulk_edit',
    label: 'Excel Bulk Edit',
    desc: 'Batch update prices and items via spreadsheets',
    category: 'Excel Operations',
  },
  {
    key: 'excel.bulk_delete',
    label: 'Excel Bulk Delete',
    desc: 'Batch delete items using uploaded sheets',
    category: 'Excel Operations',
  },

  // Store Management
  {
    key: 'dashboard.view',
    label: 'View Store Dashboard',
    desc: 'Access store-level analytics and sales figures',
    category: 'Store Management',
  },
  {
    key: 'branches.view',
    label: 'View Branches',
    desc: 'See merchant branch locations and QR tokens',
    category: 'Store Management',
  },
  {
    key: 'branches.manage',
    label: 'Manage Branches',
    desc: 'Add branches and regenerate branch QR codes',
    category: 'Store Management',
  },
  {
    key: 'fees.manage',
    label: 'Manage Fees & Taxes',
    desc: 'Configure VAT and store-specific service fees',
    category: 'Store Management',
  },
  {
    key: 'staff.manage',
    label: 'Manage Cashiers & Staff',
    desc: 'Create team members and manage their permissions',
    category: 'Store Management',
  },
  {
    key: 'reports.view',
    label: 'View Financial Reports',
    desc: 'Access audit logs and store financial performance',
    category: 'Store Management',
  },
]

export function StaffManagementView() {
  const navigate = useNavigate()
  const { auth } = useAuthStore()
  const {
    currentUser,
    merchants,
    branches,
    users,
    createStaffUser,
    updateStaffPermissions,
    resetUserPassword,
    switchUser,
  } = useSaaSStore()

  const merchantId = currentUser.merchantId || merchants[0]?.id || ''
  const merchant = merchants.find((m) => m.id === merchantId)
  const storeBranches = branches.filter((b) => b.merchantId === merchantId)

  // Users belonging to this merchant
  const merchantUsers = users.filter(
    (u) =>
      u.merchantId === merchantId ||
      (currentUser.role === 'SUPER_ADMIN' && !currentUser.merchantId)
  )

  // Modals
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [createdUserSuccess, setCreatedUserSuccess] = React.useState<User | null>(null)
  const [editingPermissionsUser, setEditingPermissionsUser] = React.useState<User | null>(null)
  const [passwordResetTarget, setPasswordResetTarget] = React.useState<User | null>(null)
  const [passwordResetSuccess, setPasswordResetSuccess] = React.useState(false)

  // Form Fields
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('123456')
  const [pin, setPin] = React.useState('1234')
  const [role, setRole] = React.useState<UserRole>('CASHIER')
  const [selectedBranchId, setSelectedBranchId] = React.useState<string>('all')
  const [permissions, setPermissions] = React.useState<Record<StaffPermissionKey, boolean>>({
    'dashboard.view': false,
    'branches.view': false,
    'branches.manage': false,
    'products.view': true,
    'products.create': false,
    'products.edit': false,
    'products.delete': false,
    'categories.manage': false,
    'excel.import': false,
    'excel.bulk_edit': false,
    'excel.bulk_delete': false,
    'invoices.view': true,
    'invoices.issue': true,
    'invoices.design': false,
    'fees.manage': false,
    'staff.manage': false,
    'reports.view': false,
  })
  const [error, setError] = React.useState<string | null>(null)

  // Apply Role Preset Defaults
  const applyRolePreset = (newRole: UserRole) => {
    setRole(newRole)
    if (newRole === 'CASHIER') {
      setPermissions({
        'dashboard.view': false,
        'branches.view': false,
        'branches.manage': false,
        'products.view': true,
        'products.create': false,
        'products.edit': false,
        'products.delete': false,
        'categories.manage': false,
        'excel.import': false,
        'excel.bulk_edit': false,
        'excel.bulk_delete': false,
        'invoices.view': true,
        'invoices.issue': true,
        'invoices.design': false,
        'fees.manage': false,
        'staff.manage': false,
        'reports.view': false,
      })
    } else if (newRole === 'MERCHANT_STAFF') {
      setPermissions({
        'dashboard.view': true,
        'branches.view': true,
        'branches.manage': false,
        'products.view': true,
        'products.create': true,
        'products.edit': true,
        'products.delete': false,
        'categories.manage': true,
        'excel.import': true,
        'excel.bulk_edit': false,
        'excel.bulk_delete': false,
        'invoices.view': true,
        'invoices.issue': true,
        'invoices.design': false,
        'fees.manage': false,
        'staff.manage': false,
        'reports.view': true,
      })
    }
  }

  const openCreate = () => {
    setName('')
    setEmail('')
    setUsername('')
    setPassword('123456')
    setPin('1234')
    setSelectedBranchId(storeBranches[0]?.id || 'all')
    applyRolePreset('CASHIER')
    setError(null)
    setIsCreateOpen(true)
  }

  const handleEmailChange = (val: string) => {
    setEmail(val)
    if (!username || username === email.split('@')[0]) {
      const generated = val.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || ''
      setUsername(generated)
    }
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Staff Full Name is required.')
      return
    }
    if (!email.trim()) {
      setError('Email address is required.')
      return
    }

    const finalUsername =
      username.trim() ||
      email.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') ||
      `user_${Date.now().toString().slice(-4)}`

    const finalBranchId = selectedBranchId === 'all' ? null : selectedBranchId

    const created = createStaffUser({
      name: name.trim(),
      email: email.trim(),
      username: finalUsername,
      password: password.trim() || '123456',
      pin: pin.trim() || '1234',
      role,
      branchId: finalBranchId,
      permissions,
    })

    setIsCreateOpen(false)
    setCreatedUserSuccess(created)
    toast.success(`Account for "${created.name}" created successfully!`)
  }

  const handleTogglePerm = (user: User, key: StaffPermissionKey) => {
    const current = user.permissions || ({} as Record<StaffPermissionKey, boolean>)
    const updated = { ...current, [key]: !current[key] }
    updateStaffPermissions(user.id, updated)
    if (editingPermissionsUser?.id === user.id) {
      setEditingPermissionsUser({ ...user, permissions: updated })
    }
    toast.success('Permissions updated')
  }

  const handlePasswordReset = (user: User) => {
    resetUserPassword(user.id)
    setPasswordResetTarget(user)
    setPasswordResetSuccess(true)
  }

  const handleLoginAsUser = (targetUser: User) => {
    switchUser(targetUser.id)
    auth.setUser({
      accountNo: targetUser.id,
      email: targetUser.email,
      role: [targetUser.role],
      exp: Date.now() + 24 * 60 * 60 * 1000,
    })
    auth.setAccessToken(`auth-token-${targetUser.id}`)
    toast.success(`Switched account to ${targetUser.name} (${targetUser.role})`)

    if (targetUser.role === 'CASHIER') {
      navigate({ to: '/invoices' })
    } else {
      navigate({ to: '/dashboard' })
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  // Group permissions by category
  const categoriesList = ['POS & Invoicing', 'Products Hub', 'Excel Operations', 'Store Management'] as const

  return (
    <>
      <Header>
        <div className='flex items-center gap-2'>
          <h1 className='font-semibold text-sm'>Team & Cashiers</h1>
          <Badge variant='outline' className='text-xs'>
            {merchant?.name || 'Store'}
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
            <h2 className='text-2xl font-bold tracking-tight'>Cashiers & Staff Management</h2>
            <p className='text-xs text-muted-foreground'>
              Add cashiers, store supervisors, and customize granular permissions. Each user logs in and only sees their assigned view.
            </p>
          </div>
          <Button size='sm' onClick={openCreate} className='bg-[#3EEA85] text-black hover:bg-[#3EEA85]/90 font-bold'>
            <Plus className='mr-1.5 size-4' />
            Add Cashier or Staff
          </Button>
        </div>

        {/* Staff Members List */}
        <div className='grid gap-4'>
          {merchantUsers.length === 0 ? (
            <Card>
              <CardContent className='p-8 text-center text-muted-foreground text-xs'>
                No team members found for this store. Click &quot;Add Cashier or Staff&quot; to create your first cashier account.
              </CardContent>
            </Card>
          ) : (
            merchantUsers.map((member) => {
              const assignedBranch = branches.find((b) => b.id === member.branchId)
              const isManager = member.role === 'MERCHANT_MANAGER'
              const isCashier = member.role === 'CASHIER'

              return (
                <Card
                  key={member.id}
                  className='hover:border-primary/50 transition-all shadow-sm rounded-2xl bg-card border-border/80'
                >
                  <CardContent className='p-5 space-y-4'>
                    <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4'>
                      <div className='flex items-start sm:items-center gap-3.5'>
                        <div
                          className={`flex size-11 items-center justify-center rounded-2xl font-black text-sm shrink-0 border ${
                            isCashier
                              ? 'bg-[#3EEA85]/15 text-[#3EEA85] border-[#3EEA85]/30'
                              : isManager
                              ? 'bg-neutral-900 text-white dark:bg-white dark:text-black border-neutral-800'
                              : 'bg-primary/10 text-primary border-primary/20'
                          }`}
                        >
                          {isCashier ? (
                            <CreditCard className='size-5' />
                          ) : isManager ? (
                            <Shield className='size-5' />
                          ) : (
                            <Users className='size-5' />
                          )}
                        </div>

                        <div>
                          <div className='flex flex-wrap items-center gap-2'>
                            <h4 className='font-bold text-sm text-foreground'>{member.name}</h4>

                            {isManager && (
                              <Badge className='bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-[10px]'>
                                Store Owner / Manager
                              </Badge>
                            )}
                            {isCashier && (
                              <Badge className='bg-[#3EEA85]/20 text-[#3EEA85] border border-[#3EEA85]/30 font-bold text-[10px]'>
                                Cashier (POS)
                              </Badge>
                            )}
                            {member.role === 'MERCHANT_STAFF' && (
                              <Badge variant='secondary' className='font-bold text-[10px]'>
                                Store Staff
                              </Badge>
                            )}

                            {assignedBranch ? (
                              <Badge variant='outline' className='text-[10px] gap-1 text-muted-foreground'>
                                <Store className='size-3' />
                                {assignedBranch.name}
                              </Badge>
                            ) : (
                              <Badge variant='outline' className='text-[10px] text-muted-foreground'>
                                All Branches
                              </Badge>
                            )}
                          </div>

                          <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1'>
                            <span>
                              Email: <strong className='text-foreground'>{member.email}</strong>
                            </span>
                            {member.username && (
                              <span>
                                Username: <code className='rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-primary'>{member.username}</code>
                              </span>
                            )}
                            <span className='flex items-center gap-1'>
                              POS PIN: <code className='rounded bg-[#3EEA85]/15 text-[#3EEA85] px-1.5 py-0.5 font-mono text-[11px] font-bold'>{member.pin || '1234'}</code>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className='flex flex-wrap items-center gap-2'>
                        <Button
                          size='sm'
                          variant='outline'
                          className='h-8 text-xs px-2.5 gap-1.5 rounded-xl border-border/80 hover:bg-[#3EEA85]/10 hover:text-[#3EEA85]'
                          onClick={() => handleLoginAsUser(member)}
                        >
                          <LogIn className='size-3.5 text-primary' /> Log in as this user
                        </Button>

                        {!isManager && (
                          <>
                            <Button
                              size='sm'
                              variant='outline'
                              className='h-8 text-xs px-2.5 gap-1.5 rounded-xl border-border/80'
                              onClick={() => handlePasswordReset(member)}
                            >
                              <KeyRound className='size-3.5' /> Reset Pass
                            </Button>
                            <Button
                              size='sm'
                              variant='secondary'
                              className='h-8 text-xs px-2.5 gap-1.5 rounded-xl'
                              onClick={() => setEditingPermissionsUser(member)}
                            >
                              <Shield className='size-3.5' /> Permissions
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Permissions Badges */}
                    {!isManager && (
                      <div className='border-t border-border/60 pt-3'>
                        <div className='flex items-center justify-between mb-2'>
                          <span className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>
                            Assigned Permissions (Click badge to toggle):
                          </span>
                        </div>
                        <div className='flex flex-wrap gap-1.5'>
                          {ALL_STAFF_PERMISSIONS.map(({ key, label }) => {
                            const granted = member.permissions?.[key] ?? false
                            return (
                              <Badge
                                key={key}
                                variant={granted ? 'default' : 'outline'}
                                className={`text-[10px] cursor-pointer transition-all ${
                                  granted
                                    ? 'bg-[#3EEA85] text-black font-semibold shadow-sm'
                                    : 'text-muted-foreground opacity-50 hover:opacity-80'
                                }`}
                                onClick={() => handleTogglePerm(member, key)}
                              >
                                {granted ? <Check className='size-2.5 mr-1' /> : <X className='size-2.5 mr-1' />}
                                {label}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </Main>

      {/* Add Cashier / Staff Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6'>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle className='text-lg font-bold flex items-center gap-2'>
                <UserCheck className='size-5 text-primary' /> Add New Cashier or Staff Member
              </DialogTitle>
              <DialogDescription className='text-xs'>
                Create login credentials for your store team and specify their access role and branch assignment.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className='p-3 my-3 text-xs text-destructive rounded-xl bg-destructive/10 border border-destructive/20'>
                {error}
              </div>
            )}

            <div className='space-y-5 my-4 text-xs'>
              {/* 1. Account Role */}
              <div>
                <label className='font-bold block mb-2 text-foreground text-xs uppercase tracking-wider'>
                  1. Account Role *
                </label>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  <button
                    type='button'
                    onClick={() => applyRolePreset('CASHIER')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      role === 'CASHIER'
                        ? 'border-[#00d632] bg-[#e8f9ec] dark:bg-[#00d632]/10 ring-2 ring-[#00d632]'
                        : 'border-border/80 bg-card hover:border-border'
                    }`}
                  >
                    <div className='flex items-center justify-between font-bold text-sm text-foreground'>
                      <span>Cashier</span>
                      {role === 'CASHIER' && <Check className='size-4 text-[#19832e]' />}
                    </div>
                    <p className='text-[11px] text-muted-foreground mt-1 leading-relaxed'>
                      Dedicated to POS terminal, barcode scanning, checkout, and issuing receipts.
                    </p>
                  </button>

                  <button
                    type='button'
                    onClick={() => applyRolePreset('MERCHANT_STAFF')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      role === 'MERCHANT_STAFF'
                        ? 'border-primary bg-primary/10 ring-2 ring-primary'
                        : 'border-border/80 bg-card hover:border-border'
                    }`}
                  >
                    <div className='flex items-center justify-between font-bold text-sm text-foreground'>
                      <span>Store Staff / Assistant</span>
                      {role === 'MERCHANT_STAFF' && <Check className='size-4 text-primary' />}
                    </div>
                    <p className='text-[11px] text-muted-foreground mt-1 leading-relaxed'>
                      Manages products catalog, inventory, categories, and operational reports.
                    </p>
                  </button>
                </div>
              </div>

              {/* 2. Personal Information */}
              <div>
                <label className='font-bold block mb-2 text-foreground text-xs uppercase tracking-wider'>
                  2. Personal Information *
                </label>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  <div>
                    <label className='font-semibold block mb-1 text-muted-foreground'>Full Name</label>
                    <Input
                      required
                      placeholder='e.g. John Doe'
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className='text-xs h-9 rounded-xl'
                    />
                  </div>

                  <div>
                    <label className='font-semibold block mb-1 text-muted-foreground'>Email Address</label>
                    <Input
                      required
                      type='email'
                      placeholder='e.g. john@store.com'
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      className='text-xs h-9 rounded-xl'
                    />
                  </div>
                </div>
              </div>

              {/* 3. Credentials & Store Assignment */}
              <div>
                <label className='font-bold block mb-2 text-foreground text-xs uppercase tracking-wider'>
                  3. Credentials & Store Assignment
                </label>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  <div>
                    <label className='font-semibold block mb-1 text-muted-foreground'>Login Username</label>
                    <Input
                      placeholder='e.g. jdoe'
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className='text-xs h-9 rounded-xl font-mono'
                    />
                  </div>

                  <div>
                    <label className='font-semibold block mb-1 text-muted-foreground'>Initial Password</label>
                    <Input
                      type='text'
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className='text-xs h-9 rounded-xl font-mono'
                    />
                  </div>

                  <div>
                    <div className='flex items-center justify-between mb-1'>
                      <label className='font-semibold text-muted-foreground'>POS Quick PIN</label>
                      <span className='text-[10px] text-[#19832e] font-mono font-bold'>4-6 Digits</span>
                    </div>
                    <Input
                      type='text'
                      inputMode='numeric'
                      maxLength={6}
                      placeholder='1234'
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      className='text-xs h-9 rounded-xl font-mono font-bold tracking-widest text-center border-[#00d632]/50 focus:border-[#00d632]'
                    />
                  </div>

                  <div>
                    <label className='font-semibold block mb-1 text-muted-foreground'>Assigned Branch</label>
                    <select
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                      className='w-full rounded-xl border border-border/80 bg-background px-3 h-9 text-xs text-foreground font-medium'
                    >
                      <option value='all'>All Branches</option>
                      {storeBranches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 4. Granular Permissions */}
              <div className='pt-2'>
                <div className='flex items-center justify-between mb-2'>
                  <label className='font-bold text-foreground text-xs uppercase tracking-wider'>
                    4. Granular Access Permissions
                  </label>
                  <div className='flex items-center gap-2'>
                    <button
                      type='button'
                      onClick={() => {
                        const allOn = { ...permissions }
                        ALL_STAFF_PERMISSIONS.forEach((p) => {
                          allOn[p.key] = true
                        })
                        setPermissions(allOn)
                      }}
                      className='text-[11px] text-primary hover:underline'
                    >
                      Enable All
                    </button>
                    <span className='text-muted-foreground'>•</span>
                    <button
                      type='button'
                      onClick={() => {
                        const allOff = { ...permissions }
                        ALL_STAFF_PERMISSIONS.forEach((p) => {
                          allOff[p.key] = false
                        })
                        setPermissions(allOff)
                      }}
                      className='text-[11px] text-muted-foreground hover:underline'
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className='space-y-4 max-h-[300px] overflow-y-auto pr-1'>
                  {categoriesList.map((cat) => {
                    const catPerms = ALL_STAFF_PERMISSIONS.filter((p) => p.category === cat)
                    return (
                      <div key={cat} className='rounded-2xl border border-border/70 p-3 bg-muted/20'>
                        <h5 className='font-bold text-[11px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5'>
                          <Layers className='size-3 text-primary' /> {cat}
                        </h5>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                          {catPerms.map(({ key, label, desc }) => (
                            <div
                              key={key}
                              className='flex items-center justify-between gap-2 p-2 rounded-xl border border-border/50 bg-card text-xs'
                            >
                              <div className='pr-2'>
                                <p className='font-bold text-xs leading-none text-foreground'>{label}</p>
                                <p className='text-[10px] text-muted-foreground mt-0.5 line-clamp-1'>{desc}</p>
                              </div>
                              <Switch
                                checked={permissions[key] ?? false}
                                onCheckedChange={(checked) =>
                                  setPermissions((prev) => ({ ...prev, [key]: checked }))
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <DialogFooter className='gap-2 sm:gap-0'>
              <Button type='button' variant='outline' size='sm' onClick={() => setIsCreateOpen(false)} className='rounded-xl'>
                Cancel
              </Button>
              <Button type='submit' size='sm' className='rounded-xl bg-[#3EEA85] text-black hover:bg-[#3EEA85]/90 font-bold'>
                Create Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Dialog with Login Credentials */}
      <Dialog
        open={!!createdUserSuccess}
        onOpenChange={(open) => !open && setCreatedUserSuccess(null)}
      >
        <DialogContent className='max-w-md rounded-3xl p-6'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-emerald-600 dark:text-emerald-400'>
              <Sparkles className='size-5' /> Account Created Successfully!
            </DialogTitle>
            <DialogDescription className='text-xs'>
              The new account is ready. You can share these login credentials with the user or switch to their account now to test their permissions.
            </DialogDescription>
          </DialogHeader>

          {createdUserSuccess && (
            <div className='my-3 space-y-3'>
              <div className='p-4 rounded-2xl border border-primary/20 bg-primary/5 space-y-2 text-xs'>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground font-medium'>Name:</span>
                  <strong className='text-foreground font-bold'>{createdUserSuccess.name}</strong>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground font-medium'>Role:</span>
                  <Badge className='bg-[#3EEA85] text-black font-bold text-[10px]'>
                    {createdUserSuccess.role}
                  </Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground font-medium'>Username:</span>
                  <div className='flex items-center gap-1.5'>
                    <code className='rounded bg-muted px-2 py-0.5 font-mono font-bold text-foreground'>
                      {createdUserSuccess.username || createdUserSuccess.email.split('@')[0]}
                    </code>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='size-6'
                      onClick={() =>
                        copyToClipboard(
                          createdUserSuccess.username || createdUserSuccess.email.split('@')[0],
                          'Username'
                        )
                      }
                    >
                      <Copy className='size-3' />
                    </Button>
                  </div>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground font-medium'>Password:</span>
                  <div className='flex items-center gap-1.5'>
                    <code className='rounded bg-muted px-2 py-0.5 font-mono font-bold text-foreground'>
                      {createdUserSuccess.password || '123456'}
                    </code>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='size-6'
                      onClick={() =>
                        copyToClipboard(createdUserSuccess.password || '123456', 'Password')
                      }
                    >
                      <Copy className='size-3' />
                    </Button>
                  </div>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground font-medium'>POS PIN:</span>
                  <div className='flex items-center gap-1.5'>
                    <code className='rounded bg-[#3EEA85]/20 text-[#3EEA85] px-2 py-0.5 font-mono font-bold'>
                      {createdUserSuccess.pin || '1234'}
                    </code>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='size-6'
                      onClick={() =>
                        copyToClipboard(createdUserSuccess.pin || '1234', 'POS PIN')
                      }
                    >
                      <Copy className='size-3' />
                    </Button>
                  </div>
                </div>
              </div>

              <div className='flex flex-col gap-2'>
                <Button
                  className='w-full rounded-xl bg-[#3EEA85] text-black hover:bg-[#3EEA85]/90 font-bold'
                  onClick={() => {
                    const target = createdUserSuccess
                    setCreatedUserSuccess(null)
                    handleLoginAsUser(target)
                  }}
                >
                  <LogIn className='size-4 mr-2' /> Test Login as this User Now
                </Button>
                <Button
                  variant='outline'
                  className='w-full rounded-xl'
                  onClick={() => setCreatedUserSuccess(null)}
                >
                  Close & Continue
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Modal */}
      <Dialog
        open={!!editingPermissionsUser}
        onOpenChange={(open) => !open && setEditingPermissionsUser(null)}
      >
        <DialogContent className='max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl p-6'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Shield className='size-5 text-primary' /> Permissions for {editingPermissionsUser?.name}
            </DialogTitle>
            <DialogDescription className='text-xs'>
              Toggle permissions individually. Changes reflect immediately in this user&apos;s active session.
            </DialogDescription>
          </DialogHeader>

          <div className='my-3 space-y-4'>
            {categoriesList.map((cat) => {
              const catPerms = ALL_STAFF_PERMISSIONS.filter((p) => p.category === cat)
              return (
                <div key={cat} className='rounded-2xl border border-border/70 p-3 bg-muted/20'>
                  <h5 className='font-bold text-[11px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5'>
                    <Layers className='size-3 text-primary' /> {cat}
                  </h5>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                    {catPerms.map(({ key, label, desc }) => {
                      const granted = editingPermissionsUser?.permissions?.[key] ?? false
                      return (
                        <div
                          key={key}
                          className='flex items-center justify-between gap-2 p-2.5 rounded-xl border border-border/50 bg-card text-xs'
                        >
                          <div className='pr-2'>
                            <p className='font-bold text-xs leading-none text-foreground'>{label}</p>
                            <p className='text-[10px] text-muted-foreground mt-0.5 line-clamp-1'>{desc}</p>
                          </div>
                          <Switch
                            checked={granted}
                            onCheckedChange={() =>
                              editingPermissionsUser &&
                              handleTogglePerm(editingPermissionsUser, key)
                            }
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <DialogFooter>
            <Button size='sm' className='rounded-xl' onClick={() => setEditingPermissionsUser(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Confirmation Dialog */}
      <Dialog
        open={passwordResetSuccess}
        onOpenChange={(open) => {
          if (!open) {
            setPasswordResetSuccess(false)
            setPasswordResetTarget(null)
          }
        }}
      >
        <DialogContent className='max-w-sm rounded-3xl p-6'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-[#3EEA85]'>
              <Check className='size-5' /> Password Reset Issued
            </DialogTitle>
            <DialogDescription className='text-xs'>
              The password for <strong>{passwordResetTarget?.email}</strong> has been reset to default{' '}
              <code className='rounded bg-muted px-1.5 py-0.5 font-mono font-bold text-foreground'>
                123456
              </code>
              .
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              size='sm'
              className='rounded-xl'
              onClick={() => {
                setPasswordResetSuccess(false)
                setPasswordResetTarget(null)
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
