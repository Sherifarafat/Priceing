import { Router, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js'

const router = Router()

// GET /api/invoices/template
router.get('/template', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    let merchantId = req.query.merchantId as string
    if (req.user?.role !== 'SUPER_ADMIN') {
      merchantId = req.user?.merchantId || ''
    }

    if (!merchantId) {
      const firstMerchant = await prisma.merchant.findFirst()
      if (firstMerchant) merchantId = firstMerchant.id
    }

    if (!merchantId) {
      return res.status(404).json({ error: 'No merchant found' })
    }

    let template = await prisma.invoiceTemplate.findUnique({
      where: { merchantId },
    })

    if (!template) {
      const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } })
      template = await prisma.invoiceTemplate.create({
        data: {
          merchantId,
          businessName: merchant?.name || 'My Store',
          logoUrl: merchant?.logo || null,
          layoutStyle: 'MODERN',
          primaryColor: '#4F46E5',
          accentColor: '#10B981',
          headerNotice: 'Thank you for shopping with us!',
          footerNotice: 'Goods once sold can be returned or exchanged within 14 days with original receipt.',
          taxNumber: '300012345678901',
          commercialReg: '1010203040',
          showLogo: true,
          showQrCode: true,
          showTaxDetails: true,
          showBranchInfo: true,
          showCashierName: true,
          paperSize: 'A4',
        },
      })
    }

    res.json(template)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/invoices/template
router.put('/template', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    let merchantId = req.body.merchantId
    if (req.user?.role !== 'SUPER_ADMIN' || !merchantId) {
      merchantId = req.user?.merchantId
    }

    if (!merchantId) {
      const firstMerchant = await prisma.merchant.findFirst()
      if (firstMerchant) merchantId = firstMerchant.id
    }

    if (!merchantId) {
      return res.status(400).json({ error: 'Merchant is required' })
    }

    const {
      templateName,
      layoutStyle,
      primaryColor,
      accentColor,
      businessName,
      logoUrl,
      showLogo,
      taxNumber,
      commercialReg,
      headerNotice,
      footerNotice,
      showQrCode,
      showTaxDetails,
      showBranchInfo,
      showCashierName,
      paperSize,
    } = req.body

    const template = await prisma.invoiceTemplate.upsert({
      where: { merchantId },
      create: {
        merchantId,
        templateName: templateName || 'Standard Invoice',
        layoutStyle: layoutStyle || 'MODERN',
        primaryColor: primaryColor || '#4F46E5',
        accentColor: accentColor || '#10B981',
        businessName: businessName || null,
        logoUrl: logoUrl !== undefined ? logoUrl : null,
        showLogo: showLogo !== undefined ? Boolean(showLogo) : true,
        taxNumber: taxNumber || null,
        commercialReg: commercialReg || null,
        headerNotice: headerNotice || null,
        footerNotice: footerNotice || null,
        showQrCode: showQrCode !== undefined ? Boolean(showQrCode) : true,
        showTaxDetails: showTaxDetails !== undefined ? Boolean(showTaxDetails) : true,
        showBranchInfo: showBranchInfo !== undefined ? Boolean(showBranchInfo) : true,
        showCashierName: showCashierName !== undefined ? Boolean(showCashierName) : true,
        paperSize: paperSize || 'A4',
      },
      update: {
        templateName: templateName !== undefined ? templateName : undefined,
        layoutStyle: layoutStyle !== undefined ? layoutStyle : undefined,
        primaryColor: primaryColor !== undefined ? primaryColor : undefined,
        accentColor: accentColor !== undefined ? accentColor : undefined,
        businessName: businessName !== undefined ? businessName : undefined,
        logoUrl: logoUrl !== undefined ? logoUrl : undefined,
        showLogo: showLogo !== undefined ? Boolean(showLogo) : undefined,
        taxNumber: taxNumber !== undefined ? taxNumber : undefined,
        commercialReg: commercialReg !== undefined ? commercialReg : undefined,
        headerNotice: headerNotice !== undefined ? headerNotice : undefined,
        footerNotice: footerNotice !== undefined ? footerNotice : undefined,
        showQrCode: showQrCode !== undefined ? Boolean(showQrCode) : undefined,
        showTaxDetails: showTaxDetails !== undefined ? Boolean(showTaxDetails) : undefined,
        showBranchInfo: showBranchInfo !== undefined ? Boolean(showBranchInfo) : undefined,
        showCashierName: showCashierName !== undefined ? Boolean(showCashierName) : undefined,
        paperSize: paperSize !== undefined ? paperSize : undefined,
      },
    })

    res.json(template)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/invoices (List issued invoices)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { merchantId, branchId, status, search } = req.query
    const where: any = {}

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (req.user?.merchantId) {
        where.merchantId = req.user.merchantId
      }
    } else if (merchantId && merchantId !== 'all') {
      where.merchantId = String(merchantId)
    }

    if (branchId && branchId !== 'all') {
      where.branchId = String(branchId)
    }

    if (status && status !== 'all') {
      where.status = String(status)
    }

    if (search) {
      const q = String(search).trim()
      where.OR = [
        { invoiceNumber: { contains: q } },
        { customerName: { contains: q } },
        { customerPhone: { contains: q } },
      ]
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        merchant: { select: { id: true, name: true, logo: true } },
        branch: { select: { id: true, name: true, address: true } },
        items: true,
      },
      orderBy: { issuedAt: 'desc' },
    })

    res.json(invoices)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/invoices/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id as string },
      include: {
        merchant: {
          include: {
            invoiceTemplate: true,
          },
        },
        branch: true,
        items: true,
      },
    })

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })

    res.json(invoice)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/invoices (Issue new invoice)
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    let targetMerchantId = req.user?.role === 'SUPER_ADMIN' ? (req.body.merchantId || req.user.merchantId) : req.user?.merchantId
    if (!targetMerchantId) {
      const firstMerchant = await prisma.merchant.findFirst()
      if (firstMerchant) targetMerchantId = firstMerchant.id
    }

    if (!targetMerchantId) {
      return res.status(400).json({ error: 'Merchant is required' })
    }

    const {
      branchId,
      customerName,
      customerPhone,
      customerTaxNo,
      paymentMethod = 'CASH',
      status = 'PAID',
      subtotal = 0,
      taxTotal = 0,
      feesTotal = 0,
      discountTotal = 0,
      grandTotal = 0,
      appliedFees,
      notes,
      items = [],
    } = req.body

    // Generate unique invoice number: INV-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const count = await prisma.invoice.count()
    const invoiceNumber = `INV-${dateStr}-${String(count + 1).padStart(4, '0')}`

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        merchantId: targetMerchantId,
        branchId: branchId || null,
        customerName: customerName ? customerName.trim() : null,
        customerPhone: customerPhone ? customerPhone.trim() : null,
        customerTaxNo: customerTaxNo ? customerTaxNo.trim() : null,
        paymentMethod: paymentMethod || 'CASH',
        status: status || 'PAID',
        subtotal: Number(subtotal) || 0,
        taxTotal: Number(taxTotal) || 0,
        feesTotal: Number(feesTotal) || 0,
        discountTotal: Number(discountTotal) || 0,
        grandTotal: Number(grandTotal) || 0,
        appliedFees: appliedFees ? (typeof appliedFees === 'string' ? appliedFees : JSON.stringify(appliedFees)) : null,
        notes: notes ? notes.trim() : null,
        items: {
          create: items.map((it: any) => ({
            productId: it.productId || null,
            productName: it.productName || 'Product',
            barcode: it.barcode || null,
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unitPrice) || 0,
            totalPrice: Number(it.totalPrice) || 0,
            feeIds: it.feeIds ? JSON.stringify(it.feeIds) : null,
          })),
        },
      },
      include: {
        merchant: { select: { id: true, name: true, logo: true } },
        branch: { select: { id: true, name: true, address: true } },
        items: true,
      },
    })

    res.status(201).json(invoice)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/invoices/:id/status
router.put('/:id/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body
    if (!status) return res.status(400).json({ error: 'Status is required' })

    const updated = await prisma.invoice.update({
      where: { id: req.params.id as string },
      data: { status },
      include: {
        merchant: { select: { id: true, name: true, logo: true } },
        branch: { select: { id: true, name: true, address: true } },
        items: true,
      },
    })

    res.json(updated)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/invoices/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.invoice.delete({
      where: { id: req.params.id as string },
    })

    res.json({ success: true, message: 'Invoice deleted successfully' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
