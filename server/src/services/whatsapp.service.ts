import fs from 'fs'
import path from 'path'
import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  type WASocket,
} from '@whiskeysockets/baileys'
import QRCode from 'qrcode'
import pino from 'pino'

export type WhatsAppStatus = 'disconnected' | 'connecting' | 'qr' | 'connected'

export interface WhatsAppSessionSnapshot {
  status: WhatsAppStatus
  qrDataUrl: string | null
  phoneNumber: string | null
  name: string | null
  lastError: string | null
}

interface MerchantSession {
  merchantId: string
  socket: WASocket | null
  status: WhatsAppStatus
  qrDataUrl: string | null
  phoneNumber: string | null
  name: string | null
  lastError: string | null
  reconnectTimer: ReturnType<typeof setTimeout> | null
  manuallyDisconnected: boolean
}

const SESSIONS_ROOT = path.resolve(process.cwd(), 'whatsapp-sessions')
const sessions = new Map<string, MerchantSession>()
const silentLogger = pino({ level: 'silent' })

function sanitizeId(merchantId: string): string {
  return merchantId.replace(/[^a-zA-Z0-9_-]/g, '_') || 'default'
}

function getSessionDir(merchantId: string): string {
  return path.join(SESSIONS_ROOT, sanitizeId(merchantId))
}

function ensureSessionEntry(merchantId: string): MerchantSession {
  let entry = sessions.get(merchantId)
  if (!entry) {
    entry = {
      merchantId,
      socket: null,
      status: 'disconnected',
      qrDataUrl: null,
      phoneNumber: null,
      name: null,
      lastError: null,
      reconnectTimer: null,
      manuallyDisconnected: false,
    }
    sessions.set(merchantId, entry)
  }
  return entry
}

export function getWhatsAppStatus(merchantId: string): WhatsAppSessionSnapshot {
  const entry = sessions.get(merchantId)
  if (!entry) {
    return {
      status: 'disconnected',
      qrDataUrl: null,
      phoneNumber: null,
      name: null,
      lastError: null,
    }
  }
  return {
    status: entry.status,
    qrDataUrl: entry.qrDataUrl,
    phoneNumber: entry.phoneNumber,
    name: entry.name,
    lastError: entry.lastError,
  }
}

export function formatWhatsAppNumber(raw: string): string {
  const ascii = String(raw || '')
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
  let digits = ascii.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('00')) digits = digits.slice(2)
  // Auto-prefix Egypt (+20) for 01X... or 1X... mobile numbers
  if (digits.length === 11 && digits.startsWith('01')) {
    digits = `2${digits}`
  } else if (digits.length === 10 && digits.startsWith('1')) {
    digits = `20${digits}`
  }
  return digits
}

export async function connectWhatsApp(merchantId: string): Promise<WhatsAppSessionSnapshot> {
  const entry = ensureSessionEntry(merchantId)

  if (entry.status === 'connected' && entry.socket) {
    return getWhatsAppStatus(merchantId)
  }

  // Clear any pending reconnect timer and close stale socket cleanly
  if (entry.reconnectTimer) {
    clearTimeout(entry.reconnectTimer)
    entry.reconnectTimer = null
  }
  if (entry.socket) {
    try {
      entry.socket.end(undefined)
    } catch {}
    entry.socket = null
  }

  entry.manuallyDisconnected = false
  entry.status = 'connecting'
  entry.qrDataUrl = null
  entry.lastError = null

  const sessionDir = getSessionDir(merchantId)
  fs.mkdirSync(sessionDir, { recursive: true })

  try {
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
    let version: [number, number, number] | undefined
    try {
      const latest = await fetchLatestBaileysVersion()
      version = latest.version
    } catch {
      // Fall back to Baileys bundled version if version check fails
    }

    const sock = makeWASocket({
      auth: state,
      version,
      logger: silentLogger,
      browser: Browsers.ubuntu('Green Scan POS'),
      printQRInTerminal: false,
      markOnlineOnConnect: false,
      syncFullHistory: false,
    })

    entry.socket = sock

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        try {
          entry.qrDataUrl = await QRCode.toDataURL(qr, { width: 320, margin: 2 })
          entry.status = 'qr'
          entry.lastError = null
        } catch (err: any) {
          entry.lastError = err?.message || 'Failed to render QR code'
        }
      }

      if (connection === 'open') {
        entry.status = 'connected'
        entry.qrDataUrl = null
        entry.lastError = null
        const rawJid = sock.user?.id || ''
        entry.phoneNumber = rawJid.split(':')[0]?.split('@')[0] || null
        entry.name = sock.user?.name || null
        console.log(`✅ WhatsApp connected for merchant ${merchantId} (+${entry.phoneNumber})`)
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode
        const isLoggedOut = statusCode === DisconnectReason.loggedOut

        entry.socket = null
        entry.qrDataUrl = null

        if (entry.manuallyDisconnected || isLoggedOut) {
          entry.status = 'disconnected'
          entry.phoneNumber = null
          entry.name = null
          if (isLoggedOut) {
            try {
              fs.rmSync(sessionDir, { recursive: true, force: true })
            } catch {}
            entry.lastError = 'تم تسجيل الخروج من واتساب. أعد مسح كود الـ QR للربط مجدداً.'
          }
          return
        }

        // Auto-reconnect (especially required on statusCode 515 right after QR scan)
        entry.status = 'connecting'
        const delayMs = statusCode === DisconnectReason.restartRequired ? 400 : 2500
        entry.reconnectTimer = setTimeout(() => {
          connectWhatsApp(merchantId).catch(() => {})
        }, delayMs)
      }
    })
  } catch (err: any) {
    entry.status = 'disconnected'
    entry.lastError = err?.message || 'تعذر الاتصال بسيرفر واتساب'
  }

  return getWhatsAppStatus(merchantId)
}

export async function disconnectWhatsApp(merchantId: string): Promise<void> {
  const entry = sessions.get(merchantId)
  const sessionDir = getSessionDir(merchantId)

  if (entry) {
    entry.manuallyDisconnected = true
    if (entry.reconnectTimer) {
      clearTimeout(entry.reconnectTimer)
      entry.reconnectTimer = null
    }
    if (entry.socket) {
      try {
        await entry.socket.logout()
      } catch {
        try {
          entry.socket.end(undefined)
        } catch {}
      }
      entry.socket = null
    }
    entry.status = 'disconnected'
    entry.qrDataUrl = null
    entry.phoneNumber = null
    entry.name = null
    entry.lastError = null
  }

  try {
    fs.rmSync(sessionDir, { recursive: true, force: true })
  } catch {}
}

async function resolveRecipientJid(
  entry: MerchantSession,
  phone: string
): Promise<{ targetJid: string; formatted: string }> {
  if (!entry || entry.status !== 'connected' || !entry.socket) {
    throw new Error('واتساب المتجر غير متصل حالياً. اربطه أولاً عبر مسح الـ QR.')
  }

  const formatted = formatWhatsAppNumber(phone)
  if (!formatted || formatted.length < 10) {
    throw new Error('رقم الهاتف غير صحيح. أدخل رقم واتساب صحيح (مثال: 010XXXXXXXX).')
  }

  let targetJid = `${formatted}@s.whatsapp.net`
  try {
    const check = await entry.socket.onWhatsApp(formatted)
    if (Array.isArray(check) && check.length > 0) {
      if (!check[0].exists) {
        throw new Error(`الرقم +${formatted} غير مسجل على واتساب.`)
      }
      if (check[0].jid) {
        targetJid = check[0].jid
      }
    }
  } catch (err: any) {
    if (err?.message?.includes('غير مسجل')) throw err
    // Ignore transient lookup errors and try sending directly
  }

  return { targetJid, formatted }
}

export async function sendWhatsAppMessage(
  merchantId: string,
  phone: string,
  message: string
): Promise<{ success: boolean; messageId?: string; to: string }> {
  const entry = sessions.get(merchantId)
  if (!entry || entry.status !== 'connected' || !entry.socket) {
    throw new Error('واتساب المتجر غير متصل حالياً. اربطه أولاً عبر مسح الـ QR.')
  }

  const { targetJid, formatted } = await resolveRecipientJid(entry, phone)
  const sent = await entry.socket.sendMessage(targetJid, { text: message })
  return {
    success: true,
    messageId: sent?.key?.id || undefined,
    to: formatted,
  }
}

export async function sendWhatsAppDocument(
  merchantId: string,
  phone: string,
  pdfBuffer: Buffer,
  fileName: string,
  caption?: string
): Promise<{ success: boolean; messageId?: string; to: string }> {
  const entry = sessions.get(merchantId)
  if (!entry || entry.status !== 'connected' || !entry.socket) {
    throw new Error('واتساب المتجر غير متصل حالياً. اربطه أولاً من الداشبورد ← الفواتير ← ربط واتساب.')
  }

  const { targetJid, formatted } = await resolveRecipientJid(entry, phone)
  const safeFileName = (fileName || 'invoice.pdf').endsWith('.pdf')
    ? fileName || 'invoice.pdf'
    : `${fileName}.pdf`

  const sent = await entry.socket.sendMessage(targetJid, {
    document: pdfBuffer,
    mimetype: 'application/pdf',
    fileName: safeFileName,
    caption: caption || undefined,
  })

  return {
    success: true,
    messageId: sent?.key?.id || undefined,
    to: formatted,
  }
}

export function restoreExistingWhatsAppSessions(): void {
  try {
    if (!fs.existsSync(SESSIONS_ROOT)) return
    const dirs = fs.readdirSync(SESSIONS_ROOT, { withFileTypes: true })
    for (const d of dirs) {
      if (!d.isDirectory()) continue
      const credsFile = path.join(SESSIONS_ROOT, d.name, 'creds.json')
      if (fs.existsSync(credsFile)) {
        connectWhatsApp(d.name).catch(() => {})
      }
    }
  } catch {
    // ignore startup restore errors
  }
}
