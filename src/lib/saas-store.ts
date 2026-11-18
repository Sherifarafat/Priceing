import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  Merchant,
  MerchantType,
  Currency,
  Branch,
  Product,
  Category,
  User,
  AuditLog,
  StaffPermissionKey,
  MerchantStatus,
  EntityStatus,
  CustomRole,
  ServiceCategory,
  ServiceItem,
  SubService,
  ProductAddon,
} from '@/types/saas'

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

const initialMerchants: Merchant[] = []

const initialBranches: Branch[] = []

const initialCategories: Category[] = []

const initialProducts: Product[] = []

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
  updateBranch: (id: string, name: string, address: string, imageUrl?: string) => void
  deleteBranch: (id: string) => void
  regenerateBranchQr: (branchId: string) => { oldToken: string; newToken: string }

  // Merchant Operations (scoped by merchantId)
  createProduct: (data: Omit<Product, 'id' | 'merchantId' | 'createdAt' | 'updatedAt'>) => { success: boolean; error?: string; product?: Product }
  updateProduct: (id: string, data: Partial<Omit<Product, 'id' | 'merchantId' | 'createdAt'>>) => { success: boolean; error?: string }
  deleteProduct: (id: string) => void
  createCategory: (name: string, branchId?: string | null) => Category
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
  createStaffUser: (name: string, email: string, permissions: Record<StaffPermissionKey, boolean>) => User
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

      switchUser: (userId: string) => {
        const found = get().users.find((u) => u.id === userId)
        if (found) {
          set({ currentUser: found })
        }
      },

      hasPermission: (permissionKey: StaffPermissionKey) => {
        const user = get().currentUser
        if (user.role === 'SUPER_ADMIN' || user.role === 'MERCHANT_MANAGER') {
          return true
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
        const manager: User = {
          id: `user-${id}-mgr`,
          email: data.email,
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
          newValues: { name: data.name, status: data.status, email: data.email },
          createdAt: now,
        }
        set((state) => ({
          merchants: [newMerchant, ...state.merchants],
          users: [...state.users, manager],
          auditLogs: [log, ...state.auditLogs],
        }))
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
        return branch
      },

      updateBranch: (id, name, address, imageUrl) => {
        const now = new Date().toISOString()
        set((state) => ({
          branches: state.branches.map((b) =>
            b.id === id
              ? {
                  ...b,
                  name,
                  address,
                  imageUrl: imageUrl !== undefined ? imageUrl : b.imageUrl,
                  updatedAt: now,
                }
              : b
          ),
        }))
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

        return { oldToken, newToken }
      },

      // Products (Scoped to current Merchant)
      createProduct: (data) => {
        const user = get().currentUser
        const merchantId = user.merchantId
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
      },

      // Categories
      createCategory: (name, branchId) => {
        const merchantId = get().currentUser.merchantId!
        const id = `cat-${Date.now()}`
        const now = new Date().toISOString()
        const newCat: Category = { id, merchantId, name: name.trim(), branchId: branchId || null, createdAt: now, updatedAt: now }
        set((state) => ({ categories: [...state.categories, newCat] }))
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

      // Staff Management
      createStaffUser: (name, email, permissions) => {
        const user = get().currentUser
        const merchantId = user.merchantId!
        const id = `user-staff-${Date.now()}`
        const now = new Date().toISOString()
        const newStaff: User = {
          id,
          name,
          email,
          role: 'MERCHANT_STAFF',
          merchantId,
          status: 'Active',
          permissions,
          createdAt: now,
        }
        set((state) => ({ users: [...state.users, newStaff] }))
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
      },

      deleteServiceCategory: (id) => {
        set((state) => ({
          serviceCategories: (state.serviceCategories || initialServiceCategories).filter((c) => c.id !== id),
          serviceItems: (state.serviceItems || initialServiceItems).filter((s) => s.categoryId !== id),
        }))
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
        return newItem
      },

      updateServiceItem: (id, data) => {
        const now = new Date().toISOString()
        set((state) => ({
          serviceItems: (state.serviceItems || initialServiceItems).map((s) =>
            s.id === id ? { ...s, ...data, updatedAt: now } : s
          ),
        }))
      },

      deleteServiceItem: (id) => {
        set((state) => ({
          serviceItems: (state.serviceItems || initialServiceItems).filter((s) => s.id !== id),
          subServices: (state.subServices || initialSubServices).filter((sub) => sub.serviceId !== id),
        }))
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
        return newSub
      },

      updateSubService: (id, data) => {
        const now = new Date().toISOString()
        set((state) => ({
          subServices: (state.subServices || initialSubServices).map((s) =>
            s.id === id ? { ...s, ...data, updatedAt: now } : s
          ),
        }))
      },

      deleteSubService: (id) => {
        set((state) => ({
          subServices: (state.subServices || initialSubServices).filter((s) => s.id !== id),
        }))
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
        return newAddon
      },

      updateProductAddon: (id, data) => {
        const now = new Date().toISOString()
        set((state) => ({
          productAddons: (state.productAddons || initialProductAddons).map((a) =>
            a.id === id ? { ...a, ...data, updatedAt: now } : a
          ),
        }))
      },

      deleteProductAddon: (id) => {
        set((state) => ({
          productAddons: (state.productAddons || initialProductAddons).filter((a) => a.id !== id),
        }))
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
        })
      },
    }),
    {
      name: 'saas_platform_storage_v_clean',
    }
  )
)
