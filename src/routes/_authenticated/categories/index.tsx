import { createFileRoute } from '@tanstack/react-router'
import { CategoriesView } from '@/features/categories'

export const Route = createFileRoute('/_authenticated/categories/')({
  component: CategoriesView,
})
