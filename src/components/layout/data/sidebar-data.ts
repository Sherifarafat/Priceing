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
  FileText,
  Palette,
  Monitor,
} from 'lucide-react'
import { User, UserRole, StaffPermissionKey, MerchantFeatureKey, MerchantFeatures } from '@/types/saas'
import { type SidebarData, type NavGroup, type NavItem } from '../types'

export function getSaaSSidebarNav(
  userOrRole: User | UserRole,
  merchantFeatures?: Partial<MerchantFeatures>
): NavGroup[] {
  const role: UserRole = typeof userOrRole === 'string' ? userOrRole : userOrRole.role
  const user: User | null = typeof userOrRole === 'object' ? userOrRole : null

  const isFeatureEnabled = (key: MerchantFeatureKey): boolean => {
    if (role === 'SUPER_ADMIN') return true
    return merchantFeatures?.[key] !== false
  }

  const hasPerm = (key: StaffPermissionKey): boolean => {
    if (role === 'SUPER_ADMIN' || role === 'MERCHANT_MANAGER') return true
    if (role === 'CASHIER') {
      if (key === 'invoices.view' || key === 'invoices.issue' || key === 'products.view') {
        return user?.permissions?.[key] !== false
      }
      return user?.permissions?.[key] ?? false
    }
    return user?.permissions?.[key] ?? false
  }

  // 1. Company Platform Super Admin - Full Platform Authority
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
            title: 'نقطة البيع (POS)',
            url: '/pos',
            icon: Monitor,
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
            title: 'Invoices',
            icon: FileText,
            items: [
              {
                title: 'Issued Invoices',
                url: '/invoices',
                icon: FileText,
              },
              {
                title: 'Invoice Designer',
                url: '/invoices/design',
                icon: Palette,
              },
            ],
          },
          {
            title: 'Roles & Users',
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

  // 2. Merchant Store Manager / Owner - Full Store Authority (filtered by Merchant Feature Toggles)
  if (role === 'MERCHANT_MANAGER') {
    const managerItems: NavItem[] = []

    if (isFeatureEnabled('dashboard')) {
      managerItems.push({
        title: 'Store Dashboard',
        url: '/',
        icon: LayoutDashboard,
      })
    }
    if (isFeatureEnabled('pos')) {
      managerItems.push({
        title: 'نقطة البيع (POS)',
        url: '/pos',
        icon: Monitor,
      })
    }
    if (isFeatureEnabled('branches')) {
      managerItems.push({
        title: 'Store Branches',
        url: '/branches',
        icon: Store,
      })
    }
    if (isFeatureEnabled('products')) {
      managerItems.push({
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
      })
    }
    if (isFeatureEnabled('invoices')) {
      managerItems.push({
        title: 'Invoices & Billing',
        icon: FileText,
        items: [
          {
            title: 'Issued Invoices',
            url: '/invoices',
            icon: FileText,
          },
          {
            title: 'Invoice Designer',
            url: '/invoices/design',
            icon: Palette,
          },
        ],
      })
    }
    if (isFeatureEnabled('fees')) {
      managerItems.push({
        title: 'Fees & Taxes',
        url: '/fees',
        icon: Receipt,
      })
    }
    if (isFeatureEnabled('staff')) {
      managerItems.push({
        title: 'Cashiers & Staff',
        url: '/staff',
        icon: Users,
      })
    }
    if (isFeatureEnabled('reports')) {
      managerItems.push({
        title: 'Reports & Analytics',
        url: '/reports',
        icon: BarChart3,
      })
    }
    if (isFeatureEnabled('services')) {
      managerItems.push({
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
      })
    }
    if (isFeatureEnabled('excel')) {
      managerItems.push({
        title: 'Excel Operations',
        url: '/excel',
        icon: FileSpreadsheet,
      })
    }

    return [
      {
        title: 'Store Operations',
        items: managerItems,
      },
    ]
  }

  // 3. Cashier or Merchant Staff - Strictly Filtered by Granular Permissions & Merchant Features
  const staffItems: NavItem[] = []

  if (isFeatureEnabled('dashboard') && hasPerm('dashboard.view')) {
    staffItems.push({
      title: 'Store Dashboard',
      url: '/',
      icon: LayoutDashboard,
    })
  }

  if (hasPerm('invoices.view') || hasPerm('invoices.issue') || role === 'CASHIER') {
    if (isFeatureEnabled('pos')) {
      staffItems.push({
        title: 'نقطة البيع (POS)',
        url: '/pos',
        icon: Monitor,
      })
    }
    if (isFeatureEnabled('invoices')) {
      staffItems.push({
        title: 'الفواتير والمبيعات',
        url: '/invoices',
        icon: FileText,
      })
    }
  }

  if (isFeatureEnabled('products') && (hasPerm('products.view') || role === 'CASHIER')) {
    staffItems.push({
      title: 'Products & Lookup',
      url: '/products',
      icon: Package,
    })
  }

  if (isFeatureEnabled('branches') && hasPerm('branches.view')) {
    staffItems.push({
      title: 'Branches',
      url: '/branches',
      icon: Store,
    })
  }

  if (isFeatureEnabled('invoices') && hasPerm('invoices.design')) {
    staffItems.push({
      title: 'Invoice Designer',
      url: '/invoices/design',
      icon: Palette,
    })
  }

  if (isFeatureEnabled('fees') && hasPerm('fees.manage')) {
    staffItems.push({
      title: 'Fees & Taxes',
      url: '/fees',
      icon: Receipt,
    })
  }

  if (isFeatureEnabled('reports') && hasPerm('reports.view')) {
    staffItems.push({
      title: 'Reports',
      url: '/reports',
      icon: BarChart3,
    })
  }

  if (isFeatureEnabled('excel') && (hasPerm('excel.import') || hasPerm('excel.bulk_edit'))) {
    staffItems.push({
      title: 'Excel Operations',
      url: '/excel',
      icon: FileSpreadsheet,
    })
  }

  return [
    {
      title: role === 'CASHIER' ? 'Cashier Terminal' : 'Staff Workspace',
      items: staffItems,
    },
  ]
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
