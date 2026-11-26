import fs from 'fs'
import path from 'path'
import { Router, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js'

const router = Router()

interface ReturnPinRecord {
  requireManagerPin: boolean
  managerPin: string
}

const DEFAULT_MANAGER_PIN = '0000'
const PINS_FILE = path.resolve(process.cwd(), 'return-pins.json')

function readReturnPins(): Record<string, ReturnPinRecord> {
  try {
    if (fs.existsSync(PINS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(PINS_FILE, 'utf-8'))
      if (parsed && typeof parsed === 'object') return parsed
    }
  } catch {
    // ignore corrupt file
  }
  return {}
}

function getMerchantPinConfig(merchantId: string): ReturnPinRecord {
  const all = readReturnPins()
  const rec = all[merchantId]
  return {
    requireManagerPin: rec?.requireManagerPin !== false,
    managerPin:
      rec?.managerPin && /^\d{4,6}$/.test(rec.managerPin) ? rec.managerPin : DEFAULT_MANAGER_PIN,
  }
}

function saveMerchantPinConfig(merchantId: string, next: Partial<ReturnPinRecord>): ReturnPinRecord {
  const all = readReturnPins()
  const current = getMerchantPinConfig(merchantId)
  const cleanPin =
    typeof next.managerPin === 'string' && /^\d{4,6}$/.test(next.managerPin.trim())
      ? next.managerPin.trim()
      : current.managerPin
  const updated: ReturnPinRecord = {
    requireManagerPin:
      typeof next.requireManagerPin === 'boolean'
        ? next.requireManagerPin
        : current.requireManagerPin,
    managerPin: cleanPin,
  }
  all[merchantId] = updated
  fs.writeFileSync(PINS_FILE, JSON.stringify(all, null, 2), 'utf-8')
  return updated
}

// GET /api/invoices/public/latest
// Public read-only endpoint so customer phones / receipt display screens can open receipt links without login
router.get('/public/latest', async (req, res: Response) => {
  try {
    const id = req.query.id ? String(req.query.id).trim() : ''
    const merchantId = req.query.merchantId ? String(req.query.merchantId).trim() : ''
    const branchId = req.query.branchId ? String(req.query.branchId).trim() : ''

    let invoice = null

    if (id && id !== 'live' && id !== 'current') {
      invoice = await prisma.invoice.findFirst({
        where: { OR: [{ id }, { invoiceNumber: id }] },
        include: {
          merchant: { include: { invoiceTemplate: true } },
          branch: true,
          items: true,
        },
      })
    }

    if (!invoice) {
      const where: any = {}
      if (merchantId) where.merchantId = merchantId
      if (branchId) where.branchId = branchId
      invoice = await prisma.invoice.findFirst({
        where,
        orderBy: { issuedAt: 'desc' },
        include: {
          merchant: { include: { invoiceTemplate: true } },
          branch: true,
          items: true,
        },
      })
    }

    const resolvedMerchantId = invoice?.merchantId || merchantId
    const merchant =
      invoice?.merchant ||
      (resolvedMerchantId
        ? await prisma.merchant.findUnique({
            where: { id: resolvedMerchantId },
            include: { invoiceTemplate: true },
          })
        : null)

    const resolvedBranchId = invoice?.branchId || branchId
    const branch =
      invoice?.branch ||
      (resolvedBranchId
        ? await prisma.branch.findUnique({ where: { id: resolvedBranchId } })
        : null)

    res.json({
      invoice,
      merchant,
      branch,
      template: merchant?.invoiceTemplate || null,
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

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
      fontFamily,
      headerStyle,
      tableStyle,
      borderRadius,
      watermarkText,
      showWatermark,
      qrPosition,
      showBarcode,
      currencyPosition,
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
        fontFamily: fontFamily || 'sans',
        headerStyle: headerStyle || 'BORDER_TOP',
        tableStyle: tableStyle || 'STRIPED',
        borderRadius: borderRadius || 'ROUNDED_MD',
        watermarkText: watermarkText || null,
        showWatermark: showWatermark !== undefined ? Boolean(showWatermark) : false,
        qrPosition: qrPosition || 'FOOTER_RIGHT',
        showBarcode: showBarcode !== undefined ? Boolean(showBarcode) : true,
        currencyPosition: currencyPosition || 'AFTER',
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
        fontFamily: fontFamily !== undefined ? fontFamily : undefined,
        headerStyle: headerStyle !== undefined ? headerStyle : undefined,
        tableStyle: tableStyle !== undefined ? tableStyle : undefined,
        borderRadius: borderRadius !== undefined ? borderRadius : undefined,
        watermarkText: watermarkText !== undefined ? watermarkText : undefined,
        showWatermark: showWatermark !== undefined ? Boolean(showWatermark) : undefined,
        qrPosition: qrPosition !== undefined ? qrPosition : undefined,
        showBarcode: showBarcode !== undefined ? Boolean(showBarcode) : undefined,
        currencyPosition: currencyPosition !== undefined ? currencyPosition : undefined,
      },
    })

    res.json(template)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/invoices/return-policy
router.get('/return-policy', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    let merchantId = req.query.merchantId as string | undefined
    if (req.user?.role !== 'SUPER_ADMIN') {
      merchantId = req.user?.merchantId || undefined
    }
    if (!merchantId || merchantId === 'all') {
      const firstMerchant = await prisma.merchant.findFirst()
      merchantId = firstMerchant?.id
    }
    if (!merchantId) {
      return res.json({
        merchantId: null,
        returnPolicyDays: 14,
        allowPartialReturn: true,
        returnPolicyNotes: 'يمكن الاسترجاع خلال 14 يوماً من تاريخ الفاتورة.',
        requireManagerPin: true,
        isDefaultPin: true,
      })
    }

    const template = await prisma.invoiceTemplate.findUnique({
      where: { merchantId },
      select: {
        merchantId: true,
        returnPolicyDays: true,
        allowPartialReturn: true,
        returnPolicyNotes: true,
      },
    })

    const pinCfg = getMerchantPinConfig(merchantId)
    const canViewPin =
      req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'MERCHANT_MANAGER'

    res.json({
      merchantId,
      returnPolicyDays: template?.returnPolicyDays ?? 14,
      allowPartialReturn: template?.allowPartialReturn ?? true,
      returnPolicyNotes:
        template?.returnPolicyNotes ??
        'يمكن استرجاع المنتجات خلال المدة المحددة بالفاتورة الأصلية وبحالتها.',
      requireManagerPin: pinCfg.requireManagerPin,
      isDefaultPin: pinCfg.managerPin === DEFAULT_MANAGER_PIN,
      ...(canViewPin ? { managerPin: pinCfg.managerPin } : {}),
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/invoices/return-policy
router.put('/return-policy', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    let merchantId = req.body?.merchantId as string | undefined
    if (req.user?.role !== 'SUPER_ADMIN' || !merchantId || merchantId === 'all') {
      merchantId = req.user?.merchantId || merchantId
    }
    if (!merchantId || merchantId === 'all') {
      const firstMerchant = await prisma.merchant.findFirst()
      merchantId = firstMerchant?.id
    }
    if (!merchantId) {
      return res.status(400).json({ error: 'Merchant is required' })
    }

    const rawDays = Number(req.body?.returnPolicyDays)
    const returnPolicyDays = Number.isFinite(rawDays)
      ? Math.max(0, Math.min(365, Math.floor(rawDays)))
      : 14
    const allowPartialReturn = req.body?.allowPartialReturn !== false
    const returnPolicyNotes =
      typeof req.body?.returnPolicyNotes === 'string'
        ? req.body.returnPolicyNotes.trim().slice(0, 500)
        : null

    const rawPin = typeof req.body?.managerPin === 'string' ? req.body.managerPin.trim() : ''
    if (rawPin && !/^\d{4,6}$/.test(rawPin)) {
      return res.status(400).json({
        error: 'الرقم السري لمدير الفرع يجب أن يتكون من 4 إلى 6 أرقام فقط',
      })
    }

    const pinCfg = saveMerchantPinConfig(merchantId, {
      requireManagerPin:
        typeof req.body?.requireManagerPin === 'boolean'
          ? req.body.requireManagerPin
          : undefined,
      managerPin: rawPin || undefined,
    })

    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } })
    const template = await prisma.invoiceTemplate.upsert({
      where: { merchantId },
      create: {
        merchantId,
        businessName: merchant?.name || 'My Store',
        returnPolicyDays,
        allowPartialReturn,
        returnPolicyNotes,
      },
      update: {
        returnPolicyDays,
        allowPartialReturn,
        returnPolicyNotes,
      },
      select: {
        merchantId: true,
        returnPolicyDays: true,
        allowPartialReturn: true,
        returnPolicyNotes: true,
      },
    })

    res.json({
      ...template,
      requireManagerPin: pinCfg.requireManagerPin,
      isDefaultPin: pinCfg.managerPin === DEFAULT_MANAGER_PIN,
      managerPin: pinCfg.managerPin,
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/invoices/verify-return-pin — Verify Branch Manager PIN before unlocking POS Returns
router.post('/verify-return-pin', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    let merchantId = req.body?.merchantId as string | undefined
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.merchantId) {
      merchantId = req.user.merchantId
    }
    if (!merchantId || merchantId === 'all') {
      const firstMerchant = await prisma.merchant.findFirst()
      merchantId = firstMerchant?.id
    }
    if (!merchantId) {
      return res.status(400).json({ error: 'Merchant is required' })
    }

    const enteredPin = String(req.body?.pin || '').trim()
    if (!enteredPin) {
      return res.status(400).json({ error: 'يرجى إدخال الرقم السري لمدير الفرع' })
    }

    const pinCfg = getMerchantPinConfig(merchantId)
    if (!pinCfg.requireManagerPin) {
      return res.json({ valid: true })
    }

    if (enteredPin === pinCfg.managerPin) {
      return res.json({ valid: true })
    }

    return res.status(401).json({
      valid: false,
      error: 'الرقم السري لمدير الفرع غير صحيح',
    })
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

// POST /api/invoices/:id/return — Full or Partial Invoice Return with Merchant Return Policy Enforcement
router.post('/:id/return', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const invoiceId = req.params.id as string
    const { items: returnItems, reason, restock = true } = req.body || {}

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
        merchant: {
          include: { invoiceTemplate: true },
        },
        branch: true,
      },
    })

    if (!invoice) {
      return res.status(404).json({ error: 'الفاتورة غير موجودة / Invoice not found' })
    }

    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.merchantId && invoice.merchantId !== req.user.merchantId) {
      return res.status(403).json({ error: 'غير مصرح لك بإرجاع هذه الفاتورة' })
    }

    if (invoice.status === 'CANCELLED') {
      return res.status(400).json({ error: 'لا يمكن عمل مرتجع لفاتورة ملغاة' })
    }
    if (invoice.status === 'REFUNDED') {
      return res.status(400).json({ error: 'تم إرجاع هذه الفاتورة بالكامل مسبقاً' })
    }

    // 1. Enforce Merchant Return Policy Window
    const policyDays = invoice.merchant?.invoiceTemplate?.returnPolicyDays ?? 14
    const allowPartial = invoice.merchant?.invoiceTemplate?.allowPartialReturn ?? true

    const issuedDate = new Date(invoice.issuedAt || invoice.createdAt)
    const elapsedMs = Date.now() - issuedDate.getTime()
    const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24))

    if (policyDays === 0) {
      return res.status(400).json({
        error: 'سياسة هذا المتجر لا تسمح بالمرتجعات حالياً (0 يوم). يمكنك تعديلها من قسم الفواتير المصدرة.',
      })
    }

    if (elapsedDays > policyDays) {
      return res.status(400).json({
        error: `تجاوزت هذه الفاتورة المدة المسموح بها للمرتجع (${policyDays} يوم — مرّ عليها ${elapsedDays} يوم).`,
      })
    }

    // 2. Validate requested return items (or default to full remaining return if items omitted)
    const requestedMap = new Map<string, number>()
    if (Array.isArray(returnItems) && returnItems.length > 0) {
      for (const entry of returnItems) {
        const itemId = String(entry?.itemId || '')
        const qty = Math.floor(Number(entry?.quantity || 0))
        if (!itemId || qty <= 0) continue
        requestedMap.set(itemId, (requestedMap.get(itemId) || 0) + qty)
      }
    } else {
      for (const it of invoice.items) {
        const rem = Math.max(0, it.quantity - (it.returnedQty || 0))
        if (rem > 0) requestedMap.set(it.id, rem)
      }
    }

    if (requestedMap.size === 0) {
      return res.status(400).json({ error: 'يرجى تحديد صنف واحد على الأقل بكمية صحيحة للاسترجاع' })
    }

    // Check quantities against remaining returnable quantities
    let totalRemainingBefore = 0
    let totalRequestedQty = 0
    let returnedSubtotal = 0

    const updatesToApply: { item: (typeof invoice.items)[number]; qty: number }[] = []

    for (const it of invoice.items) {
      const rem = Math.max(0, it.quantity - (it.returnedQty || 0))
      totalRemainingBefore += rem
      const reqQty = requestedMap.get(it.id) || 0
      if (reqQty > 0) {
        if (reqQty > rem) {
          return res.status(400).json({
            error: `الكمية المطلوبة لإرجاع "${it.productName}" (${reqQty}) تتجاوز المتبقي (${rem})`,
          })
        }
        totalRequestedQty += reqQty
        returnedSubtotal += reqQty * Number(it.unitPrice || 0)
        updatesToApply.push({ item: it, qty: reqQty })
      }
    }

    if (totalRequestedQty <= 0) {
      return res.status(400).json({ error: 'لا توجد أصناف صالحة للإرجاع في هذه الفاتورة' })
    }

    const willBeFullReturn = totalRequestedQty >= totalRemainingBefore

    if (!allowPartial && !willBeFullReturn) {
      return res.status(400).json({
        error: 'سياسة المتجر لا تسمح بالمرتجع الجزئي — يجب استرجاع الفاتورة بالكامل.',
      })
    }

    // Compute exact proportional refund (including tax/fees ratio)
    const remainingGrandBefore = Math.max(0, Number(invoice.grandTotal || 0) - Number(invoice.refundedTotal || 0))
    let refundAmount = 0
    if (willBeFullReturn) {
      refundAmount = Math.round(remainingGrandBefore * 100) / 100
    } else {
      const ratio = invoice.subtotal > 0 ? Number(invoice.grandTotal || 0) / Number(invoice.subtotal) : 1
      refundAmount = Math.min(
        remainingGrandBefore,
        Math.round(returnedSubtotal * ratio * 100) / 100
      )
    }

    const nextRefundedTotal = Math.min(
      Number(invoice.grandTotal || 0),
      Math.round((Number(invoice.refundedTotal || 0) + refundAmount) * 100) / 100
    )
    const nextStatus = willBeFullReturn ? 'REFUNDED' : 'PARTIALLY_RETURNED'
    const cleanReason = typeof reason === 'string' && reason.trim() ? reason.trim().slice(0, 300) : null

    const updatedInvoice = await prisma.$transaction(async (tx) => {
      for (const { item, qty } of updatesToApply) {
        await tx.invoiceItem.update({
          where: { id: item.id },
          data: { returnedQty: (item.returnedQty || 0) + qty },
        })

        if (restock && item.productId) {
          await tx.product
            .update({
              where: { id: item.productId },
              data: { stocks: { increment: qty } },
            })
            .catch(() => {})
        }
      }

      const updated = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: nextStatus,
          refundedTotal: nextRefundedTotal,
          returnReason: cleanReason || invoice.returnReason || null,
          returnedAt: new Date(),
        },
        include: {
          merchant: { select: { id: true, name: true, logo: true } },
          branch: { select: { id: true, name: true, address: true } },
          items: true,
        },
      })

      await tx.auditLog.create({
        data: {
          actorUserId: req.user?.id || 'system',
          actorEmail: req.user?.email || 'pos@system',
          actionType: willBeFullReturn ? 'INVOICE_FULL_RETURN' : 'INVOICE_PARTIAL_RETURN',
          entityType: 'Invoice',
          entityId: invoice.id,
          oldValues: JSON.stringify({
            status: invoice.status,
            refundedTotal: invoice.refundedTotal,
          }),
          newValues: JSON.stringify({
            status: nextStatus,
            refundAmount,
            refundedTotal: nextRefundedTotal,
            reason: cleanReason,
            items: updatesToApply.map((u) => ({ name: u.item.productName, qty: u.qty })),
          }),
        },
      })

      return updated
    })

    res.json({
      invoice: updatedInvoice,
      refundAmount,
      isFullReturn: willBeFullReturn,
    })
  } catch (error: any) {
    console.error('Invoice return error:', error)
    res.status(500).json({ error: error.message || 'فشل معالجة المرتجع' })
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
