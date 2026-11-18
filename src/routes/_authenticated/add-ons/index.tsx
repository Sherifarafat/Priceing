import { createFileRoute } from '@tanstack/react-router'
import { ProductAddonsView } from '@/features/products-management/add-ons'

export const Route = createFileRoute('/_authenticated/add-ons/')({
  component: ProductAddonsView,
})
