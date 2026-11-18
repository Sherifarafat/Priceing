import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-saas-jwt-key-2026-secure-random'

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' })
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: username.trim() }, { email: username.trim().toLowerCase() }],
      },
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }

    if (user.status !== 'Active') {
      return res.status(403).json({ error: 'Account is suspended or inactive' })
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })

    let permissions = {}
    if (user.permissions) {
      try {
        permissions = JSON.parse(user.permissions)
      } catch {}
    }

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        merchantId: user.merchantId,
        permissions,
      },
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, username, password, role, merchantId } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanUsername = (username || email.split('@')[0]).trim().toLowerCase()
    const displayName = (name || cleanUsername).trim()

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { username: cleanUsername }],
      },
    })

    if (existing) {
      return res.status(400).json({ error: 'User with this email or username already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        username: cleanUsername,
        password: hashedPassword,
        name: displayName,
        role: role || 'MERCHANT_MANAGER',
        merchantId: merchantId || null,
        status: 'Active',
      },
    })

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        merchantId: user.merchantId,
        status: user.status,
      },
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to register account' })
  }
})

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  res.json({ user: req.user })
})

// POST /api/auth/switch-demo-user
router.post('/switch-demo-user', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        merchantId: user.merchantId,
      },
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
