import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.middleware.js'

const router = Router()

function parseFeatures(raw?: string | null): Record<string, boolean> | undefined {
  if (!raw) return undefined
  if (typeof raw === 'object') return raw as Record<string, boolean>
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

// GET /api/merchants
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const merchants = await prisma.merchant.findMany({
      include: {
        _count: {
          select: { branches: true, products: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Self-healing: Ensure every merchant has a dedicated MERCHANT_MANAGER account
    for (const m of merchants) {
      try {
        const hasManager = await prisma.user.findFirst({
          where: { merchantId: m.id, role: 'MERCHANT_MANAGER' },
        })
        if (!hasManager) {
          const baseUsername = m.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'merchant'
          const existingUsername = await prisma.user.findFirst({ where: { username: baseUsername } })
          const finalUsername = existingUsername ? `${baseUsername}_${m.id.slice(-4)}` : baseUsername

          const cleanEmail = m.email.toLowerCase().trim()
          const existingEmail = await prisma.user.findFirst({ where: { email: cleanEmail } })
          const finalEmail = existingEmail ? `manager_${finalUsername}@store.local` : cleanEmail

          const hashedPassword = await bcrypt.hash('123456', 10)
          await prisma.user.create({
            data: {
              name: `${m.name} Manager`,
              username: finalUsername,
              email: finalEmail,
              password: hashedPassword,
              role: 'MERCHANT_MANAGER',
              merchantId: m.id,
              status: 'Active',
            },
          })
          console.log(`[Auto-Heal] Provisioned manager account '${finalUsername}' for merchant '${m.name}'`)
        }
      } catch (err: any) {
        console.warn(`[Auto-Heal] Error creating manager for merchant ${m.id}:`, err.message)
      }
    }

    const formatted = merchants.map((m) => ({
      ...m,
      features: parseFeatures((m as any).features),
      branchesCount: m._count.branches,
      productsCount: m._count.products,
    }))

    res.json(formatted)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/merchants/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const merchant = await prisma.merchant.findUnique({
      where: { id },
      include: {
        branches: true,
        _count: { select: { products: true, users: true } },
      },
    })
    if (!merchant) return res.status(404).json({ error: 'Merchant not found' })
    res.json({
      ...merchant,
      features: parseFeatures((merchant as any).features),
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/merchants (Super Admin only)
router.post('/', authenticate, requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, address, logo, status, features } = req.body
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' })
    }

    const serializedFeatures =
      features !== undefined
        ? typeof features === 'string'
          ? features
          : JSON.stringify(features)
        : null

    const merchant = await prisma.merchant.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone || null,
        address: address || null,
        logo: logo || null,
        status: status || 'Active',
        features: serializedFeatures,
      },
    })

    // Automatically provision Store Owner / Manager account
    const cleanEmail = email.trim().toLowerCase()
    const baseUsername = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || 'merchant'
    const existingUser = await prisma.user.findFirst({ where: { username: baseUsername } })
    const mgrUsername = existingUser ? `${baseUsername}_${merchant.id.slice(-4)}` : baseUsername

    const existingEmail = await prisma.user.findFirst({ where: { email: cleanEmail } })
    const mgrEmail = existingEmail ? `manager_${mgrUsername}@store.local` : cleanEmail

    const hashedPassword = await bcrypt.hash('123456', 10)
    let managerUser: any = null
    try {
      managerUser = await prisma.user.create({
        data: {
          name: `${merchant.name} Manager`,
          username: mgrUsername,
          email: mgrEmail,
          password: hashedPassword,
          role: 'MERCHANT_MANAGER',
          merchantId: merchant.id,
          status: 'Active',
        },
      })
    } catch (e: any) {
      console.warn('Could not auto-create manager in DB:', e.message)
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        actorEmail: req.user!.email,
        actionType: 'MERCHANT_CREATED',
        entityType: 'Merchant',
        entityId: merchant.id,
        newValues: JSON.stringify(merchant),
      },
    })

    res.status(201).json({
      ...merchant,
      features: parseFeatures((merchant as any).features),
      managerUser: {
        id: managerUser?.id,
        username: mgrUsername,
        password: '123456',
        email: mgrEmail,
        name: `${merchant.name} Manager`,
      },
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/merchants/:id
router.put('/:id', authenticate, requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const { name, email, phone, address, logo, status, features } = req.body
    const existing = await prisma.merchant.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Merchant not found' })

    const serializedFeatures =
      features !== undefined
        ? features === null
          ? null
          : typeof features === 'string'
            ? features
            : JSON.stringify(features)
        : (existing as any).features

    const updated = await prisma.merchant.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        email: email !== undefined ? email.trim().toLowerCase() : existing.email,
        phone: phone !== undefined ? phone : existing.phone,
        address: address !== undefined ? address : existing.address,
        logo: logo !== undefined ? logo : existing.logo,
        status: status !== undefined ? status : existing.status,
        features: serializedFeatures,
      },
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        actorEmail: req.user!.email,
        actionType: 'MERCHANT_UPDATED',
        entityType: 'Merchant',
        entityId: updated.id,
        oldValues: JSON.stringify(existing),
        newValues: JSON.stringify(updated),
      },
    })

    res.json({
      ...updated,
      features: parseFeatures((updated as any).features),
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/merchants/:id
router.delete('/:id', authenticate, requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const existing = await prisma.merchant.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Merchant not found' })

    await prisma.merchant.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        actorEmail: req.user!.email,
        actionType: 'MERCHANT_DELETED',
        entityType: 'Merchant',
        entityId: id,
        oldValues: JSON.stringify(existing),
      },
    })

    res.json({ message: 'Merchant deleted successfully' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
