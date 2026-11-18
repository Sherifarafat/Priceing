import { Link, useLocation } from '@tanstack/react-router'
import { StickyNote, Settings, CircleHelp } from 'lucide-react'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

interface SidebarBottomNavProps {
  onOpenFeedback: () => void
}

export function SidebarBottomNav({ onOpenFeedback }: SidebarBottomNavProps) {
  const { setOpenMobile } = useSidebar()
  const href = useLocation({ select: (location) => location.href })

  return (
    <SidebarMenu className='gap-0.5'>
      {/* 1. Feedback Item */}
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={onOpenFeedback}
          tooltip='Feedback'
          className='text-neutral-400 hover:text-foreground dark:hover:text-white transition-colors h-8 text-xs font-normal hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60'
        >
          <StickyNote className='size-4 shrink-0 text-neutral-400' />
          <span className='group-data-[collapsible=icon]:hidden'>Feedback</span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {/* 2. Settings Item */}
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={href.startsWith('/settings')}
          tooltip='Settings'
          className='text-neutral-400 hover:text-foreground dark:hover:text-white transition-colors h-8 text-xs font-normal hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 data-[active=true]:font-semibold data-[active=true]:text-foreground'
        >
          <Link to='/settings' onClick={() => setOpenMobile(false)}>
            <Settings className='size-4 shrink-0 text-neutral-400' />
            <span className='group-data-[collapsible=icon]:hidden'>Settings</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {/* 3. Help Center Item */}
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={href.startsWith('/help-center')}
          tooltip='Help Center'
          className='text-neutral-400 hover:text-foreground dark:hover:text-white transition-colors h-8 text-xs font-normal hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 data-[active=true]:font-semibold data-[active=true]:text-foreground'
        >
          <Link to='/help-center' onClick={() => setOpenMobile(false)}>
            <CircleHelp className='size-4 shrink-0 text-neutral-400' />
            <span className='group-data-[collapsible=icon]:hidden'>Help Center</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
