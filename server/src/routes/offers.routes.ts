import { Router, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js'

const router = Router()

function parseProductIds(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

function formatOffer(offer: any) {
  return {
    ...offer,
    productIds: parseProductIds(offer.productIds),
  }
}

// GET /api/offers
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { merchantId, isActive } = req.query
    const where: any = {}

    if (req.user?.role !== 'SUPER_ADMIN') {
      where.merchantId = req.user?.merchantId
    } else if (merchantId && merchantId !== 'all') {
      where.merchantId = String(merchantId)
    }

    if (isActive === 'true') where.isActive = true
    if (isActive === 'false') where.isActive = false

    const offers = await prisma.offer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    res.json(offers.map(formatOffer))
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/offers
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    let targetMerchantId =
      req.user?.role === 'SUPER_ADMIN'
        ? req.body.merchantId || req.user.merchantId
        : req.user?.merchantId

    if (!targetMerchantId) {
      const firstMerchant = await prisma.merchant.findFirst({ select: { id: true } })
      targetMerchantId = firstMerchant?.id
    }

    if (!targetMerchantId) {
      return res.status(400).json({ error: 'Merchant ID is required to create an offer.' })
    }

    const { title, description, discountType, discountValue, productIds, isActive } = req.body

    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Offer title is required.' })
    }

    const validType = discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE'
    const numericVal = Number(discountValue)
    if (!Number.isFinite(numericVal) || numericVal <= 0) {
      return res.status(400).json({ error: 'Discount value must be greater than zero.' })
    }
    if (validType === 'PERCENTAGE' && numericVal > 100) {
      return res.status(400).json({ error: 'Percentage discount cannot exceed 100%.' })
    }

    const normalizedProductIds = Array.isArray(productIds)
      ? Array.from(new Set(productIds.map((id) => String(id))))
      : []

    const created = await prisma.offer.create({
      data: {
        merchantId: targetMerchantId,
        title: String(title).trim(),
        description: description ? String(description).trim() : null,
        discountType: validType,
        discountValue: numericVal,
        productIds: JSON.stringify(normalizedProductIds),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        actorEmail: req.user!.email,
        actionType: 'OFFER_CREATED',
        entityType: 'Offer',
        entityId: created.id,
        newValues: JSON.stringify(formatOffer(created)),
      },
    })

    res.status(201).json(formatOffer(created))
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/offers/:id/toggle
router.put('/:id/toggle', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const existing = await prisma.offer.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Offer not found' })

    if (req.user?.role !== 'SUPER_ADMIN' && existing.merchantId !== req.user?.merchantId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const nextActive =
      req.body?.isActive !== undefined ? Boolean(req.body.isActive) : !existing.isActive

    const updated = await prisma.offer.update({
      where: { id },
      data: { isActive: nextActive },
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        actorEmail: req.user!.email,
        actionType: nextActive ? 'OFFER_ACTIVATED' : 'OFFER_DEACTIVATED',
        entityType: 'Offer',
        entityId: id,
        oldValues: JSON.stringify({ isActive: existing.isActive }),
        newValues: JSON.stringify({ isActive: nextActive }),
      },
    })

    res.json(formatOffer(updated))
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/offers/:id
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const existing = await prisma.offer.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Offer not found' })

    if (req.user?.role !== 'SUPER_ADMIN' && existing.merchantId !== req.user?.merchantId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const { title, description, discountType, discountValue, productIds, isActive } = req.body

    const nextType =
      discountType !== undefined
        ? discountType === 'FIXED'
          ? 'FIXED'
          : 'PERCENTAGE'
        : existing.discountType

    const nextValue =
      discountValue !== undefined ? Number(discountValue) : existing.discountValue

    if (!Number.isFinite(nextValue) || nextValue <= 0) {
      return res.status(400).json({ error: 'Discount value must be greater than zero.' })
    }
    if (nextType === 'PERCENTAGE' && nextValue > 100) {
      return res.status(400).json({ error: 'Percentage discount cannot exceed 100%.' })
    }

    const updated = await prisma.offer.update({
      where: { id },
      data: {
        title: title !== undefined ? String(title).trim() : existing.title,
        description:
          description !== undefined
            ? description
              ? String(description).trim()
              : null
            : existing.description,
        discountType: nextType,
        discountValue: nextValue,
        productIds:
          productIds !== undefined
            ? JSON.stringify(
                Array.isArray(productIds)
                  ? Array.from(new Set(productIds.map((pid) => String(pid))))
                  : []
              )
            : existing.productIds,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
      },
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        actorEmail: req.user!.email,
        actionType: 'OFFER_UPDATED',
        entityType: 'Offer',
        entityId: id,
        oldValues: JSON.stringify(formatOffer(existing)),
        newValues: JSON.stringify(formatOffer(updated)),
      },
    })

    res.json(formatOffer(updated))
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/offers/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const existing = await prisma.offer.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Offer not found' })

    if (req.user?.role !== 'SUPER_ADMIN' && existing.merchantId !== req.user?.merchantId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    await prisma.offer.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        actorEmail: req.user!.email,
        actionType: 'OFFER_DELETED',
        entityType: 'Offer',
        entityId: id,
        oldValues: JSON.stringify(formatOffer(existing)),
      },
    })

    res.json({ message: 'Offer deleted successfully' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
