import { Branch, Category, Merchant, Product, Offer, ServiceCategory, ServiceItem, SubService, ProductAddon, User, AuditLog, Fee, Invoice, InvoiceTemplate, ReturnPolicy } from '@/types/saas'

const BASE_URL = '/api'

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('saas_auth_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    let errorMsg = 'An error occurred'
    try {
      const data = await res.json()
      errorMsg = data.error || errorMsg
    } catch {}
    throw new Error(errorMsg)
  }

  return res.json()
}

export const api = {
  // Auth
  auth: {
    login: (credentials: { username: string; password: string }) =>
      request<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (data: { name?: string; email: string; username?: string; password?: string; role?: string; merchantId?: string }) =>
      request<{ token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: () => request<{ user: User }>('/auth/me'),
    switchDemoUser: (userId: string) =>
      request<{ token: string; user: User }>('/auth/switch-demo-user', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }),
  },

  // Users
  users: {
    list: () => request<User[]>('/users'),
    create: (data: Partial<User> & { password?: string }) =>
      request<User>('/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<User> & { password?: string }) =>
      request<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ message: string }>(`/users/${id}`, { method: 'DELETE' }),
  },

  // Merchants
  merchants: {
    list: () => request<Merchant[]>('/merchants'),
    get: (id: string) => request<Merchant>(`/merchants/${id}`),
    create: (data: Partial<Merchant>) =>
      request<Merchant>('/merchants', { method: 'POST', body: JSON.stringify(data) }),
    onboarding: (data: {
      name: string
      logo?: string
      phone?: string
      address?: string
      businessType?: string
      branchesCount: number
      email?: string
    }) =>
      request<{ merchant: Merchant; branches: Branch[]; user: User }>('/merchants/onboarding', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Merchant>) =>
      request<Merchant>(`/merchants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ message: string }>(`/merchants/${id}`, { method: 'DELETE' }),
  },

  // Branches
  branches: {
    list: (merchantId?: string) =>
      request<Branch[]>(`/branches${merchantId ? `?merchantId=${merchantId}` : ''}`),
    create: (data: { merchantId: string; name: string; address?: string; imageUrl?: string }) =>
      request<Branch>('/branches', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Branch>) =>
      request<Branch>(`/branches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    regenerateQr: (id: string) =>
      request<{ message: string; oldToken: string; newToken: string; branch: Branch }>(
        `/branches/${id}/regenerate-qr`,
        { method: 'POST' }
      ),
    delete: (id: string) =>
      request<{ message: string }>(`/branches/${id}`, { method: 'DELETE' }),
  },

  // Categories
  categories: {
    list: (params?: { branchId?: string; merchantId?: string }) => {
      const query = new URLSearchParams()
      if (params?.branchId) query.append('branchId', params.branchId)
      if (params?.merchantId) query.append('merchantId', params.merchantId)
      return request<Category[]>(`/categories?${query.toString()}`)
    },
    create: (data: { name: string; branchId?: string | null }) =>
      request<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { name?: string; branchId?: string | null }) =>
      request<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ message: string }>(`/categories/${id}`, { method: 'DELETE' }),
  },

  // Products
  products: {
    list: (params?: { search?: string; categoryId?: string; status?: string; merchantId?: string }) => {
      const query = new URLSearchParams()
      if (params?.search) query.append('search', params.search)
      if (params?.categoryId) query.append('categoryId', params.categoryId)
      if (params?.status) query.append('status', params.status)
      if (params?.merchantId) query.append('merchantId', params.merchantId)
      return request<Product[]>(`/products?${query.toString()}`)
    },
    create: (data: Partial<Product>) =>
      request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Product>) =>
      request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ message: string }>(`/products/${id}`, { method: 'DELETE' }),
    bulkImport: (rows: any[], duplicateDecisions: Record<string, string>) =>
      request<{ imported: number; updated: number; skipped: number }>('/products/bulk-excel-import', {
        method: 'POST',
        body: JSON.stringify({ rows, duplicateDecisions }),
      }),
    bulkAdjustPrice: (data: {
      mode: 'FIXED' | 'PERCENTAGE'
      direction: 'INCREASE' | 'DECREASE'
      value: number
      merchantId?: string
      categoryId?: string
      status?: string
    }) =>
      request<{ updatedCount: number; products: Product[] }>('/products/bulk-price', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Services
  services: {
    categories: {
      list: (branchId?: string) =>
        request<ServiceCategory[]>(`/services/categories${branchId ? `?branchId=${branchId}` : ''}`),
      create: (data: Partial<ServiceCategory>) =>
        request<ServiceCategory>('/services/categories', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: Partial<ServiceCategory>) =>
        request<ServiceCategory>(`/services/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id: string) =>
        request<{ message: string }>(`/services/categories/${id}`, { method: 'DELETE' }),
    },
    items: {
      list: (categoryId?: string) =>
        request<ServiceItem[]>(`/services${categoryId ? `?categoryId=${categoryId}` : ''}`),
      create: (data: Partial<ServiceItem>) =>
        request<ServiceItem>('/services', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: Partial<ServiceItem>) =>
        request<ServiceItem>(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id: string) =>
        request<{ message: string }>(`/services/${id}`, { method: 'DELETE' }),
    },
    subServices: {
      list: () => request<SubService[]>('/services/sub-services'),
      create: (data: Partial<SubService>) =>
        request<SubService>('/services/sub-services', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: Partial<SubService>) =>
        request<SubService>(`/services/sub-services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id: string) =>
        request<{ message: string }>(`/services/sub-services/${id}`, { method: 'DELETE' }),
    },
    addons: {
      list: () => request<ProductAddon[]>('/services/add-ons'),
      create: (data: Partial<ProductAddon>) =>
        request<ProductAddon>('/services/add-ons', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: Partial<ProductAddon>) =>
        request<ProductAddon>(`/services/add-ons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id: string) =>
        request<{ message: string }>(`/services/add-ons/${id}`, { method: 'DELETE' }),
    },
  },

  // Scan Live POS
  scan: {
    getBranchContext: (qrToken: string) =>
      request<{
        branchId: string
        branchName: string
        address: string
        merchantId: string
        merchantName: string
        merchantLogo: string | null
      }>(`/scan/branch/${qrToken}`),
    lookup: (qrToken: string, barcode: string) =>
      request<Product>('/scan/lookup', {
        method: 'POST',
        body: JSON.stringify({ qrToken, barcode }),
      }),
  },

  // Reports & Analytics
  reports: {
    getAnalytics: () =>
      request<{
        kpis: {
          totalScans: number
          totalMerchants: number
          totalBranches: number
          totalProducts: number
          totalLogs: number
        }
        scanTrendsData: Array<{ day: string; scans: number }>
        merchantChartData: Array<{ name: string; branches: number; products: number }>
      }>('/reports/analytics'),
    getAuditLogs: () => request<AuditLog[]>('/reports/audit-logs'),
  },

  // Fees & Taxes
  fees: {
    list: (params?: { merchantId?: string }) =>
      request<Fee[]>(`/fees${params?.merchantId ? `?merchantId=${params.merchantId}` : ''}`),
    create: (data: Partial<Fee>) =>
      request<Fee>('/fees', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Fee>) =>
      request<Fee>(`/fees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/fees/${id}`, { method: 'DELETE' }),
  },

  // Invoices & Billing
  invoices: {
    getTemplate: (params?: { merchantId?: string }) =>
      request<InvoiceTemplate>(`/invoices/template${params?.merchantId ? `?merchantId=${params.merchantId}` : ''}`),
    updateTemplate: (data: Partial<InvoiceTemplate> & { merchantId?: string }) =>
      request<InvoiceTemplate>('/invoices/template', { method: 'PUT', body: JSON.stringify(data) }),
    getReturnPolicy: (merchantId?: string) =>
      request<ReturnPolicy>(
        `/invoices/return-policy${merchantId && merchantId !== 'all' ? `?merchantId=${encodeURIComponent(merchantId)}` : ''}`
      ),
    saveReturnPolicy: (data: ReturnPolicy) =>
      request<ReturnPolicy>('/invoices/return-policy', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    verifyReturnPin: (data: { merchantId?: string; pin: string }) =>
      request<{ valid: boolean }>('/invoices/verify-return-pin', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    returnItems: (
      id: string,
      data: {
        items?: Array<{ itemId: string; quantity: number }>
        reason?: string
        restock?: boolean
      }
    ) =>
      request<{ invoice: Invoice; refundAmount: number; isFullReturn: boolean }>(
        `/invoices/${id}/return`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      ),
    list: (params?: { merchantId?: string; branchId?: string; status?: string; search?: string }) => {
      const query = new URLSearchParams()
      if (params?.merchantId) query.set('merchantId', params.merchantId)
      if (params?.branchId) query.set('branchId', params.branchId)
      if (params?.status) query.set('status', params.status)
      if (params?.search) query.set('search', params.search)
      const qs = query.toString()
      return request<Invoice[]>(`/invoices${qs ? `?${qs}` : ''}`)
    },
    get: (id: string) => request<Invoice & { merchant: any }>(`/invoices/${id}`),
    create: (data: any) =>
      request<Invoice>('/invoices', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string) =>
      request<Invoice>(`/invoices/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/invoices/${id}`, { method: 'DELETE' }),
  },

  // Offers & Discounts
  offers: {
    list: (params?: { merchantId?: string; isActive?: boolean }) => {
      const query = new URLSearchParams()
      if (params?.merchantId) query.set('merchantId', params.merchantId)
      if (params?.isActive !== undefined) query.set('isActive', String(params.isActive))
      const qs = query.toString()
      return request<Offer[]>(`/offers${qs ? `?${qs}` : ''}`)
    },
    create: (data: Partial<Offer>) =>
      request<Offer>('/offers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Offer>) =>
      request<Offer>(`/offers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    toggle: (id: string, isActive?: boolean) =>
      request<Offer>(`/offers/${id}/toggle`, {
        method: 'PUT',
        body: JSON.stringify(isActive !== undefined ? { isActive } : {}),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/offers/${id}`, { method: 'DELETE' }),
  },

  // Direct Backend WhatsApp Integration (Baileys)
  whatsapp: {
    getStatus: (merchantId?: string) => {
      const qs = merchantId ? `?merchantId=${encodeURIComponent(merchantId)}` : ''
      return request<{
        status: 'disconnected' | 'connecting' | 'qr' | 'connected'
        qrDataUrl: string | null
        phoneNumber: string | null
        name: string | null
        lastError: string | null
      }>(`/whatsapp/status${qs}`)
    },
    connect: (merchantId?: string) =>
      request<{
        status: 'disconnected' | 'connecting' | 'qr' | 'connected'
        qrDataUrl: string | null
        phoneNumber: string | null
        name: string | null
        lastError: string | null
      }>('/whatsapp/connect', {
        method: 'POST',
        body: JSON.stringify({ merchantId }),
      }),
    disconnect: (merchantId?: string) =>
      request<{ success: boolean }>('/whatsapp/disconnect', {
        method: 'POST',
        body: JSON.stringify({ merchantId }),
      }),
    send: (data: { merchantId?: string; phone: string; message: string }) =>
      request<{ success: boolean; messageId?: string; to: string }>('/whatsapp/send', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    sendDocument: (data: {
      merchantId?: string
      phone: string
      pdfBase64: string
      fileName: string
      caption?: string
    }) =>
      request<{ success: boolean; messageId?: string; to: string }>('/whatsapp/send-document', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Live DB-grounded AI Copilot (Free Zero-Key + Groq/Gemini/OpenRouter/Ollama)
  ai: {
    getConfig: (merchantId?: string) => {
      const qs = merchantId ? `?merchantId=${encodeURIComponent(merchantId)}` : ''
      return request<AiConfigDto>(`/ai/config${qs}`)
    },
    saveConfig: (data: {
      merchantId?: string
      provider?: AiProviderType
      model?: string
      apiKey?: string
      ollamaUrl?: string
    }) =>
      request<AiConfigDto>('/ai/config', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getSummary: (merchantId?: string) => {
      const qs = merchantId ? `?merchantId=${encodeURIComponent(merchantId)}` : ''
      return request<AiSystemSummaryDto>(`/ai/summary${qs}`)
    },
    chat: (data: {
      merchantId?: string
      message: string
      history?: { role: 'user' | 'assistant'; content: string }[]
      provider?: AiProviderType
      model?: string
    }) =>
      request<AiChatResponseDto>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
}

export type SmsProviderType = 'DEMO' | 'SMSMISR' | 'TWILIO' | 'ANDROID_GATEWAY' | 'CUSTOM_WEBHOOK'

export interface SmsGatewayConfigDto {
  enabled: boolean
  provider: SmsProviderType
  senderName: string
  smsmisrUsername?: string
  smsmisrPassword?: string
  smsmisrSenderId?: string
  smsmisrEnvironment?: '1' | '2'
  twilioAccountSid?: string
  twilioAuthToken?: string
  twilioFromNumber?: string
  androidGatewayUrl?: string
  androidGatewayFormat?: 'CAPCOM' | 'TRACCAR'
  androidUsername?: string
  androidPassword?: string
  androidApiKey?: string
  customWebhookUrl?: string
  customMethod?: 'POST' | 'GET'
  customAuthHeader?: string
  customBodyTemplate?: string
  updatedAt?: string
}

export interface SmsLogEntryDto {
  id: string
  to: string
  message: string
  invoiceNumber?: string
  provider: SmsProviderType
  status: 'SENT' | 'DEMO_SENT' | 'FAILED'
  messageId?: string
  error?: string
  createdAt: string
}

export type AiProviderType =
  | 'FREE_POLLINATIONS'
  | 'GROQ'
  | 'GEMINI'
  | 'OPENROUTER'
  | 'OLLAMA'

export interface AiConfigDto {
  provider: AiProviderType
  model: string
  ollamaUrl?: string
  hasApiKey: boolean
  updatedAt?: string
}

export interface AiSystemSummaryDto {
  scope: string
  totalRevenue: number
  todayRevenue: number
  invoiceCount: number
  productsCount: number
  lowStockCount: number
  branchesCount: number
  activeOffersCount: number
  totalScans: number
  generatedAt: string
}

export interface AiKpiCardDto {
  label: string
  value: string
  hint?: string
}

export interface AiChartSpecDto {
  id: string
  title: string
  type: 'bar' | 'area' | 'pie'
  valueSuffix?: string
  data: { name: string; value: number; secondary?: number }[]
}

export interface AiChatResponseDto {
  reply: string
  providerUsed: string
  modelUsed: string
  fallbackUsed: boolean
  kpis?: AiKpiCardDto[]
  charts?: AiChartSpecDto[]
  suggestions?: string[]
  generatedAt: string
}
