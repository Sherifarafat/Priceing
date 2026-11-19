import { ChevronsUpDown, Building2, Store, Users, Check } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useSaaSStore } from '@/lib/saas-store'

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const navigate = useNavigate()
  const { currentUser, switchUser, merchants } = useSaaSStore()

  // Find merchant details if user belongs to one
  const currentMerchant = merchants.find((m) => m.id === currentUser.merchantId)

  // Demo user options
  const demoProfiles = [
    {
      id: 'user-super-admin',
      name: 'Platform Super Admin',
      sub: 'Platform Owner',
      role: 'SUPER_ADMIN',
      icon: Building2,
      badge: 'All Merchants',
    },
    {
      id: 'user-metro-manager',
      name: 'Metro Market',
      sub: 'Store Manager',
      role: 'MERCHANT_MANAGER',
      icon: Store,
      badge: 'Tenant: Metro',
    },
    {
      id: 'user-metro-staff',
      name: 'Ahmed Staff',
      sub: 'Staff Member',
      role: 'MERCHANT_STAFF',
      icon: Users,
      badge: 'Custom Perms',
    },
    {
      id: 'user-carrefour-manager',
      name: 'Carrefour Express',
      sub: 'Store Manager',
      role: 'MERCHANT_MANAGER',
      icon: Store,
      badge: 'Tenant: Carrefour',
    },
  ]

  const activeProfile =
    demoProfiles.find((p) => p.id === currentUser.id) || {
      id: currentUser.id,
      name: currentMerchant ? currentMerchant.name : currentUser.name,
      sub: currentUser.role,
      role: currentUser.role,
      icon: currentUser.role === 'SUPER_ADMIN' ? Building2 : Store,
      badge: currentUser.role,
    }

  const handleSwitch = (userId: string) => {
    switchUser(userId)
    navigate({ to: '/' })
  }

  return (
    <div className='flex flex-col gap-2.5 px-1 pt-1'>
      {/* Brand logo matching Telda */}
      <div className='flex items-center justify-between px-1 py-1'>
        <div className='flex items-center gap-2'>
          <div className='size-8 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-extrabold text-sm shadow-xs'>
            t<span className='text-[#3EEA85] -ms-0.5 font-black'>.</span>
          </div>
          <span className='font-extrabold text-lg tracking-tight text-foreground lowercase'>
            telda<span className='text-[#3EEA85]'>.</span>
          </span>
        </div>
      </div>

      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='h-10 rounded-xl border border-border/80 bg-background hover:bg-muted/60 transition-all shadow-2xs'
              >
                <div className='flex size-6 items-center justify-center rounded-md bg-black text-white dark:bg-white dark:text-black font-bold text-xs shrink-0'>
                  {activeProfile.name[0]}
                </div>
                <div className='grid flex-1 text-start text-xs leading-tight min-w-0'>
                  <span className='truncate font-bold text-foreground'>
                    {activeProfile.name}
                  </span>
                  <span className='truncate text-[10px] text-muted-foreground'>
                    {activeProfile.sub}
                  </span>
                </div>
                <ChevronsUpDown className='ms-auto size-3.5 text-muted-foreground shrink-0' />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className='w-64 rounded-xl shadow-xl border-border/80'
              align='start'
              side={isMobile ? 'bottom' : 'right'}
              sideOffset={4}
            >
              <DropdownMenuLabel className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                Switch Role / Tenant (Demo)
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {demoProfiles.map((profile) => {
                const isSelected = profile.id === currentUser.id
                const Icon = profile.icon
                return (
                  <DropdownMenuItem
                    key={profile.id}
                    onClick={() => handleSwitch(profile.id)}
                    className='flex items-center justify-between p-2 cursor-pointer rounded-lg'
                  >
                    <div className='flex items-center gap-2.5'>
                      <div
                        className={`flex size-7 items-center justify-center rounded-lg border ${
                          isSelected
                            ? 'bg-black text-white dark:bg-white dark:text-black border-transparent'
                            : 'bg-muted text-muted-foreground border-transparent'
                        }`}
                      >
                        <Icon className='size-3.5' />
                      </div>
                      <div className='flex flex-col'>
                        <span className='font-semibold text-xs leading-none mb-1'>
                          {profile.name}
                        </span>
                        <span className='text-[10px] text-muted-foreground'>
                          {profile.badge}
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className='size-4 text-[#3EEA85]' />}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </div>
  )
}
