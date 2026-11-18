import { Router, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js'

const router = Router()

// =================== 1. SERVICE CATEGORIES ===================

// GET /api/services/categories
router.get('/categories', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { branchId } = req.query
    const where: any = {}

    if (branchId && branchId !== 'ALL') {
      where.OR = [{ branchId: String(branchId) }, { branchId: null }]
    }

    const categories = await prisma.serviceCategory.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true } },
        _count: { select: { services: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formatted = categories.map((c) => ({
      ...c,
      servicesCount: c._count.services,
    }))

    res.json(formatted)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/services/categories
router.post('/categories', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, branchId, status } = req.body
    if (!name) return res.status(400).json({ error: 'Name is required' })

    const category = await prisma.serviceCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        branchId: branchId || null,
        status: status || 'Active',
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

// PUT /api/services/categories/:id
router.put('/categories/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, branchId, status } = req.body
    const updated = await prisma.serviceCategory.update({
      where: { id: req.params.id as string },
      data: {
        name: name?.trim(),
        description: description !== undefined ? description?.trim() : undefined,
        branchId: branchId !== undefined ? branchId : undefined,
        status: status || undefined,
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

// DELETE /api/services/categories/:id
router.delete('/categories/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.serviceCategory.delete({ where: { id: req.params.id as string } })
    res.json({ message: 'Service Category deleted successfully' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// =================== 2. SERVICE ITEMS ===================

// GET /api/services
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId } = req.query
    const where: any = {}
    if (categoryId && categoryId !== 'ALL') {
      where.categoryId = String(categoryId)
    }

    const services = await prisma.serviceItem.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { subServices: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formatted = services.map((s) => ({
      ...s,
      subServicesCount: s._count.subServices,
    }))

    res.json(formatted)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/services
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId, name, description, status } = req.body
    if (!categoryId || !name) {
      return res.status(400).json({ error: 'Category and Name are required' })
    }

    const service = await prisma.serviceItem.create({
      data: {
        categoryId,
        name: name.trim(),
        description: description?.trim() || null,
        status: status || 'Active',
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    })

    res.status(201).json(service)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/services/:id
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, status, categoryId } = req.body
    const updated = await prisma.serviceItem.update({
      where: { id: req.params.id as string },
      data: {
        name: name?.trim(),
        description: description !== undefined ? description?.trim() : undefined,
        status: status || undefined,
        categoryId: categoryId || undefined,
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    })
    res.json(updated)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/services/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.serviceItem.delete({ where: { id: req.params.id as string } })
    res.json({ message: 'Service deleted successfully' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// =================== 3. SUB SERVICES ===================

// GET /api/services/sub-services
router.get('/sub-services', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const subServices = await prisma.subService.findMany({
      include: {
        service: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(subServices)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/services/sub-services
router.post('/sub-services', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { serviceId, name, price, description, status } = req.body
    if (!serviceId || !name) {
      return res.status(400).json({ error: 'Service ID and Name are required' })
    }

    const sub = await prisma.subService.create({
      data: {
        serviceId,
        name: name.trim(),
        price: parseFloat(price) || 0,
        description: description?.trim() || null,
        status: status || 'Active',
      },
      include: {
        service: { select: { id: true, name: true } },
      },
    })

    res.status(201).json(sub)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/services/sub-services/:id
router.put('/sub-services/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, price, description, status, serviceId } = req.body
    const updated = await prisma.subService.update({
      where: { id: req.params.id as string },
      data: {
        name: name?.trim(),
        price: price !== undefined ? parseFloat(price) : undefined,
        description: description !== undefined ? description?.trim() : undefined,
        status: status || undefined,
        serviceId: serviceId || undefined,
      },
      include: {
        service: { select: { id: true, name: true } },
      },
    })
    res.json(updated)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/services/sub-services/:id
router.delete('/sub-services/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.subService.delete({ where: { id: req.params.id as string } })
    res.json({ message: 'Sub-service deleted successfully' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// =================== 4. PRODUCT ADD-ONS ===================

// GET /api/services/add-ons
router.get('/add-ons', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const addons = await prisma.productAddon.findMany({
      orderBy: { createdAt: 'desc' },
    })
    res.json(addons)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/services/add-ons
router.post('/add-ons', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, categoryTag, price, applicableScope, status } = req.body
    if (!name || !categoryTag) {
      return res.status(400).json({ error: 'Name and Category Tag are required' })
    }

    const addon = await prisma.productAddon.create({
      data: {
        name: name.trim(),
        categoryTag: categoryTag.trim(),
        price: parseFloat(price) || 0,
        applicableScope: applicableScope || 'ALL',
        status: status || 'Active',
      },
    })

    res.status(201).json(addon)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/services/add-ons/:id
router.put('/add-ons/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, categoryTag, price, applicableScope, status } = req.body
    const updated = await prisma.productAddon.update({
      where: { id: req.params.id as string },
      data: {
        name: name?.trim(),
        categoryTag: categoryTag?.trim(),
        price: price !== undefined ? parseFloat(price) : undefined,
        applicableScope: applicableScope || undefined,
        status: status || undefined,
      },
    })
    res.json(updated)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/services/add-ons/:id
router.delete('/add-ons/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.productAddon.delete({ where: { id: req.params.id as string } })
    res.json({ message: 'Addon deleted successfully' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
