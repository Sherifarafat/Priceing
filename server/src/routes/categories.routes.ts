import { Router, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js'

const router = Router()

// GET /api/categories
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { branchId, merchantId } = req.query
    const where: any = {}

    if (req.user?.role !== 'SUPER_ADMIN') {
      where.merchantId = req.user?.merchantId
    } else if (merchantId && merchantId !== 'all') {
      where.merchantId = String(merchantId)
    }

    if (branchId && branchId !== 'ALL') {
      where.OR = [{ branchId: String(branchId) }, { branchId: null }]
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true } },
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formatted = categories.map((c) => ({
      ...c,
      productsCount: c._count.products,
    }))

    res.json(formatted)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/categories
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const targetMerchantId = req.user?.role === 'SUPER_ADMIN' ? (req.body.merchantId || req.user.merchantId) : req.user?.merchantId
    const { name, branchId } = req.body

    if (!name) return res.status(400).json({ error: 'Category name is required' })

    const category = await prisma.category.create({
      data: {
        merchantId: targetMerchantId,
        name: name.trim(),
        branchId: branchId || null,
      },
      include: {
        branch: { select: { id: true, name: true } },
      },
    })

    res.status(201).json(category)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/categories/:id
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, branchId } = req.body
    const updated = await prisma.category.update({
      where: { id: req.params.id as string },
      data: {
        name: name?.trim(),
        branchId: branchId !== undefined ? branchId : undefined,
      },
      include: {
        branch: { select: { id: true, name: true } },
      },
    })
    res.json(updated)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/categories/:id (Section 8.2: sets products' categoryId to null)
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.product.updateMany({
      where: { categoryId: req.params.id as string },
      data: { categoryId: null },
    })
    await prisma.category.delete({ where: { id: req.params.id as string } })
    res.json({ message: 'Category deleted and products uncategorized successfully' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
