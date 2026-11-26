import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js'
import {
  collectSystemSnapshot,
  getAiConfig,
  runAiChat,
  saveAiConfig,
  type AiProvider,
  type ChatHistoryTurn,
} from '../services/ai.service.js'

const router = Router()

const VALID_PROVIDERS: AiProvider[] = [
  'FREE_POLLINATIONS',
  'GROQ',
  'GEMINI',
  'OPENROUTER',
  'OLLAMA',
]

function resolveScopeMerchantId(req: AuthRequest, requested?: string): string | undefined {
  if (req.user?.role !== 'SUPER_ADMIN' && req.user?.merchantId) {
    return req.user.merchantId
  }
  if (requested && requested !== 'all') {
    return requested
  }
  return req.user?.merchantId || undefined
}

// GET /api/ai/config
router.get('/config', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const merchantId = resolveScopeMerchantId(req, req.query.merchantId as string | undefined)
    const configKey = merchantId || 'global'
    const cfg = getAiConfig(configKey)
    res.json({
      provider: cfg.provider,
      model: cfg.model,
      ollamaUrl: cfg.ollamaUrl || 'http://localhost:11434',
      hasApiKey: Boolean(cfg.apiKey && cfg.apiKey.trim().length > 0),
      updatedAt: cfg.updatedAt,
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'فشل تحميل إعدادات الذكاء الاصطناعي' })
  }
})

// PUT /api/ai/config
router.put('/config', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { merchantId: reqMerchantId, provider, model, apiKey, ollamaUrl } = req.body || {}
    const merchantId = resolveScopeMerchantId(req, reqMerchantId)
    const configKey = merchantId || 'global'

    if (provider && !VALID_PROVIDERS.includes(provider)) {
      return res.status(400).json({ error: 'مزود الذكاء الاصطناعي غير مدعوم' })
    }

    const current = getAiConfig(configKey)
    const saved = saveAiConfig(configKey, {
      provider: provider || current.provider,
      model: typeof model === 'string' && model.trim() ? model.trim() : current.model,
      // Keep existing API key if user didn't enter a new one (or clear if explicitly '')
      apiKey: typeof apiKey === 'string' ? (apiKey === '__KEEP__' ? current.apiKey : apiKey.trim()) : current.apiKey,
      ollamaUrl: typeof ollamaUrl === 'string' && ollamaUrl.trim() ? ollamaUrl.trim() : current.ollamaUrl,
    })

    res.json({
      provider: saved.provider,
      model: saved.model,
      ollamaUrl: saved.ollamaUrl || 'http://localhost:11434',
      hasApiKey: Boolean(saved.apiKey && saved.apiKey.trim().length > 0),
      updatedAt: saved.updatedAt,
    })
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'فشل حفظ إعدادات الذكاء الاصطناعي' })
  }
})

// GET /api/ai/summary — quick live system overview for the AI chat header
router.get('/summary', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const merchantId = resolveScopeMerchantId(req, req.query.merchantId as string | undefined)
    const snap = await collectSystemSnapshot(merchantId)
    res.json({
      scope: snap.scope,
      totalRevenue: snap.sales.totalRevenue,
      todayRevenue: snap.sales.todayRevenue,
      invoiceCount: snap.sales.invoiceCount,
      productsCount: snap.inventory.totalProducts,
      lowStockCount: snap.inventory.lowStockCount + snap.inventory.outOfStockCount,
      branchesCount: snap.branches.length,
      activeOffersCount: snap.offers.active,
      totalScans: snap.scans.totalScans,
      generatedAt: snap.generatedAt,
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'فشل تحميل ملخص النظام' })
  }
})

// POST /api/ai/chat — Live DB-grounded AI Q&A, Reports & Statistics
router.post('/chat', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const {
      merchantId: reqMerchantId,
      message,
      history,
      provider,
      model,
    } = req.body || {}

    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: 'الرسالة مطلوبة' })
    }

    const merchantId = resolveScopeMerchantId(req, reqMerchantId)
    const configKey = merchantId || 'global'

    const cleanHistory: ChatHistoryTurn[] = Array.isArray(history)
      ? history
          .filter(
            (h: any) =>
              h &&
              (h.role === 'user' || h.role === 'assistant') &&
              typeof h.content === 'string' &&
              h.content.trim().length > 0
          )
          .slice(-10)
          .map((h: any) => ({ role: h.role, content: h.content.slice(0, 2500) }))
      : []

    const result = await runAiChat({
      merchantId,
      configKey,
      message: String(message).trim().slice(0, 3000),
      history: cleanHistory,
      overrideProvider: VALID_PROVIDERS.includes(provider) ? provider : undefined,
      overrideModel: typeof model === 'string' && model.trim() ? model.trim() : undefined,
    })

    res.json(result)
  } catch (error: any) {
    console.error('AI Chat route error:', error)
    res.status(500).json({ error: error.message || 'حدث خطأ أثناء معالجة طلب الذكاء الاصطناعي' })
  }
})

export default router
