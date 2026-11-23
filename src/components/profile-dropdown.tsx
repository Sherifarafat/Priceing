import { useNavigate } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSaaSStore } from '@/lib/saas-store'
import { useAuthStore } from '@/stores/auth-store'

export function ProfileDropdown() {
  const navigate = useNavigate()
  const { currentUser } = useSaaSStore()

  const initials = currentUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

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
            <div className='mt-1 text-[10px] font-mono font-semibold text-muted-foreground uppercase'>
              Role: {currentUser.role}
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => {
            useAuthStore.getState().auth.reset()
            useSaaSStore.getState().switchUser('SUPER_ADMIN')
            navigate({ to: '/sign-in', replace: true })
          }}
          className='cursor-pointer text-destructive focus:text-destructive'
        >
          <LogOut className='mr-2 size-4' />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
