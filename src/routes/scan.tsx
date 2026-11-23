import { createFileRoute } from '@tanstack/react-router'
import { CustomerScanView } from '@/features/customer-scan'

export const Route = createFileRoute('/scan')({
  validateSearch: (search: Record<string, unknown>): { merchantId?: string } => ({
    merchantId: typeof search.merchantId === 'string' ? search.merchantId : undefined,
  }),
  component: CustomerScanRoute,
})

function CustomerScanRoute() {
  const { merchantId } = Route.useSearch()
  return <CustomerScanView merchantId={merchantId} />
}
