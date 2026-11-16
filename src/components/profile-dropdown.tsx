import { useNavigate } from '@tanstack/react-router'
import {
  Building2,
  Store,
  Users,
  RotateCcw,
  Shield,
  LogOut,
  QrCode,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSaaSStore } from '@/lib/saas-store'

export function ProfileDropdown() {
  const navigate = useNavigate()
  const { currentUser, switchUser, resetAllData, branches } = useSaaSStore()

  const initials = currentUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handleSwitch = (userId: string) => {
    switchUser(userId)
    navigate({ to: '/' })
  }

  // Find first active branch to test
  const demoBranch = branches[0]

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative h-8 w-8 rounded-xl'>
          <Avatar className='h-8 w-8 rounded-xl'>
            <AvatarFallback className='bg-primary/20 text-primary font-bold text-xs rounded-xl'>
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-64' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col gap-1'>
            <p className='text-sm leading-none font-bold text-foreground'>{currentUser.name}</p>
            <p className='text-xs leading-none text-muted-foreground'>{currentUser.email}</p>
            <div className='mt-1 text-[10px] font-mono font-semibold text-primary uppercase'>
              Role: {currentUser.role}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuLabel className='text-[10px] font-semibold text-muted-foreground uppercase'>
          Switch User Profile
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => handleSwitch('user-super-admin')}>
            <Building2 className='mr-2 size-4 text-purple-500' />
            <span>Super Admin</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSwitch('user-metro-manager')}>
            <Store className='mr-2 size-4 text-blue-500' />
            <span>Metro Store Manager</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSwitch('user-metro-staff')}>
            <Users className='mr-2 size-4 text-emerald-500' />
            <span>Metro Staff (Ahmed)</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSwitch('user-carrefour-manager')}>
            <Store className='mr-2 size-4 text-amber-500' />
            <span>Carrefour Express Manager</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {demoBranch && (
          <DropdownMenuItem
            onClick={() => window.open(`/branch/${demoBranch.qrToken}`, '_blank')}
          >
            <QrCode className='mr-2 size-4 text-primary' />
            <span>Test Customer Scan View</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onClick={() => {
            resetAllData()
            window.location.reload()
          }}
          className='text-muted-foreground'
        >
          <RotateCcw className='mr-2 size-4' />
          <span>Reset Demo Data</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
