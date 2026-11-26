import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js'
import { prisma } from '../lib/prisma.js'
import {
  connectWhatsApp,
  disconnectWhatsApp,
  getWhatsAppStatus,
  sendWhatsAppDocument,
  sendWhatsAppMessage,
} from '../services/whatsapp.service.js'

const router = Router()

async function resolveMerchantId(req: AuthRequest, requested?: string): Promise<string> {
  if (req.user?.role !== 'SUPER_ADMIN' && req.user?.merchantId) {
    return req.user.merchantId
  }
  if (requested && requested !== 'all') {
    return requested
  }
  if (req.user?.merchantId) {
    return req.user.merchantId
  }
  const first = await prisma.merchant.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  })
  return first?.id || 'default'
}

// GET /api/whatsapp/status
router.get('/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const merchantId = await resolveMerchantId(req, req.query.merchantId as string | undefined)
    res.json(getWhatsAppStatus(merchantId))
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/whatsapp/connect
router.post('/connect', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const merchantId = await resolveMerchantId(req, req.body?.merchantId)
    const snapshot = await connectWhatsApp(merchantId)
    res.json(snapshot)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/whatsapp/disconnect
router.post('/disconnect', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const merchantId = await resolveMerchantId(req, req.body?.merchantId)
    await disconnectWhatsApp(merchantId)
    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/whatsapp/send
router.post('/send', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { merchantId: reqMerchantId, phone, message } = req.body || {}
    if (!phone || !String(phone).trim()) {
      return res.status(400).json({ error: 'رقم هاتف العميل مطلوب' })
    }
    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: 'نص الرسالة مطلوب' })
    }

    const merchantId = await resolveMerchantId(req, reqMerchantId)
    const result = await sendWhatsAppMessage(merchantId, String(phone), String(message))
    res.json(result)
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'فشل إرسال رسالة واتساب' })
  }
})

// POST /api/whatsapp/send-document (Send Invoice PDF directly to customer WhatsApp)
router.post('/send-document', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { merchantId: reqMerchantId, phone, pdfBase64, fileName, caption } = req.body || {}
    if (!phone || !String(phone).trim()) {
      return res.status(400).json({ error: 'رقم هاتف العميل مطلوب' })
    }
    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
      return res.status(400).json({ error: 'ملف الفاتورة PDF مطلوب' })
    }

    const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '').trim()
    const pdfBuffer = Buffer.from(cleanBase64, 'base64')
    if (pdfBuffer.length < 100) {
      return res.status(400).json({ error: 'ملف PDF غير صالح' })
    }

    const merchantId = await resolveMerchantId(req, reqMerchantId)
    const result = await sendWhatsAppDocument(
      merchantId,
      String(phone),
      pdfBuffer,
      fileName ? String(fileName) : 'invoice.pdf',
      caption ? String(caption) : undefined
    )
    res.json(result)
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'فشل إرسال ملف الفاتورة عبر واتساب' })
  }
})

export default router
