import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

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
// Real-time Barcode scanning lookup inside a specific branch
router.post('/lookup', async (req: Request, res: Response) => {
  try {
    const { qrToken, barcode } = req.body

    if (!qrToken || !barcode) {
      return res.status(400).json({ error: 'qrToken and barcode are required' })
    }

    const branch = await prisma.branch.findUnique({
      where: { qrToken },
      select: { id: true, merchantId: true, qrStatus: true },
    })

    if (!branch || branch.qrStatus !== 'Active') {
      return res.status(403).json({ error: 'Branch scanner is inactive' })
    }

    const product = await prisma.product.findFirst({
      where: {
        merchantId: branch.merchantId,
        barcode: String(barcode).trim(),
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    })

    if (!product) {
      return res.status(404).json({ error: `Product with barcode ${barcode} not found in this store.` })
    }

    // Record scan telemetry asynchronously for analytics & footfall tracking
    prisma.customerScan
      .create({
        data: {
          branchId: branch.id,
          barcode: product.barcode,
          productName: product.name,
          price: product.price,
          userAgent: req.headers['user-agent'] || null,
          ipAddress: req.ip || null,
        },
      })
      .catch(() => {})

    res.json({
      id: product.id,
      name: product.name,
      barcode: product.barcode,
      price: product.price,
      stocks: product.stocks,
      description: product.description,
      imageUrl: product.imageUrl,
      category: product.category?.name || 'General',
      status: product.status,
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
