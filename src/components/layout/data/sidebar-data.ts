import {
  LayoutDashboard,
  Store,
  Package,
  Boxes,
  Tags,
  FileSpreadsheet,
  Users,
  ScrollText,
  Building2,
  ShieldCheck,
  Briefcase,
  GitFork,
  PackagePlus,
  BarChart3,
  Receipt,
} from 'lucide-react'
import { UserRole } from '@/types/saas'
import { type SidebarData, type NavGroup } from '../types'

export function getSaaSSidebarNav(role: UserRole): NavGroup[] {
  if (role === 'SUPER_ADMIN') {
    return [
      {
        title: '',
        items: [
          {
            title: 'Platform Dashboard',
            url: '/',
            icon: LayoutDashboard,
          },
          {
            title: 'Merchants',
            url: '/merchants',
            icon: Building2,
          },
          {
            title: 'Branches',
            url: '/branches',
            icon: Store,
          },
          {
            title: 'Product Hub',
            icon: Boxes,
            items: [
              {
                title: 'Products',
                url: '/products',
                icon: Package,
              },
              {
                title: 'Add-ons',
                url: '/add-ons',
                icon: PackagePlus,
              },
            ],
          },
          {
            title: 'Services',
            icon: Briefcase,
            items: [
              {
                title: 'Category',
                url: '/services/categories',
                icon: Tags,
              },
              {
                title: 'Services',
                url: '/services',
                icon: Briefcase,
              },
              {
                title: 'Sub Services',
                url: '/services/sub-services',
                icon: GitFork,
              },
            ],
          },
          {
            title: 'Reports & Analytics',
            url: '/reports',
            icon: BarChart3,
          },
          {
            title: 'Fees & Taxes',
            url: '/fees',
            icon: Receipt,
          },
          {
            title: 'Roles',
            icon: ShieldCheck,
            items: [
              {
                title: 'Roles',
                url: '/roles',
                icon: ShieldCheck,
              },
              {
                title: 'Users',
                url: '/users',
                icon: Users,
              },
            ],
          },
          {
            title: 'Audit Logs',
            url: '/audit-logs',
            icon: ScrollText,
          },
        ],
      },
    ]
  }

  // Merchant Manager or Merchant Staff
  const merchantGroups: NavGroup[] = [
    {
      title: 'Store Operations',
      items: [
        {
          title: 'Store Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Product Hub',
          icon: Boxes,
          items: [
            {
              title: 'Products',
              url: '/products',
              icon: Package,
            },
            {
              title: 'Add-ons',
              url: '/add-ons',
              icon: PackagePlus,
            },
          ],
        },
        {
          title: 'Services',
          icon: Briefcase,
          items: [
            {
              title: 'Category',
              url: '/services/categories',
              icon: Tags,
            },
            {
              title: 'Services',
              url: '/services',
              icon: Briefcase,
            },
            {
              title: 'Sub Services',
              url: '/services/sub-services',
              icon: GitFork,
            },
          ],
        },
        {
          title: 'Reports & Analytics',
          url: '/reports',
          icon: BarChart3,
        },
        {
          title: 'Fees & Taxes',
          url: '/fees',
          icon: Receipt,
        },
        {
          title: 'Excel Operations',
          url: '/excel',
          icon: FileSpreadsheet,
        },
      ],
    },
  ]

  if (role === 'MERCHANT_MANAGER') {
    merchantGroups.push({
      title: 'Staff Management',
      items: [
        {
          title: 'Staff Users & Permissions',
          url: '/staff',
          icon: Users,
        },
      ],
    })
  }

  return merchantGroups
}

export const sidebarData: SidebarData = {
  user: {
    name: 'Super Admin',
    email: 'admin@platform.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
  },
  teams: [
    {
      name: 'Platform Super Admin',
      logo: Building2,
      plan: 'Full Access',
    },
    {
      name: 'Metro Market',
      logo: Store,
      plan: 'Merchant Manager',
    },
    {
      name: 'Ahmed Staff',
      logo: Users,
      plan: 'Metro Staff',
    },
    {
      name: 'Carrefour Express',
      logo: Store,
      plan: 'Isolated Tenant',
    },
  ],
  navGroups: getSaaSSidebarNav('SUPER_ADMIN'),
}
