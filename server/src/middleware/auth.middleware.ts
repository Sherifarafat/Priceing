import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-saas-jwt-key-2026-secure-random'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    username: string
    name: string
    role: string
    merchantId: string | null
    permissions?: Record<string, boolean>
  }
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string }
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        merchantId: true,
        status: true,
        permissions: true,
      },
    })

    if (!user || user.status !== 'Active') {
      return res.status(401).json({ error: 'Unauthorized: User not found or inactive' })
    }

    let parsedPermissions = {}
    if (user.permissions) {
      try {
        parsedPermissions = JSON.parse(user.permissions)
      } catch {}
    }

    req.user = {
      ...user,
      permissions: parsedPermissions,
    }
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' })
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    if (req.user.role === 'SUPER_ADMIN') {
      return next() // Super admin has global bypass
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges' })
    }
    next()
  }
}
