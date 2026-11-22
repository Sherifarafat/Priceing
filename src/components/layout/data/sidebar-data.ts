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
import { User, UserRole, StaffPermissionKey } from '@/types/saas'
import { type SidebarData, type NavGroup, type NavItem } from '../types'

export function getSaaSSidebarNav(userOrRole: User | UserRole): NavGroup[] {
  const role: UserRole = typeof userOrRole === 'string' ? userOrRole : userOrRole.role
  const user: User | null = typeof userOrRole === 'object' ? userOrRole : null

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

  // 2. Merchant Store Manager / Owner - Full Store Authority
  if (role === 'MERCHANT_MANAGER') {
    return [
      {
        title: 'Store Operations',
        items: [
          {
            title: 'Store Dashboard',
            url: '/',
            icon: LayoutDashboard,
          },
          {
            title: 'نقطة البيع (POS)',
            url: '/pos',
            icon: Monitor,
          },
          {
            title: 'Store Branches',
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
          },
          {
            title: 'Fees & Taxes',
            url: '/fees',
            icon: Receipt,
          },
          {
            title: 'Cashiers & Staff',
            url: '/staff',
            icon: Users,
          },
          {
            title: 'Reports & Analytics',
            url: '/reports',
            icon: BarChart3,
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
            title: 'Excel Operations',
            url: '/excel',
            icon: FileSpreadsheet,
          },
        ],
      },
    ]
  }

  // 3. Cashier or Merchant Staff - Strictly Filtered by Granular Permissions
  const staffItems: NavItem[] = []

  if (hasPerm('dashboard.view')) {
    staffItems.push({
      title: 'Store Dashboard',
      url: '/',
      icon: LayoutDashboard,
    })
  }

  if (hasPerm('invoices.view') || hasPerm('invoices.issue') || role === 'CASHIER') {
    staffItems.push({
      title: 'نقطة البيع (POS)',
      url: '/pos',
      icon: Monitor,
    })
    staffItems.push({
      title: 'الفواتير والمبيعات',
      url: '/invoices',
      icon: FileText,
    })
  }

  if (hasPerm('products.view') || role === 'CASHIER') {
    staffItems.push({
      title: 'Products & Lookup',
      url: '/products',
      icon: Package,
    })
  }

  if (hasPerm('branches.view')) {
    staffItems.push({
      title: 'Branches',
      url: '/branches',
      icon: Store,
    })
  }

  if (hasPerm('invoices.design')) {
    staffItems.push({
      title: 'Invoice Designer',
      url: '/invoices/design',
      icon: Palette,
    })
  }

  if (hasPerm('fees.manage')) {
    staffItems.push({
      title: 'Fees & Taxes',
      url: '/fees',
      icon: Receipt,
    })
  }

  if (hasPerm('reports.view')) {
    staffItems.push({
      title: 'Reports',
      url: '/reports',
      icon: BarChart3,
    })
  }

  if (hasPerm('excel.import') || hasPerm('excel.bulk_edit')) {
    staffItems.push({
      title: 'Excel Operations',
      url: '/excel',
      icon: FileSpreadsheet,
    })
  }

  return [
    {
      title: role === 'CASHIER' ? 'Cashier Terminal' : 'Staff Workspace',
      items: staffItems.length > 0 ? staffItems : [
        {
          title: 'Point of Sale & Invoices',
          url: '/invoices',
          icon: FileText,
        },
      ],
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
