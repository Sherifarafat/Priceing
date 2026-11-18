import { createFileRoute } from '@tanstack/react-router'
import { RolesManagementView } from '@/features/roles'

export const Route = createFileRoute('/_authenticated/roles/')({
  component: RolesManagementView,
})
