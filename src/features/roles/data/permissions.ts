export interface SystemPermission {
  key: string
  label: string
  description: string
  category: 'Platform' | 'Catalog' | 'Branches' | 'Excel' | 'Staff' | 'Analytics'
  scope: 'COMPANY' | 'MERCHANT' | 'BOTH'
}

export const SYSTEM_PERMISSIONS: SystemPermission[] = [
  // ── Company / Platform Level Permissions ──
  {
    key: 'platform.all',
    label: 'Full System Master Control',
    description: 'Complete unrestricted authority over platform operations, configurations, and multi-tenant data.',
    category: 'Platform',
    scope: 'COMPANY',
  },
  {
    key: 'merchants.roles_manage',
    label: 'Manage & Create Merchant Roles',
    description: 'Authority to define, create, and assign customized roles and permission sets for merchants.',
    category: 'Platform',
    scope: 'COMPANY',
  },
  {
    key: 'merchants.manage',
    label: 'Manage All Merchants',
    description: 'Onboard, edit, suspend, or configure merchant accounts across the entire platform.',
    category: 'Platform',
    scope: 'COMPANY',
  },
  {
    key: 'platform.currencies',
    label: 'Manage Currencies',
    description: 'Configure platform currencies, exchange rates, and assign default merchant currencies.',
    category: 'Platform',
    scope: 'COMPANY',
  },
  {
    key: 'platform.types',
    label: 'Manage Merchant Types',
    description: 'Define and categorize merchant business sectors and tenant industry classifications.',
    category: 'Platform',
    scope: 'COMPANY',
  },
  {
    key: 'platform.audit',
    label: 'View Platform Audit Logs',
    description: 'Inspect full audit trails, security events, and administrative activities across all tenants.',
    category: 'Platform',
    scope: 'COMPANY',
  },

  // ── Merchant Level Permissions ──
  // Catalog & Products
  {
    key: 'merchant.products.view',
    label: 'View Products Catalog',
    description: 'Browse the store product inventory, retail prices, and barcode numbers.',
    category: 'Catalog',
    scope: 'MERCHANT',
  },
  {
    key: 'merchant.products.create',
    label: 'Create Products',
    description: 'Add new products and inventory items to the merchant catalog.',
    category: 'Catalog',
    scope: 'MERCHANT',
  },
  {
    key: 'merchant.products.edit',
    label: 'Edit Products & Prices',
    description: 'Update product prices, names, descriptions, images, and barcodes.',
    category: 'Catalog',
    scope: 'MERCHANT',
  },
  {
    key: 'merchant.products.delete',
    label: 'Delete Products',
    description: 'Permanently remove products from the merchant catalog.',
    category: 'Catalog',
    scope: 'MERCHANT',
  },
  {
    key: 'merchant.categories.manage',
    label: 'Manage Categories',
    description: 'Create, update, and organize store product categories and classifications.',
    category: 'Catalog',
    scope: 'MERCHANT',
  },

  // Branches & QR Codes
  {
    key: 'merchant.branches.view',
    label: 'View Branches',
    description: 'View list of physical branches, addresses, and operational statuses.',
    category: 'Branches',
    scope: 'MERCHANT',
  },
  {
    key: 'merchant.branches.manage',
    label: 'Manage Branches & QR',
    description: 'Create and edit store branches, and generate or regenerate secure customer QR codes.',
    category: 'Branches',
    scope: 'MERCHANT',
  },

  // Excel Bulk Operations
  {
    key: 'merchant.excel.import',
    label: 'Excel File Import',
    description: 'Perform bulk imports of catalog items and inventory spreadsheets.',
    category: 'Excel',
    scope: 'MERCHANT',
  },
  {
    key: 'merchant.excel.bulk_edit',
    label: 'Excel Bulk Update',
    description: 'Bulk update prices and product metadata using spreadsheet uploads.',
    category: 'Excel',
    scope: 'MERCHANT',
  },
  {
    key: 'merchant.excel.bulk_delete',
    label: 'Excel Bulk Delete',
    description: 'Perform bulk removal of catalog items using barcode lists.',
    category: 'Excel',
    scope: 'MERCHANT',
  },

  // Staff & Team Management
  {
    key: 'merchant.staff.view',
    label: 'View Store Staff',
    description: 'View store manager and staff user accounts assigned to this merchant.',
    category: 'Staff',
    scope: 'MERCHANT',
  },
  {
    key: 'merchant.staff.manage',
    label: 'Manage Staff & Roles',
    description: 'Create store staff accounts and assign specific operational permissions.',
    category: 'Staff',
    scope: 'MERCHANT',
  },

  // Analytics & Customer Scanners
  {
    key: 'merchant.analytics.view',
    label: 'View Store Analytics',
    description: 'Access store traffic metrics, top-scanned items, and customer scanning insights.',
    category: 'Analytics',
    scope: 'MERCHANT',
  },
  {
    key: 'merchant.customer_scan.access',
    label: 'Customer Scanner Access',
    description: 'Access and deploy the self-service customer price verification scanner terminal.',
    category: 'Analytics',
    scope: 'MERCHANT',
  },
]

export const PERMISSION_CATEGORIES: {
  category: SystemPermission['category']
  title: string
  description: string
}[] = [
  { category: 'Platform', title: 'Platform & Governance', description: 'Core system and multi-tenant management' },
  { category: 'Catalog', title: 'Catalog & Products', description: 'Inventory, items, prices, and categories' },
  { category: 'Branches', title: 'Branches & QR Codes', description: 'Physical store locations and QR terminals' },
  { category: 'Excel', title: 'Excel Bulk Operations', description: 'Spreadsheet-based bulk importing and editing' },
  { category: 'Staff', title: 'Team & Staff Access', description: 'User accounts, store staff, and permissions' },
  { category: 'Analytics', title: 'Analytics & Scanners', description: 'Customer scanning terminal and reports' },
]
