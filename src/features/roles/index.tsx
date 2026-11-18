import * as React from 'react'
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Lock,
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { LanguageSwitch } from '@/components/language-switch'
import { useSaaSStore } from '@/lib/saas-store'
import { CustomRole } from '@/types/saas'
import { RoleMutateDialog } from './components/role-mutate-dialog'
import { RoleDetailsSheet } from './components/role-details-sheet'

export function RolesManagementView() {
  const { roles, merchants, deleteRole } = useSaaSStore()

  // State
  const [searchTerm, setSearchTerm] = React.useState('')
  const [scopeFilter, setScopeFilter] = React.useState<string>('all')
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingRole, setEditingRole] = React.useState<CustomRole | null>(null)
  const [selectedRole, setSelectedRole] = React.useState<CustomRole | null>(null)

  // Filter roles
  const filteredRoles = (roles || []).filter((role) => {
    const matchesSearch =
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesScope =
      scopeFilter === 'all' ||
      role.scope === scopeFilter

    return matchesSearch && matchesScope
  })

  const openCreate = () => {
    setEditingRole(null)
    setIsCreateOpen(true)
  }

  const openEdit = (role: CustomRole) => {
    setEditingRole(role)
    setIsCreateOpen(true)
  }

  return (
    <>
      <Header>
        <div className='flex items-center gap-2'>
          <h1 className='font-semibold text-sm'>Platform Super Admin</h1>
          <Badge variant='default' className='text-xs'>
            Roles & Permissions
          </Badge>
        </div>
        <div className='ms-auto flex items-center gap-2'>
          <LanguageSwitch />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-5 p-4 md:p-6'>
        {/* Page Title & Add Role Button */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Roles & Permissions</h2>
            <p className='text-xs text-muted-foreground'>
              Manage platform roles, tenant scopes, and granular system permissions.
            </p>
          </div>
          <Button size='sm' onClick={openCreate}>
            <Plus className='mr-1.5 size-4' />
            Add Role
          </Button>
        </div>

        {/* Main Card with Filter Bar and Table */}
        <Card className='p-0 overflow-hidden border border-border/80 shadow-[0_2px_16px_rgba(0,0,0,0.04)] rounded-2xl'>
          {/* Filter Bar */}
          <div className='p-4 md:p-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card'>
            <div className='flex items-center gap-3 flex-1 max-w-sm'>
              <Input
                placeholder='Search roles by name or description...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='text-xs h-9 rounded-xl bg-background border-border/80'
              />
            </div>
            <div className='flex items-center gap-3'>
              <select
                value={scopeFilter}
                onChange={(e) => setScopeFilter(e.target.value)}
                className='rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs text-foreground font-medium h-9'
              >
                <option value='all'>All Scopes</option>
                <option value='COMPANY'>Company Roles</option>
                <option value='MERCHANT'>Merchant Roles</option>
              </select>
              <Badge variant='outline' className='text-xs text-muted-foreground font-semibold px-2.5 py-1 rounded-lg'>
                {filteredRoles.length} {filteredRoles.length === 1 ? 'Role' : 'Roles'}
              </Badge>
            </div>
          </div>

          {/* Table Container */}
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow className='hover:bg-transparent border-b border-border/60 bg-muted/25'>
                  <TableHead className='ps-5 py-3.5 text-xs font-semibold text-muted-foreground'>
                    Role / Position
                  </TableHead>
                  <TableHead className='py-3.5 text-xs font-semibold text-muted-foreground'>
                    Scope
                  </TableHead>
                  <TableHead className='py-3.5 text-xs font-semibold text-muted-foreground'>
                    Target Merchant
                  </TableHead>
                  <TableHead className='py-3.5 text-xs font-semibold text-muted-foreground text-center'>
                    Permissions
                  </TableHead>
                  <TableHead className='py-3.5 text-xs font-semibold text-muted-foreground text-center'>
                    Type
                  </TableHead>
                  <TableHead className='pe-5 py-3.5 text-xs font-semibold text-muted-foreground text-end'>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className='h-48 text-center text-muted-foreground text-xs'>
                      <Shield className='size-8 mx-auto mb-2 opacity-20' />
                      <p className='font-semibold'>No roles found</p>
                      <p className='text-[11px] mt-0.5'>Try adjusting your search or scope filter.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRoles.map((role) => {
                    const merchant = role.merchantId
                      ? merchants.find((m) => m.id === role.merchantId)
                      : null

                    const isCompanyScope = role.scope === 'COMPANY'

                    return (
                      <tr
                        key={role.id}
                        onClick={() => setSelectedRole(role)}
                        className='group border-b border-border/40 hover:bg-muted/30 transition-colors cursor-pointer'
                      >
                        {/* Role / Position */}
                        <td className='ps-5 py-3.5'>
                          <div className='flex items-center gap-3'>
                            <div className='size-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs'>
                              <Shield className='size-5' />
                            </div>
                            <div className='min-w-0'>
                              <div className='font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors flex items-center gap-1.5'>
                                <span>{role.name}</span>
                                {role.isSystem && (
                                  <Lock className='size-3 text-muted-foreground' />
                                )}
                              </div>
                              <div className='text-xs text-muted-foreground truncate max-w-md'>
                                {role.description}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Scope */}
                        <td className='py-3.5'>
                          <Badge
                            variant='outline'
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-lg border ${
                              isCompanyScope
                                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/40'
                                : 'bg-muted/60 text-muted-foreground border-border/70'
                            }`}
                          >
                            {role.scope}
                          </Badge>
                        </td>

                        {/* Target Merchant */}
                        <td className='py-3.5'>
                          {isCompanyScope ? (
                            <span className='text-xs text-foreground font-medium'>
                              Platform & Company Root
                            </span>
                          ) : merchant ? (
                            <Badge variant='outline' className='text-xs font-semibold bg-muted/40'>
                              🏪 {merchant.name}
                            </Badge>
                          ) : (
                            <span className='text-xs text-muted-foreground'>
                              🌐 All Merchants (Global)
                            </span>
                          )}
                        </td>

                        {/* Permissions */}
                        <td className='py-3.5 text-center'>
                          <Badge
                            variant='outline'
                            className='font-mono font-bold text-xs px-2.5 py-0.5 bg-muted/30 border-border/70'
                          >
                            {role.permissions.includes('*')
                              ? 'All (*)'
                              : `${role.permissions.length} permissions`}
                          </Badge>
                        </td>

                        {/* Type */}
                        <td className='py-3.5 text-center'>
                          {role.isSystem ? (
                            <Badge variant='outline' className='text-xs text-muted-foreground'>
                              System Default
                            </Badge>
                          ) : (
                            <Badge variant='outline' className='text-xs bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200/50'>
                              Custom
                            </Badge>
                          )}
                        </td>

                        {/* Actions */}
                        <td
                          className='pe-5 py-3.5 text-end'
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size='sm'
                                variant='ghost'
                                className='h-8 px-2 text-xs rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground'
                              >
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end' className='w-40 text-xs rounded-xl shadow-lg'>
                              <DropdownMenuItem
                                onClick={() => setSelectedRole(role)}
                                className='cursor-pointer rounded-lg'
                              >
                                <Eye className='mr-2 size-3.5 text-muted-foreground' /> View Details
                              </DropdownMenuItem>
                              {!role.isSystem && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => openEdit(role)}
                                    className='cursor-pointer rounded-lg'
                                  >
                                    <Edit2 className='mr-2 size-3.5 text-primary' /> Edit Role
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to delete role "${role.name}"?`)) {
                                        deleteRole(role.id)
                                      }
                                    }}
                                    className='cursor-pointer rounded-lg text-rose-600 dark:text-rose-400 focus:text-rose-600'
                                  >
                                    <Trash2 className='mr-2 size-3.5' /> Delete Role
                                  </DropdownMenuItem>
                                </>
                              )}
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

      {/* Mutate Dialog (Add / Edit Role) */}
      <RoleMutateDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        role={editingRole}
      />

      {/* Role Details Sheet (Side Drawer from Right) */}
      <RoleDetailsSheet
        role={selectedRole}
        open={!!selectedRole}
        onOpenChange={(open) => {
          if (!open) setSelectedRole(null)
        }}
        onEdit={(r) => {
          openEdit(r)
        }}
        onDelete={(id) => {
          deleteRole(id)
        }}
      />
    </>
  )
}
