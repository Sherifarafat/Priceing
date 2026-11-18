'use client'

import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useSaaSStore } from '@/lib/saas-store'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { type User } from '../data/schema'

type UserDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
}

export function UsersDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: UserDeleteDialogProps) {
  const handleDelete = async () => {
    onOpenChange(false)
    try {
      await useSaaSStore.getState().deleteUser(currentRow.id)
      toast.success(`User ${currentRow.username} deleted successfully.`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user')
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      form='users-delete-form'
      destructive
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='me-1 inline-block stroke-destructive'
            size={18}
          />{' '}
          Delete User
        </span>
      }
      desc={
        <form
          id='users-delete-form'
          onSubmit={(e) => {
            e.preventDefault()
            handleDelete()
          }}
          className='space-y-3'
        >
          <p className='mb-2'>
            Are you sure you want to delete{' '}
            <span className='font-bold text-foreground'>{currentRow.username}</span> ({currentRow.email})?
            <br />
            This action will permanently remove the user from the database.
          </p>

          <Alert variant='destructive'>
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>
              Please be careful, this operation cannot be undone.
            </AlertDescription>
          </Alert>
        </form>
      }
      confirmText='Delete User'
    />
  )
}
