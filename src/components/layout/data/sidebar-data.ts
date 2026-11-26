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
  BadgePercent,
  MessageCircle,
} from 'lucide-react'
import { User, UserRole, StaffPermissionKey, MerchantFeatureKey, MerchantFeatures } from '@/types/saas'
import { type SidebarData, type NavGroup, type NavItem } from '../types'

export function getSaaSSidebarNav(
  userOrRole: User | UserRole,
  merchantFeatures?: Partial<MerchantFeatures>,
  lang: 'ar' | 'en' = 'en'
): NavGroup[] {
  const isAr = lang === 'ar'
  const t = (ar: string, en: string) => (isAr ? ar : en)

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
            title: t('لوحة التحكم', 'Platform Dashboard'),
            url: '/dashboard',
            icon: LayoutDashboard,
          },
          {
            title: t('نقطة البيع (POS)', 'POS Terminal'),
            url: '/pos',
            icon: Monitor,
          },
          {
            title: t('التجار والمتاجر', 'Merchants'),
            url: '/merchants',
            icon: Building2,
          },
          {
            title: t('الفروع', 'Branches'),
            url: '/branches',
            icon: Store,
          },
          {
            title: t('إدارة المنتجات', 'Product Hub'),
            icon: Boxes,
            items: [
              {
                title: t('المنتجات', 'Products'),
                url: '/products',
                icon: Package,
              },
              {
                title: t('أقسام المنتجات', 'Categories'),
                url: '/categories',
                icon: Tags,
              },
              {
                title: t('الإضافات', 'Add-ons'),
                url: '/add-ons',
                icon: PackagePlus,
              },
            ],
          },
          {
            title: t('العروض والخصومات', 'Offers'),
            url: '/offers',
            icon: BadgePercent,
          },
          {
            title: t('الخدمات', 'Services'),
            icon: Briefcase,
            items: [
              {
                title: t('التصنيفات', 'Categories'),
                url: '/services/categories',
                icon: Tags,
              },
              {
                title: t('الخدمات', 'Services'),
                url: '/services',
                icon: Briefcase,
              },
              {
                title: t('الخدمات الفرعية', 'Sub Services'),
                url: '/services/sub-services',
                icon: GitFork,
              },
            ],
          },
          {
            title: t('التقارير والتحليلات', 'Reports & Analytics'),
            url: '/reports',
            icon: BarChart3,
          },
          {
            title: t('الرسوم والضرائب', 'Fees & Taxes'),
            url: '/fees',
            icon: Receipt,
          },
          {
            title: t('الفواتير', 'Invoices'),
            icon: FileText,
            items: [
              {
                title: t('الفواتير المصدرة', 'Issued Invoices'),
                url: '/invoices',
                icon: FileText,
              },
              {
                title: t('تصميم الفاتورة', 'Invoice Designer'),
                url: '/invoices/design',
                icon: Palette,
              },
              {
                title: t('فواتير واتساب', 'WhatsApp Receipts'),
                url: '/invoices/whatsapp',
                icon: MessageCircle,
              },
            ],
          },
          {
            title: t('الأدوار والمستخدمين', 'Roles & Users'),
            icon: ShieldCheck,
            items: [
              {
                title: t('الأدوار والصلاحيات', 'Roles'),
                url: '/roles',
                icon: ShieldCheck,
              },
              {
                title: t('المستخدمين', 'Users'),
                url: '/users',
                icon: Users,
              },
            ],
          },
          {
            title: t('سجل العمليات', 'Audit Logs'),
            url: '/audit-logs',
            icon: ScrollText,
          },
        ],
      },
    ]
  }

  // 2. Merchant Store Manager / Owner
  if (role === 'MERCHANT_MANAGER') {
    const managerItems: NavItem[] = []

    if (isFeatureEnabled('dashboard')) {
      managerItems.push({
        title: t('لوحة المتجر', 'Store Dashboard'),
        url: '/dashboard',
        icon: LayoutDashboard,
      })
    }
    if (isFeatureEnabled('pos')) {
      managerItems.push({
        title: t('نقطة البيع (POS)', 'POS Terminal'),
        url: '/pos',
        icon: Monitor,
      })
    }
    if (isFeatureEnabled('branches')) {
      managerItems.push({
        title: t('فروع المتجر', 'Store Branches'),
        url: '/branches',
        icon: Store,
      })
    }
    if (isFeatureEnabled('products')) {
      managerItems.push({
        title: t('إدارة المنتجات', 'Product Hub'),
        icon: Boxes,
        items: [
          {
            title: t('المنتجات', 'Products'),
            url: '/products',
            icon: Package,
          },
          {
            title: t('أقسام المنتجات', 'Categories'),
            url: '/categories',
            icon: Tags,
          },
          {
            title: t('الإضافات', 'Add-ons'),
            url: '/add-ons',
            icon: PackagePlus,
          },
        ],
      })
      managerItems.push({
        title: t('العروض والخصومات', 'Offers'),
        url: '/offers',
        icon: BadgePercent,
      })
    }
    if (isFeatureEnabled('invoices')) {
      managerItems.push({
        title: t('الفواتير والمبيعات', 'Invoices & Billing'),
        icon: FileText,
        items: [
          {
            title: t('الفواتير المصدرة', 'Issued Invoices'),
            url: '/invoices',
            icon: FileText,
          },
          {
            title: t('تصميم الفاتورة', 'Invoice Designer'),
            url: '/invoices/design',
            icon: Palette,
          },
          {
            title: t('فواتير واتساب', 'WhatsApp Receipts'),
            url: '/invoices/whatsapp',
            icon: MessageCircle,
          },
        ],
      })
    }
    if (isFeatureEnabled('fees')) {
      managerItems.push({
        title: t('الرسوم والضرائب', 'Fees & Taxes'),
        url: '/fees',
        icon: Receipt,
      })
    }
    if (isFeatureEnabled('staff')) {
      managerItems.push({
        title: t('الكاشير والموظفين', 'Cashiers & Staff'),
        url: '/staff',
        icon: Users,
      })
    }
    if (isFeatureEnabled('reports')) {
      managerItems.push({
        title: t('التقارير والتحليلات', 'Reports & Analytics'),
        url: '/reports',
        icon: BarChart3,
      })
    }
    if (isFeatureEnabled('services')) {
      managerItems.push({
        title: t('الخدمات', 'Services'),
        icon: Briefcase,
        items: [
          {
            title: t('التصنيفات', 'Categories'),
            url: '/services/categories',
            icon: Tags,
          },
          {
            title: t('الخدمات', 'Services'),
            url: '/services',
            icon: Briefcase,
          },
          {
            title: t('الخدمات الفرعية', 'Sub Services'),
            url: '/services/sub-services',
            icon: GitFork,
          },
        ],
      })
    }
    if (isFeatureEnabled('excel')) {
      managerItems.push({
        title: t('عمليات الإكسل', 'Excel Operations'),
        url: '/excel',
        icon: FileSpreadsheet,
      })
    }

    return [
      {
        title: t('إدارة المتجر', 'Store Operations'),
        items: managerItems,
      },
    ]
  }

  // 3. Cashier or Merchant Staff
  const staffItems: NavItem[] = []

  if (isFeatureEnabled('dashboard') && hasPerm('dashboard.view')) {
    staffItems.push({
      title: t('لوحة المتجر', 'Store Dashboard'),
      url: '/dashboard',
      icon: LayoutDashboard,
    })
  }

  if (hasPerm('invoices.view') || hasPerm('invoices.issue') || role === 'CASHIER') {
    if (isFeatureEnabled('pos')) {
      staffItems.push({
        title: t('نقطة البيع (POS)', 'POS Terminal'),
        url: '/pos',
        icon: Monitor,
      })
    }
    if (isFeatureEnabled('invoices')) {
      staffItems.push({
        title: t('الفواتير المصدرة', 'Issued Invoices'),
        url: '/invoices',
        icon: FileText,
      })
    }
  }

  if (isFeatureEnabled('products') && (hasPerm('products.view') || role === 'CASHIER')) {
    staffItems.push({
      title: t('المنتجات والبحث', 'Products & Lookup'),
      url: '/products',
      icon: Package,
    })
    staffItems.push({
      title: t('العروض والخصومات', 'Offers'),
      url: '/offers',
      icon: BadgePercent,
    })
  }

  if (isFeatureEnabled('branches') && hasPerm('branches.view')) {
    staffItems.push({
      title: t('الفروع', 'Branches'),
      url: '/branches',
      icon: Store,
    })
  }

  if (isFeatureEnabled('invoices') && hasPerm('invoices.design')) {
    staffItems.push({
      title: t('تصميم الفاتورة', 'Invoice Designer'),
      url: '/invoices/design',
      icon: Palette,
    })
  }

  if (isFeatureEnabled('fees') && hasPerm('fees.manage')) {
    staffItems.push({
      title: t('الرسوم والضرائب', 'Fees & Taxes'),
      url: '/fees',
      icon: Receipt,
    })
  }

  if (isFeatureEnabled('reports') && hasPerm('reports.view')) {
    staffItems.push({
      title: t('التقارير', 'Reports'),
      url: '/reports',
      icon: BarChart3,
    })
  }

  if (isFeatureEnabled('excel') && (hasPerm('excel.import') || hasPerm('excel.bulk_edit'))) {
    staffItems.push({
      title: t('عمليات الإكسل', 'Excel Operations'),
      url: '/excel',
      icon: FileSpreadsheet,
    })
  }

  return [
    {
      title:
        role === 'CASHIER'
          ? t('نقطة الكاشير', 'Cashier Terminal')
          : t('مساحة الموظف', 'Staff Workspace'),
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
