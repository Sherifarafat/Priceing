import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { MerchantOnboarding } from '@/features/onboarding'

export const Route = createFileRoute('/onboarding')({
  beforeLoad: () => {
    const { auth } = useAuthStore.getState()
    if (!auth.user || !auth.accessToken) {
      throw redirect({
        to: '/sign-in',
      })
    }
  },
  component: MerchantOnboarding,
})
