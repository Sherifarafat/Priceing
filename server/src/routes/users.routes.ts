import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js'

const router = Router()

// GET /api/users
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        merchantId: true,
        status: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
        merchant: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formatted = users.map((u) => {
      let perms = {}
      if (u.permissions) {
        try {
          perms = JSON.parse(u.permissions)
        } catch {}
      }
      return {
        ...u,
        permissions: perms,
      }
    })

    res.json(formatted)
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch users' })
  }
})

// POST /api/users
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, username, password, role, merchantId, status, permissions } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanUsername = (username || email.split('@')[0]).trim().toLowerCase()
    const displayName = (name || cleanUsername).trim()

    // Check duplicate email or username
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { username: cleanUsername }],
      },
    })

    if (existing) {
      return res.status(400).json({ error: 'User with this email or username already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        email: cleanEmail,
        username: cleanUsername,
        password: hashedPassword,
        name: displayName,
        role: role || 'MERCHANT_STAFF',
        merchantId: merchantId || null,
        status: status || 'Active',
        permissions: permissions ? JSON.stringify(permissions) : null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        merchantId: true,
        status: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    res.status(201).json(newUser)
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create user' })
  }
})

// PUT /api/users/:id
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { name, email, username, password, role, merchantId, status, permissions } = req.body

    const updateData: any = {}
    if (name) updateData.name = name.trim()
    if (email) updateData.email = email.trim().toLowerCase()
    if (username) updateData.username = username.trim().toLowerCase()
    if (role) updateData.role = role
    if (merchantId !== undefined) updateData.merchantId = merchantId || null
    if (status) updateData.status = status
    if (permissions !== undefined) {
      updateData.permissions = typeof permissions === 'object' ? JSON.stringify(permissions) : permissions
    }
    if (password && password.trim().length > 0) {
      updateData.password = await bcrypt.hash(password.trim(), 10)
    }

    const updated = await prisma.user.update({
      where: { id: id as string },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        merchantId: true,
        status: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    res.json(updated)
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update user' })
  }
})

// DELETE /api/users/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    // Find by ID, username, or email to guarantee deletion even across different id formats
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: id as string },
          { username: id as string },
          { email: id as string },
        ],
      },
    })

    if (!user) {
      return res.json({ message: 'User not found or already deleted' })
    }

    await prisma.user.delete({ where: { id: user.id } })
    res.json({ message: 'User deleted successfully' })
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete user' })
  }
})

export default router
