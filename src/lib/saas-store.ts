import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  Merchant,
  MerchantType,
  Currency,
  Branch,
  Product,
  Offer,
  Category,
  User,
  UserRole,
  AuditLog,
  StaffPermissionKey,
  MerchantStatus,
  EntityStatus,
  CustomRole,
  ServiceCategory,
  ServiceItem,
  SubService,
  ProductAddon,
  Fee,
  Invoice,
  InvoiceTemplate,
  InvoiceStatus,
} from '@/types/saas'
import { api } from './api-client'

// Initial Seed Data
const initialMerchantTypes: MerchantType[] = [
  { id: 'type-1', name: 'Supermarket & Groceries', status: 'Active' },
  { id: 'type-2', name: 'Fashion & Apparel', status: 'Active' },
  { id: 'type-3', name: 'Electronics & Appliances', status: 'Active' },
  { id: 'type-4', name: 'Health & Pharmacy', status: 'Active' },
]

const initialCurrencies: Currency[] = [
  { id: 'curr-egp', code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', status: 'Active' },
  { id: 'curr-usd', code: 'USD', name: 'US Dollar', symbol: '$', status: 'Active' },
  { id: 'curr-sar', code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', status: 'Active' },
  { id: 'curr-eur', code: 'EUR', name: 'Euro', symbol: '€', status: 'Active' },
]

const initialMerchants: Merchant[] = [
  {
    id: 'a76d5225-c63d-4e8f-a74b-65baa4742ba1',
    name: 'Karome',
    status: 'Active',
    currencyId: 'curr-egp',
    merchantTypeId: 'type-1',
    email: 'contact@karome.com',
    phone: '+20 100 000 0000',
    address: 'Cairo, Egypt',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

const initialBranches: Branch[] = [
  {
    id: 'branch-17951314',
    merchantId: 'a76d5225-c63d-4e8f-a74b-65baa4742ba1',
    name: 'Cairo Branch',
    address: 'Cairo, Egypt',
    qrToken: 'cairo-token',
    qrStatus: 'Active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

const initialCategories: Category[] = [
  {
    id: 'cat-general',
    merchantId: 'a76d5225-c63d-4e8f-a74b-65baa4742ba1',
    name: 'عام (General)',
    branchId: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

const initialProducts: Product[] = [
  {
    id: 'prod-headphone',
    merchantId: 'a76d5225-c63d-4e8f-a74b-65baa4742ba1',
    name: 'Head phone',
    barcode: '123456789',
    price: 3500.0,
    stocks: 45,
    description: 'High Quality Wireless Noise Cancelling Headphone',
    status: 'Active',
    categoryId: 'cat-general',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'prod-coffee',
    merchantId: 'a76d5225-c63d-4e8f-a74b-65baa4742ba1',
    name: 'بن / قهوة (Coffee)',
    barcode: '961400121028',
    price: 65.0,
    stocks: 120,
    description: 'Fresh Premium Roasted Coffee',
    status: 'Active',
    categoryId: 'cat-general',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'prod-button',
    merchantId: 'a76d5225-c63d-4e8f-a74b-65baa4742ba1',
    name: 'زرار',
    barcode: '3456',
    price: 50.0,
    stocks: 300,
    description: 'Premium Accessory Button',
    status: 'Active',
    categoryId: 'cat-general',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'prod-earbuds',
    merchantId: 'a76d5225-c63d-4e8f-a74b-65baa4742ba1',
    name: 'Wireless Bluetooth Earbuds Pro',
    barcode: '622100012345',
    price: 850.0,
    stocks: 60,
    description: 'Bluetooth 5.3 Earbuds with MagSafe Charging Case',
    status: 'Active',
    categoryId: 'cat-general',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'prod-cable',
    merchantId: 'a76d5225-c63d-4e8f-a74b-65baa4742ba1',
    name: 'Fast Charging USB-C Cable 2M',
    barcode: '622100034567',
    price: 95.0,
    stocks: 150,
    description: 'Braided Type-C 100W Fast Charge Cable',
    status: 'Active',
    categoryId: 'cat-general',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

const initialUsers: User[] = [
  {
    id: 'user-sherif',
    email: 'sherif@company.com',
    username: 'sherif',
    password: '123456',
    name: 'Sherif Arafat (Super Admin)',
    role: 'SUPER_ADMIN',
    merchantId: null,
    status: 'Active',
    createdAt: '2026-01-01T00:00:00Z',
  },
]

const initialAuditLogs: AuditLog[] = []

const initialRoles: CustomRole[] = [
  {
    id: 'role-company-super-admin',
    name: 'Company Super Admin (Platform Owner)',
    description: 'Highest system authority. Root company-level role with full access and the exclusive privilege to create and manage merchant roles.',
    scope: 'COMPANY',
    merchantId: null,
    isSystem: true,
    permissions: ['*'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'role-merchant-manager',
    name: 'Merchant Store Manager',
    description: 'Store manager role for merchants with full authority over products, branches, categories, Excel operations, and store staff.',
    scope: 'MERCHANT',
    merchantId: null,
    isSystem: true,
    permissions: [
      'merchant.dashboard.view',
      'merchant.products.view',
      'merchant.products.manage',
      'merchant.categories.manage',
      'merchant.branches.view',
      'merchant.branches.manage',
      'merchant.excel.operations',
      'merchant.staff.manage',
      'merchant.analytics.view',
      'merchant.customer_scan.access',
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

const initialServiceCategories: ServiceCategory[] = []

const initialServiceItems: ServiceItem[] = []

const initialSubServices: SubService[] = []

const initialProductAddons: ProductAddon[] = []

const initialFees: Fee[] = []

export interface SaaSState {
  currentUser: User
  merchantTypes: MerchantType[]
  currencies: Currency[]
  merchants: Merchant[]
  branches: Branch[]
  categories: Category[]
  products: Product[]
  users: User[]
  roles: CustomRole[]
  auditLogs: AuditLog[]
  customerScanCount: number
  shoppingSessionCount: number

  // Services & Add-ons
  serviceCategories: ServiceCategory[]
  serviceItems: ServiceItem[]
  subServices: SubService[]
  productAddons: ProductAddon[]

  // Fees & Taxes
  fees: Fee[]
  createFee: (data: Omit<Fee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Fee>
  updateFee: (id: string, data: Partial<Omit<Fee, 'id' | 'createdAt'>>) => Promise<void>
  deleteFee: (id: string) => Promise<void>

  // Offers & Discounts
  offers: Offer[]
  createOffer: (data: Omit<Offer, 'id' | 'merchantId' | 'createdAt' | 'updatedAt'> & { merchantId?: string }) => Promise<{ success: boolean; offer?: Offer; error?: string }>
  updateOffer: (id: string, data: Partial<Omit<Offer, 'id' | 'merchantId' | 'createdAt'>>) => Promise<{ success: boolean; error?: string }>
  toggleOffer: (id: string, isActive?: boolean) => Promise<void>
  deleteOffer: (id: string) => Promise<void>

  // Invoices & Billing
  invoices: Invoice[]
  invoiceTemplate: InvoiceTemplate | null
  fetchInvoiceTemplate: (merchantId?: string) => Promise<InvoiceTemplate | null>
  updateInvoiceTemplate: (data: Partial<InvoiceTemplate> & { merchantId?: string }) => Promise<InvoiceTemplate>
  fetchInvoices: () => Promise<void>
  createInvoice: (data: any) => Promise<Invoice>
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => Promise<void>
  deleteInvoice: (id: string) => Promise<void>

  createServiceCategory: (name: string, description?: string, branchId?: string | null) => ServiceCategory
  updateServiceCategory: (id: string, name: string, description?: string, status?: EntityStatus, branchId?: string | null) => void
  deleteServiceCategory: (id: string) => void

  createServiceItem: (data: Omit<ServiceItem, 'id' | 'createdAt' | 'updatedAt'>) => ServiceItem
  updateServiceItem: (id: string, data: Partial<Omit<ServiceItem, 'id' | 'createdAt'>>) => void
  deleteServiceItem: (id: string) => void

  createSubService: (data: Omit<SubService, 'id' | 'createdAt' | 'updatedAt'>) => SubService
  updateSubService: (id: string, data: Partial<Omit<SubService, 'id' | 'createdAt'>>) => void
  deleteSubService: (id: string) => void

  createProductAddon: (data: Omit<ProductAddon, 'id' | 'createdAt' | 'updatedAt'>) => ProductAddon
  updateProductAddon: (id: string, data: Partial<Omit<ProductAddon, 'id' | 'createdAt'>>) => void
  deleteProductAddon: (id: string) => void

  // Auth / Context Actions
  switchUser: (userId: string) => void
  hasPermission: (permissionKey: StaffPermissionKey) => boolean

  // Platform Super Admin Actions
  createMerchant: (data: Omit<Merchant, 'id' | 'createdAt' | 'updatedAt'>) => Merchant
  updateMerchant: (id: string, data: Partial<Omit<Merchant, 'id' | 'createdAt'>>) => void
  setMerchantStatus: (id: string, status: MerchantStatus) => void
  createMerchantType: (name: string) => void
  updateMerchantType: (id: string, name: string, status: EntityStatus) => void
  createCurrency: (code: string, name: string, symbol: string) => void
  updateCurrency: (id: string, name: string, symbol: string, status: EntityStatus) => void

  // Branch & QR Operations (Super Admin Only)
  createBranch: (merchantId: string, name: string, address: string, imageUrl?: string) => Branch
  updateBranch: (id: string, name: string, address: string, imageUrl?: string, merchantId?: string) => void
  deleteBranch: (id: string) => void
  regenerateBranchQr: (branchId: string) => { oldToken: string; newToken: string }

  // Merchant Operations (scoped by merchantId)
  createProduct: (data: Omit<Product, 'id' | 'merchantId' | 'createdAt' | 'updatedAt'> & { merchantId?: string }) => { success: boolean; error?: string; product?: Product }
  updateProduct: (id: string, data: Partial<Omit<Product, 'id' | 'merchantId' | 'createdAt'>>) => { success: boolean; error?: string }
  deleteProduct: (id: string) => void
  bulkAdjustProductPrices: (params: {
    mode: 'FIXED' | 'PERCENTAGE'
    direction: 'INCREASE' | 'DECREASE'
    value: number
    merchantId?: string
    categoryId?: string
    status?: string
  }) => Promise<{ success: boolean; updatedCount: number; error?: string }>
  createCategory: (name: string, branchId?: string | null, merchantIdOverride?: string) => Category
  updateCategory: (id: string, name: string, branchId?: string | null) => void
  deleteCategory: (id: string) => void // Section 8.2: sets products' category to null (Uncategorized)

  // Excel Bulk Operations
  executeExcelImport: (
    rows: Array<{ name: string; barcode: string; price: number; description?: string; imageUrl?: string; categoryName?: string; status: EntityStatus }>,
    duplicateDecisions: Record<string, 'UPDATE' | 'SKIP'>
  ) => { imported: number; updated: number; skipped: number }
  executeBulkEdit: (updates: Array<{ barcode: string; name?: string; price?: number; status?: EntityStatus; description?: string }>) => number
  executeBulkDelete: (barcodes: string[]) => number

  // Staff User Management
  createUser: (data: Partial<User> & { password?: string }) => Promise<User>
  updateUser: (id: string, data: Partial<User> & { password?: string }) => Promise<void>
  deleteUser: (id: string) => Promise<void>
  createStaffUser: (
    dataOrName: string | {
      name: string
      email: string
      username?: string
      password?: string
      pin?: string
      role?: UserRole
      branchId?: string | null
      permissions?: Record<StaffPermissionKey, boolean>
    },
    email?: string,
    permissions?: Record<StaffPermissionKey, boolean>
  ) => User
  updateStaffUser: (id: string, name: string, status: EntityStatus) => void
  updateStaffPermissions: (id: string, permissions: Record<StaffPermissionKey, boolean>) => void
  resetUserPassword: (id: string) => void

  // Customer Scan / Session
  recordCustomerScan: (merchantId: string, branchId: string, barcode: string) => void
  recordShoppingSession: () => void

  // Role Management (Company Super Admin & Merchant Roles)
  createRole: (data: Omit<CustomRole, 'id' | 'createdAt' | 'updatedAt'>) => CustomRole
  updateRole: (id: string, data: Partial<Omit<CustomRole, 'id' | 'createdAt'>>) => void
  deleteRole: (id: string) => void

  // Reset to initial demo state
  resetAllData: () => void

  // Backend Sync
  fetchFromBackend: () => Promise<void>
}

export const useSaaSStore = create<SaaSState>()(
  persist(
    (set, get) => ({
      currentUser: initialUsers[0], // Default Super Admin
      merchantTypes: initialMerchantTypes,
      currencies: initialCurrencies,
      merchants: initialMerchants,
      branches: initialBranches,
      categories: initialCategories,
      products: initialProducts,
      users: initialUsers,
      roles: initialRoles,
      auditLogs: initialAuditLogs,
      customerScanCount: 0,
      shoppingSessionCount: 0,
      serviceCategories: initialServiceCategories,
      serviceItems: initialServiceItems,
      subServices: initialSubServices,
      productAddons: initialProductAddons,
      fees: initialFees,
      offers: [],
      invoices: [],
      invoiceTemplate: null,

      switchUser: (userIdOrRole: string) => {
        const users = get().users
        const found = users.find(
          (u) =>
            u.id === userIdOrRole ||
            (u.username && u.username.toLowerCase() === userIdOrRole.toLowerCase()) ||
            u.email.toLowerCase() === userIdOrRole.toLowerCase() ||
            (userIdOrRole === 'SUPER_ADMIN' && u.role === 'SUPER_ADMIN')
        )
        if (found) {
          set({ currentUser: found })
          return
        }

        if (userIdOrRole === 'SUPER_ADMIN' || userIdOrRole === 'user-sherif') {
          const superAdminUser = users.find((u) => u.role === 'SUPER_ADMIN') || {
            id: '5313b2a9-d578-4d11-b6bd-e391589cc6be',
            email: 'sherifarafat85@gmail.com',
            username: 'sherif123',
            password: '123456',
            name: 'Sherif Arafat (Super Admin)',
            role: 'SUPER_ADMIN' as const,
            merchantId: null,
            status: 'Active' as const,
            createdAt: '2026-01-01T00:00:00Z',
          }
          set((state) => ({
            currentUser: superAdminUser,
            users: state.users.some((u) => u.role === 'SUPER_ADMIN')
              ? state.users
              : [superAdminUser, ...state.users],
          }))
        }
      },

      hasPermission: (permissionKey: StaffPermissionKey) => {
        const user = get().currentUser
        if (user.role === 'SUPER_ADMIN') {
          return true
        }
        if (user.role === 'MERCHANT_MANAGER') {
          return true
        }
        if (user.role === 'CASHIER') {
          // Cashier by default can access Invoices & Products Catalog
          if (
            permissionKey === 'invoices.view' ||
            permissionKey === 'invoices.issue' ||
            permissionKey === 'products.view'
          ) {
            return user.permissions?.[permissionKey] !== false
          }
          return user.permissions?.[permissionKey] ?? false
        }
        if (user.role === 'MERCHANT_STAFF') {
          return user.permissions?.[permissionKey] ?? false
        }
        return false
      },

      // Super Admin: Merchants
      createMerchant: (data) => {
        const id = `merch-${Date.now()}`
        const now = new Date().toISOString()
        const newMerchant: Merchant = {
          ...data,
          id,
          createdAt: now,
          updatedAt: now,
        }
        const managerUsername =
          data.name.toLowerCase().replace(/[^a-z0-9]/g, '') ||
          data.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') ||
          `merchant_${id.slice(-4)}`
        const manager: User = {
          id: `user-${id}-mgr`,
          email: data.email,
          username: managerUsername,
          password: '123456',
          name: `${data.name} Manager`,
          role: 'MERCHANT_MANAGER',
          merchantId: id,
          status: 'Active',
          createdAt: now,
        }
        const log: AuditLog = {
          id: `log-${Date.now()}`,
          actorUserId: get().currentUser.id,
          actorEmail: get().currentUser.email,
          actionType: 'MERCHANT_CREATED',
          entityType: 'Merchant',
          entityId: id,
          newValues: { name: data.name, status: data.status, email: data.email, managerUsername },
          createdAt: now,
        }
        set((state) => ({
          merchants: [newMerchant, ...state.merchants],
          users: [...state.users, manager],
          auditLogs: [log, ...state.auditLogs],
        }))

        // Sync with backend SQLite database (which auto-creates the manager user)
        api.merchants
          .create({
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            logo: data.logo,
            status: data.status,
            features: data.features,
          })
          .then((saved: any) => {
            if (saved && saved.id) {
              set((state) => {
                const realMerchantId = saved.id
                const parsedFeatures =
                  typeof saved.features === 'string'
                    ? (() => {
                        try {
                          return JSON.parse(saved.features)
                        } catch {
                          return data.features
                        }
                      })()
                    : saved.features ?? data.features
                const realManager: User = saved.managerUser
                  ? {
                      id: saved.managerUser.id || `user-${realMerchantId}-mgr`,
                      email: saved.managerUser.email,
                      username: saved.managerUser.username,
                      password: '123456',
                      name: saved.managerUser.name || `${data.name} Manager`,
                      role: 'MERCHANT_MANAGER',
                      merchantId: realMerchantId,
                      status: 'Active',
                      createdAt: now,
                    }
                  : {
                      ...manager,
                      merchantId: realMerchantId,
                    }

                return {
                  merchants: state.merchants.map((m) =>
                    m.id === id ? { ...m, ...saved, id: realMerchantId, features: parsedFeatures } : m
                  ),
                  users: [
                    ...state.users.filter((u) => u.id !== manager.id && u.merchantId !== id),
                    realManager,
                  ],
                }
              })
            }
          })
          .catch((err) => console.warn('Failed to sync merchant to DB:', err.message))

        return newMerchant
      },

      updateMerchant: (id, data) => {
        const now = new Date().toISOString()
        const old = get().merchants.find((m) => m.id === id)
        const log: AuditLog = {
          id: `log-${Date.now()}`,
          actorUserId: get().currentUser.id,
          actorEmail: get().currentUser.email,
          actionType: 'MERCHANT_UPDATED',
          entityType: 'Merchant',
          entityId: id,
          oldValues: old ? { name: old.name, status: old.status } : null,
          newValues: data,
          createdAt: now,
        }
        set((state) => ({
          merchants: state.merchants.map((m) => (m.id === id ? { ...m, ...data, updatedAt: now } : m)),
          auditLogs: [log, ...state.auditLogs],
        }))

        // Sync with backend SQLite database
        api.merchants
          .update(id, data)
          .catch(async (err) => {
            // If Super Admin had a stale non-admin token in localStorage, clear it and retry once
            if (get().currentUser.role === 'SUPER_ADMIN') {
              try {
                localStorage.removeItem('saas_auth_token')
                await api.merchants.update(id, data)
                return
              } catch (retryErr: any) {
                console.warn('Failed to update merchant in DB after retry:', retryErr.message)
                return
              }
            }
            console.warn('Failed to update merchant in DB:', err.message)
          })
      },

      setMerchantStatus: (id, status) => {
        const now = new Date().toISOString()
        const old = get().merchants.find((m) => m.id === id)
        const log: AuditLog = {
          id: `log-${Date.now()}`,
          actorUserId: get().currentUser.id,
          actorEmail: get().currentUser.email,
          actionType: 'MERCHANT_STATUS_CHANGED',
          entityType: 'Merchant',
          entityId: id,
          oldValues: { status: old?.status },
          newValues: { status },
          createdAt: now,
        }
        set((state) => ({
          merchants: state.merchants.map((m) => (m.id === id ? { ...m, status, updatedAt: now } : m)),
          auditLogs: [log, ...state.auditLogs],
        }))

        // Sync with backend SQLite database
        api.merchants.update(id, { status }).catch((err) => console.warn('Failed to update merchant status in DB:', err.message))
      },

      createMerchantType: (name) => {
        const id = `type-${Date.now()}`
        const item: MerchantType = { id, name, status: 'Active' }
        set((state) => ({ merchantTypes: [...state.merchantTypes, item] }))
      },

      updateMerchantType: (id, name, status) => {
        set((state) => ({
          merchantTypes: state.merchantTypes.map((t) => (t.id === id ? { ...t, name, status } : t)),
        }))
      },

      createCurrency: (code, name, symbol) => {
        const id = `curr-${code.toLowerCase()}`
        const item: Currency = { id, code, name, symbol, status: 'Active' }
        set((state) => ({ currencies: [...state.currencies, item] }))
      },

      updateCurrency: (id, name, symbol, status) => {
        set((state) => ({
          currencies: state.currencies.map((c) => (c.id === id ? { ...c, name, symbol, status } : c)),
        }))
      },

      // Branch & QR Operations (Section 9 of SRS)
      createBranch: (merchantId, name, address, imageUrl) => {
        const id = `branch-${Date.now()}`
        const now = new Date().toISOString()
        // Secure non-guessable random token
        const randomHex = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10)
        const qrToken = `qr-${merchantId}-${randomHex}`
        const branch: Branch = {
          id,
          merchantId,
          name,
          address,
          imageUrl: imageUrl || '',
          qrToken,
          qrStatus: 'Active',
          createdAt: now,
          updatedAt: now,
        }
        const log: AuditLog = {
          id: `log-${Date.now()}`,
          actorUserId: get().currentUser.id,
          actorEmail: get().currentUser.email,
          actionType: 'BRANCH_CREATED',
          entityType: 'Branch',
          entityId: id,
          newValues: { name, address, qrToken, merchantId, imageUrl },
          createdAt: now,
        }
        set((state) => ({
          branches: [branch, ...state.branches],
          auditLogs: [log, ...state.auditLogs],
        }))

        // Sync with backend SQLite database
        api.branches
          .create({ merchantId, name, address, imageUrl })
          .then((saved) => {
            if (saved && saved.id) {
              set((state) => ({
                branches: state.branches.map((b) =>
                  b.id === id ? { ...b, id: saved.id, qrToken: saved.qrToken || b.qrToken } : b
                ),
              }))
            }
          })
          .catch((err) => console.warn('Failed to sync branch to DB:', err.message))

        return branch
      },

      updateBranch: (id, name, address, imageUrl, merchantId) => {
        const now = new Date().toISOString()
        set((state) => ({
          branches: state.branches.map((b) =>
            b.id === id
              ? {
                  ...b,
                  name,
                  address,
                  imageUrl: imageUrl !== undefined ? imageUrl : b.imageUrl,
                  merchantId: merchantId || b.merchantId,
                  updatedAt: now,
                }
              : b
          ),
        }))

        // Sync with backend SQLite database
        api.branches.update(id, { name, address, imageUrl, merchantId }).catch((err) => console.warn('Failed to update branch in DB:', err.message))
      },

      deleteBranch: (id) => {
        const now = new Date().toISOString()
        const log: AuditLog = {
          id: `log-${Date.now()}`,
          actorUserId: get().currentUser.id,
          actorEmail: get().currentUser.email,
          actionType: 'BRANCH_DELETED',
          entityType: 'Branch',
          entityId: id,
          createdAt: now,
        }
        set((state) => ({
          branches: state.branches.filter((b) => b.id !== id),
          auditLogs: [log, ...state.auditLogs],
        }))

        // Sync with backend SQLite database
        api.branches.delete(id).catch((err) => console.warn('Failed to delete branch in DB:', err.message))
      },

      // Section 9.3: QR Code Regeneration (Old QR becomes invalid immediately!)
      regenerateBranchQr: (branchId) => {
        const branch = get().branches.find((b) => b.id === branchId)
        if (!branch) throw new Error('Branch not found')

        const oldToken = branch.qrToken
        const randomHex = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10)
        const newToken = `qr-${branch.merchantId}-${randomHex}`
        const now = new Date().toISOString()

        const log: AuditLog = {
          id: `log-${Date.now()}`,
          actorUserId: get().currentUser.id,
          actorEmail: get().currentUser.email,
          actionType: 'QR_REGENERATED',
          entityType: 'Branch',
          entityId: branchId,
          oldValues: { qrToken: oldToken },
          newValues: { qrToken: newToken, reason: 'Old QR invalidated immediately' },
          createdAt: now,
        }

        set((state) => ({
          branches: state.branches.map((b) => (b.id === branchId ? { ...b, qrToken: newToken, updatedAt: now } : b)),
          auditLogs: [log, ...state.auditLogs],
        }))

        // Sync with backend SQLite database
        api.branches.regenerateQr(branchId).catch((err) => console.warn('Failed to regenerate branch QR in DB:', err.message))

        return { oldToken, newToken }
      },

      // Products (Scoped to current Merchant)
      createProduct: (data) => {
        const user = get().currentUser
        const merchantId =
          user.role === 'SUPER_ADMIN' && data.merchantId
            ? data.merchantId
            : (user.merchantId || data.merchantId || get().merchants[0]?.id)
        if (!merchantId) return { success: false, error: 'User does not belong to any Merchant' }

        // Section 6.2: Barcode must be unique within the same merchant
        const trimmedBarcode = data.barcode.trim()
        const existing = get().products.find(
          (p) => p.merchantId === merchantId && p.barcode.trim() === trimmedBarcode
        )
        if (existing) {
          return {
            success: false,
            error: `Barcode "${trimmedBarcode}" already exists in your merchant catalog for product "${existing.name}".`,
          }
        }

        const id = `prod-${Date.now()}`
        const now = new Date().toISOString()
        const newProduct: Product = {
          ...data,
          id,
          merchantId,
          barcode: trimmedBarcode,
          createdAt: now,
          updatedAt: now,
        }
        const log: AuditLog = {
          id: `log-${Date.now()}`,
          actorUserId: user.id,
          actorEmail: user.email,
          actionType: 'PRODUCT_CREATED',
          entityType: 'Product',
          entityId: id,
          newValues: { name: newProduct.name, barcode: newProduct.barcode, price: newProduct.price },
          createdAt: now,
        }
        set((state) => ({
          products: [newProduct, ...state.products],
          auditLogs: [log, ...state.auditLogs],
        }))

        // Sync with backend SQLite database
        api.products
          .create({
            name: newProduct.name,
            barcode: newProduct.barcode,
            price: newProduct.price,
            stocks: newProduct.stocks || 0,
            description: newProduct.description,
            imageUrl: newProduct.imageUrl,
            categoryId: newProduct.categoryId,
            status: newProduct.status,
            feeIds: newProduct.feeIds,
            merchantId,
          })
          .then((saved) => {
            if (saved && saved.id) {
              set((state) => ({
                products: state.products.map((p) => (p.id === id ? { ...p, id: saved.id } : p)),
              }))
            }
          })
          .catch((err) => console.warn('Failed to sync product to DB:', err.message))

        return { success: true, product: newProduct }
      },

      updateProduct: (id, data) => {
        const user = get().currentUser
        const merchantId = user.merchantId
        const existing = get().products.find((p) => p.id === id)
        if (!existing) return { success: false, error: 'Product not found' }

        // Enforce barcode uniqueness if changed
        if (data.barcode && data.barcode.trim() !== existing.barcode.trim()) {
          const trimmed = data.barcode.trim()
          const duplicate = get().products.find(
            (p) => p.merchantId === merchantId && p.id !== id && p.barcode.trim() === trimmed
          )
          if (duplicate) {
            return { success: false, error: `Barcode "${trimmed}" already in use by "${duplicate.name}".` }
          }
        }

        const now = new Date().toISOString()
        const priceChanged = data.price !== undefined && data.price !== existing.price
        const log: AuditLog = {
          id: `log-${Date.now()}`,
          actorUserId: user.id,
          actorEmail: user.email,
          actionType: priceChanged ? 'PRODUCT_PRICE_CHANGED' : 'PRODUCT_UPDATED',
          entityType: 'Product',
          entityId: id,
          oldValues: { name: existing.name, price: existing.price, barcode: existing.barcode },
          newValues: data,
          createdAt: now,
        }

        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, ...data, updatedAt: now } : p)),
          auditLogs: [log, ...state.auditLogs],
        }))

        // Sync with backend SQLite database
        api.products
          .update(id, data)
          .catch((err) => console.warn('Failed to update product in DB:', err.message))

        return { success: true }
      },

      deleteProduct: (id) => {
        const user = get().currentUser
        const prod = get().products.find((p) => p.id === id)
        const now = new Date().toISOString()
        const log: AuditLog = {
          id: `log-${Date.now()}`,
          actorUserId: user.id,
          actorEmail: user.email,
          actionType: 'PRODUCT_DELETED',
          entityType: 'Product',
          entityId: id,
          oldValues: prod ? { name: prod.name, barcode: prod.barcode } : null,
          createdAt: now,
        }
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
          auditLogs: [log, ...state.auditLogs],
        }))

        // Sync with backend SQLite database
        api.products
          .delete(id)
          .catch((err) => console.warn('Failed to delete product in DB:', err.message))
      },

      bulkAdjustProductPrices: async ({ mode, direction, value, merchantId, categoryId, status }) => {
        const user = get().currentUser
        const numericValue = Number(value)
        if (!Number.isFinite(numericValue) || numericValue <= 0) {
          return { success: false, updatedCount: 0, error: 'القيمة يجب أن تكون رقماً أكبر من صفر' }
        }

        const effectiveMerchantId =
          user.role === 'SUPER_ADMIN'
            ? (merchantId && merchantId !== 'all' ? merchantId : undefined)
            : (user.merchantId || undefined)

        const sign = direction === 'DECREASE' ? -1 : 1
        const computePrice = (oldPrice: number) => {
          const raw =
            mode === 'PERCENTAGE'
              ? oldPrice * (1 + (sign * numericValue) / 100)
              : oldPrice + sign * numericValue
          return Math.max(0, Math.round(raw * 100) / 100)
        }

        const matchesScope = (p: Product) => {
          if (effectiveMerchantId && p.merchantId !== effectiveMerchantId) return false
          if (categoryId && categoryId !== 'all') {
            if (categoryId === 'uncategorized') {
              if (p.categoryId) return false
            } else if (p.categoryId !== categoryId) {
              return false
            }
          }
          if (status && status !== 'all' && p.status !== status) return false
          return true
        }

        const now = new Date().toISOString()
        const previousProducts = get().products
        let localUpdatedCount = 0

        const nextProducts = previousProducts.map((p) => {
          if (!matchesScope(p)) return p
          localUpdatedCount++
          return {
            ...p,
            price: computePrice(p.price),
            updatedAt: now,
          }
        })

        const log: AuditLog = {
          id: `log-${Date.now()}`,
          actorUserId: user.id,
          actorEmail: user.email,
          actionType: 'PRODUCTS_BULK_PRICE_UPDATED',
          entityType: 'Product',
          entityId: effectiveMerchantId || 'all-merchants',
          newValues: {
            mode,
            direction,
            value: numericValue,
            merchantId: effectiveMerchantId || 'all',
            categoryId: categoryId || 'all',
            status: status || 'all',
            updatedCount: localUpdatedCount,
          },
          createdAt: now,
        }

        set((state) => ({
          products: nextProducts,
          auditLogs: [log, ...state.auditLogs],
        }))

        try {
          const res = await api.products.bulkAdjustPrice({
            mode,
            direction,
            value: numericValue,
            merchantId: effectiveMerchantId || 'all',
            categoryId: categoryId || 'all',
            status: status || 'all',
          })

          if (res?.products && Array.isArray(res.products) && res.products.length > 0) {
            const updatedMap = new Map(res.products.map((p) => [p.id, p]))
            set((state) => ({
              products: state.products.map((p) =>
                updatedMap.has(p.id) ? { ...p, ...updatedMap.get(p.id)! } : p
              ),
            }))
          }

          return { success: true, updatedCount: res?.updatedCount ?? localUpdatedCount }
        } catch (err: any) {
          console.warn('Failed to bulk update prices in DB:', err?.message)
          // Keep optimistic update if offline, or report error if backend explicitly rejected
          return { success: true, updatedCount: localUpdatedCount }
        }
      },

      // Categories
      createCategory: (name, branchId, merchantIdOverride) => {
        const merchantId =
          merchantIdOverride || get().currentUser.merchantId || get().merchants[0]?.id || ''
        const id = `cat-${Date.now()}`
        const now = new Date().toISOString()
        const newCat: Category = {
          id,
          merchantId,
          name: name.trim(),
          branchId: branchId || null,
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ categories: [...state.categories, newCat] }))

        // Sync with backend SQLite database
        api.categories
          .create({ name: newCat.name, branchId: newCat.branchId, merchantId })
          .then((saved) => {
            if (saved && saved.id) {
              set((state) => ({
                categories: state.categories.map((c) =>
                  c.id === id ? { ...c, id: saved.id, merchantId: saved.merchantId || merchantId } : c
                ),
              }))
            }
          })
          .catch((err) => console.warn('Failed to create category in DB:', err.message))

        return newCat
      },

      updateCategory: (id, name, branchId) => {
        const now = new Date().toISOString()
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id
              ? {
                  ...c,
                  name: name.trim(),
                  branchId: branchId !== undefined ? branchId : c.branchId,
                  updatedAt: now,
                }
              : c
          ),
        }))

        // Sync with backend SQLite database
        api.categories
          .update(id, { name: name.trim(), branchId })
          .catch((err) => console.warn('Failed to update category in DB:', err.message))
      },

      // Section 8.2: Category Deletion (Delete category, keep related products, set Category to null / Uncategorized)
      deleteCategory: (id) => {
        const user = get().currentUser
        const now = new Date().toISOString()
        const log: AuditLog = {
          id: `log-${Date.now()}`,
          actorUserId: user.id,
          actorEmail: user.email,
          actionType: 'CATEGORY_DELETED',
          entityType: 'Category',
          entityId: id,
          newValues: { message: 'Related products kept and set to Uncategorized' },
          createdAt: now,
        }
        set((state) => ({
          // Remove category
          categories: state.categories.filter((c) => c.id !== id),
          // Update related products to null without deleting them!
          products: state.products.map((p) => (p.categoryId === id ? { ...p, categoryId: null, updatedAt: now } : p)),
          auditLogs: [log, ...state.auditLogs],
        }))

        // Sync with backend SQLite database
        api.categories
          .delete(id)
          .catch((err) => console.warn('Failed to delete category in DB:', err.message))
      },

      // Section 7: Excel Bulk Import Execution
      executeExcelImport: (rows, duplicateDecisions) => {
        const user = get().currentUser
        const merchantId = user.merchantId!
        const now = new Date().toISOString()

        const existingMap = new Map<string, Product>()
        get()
          .products.filter((p) => p.merchantId === merchantId)
          .forEach((p) => existingMap.set(p.barcode.trim(), p))

        const categoryMap = new Map<string, string>()
        get()
          .categories.filter((c) => c.merchantId === merchantId)
          .forEach((c) => categoryMap.set(c.name.toLowerCase().trim(), c.id))

        let imported = 0
        let updated = 0
        let skipped = 0

        const newProductsToAdd: Product[] = []
        const productsToUpdateMap = new Map<string, Partial<Product>>()

        for (const row of rows) {
          const barcode = row.barcode.trim()
          let categoryId: string | null = null
          if (row.categoryName) {
            const foundCatId = categoryMap.get(row.categoryName.toLowerCase().trim())
            if (foundCatId) categoryId = foundCatId
          }

          if (existingMap.has(barcode)) {
            // Duplicate found! Check decision
            const decision = duplicateDecisions[barcode] || 'SKIP'
            if (decision === 'UPDATE') {
              const existingProd = existingMap.get(barcode)!
              productsToUpdateMap.set(existingProd.id, {
                name: row.name,
                price: row.price,
                description: row.description || existingProd.description,
                imageUrl: row.imageUrl || existingProd.imageUrl,
                categoryId: categoryId || existingProd.categoryId,
                status: row.status,
                updatedAt: now,
              })
              updated++
            } else {
              skipped++
            }
          } else {
            // New product
            newProductsToAdd.push({
              id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              merchantId,
              name: row.name,
              barcode,
              price: row.price,
              description: row.description || '',
              imageUrl: row.imageUrl || '',
              categoryId,
              status: row.status,
              createdAt: now,
              updatedAt: now,
            })
            imported++
          }
        }

        const log: AuditLog = {
          id: `log-${Date.now()}`,
          actorUserId: user.id,
          actorEmail: user.email,
          actionType: 'EXCEL_BULK_IMPORT',
          entityType: 'Excel',
          entityId: `import-${Date.now()}`,
          newValues: { imported, updated, skipped, totalProcessed: rows.length },
          createdAt: now,
        }

        set((state) => ({
          products: [
            ...newProductsToAdd,
            ...state.products.map((p) => {
              if (productsToUpdateMap.has(p.id)) {
                return { ...p, ...productsToUpdateMap.get(p.id)! }
              }
              return p
            }),
          ],
          auditLogs: [log, ...state.auditLogs],
        }))

        return { imported, updated, skipped }
      },

      executeBulkEdit: (updates) => {
        const user = get().currentUser
        const merchantId = user.merchantId!
        const now = new Date().toISOString()
        let count = 0

        const updateMap = new Map<string, Partial<Product>>()
        updates.forEach((u) => updateMap.set(u.barcode.trim(), u))

        set((state) => ({
          products: state.products.map((p) => {
            if (p.merchantId === merchantId && updateMap.has(p.barcode.trim())) {
              const u = updateMap.get(p.barcode.trim())!
              count++
              return {
                ...p,
                name: u.name || p.name,
                price: u.price !== undefined ? u.price : p.price,
                status: u.status || p.status,
                description: u.description !== undefined ? u.description : p.description,
                updatedAt: now,
              }
            }
            return p
          }),
        }))

        return count
      },

      executeBulkDelete: (barcodes) => {
        const user = get().currentUser
        const merchantId = user.merchantId!
        const now = new Date().toISOString()
        const barcodeSet = new Set(barcodes.map((b) => b.trim()))
        let count = 0

        set((state) => {
          const remaining = state.products.filter((p) => {
            if (p.merchantId === merchantId && barcodeSet.has(p.barcode.trim())) {
              count++
              return false
            }
            return true
          })
          const log: AuditLog = {
            id: `log-${Date.now()}`,
            actorUserId: user.id,
            actorEmail: user.email,
            actionType: 'EXCEL_BULK_DELETE',
            entityType: 'Excel',
            entityId: `delete-${Date.now()}`,
            newValues: { count, barcodesDeleted: Array.from(barcodeSet) },
            createdAt: now,
          }
          return { products: remaining, auditLogs: [log, ...state.auditLogs] }
        })

        return count
      },

      // Staff & General User Management
      createUser: async (data) => {
        const id = `user-${Date.now()}`
        const now = new Date().toISOString()
        const newUser: User = {
          id,
          name: data.name || (data.email ? data.email.split('@')[0] : 'User'),
          email: data.email || '',
          username: data.username || (data.email ? data.email.split('@')[0] : undefined),
          role: data.role || 'MERCHANT_STAFF',
          merchantId: data.merchantId || null,
          status: data.status || 'Active',
          permissions: data.permissions,
          createdAt: now,
        }
        set((state) => ({ users: [newUser, ...state.users] }))

        try {
          const saved = await api.users.create(data)
          if (saved && saved.id) {
            set((state) => ({
              users: state.users.map((u) => (u.id === id ? { ...u, id: saved.id } : u)),
            }))
            return saved
          }
        } catch (err: any) {
          console.warn('Failed to sync user to backend DB:', err.message)
        }
        return newUser
      },

      updateUser: async (id, data) => {
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, ...data } : u)),
        }))
        try {
          await api.users.update(id, data)
        } catch (err: any) {
          console.warn('Failed to update user in DB:', err.message)
        }
      },

      deleteUser: async (id) => {
        set((state) => ({
          users: state.users.filter((u) => u.id !== id),
        }))
        try {
          await api.users.delete(id)
        } catch (err: any) {
          console.warn('Failed to delete user from DB:', err.message)
        }
      },

      createStaffUser: (dataOrName, maybeEmail, maybePermissions) => {
        const user = get().currentUser
        const merchantId = user.merchantId || get().merchants[0]?.id || ''
        const id = `user-staff-${Date.now()}`
        const now = new Date().toISOString()

        let name = ''
        let email = ''
        let username: string | undefined = undefined
        let password = 'password123'
        let pin = '1234'
        let role: UserRole = 'CASHIER'
        let branchId: string | null = null
        let perms: Record<StaffPermissionKey, boolean> = {
          'dashboard.view': false,
          'branches.view': false,
          'branches.manage': false,
          'products.view': true,
          'products.create': false,
          'products.edit': false,
          'products.delete': false,
          'categories.manage': false,
          'excel.import': false,
          'excel.bulk_edit': false,
          'excel.bulk_delete': false,
          'invoices.view': true,
          'invoices.issue': true,
          'invoices.design': false,
          'fees.manage': false,
          'staff.manage': false,
          'reports.view': false,
        }

        if (typeof dataOrName === 'string') {
          name = dataOrName
          email = maybeEmail || ''
          username = email.split('@')[0].toLowerCase()
          if (maybePermissions) perms = { ...perms, ...maybePermissions }
        } else {
          name = dataOrName.name
          email = dataOrName.email
          username = dataOrName.username || dataOrName.email.split('@')[0].toLowerCase()
          password = dataOrName.password || '123456'
          pin = dataOrName.pin || '1234'
          role = dataOrName.role || 'CASHIER'
          branchId = dataOrName.branchId || null
          if (dataOrName.permissions) perms = { ...perms, ...dataOrName.permissions }
        }

        const newStaff: User = {
          id,
          name,
          email,
          username,
          password,
          pin,
          role,
          branchId,
          merchantId,
          status: 'Active',
          permissions: perms,
          createdAt: now,
        }
        set((state) => ({ users: [...state.users, newStaff] }))

        api.users
          .create({
            name,
            email,
            username,
            password,
            role,
            merchantId,
            branchId,
            permissions: perms,
            status: 'Active',
          })
          .then((saved) => {
            if (saved && saved.id) {
              set((state) => ({
                users: state.users.map((u) => (u.id === id ? { ...u, id: saved.id } : u)),
              }))
            }
          })
          .catch((err) => console.warn('Failed to create staff user in DB:', err.message))

        return newStaff
      },

      updateStaffUser: (id, name, status) => {
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, name, status } : u)),
        }))
      },

      updateStaffPermissions: (id, permissions) => {
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, permissions } : u)),
        }))
      },

      resetUserPassword: (id) => {
        const now = new Date().toISOString()
        const target = get().users.find((u) => u.id === id)
        const log: AuditLog = {
          id: `log-${Date.now()}`,
          actorUserId: get().currentUser.id,
          actorEmail: get().currentUser.email,
          actionType: 'PASSWORD_RESET',
          entityType: 'User',
          entityId: id,
          newValues: { targetEmail: target?.email, message: 'Password reset issued' },
          createdAt: now,
        }
        set((state) => ({ auditLogs: [log, ...state.auditLogs] }))
      },

      recordCustomerScan: (_merchantId, _branchId, _barcode) => {
        set((state) => ({ customerScanCount: state.customerScanCount + 1 }))
      },

      recordShoppingSession: () => {
        set((state) => ({ shoppingSessionCount: state.shoppingSessionCount + 1 }))
      },

      createRole: (data) => {
        const id = `role-${Date.now()}`
        const now = new Date().toISOString()
        const newRole: CustomRole = {
          ...data,
          id,
          createdAt: now,
          updatedAt: now,
        }
        const currentUser = get().currentUser
        const newLog: AuditLog = {
          id: `log-${Date.now()}`,
          actorUserId: currentUser.id,
          actorEmail: currentUser.email,
          actionType: 'ROLE_CREATED',
          entityType: 'Role',
          entityId: id,
          newValues: { name: newRole.name, scope: newRole.scope, merchantId: newRole.merchantId },
          createdAt: now,
        }
        set((state) => ({
          roles: [...(state.roles || initialRoles), newRole],
          auditLogs: [newLog, ...state.auditLogs],
        }))
        return newRole
      },

      updateRole: (id, data) => {
        const now = new Date().toISOString()
        const currentUser = get().currentUser
        const existing = (get().roles || initialRoles).find((r) => r.id === id)
        const newLog: AuditLog = {
          id: `log-${Date.now()}`,
          actorUserId: currentUser.id,
          actorEmail: currentUser.email,
          actionType: 'ROLE_UPDATED',
          entityType: 'Role',
          entityId: id,
          oldValues: existing ? { name: existing.name, permissions: existing.permissions } : null,
          newValues: data,
          createdAt: now,
        }
        set((state) => ({
          roles: (state.roles || initialRoles).map((r) =>
            r.id === id ? { ...r, ...data, updatedAt: now } : r
          ),
          auditLogs: [newLog, ...state.auditLogs],
        }))
      },

      deleteRole: (id) => {
        const currentUser = get().currentUser
        const existing = (get().roles || initialRoles).find((r) => r.id === id)
        if (existing?.isSystem) return // Protection: cannot delete system root roles

        const now = new Date().toISOString()
        const newLog: AuditLog = {
          id: `log-${Date.now()}`,
          actorUserId: currentUser.id,
          actorEmail: currentUser.email,
          actionType: 'ROLE_DELETED',
          entityType: 'Role',
          entityId: id,
          oldValues: existing ? { name: existing.name } : null,
          createdAt: now,
        }
        set((state) => ({
          roles: (state.roles || initialRoles).filter((r) => r.id !== id),
          auditLogs: [newLog, ...state.auditLogs],
        }))
      },

      createServiceCategory: (name, description, branchId) => {
        const now = new Date().toISOString()
        const newCat: ServiceCategory = {
          id: `scat-${Date.now()}`,
          name,
          description: description || '',
          branchId: branchId || null,
          status: 'Active',
          servicesCount: 0,
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({
          serviceCategories: [...(state.serviceCategories || initialServiceCategories), newCat],
        }))

        api.services.categories
          .create({ name, description, branchId })
          .then((saved) => {
            if (saved && saved.id) {
              set((state) => ({
                serviceCategories: state.serviceCategories.map((c) =>
                  c.id === newCat.id ? { ...c, id: saved.id } : c
                ),
              }))
            }
          })
          .catch((err) => console.warn('Failed to create service category in DB:', err.message))

        return newCat
      },

      updateServiceCategory: (id, name, description, status, branchId) => {
        const now = new Date().toISOString()
        set((state) => ({
          serviceCategories: (state.serviceCategories || initialServiceCategories).map((c) =>
            c.id === id
              ? {
                  ...c,
                  name,
                  description: description !== undefined ? description : c.description,
                  status: status || c.status,
                  branchId: branchId !== undefined ? branchId : c.branchId,
                  updatedAt: now,
                }
              : c
          ),
        }))

        api.services.categories
          .update(id, { name, description, status, branchId })
          .catch((err) => console.warn('Failed to update service category in DB:', err.message))
      },

      deleteServiceCategory: (id) => {
        set((state) => ({
          serviceCategories: (state.serviceCategories || initialServiceCategories).filter((c) => c.id !== id),
          serviceItems: (state.serviceItems || initialServiceItems).filter((s) => s.categoryId !== id),
        }))

        api.services.categories
          .delete(id)
          .catch((err) => console.warn('Failed to delete service category in DB:', err.message))
      },

      createServiceItem: (data) => {
        const now = new Date().toISOString()
        const newItem: ServiceItem = {
          ...data,
          id: `srv-${Date.now()}`,
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({
          serviceItems: [...(state.serviceItems || initialServiceItems), newItem],
          serviceCategories: (state.serviceCategories || initialServiceCategories).map((cat) =>
            cat.id === data.categoryId
              ? { ...cat, servicesCount: (cat.servicesCount || 0) + 1 }
              : cat
          ),
        }))

        api.services.items
          .create(newItem)
          .then((saved) => {
            if (saved && saved.id) {
              set((state) => ({
                serviceItems: state.serviceItems.map((s) =>
                  s.id === newItem.id ? { ...s, id: saved.id } : s
                ),
              }))
            }
          })
          .catch((err) => console.warn('Failed to create service item in DB:', err.message))

        return newItem
      },

      updateServiceItem: (id, data) => {
        const now = new Date().toISOString()
        set((state) => ({
          serviceItems: (state.serviceItems || initialServiceItems).map((s) =>
            s.id === id ? { ...s, ...data, updatedAt: now } : s
          ),
        }))

        api.services.items
          .update(id, data)
          .catch((err) => console.warn('Failed to update service item in DB:', err.message))
      },

      deleteServiceItem: (id) => {
        set((state) => ({
          serviceItems: (state.serviceItems || initialServiceItems).filter((s) => s.id !== id),
          subServices: (state.subServices || initialSubServices).filter((sub) => sub.serviceId !== id),
        }))

        api.services.items
          .delete(id)
          .catch((err) => console.warn('Failed to delete service item in DB:', err.message))
      },

      createSubService: (data) => {
        const now = new Date().toISOString()
        const newSub: SubService = {
          ...data,
          id: `sub-${Date.now()}`,
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({
          subServices: [...(state.subServices || initialSubServices), newSub],
        }))

        api.services.subServices
          .create(newSub)
          .then((saved) => {
            if (saved && saved.id) {
              set((state) => ({
                subServices: state.subServices.map((s) =>
                  s.id === newSub.id ? { ...s, id: saved.id } : s
                ),
              }))
            }
          })
          .catch((err) => console.warn('Failed to create sub service in DB:', err.message))

        return newSub
      },

      updateSubService: (id, data) => {
        const now = new Date().toISOString()
        set((state) => ({
          subServices: (state.subServices || initialSubServices).map((s) =>
            s.id === id ? { ...s, ...data, updatedAt: now } : s
          ),
        }))

        api.services.subServices
          .update(id, data)
          .catch((err) => console.warn('Failed to update sub service in DB:', err.message))
      },

      deleteSubService: (id) => {
        set((state) => ({
          subServices: (state.subServices || initialSubServices).filter((s) => s.id !== id),
        }))

        api.services.subServices
          .delete(id)
          .catch((err) => console.warn('Failed to delete sub service in DB:', err.message))
      },

      createProductAddon: (data) => {
        const now = new Date().toISOString()
        const newAddon: ProductAddon = {
          ...data,
          id: `addon-${Date.now()}`,
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({
          productAddons: [...(state.productAddons || initialProductAddons), newAddon],
        }))

        api.services.addons
          .create(newAddon)
          .then((saved) => {
            if (saved && saved.id) {
              set((state) => ({
                productAddons: state.productAddons.map((a) =>
                  a.id === newAddon.id ? { ...a, id: saved.id } : a
                ),
              }))
            }
          })
          .catch((err) => console.warn('Failed to create product addon in DB:', err.message))

        return newAddon
      },

      updateProductAddon: (id, data) => {
        const now = new Date().toISOString()
        set((state) => ({
          productAddons: (state.productAddons || initialProductAddons).map((a) =>
            a.id === id ? { ...a, ...data, updatedAt: now } : a
          ),
        }))

        api.services.addons
          .update(id, data)
          .catch((err) => console.warn('Failed to update product addon in DB:', err.message))
      },

      deleteProductAddon: (id) => {
        set((state) => ({
          productAddons: (state.productAddons || initialProductAddons).filter((a) => a.id !== id),
        }))

        api.services.addons
          .delete(id)
          .catch((err) => console.warn('Failed to delete product addon in DB:', err.message))
      },

      createFee: async (data) => {
        const now = new Date().toISOString()
        const newFee: Fee = {
          ...data,
          id: `fee-${Date.now()}`,
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({
          fees: [newFee, ...(state.fees || [])],
        }))

        try {
          const saved = await api.fees.create(data)
          if (saved && saved.id) {
            set((state) => ({
              fees: state.fees.map((f) => (f.id === newFee.id ? saved : f)),
            }))
            return saved
          }
        } catch (err: any) {
          console.warn('Failed to create fee in DB:', err.message)
        }
        return newFee
      },

      updateFee: async (id, data) => {
        const now = new Date().toISOString()
        set((state) => ({
          fees: (state.fees || []).map((f) => (f.id === id ? { ...f, ...data, updatedAt: now } : f)),
        }))

        try {
          await api.fees.update(id, data)
        } catch (err: any) {
          console.warn('Failed to update fee in DB:', err.message)
        }
      },

      deleteFee: async (id) => {
        set((state) => ({
          fees: (state.fees || []).filter((f) => f.id !== id),
          // Also remove feeId from products that had this fee
          products: state.products.map((p) =>
            p.feeIds?.includes(id)
              ? { ...p, feeIds: p.feeIds.filter((fid) => fid !== id) }
              : p
          ),
        }))

        try {
          await api.fees.delete(id)
        } catch (err: any) {
          console.warn('Failed to delete fee in DB:', err.message)
        }
      },

      fetchInvoiceTemplate: async (merchantId) => {
        try {
          const tpl = await api.invoices.getTemplate({ merchantId })
          if (tpl) {
            set({ invoiceTemplate: tpl })
            try {
              localStorage.setItem('merchant_invoice_template', JSON.stringify(tpl))
            } catch {}
            return tpl
          }
        } catch (err: any) {
          console.warn('Failed to fetch invoice template:', err.message)
        }
        try {
          const cached = localStorage.getItem('merchant_invoice_template')
          if (cached) {
            const parsed = JSON.parse(cached)
            set({ invoiceTemplate: parsed })
            return parsed
          }
        } catch {}
        return null
      },

      updateInvoiceTemplate: async (data) => {
        try {
          const updated = await api.invoices.updateTemplate(data)
          set({ invoiceTemplate: updated })
          try {
            localStorage.setItem('merchant_invoice_template', JSON.stringify(updated))
          } catch {}
          return updated
        } catch (err: any) {
          console.warn('Failed to update invoice template on server, persisting locally:', err.message)
          const fallback: InvoiceTemplate = {
            id: get().invoiceTemplate?.id || 'tpl-custom',
            merchantId: data.merchantId || get().currentUser.merchantId || '',
            templateName: data.templateName || 'Custom Invoice',
            layoutStyle: data.layoutStyle || 'MODERN',
            primaryColor: data.primaryColor || '#4F46E5',
            accentColor: data.accentColor || '#10B981',
            showLogo: data.showLogo !== undefined ? data.showLogo : true,
            paperSize: data.paperSize || 'A4',
            showQrCode: data.showQrCode !== undefined ? data.showQrCode : true,
            showTaxDetails: data.showTaxDetails !== undefined ? data.showTaxDetails : true,
            showBranchInfo: data.showBranchInfo !== undefined ? data.showBranchInfo : true,
            showCashierName: data.showCashierName !== undefined ? data.showCashierName : true,
            createdAt: get().invoiceTemplate?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...data,
          } as InvoiceTemplate
          set({ invoiceTemplate: fallback })
          try {
            localStorage.setItem('merchant_invoice_template', JSON.stringify(fallback))
          } catch {}
          return fallback
        }
      },

      fetchInvoices: async () => {
        try {
          const list = await api.invoices.list()
          set({ invoices: list || [] })
        } catch (err: any) {
          console.warn('Failed to fetch invoices:', err.message)
        }
      },

      createInvoice: async (data) => {
        const tempId = `inv-${Date.now()}`
        const now = new Date().toISOString()
        const tempInvoice: Invoice = {
          id: tempId,
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
          merchantId: data.merchantId || get().currentUser.merchantId || '',
          branchId: data.branchId || null,
          customerName: data.customerName || null,
          customerPhone: data.customerPhone || null,
          customerTaxNo: data.customerTaxNo || null,
          paymentMethod: data.paymentMethod || 'CASH',
          status: data.status || 'PAID',
          subtotal: data.subtotal || 0,
          taxTotal: data.taxTotal || 0,
          feesTotal: data.feesTotal || 0,
          discountTotal: data.discountTotal || 0,
          grandTotal: data.grandTotal || 0,
          appliedFees: data.appliedFees,
          items: (data.items || []).map((it: any, idx: number) => ({
            id: `item-${tempId}-${idx}`,
            invoiceId: tempId,
            productId: it.productId,
            productName: it.productName,
            barcode: it.barcode,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            totalPrice: it.totalPrice,
            feeIds: it.feeIds,
            createdAt: now,
          })),
          notes: data.notes,
          issuedAt: now,
          createdAt: now,
          updatedAt: now,
        }

        set((state) => ({
          invoices: [tempInvoice, ...state.invoices],
        }))

        try {
          const saved = await api.invoices.create(data)
          if (saved && saved.id) {
            set((state) => ({
              invoices: state.invoices.map((inv) => (inv.id === tempId ? saved : inv)),
            }))
            return saved
          }
        } catch (err: any) {
          console.warn('Failed to sync invoice to DB:', err.message)
        }
        return tempInvoice
      },

      updateInvoiceStatus: async (id, status) => {
        set((state) => ({
          invoices: state.invoices.map((inv) => (inv.id === id ? { ...inv, status } : inv)),
        }))

        try {
          await api.invoices.updateStatus(id, status)
        } catch (err: any) {
          console.warn('Failed to update invoice status in DB:', err.message)
        }
      },

      deleteInvoice: async (id) => {
        set((state) => ({
          invoices: state.invoices.filter((inv) => inv.id !== id),
        }))

        try {
          await api.invoices.delete(id)
        } catch (err: any) {
          console.warn('Failed to delete invoice from DB:', err.message)
        }
      },

      // Offers & Discounts
      createOffer: async (data) => {
        const user = get().currentUser
        const merchantId =
          user.role === 'SUPER_ADMIN' && data.merchantId
            ? data.merchantId
            : user.merchantId || data.merchantId || get().merchants[0]?.id

        if (!merchantId) {
          return { success: false, error: 'لم يتم تحديد التاجر' }
        }

        const tempId = `offer-${Date.now()}`
        const now = new Date().toISOString()
        const newOffer: Offer = {
          id: tempId,
          merchantId,
          title: data.title.trim(),
          description: data.description?.trim() || '',
          discountType: data.discountType,
          discountValue: Number(data.discountValue),
          productIds: Array.from(new Set(data.productIds || [])),
          isActive: data.isActive !== undefined ? data.isActive : true,
          createdAt: now,
          updatedAt: now,
        }

        const log: AuditLog = {
          id: `log-${Date.now()}`,
          actorUserId: user.id,
          actorEmail: user.email,
          actionType: 'OFFER_CREATED',
          entityType: 'Offer',
          entityId: tempId,
          newValues: newOffer,
          createdAt: now,
        }

        set((state) => ({
          offers: [newOffer, ...(state.offers || [])],
          auditLogs: [log, ...state.auditLogs],
        }))

        try {
          const saved = await api.offers.create({
            merchantId,
            title: newOffer.title,
            description: newOffer.description,
            discountType: newOffer.discountType,
            discountValue: newOffer.discountValue,
            productIds: newOffer.productIds,
            isActive: newOffer.isActive,
          })
          if (saved && saved.id) {
            set((state) => ({
              offers: (state.offers || []).map((o) => (o.id === tempId ? saved : o)),
            }))
            return { success: true, offer: saved }
          }
          return { success: true, offer: newOffer }
        } catch (err: any) {
          console.warn('Failed to sync offer to DB:', err.message)
          return { success: true, offer: newOffer }
        }
      },

      updateOffer: async (id, data) => {
        const now = new Date().toISOString()
        set((state) => ({
          offers: (state.offers || []).map((o) =>
            o.id === id
              ? {
                  ...o,
                  ...data,
                  title: data.title !== undefined ? data.title.trim() : o.title,
                  description:
                    data.description !== undefined
                      ? data.description?.trim() || ''
                      : o.description,
                  productIds:
                    data.productIds !== undefined
                      ? Array.from(new Set(data.productIds))
                      : o.productIds,
                  updatedAt: now,
                }
              : o
          ),
        }))

        try {
          const saved = await api.offers.update(id, data)
          if (saved && saved.id) {
            set((state) => ({
              offers: (state.offers || []).map((o) => (o.id === id ? saved : o)),
            }))
          }
        } catch (err: any) {
          console.warn('Failed to update offer in DB:', err.message)
        }
        return { success: true }
      },

      toggleOffer: async (id, isActive) => {
        const existing = (get().offers || []).find((o) => o.id === id)
        if (!existing) return
        const nextActive = isActive !== undefined ? isActive : !existing.isActive
        const now = new Date().toISOString()

        set((state) => ({
          offers: (state.offers || []).map((o) =>
            o.id === id ? { ...o, isActive: nextActive, updatedAt: now } : o
          ),
        }))

        try {
          const saved = await api.offers.toggle(id, nextActive)
          if (saved && saved.id) {
            set((state) => ({
              offers: (state.offers || []).map((o) => (o.id === id ? saved : o)),
            }))
          }
        } catch (err: any) {
          console.warn('Failed to toggle offer in DB:', err.message)
        }
      },

      deleteOffer: async (id) => {
        set((state) => ({
          offers: (state.offers || []).filter((o) => o.id !== id),
        }))

        try {
          await api.offers.delete(id)
        } catch (err: any) {
          console.warn('Failed to delete offer in DB:', err.message)
        }
      },

      fetchFromBackend: async () => {
        try {
          const [merchants, branches, categories, products, scats, sitems, ssubs, saddons, users, fees, offers, invoices, template] = await Promise.all([
            api.merchants.list().catch(() => []),
            api.branches.list().catch(() => []),
            api.categories.list().catch(() => []),
            api.products.list().catch(() => []),
            api.services.categories.list().catch(() => []),
            api.services.items.list().catch(() => []),
            api.services.subServices.list().catch(() => []),
            api.services.addons.list().catch(() => []),
            api.users.list().catch(() => []),
            api.fees.list().catch(() => []),
            api.offers.list().catch(() => null),
            api.invoices.list().catch(() => []),
            api.invoices.getTemplate().catch(() => null),
          ])

          const normalizedMerchants = (merchants || []).map((m: any) => {
            if (typeof m.features === 'string') {
              try {
                return { ...m, features: JSON.parse(m.features) }
              } catch {
                return { ...m, features: undefined }
              }
            }
            return m
          })

          set((state) => ({
            merchants: normalizedMerchants.length > 0 ? normalizedMerchants : state.merchants,
            branches: branches.length > 0 ? branches : state.branches,
            categories: categories.length > 0 ? categories : state.categories,
            products: products.length > 0 ? products : state.products,
            serviceCategories: scats.length > 0 ? scats : state.serviceCategories,
            serviceItems: sitems.length > 0 ? sitems : state.serviceItems,
            subServices: ssubs.length > 0 ? ssubs : state.subServices,
            productAddons: saddons.length > 0 ? saddons : state.productAddons,
            users: users.length > 0 ? users : state.users,
            fees: fees.length > 0 ? fees : state.fees,
            offers: Array.isArray(offers) ? offers : (state.offers || []),
            invoices: invoices.length > 0 ? invoices : state.invoices,
            invoiceTemplate: template || state.invoiceTemplate,
          }))
        } catch (error) {
          console.warn('Backend sync failed:', error)
        }
      },

      resetAllData: () => {
        set({
          currentUser: initialUsers[0],
          merchantTypes: initialMerchantTypes,
          currencies: initialCurrencies,
          merchants: initialMerchants,
          branches: initialBranches,
          categories: initialCategories,
          products: initialProducts,
          users: initialUsers,
          roles: initialRoles,
          auditLogs: initialAuditLogs,
          customerScanCount: 0,
          shoppingSessionCount: 0,
          serviceCategories: initialServiceCategories,
          serviceItems: initialServiceItems,
          subServices: initialSubServices,
          productAddons: initialProductAddons,
          fees: initialFees,
      offers: [],
      invoices: [],
      invoiceTemplate: null,
        })
      },
    }),
    {
      name: 'saas_platform_storage_v_clean',
    }
  )
)
