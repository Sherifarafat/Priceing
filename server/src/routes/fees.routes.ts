import { Router, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js'

const router = Router()

// GET /api/fees
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { merchantId } = req.query
    const where: any = {}

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (req.user?.merchantId) {
        where.OR = [
          { merchantId: req.user.merchantId },
          { merchantId: null },
        ]
      }
    } else if (merchantId && merchantId !== 'all') {
      where.OR = [
        { merchantId: String(merchantId) },
        { merchantId: null },
      ]
    }

    const fees = await prisma.fee.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    res.json(fees)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/fees
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, type = 'PERCENTAGE', value = 0, description, status = 'Active', merchantId } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Fee name is required' })
    }

    const fee = await prisma.fee.create({
      data: {
        name: name.trim(),
        type: type === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
        value: Number(value) || 0,
        description: description ? description.trim() : null,
        status: status || 'Active',
        merchantId: merchantId || (req.user?.role !== 'SUPER_ADMIN' ? req.user?.merchantId : null),
      },
    })

    res.status(201).json(fee)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/fees/:id
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, value, description, status, merchantId } = req.body

    const updated = await prisma.fee.update({
      where: { id: req.params.id as string },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        type: type !== undefined ? (type === 'FIXED' ? 'FIXED' : 'PERCENTAGE') : undefined,
        value: value !== undefined ? Number(value) : undefined,
        description: description !== undefined ? (description ? description.trim() : null) : undefined,
        status: status !== undefined ? status : undefined,
        merchantId: merchantId !== undefined ? merchantId : undefined,
      },
    })

    res.json(updated)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/fees/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.fee.delete({
      where: { id: req.params.id as string },
    })

    res.json({ success: true, message: 'Fee deleted successfully' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
