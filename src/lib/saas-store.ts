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

const initialMerchants: Merchant[] = [
  {
    id: 'merch-metro',
    name: 'Metro Market',
    logo: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=100',
    email: 'contact@metro.com',
    phone: '+20 2 3760 0000',
    address: '15 Mossadak St, Dokki, Giza',
    merchantTypeId: 'type-1',
    currencyId: 'curr-egp',
    status: 'Active',
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'merch-carrefour',
    name: 'Carrefour Express',
    logo: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=100',
    email: 'info@carrefour.com',
    phone: '+20 2 2480 0000',
    address: 'City Stars, Nasr City, Cairo',
    merchantTypeId: 'type-1',
    currencyId: 'curr-egp',
    status: 'Active',
    createdAt: '2026-02-01T12:00:00Z',
    updatedAt: '2026-02-01T12:00:00Z',
  },
  {
    id: 'merch-hyperone',
    name: 'HyperOne Supercenter',
    logo: '',
    email: 'support@hyperone.com',
    phone: '+20 2 3850 0000',
    address: 'Sheikh Zayed Entrance 1, Giza',
    merchantTypeId: 'type-1',
    currencyId: 'curr-egp',
    status: 'Pending',
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'merch-oldbazaar',
    name: 'Old Town Spices & Gourmet',
    logo: '',
    email: 'bazaar@oldtown.com',
    phone: '+20 2 2590 0000',
    address: 'Khan el-Khalili, Cairo',
    merchantTypeId: 'type-1',
    currencyId: 'curr-egp',
    status: 'Suspended',
    createdAt: '2025-11-15T09:00:00Z',
    updatedAt: '2026-03-05T14:00:00Z',
  },
]

const initialBranches: Branch[] = [
  {
    id: 'branch-metro-dokki',
    merchantId: 'merch-metro',
    name: 'Dokki Branch',
    address: '15 Mossadak Street, Dokki, Giza',
    qrToken: 'qr-metro-dokki-8f2a1b9c',
    qrStatus: 'Active',
    createdAt: '2026-01-12T10:00:00Z',
    updatedAt: '2026-01-12T10:00:00Z',
  },
  {
    id: 'branch-metro-maadi',
    merchantId: 'merch-metro',
    name: 'Maadi Degla Branch',
    address: 'Road 233, Degla, Maadi, Cairo',
    qrToken: 'qr-metro-maadi-4e7d2a10',
    qrStatus: 'Active',
    createdAt: '2026-01-15T11:00:00Z',
    updatedAt: '2026-01-15T11:00:00Z',
  },
  {
    id: 'branch-metro-nasrcity',
    merchantId: 'merch-metro',
    name: 'Nasr City Branch',
    address: 'Abbas El-Akkad St, Nasr City, Cairo',
    qrToken: 'qr-metro-nasr-99c15b3e',
    qrStatus: 'Active',
    createdAt: '2026-01-20T09:30:00Z',
    updatedAt: '2026-01-20T09:30:00Z',
  },
  {
    id: 'branch-carrefour-mall',
    merchantId: 'merch-carrefour',
    name: 'Mall of Arabia Branch',
    address: 'Mall of Arabia, Juhayna Square, 6th of October',
    qrToken: 'qr-carrefour-moa-5a3d7e82',
    qrStatus: 'Active',
    createdAt: '2026-02-05T14:00:00Z',
    updatedAt: '2026-02-05T14:00:00Z',
  },
]

const initialCategories: Category[] = [
  { id: 'cat-beverages', merchantId: 'merch-metro', name: 'Beverages', createdAt: '2026-01-12T10:00:00Z', updatedAt: '2026-01-12T10:00:00Z' },
  { id: 'cat-dairy', merchantId: 'merch-metro', name: 'Dairy & Eggs', createdAt: '2026-01-12T10:00:00Z', updatedAt: '2026-01-12T10:00:00Z' },
  { id: 'cat-snacks', merchantId: 'merch-metro', name: 'Snacks & Chips', createdAt: '2026-01-12T10:00:00Z', updatedAt: '2026-01-12T10:00:00Z' },
  { id: 'cat-bakery', merchantId: 'merch-metro', name: 'Bakery & Bread', createdAt: '2026-01-12T10:00:00Z', updatedAt: '2026-01-12T10:00:00Z' },
  { id: 'cat-pantry', merchantId: 'merch-carrefour', name: 'Pantry & Canned Foods', createdAt: '2026-02-02T10:00:00Z', updatedAt: '2026-02-02T10:00:00Z' },
]

const initialProducts: Product[] = [
  {
    id: 'prod-coke',
    merchantId: 'merch-metro',
    name: 'Coca Cola Can 330ml',
    barcode: '5449000000996',
    price: 15.0,
    description: 'Original taste carbonated soft drink can 330ml',
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300',
    categoryId: 'cat-beverages',
    status: 'Active',
    createdAt: '2026-01-12T11:00:00Z',
    updatedAt: '2026-01-12T11:00:00Z',
  },
  {
    id: 'prod-milk',
    merchantId: 'merch-metro',
    name: 'Juhayna Full Cream Milk 1L',
    barcode: '6223000450012',
    price: 45.0,
    description: '100% pure fresh cow milk full cream 1 liter bottle',
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300',
    categoryId: 'cat-dairy',
    status: 'Active',
    createdAt: '2026-01-12T11:05:00Z',
    updatedAt: '2026-01-12T11:05:00Z',
  },
  {
    id: 'prod-chips',
    merchantId: 'merch-metro',
    name: 'Lays Potato Chips Salt 85g',
    barcode: '6221155021201',
    price: 12.5,
    description: 'Crispy golden potato chips with classic sea salt',
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300',
    categoryId: 'cat-snacks',
    status: 'Active',
    createdAt: '2026-01-12T11:10:00Z',
    updatedAt: '2026-01-12T11:10:00Z',
  },
  {
    id: 'prod-bread',
    merchantId: 'merch-metro',
    name: 'Rich Bake Toast White Bread 500g',
    barcode: '6222001400234',
    price: 32.0,
    description: 'Freshly baked soft white sliced bread loaf',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300',
    categoryId: 'cat-bakery',
    status: 'Active',
    createdAt: '2026-01-12T11:15:00Z',
    updatedAt: '2026-01-12T11:15:00Z',
  },
  {
    id: 'prod-water',
    merchantId: 'merch-metro',
    name: 'Nestle Pure Life Mineral Water 1.5L',
    barcode: '6221003001010',
    price: 8.0,
    description: 'Natural pure drinking bottled water 1.5 liters',
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=300',
    categoryId: 'cat-beverages',
    status: 'Active',
    createdAt: '2026-01-12T11:20:00Z',
    updatedAt: '2026-01-12T11:20:00Z',
  },
  {
    id: 'prod-safeer-coffee',
    merchantId: 'merch-metro',
    name: 'بن سفير وسط ساده',
    barcode: '961400121028',
    price: 85.0,
    description: 'قهوة بن سفير توليفة مميزة وسط ساده - مذاق غني ورائحة أصيلة',
    imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300',
    categoryId: 'cat-beverages',
    status: 'Active',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  },
  // Carrefour products (demonstrating tenant isolation!)
  {
    id: 'prod-carrefour-tuna',
    merchantId: 'merch-carrefour',
    name: 'Carrefour Solid Tuna in Olive Oil 185g',
    barcode: '3560070854123',
    price: 65.0,
    description: 'Premium light solid tuna flakes in extra virgin olive oil',
    imageUrl: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=300',
    categoryId: 'cat-pantry',
    status: 'Active',
    createdAt: '2026-02-02T11:00:00Z',
    updatedAt: '2026-02-02T11:00:00Z',
  },
]

const initialUsers: User[] = [
  {
    id: 'user-super-admin',
    email: 'admin@platform.com',
    name: 'Platform Super Admin',
    role: 'SUPER_ADMIN',
    merchantId: null,
    status: 'Active',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'user-metro-manager',
    email: 'manager@metro.com',
    name: 'Metro Store Manager',
    role: 'MERCHANT_MANAGER',
    merchantId: 'merch-metro',
    status: 'Active',
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'user-metro-staff',
    email: 'staff@metro.com',
    name: 'Ahmed Staff',
    role: 'MERCHANT_STAFF',
    merchantId: 'merch-metro',
    status: 'Active',
    permissions: {
      'products.view': true,
      'products.create': true,
      'products.edit': true,
      'products.delete': false,
      'categories.manage': false,
      'excel.import': true,
      'excel.bulk_edit': false,
      'excel.bulk_delete': false,
    },
    createdAt: '2026-01-15T12:00:00Z',
  },
  {
    id: 'user-carrefour-manager',
    email: 'manager@carrefour.com',
    name: 'Carrefour Store Manager',
    role: 'MERCHANT_MANAGER',
    merchantId: 'merch-carrefour',
    status: 'Active',
    createdAt: '2026-02-01T12:00:00Z',
  },
]

const initialAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    actorUserId: 'user-super-admin',
    actorEmail: 'admin@platform.com',
    actionType: 'MERCHANT_CREATED',
    entityType: 'Merchant',
    entityId: 'merch-metro',
    newValues: { name: 'Metro Market', status: 'Active' },
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'log-2',
    actorUserId: 'user-super-admin',
    actorEmail: 'admin@platform.com',
    actionType: 'BRANCH_CREATED',
    entityType: 'Branch',
    entityId: 'branch-metro-dokki',
    newValues: { name: 'Dokki Branch', qrToken: 'qr-metro-dokki-8f2a1b9c' },
    createdAt: '2026-01-12T10:00:00Z',
  },
  {
    id: 'log-3',
    actorUserId: 'user-metro-manager',
    actorEmail: 'manager@metro.com',
    actionType: 'PRODUCT_CREATED',
    entityType: 'Product',
    entityId: 'prod-coke',
    newValues: { name: 'Coca Cola Can 330ml', price: 15.0, barcode: '5449000000996' },
    createdAt: '2026-01-12T11:00:00Z',
  },
]

export interface SaaSState {
  currentUser: User
  merchantTypes: MerchantType[]
  currencies: Currency[]
  merchants: Merchant[]
  branches: Branch[]
  categories: Category[]
  products: Product[]
  users: User[]
  auditLogs: AuditLog[]
  customerScanCount: number
  shoppingSessionCount: number

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
  createBranch: (merchantId: string, name: string, address: string) => Branch
  updateBranch: (id: string, name: string, address: string) => void
  deleteBranch: (id: string) => void
  regenerateBranchQr: (branchId: string) => { oldToken: string; newToken: string }

  // Merchant Operations (scoped by merchantId)
  createProduct: (data: Omit<Product, 'id' | 'merchantId' | 'createdAt' | 'updatedAt'>) => { success: boolean; error?: string; product?: Product }
  updateProduct: (id: string, data: Partial<Omit<Product, 'id' | 'merchantId' | 'createdAt'>>) => { success: boolean; error?: string }
  deleteProduct: (id: string) => void
  createCategory: (name: string) => Category
  updateCategory: (id: string, name: string) => void
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
      auditLogs: initialAuditLogs,
      customerScanCount: 142,
      shoppingSessionCount: 89,

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
      createBranch: (merchantId, name, address) => {
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
          newValues: { name, address, qrToken, merchantId },
          createdAt: now,
        }
        set((state) => ({
          branches: [branch, ...state.branches],
          auditLogs: [log, ...state.auditLogs],
        }))
        return branch
      },

      updateBranch: (id, name, address) => {
        const now = new Date().toISOString()
        set((state) => ({
          branches: state.branches.map((b) => (b.id === id ? { ...b, name, address, updatedAt: now } : b)),
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
      createCategory: (name) => {
        const merchantId = get().currentUser.merchantId!
        const id = `cat-${Date.now()}`
        const now = new Date().toISOString()
        const newCat: Category = { id, merchantId, name: name.trim(), createdAt: now, updatedAt: now }
        set((state) => ({ categories: [...state.categories, newCat] }))
        return newCat
      },

      updateCategory: (id, name) => {
        const now = new Date().toISOString()
        set((state) => ({
          categories: state.categories.map((c) => (c.id === id ? { ...c, name: name.trim(), updatedAt: now } : c)),
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
          auditLogs: initialAuditLogs,
          customerScanCount: 142,
          shoppingSessionCount: 89,
        })
      },
    }),
    {
      name: 'saas_platform_storage_v2',
    }
  )
)
