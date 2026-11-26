import { Router, Request, Response } from 'express'
import os from 'os'
import { prisma } from '../lib/prisma.js'

const router = Router()

interface ParsedOffer {
  id: string
  merchantId: string
  title: string
  description: string | null
  discountType: string
  discountValue: number
  productIds: string[]
  isActive: boolean
}

function parseOfferProductIds(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

function resolveBestActiveOffer(
  product: { id: string; merchantId: string; price: number },
  offers: ParsedOffer[]
) {
  const matching = offers.filter(
    (o) => o.isActive && o.merchantId === product.merchantId && o.productIds.includes(product.id)
  )
  if (matching.length === 0) return null

  let best: {
    id: string
    title: string
    description: string | null
    discountType: 'PERCENTAGE' | 'FIXED'
    discountValue: number
    originalPrice: number
    discountedPrice: number
    discountPercent: number
  } | null = null

  for (const offer of matching) {
    const originalPrice = product.price
    const type: 'PERCENTAGE' | 'FIXED' = offer.discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE'
    const rawDiscounted =
      type === 'PERCENTAGE'
        ? originalPrice * (1 - offer.discountValue / 100)
        : originalPrice - offer.discountValue
    const discountedPrice = Math.max(0, Math.round(rawDiscounted * 100) / 100)
    const discountPercent =
      type === 'PERCENTAGE'
        ? Math.round(offer.discountValue * 10) / 10
        : originalPrice > 0
          ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
          : 0

    if (!best || discountedPrice < best.discountedPrice) {
      best = {
        id: offer.id,
        title: offer.title,
        description: offer.description,
        discountType: type,
        discountValue: offer.discountValue,
        originalPrice,
        discountedPrice,
        discountPercent,
      }
    }
  }

  return best
}

function getLocalLanIp(): string | null {
  const nets = os.networkInterfaces()
  const candidates: Array<{ name: string; address: string }> = []
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        candidates.push({ name, address: net.address })
      }
    }
  }
  const wifi = candidates.find((c) => /wi-fi|wifi|wlan/i.test(c.name))
  if (wifi) return wifi.address
  const lan = candidates.find(
    (c) =>
      c.address.startsWith('192.168.') ||
      c.address.startsWith('10.') ||
      c.address.startsWith('172.')
  )
  return lan?.address || candidates[0]?.address || null
}

// GET /api/scan/network-info
// Returns the host machine's LAN IPv4 address so QR codes generated on localhost work on phones
router.get('/network-info', (_req: Request, res: Response) => {
  res.json({ lanIp: getLocalLanIp() })
})

// GET /api/scan/catalog
// Public endpoint for mobile customer scanner to load live merchants, branches, products & active offers
router.get('/catalog', async (_req: Request, res: Response) => {
  try {
    const [merchants, branches, products, rawOffers] = await Promise.all([
      prisma.merchant.findMany({
        where: { status: 'Active' },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.branch.findMany({
        where: { qrStatus: 'Active' },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.findMany({
        where: { status: 'Active' },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.offer.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const offers: ParsedOffer[] = rawOffers.map((o) => ({
      ...o,
      productIds: parseOfferProductIds(o.productIds),
    }))

    const enrichedProducts = products.map((p) => ({
      ...p,
      activeOffer: resolveBestActiveOffer(p, offers),
    }))

    res.json({ merchants, branches, products: enrichedProducts, offers })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/scan/branch/:qrToken
// Validates branch QR token and returns store context
router.get('/branch/:qrToken', async (req: Request, res: Response) => {
  try {
    const qrToken = req.params.qrToken as string

    const branch = await prisma.branch.findUnique({
      where: { qrToken },
      include: {
        merchant: {
          select: { id: true, name: true, logo: true, status: true },
        },
      },
    })

    if (!branch) {
      return res.status(404).json({ error: 'Invalid QR Code or Branch not found' })
    }

    if (branch.qrStatus !== 'Active' || branch.merchant.status !== 'Active') {
      return res.status(403).json({ error: 'This branch scanner endpoint is currently suspended' })
    }

    res.json({
      branchId: branch.id,
      branchName: branch.name,
      address: branch.address,
      merchantId: branch.merchant.id,
      merchantName: branch.merchant.name,
      merchantLogo: branch.merchant.logo,
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/scan/lookup
// Real-time Barcode scanning lookup (supports branch qrToken, merchantId, or general scanner lookup)
router.post('/lookup', async (req: Request, res: Response) => {
  try {
    const { qrToken, merchantId, barcode } = req.body

    if (!barcode) {
      return res.status(400).json({ error: 'barcode is required' })
    }

    const rawCode = String(barcode).trim()
    const cleanCode = rawCode.replace(/^0+/, '')

    let branch: { id: string; merchantId: string; qrStatus: string } | null = null
    if (qrToken) {
      branch = await prisma.branch.findUnique({
        where: { qrToken },
        select: { id: true, merchantId: true, qrStatus: true },
      })
    }

    const targetMerchantId: string | null = branch?.merchantId || merchantId || null

    const activeProducts = await prisma.product.findMany({
      where: { status: 'Active' },
      include: {
        category: { select: { id: true, name: true } },
      },
    })

    const matchesBarcode = (pBarcode: string) => {
      const trimmed = (pBarcode || '').trim()
      const clean = trimmed.replace(/^0+/, '')
      return (
        trimmed.toLowerCase() === rawCode.toLowerCase() ||
        clean.toLowerCase() === cleanCode.toLowerCase()
      )
    }

    // Prefer product in target merchant; if a specific merchant/branch was requested, scope to it
    let product = targetMerchantId
      ? activeProducts.find((p) => p.merchantId === targetMerchantId && matchesBarcode(p.barcode))
      : undefined

    if (!product && !targetMerchantId) {
      product = activeProducts.find((p) => matchesBarcode(p.barcode))
    }

    if (!product) {
      return res.status(404).json({ error: `Product with barcode ${rawCode} not found.` })
    }

    // Resolve best active offer for this product
    const rawOffers = await prisma.offer.findMany({
      where: { merchantId: product.merchantId, isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    const parsedOffers: ParsedOffer[] = rawOffers.map((o) => ({
      ...o,
      productIds: parseOfferProductIds(o.productIds),
    }))
    const activeOffer = resolveBestActiveOffer(product, parsedOffers)

    // Record scan telemetry asynchronously if branch is available
    if (branch) {
      prisma.customerScan
        .create({
          data: {
            branchId: branch.id,
            barcode: product.barcode,
            productName: product.name,
            price: activeOffer ? activeOffer.discountedPrice : product.price,
            userAgent: req.headers['user-agent'] || null,
            ipAddress: req.ip || null,
          },
        })
        .catch(() => {})
    }

    res.json({
      id: product.id,
      merchantId: product.merchantId,
      name: product.name,
      barcode: product.barcode,
      price: product.price,
      stocks: product.stocks,
      description: product.description,
      imageUrl: product.imageUrl,
      categoryId: product.categoryId,
      category: product.category?.name || 'General',
      status: product.status,
      activeOffer,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
