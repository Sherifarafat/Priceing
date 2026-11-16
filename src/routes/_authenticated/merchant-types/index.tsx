import { createFileRoute } from '@tanstack/react-router'
import { MerchantTypesView } from '@/features/merchant-types'

export const Route = createFileRoute('/_authenticated/merchant-types/')({
  component: MerchantTypesView,
})
