import { Link, useLocation } from '@tanstack/react-router'
import { StickyNote, Settings, CircleHelp } from 'lucide-react'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useLang } from '@/lib/i18n'

interface SidebarBottomNavProps {
  onOpenFeedback: () => void
}

export function SidebarBottomNav({ onOpenFeedback }: SidebarBottomNavProps) {
  const { setOpenMobile } = useSidebar()
  const href = useLocation({ select: (location) => location.href })
  const { t } = useLang()

  return (
    <SidebarMenu className='gap-0.5'>
      {/* 1. Feedback Item */}
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={onOpenFeedback}
          tooltip={t('الملاحظات', 'Feedback')}
          className='text-foreground hover:text-foreground dark:text-neutral-100 dark:hover:text-white transition-colors h-8 text-xs font-medium hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60'
        >
          <StickyNote className='size-4 shrink-0 text-foreground dark:text-neutral-100' />
          <span className='group-data-[collapsible=icon]:hidden'>{t('الملاحظات', 'Feedback')}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {/* 2. Settings Item */}
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={href.startsWith('/settings')}
          tooltip={t('الإعدادات', 'Settings')}
          className='text-foreground hover:text-foreground dark:text-neutral-100 dark:hover:text-white transition-colors h-8 text-xs font-medium hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 data-[active=true]:font-semibold data-[active=true]:text-foreground'
        >
          <Link to='/settings' onClick={() => setOpenMobile(false)}>
            <Settings className='size-4 shrink-0 text-foreground dark:text-neutral-100' />
            <span className='group-data-[collapsible=icon]:hidden'>{t('الإعدادات', 'Settings')}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {/* 3. Help Center Item */}
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={href.startsWith('/help-center')}
          tooltip={t('مركز المساعدة', 'Help Center')}
          className='text-foreground hover:text-foreground dark:text-neutral-100 dark:hover:text-white transition-colors h-8 text-xs font-medium hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 data-[active=true]:font-semibold data-[active=true]:text-foreground'
        >
          <Link to='/help-center' onClick={() => setOpenMobile(false)}>
            <CircleHelp className='size-4 shrink-0 text-foreground dark:text-neutral-100' />
            <span className='group-data-[collapsible=icon]:hidden'>{t('مركز المساعدة', 'Help Center')}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
