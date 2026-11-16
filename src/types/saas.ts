export type MerchantStatus = 'Pending' | 'Active' | 'Inactive' | 'Suspended'
export type QRStatus = 'Active' | 'Revoked'
export type UserRole = 'SUPER_ADMIN' | 'MERCHANT_MANAGER' | 'MERCHANT_STAFF'
export type EntityStatus = 'Active' | 'Inactive'

export interface MerchantType {
  id: string
  name: string
  status: EntityStatus
}

export interface Currency {
  id: string
  code: string // e.g. 'USD', 'EGP', 'SAR', 'EUR'
  name: string
  symbol: string
  status: EntityStatus
}

export interface Merchant {
  id: string
  name: string
  logo?: string
  email: string
  phone: string
  address: string
  merchantTypeId: string
  currencyId: string
  status: MerchantStatus
  createdAt: string
  updatedAt: string
}

export interface Branch {
  id: string
  merchantId: string
  name: string
  address: string
  qrToken: string // Non-guessable secure token
  qrStatus: QRStatus
  createdAt: string
  updatedAt: string
}

export type StaffPermissionKey =
  | 'products.view'
  | 'products.create'
  | 'products.edit'
  | 'products.delete'
  | 'categories.manage'
  | 'excel.import'
  | 'excel.bulk_edit'
  | 'excel.bulk_delete'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  merchantId?: string | null // Nullable for Platform Super Admin
  status: EntityStatus
  permissions?: Record<StaffPermissionKey, boolean>
  createdAt: string
}

export interface Category {
  id: string
  merchantId: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  merchantId: string
  name: string
  barcode: string // Unique within the merchant
  price: number
  description?: string
  imageUrl?: string
  categoryId?: string | null // Nullable - set to null on category deletion
  status: EntityStatus
  createdAt: string
  updatedAt: string
}

export interface AuditLog {
  id: string
  actorUserId: string
  actorEmail: string
  actionType: string // e.g. 'PRODUCT_CREATED', 'PRICE_CHANGED', 'QR_REGENERATED'
  entityType: 'Merchant' | 'Branch' | 'Product' | 'Category' | 'User' | 'Excel' | 'MerchantType' | 'Currency'
  entityId: string
  oldValues?: Record<string, unknown> | null
  newValues?: Record<string, unknown> | null
  createdAt: string
}

export interface CustomerScan {
  id: string
  merchantId: string
  branchId: string
  barcode: string
  createdAt: string
}

export interface ShoppingItem {
  productId: string
  barcode: string
  name: string
  imageUrl?: string
  price: number
  confirmedPrice: number // The price customer confirmed
  quantity: number
  priceChanged?: boolean
  newPrice?: number
  priceStatus: 'CONFIRMED' | 'UNCONFIRMED' // Section 11 of SRS
}

export interface CustomerSession {
  branchId: string
  merchantId: string
  sessionStartedAt: number
  lastActivityAt: number // For 24-hour sliding expiration
  items: ShoppingItem[]
}
