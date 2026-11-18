import { createFileRoute } from '@tanstack/react-router'
import { ServiceCategoriesView } from '@/features/services/categories'

export const Route = createFileRoute('/_authenticated/services/categories/')({
  component: ServiceCategoriesView,
})
