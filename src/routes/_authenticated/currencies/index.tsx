import { createFileRoute } from '@tanstack/react-router'
import { CurrenciesView } from '@/features/currencies'

export const Route = createFileRoute('/_authenticated/currencies/')({
  component: CurrenciesView,
})
