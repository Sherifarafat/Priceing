import {
  LayoutDashboard,
  Store,
  QrCode,
  Package,
  Tags,
  FileSpreadsheet,
  Users,
  ScrollText,
  Coins,
  FolderTree,
  Building2,
} from 'lucide-react'
import { UserRole } from '@/types/saas'
import { type SidebarData, type NavGroup } from '../types'

export function getSaaSSidebarNav(role: UserRole): NavGroup[] {
  if (role === 'SUPER_ADMIN') {
    return [
      {
        title: 'Platform Overview',
        items: [
          {
            title: 'Platform Dashboard',
            url: '/',
            icon: LayoutDashboard,
          },
        ],
      },
      {
        title: 'Merchant Network',
        items: [
          {
            title: 'Merchants',
            url: '/merchants',
            icon: Store,
          },
          {
            title: 'Branches & QR Codes',
            url: '/branches',
            icon: QrCode,
          },
        ],
      },
      {
        title: 'Platform Configuration',
        items: [
          {
            title: 'Merchant Types',
            url: '/merchant-types',
            icon: FolderTree,
          },
          {
            title: 'Currencies',
            url: '/currencies',
            icon: Coins,
          },
        ],
      },
      {
        title: 'Security & Governance',
        items: [
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
          title: 'Products Catalog',
          url: '/products',
          icon: Package,
        },
        {
          title: 'Categories',
          url: '/categories',
          icon: Tags,
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
