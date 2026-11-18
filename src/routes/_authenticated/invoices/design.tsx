import { createFileRoute } from '@tanstack/react-router'
import { InvoiceDesigner } from '@/features/invoices/invoice-designer'

export const Route = createFileRoute('/_authenticated/invoices/design')({
  component: InvoiceDesigner,
})
