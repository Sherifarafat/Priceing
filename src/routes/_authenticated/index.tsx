import { createFileRoute } from '@tanstack/react-router'
import { SaaSDashboard } from '@/features/saas-dashboard'

export const Route = createFileRoute('/_authenticated/')({
  component: SaaSDashboard,
})
