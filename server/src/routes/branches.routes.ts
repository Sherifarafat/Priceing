import { Router, Response } from 'express'
import crypto from 'crypto'
import { prisma } from '../lib/prisma.js'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.middleware.js'

const router = Router()

// Generate secure non-guessable token
function generateSecureQrToken(merchantId: string) {
  const randomHex = crypto.randomBytes(8).toString('hex')
  return `qr-${merchantId}-${randomHex}`
}

// GET /api/branches
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { merchantId } = req.query
    const where: any = {}

    if (req.user?.role !== 'SUPER_ADMIN') {
      where.merchantId = req.user?.merchantId
    } else if (merchantId && merchantId !== 'all') {
      where.merchantId = String(merchantId)
    }

    const branches = await prisma.branch.findMany({
      where,
      include: {
        merchant: {
          select: { id: true, name: true, logo: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(branches)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/branches (Super Admin only)
router.post('/', authenticate, requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    let { merchantId, name, address, imageUrl } = req.body
    if (!name) {
      return res.status(400).json({ error: 'Branch Name is required' })
    }

    if (!merchantId) {
      const firstMerchant = await prisma.merchant.findFirst()
      if (firstMerchant) {
        merchantId = firstMerchant.id
      } else {
        const defaultMerchant = await prisma.merchant.create({
          data: {
            name: 'Default Merchant',
            email: 'default@priceing.com',
            status: 'Active',
          },
        })
        merchantId = defaultMerchant.id
      }
    }

    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } })
    if (!merchant) return res.status(404).json({ error: 'Merchant not found' })

    const qrToken = generateSecureQrToken(merchantId)

    const branch = await prisma.branch.create({
      data: {
        merchantId,
        name: name.trim(),
        address: address?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        qrToken,
        qrStatus: 'Active',
      },
      include: {
        merchant: { select: { id: true, name: true } },
      },
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        actorEmail: req.user!.email,
        actionType: 'BRANCH_CREATED',
        entityType: 'Branch',
        entityId: branch.id,
        newValues: JSON.stringify(branch),
      },
    })

    res.status(201).json(branch)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/branches/:id
router.put('/:id', authenticate, requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const { name, address, imageUrl, qrStatus } = req.body
    const existing = await prisma.branch.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Branch not found' })

    const updated = await prisma.branch.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        address: address !== undefined ? address?.trim() : existing.address,
        imageUrl: imageUrl !== undefined ? imageUrl?.trim() : existing.imageUrl,
        qrStatus: qrStatus !== undefined ? qrStatus : existing.qrStatus,
      },
      include: {
        merchant: { select: { id: true, name: true } },
      },
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        actorEmail: req.user!.email,
        actionType: 'BRANCH_UPDATED',
        entityType: 'Branch',
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

// POST /api/branches/:id/regenerate-qr (Section 9.3)
router.post('/:id/regenerate-qr', authenticate, requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const branch = await prisma.branch.findUnique({ where: { id } })
    if (!branch) return res.status(404).json({ error: 'Branch not found' })

    const oldToken = branch.qrToken
    const newToken = generateSecureQrToken(branch.merchantId)

    const updated = await prisma.branch.update({
      where: { id },
      data: { qrToken: newToken },
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        actorEmail: req.user!.email,
        actionType: 'BRANCH_QR_REGENERATED',
        entityType: 'Branch',
        entityId: branch.id,
        oldValues: JSON.stringify({ qrToken: oldToken }),
        newValues: JSON.stringify({ qrToken: newToken }),
      },
    })

    res.json({
      message: 'QR Code regenerated. Old token invalidated immediately.',
      oldToken,
      newToken,
      branch: updated,
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/branches/:id
router.delete('/:id', authenticate, requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const existing = await prisma.branch.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Branch not found' })

    await prisma.branch.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        actorEmail: req.user!.email,
        actionType: 'BRANCH_DELETED',
        entityType: 'Branch',
        entityId: id,
        oldValues: JSON.stringify(existing),
      },
    })

    res.json({ message: 'Branch deleted successfully' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
