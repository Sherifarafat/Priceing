import { createFileRoute } from '@tanstack/react-router'
import { GreenScanLandingPage } from '@/features/landing'

export const Route = createFileRoute('/')({
  component: GreenScanLandingPage,
})
