import { createFileRoute } from '@tanstack/react-router'
import { ExcelBulkOperationsView } from '@/features/excel'

export const Route = createFileRoute('/_authenticated/excel/')({
  component: ExcelBulkOperationsView,
})
