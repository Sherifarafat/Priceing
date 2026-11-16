import { createFileRoute } from '@tanstack/react-router'
import { CustomerScanView } from '@/features/customer-scan'

export const Route = createFileRoute('/branch/$token')({
  component: BranchScanRoute,
})

function BranchScanRoute() {
  const { token } = Route.useParams()
  return <CustomerScanView qrToken={token} />
}
