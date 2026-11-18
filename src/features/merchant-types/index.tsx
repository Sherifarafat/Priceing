import * as React from 'react'
import { Plus, FolderTree, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { MerchantType, EntityStatus } from '@/types/saas'

export function MerchantTypesView() {
  const { merchantTypes, merchants, createMerchantType, updateMerchantType } = useSaaSStore()

  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingType, setEditingType] = React.useState<MerchantType | null>(null)
  const [name, setName] = React.useState('')
  const [status, setStatus] = React.useState<EntityStatus>('Active')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    if (editingType) {
      updateMerchantType(editingType.id, name.trim(), status)
      setEditingType(null)
    } else {
      createMerchantType(name.trim())
      setIsCreateOpen(false)
    }
    setName('')
  }

  return (
    <>
      <Header>
        <div className='flex items-center gap-2'>
          <h1 className='font-semibold text-sm'>Platform Super Admin</h1>
          <Badge variant='default' className='text-xs'>
            Merchant Types
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
            <h2 className='text-2xl font-bold tracking-tight'>Merchant Business Types</h2>
            <p className='text-xs text-muted-foreground'>
              Section 2.3: Dynamic business categories. Super Admin can create, edit, enable, and disable types.
            </p>
          </div>
          <Button
            size='sm'
            onClick={() => {
              setName('')
              setStatus('Active')
              setIsCreateOpen(true)
            }}
          >
            <Plus className='mr-1.5 size-4' />
            Create Merchant Type
          </Button>
        </div>

        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {merchantTypes.map((type) => {
            const count = merchants.filter((m) => m.merchantTypeId === type.id).length
            return (
              <Card key={type.id} className='hover:border-primary/50 transition-colors'>
                <CardContent className='p-4 flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='flex size-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40'>
                      <FolderTree className='size-5' />
                    </div>
                    <div>
                      <h4 className='font-bold text-sm text-foreground'>{type.name}</h4>
                      <p className='text-xs text-muted-foreground mt-0.5'>{count} enrolled merchants</p>
                    </div>
                  </div>

                  <div className='flex items-center gap-2'>
                    <Badge variant={type.status === 'Active' ? 'default' : 'secondary'} className='text-[10px]'>
                      {type.status}
                    </Badge>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='size-8'
                      onClick={() => {
                        setEditingType(type)
                        setName(type.name)
                        setStatus(type.status)
                      }}
                    >
                      <Edit2 className='size-3.5' />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </Main>

      <Dialog
        open={isCreateOpen || !!editingType}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false)
            setEditingType(null)
          }
        }}
      >
        <DialogContent className='max-w-sm'>
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{editingType ? 'Edit Merchant Type' : 'Create Merchant Type'}</DialogTitle>
              <DialogDescription className='text-xs'>
                Define dynamic business types for merchants across the platform.
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-3 my-4 text-xs'>
              <div>
                <label className='font-semibold block mb-1'>Type Name *</label>
                <Input
                  required
                  placeholder='e.g. Pharmacy, Fashion, Groceries...'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className='text-xs'
                />
              </div>

              {editingType && (
                <div>
                  <label className='font-semibold block mb-1'>Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as EntityStatus)}
                    className='w-full rounded-md border bg-background px-3 py-2 text-xs text-foreground'
                  >
                    <option value='Active'>Active</option>
                    <option value='Inactive'>Inactive</option>
                  </select>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => {
                  setIsCreateOpen(false)
                  setEditingType(null)
                }}
              >
                Cancel
              </Button>
              <Button type='submit' size='sm'>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
