import { Link, useNavigate } from '@tanstack/react-router'
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Building2,
  Store,
  Users,
  Check,
  Sparkles,
} from 'lucide-react'
import useDialogState from '@/hooks/use-dialog-state'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
import { SignOutDialog } from '@/components/sign-out-dialog'
import { useSaaSStore } from '@/lib/saas-store'

type NavUserProps = {
  user: {
    name: string
    email: string
    avatar: string
  }
}

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar()
  const navigate = useNavigate()
  const [open, setOpen] = useDialogState()
  const { currentUser, switchUser, merchants } = useSaaSStore()

  const currentMerchant = merchants.find((m) => m.id === currentUser.merchantId)

  // Demo user options for tenant & role switching
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
      badge: 'Metro',
    },
    {
      id: 'user-metro-staff',
      name: 'Ahmed Staff',
      sub: 'Staff Member',
      role: 'MERCHANT_STAFF',
      icon: Users,
      badge: 'Staff',
    },
    {
      id: 'user-carrefour-manager',
      name: 'Carrefour Express',
      sub: 'Store Manager',
      role: 'MERCHANT_MANAGER',
      icon: Store,
      badge: 'Carrefour',
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
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='h-12 rounded-xl border border-border/80 px-2.5 bg-background hover:bg-muted/60 transition-all shadow-2xs'
              >
                <div className='flex size-8 items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black font-bold text-xs shrink-0 shadow-xs'>
                  {activeProfile.name[0]}
                </div>
                <div className='grid flex-1 text-start text-xs leading-tight min-w-0'>
                  <span className='truncate font-bold text-foreground'>{activeProfile.name}</span>
                  <span className='truncate text-[10px] text-muted-foreground'>{activeProfile.sub}</span>
                </div>
                <ChevronsUpDown className='ms-auto size-3.5 text-muted-foreground shrink-0' />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className='w-64 rounded-xl p-2 shadow-2xl border-border/80'
              side={isMobile ? 'bottom' : 'right'}
              align='end'
              sideOffset={10}
            >
              {/* Current Active Account Header */}
              <DropdownMenuLabel className='p-1 font-normal'>
                <div className='flex items-center gap-2.5 px-2 py-1.5 text-start text-xs'>
                  <div className='flex size-8 items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black font-bold text-xs shrink-0'>
                    {activeProfile.name[0]}
                  </div>
                  <div className='grid flex-1 text-start leading-tight min-w-0'>
                    <span className='truncate font-bold text-foreground'>{currentUser.name}</span>
                    <span className='truncate text-[10px] text-muted-foreground'>{currentUser.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className='my-1.5' />

              {/* Role & Tenant Switcher List */}
              <DropdownMenuLabel className='text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground px-2 py-1'>
                Switch Role / Tenant
              </DropdownMenuLabel>
              <DropdownMenuGroup className='space-y-0.5'>
                {demoProfiles.map((profile) => {
                  const isSelected = profile.id === currentUser.id
                  const Icon = profile.icon
                  return (
                    <DropdownMenuItem
                      key={profile.id}
                      onClick={() => handleSwitch(profile.id)}
                      className={`flex items-center justify-between p-2 cursor-pointer rounded-lg text-xs transition-colors ${
                        isSelected ? 'bg-muted font-semibold' : ''
                      }`}
                    >
                      <div className='flex items-center gap-2.5 min-w-0'>
                        <div
                          className={`flex size-7 items-center justify-center rounded-lg shrink-0 ${
                            isSelected
                              ? 'bg-black text-white dark:bg-white dark:text-black'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <Icon className='size-3.5' />
                        </div>
                        <div className='truncate'>
                          <div className='font-bold text-xs truncate'>{profile.name}</div>
                          <div className='text-[10px] text-muted-foreground truncate'>{profile.sub}</div>
                        </div>
                      </div>
                      {isSelected && <Check className='size-4 text-[#4F46E5] shrink-0' />}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuGroup>

              <DropdownMenuSeparator className='my-1.5' />

              <DropdownMenuGroup>
                <DropdownMenuItem asChild className='cursor-pointer rounded-xl text-xs py-2'>
                  <Link to='/settings/account'>
                    <BadgeCheck className='mr-2 size-3.5 text-muted-foreground' />
                    <span>Account Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className='cursor-pointer rounded-xl text-xs py-2'>
                  <Link to='/settings'>
                    <CreditCard className='mr-2 size-3.5 text-muted-foreground' />
                    <span>Billing & Card</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator className='my-1.5' />

              <DropdownMenuItem
                variant='destructive'
                className='cursor-pointer rounded-xl text-xs py-2'
                onClick={() => setOpen(true)}
              >
                <LogOut className='mr-2 size-3.5' />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  )
}
