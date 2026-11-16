import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { getSaaSSidebarNav, sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { useSaaSStore } from '@/lib/saas-store'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { currentUser } = useSaaSStore()
  const navGroups = getSaaSSidebarNav(currentUser.role)

  const userProfile = {
    name: currentUser.name,
    email: currentUser.email,
    avatar: sidebarData.user.avatar,
  }

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader className='p-4 pb-2'>
        <div className='flex items-center gap-3 px-1 py-1'>
          <div className='size-8 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-black text-sm shadow-xs shrink-0'>
            t<span className='text-[#4F46E5] -ms-0.5 font-black'>.</span>
          </div>
          <div className='flex flex-col leading-none group-data-[collapsible=icon]:hidden'>
            <span className='font-black text-lg tracking-tight text-foreground lowercase'>
              telda<span className='text-[#4F46E5]'>.</span>
            </span>
            <span className='text-[9px] font-extrabold tracking-wider uppercase text-neutral-400 mt-0.5'>
              Business
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter className='p-3'>
        <NavUser user={userProfile} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
