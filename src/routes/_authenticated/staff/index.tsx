import { createFileRoute } from '@tanstack/react-router'
import { StaffManagementView } from '@/features/staff'

export const Route = createFileRoute('/_authenticated/staff/')({
  component: StaffManagementView,
})
