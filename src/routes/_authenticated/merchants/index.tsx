import { createFileRoute } from '@tanstack/react-router'
import { MerchantsView } from '@/features/merchants'

export const Route = createFileRoute('/_authenticated/merchants/')({
  component: MerchantsView,
})
