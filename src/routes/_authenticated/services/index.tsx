import { createFileRoute } from '@tanstack/react-router'
import { ServicesView } from '@/features/services'

export const Route = createFileRoute('/_authenticated/services/')({
  component: ServicesView,
})
