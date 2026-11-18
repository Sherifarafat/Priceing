import * as React from 'react'
import {
  Shield,
  CheckCheck,
  X,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSaaSStore } from '@/lib/saas-store'
import { CustomRole, RoleScope } from '@/types/saas'
import { SYSTEM_PERMISSIONS, PERMISSION_CATEGORIES } from '../data/permissions'

type RoleTypeOption = 'ADMIN' | 'MERCHANT' | 'MANAGER' | 'CASHIER'

interface RoleMutateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: CustomRole | null
}

const CASHIER_PERMISSIONS = [
  'merchant.products.view',
  'merchant.customer_scan.access',
  'merchant.branches.view',
]

const MANAGER_PERMISSIONS = [
  'merchant.products.view',
  'merchant.products.create',
  'merchant.products.edit',
  'merchant.products.delete',
  'merchant.categories.manage',
  'merchant.branches.view',
  'merchant.branches.manage',
  'merchant.excel.import',
  'merchant.excel.bulk_edit',
  'merchant.staff.view',
  'merchant.staff.manage',
  'merchant.analytics.view',
  'merchant.customer_scan.access',
]

export function RoleMutateDialog({
  open,
  onOpenChange,
  role,
}: RoleMutateDialogProps) {
  const { createRole, updateRole } = useSaaSStore()

  const [name, setName] = React.useState('')
  const [roleType, setRoleType] = React.useState<RoleTypeOption>('MERCHANT')
  const [description, setDescription] = React.useState('')
  const [selectedPermissions, setSelectedPermissions] = React.useState<string[]>([])
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (role) {
      setName(role.name)
      if (role.scope === 'COMPANY') {
        setRoleType('ADMIN')
      } else if (role.name.toLowerCase().includes('cashier')) {
        setRoleType('CASHIER')
      } else if (role.name.toLowerCase().includes('manager')) {
        setRoleType('MANAGER')
      } else {
        setRoleType('MERCHANT')
      }
      setDescription(role.description || '')
      setSelectedPermissions(role.permissions || [])
    } else {
      setName('')
      setRoleType('MERCHANT')
      setDescription('')
      // Default initial permissions for standard merchant role
      setSelectedPermissions([
        'merchant.products.view',
        'merchant.products.create',
        'merchant.products.edit',
        'merchant.categories.manage',
        'merchant.branches.view',
      ])
    }
    setError(null)
  }, [role, open])

  // Handle template selection when changing role type
  const handleRoleTypeChange = (newType: RoleTypeOption) => {
    setRoleType(newType)
    if (!name || name === 'Admin' || name === 'Merchant' || name === 'Manager' || name === 'Cashier') {
      if (newType === 'CASHIER') setName('Cashier')
      else if (newType === 'MANAGER') setName('Store Manager')
      else if (newType === 'ADMIN') setName('Admin')
      else setName('Merchant Role')
    }

    if (newType === 'ADMIN') {
      setSelectedPermissions(SYSTEM_PERMISSIONS.map((p) => p.key))
    } else if (newType === 'CASHIER') {
      setSelectedPermissions(CASHIER_PERMISSIONS)
    } else if (newType === 'MANAGER') {
      setSelectedPermissions(MANAGER_PERMISSIONS)
    } else {
      setSelectedPermissions([
        'merchant.products.view',
        'merchant.products.create',
        'merchant.products.edit',
        'merchant.categories.manage',
        'merchant.branches.view',
      ])
    }
  }

  const togglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    )
  }

  const selectAll = () => {
    setSelectedPermissions(SYSTEM_PERMISSIONS.map((p) => p.key))
  }

  const clearAll = () => {
    setSelectedPermissions([])
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Role Name is required.')
      return
    }

    if (selectedPermissions.length === 0) {
      setError('Please enable at least one permission.')
      return
    }

    const scope: RoleScope = roleType === 'ADMIN' ? 'COMPANY' : 'MERCHANT'

    if (role) {
      updateRole(role.id, {
        name: name.trim(),
        description: description.trim() || `${roleType} role`,
        scope,
        permissions: selectedPermissions,
      })
    } else {
      createRole({
        name: name.trim(),
        description: description.trim() || `${roleType} role created by Super Admin`,
        scope,
        merchantId: null,
        isSystem: false,
        permissions: selectedPermissions,
      })
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-hidden'>
        <form onSubmit={handleSave} className='flex flex-col h-full min-h-0'>
          {/* Header */}
          <DialogHeader className='p-6 pb-4 border-b border-border/60 bg-muted/20 shrink-0'>
            <div className='flex items-center gap-2.5'>
              <div className='size-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center font-bold shadow-2xs'>
                <Shield className='size-5' />
              </div>
              <div>
                <DialogTitle className='text-base font-bold'>
                  {role ? 'Edit Role' : 'Add New Role'}
                </DialogTitle>
                <DialogDescription className='text-xs mt-0.5'>
                  Configure role name, select role type, and toggle permissions.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {error && (
            <div className='mx-6 mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium'>
              {error}
            </div>
          )}

          <ScrollArea className='flex-1 px-6 py-4'>
            <div className='space-y-4 text-xs'>
              {/* Field 1: Role Name & Field 2: Dropdown (Merchant, Admin, Manager, Cashier) - NO ICONS */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <div>
                  <label className='font-semibold block mb-1 text-foreground'>
                    Role Name *
                  </label>
                  <Input
                    required
                    placeholder='e.g. Store Manager, Cashier, Supervisor...'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className='text-xs h-9'
                  />
                </div>

                <div>
                  <label className='font-semibold block mb-1 text-foreground'>
                    Role Type *
                  </label>
                  <select
                    value={roleType}
                    onChange={(e) => handleRoleTypeChange(e.target.value as RoleTypeOption)}
                    className='w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground h-9 font-medium'
                  >
                    <option value='MERCHANT'>Merchant</option>
                    <option value='ADMIN'>Admin</option>
                    <option value='MANAGER'>Manager</option>
                    <option value='CASHIER'>Cashier</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className='font-semibold block mb-1 text-foreground'>
                  Description (Optional)
                </label>
                <Input
                  placeholder='Brief summary of responsibilities and access level...'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className='text-xs h-9'
                />
              </div>

              {/* Field 3: Permissions List with Toggles (No Icons) */}
              <div className='pt-2'>
                <div className='flex items-center justify-between mb-3 pb-2 border-b border-border/60'>
                  <div>
                    <h4 className='font-bold text-xs text-foreground flex items-center gap-1.5'>
                      <Layers className='size-3.5 text-primary' />
                      System Permissions
                    </h4>
                    <p className='text-[11px] text-muted-foreground'>
                      {selectedPermissions.length} of {SYSTEM_PERMISSIONS.length} permissions activated
                    </p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={selectAll}
                      className='h-7 text-[11px] px-2.5 rounded-lg'
                    >
                      <CheckCheck className='size-3 mr-1 text-primary' />
                      Select All
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={clearAll}
                      className='h-7 text-[11px] px-2.5 rounded-lg'
                    >
                      <X className='size-3 mr-1 text-muted-foreground' />
                      Clear All
                    </Button>
                  </div>
                </div>

                {/* Permissions without item icons */}
                <div className='space-y-4'>
                  {PERMISSION_CATEGORIES.map((cat) => {
                    const perms = SYSTEM_PERMISSIONS.filter((p) => p.category === cat.category)

                    return (
                      <div
                        key={cat.category}
                        className='rounded-xl border border-border/70 p-3.5 bg-card/60 space-y-2.5'
                      >
                        <div className='flex items-center justify-between'>
                          <span className='text-xs font-bold text-foreground'>
                            {cat.title}
                          </span>
                          <Badge variant='outline' className='text-[10px] text-muted-foreground'>
                            {perms.filter((p) => selectedPermissions.includes(p.key)).length} / {perms.length} enabled
                          </Badge>
                        </div>

                        <div className='space-y-1.5 pt-1'>
                          {perms.map((p) => {
                            const isEnabled = selectedPermissions.includes(p.key)

                            return (
                              <div
                                key={p.key}
                                onClick={() => togglePermission(p.key)}
                                className={`flex items-center justify-between gap-3 p-2.5 rounded-lg border transition-all cursor-pointer ${
                                  isEnabled
                                    ? 'bg-primary/5 border-primary/30 text-foreground'
                                    : 'bg-background border-border/60 text-muted-foreground hover:bg-muted/30'
                                }`}
                              >
                                <div className='min-w-0 flex-1 pr-2'>
                                  <div className='font-semibold text-xs text-foreground'>
                                    {p.label}
                                  </div>
                                  <div className='text-[11px] text-muted-foreground mt-0.5 line-clamp-1'>
                                    {p.description}
                                  </div>
                                </div>

                                {/* Toggle Switch */}
                                <div
                                  className='shrink-0'
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Switch
                                    checked={isEnabled}
                                    onCheckedChange={() => togglePermission(p.key)}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Footer */}
          <DialogFooter className='p-4 border-t border-border/60 bg-muted/20 shrink-0 gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type='submit' size='sm'>
              {role ? 'Save Changes' : 'Create Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
