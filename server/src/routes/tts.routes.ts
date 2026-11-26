import { Router } from 'express'

const router = Router()

// In-memory cache so repeated POS voice announcements play instantaneously
const audioCache = new Map<string, Buffer>()

router.get('/', async (req, res) => {
  try {
    const rawText = String(req.query.text || '').trim()
    const rawLang = String(req.query.lang || 'ar').trim().toLowerCase()

    if (!rawText) {
      return res.status(400).json({ error: 'Missing text query parameter' })
    }

    const text = rawText.slice(0, 200)
    const lang = /^[a-z]{2}(-[a-z]{2})?$/i.test(rawLang) ? rawLang : 'ar'
    const cacheKey = `${lang}::${text}`

    const cached = audioCache.get(cacheKey)
    if (cached) {
      res.setHeader('Content-Type', 'audio/mpeg')
      res.setHeader('Cache-Control', 'public, max-age=86400')
      return res.send(cached)
    }

    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(
      lang
    )}&client=tw-ob&q=${encodeURIComponent(text)}`

    const upstream = await fetch(ttsUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Referer: 'https://translate.google.com/',
      },
    })

    if (!upstream.ok) {
      return res.status(502).json({ error: `TTS upstream returned ${upstream.status}` })
    }

    const arrayBuf = await upstream.arrayBuffer()
    const buffer = Buffer.from(arrayBuf)

    if (buffer.length < 100) {
      return res.status(502).json({ error: 'Empty audio from TTS upstream' })
    }

    // Keep cache bounded to 50 phrases
    if (audioCache.size >= 50) {
      const oldestKey = audioCache.keys().next().value
      if (oldestKey) audioCache.delete(oldestKey)
    }
    audioCache.set(cacheKey, buffer)

    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'public, max-age=86400')
    return res.send(buffer)
  } catch (err: any) {
    console.error('TTS error:', err?.message || err)
    return res.status(500).json({ error: 'Failed to synthesize voice audio' })
  }
})

export default router
