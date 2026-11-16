import * as React from 'react'
import {
  Plus,
  Users,
  Shield,
  KeyRound,
  Check,
  X,
} from 'lucide-react'
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
import { useSaaSStore } from '@/lib/saas-store'
import { User, StaffPermissionKey } from '@/types/saas'

const ALL_STAFF_PERMISSIONS: { key: StaffPermissionKey; label: string; desc: string }[] = [
  { key: 'products.view', label: 'View Products', desc: 'Browse store catalog and view prices' },
  { key: 'products.create', label: 'Create Products', desc: 'Add new items to the merchant catalog' },
  { key: 'products.edit', label: 'Edit Products', desc: 'Update prices, names, barcodes, and images' },
  { key: 'products.delete', label: 'Delete Products', desc: 'Remove products permanently from catalog' },
  { key: 'categories.manage', label: 'Manage Categories', desc: 'Create, edit, and organize product categories' },
  { key: 'excel.import', label: 'Excel Import', desc: 'Perform bulk import operations' },
  { key: 'excel.bulk_edit', label: 'Excel Bulk Edit', desc: 'Update products in bulk via spreadsheets' },
  { key: 'excel.bulk_delete', label: 'Excel Bulk Delete', desc: 'Bulk remove products via spreadsheets' },
]

export function StaffManagementView() {
  const {
    currentUser,
    merchants,
    users,
    createStaffUser,
    updateStaffPermissions,
    resetUserPassword,
  } = useSaaSStore()

  const merchantId = currentUser.merchantId || merchants[0].id
  const merchant = merchants.find((m) => m.id === merchantId)

  // Users belonging to this merchant only! (Section 2.1)
  const merchantUsers = users.filter((u) => u.merchantId === merchantId)
  const staffMembers = merchantUsers.filter((u) => u.role === 'MERCHANT_STAFF')

  // Modals
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingPermissionsUser, setEditingPermissionsUser] = React.useState<User | null>(null)
  const [passwordResetTarget, setPasswordResetTarget] = React.useState<User | null>(null)
  const [passwordResetSuccess, setPasswordResetSuccess] = React.useState(false)

  // Form Fields
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [permissions, setPermissions] = React.useState<Record<StaffPermissionKey, boolean>>({
    'products.view': true,
    'products.create': true,
    'products.edit': false,
    'products.delete': false,
    'categories.manage': false,
    'excel.import': false,
    'excel.bulk_edit': false,
    'excel.bulk_delete': false,
  })
  const [error, setError] = React.useState<string | null>(null)

  const openCreate = () => {
    setName('')
    setEmail('')
    setPermissions({
      'products.view': true,
      'products.create': true,
      'products.edit': false,
      'products.delete': false,
      'categories.manage': false,
      'excel.import': false,
      'excel.bulk_edit': false,
      'excel.bulk_delete': false,
    })
    setError(null)
    setIsCreateOpen(true)
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      setError('Name and Email are required.')
      return
    }
    createStaffUser(name.trim(), email.trim(), permissions)
    setIsCreateOpen(false)
  }

  const handleTogglePerm = (user: User, key: StaffPermissionKey) => {
    const current = user.permissions || ({} as Record<StaffPermissionKey, boolean>)
    const updated = { ...current, [key]: !current[key] }
    updateStaffPermissions(user.id, updated)
    if (editingPermissionsUser?.id === user.id) {
      setEditingPermissionsUser({ ...user, permissions: updated })
    }
  }

  const handlePasswordReset = (user: User) => {
    resetUserPassword(user.id)
    setPasswordResetTarget(user)
    setPasswordResetSuccess(true)
  }

  return (
    <>
      <Header>
        <div className='flex items-center gap-2'>
          <h1 className='font-semibold text-sm'>Staff & Permissions</h1>
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
            <h2 className='text-2xl font-bold tracking-tight'>Merchant Staff Users</h2>
            <p className='text-xs text-muted-foreground'>
              Section 3.3: Configure individual granular permissions for each staff member. Staff only access their own merchant data.
            </p>
          </div>
          <Button size='sm' onClick={openCreate}>
            <Plus className='mr-1.5 size-4' />
            Add Staff Member
          </Button>
        </div>

        {/* Staff Members List */}
        <div className='grid gap-4'>
          {staffMembers.length === 0 ? (
            <Card>
              <CardContent className='p-8 text-center text-muted-foreground text-xs'>
                No staff members created yet. Click &quot;Add Staff Member&quot; to invite a team member.
              </CardContent>
            </Card>
          ) : (
            staffMembers.map((member) => (
              <Card key={member.id} className='hover:border-primary/50 transition-colors'>
                <CardContent className='p-4 space-y-4'>
                  <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                    <div className='flex items-center gap-3'>
                      <div className='flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold'>
                        <Users className='size-5' />
                      </div>
                      <div>
                        <div className='flex items-center gap-2'>
                          <h4 className='font-bold text-sm text-foreground'>{member.name}</h4>
                          <Badge variant={member.status === 'Active' ? 'default' : 'secondary'} className='text-[10px]'>
                            {member.status}
                          </Badge>
                        </div>
                        <p className='text-xs text-muted-foreground'>{member.email}</p>
                      </div>
                    </div>

                    <div className='flex items-center gap-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        className='h-7 text-xs px-2 gap-1.5'
                        onClick={() => handlePasswordReset(member)}
                      >
                        <KeyRound className='size-3.5' /> Reset Password
                      </Button>
                      <Button
                        size='sm'
                        variant='secondary'
                        className='h-7 text-xs px-2 gap-1.5'
                        onClick={() => setEditingPermissionsUser(member)}
                      >
                        <Shield className='size-3.5' /> Manage Permissions
                      </Button>
                    </div>
                  </div>

                  {/* Permissions Pills Preview */}
                  <div className='border-t pt-3'>
                    <span className='text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2'>
                      Assigned Granular Permissions:
                    </span>
                    <div className='flex flex-wrap gap-1.5'>
                      {ALL_STAFF_PERMISSIONS.map(({ key, label }) => {
                        const granted = member.permissions?.[key] ?? false
                        return (
                          <Badge
                            key={key}
                            variant={granted ? 'default' : 'outline'}
                            className={`text-[10px] cursor-pointer transition-colors ${
                              granted
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground opacity-50'
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
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </Main>

      {/* Add Staff Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className='max-w-md max-h-[85vh] overflow-y-auto'>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
              <DialogDescription className='text-xs'>
                Create an operational account for your store staff and select their initial permissions.
              </DialogDescription>
            </DialogHeader>

            {error && <p className='text-xs text-destructive mt-2'>{error}</p>}

            <div className='space-y-3 my-4 text-xs'>
              <div>
                <label className='font-semibold block mb-1'>Staff Full Name *</label>
                <Input
                  required
                  placeholder='e.g. Sara Ali'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className='text-xs'
                />
              </div>

              <div>
                <label className='font-semibold block mb-1'>Email Address *</label>
                <Input
                  required
                  type='email'
                  placeholder='sara@metro.com'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className='text-xs'
                />
              </div>

              <div className='pt-2'>
                <label className='font-semibold block mb-2 text-foreground'>
                  Configure Individual Permissions:
                </label>
                <div className='space-y-2 rounded-md border p-3 bg-muted/30'>
                  {ALL_STAFF_PERMISSIONS.map(({ key, label, desc }) => (
                    <div key={key} className='flex items-center justify-between gap-2 py-1 border-b last:border-0'>
                      <div>
                        <p className='font-semibold text-xs leading-none'>{label}</p>
                        <p className='text-[10px] text-muted-foreground mt-0.5'>{desc}</p>
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
            </div>

            <DialogFooter>
              <Button type='button' variant='outline' size='sm' onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type='submit' size='sm'>
                Create Staff Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Modal */}
      <Dialog
        open={!!editingPermissionsUser}
        onOpenChange={(open) => !open && setEditingPermissionsUser(null)}
      >
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Shield className='size-5 text-primary' /> Permissions for {editingPermissionsUser?.name}
            </DialogTitle>
            <DialogDescription className='text-xs'>
              Toggle permissions individually. Changes take effect immediately.
            </DialogDescription>
          </DialogHeader>

          <div className='my-3 space-y-2.5 max-h-[60vh] overflow-y-auto pr-1'>
            {ALL_STAFF_PERMISSIONS.map(({ key, label, desc }) => {
              const granted = editingPermissionsUser?.permissions?.[key] ?? false
              return (
                <div
                  key={key}
                  className='flex items-center justify-between gap-3 rounded-lg border p-2.5 bg-card text-xs'
                >
                  <div>
                    <div className='font-semibold text-foreground'>{label}</div>
                    <div className='text-[10px] text-muted-foreground'>{desc}</div>
                  </div>
                  <Switch
                    checked={granted}
                    onCheckedChange={() =>
                      editingPermissionsUser && handleTogglePerm(editingPermissionsUser, key)
                    }
                  />
                </div>
              )
            })}
          </div>

          <DialogFooter>
            <Button size='sm' onClick={() => setEditingPermissionsUser(null)}>
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
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-green-600 dark:text-green-400'>
              <Check className='size-5' /> Password Reset Issued
            </DialogTitle>
            <DialogDescription className='text-xs'>
              A password reset token has been registered in the system audit logs for{' '}
              <strong>{passwordResetTarget?.email}</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              size='sm'
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
