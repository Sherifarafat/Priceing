import { createFileRoute } from '@tanstack/react-router'
import { SubServicesView } from '@/features/services/sub-services'

export const Route = createFileRoute(
  '/_authenticated/services/sub-services/'
)({
  component: SubServicesView,
})
