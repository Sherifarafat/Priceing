import { createFileRoute } from '@tanstack/react-router'
import { ReceiptPublicView } from '@/features/pos/components/receipt-public-view'

export const Route = createFileRoute('/receipt/$id')({
  component: ReceiptPageRoute,
})

function ReceiptPageRoute() {
  const { id } = Route.useParams()
  return <ReceiptPublicView invoiceId={id} />
}
