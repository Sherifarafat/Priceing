import { createFileRoute } from '@tanstack/react-router'
import { BranchesView } from '@/features/branches'

export const Route = createFileRoute('/_authenticated/branches/')({
  component: BranchesView,
})
