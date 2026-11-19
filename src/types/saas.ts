export type MerchantStatus = 'Pending' | 'Active' | 'Inactive' | 'Suspended'
export type QRStatus = 'Active' | 'Revoked'
export type UserRole = 'SUPER_ADMIN' | 'MERCHANT_MANAGER' | 'CASHIER' | 'MERCHANT_STAFF'
export type EntityStatus = 'Active' | 'Inactive'
export type FeeType = 'PERCENTAGE' | 'FIXED'

export type InvoiceStatus = 'PAID' | 'PENDING' | 'REFUNDED' | 'CANCELLED'
export type InvoicePaymentMethod = 'CASH' | 'CARD' | 'ONLINE' | 'QR_SCAN'
export type InvoiceLayoutStyle = 'MODERN' | 'CLASSIC' | 'THERMAL_POS'
export type InvoicePaperSize = 'A4' | '80MM'

export interface InvoiceTemplate {
  id: string
  merchantId: string
  templateName: string
  layoutStyle: InvoiceLayoutStyle
  primaryColor: string
  accentColor: string
  businessName?: string | null
  logoUrl?: string | null
  showLogo: boolean
  taxNumber?: string | null
  commercialReg?: string | null
  headerNotice?: string | null
  footerNotice?: string | null
  showQrCode: boolean
  showTaxDetails: boolean
  showBranchInfo: boolean
  showCashierName: boolean
  paperSize: InvoicePaperSize
  fontFamily?: string
  headerStyle?: string
  tableStyle?: string
  borderRadius?: string
  watermarkText?: string | null
  showWatermark?: boolean
  qrPosition?: string
  showBarcode?: boolean
  currencyPosition?: string
  createdAt: string
  updatedAt: string
}

export interface InvoiceItem {
  id: string
  invoiceId: string
  productId?: string | null
  productName: string
  barcode?: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
  feeIds?: string[] | string | null
  createdAt: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  merchantId: string
  merchant?: { id: string; name: string; logo?: string | null }
  branchId?: string | null
  branch?: { id: string; name: string; address?: string | null }
  customerName?: string | null
  customerPhone?: string | null
  customerTaxNo?: string | null
  paymentMethod: InvoicePaymentMethod
  status: InvoiceStatus
  subtotal: number
  taxTotal: number
  feesTotal: number
  discountTotal: number
  grandTotal: number
  appliedFees?: any
  items?: InvoiceItem[]
  notes?: string | null
  issuedAt: string
  createdAt: string
  updatedAt: string
}

export interface Fee {
  id: string
  name: string
  type: FeeType
  value: number
  description?: string
  status: EntityStatus
  merchantId?: string | null
  createdAt: string
  updatedAt: string
}

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
  imageUrl?: string // Branch storefront or logo
  qrToken: string // Non-guessable secure token
  qrStatus: QRStatus
  createdAt: string
  updatedAt: string
}

export type StaffPermissionKey =
  | 'dashboard.view'
  | 'branches.view'
  | 'branches.manage'
  | 'products.view'
  | 'products.create'
  | 'products.edit'
  | 'products.delete'
  | 'categories.manage'
  | 'excel.import'
  | 'excel.bulk_edit'
  | 'excel.bulk_delete'
  | 'invoices.view'
  | 'invoices.issue'
  | 'invoices.design'
  | 'fees.manage'
  | 'staff.manage'
  | 'reports.view'

export interface User {
  id: string
  email: string
  username?: string
  password?: string
  name: string
  role: UserRole
  merchantId?: string | null // Nullable for Platform Super Admin
  branchId?: string | null // Assigned branch (optional)
  status: EntityStatus
  permissions?: Record<StaffPermissionKey, boolean>
  createdAt: string
}

export interface Category {
  id: string
  merchantId: string
  name: string
  branchId?: string | null // Assigned branch (null for all branches)
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  merchantId: string
  name: string
  barcode: string // Unique within the merchant
  price: number
  stocks?: number
  description?: string
  imageUrl?: string
  categoryId?: string | null // Nullable - set to null on category deletion
  feeIds?: string[]
  status: EntityStatus
  createdAt: string
  updatedAt: string
}

export type RoleScope = 'COMPANY' | 'MERCHANT'

export interface ServiceCategory {
  id: string
  name: string
  description?: string
  branchId?: string | null // Assigned branch (null for all branches)
  status: EntityStatus
  servicesCount?: number
  createdAt: string
  updatedAt: string
}

export interface ServiceItem {
  id: string
  categoryId: string
  name: string
  description?: string
  basePrice: number
  durationMinutes?: number
  status: EntityStatus
  createdAt: string
  updatedAt: string
}

export interface SubService {
  id: string
  serviceId: string
  name: string
  description?: string
  additionalPrice: number
  status: EntityStatus
  createdAt: string
  updatedAt: string
}

export interface ProductAddon {
  id: string
  name: string
  description?: string
  price: number
  category?: string
  isRequired?: boolean
  status: EntityStatus
  createdAt: string
  updatedAt: string
}

export type RoleScopeType = 'COMPANY' | 'MERCHANT'

export interface CustomRole {
  id: string
  name: string
  description: string
  scope: RoleScope // COMPANY or MERCHANT
  merchantId?: string | null // null = global or company level, or specific merchant id
  isSystem?: boolean
  permissions: string[] // List of permission keys, or ['*'] for all
  createdAt: string
  updatedAt: string
}

export interface AuditLog {
  id: string
  actorUserId: string
  actorEmail: string
  actionType: string // e.g. 'PRODUCT_CREATED', 'PRICE_CHANGED', 'QR_REGENERATED'
  entityType: 'Merchant' | 'Branch' | 'Product' | 'Category' | 'User' | 'Excel' | 'MerchantType' | 'Currency' | 'Role'
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
