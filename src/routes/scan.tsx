import { createFileRoute } from '@tanstack/react-router'
import { CustomerScanView } from '@/features/customer-scan'

export const Route = createFileRoute('/scan')({
  component: CustomerScanRoute,
})

function CustomerScanRoute() {
  return <CustomerScanView />
}
