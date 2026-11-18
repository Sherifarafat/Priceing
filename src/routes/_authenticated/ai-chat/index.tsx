import { createFileRoute } from '@tanstack/react-router'
import { AIChatView } from '@/features/ai-chat'

export const Route = createFileRoute('/_authenticated/ai-chat/')({
  component: AIChatView,
})
