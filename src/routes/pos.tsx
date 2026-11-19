import { createFileRoute } from '@tanstack/react-router'
import { POSTerminalView } from '@/features/pos'

export const Route = createFileRoute('/pos')({
  component: POSTerminalView,
})
