import { Router, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js'

const router = Router()

// GET /api/products
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { search, categoryId, status, merchantId } = req.query
    const where: any = {}

    // Multi-tenant scoping
    if (req.user?.role !== 'SUPER_ADMIN') {
      where.merchantId = req.user?.merchantId
    } else if (merchantId && merchantId !== 'all') {
      where.merchantId = String(merchantId)
    }

    if (categoryId && categoryId !== 'all') {
      where.categoryId = String(categoryId)
    }

    if (status && status !== 'all') {
      where.status = String(status)
    }

    if (search) {
      const q = String(search).trim()
      where.OR = [
        { name: { contains: q } },
        { barcode: { contains: q } },
      ]
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        merchant: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formatted = products.map((p) => ({
      ...p,
      feeIds: p.feeIds ? (() => { try { return JSON.parse(p.feeIds) } catch { return [] } })() : [],
    }))

    res.json(formatted)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/products
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    let targetMerchantId = req.user?.role === 'SUPER_ADMIN' ? (req.body.merchantId || req.user.merchantId) : req.user?.merchantId
    if (!targetMerchantId) {
      const firstMerchant = await prisma.merchant.findFirst()
      if (firstMerchant) {
        targetMerchantId = firstMerchant.id
      } else {
        const defaultMerchant = await prisma.merchant.create({
          data: {
            name: 'Default Merchant',
            email: 'default@priceing.com',
            status: 'Active',
          },
        })
        targetMerchantId = defaultMerchant.id
      }
    }

    const { name, barcode, price, stocks, description, imageUrl, categoryId, status, feeIds } = req.body
    if (!name || !barcode || price === undefined) {
      return res.status(400).json({ error: 'Name, barcode, and price are required' })
    }

    const trimmedBarcode = String(barcode).trim()

    // Enforce unique barcode within the same merchant
    const existing = await prisma.product.findFirst({
      where: {
        merchantId: targetMerchantId,
        barcode: trimmedBarcode,
      },
    })

    if (existing) {
      return res.status(409).json({
        error: `Barcode "${trimmedBarcode}" already exists in this merchant's catalog for product "${existing.name}".`,
      })
    }

    const product = await prisma.product.create({
      data: {
        merchantId: targetMerchantId,
        name: name.trim(),
        barcode: trimmedBarcode,
        price: parseFloat(price) || 0,
        stocks: parseInt(stocks) || 0,
        description: description?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        categoryId: categoryId || null,
        status: status || 'Active',
        feeIds: feeIds ? JSON.stringify(feeIds) : null,
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        actorEmail: req.user!.email,
        actionType: 'PRODUCT_CREATED',
        entityType: 'Product',
        entityId: product.id,
        newValues: JSON.stringify(product),
      },
    })

    res.status(201).json(product)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/products/:id
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Product not found' })

    if (req.user?.role !== 'SUPER_ADMIN' && existing.merchantId !== req.user?.merchantId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const { name, barcode, price, stocks, description, imageUrl, categoryId, status, feeIds } = req.body

    if (barcode && String(barcode).trim() !== existing.barcode) {
      const duplicate = await prisma.product.findFirst({
        where: {
          merchantId: existing.merchantId,
          barcode: String(barcode).trim(),
          NOT: { id: existing.id },
        },
      })
      if (duplicate) {
        return res.status(409).json({
          error: `Barcode "${barcode}" is already taken by product "${duplicate.name}".`,
        })
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        barcode: barcode !== undefined ? String(barcode).trim() : existing.barcode,
        price: price !== undefined ? parseFloat(price) : existing.price,
        stocks: stocks !== undefined ? parseInt(stocks) : existing.stocks,
        description: description !== undefined ? description : existing.description,
        imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
        categoryId: categoryId !== undefined ? categoryId : existing.categoryId,
        status: status !== undefined ? status : existing.status,
        feeIds: feeIds !== undefined ? (Array.isArray(feeIds) ? JSON.stringify(feeIds) : feeIds) : undefined,
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        actorEmail: req.user!.email,
        actionType: 'PRODUCT_UPDATED',
        entityType: 'Product',
        entityId: updated.id,
        oldValues: JSON.stringify(existing),
        newValues: JSON.stringify(updated),
      },
    })

    res.json(updated)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/products/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Product not found' })

    if (req.user?.role !== 'SUPER_ADMIN' && existing.merchantId !== req.user?.merchantId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    await prisma.product.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        actorEmail: req.user!.email,
        actionType: 'PRODUCT_DELETED',
        entityType: 'Product',
        entityId: id,
        oldValues: JSON.stringify(existing),
      },
    })

    res.json({ message: 'Product deleted successfully' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/products/bulk-excel-import
router.post('/bulk-excel-import', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const targetMerchantId = req.user?.role === 'SUPER_ADMIN' ? (req.body.merchantId || req.user.merchantId) : req.user?.merchantId
    const { rows, duplicateDecisions } = req.body

    let imported = 0
    let updated = 0
    let skipped = 0

    for (const row of rows) {
      const barcode = String(row.barcode).trim()
      const existing = await prisma.product.findFirst({
        where: { merchantId: targetMerchantId, barcode },
      })

      if (existing) {
        const decision = duplicateDecisions?.[barcode] || 'SKIP'
        if (decision === 'UPDATE') {
          await prisma.product.update({
            where: { id: existing.id },
            data: {
              name: row.name || existing.name,
              price: row.price !== undefined ? parseFloat(row.price) : existing.price,
              description: row.description || existing.description,
              imageUrl: row.imageUrl || existing.imageUrl,
            },
          })
          updated++
        } else {
          skipped++
        }
      } else {
        await prisma.product.create({
          data: {
            merchantId: targetMerchantId,
            name: row.name,
            barcode,
            price: parseFloat(row.price) || 0,
            description: row.description || null,
            imageUrl: row.imageUrl || null,
            status: row.status || 'Active',
          },
        })
        imported++
      }
    }

    res.json({ imported, updated, skipped })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/products/bulk-price
router.post('/bulk-price', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { mode, direction, value, merchantId, categoryId, status } = req.body

    if (mode !== 'FIXED' && mode !== 'PERCENTAGE') {
      return res.status(400).json({ error: 'Invalid adjustment mode. Use FIXED or PERCENTAGE.' })
    }
    if (direction !== 'INCREASE' && direction !== 'DECREASE') {
      return res.status(400).json({ error: 'Invalid direction. Use INCREASE or DECREASE.' })
    }

    const numericValue = Number(value)
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      return res.status(400).json({ error: 'Adjustment value must be a positive number.' })
    }

    const where: any = {}

    // Multi-tenant scoping
    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!req.user?.merchantId) {
        return res.status(403).json({ error: 'User does not belong to any merchant.' })
      }
      where.merchantId = req.user.merchantId
    } else if (merchantId && merchantId !== 'all') {
      where.merchantId = String(merchantId)
    }

    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId === 'uncategorized' ? null : String(categoryId)
    }

    if (status && status !== 'all') {
      where.status = String(status)
    }

    const matchingProducts = await prisma.product.findMany({ where })

    if (matchingProducts.length === 0) {
      return res.json({ updatedCount: 0, products: [] })
    }

    const sign = direction === 'DECREASE' ? -1 : 1
    const computePrice = (oldPrice: number) => {
      const raw =
        mode === 'PERCENTAGE'
          ? oldPrice * (1 + (sign * numericValue) / 100)
          : oldPrice + sign * numericValue
      return Math.max(0, Math.round(raw * 100) / 100)
    }

    const updatedProducts = await prisma.$transaction(
      matchingProducts.map((p) =>
        prisma.product.update({
          where: { id: p.id },
          data: { price: computePrice(p.price) },
        })
      )
    )

    await prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        actorEmail: req.user!.email,
        actionType: 'PRODUCTS_BULK_PRICE_UPDATED',
        entityType: 'Product',
        entityId: where.merchantId || 'all-merchants',
        newValues: JSON.stringify({
          mode,
          direction,
          value: numericValue,
          merchantId: where.merchantId || 'all',
          categoryId: categoryId || 'all',
          status: status || 'all',
          updatedCount: updatedProducts.length,
        }),
      },
    })

    const formatted = updatedProducts.map((p) => ({
      ...p,
      feeIds: p.feeIds ? (() => { try { return JSON.parse(p.feeIds) } catch { return [] } })() : [],
    }))

    res.json({ updatedCount: formatted.length, products: formatted })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
