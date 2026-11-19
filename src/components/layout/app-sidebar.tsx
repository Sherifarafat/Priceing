import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { Sparkles } from 'lucide-react'
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
  const { currentUser } = useSaaSStore()
  const navGroups = getSaaSSidebarNav(currentUser.role)

  const [isPlanOpen, setIsPlanOpen] = React.useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = React.useState(false)

  return (
    <>
      <Sidebar collapsible={collapsible} variant={variant}>
        <SidebarHeader className='px-3.5 py-2.5 pb-2 space-y-2'>
          <div className='flex items-center gap-2.5 px-1 py-0.5'>
            <div className='size-8 rounded-xl bg-black text-white dark:bg-[#3EEA85] dark:text-black flex items-center justify-center font-black text-sm shadow-xs shrink-0'>
              t<span className='text-[#3EEA85] dark:text-black -ms-0.5 font-black'>.</span>
            </div>
            <div className='flex flex-col leading-none group-data-[collapsible=icon]:hidden'>
              <span className='font-black text-lg tracking-tight text-foreground lowercase'>
                telda<span className='text-[#3EEA85]'>.</span>
              </span>
              <span className='text-[9px] font-extrabold tracking-wider uppercase text-neutral-400 mt-0.5'>
                Business
              </span>
            </div>
          </div>

          {/* Ask Maya - Quick Action Button with Gradient Border */}
          <Link
            to='/ai-chat'
            className='relative block w-full p-px rounded-xl bg-gradient-to-r from-[#3EEA85] via-[#22C55E] to-[#10B981] cursor-pointer shadow-xs'
          >
            <div className='w-full flex items-center justify-between px-3 py-2 rounded-[11px] bg-white dark:bg-[#09090b] text-sidebar-foreground group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center'>
              <div className='flex items-center gap-2'>
                <div className='size-5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-[#3EEA85] flex items-center justify-center shrink-0'>
                  <Sparkles className='size-3.5 text-emerald-600 dark:text-[#3EEA85]' />
                </div>
                <span className='text-xs font-bold tracking-tight text-neutral-900 dark:text-white group-data-[collapsible=icon]:hidden'>
                  Ask Maya
                </span>
              </div>
              <span className='text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-[#3EEA85] border border-emerald-500/30 group-data-[collapsible=icon]:hidden'>
                AI
              </span>
            </div>
          </Link>
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
