import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { LanguageSwitch } from '@/components/language-switch'
import { useSaaSStore } from '@/lib/saas-store'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersProvider } from './components/users-provider'
import { UsersTable } from './components/users-table'
import { type User as TableUser } from './data/schema'

const route = getRouteApi('/_authenticated/users/')

export function Users() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const storeUsers = useSaaSStore((state) => state.users)

  // Map live SaaS store users to UsersTable format
  const mappedUsers: TableUser[] = storeUsers.map((u) => {
    const parts = (u.name || u.email || 'User').split(' ')
    const firstName = parts[0] || 'User'
    const lastName = parts.slice(1).join(' ') || ''

    let roleLower: 'superadmin' | 'admin' | 'manager' | 'cashier' = 'manager'
    if (u.role === 'SUPER_ADMIN') roleLower = 'superadmin'
    else if (u.role === 'MERCHANT_MANAGER') roleLower = 'admin'
    else if (u.role === 'MERCHANT_STAFF') roleLower = 'cashier'

    let statusLower: 'active' | 'inactive' | 'invited' | 'suspended' = 'active'
    if (u.status === 'Inactive') statusLower = 'inactive'
    else if ((u.status as string) === 'Suspended') statusLower = 'suspended'

    return {
      id: u.id,
      firstName,
      lastName,
      username: u.username || u.email.split('@')[0],
      email: u.email,
      phoneNumber: '+20 100 000 0000',
      status: statusLower,
      role: roleLower,
      createdAt: new Date(u.createdAt || Date.now()),
      updatedAt: new Date(u.createdAt || Date.now()),
    }
  })

  return (
    <UsersProvider>
      <Header fixed>
        <Search className='me-auto' />
        <LanguageSwitch />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>User List</h2>
            <p className='text-muted-foreground'>
              Manage your users and their roles here.
            </p>
          </div>
          <UsersPrimaryButtons />
        </div>
        <UsersTable data={mappedUsers} search={search} navigate={navigate} />
      </Main>

      <UsersDialogs />
    </UsersProvider>
  )
}
