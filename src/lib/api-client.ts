import { Branch, Category, Merchant, Product, ServiceCategory, ServiceItem, SubService, ProductAddon, User, AuditLog } from '@/types/saas'

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
}
