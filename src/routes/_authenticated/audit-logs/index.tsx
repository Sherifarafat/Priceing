import { createFileRoute } from '@tanstack/react-router'
import { AuditLogsView } from '@/features/audit-logs'

export const Route = createFileRoute('/_authenticated/audit-logs/')({
  component: AuditLogsView,
})
