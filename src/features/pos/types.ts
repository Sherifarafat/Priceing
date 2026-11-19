import type { Product, User, Branch, Merchant } from '@/types/saas'

export interface POSCartItem {
  product: Product
  quantity: number
  unitPrice: number
  total: number
}

export type PaymentMethod = 'CASH' | 'CARD' | 'QR' | 'INSTAPAY'

export interface POSSession {
  merchant: Merchant
  branch: Branch | null
  cashier: User
}
