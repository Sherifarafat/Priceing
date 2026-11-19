import * as React from 'react'
import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { getSaaSSidebarNav } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { SidebarTrialCard } from './sidebar-trial-card'
import { SidebarBottomNav } from './sidebar-bottom-nav'
import { PlanSelectionDialog } from '@/components/plan-selection-dialog'
import { FeedbackDialog } from '@/components/feedback-dialog'
import { useSaaSStore } from '@/lib/saas-store'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { currentUser, merchants } = useSaaSStore()
  const navGroups = getSaaSSidebarNav(currentUser)

  const [isPlanOpen, setIsPlanOpen] = React.useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = React.useState(false)

  // Scoped merchant for merchant manager / staff
  const currentMerchant = merchants.find((m) => m.id === currentUser.merchantId)
  const isMerchantUser = currentUser.role !== 'SUPER_ADMIN' && currentMerchant

  return (
    <>
      <Sidebar collapsible={collapsible} variant={variant}>
        <SidebarHeader className='px-3.5 py-2.5 pb-2 space-y-2'>
          <div className='flex items-center gap-2.5 px-1 py-0.5'>
            {isMerchantUser ? (
              <>
                {currentMerchant.logo ? (
                  <img
                    src={currentMerchant.logo}
                    alt={currentMerchant.name}
                    className='size-8 rounded-xl object-cover border border-border/80 shadow-xs shrink-0'
                  />
                ) : (
                  <div className='size-8 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-sm shadow-xs shrink-0'>
                    {currentMerchant.name[0]?.toUpperCase() || 'M'}
                  </div>
                )}
                <div className='flex flex-col leading-none group-data-[collapsible=icon]:hidden min-w-0'>
                  <span className='font-black text-base tracking-tight text-foreground truncate'>
                    {currentMerchant.name}
                  </span>
                  <span className='text-[9px] font-bold tracking-wider uppercase text-[#3EEA85] mt-0.5'>
                    Store Portal
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className='size-8 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-black text-sm shadow-xs shrink-0'>
                  t<span className='text-[#3EEA85] -ms-0.5 font-black'>.</span>
                </div>
                <div className='flex flex-col leading-none group-data-[collapsible=icon]:hidden'>
                  <span className='font-black text-lg tracking-tight text-foreground lowercase'>
                    telda<span className='text-[#3EEA85]'>.</span>
                  </span>
                  <span className='text-[9px] font-extrabold tracking-wider uppercase text-neutral-400 mt-0.5'>
                    Business
                  </span>
                </div>
              </>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className='gap-0 py-0.5 overflow-x-hidden'>
          {navGroups.map((props) => (
            <NavGroup key={props.title} {...props} />
          ))}
        </SidebarContent>

        <SidebarFooter className='p-2.5 pt-1.5 space-y-1.5'>
          {/* Trial countdown card from screenshot */}
          <SidebarTrialCard onSelectPlan={() => setIsPlanOpen(true)} />

          {/* Thin subtle divider */}
          <div className='border-t border-border/40 my-1 group-data-[collapsible=icon]:hidden' />

          {/* Bottom items: Feedback, Settings, Help Center */}
          <SidebarBottomNav onOpenFeedback={() => setIsFeedbackOpen(true)} />
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {/* Plan Selection Modal */}
      <PlanSelectionDialog open={isPlanOpen} onOpenChange={setIsPlanOpen} />

      {/* Feedback Modal */}
      <FeedbackDialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen} />
    </>
  )
}
