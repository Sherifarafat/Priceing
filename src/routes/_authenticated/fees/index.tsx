import { createFileRoute } from '@tanstack/react-router'
import { FeesView } from '@/features/fees'

export const Route = createFileRoute('/_authenticated/fees/')({
  component: FeesView,
})
