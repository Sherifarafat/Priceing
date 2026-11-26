import { createFileRoute } from '@tanstack/react-router'
import { InvoiceWhatsAppSettings } from '@/features/invoices/whatsapp-settings'

export const Route = createFileRoute('/_authenticated/invoices/whatsapp')({
  component: InvoiceWhatsAppSettings,
})
