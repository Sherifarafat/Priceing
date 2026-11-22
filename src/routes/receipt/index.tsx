import { createFileRoute } from '@tanstack/react-router'
import { ReceiptPublicView } from '@/features/pos/components/receipt-public-view'

export const Route = createFileRoute('/receipt/')({
  component: ReceiptIndexRoute,
})

function ReceiptIndexRoute() {
  return <ReceiptPublicView invoiceId='live' />
}
