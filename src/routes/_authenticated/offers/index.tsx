import { createFileRoute } from '@tanstack/react-router'
import { OffersView } from '@/features/offers'

export const Route = createFileRoute('/_authenticated/offers/')({
  component: OffersView,
})
