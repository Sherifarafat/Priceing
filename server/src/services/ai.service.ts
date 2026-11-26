import fs from 'fs'
import path from 'path'
import { prisma } from '../lib/prisma.js'

export type AiProvider =
  | 'FREE_POLLINATIONS'
  | 'GROQ'
  | 'GEMINI'
  | 'OPENROUTER'
  | 'OLLAMA'

export interface AiConfig {
  provider: AiProvider
  model: string
  apiKey?: string
  ollamaUrl?: string
  updatedAt?: string
}

export interface ChatHistoryTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface AiKpiCard {
  label: string
  value: string
  hint?: string
}

export interface AiChartSpec {
  id: string
  title: string
  type: 'bar' | 'area' | 'pie'
  valueSuffix?: string
  data: { name: string; value: number; secondary?: number }[]
}

export interface AiChatResponse {
  reply: string
  providerUsed: string
  modelUsed: string
  fallbackUsed: boolean
  cooldownSeconds?: number
  kpis?: AiKpiCard[]
  charts?: AiChartSpec[]
  suggestions?: string[]
  generatedAt: string
}

const CONFIG_DIR = path.resolve(process.cwd(), 'ai-config')

const DEFAULT_AI_CONFIG: AiConfig = {
  provider: 'FREE_POLLINATIONS',
  model: 'openai',
  apiKey: '',
  ollamaUrl: 'http://localhost:11434',
}

// Track Pollinations free-tier cooldown so we never spam it and trip extra 402s
let pollinationsCooldownUntil = 0

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
  }
}

function configPathFor(merchantKey: string) {
  ensureConfigDir()
  const safe = (merchantKey || 'global').replace(/[^a-zA-Z0-9_-]/g, '_')
  return path.join(CONFIG_DIR, `${safe}.json`)
}

export function getAiConfig(merchantKey: string): AiConfig {
  try {
    const p = configPathFor(merchantKey)
    if (fs.existsSync(p)) {
      const parsed = JSON.parse(fs.readFileSync(p, 'utf-8'))
      return { ...DEFAULT_AI_CONFIG, ...parsed }
    }
  } catch (err) {
    console.error('Failed to load AI config:', err)
  }
  return { ...DEFAULT_AI_CONFIG }
}

export function saveAiConfig(merchantKey: string, partial: Partial<AiConfig>): AiConfig {
  const current = getAiConfig(merchantKey)
  const next: AiConfig = {
    ...current,
    ...partial,
    updatedAt: new Date().toISOString(),
  }
  fs.writeFileSync(configPathFor(merchantKey), JSON.stringify(next, null, 2), 'utf-8')
  return next
}

function isArabicText(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text)
}

function normalizeArabic(text: string): string {
  return String(text || '')
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .trim()
}

function formatMoney(n: number): string {
  return `${Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} EGP`
}

// ── Live Full-System Snapshot from Prisma SQLite ──
export async function collectSystemSnapshot(merchantId?: string) {
  const scopedMerchantId = merchantId && merchantId !== 'all' ? merchantId : undefined
  const mWhere = scopedMerchantId ? { merchantId: scopedMerchantId } : {}

  const [
    merchants,
    branches,
    categories,
    products,
    invoices,
    offers,
    scans,
    users,
    fees,
    auditLogs,
  ] = await Promise.all([
    prisma.merchant.findMany({
      where: scopedMerchantId ? { id: scopedMerchantId } : undefined,
      select: { id: true, name: true, businessType: true, status: true, phone: true, address: true },
    }),
    prisma.branch.findMany({
      where: mWhere,
      select: { id: true, name: true, address: true, qrStatus: true, merchantId: true },
    }),
    prisma.category.findMany({
      where: mWhere,
      select: { id: true, name: true },
    }),
    prisma.product.findMany({
      where: mWhere,
      include: { category: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.invoice.findMany({
      where: mWhere,
      include: {
        items: true,
        branch: { select: { name: true } },
      },
      orderBy: { issuedAt: 'desc' },
      take: 500,
    }),
    prisma.offer.findMany({
      where: mWhere,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.customerScan.findMany({
      where: scopedMerchantId ? { branch: { merchantId: scopedMerchantId } } : undefined,
      include: { branch: { select: { name: true } } },
      orderBy: { scannedAt: 'desc' },
      take: 500,
    }),
    prisma.user.findMany({
      where: scopedMerchantId ? { merchantId: scopedMerchantId } : undefined,
      select: { id: true, name: true, email: true, role: true, status: true },
    }),
    prisma.fee.findMany({
      where: scopedMerchantId ? { OR: [{ merchantId: scopedMerchantId }, { merchantId: null }] } : undefined,
      select: { name: true, type: true, value: true, status: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 15,
      select: { actorEmail: true, actionType: true, entityType: true, createdAt: true },
    }),
  ])

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const paidInvoices = invoices.filter((inv) => inv.status !== 'CANCELLED' && inv.status !== 'REFUNDED')

  let totalRevenue = 0
  let todayRevenue = 0
  let todayInvoiceCount = 0
  let last7DaysRevenue = 0
  let last7DaysInvoiceCount = 0
  let last30DaysRevenue = 0
  let totalTax = 0
  let totalDiscount = 0

  const paymentMap = new Map<string, { method: string; count: number; total: number }>()
  const branchSalesMap = new Map<string, { branch: string; count: number; total: number }>()
  const productSalesMap = new Map<string, { name: string; qty: number; revenue: number }>()

  const dailyBuckets: { dateKey: string; label: string; revenue: number; count: number }[] = []
  const dailyMap = new Map<string, { dateKey: string; label: string; revenue: number; count: number }>()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const entry = { dateKey: key, label, revenue: 0, count: 0 }
    dailyBuckets.push(entry)
    dailyMap.set(key, entry)
  }

  for (const inv of paidInvoices) {
    const total = Number(inv.grandTotal || 0)
    const dt = new Date(inv.issuedAt || inv.createdAt)
    totalRevenue += total
    totalTax += Number(inv.taxTotal || 0)
    totalDiscount += Number(inv.discountTotal || 0)

    if (dt >= startOfToday) {
      todayRevenue += total
      todayInvoiceCount += 1
    }
    if (dt >= sevenDaysAgo) {
      last7DaysRevenue += total
      last7DaysInvoiceCount += 1
    }
    if (dt >= thirtyDaysAgo) {
      last30DaysRevenue += total
    }

    const dayKey = dt.toISOString().slice(0, 10)
    const dayBucket = dailyMap.get(dayKey)
    if (dayBucket) {
      dayBucket.revenue += total
      dayBucket.count += 1
    }

    const pm = (inv.paymentMethod || 'CASH').toUpperCase()
    const pmEntry = paymentMap.get(pm) || { method: pm, count: 0, total: 0 }
    pmEntry.count += 1
    pmEntry.total += total
    paymentMap.set(pm, pmEntry)

    const bName = inv.branch?.name || 'الفرع الرئيسي'
    const bEntry = branchSalesMap.get(bName) || { branch: bName, count: 0, total: 0 }
    bEntry.count += 1
    bEntry.total += total
    branchSalesMap.set(bName, bEntry)

    for (const item of inv.items || []) {
      const pName = item.productName || 'منتج'
      const pEntry = productSalesMap.get(pName) || { name: pName, qty: 0, revenue: 0 }
      pEntry.qty += Number(item.quantity || 1)
      pEntry.revenue += Number(item.totalPrice || 0)
      productSalesMap.set(pName, pEntry)
    }
  }

  const avgOrderValue = paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0

  const topSellingProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
    .map((p) => ({
      name: p.name,
      qty: p.qty,
      revenue: Math.round(p.revenue * 100) / 100,
    }))

  const byPaymentMethod = Array.from(paymentMap.values())
    .sort((a, b) => b.total - a.total)
    .map((x) => ({
      method: x.method,
      count: x.count,
      total: Math.round(x.total * 100) / 100,
      sharePct: totalRevenue > 0 ? Math.round((x.total / totalRevenue) * 1000) / 10 : 0,
    }))

  const byBranch = Array.from(branchSalesMap.values())
    .sort((a, b) => b.total - a.total)
    .map((x) => ({
      branch: x.branch,
      count: x.count,
      total: Math.round(x.total * 100) / 100,
    }))

  // Inventory analytics
  let totalStockUnits = 0
  let totalInventoryValue = 0
  let priceSum = 0
  const categoryStatsMap = new Map<string, { category: string; count: number; stock: number; value: number }>()

  for (const p of products) {
    const price = Number(p.price || 0)
    const stock = Number(p.stocks || 0)
    totalStockUnits += stock
    totalInventoryValue += price * stock
    priceSum += price

    const cName = p.category?.name || 'بدون قسم'
    const cEntry = categoryStatsMap.get(cName) || { category: cName, count: 0, stock: 0, value: 0 }
    cEntry.count += 1
    cEntry.stock += stock
    cEntry.value += price * stock
    categoryStatsMap.set(cName, cEntry)
  }

  const outOfStockProducts = products
    .filter((p) => p.stocks <= 0)
    .slice(0, 15)
    .map((p) => ({ name: p.name, barcode: p.barcode, price: p.price }))

  const lowStockProducts = products
    .filter((p) => p.stocks > 0 && p.stocks <= 5)
    .sort((a, b) => a.stocks - b.stocks)
    .slice(0, 15)
    .map((p) => ({ name: p.name, stocks: p.stocks, price: p.price }))

  const sortedByPrice = [...products].sort((a, b) => b.price - a.price)
  const mostExpensive = sortedByPrice.slice(0, 5).map((p) => ({ name: p.name, price: p.price, stocks: p.stocks }))
  const cheapest = [...products]
    .sort((a, b) => a.price - b.price)
    .slice(0, 5)
    .map((p) => ({ name: p.name, price: p.price, stocks: p.stocks }))

  const byCategory = Array.from(categoryStatsMap.values())
    .sort((a, b) => b.count - a.count)
    .map((c) => ({
      category: c.category,
      count: c.count,
      stock: c.stock,
      value: Math.round(c.value * 100) / 100,
    }))

  // Scans analytics
  const scansLast7Days = scans.filter((s) => new Date(s.scannedAt) >= sevenDaysAgo).length
  const scanProductMap = new Map<string, number>()
  const scanBranchMap = new Map<string, number>()
  const scanHourMap = new Map<number, number>()
  for (const s of scans) {
    if (s.productName) {
      scanProductMap.set(s.productName, (scanProductMap.get(s.productName) || 0) + 1)
    }
    const bName = s.branch?.name || 'الفرع الرئيسي'
    scanBranchMap.set(bName, (scanBranchMap.get(bName) || 0) + 1)
    const hr = new Date(s.scannedAt).getHours()
    scanHourMap.set(hr, (scanHourMap.get(hr) || 0) + 1)
  }
  const topScannedProducts = Array.from(scanProductMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }))

  const scansByBranch = Array.from(scanBranchMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([branch, count]) => ({ branch, count }))

  let peakScanHour: number | null = null
  let peakScanCount = 0
  for (const [hr, cnt] of scanHourMap.entries()) {
    if (cnt > peakScanCount) {
      peakScanCount = cnt
      peakScanHour = hr
    }
  }

  // Offers summary
  const activeOffers = offers.filter((o) => o.isActive)
  const offerSummaries = offers.slice(0, 15).map((o) => {
    let prodCount = 0
    try {
      const ids = o.productIds ? JSON.parse(o.productIds) : []
      prodCount = Array.isArray(ids) ? ids.length : 0
    } catch {
      prodCount = 0
    }
    return {
      title: o.title,
      discount: o.discountType === 'PERCENTAGE' ? `${o.discountValue}%` : `${o.discountValue} EGP`,
      isActive: o.isActive,
      productsCount: prodCount,
    }
  })

  const roleMap = new Map<string, number>()
  for (const u of users) {
    roleMap.set(u.role, (roleMap.get(u.role) || 0) + 1)
  }

  const allCatalog = products.map((p) => ({
    name: p.name,
    barcode: p.barcode,
    price: p.price,
    stocks: p.stocks,
    category: p.category?.name || 'عام',
    status: p.status,
  }))

  return {
    generatedAt: now.toISOString(),
    scope: scopedMerchantId ? merchants[0]?.name || scopedMerchantId : 'All Platform Merchants',
    merchants: merchants.map((m) => ({ name: m.name, businessType: m.businessType, status: m.status })),
    branches: branches.map((b) => ({ name: b.name, address: b.address, qrStatus: b.qrStatus })),
    sales: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      todayRevenue: Math.round(todayRevenue * 100) / 100,
      todayInvoiceCount,
      last7DaysRevenue: Math.round(last7DaysRevenue * 100) / 100,
      last7DaysInvoiceCount,
      last30DaysRevenue: Math.round(last30DaysRevenue * 100) / 100,
      invoiceCount: paidInvoices.length,
      totalAllInvoices: invoices.length,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      byPaymentMethod,
      byBranch,
      dailyLast7Days: dailyBuckets.map((d) => ({
        date: d.label,
        revenue: Math.round(d.revenue * 100) / 100,
        invoices: d.count,
      })),
      topSellingProducts,
      recentInvoices: invoices.slice(0, 12).map((inv) => ({
        invoiceNumber: inv.invoiceNumber,
        date: new Date(inv.issuedAt || inv.createdAt).toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
        customer: inv.customerName || 'Walk-in',
        paymentMethod: inv.paymentMethod,
        grandTotal: Math.round(Number(inv.grandTotal || 0) * 100) / 100,
        itemsCount: inv.items?.length || 0,
        items: (inv.items || []).map((it) => `${it.productName} ×${it.quantity}`).slice(0, 5),
      })),
    },
    inventory: {
      totalProducts: products.length,
      activeProducts: products.filter((p) => p.status === 'Active').length,
      categoriesCount: categories.length,
      totalStockUnits,
      totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
      avgPrice: products.length > 0 ? Math.round((priceSum / products.length) * 100) / 100 : 0,
      outOfStockCount: outOfStockProducts.length,
      lowStockCount: lowStockProducts.length,
      outOfStockProducts,
      lowStockProducts,
      mostExpensive,
      cheapest,
      byCategory,
      catalog: allCatalog.slice(0, 60),
      allCatalog,
    },
    offers: {
      total: offers.length,
      active: activeOffers.length,
      items: offerSummaries,
    },
    scans: {
      totalScans: scans.length,
      last7DaysScans: scansLast7Days,
      peakScanHour: peakScanHour !== null ? `${String(peakScanHour).padStart(2, '0')}:00` : null,
      topScannedProducts,
      scansByBranch,
    },
    team: {
      totalUsers: users.length,
      byRole: Object.fromEntries(roleMap.entries()),
      members: users.slice(0, 20).map((u) => ({ name: u.name, role: u.role, status: u.status })),
    },
    fees: fees.map((f) => ({ name: f.name, type: f.type, value: f.value, status: f.status })),
    recentAuditLogs: auditLogs.slice(0, 8).map((l) => ({
      actor: l.actorEmail,
      action: l.actionType,
      entity: l.entityType,
      at: l.createdAt,
    })),
  }
}

type SystemSnapshot = Awaited<ReturnType<typeof collectSystemSnapshot>>

function selectVisualsForQuery(
  query: string,
  snap: SystemSnapshot
): { kpis: AiKpiCard[]; charts: AiChartSpec[]; suggestions: string[] } {
  const q = normalizeArabic(query)
  const ar = isArabicText(query)

  // ONLY show visual KPI cards & charts when the user genuinely asks for reports, stats, charts, or analytical breakdowns!
  const asksForReportOrStats =
    /تقرير|ريبورت|احصائي|تحليل|رسم|بياني|ملخص|شامل|اداء|توزيع|مقارن|اعلي|اكثر|مبيعات|ايراد|ارباح|ربح|مخزون|report|stat|analytics|chart|graph|summary|overview|breakdown|revenue|sales|dashboard|performance|top selling|best selling/.test(
      q
    )

  const wantsSales =
    /مبيع|ايراد|ربح|مكسب|فواتير|تقرير|ريبورت|احصائي|ملخص|شامل|اداء|sales|revenue|report|stat|summary|overview|analytics|profit|dashboard/.test(
      q
    )
  const wantsPayment = /طرق الدفع|طريقة الدفع|كاش|بطاق|كارت|انستا|instapay|payment method|payment breakdown/.test(q)
  const wantsInventory =
    /مخزون|نواقص|اقسام|الاقسام|كتالوج|جرد|inventory|stock|category|categories/.test(q)
  const wantsScans = /سكان|مسح|الباركود|كيو ار|الذروة|scan|qr|footfall|traffic/.test(q)
  const wantsTopSelling = /اعلي.*مبيع|اكثر.*مبيع|الاكثر مبيع|top selling|best selling/.test(q)

  const kpis: AiKpiCard[] = []
  const charts: AiChartSpec[] = []

  if (asksForReportOrStats) {
    if (wantsPayment && !wantsInventory) {
      if (snap.sales.byPaymentMethod.length > 0) {
        charts.push({
          id: 'payment-methods',
          title: ar ? 'توزيع طرق الدفع' : 'Revenue by Payment Method',
          type: 'pie',
          valueSuffix: ' EGP',
          data: snap.sales.byPaymentMethod.map((m) => ({
            name: m.method,
            value: m.total,
          })),
        })
      }
      if (wantsTopSelling && snap.sales.topSellingProducts.length > 0) {
        charts.push({
          id: 'top-products',
          title: ar ? 'أعلى المنتجات مبيعاً' : 'Top Selling Products',
          type: 'bar',
          valueSuffix: ' EGP',
          data: snap.sales.topSellingProducts.slice(0, 6).map((p) => ({
            name: p.name.length > 18 ? `${p.name.slice(0, 18)}…` : p.name,
            value: p.revenue,
          })),
        })
      }
    } else if (wantsTopSelling) {
      if (snap.sales.topSellingProducts.length > 0) {
        charts.push({
          id: 'top-products',
          title: ar ? 'أعلى المنتجات مبيعاً' : 'Top Selling Products',
          type: 'bar',
          valueSuffix: ' EGP',
          data: snap.sales.topSellingProducts.slice(0, 6).map((p) => ({
            name: p.name.length > 18 ? `${p.name.slice(0, 18)}…` : p.name,
            value: p.revenue,
          })),
        })
      }
    } else if (wantsInventory && !wantsSales) {
      kpis.push(
        {
          label: ar ? 'إجمالي المنتجات' : 'Total Products',
          value: String(snap.inventory.totalProducts),
          hint: ar ? `${snap.inventory.categoriesCount} أقسام` : `${snap.inventory.categoriesCount} categories`,
        },
        {
          label: ar ? 'قيمة المخزون' : 'Inventory Value',
          value: formatMoney(snap.inventory.totalInventoryValue),
          hint: ar ? `${snap.inventory.totalStockUnits} قطعة` : `${snap.inventory.totalStockUnits} units`,
        },
        {
          label: ar ? 'متوسط السعر' : 'Avg Price',
          value: formatMoney(snap.inventory.avgPrice),
        },
        {
          label: ar ? 'نواقص ومخزون منخفض' : 'Low / Out of Stock',
          value: String(snap.inventory.outOfStockCount + snap.inventory.lowStockCount),
          hint: ar ? `نفد: ${snap.inventory.outOfStockCount}` : `Out: ${snap.inventory.outOfStockCount}`,
        }
      )

      if (snap.inventory.byCategory.length > 0) {
        charts.push({
          id: 'category-stock',
          title: ar ? 'عدد المنتجات حسب القسم' : 'Products by Category',
          type: 'bar',
          data: snap.inventory.byCategory.slice(0, 8).map((c) => ({
            name: c.category,
            value: c.count,
          })),
        })
      }
    } else if (wantsScans && !wantsSales) {
      kpis.push(
        {
          label: ar ? 'إجمالي مسح الـ QR' : 'Total QR Scans',
          value: String(snap.scans.totalScans),
          hint: ar ? `آخر 7 أيام: ${snap.scans.last7DaysScans}` : `7d: ${snap.scans.last7DaysScans}`,
        },
        {
          label: ar ? 'ساعة الذروة' : 'Peak Hour',
          value: snap.scans.peakScanHour || '—',
        },
        {
          label: ar ? 'عدد الفروع' : 'Branches',
          value: String(snap.branches.length),
        },
        {
          label: ar ? 'العروض الفعالة' : 'Active Offers',
          value: String(snap.offers.active),
        }
      )

      if (snap.scans.topScannedProducts.length > 0) {
        charts.push({
          id: 'top-scans',
          title: ar ? 'أكثر المنتجات مسحاً بالباركود' : 'Most Scanned Products',
          type: 'bar',
          data: snap.scans.topScannedProducts.slice(0, 6).map((s) => ({
            name: s.name.length > 18 ? `${s.name.slice(0, 18)}…` : s.name,
            value: s.count,
          })),
        })
      }
    } else if (wantsSales) {
      kpis.push(
        {
          label: ar ? 'إجمالي المبيعات' : 'Total Revenue',
          value: formatMoney(snap.sales.totalRevenue),
          hint: ar ? `${snap.sales.invoiceCount} فاتورة مدفوعة` : `${snap.sales.invoiceCount} paid invoices`,
        },
        {
          label: ar ? 'مبيعات اليوم' : "Today's Sales",
          value: formatMoney(snap.sales.todayRevenue),
          hint: ar ? `${snap.sales.todayInvoiceCount} فاتورة اليوم` : `${snap.sales.todayInvoiceCount} today`,
        },
        {
          label: ar ? 'متوسط الفاتورة' : 'Avg Order Value',
          value: formatMoney(snap.sales.avgOrderValue),
          hint: ar ? `ضرائب: ${formatMoney(snap.sales.totalTax)}` : `Tax: ${formatMoney(snap.sales.totalTax)}`,
        },
        {
          label: ar ? 'المنتجات النشطة' : 'Active Products',
          value: String(snap.inventory.activeProducts),
          hint: ar
            ? `نواقص: ${snap.inventory.lowStockCount + snap.inventory.outOfStockCount}`
            : `Low/Out: ${snap.inventory.lowStockCount + snap.inventory.outOfStockCount}`,
        }
      )

      if (snap.sales.dailyLast7Days.some((d) => d.revenue > 0)) {
        charts.push({
          id: 'daily-sales',
          title: ar ? 'المبيعات اليومية (آخر 7 أيام)' : 'Daily Sales (Last 7 Days)',
          type: 'area',
          valueSuffix: ' EGP',
          data: snap.sales.dailyLast7Days.map((d) => ({
            name: d.date,
            value: d.revenue,
            secondary: d.invoices,
          })),
        })
      }

      if (snap.sales.byPaymentMethod.length > 0) {
        charts.push({
          id: 'payment-methods',
          title: ar ? 'توزيع طرق الدفع' : 'Revenue by Payment Method',
          type: 'pie',
          valueSuffix: ' EGP',
          data: snap.sales.byPaymentMethod.map((m) => ({
            name: m.method,
            value: m.total,
          })),
        })
      }
    }
  }

  const suggestions = ar
    ? [
        'اعمل تقرير مبيعات شامل',
        'إيه المنتجات اللي مخزونها قليل؟',
        'إيه آخر 5 فواتير اتعملت؟',
        'إيه العروض الشغالة دلوقتي؟',
      ]
    : [
        'Generate a full sales report',
        'Which products are low on stock?',
        'Show the last 5 invoices',
        'What offers are currently active?',
      ]

  return { kpis, charts, suggestions }
}

function buildSystemPrompt(snap: SystemSnapshot): string {
  // Strip allCatalog duplicate before serializing to keep prompt compact & fast
  const compactSnap = {
    ...snap,
    inventory: {
      ...snap.inventory,
      allCatalog: undefined,
    },
  }

  return `You are Maya AI, a smart, conversational business & POS assistant inside the "Green Scan" store management system.

STRICT BEHAVIOR RULES:
1. Reply in the EXACT SAME language and tone as the user (natural Egyptian/Modern Arabic if they write Arabic; English if English).
2. MATCH YOUR ANSWER TO THE USER'S EXACT QUESTION:
   - If the user greets you ("ازيك", "اهلا", "hi"), respond warmly in 1–2 short conversational sentences. DO NOT print any report or table!
   - If the user asks a specific question ("سعر بيبسي كام؟", "كام فرع عندي؟", "آخر فاتورة بكام؟", "مين الكاشير؟"), answer ONLY that exact question directly and concisely!
   - ONLY generate a full multi-section report / Markdown table when the user actually asks for a report, statistics, analysis, or breakdown!
3. Ground EVERY fact and number strictly in the LIVE DATABASE JSON below — NEVER hallucinate or invent products, prices, or sales.
4. Use EGP for currency.

LIVE SYSTEM DATABASE SNAPSHOT (JSON):
${JSON.stringify(compactSnap)}`
}

async function callOpenAiCompatible(
  url: string,
  headers: Record<string, string>,
  model: string,
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  timeoutMs = 22000
): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.4,
      }),
      signal: controller.signal,
    })

    const rawText = await res.text()
    if (!res.ok) {
      const err: any = new Error(`HTTP ${res.status}: ${rawText.slice(0, 220)}`)
      err.status = res.status
      err.rawBody = rawText
      throw err
    }

    try {
      const json: any = JSON.parse(rawText)
      const content =
        json?.choices?.[0]?.message?.content ||
        json?.message?.content ||
        json?.response ||
        ''
      if (typeof content === 'string' && content.trim()) {
        return content.trim()
      }
    } catch {
      if (rawText.trim().length > 8 && !rawText.trim().startsWith('<')) {
        return rawText.trim()
      }
    }

    throw new Error('Empty response from AI model')
  } finally {
    clearTimeout(timer)
  }
}

async function callGemini(
  apiKey: string,
  model: string,
  systemPrompt: string,
  history: ChatHistoryTurn[],
  userMessage: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model || 'gemini-2.0-flash'
  )}:generateContent?key=${encodeURIComponent(apiKey)}`

  const contents = [
    ...history.slice(-8).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: userMessage }] },
  ]

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 25000)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature: 0.4 },
      }),
      signal: controller.signal,
    })
    const data: any = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data?.error?.message || `Gemini HTTP ${res.status}`)
    }
    const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || ''
    if (!text.trim()) throw new Error('Empty Gemini response')
    return text.trim()
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Smart intent-aware local Q&A & Analytics engine:
 * Answers specific questions directly (greetings, product search, barcode lookup,
 * specific invoice, offers, staff, branches, today's sales, top sellers, low stock,
 * payment methods, scans, or full reports) instead of dumping a generic report!
 */
function buildSmartLocalAnswer(
  query: string,
  snap: SystemSnapshot,
  cooldownSeconds?: number
): string {
  const ar = isArabicText(query)
  const qNorm = normalizeArabic(query)

  // 1. Greetings / Casual chat
  if (/^(اهلا|مرحبا|السلام عليكم|سلام|هاي|هلو|ازيك|ازي الحال|عامل ايه|صباح الخير|مساء الخير|اخبارك|hi|hello|hey|good morning|good evening)[\s!؟?.]*$/i.test(qNorm)) {
    return ar
      ? `أهلاً بك! أنا **Maya** مساعدك الذكي المتصل مباشرة ببيانات **${snap.scope}**.\nاسألني أي سؤال عن المبيعات، الفواتير، سعر أو مخزون أي منتج، العروض، الفروع، أو اطلب مني أعملك تقرير وإحصائيات فوراً.`
      : `Hello! I'm **Maya**, connected live to **${snap.scope}**.\nAsk me anything about your sales, invoices, product prices/stock, offers, branches, or ask for a full report.`
  }

  if (/^(شكرا|تسلم|متشكر|تمام|ماشي|اوكي|ok|thanks|thank you)[\s!؟?.]*$/i.test(qNorm)) {
    return ar
      ? 'العفو! لو احتجت أي استفسار أو تقرير تاني عن السيستم أنا موجود في أي وقت.'
      : "You're welcome! Let me know whenever you need another lookup or report."
  }

  // 2. Capabilities / Who are you
  if (/(انت مين|مين انت|بتعمل ايه|تقدر تعمل ايه|مساعده|help|who are you|what can you do)/.test(qNorm)) {
    return ar
      ? `أنا **Maya AI** ومربوطة مباشرة بقاعدة بيانات **${snap.scope}**. أقدر أساعدك في:\n- **الاستعلام السريع**: اسألني عن سعر أو مخزون أي منتج بالاسم أو الباركود.\n- **المبيعات والفواتير**: مبيعات اليوم، آخر الفواتير، توزيع طرق الدفع، وأعلى المنتجات مبيعاً.\n- **المخزون والنواقص**: المنتجات اللي خلصت أو قربت تخلص، وتوزيع الأقسام.\n- **العروض والفروع والسكان**: العروض النشطة، أداء الفروع، ومسح الـ QR.`
      : `I'm **Maya AI**, connected live to **${snap.scope}**. I can answer direct questions on product prices/stock, today's sales, recent invoices, payment methods, offers, branches, QR scans, and generate visual reports.`
  }

  // 3. Direct Barcode or Specific Product Search
  const barcodeMatch = query.match(/\b\d{6,14}\b/)
  if (barcodeMatch) {
    const code = barcodeMatch[0]
    const found = snap.inventory.allCatalog.find((p) => p.barcode === code)
    if (found) {
      return ar
        ? `المنتج صاحب الباركود \`${found.barcode}\` هو **${found.name}**:\n- **السعر:** ${formatMoney(found.price)}\n- **المخزون الحالي:** ${found.stocks} قطعة\n- **القسم:** ${found.category}\n- **الحالة:** ${found.status}`
        : `Barcode \`${found.barcode}\` matches **${found.name}** — Price: **${formatMoney(found.price)}**, Stock: **${found.stocks}**, Category: **${found.category}**.`
    }
    return ar
      ? `لا يوجد منتج مسجل في السيستم بالباركود \`${code}\`.`
      : `No product found with barcode \`${code}\`.`
  }

  // Match specific product by name tokens (when not asking for a general report/list)
  const stopWords = new Set([
    'سعر', 'كام', 'بكام', 'عندنا', 'عندك', 'موجود', 'كميه', 'كمية', 'مخزون', 'منتج', 'المنتج',
    'منتجات', 'المنتجات', 'في', 'من', 'علي', 'عن', 'هو', 'هي', 'ايه', 'هل', 'عايز', 'اعرف',
    'تقرير', 'احصائيات', 'ملخص', 'المبيعات', 'الفواتير', 'العروض', 'الفروع', 'price', 'stock',
    'how', 'much', 'is', 'the', 'of', 'for', 'product', 'products', 'report', 'sales',
  ])
  const queryTokens = qNorm
    .replace(/[؟?.,!]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stopWords.has(w))

  if (queryTokens.length > 0 && !/تقرير|ريبورت|احصائي|ملخص|شامل|report|summary|overview/.test(qNorm)) {
    const matchedProducts = snap.inventory.allCatalog.filter((p) => {
      const pNorm = normalizeArabic(p.name)
      return queryTokens.some((tok) => pNorm.includes(tok))
    })
    if (matchedProducts.length > 0 && matchedProducts.length <= 12) {
      if (matchedProducts.length === 1) {
        const p = matchedProducts[0]
        return ar
          ? `**${p.name}** (${p.category}):\n- **السعر:** ${formatMoney(p.price)}\n- **المخزون المتاح:** ${p.stocks} قطعة\n- **الباركود:** \`${p.barcode}\``
          : `**${p.name}** (${p.category}) — Price: **${formatMoney(p.price)}**, Stock: **${p.stocks}**, Barcode: \`${p.barcode}\`.`
      }
      const rows = matchedProducts
        .map((p) => `| ${p.name} | ${p.category} | ${formatMoney(p.price)} | ${p.stocks} |`)
        .join('\n')
      return ar
        ? `دي المنتجات المطابقة لسؤالك (**${matchedProducts.length}** منتج):\n\n| المنتج | القسم | السعر | المخزون |\n| :--- | :--- | :--- | :---: |\n${rows}`
        : `Matching products (**${matchedProducts.length}**):\n\n| Product | Category | Price | Stock |\n| :--- | :--- | :--- | :---: |\n${rows}`
    }

    // Check category match
    const matchedCat = snap.inventory.byCategory.find((c) =>
      queryTokens.some((tok) => normalizeArabic(c.category).includes(tok))
    )
    if (matchedCat) {
      const catProducts = snap.inventory.allCatalog.filter((p) => p.category === matchedCat.category)
      const rows = catProducts
        .slice(0, 15)
        .map((p) => `| ${p.name} | ${formatMoney(p.price)} | ${p.stocks} |`)
        .join('\n')
      return ar
        ? `قسم **${matchedCat.category}** فيه **${matchedCat.count}** منتج (إجمالي مخزون **${matchedCat.stock}** قطعة بقيمة **${formatMoney(matchedCat.value)}**):\n\n| المنتج | السعر | المخزون |\n| :--- | :--- | :---: |\n${rows}`
        : `Category **${matchedCat.category}** has **${matchedCat.count}** products (${matchedCat.stock} units worth ${formatMoney(matchedCat.value)}):\n\n| Product | Price | Stock |\n| :--- | :--- | :---: |\n${rows}`
    }
  }

  // 4. Specific Invoice lookup / Recent invoices
  if (/اخر فاتور|اخر الفواتير|فواتير|inv-|recent invoice|last invoice/.test(qNorm)) {
    const invCodeMatch = query.match(/INV-[A-Z0-9-]+/i)
    if (invCodeMatch) {
      const target = snap.sales.recentInvoices.find(
        (i) => i.invoiceNumber.toLowerCase() === invCodeMatch[0].toLowerCase()
      )
      if (target) {
        return ar
          ? `تفاصيل الفاتورة **#${target.invoiceNumber}**:\n- **التاريخ:** ${target.date}\n- **العميل:** ${target.customer}\n- **طريقة الدفع:** ${target.paymentMethod}\n- **الإجمالي:** ${formatMoney(target.grandTotal)}\n- **الأصناف (${target.itemsCount}):** ${target.items.join('، ')}`
          : `Invoice **#${target.invoiceNumber}** (${target.date}): Customer **${target.customer}**, Payment **${target.paymentMethod}**, Total **${formatMoney(target.grandTotal)}**, Items: ${target.items.join(', ')}.`
      }
    }
    if (snap.sales.recentInvoices.length === 0) {
      return ar ? 'لا توجد فواتير مسجلة في السيستم حتى الآن.' : 'No invoices have been recorded yet.'
    }
    const rows = snap.sales.recentInvoices
      .slice(0, 6)
      .map((i) => `| #${i.invoiceNumber} | ${i.date} | ${i.paymentMethod} | ${i.itemsCount} | ${formatMoney(i.grandTotal)} |`)
      .join('\n')
    return ar
      ? `إجمالي الفواتير المدفوعة **${snap.sales.invoiceCount}** فاتورة. دي أحدث الفواتير:\n\n| رقم الفاتورة | التوقيت | الدفع | الأصناف | الإجمالي |\n| :--- | :--- | :---: | :---: | :--- |\n${rows}`
      : `Total paid invoices: **${snap.sales.invoiceCount}**. Latest invoices:\n\n| Invoice # | Date | Payment | Items | Total |\n| :--- | :--- | :---: | :---: | :--- |\n${rows}`
  }

  // 5. Most expensive / cheapest products
  if (/اغلي|اعلي سعر|ارخص|اقل سعر|expensive|cheapest/.test(qNorm)) {
    const wantsCheap = /ارخص|اقل سعر|cheapest/.test(qNorm)
    const list = wantsCheap ? snap.inventory.cheapest : snap.inventory.mostExpensive
    const rows = list.map((p) => `| ${p.name} | ${formatMoney(p.price)} | ${p.stocks} |`).join('\n')
    return ar
      ? `${wantsCheap ? 'أرخص' : 'أغلى'} **${list.length}** منتجات في السيستم:\n\n| المنتج | السعر | المخزون |\n| :--- | :--- | :---: |\n${rows}`
      : `${wantsCheap ? 'Cheapest' : 'Most expensive'} **${list.length}** products:\n\n| Product | Price | Stock |\n| :--- | :--- | :---: |\n${rows}`
  }

  // 6. Low stock / out of stock
  if (/نواقص|خلص|نفد|قليل|low stock|out of stock/.test(qNorm)) {
    const out = snap.inventory.outOfStockProducts
    const low = snap.inventory.lowStockProducts
    if (out.length === 0 && low.length === 0) {
      return ar
        ? `المخزون سليم بالكامل! لا توجد أي منتجات منتهية أو أقل من 5 قطع حالياً (إجمالي **${snap.inventory.totalProducts}** منتج).`
        : `Inventory is healthy! Zero out-of-stock or low-stock (≤5) items out of **${snap.inventory.totalProducts}** products.`
    }
    const lines = [
      ...out.map((p) => `- 🔴 **${p.name}** — نفد المخزون (0 قطعة) • ${formatMoney(p.price)}`),
      ...low.map((p) => `- 🟡 **${p.name}** — متبقي **${p.stocks}** قطع • ${formatMoney(p.price)}`),
    ].join('\n')
    return ar
      ? `تنبيهات المخزون حالياً (**${out.length}** نفد • **${low.length}** منخفض):\n\n${lines}`
      : `Stock alerts (**${out.length}** out of stock • **${low.length}** low stock):\n\n${lines}`
  }

  // 7. Offers
  if (/عروض|العروض|عرض|خصم|خصومات|offer|discount/.test(qNorm)) {
    if (snap.offers.total === 0) {
      return ar ? 'لا توجد أي عروض مضافة حالياً. تقدر تضيف عروض جديدة من صفحة العروض في السايد بار.' : 'No offers are configured yet.'
    }
    const rows = snap.offers.items
      .map((o) => `| ${o.title} | ${o.discount} | ${o.productsCount} | ${o.isActive ? '🟢 نشط' : '⚪ متوقف'} |`)
      .join('\n')
    return ar
      ? `عندك **${snap.offers.active}** عرض نشط من إجمالي **${snap.offers.total}** عروض:\n\n| اسم العرض | الخصم | عدد المنتجات | الحالة |\n| :--- | :---: | :---: | :---: |\n${rows}`
      : `You have **${snap.offers.active}** active offers out of **${snap.offers.total}** total:\n\n| Offer | Discount | Products | Status |\n| :--- | :---: | :---: | :---: |\n${rows}`
  }

  // 8. Staff / Team / Cashiers
  if (/موظف|الموظفين|كاشير|المستخدمين|الفريق|فريق|staff|cashier|user|team/.test(qNorm)) {
    const rows = snap.team.members
      .map((u) => `| ${u.name} | ${u.role} | ${u.status} |`)
      .join('\n')
    return ar
      ? `عدد المستخدمين المسجلين في هذا النطاق **${snap.team.totalUsers}**:\n\n| الاسم | الدور | الحالة |\n| :--- | :--- | :---: |\n${rows}`
      : `Total users in scope: **${snap.team.totalUsers}**:\n\n| Name | Role | Status |\n| :--- | :--- | :---: |\n${rows}`
  }

  // 9. Branches / Merchants
  if (/فروع|الفروع|فرع|متاجر|تجار|branch|merchant/.test(qNorm)) {
    const rows = snap.branches
      .map((b) => {
        const sales = snap.sales.byBranch.find((s) => s.branch === b.name)
        return `| ${b.name} | ${b.address || '—'} | ${b.qrStatus} | ${sales ? `${sales.count} فاتورة (${formatMoney(sales.total)})` : '0'} |`
      })
      .join('\n')
    return ar
      ? `عدد الفروع المسجلة **${snap.branches.length}**:\n\n| الفرع | العنوان | حالة الـ QR | المبيعات |\n| :--- | :--- | :---: | :--- |\n${rows}`
      : `Registered branches (**${snap.branches.length}**):\n\n| Branch | Address | QR | Sales |\n| :--- | :--- | :---: | :--- |\n${rows}`
  }

  // 10. Payment methods
  if (/طرق الدفع|طريقة الدفع|كاش|انستا|كارت|بطاق|payment|instapay|cash|card/.test(qNorm)) {
    if (snap.sales.byPaymentMethod.length === 0) {
      return ar ? 'لا توجد عمليات دفع مسجلة بعد.' : 'No paid transactions recorded yet.'
    }
    const rows = snap.sales.byPaymentMethod
      .map((m) => `| ${m.method} | ${m.count} | ${formatMoney(m.total)} | ${m.sharePct}% |`)
      .join('\n')
    return ar
      ? `توزيع المبيعات حسب طرق الدفع:\n\n| طريقة الدفع | عدد الفواتير | الإجمالي | النسبة |\n| :--- | :---: | :--- | :---: |\n${rows}`
      : `Revenue breakdown by payment method:\n\n| Method | Invoices | Total | Share |\n| :--- | :---: | :--- | :---: |\n${rows}`
  }

  // 11. Top selling products
  if (/اعلي.*مبيع|اكثر.*مبيع|الاكثر مبيع|top selling|best selling/.test(qNorm)) {
    if (snap.sales.topSellingProducts.length === 0) {
      return ar ? 'لا توجد مبيعات منتجات مسجلة بعد.' : 'No product sales recorded yet.'
    }
    const rows = snap.sales.topSellingProducts
      .slice(0, 8)
      .map((p) => `| ${p.name} | ${p.qty} | ${formatMoney(p.revenue)} |`)
      .join('\n')
    return ar
      ? `أعلى المنتجات مبيعاً:\n\n| المنتج | الكمية المباعة | الإيرادات |\n| :--- | :---: | :--- |\n${rows}`
      : `Top selling products:\n\n| Product | Qty Sold | Revenue |\n| :--- | :---: | :--- |\n${rows}`
  }

  // 12. Today's sales specifically
  if (/النهارده|اليوم|today/.test(qNorm) && /مبيع|ايراد|فواتير|بعت|sales|revenue|invoice/.test(qNorm)) {
    return ar
      ? `مبيعات اليوم حتى الآن: **${formatMoney(snap.sales.todayRevenue)}** من خلال **${snap.sales.todayInvoiceCount}** فاتورة (وإجمالي آخر 7 أيام: **${formatMoney(snap.sales.last7DaysRevenue)}**).`
      : `Today's sales so far: **${formatMoney(snap.sales.todayRevenue)}** across **${snap.sales.todayInvoiceCount}** invoices (Last 7 days: **${formatMoney(snap.sales.last7DaysRevenue)}**).`
  }

  // 13. Scans / QR
  if (/سكان|مسح|كيو ار|الباركود|الذروه|scan|qr|footfall/.test(qNorm)) {
    const topRows = snap.scans.topScannedProducts
      .slice(0, 6)
      .map((s) => `| ${s.name} | ${s.count} |`)
      .join('\n')
    return ar
      ? `إحصائيات مسح الباركود والـ QR:\n- **إجمالي عمليات المسح:** ${snap.scans.totalScans} (آخر 7 أيام: ${snap.scans.last7DaysScans})\n- **ساعة الذروة:** ${snap.scans.peakScanHour || 'غير محددة بعد'}\n${topRows ? `\n| أكثر المنتجات مسحاً | عدد المرات |\n| :--- | :---: |\n${topRows}` : ''}`
      : `QR Scanner telemetry:\n- **Total scans:** ${snap.scans.totalScans} (7d: ${snap.scans.last7DaysScans})\n- **Peak hour:** ${snap.scans.peakScanHour || 'N/A'}\n${topRows ? `\n| Most Scanned Product | Count |\n| :--- | :---: |\n${topRows}` : ''}`
  }

  // 14. Inventory general summary
  if (/مخزون|منتجات|المنتجات|اقسام|الاقسام|جرد|inventory|catalog|categories/.test(qNorm)) {
    const catRows = snap.inventory.byCategory
      .slice(0, 8)
      .map((c) => `| ${c.category} | ${c.count} | ${c.stock} | ${formatMoney(c.value)} |`)
      .join('\n')
    return ar
      ? `ملخص المخزون في **${snap.scope}**:\n- **عدد المنتجات:** ${snap.inventory.totalProducts} (${snap.inventory.activeProducts} نشط)\n- **إجمالي الوحدات:** ${snap.inventory.totalStockUnits} قطعة بقيمة **${formatMoney(snap.inventory.totalInventoryValue)}**\n- **النواقص:** ${snap.inventory.outOfStockCount} نفد • ${snap.inventory.lowStockCount} منخفض\n${catRows ? `\n| القسم | المنتجات | المخزون | القيمة |\n| :--- | :---: | :---: | :--- |\n${catRows}` : ''}`
      : `Inventory overview for **${snap.scope}**: **${snap.inventory.totalProducts}** products, **${snap.inventory.totalStockUnits}** units worth **${formatMoney(snap.inventory.totalInventoryValue)}**.`
  }

  // 15. Explicit Sales Report / Statistics request
  if (/تقرير|ريبورت|احصائي|ملخص|شامل|مبيعات|ايراد|اداء|report|stat|summary|overview|sales|revenue/.test(qNorm)) {
    const pmRows = snap.sales.byPaymentMethod
      .map((m) => `| ${m.method} | ${m.count} | ${formatMoney(m.total)} | ${m.sharePct}% |`)
      .join('\n')
    return ar
      ? `### 📊 تقرير المبيعات والإحصائيات (${snap.scope})\n\n| المؤشر | القيمة |\n| :--- | :--- |\n| **إجمالي المبيعات** | **${formatMoney(snap.sales.totalRevenue)}** (${snap.sales.invoiceCount} فاتورة) |\n| **مبيعات اليوم** | **${formatMoney(snap.sales.todayRevenue)}** (${snap.sales.todayInvoiceCount} فاتورة) |\n| **آخر 7 أيام** | **${formatMoney(snap.sales.last7DaysRevenue)}** (${snap.sales.last7DaysInvoiceCount} فاتورة) |\n| **متوسط الفاتورة** | **${formatMoney(snap.sales.avgOrderValue)}** |\n| **الضرائب المحصّلة** | **${formatMoney(snap.sales.totalTax)}** |\n\n${pmRows ? `#### توزيع طرق الدفع\n| الطريقة | الفواتير | الإجمالي | النسبة |\n| :--- | :---: | :--- | :---: |\n${pmRows}` : ''}`
      : `### 📊 Sales & Statistics Report (${snap.scope})\n- **Total Revenue:** ${formatMoney(snap.sales.totalRevenue)} (${snap.sales.invoiceCount} invoices)\n- **Today:** ${formatMoney(snap.sales.todayRevenue)}\n- **Last 7 Days:** ${formatMoney(snap.sales.last7DaysRevenue)}\n- **AOV:** ${formatMoney(snap.sales.avgOrderValue)}`
  }

  // 16. Open-ended question when free keyless LLM is rate-limited
  const waitHint =
    cooldownSeconds && cooldownSeconds > 0
      ? ar
        ? `الموديل المجاني بدون مفتاح (Pollinations) عليه حد مؤقت (${cooldownSeconds} ثانية).`
        : `The zero-key free model (Pollinations) is in a short cooldown (${cooldownSeconds}s).`
      : ar
        ? `الموديل الخارجي غير متاح حالياً.`
        : `The external AI model is temporarily unavailable.`

  return ar
    ? `${waitHint}\n\nللحصول على محادثة مفتوحة فائقة السرعة بدون انتظار، اضغط على أيقونة **الإعدادات (⚙️)** بالأعلى واختر **Groq Free** أو **Google Gemini Free** وأضف مفتاحك المجاني.\n\nوحتى الآن أقدر أجاوبك فوراً من قاعدة البيانات على أسئلة مثل:\n- *«سعر [اسم المنتج] كام؟»* أو ابحث بالباركود\n- *«مبيعات اليوم كام؟»* أو *«إيه آخر الفواتير؟»*\n- *«إيه النواقص في المخزون؟»* أو *«إيه العروض الشغالة؟»*\n- *«اعمل تقرير مبيعات شامل»*`
    : `${waitHint}\n\nFor unlimited fast conversational AI, click **Settings (⚙️)** above and add a free **Groq** or **Google Gemini** API key.\nMeanwhile, I can instantly answer direct database questions (product prices, stock alerts, recent invoices, today's sales, offers, branches, or full reports).`
}

export async function runAiChat(options: {
  merchantId?: string
  configKey: string
  message: string
  history?: ChatHistoryTurn[]
  overrideProvider?: AiProvider
  overrideModel?: string
}): Promise<AiChatResponse> {
  const { merchantId, configKey, message, history = [], overrideProvider, overrideModel } = options

  const savedCfg = getAiConfig(configKey)
  const provider: AiProvider = overrideProvider || savedCfg.provider || 'FREE_POLLINATIONS'
  const model = overrideModel || savedCfg.model || 'openai'

  const snapshot = await collectSystemSnapshot(merchantId)
  const systemPrompt = buildSystemPrompt(snapshot)
  const visuals = selectVisualsForQuery(message, snapshot)

  const openAiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-8).map((h) => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ]

  let reply = ''
  let providerUsed: string = provider
  let modelUsed = model
  let fallbackUsed = false
  let cooldownSeconds: number | undefined

  try {
    if (provider === 'GROQ') {
      const apiKey = savedCfg.apiKey?.trim() || process.env.GROQ_API_KEY
      if (!apiKey) throw new Error('Groq API Key missing')
      modelUsed = model || 'llama-3.3-70b-versatile'
      reply = await callOpenAiCompatible(
        'https://api.groq.com/openai/v1/chat/completions',
        { Authorization: `Bearer ${apiKey}` },
        modelUsed,
        openAiMessages
      )
    } else if (provider === 'GEMINI') {
      const apiKey = savedCfg.apiKey?.trim() || process.env.GEMINI_API_KEY
      if (!apiKey) throw new Error('Gemini API Key missing')
      modelUsed = model || 'gemini-2.0-flash'
      reply = await callGemini(apiKey, modelUsed, systemPrompt, history, message)
    } else if (provider === 'OPENROUTER') {
      const apiKey = savedCfg.apiKey?.trim() || process.env.OPENROUTER_API_KEY
      if (!apiKey) throw new Error('OpenRouter API Key missing')
      modelUsed = model || 'meta-llama/llama-3.3-70b-instruct:free'
      reply = await callOpenAiCompatible(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'Green Scan AI Copilot',
        },
        modelUsed,
        openAiMessages
      )
    } else if (provider === 'OLLAMA') {
      const base = (savedCfg.ollamaUrl || 'http://localhost:11434').replace(/\/+$/, '')
      modelUsed = model || 'llama3.2'
      reply = await callOpenAiCompatible(`${base}/v1/chat/completions`, {}, modelUsed, openAiMessages, 40000)
    } else {
      // FREE_POLLINATIONS: single call only (never loop 3x and burn IP quota)
      const now = Date.now()
      if (now < pollinationsCooldownUntil) {
        cooldownSeconds = Math.ceil((pollinationsCooldownUntil - now) / 1000)
        throw new Error(`Pollinations cooldown (${cooldownSeconds}s remaining)`)
      }

      try {
        modelUsed = model || 'openai'
        reply = await callOpenAiCompatible(
          'https://text.pollinations.ai/openai',
          {},
          modelUsed,
          openAiMessages,
          20000
        )
      } catch (err: any) {
        if (err?.status === 402 || err?.status === 429) {
          const retryMatch = String(err?.rawBody || err?.message || '').match(/Retry after (\d+)s/i)
          const waitSec = retryMatch ? Math.min(60, Math.max(10, Number(retryMatch[1]))) : 45
          pollinationsCooldownUntil = Date.now() + waitSec * 1000
          cooldownSeconds = waitSec
        }
        throw err
      }
    }
  } catch (err: any) {
    console.warn(`[AI Copilot] Provider ${provider} (${model}) unavailable: ${err?.message}. Using Smart Live DB Engine.`)
    fallbackUsed = true
    providerUsed = 'LOCAL_LIVE_ANALYTICS'
    modelUsed = 'Live DB Assistant'
    reply = buildSmartLocalAnswer(message, snapshot, cooldownSeconds)
  }

  return {
    reply,
    providerUsed,
    modelUsed,
    fallbackUsed,
    cooldownSeconds,
    kpis: visuals.kpis,
    charts: visuals.charts,
    suggestions: visuals.suggestions,
    generatedAt: snapshot.generatedAt,
  }
}
