import type { Branch, Invoice, InvoiceTemplate, Merchant } from '@/types/saas'

interface GenerateInvoicePdfOptions {
  invoice: Invoice
  merchant?: Merchant | null
  branch?: Branch | null
  template?: InvoiceTemplate | null
  cashierName?: string
  lang?: 'ar' | 'en'
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] || ''
  const binary = atob(base64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function buildPdfFromJpeg(
  jpegBytes: Uint8Array,
  imgWidth: number,
  imgHeight: number,
  pageW = 420
): Uint8Array {
  const encoder = new TextEncoder()
  const pageH = Math.round((imgHeight / imgWidth) * pageW * 100) / 100

  const chunks: Uint8Array[] = []
  let byteLength = 0
  const offsets: number[] = []

  const pushStr = (str: string) => {
    const bytes = encoder.encode(str)
    chunks.push(bytes)
    byteLength += bytes.length
  }

  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes)
    byteLength += bytes.length
  }

  pushStr('%PDF-1.4\n')
  pushBytes(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]))

  offsets[1] = byteLength
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')

  offsets[2] = byteLength
  pushStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n')

  offsets[3] = byteLength
  pushStr(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  )

  offsets[4] = byteLength
  pushStr(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgWidth} /Height ${imgHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
  )
  pushBytes(jpegBytes)
  pushStr('\nendstream\nendobj\n')

  const contentStream = `q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Im0 Do\nQ\n`
  const contentBytes = encoder.encode(contentStream)
  offsets[5] = byteLength
  pushStr(`5 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`)
  pushBytes(contentBytes)
  pushStr('endstream\nendobj\n')

  const xrefStart = byteLength
  pushStr('xref\n0 6\n')
  pushStr('0000000000 65535 f \n')
  for (let i = 1; i <= 5; i++) {
    pushStr(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`)
  }

  pushStr(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`)

  const result = new Uint8Array(byteLength)
  let pos = 0
  for (const c of chunks) {
    result.set(c, pos)
    pos += c.length
  }
  return result
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rad = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rad, y)
  ctx.arcTo(x + w, y, x + w, y + h, rad)
  ctx.arcTo(x + w, y + h, x, y + h, rad)
  ctx.arcTo(x, y + h, x, y, rad)
  ctx.arcTo(x, y, x + w, y, rad)
  ctx.closePath()
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let trimmed = text
  while (trimmed.length > 1 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1)
  }
  return `${trimmed}…`
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16)
    const g = parseInt(clean[1] + clean[1], 16)
    const b = parseInt(clean[2] + clean[2], 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16)
    const g = parseInt(clean.slice(2, 4), 16)
    const b = parseInt(clean.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return `rgba(9, 9, 11, ${alpha})`
}

function tryLoadCorsImage(url?: string | null): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null)
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    const timer = setTimeout(() => resolve(null), 2200)
    img.onload = () => {
      clearTimeout(timer)
      resolve(img)
    }
    img.onerror = () => {
      clearTimeout(timer)
      resolve(null)
    }
    img.src = url
  })
}

function drawVectorBarcode(
  ctx: CanvasRenderingContext2D,
  code: string,
  centerX: number,
  topY: number,
  width: number,
  height: number
) {
  // Deterministic visual Code-128 style bars matching CustomizedInvoiceView's footer barcode
  const bars: number[] = [2, 1, 2, 2, 1, 1]
  for (let i = 0; i < code.length; i++) {
    const ch = code.charCodeAt(i)
    bars.push((ch % 3) + 1, ((ch >> 2) % 2) + 1, ((ch >> 4) % 3) + 1, 1)
  }
  bars.push(2, 1, 1, 2, 2)

  const totalUnits = bars.reduce((a, b) => a + b, 0)
  const unitW = width / totalUnits
  let x = centerX - width / 2

  ctx.fillStyle = '#3F3F46'
  bars.forEach((units, idx) => {
    const w = units * unitW
    if (idx % 2 === 0) {
      ctx.fillRect(x, topY, Math.max(1, w - 0.2), height)
    }
    x += w
  })
}

/**
 * Generates a high-DPI PDF matching the exact visual design & merchant settings
 * of CustomizedInvoiceView (layoutStyle, headerStyle, primaryColor, tableStyle,
 * logo, ZATCA QR, tax details, watermark, barcode, header/footer notices).
 */
export async function generateInvoicePdfBase64({
  invoice,
  merchant,
  branch,
  template,
  cashierName,
}: GenerateInvoicePdfOptions): Promise<string> {
  // Extract exact template options matching CustomizedInvoiceView
  const primaryColor = template?.primaryColor || '#09090B'
  const layoutStyle = template?.layoutStyle || 'THERMAL_POS'
  const paperSize = template?.paperSize || '80MM'
  const headerStyle = template?.headerStyle || 'BORDER_TOP'
  const tableStyle = template?.tableStyle || 'STRIPED'
  const currencyPosition = template?.currencyPosition || 'AFTER'
  const fontFamilyPref = template?.fontFamily || 'sans'

  const businessName = template?.businessName || merchant?.name || 'GREEN STORE'
  const logoUrl = template?.logoUrl || merchant?.logo || ''
  const showLogo = template?.showLogo !== false && !!logoUrl
  const taxNumber = template?.taxNumber || '300012345678901'
  const headerNotice = template?.headerNotice || ''
  const footerNotice =
    template?.footerNotice || 'شكراً لزيارتكم • نتمنى لكم يوماً سعيداً'

  const showQrCode = template?.showQrCode !== false
  const qrPosition = template?.qrPosition || 'FOOTER_RIGHT'
  const showTaxDetails = template?.showTaxDetails !== false
  const showBranchInfo = template?.showBranchInfo !== false
  const showCashierName = template?.showCashierName !== false
  const showBarcode = template?.showBarcode !== false
  const showWatermark = template?.showWatermark === true
  const watermarkText = template?.watermarkText || 'PAID'

  const formatPrice = (val: number | undefined | null) => {
    const num = Number(val ?? 0)
    const formatted = num.toFixed(2)
    return currencyPosition === 'BEFORE' ? `EGP ${formatted}` : `${formatted} EGP`
  }

  const isThermal = paperSize === '80MM' || layoutStyle === 'THERMAL_POS'
  const invoiceDate = new Date(invoice.issuedAt || invoice.createdAt || Date.now())
  const items = Array.isArray(invoice.items) ? invoice.items : []

  const qrPayload = encodeURIComponent(
    `Seller: ${businessName} | Tax: ${taxNumber} | Invoice: ${invoice.invoiceNumber} | Total: ${invoice.grandTotal} | Date: ${invoiceDate.toISOString()}`
  )
  const qrUrl = showQrCode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${qrPayload}`
    : null

  const [logoImg, qrImg] = await Promise.all([
    showLogo ? tryLoadCorsImage(logoUrl) : Promise.resolve(null),
    qrUrl ? tryLoadCorsImage(qrUrl) : Promise.resolve(null),
  ])

  const W = isThermal ? 420 : 580
  const PAD = 24
  const contentW = W - PAD * 2

  const fontMain =
    fontFamilyPref === 'serif'
      ? `Georgia, 'Times New Roman', 'Readex Pro', serif`
      : fontFamilyPref === 'mono'
        ? `'SF Mono', Consolas, 'Readex Pro', monospace`
        : `'Readex Pro', 'Plus Jakarta Sans', 'Segoe UI', Tahoma, Arial, sans-serif`
  const fontMono = `'SF Mono', Consolas, 'Courier New', monospace`

  // Pre-calculate exact dynamic height
  const topBannerH =
    headerStyle === 'SOLID_BANNER' || headerStyle === 'SUBTLE_TINT'
      ? 72
      : headerStyle === 'BORDER_TOP'
        ? 8
        : 0
  const mainHeaderH =
    headerStyle === 'SOLID_BANNER' || headerStyle === 'SUBTLE_TINT'
      ? 0
      : showQrCode && qrPosition === 'HEADER_RIGHT'
        ? 112
        : 76
  const headerNoticeH = headerNotice ? 34 : 0
  const billedBoxH = 44
  const tableHeaderH = 30
  const rowH = 38
  const tableBodyH = Math.max(1, items.length) * rowH
  const summaryH = showTaxDetails ? 86 : 64
  const footerQrH =
    showQrCode && qrPosition !== 'HEADER_RIGHT'
      ? qrPosition === 'FOOTER_CENTER'
        ? 148
        : 114
      : footerNotice
        ? 62
        : 24
  const barcodeH = showBarcode ? 66 : 0
  const H =
    PAD +
    topBannerH +
    mainHeaderH +
    headerNoticeH +
    billedBoxH +
    tableHeaderH +
    tableBodyH +
    summaryH +
    footerQrH +
    barcodeH +
    PAD +
    28

  const scale = 2
  const canvas = document.createElement('canvas')
  canvas.width = W * scale
  canvas.height = H * scale
  const ctx = canvas.getContext('2d')!
  ctx.scale(scale, scale)

  // Card background & crisp border
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, W, H)

  // Optional Watermark (drawn behind content just like CustomizedInvoiceView)
  if (showWatermark) {
    ctx.save()
    ctx.translate(W / 2, H / 2)
    ctx.rotate(-Math.PI / 4)
    ctx.font = `900 54px ${fontMain}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = 'rgba(228, 228, 231, 0.55)'
    ctx.strokeStyle = 'rgba(228, 228, 231, 0.7)'
    ctx.lineWidth = 3
    ctx.setLineDash([8, 6])
    const wmW = ctx.measureText(watermarkText.toUpperCase()).width + 40
    drawRoundedRect(ctx, -wmW / 2, -40, wmW, 80, 12)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillText(watermarkText.toUpperCase(), 0, 2)
    ctx.restore()
  }

  let y = 0

  // ── 1. Header according to headerStyle ──
  if (headerStyle === 'BORDER_TOP') {
    ctx.fillStyle = primaryColor
    ctx.fillRect(0, 0, W, 8)
    y = 24
  } else if (headerStyle === 'SOLID_BANNER') {
    ctx.fillStyle = primaryColor
    ctx.fillRect(0, 0, W, 72)

    // RTL: Store name on right, invoice number pill on left
    ctx.direction = 'rtl'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `700 17px ${fontMain}`
    ctx.fillText(truncateText(ctx, businessName, contentW - 140), W - PAD, 34)
    ctx.fillStyle = 'rgba(255,255,255,0.82)'
    ctx.font = `500 11px ${fontMain}`
    ctx.fillText('فاتورة ضريبية مبسطة', W - PAD, 54)

    // Invoice pill on left
    ctx.direction = 'ltr'
    ctx.font = `700 11px ${fontMono}`
    const pillText = `#${invoice.invoiceNumber}`
    const pW = ctx.measureText(pillText).width + 18
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    drawRoundedRect(ctx, PAD, 24, pW, 24, 6)
    ctx.fill()
    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'left'
    ctx.fillText(pillText, PAD + 9, 40)

    y = 86
  } else if (headerStyle === 'SUBTLE_TINT') {
    ctx.fillStyle = hexToRgba(primaryColor, 0.08)
    ctx.fillRect(0, 0, W, 72)
    ctx.strokeStyle = '#E4E4E7'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, 72)
    ctx.lineTo(W, 72)
    ctx.stroke()

    ctx.direction = 'rtl'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = primaryColor
    ctx.font = `700 17px ${fontMain}`
    ctx.fillText(truncateText(ctx, businessName, contentW - 140), W - PAD, 34)
    ctx.fillStyle = '#71717A'
    ctx.font = `500 11px ${fontMain}`
    ctx.fillText('فاتورة مبيعات إلكترونية', W - PAD, 54)

    ctx.direction = 'ltr'
    ctx.font = `700 11px ${fontMono}`
    const pillText = `#${invoice.invoiceNumber}`
    const pW = ctx.measureText(pillText).width + 18
    ctx.fillStyle = hexToRgba(primaryColor, 0.16)
    drawRoundedRect(ctx, PAD, 24, pW, 24, 6)
    ctx.fill()
    ctx.fillStyle = primaryColor
    ctx.textAlign = 'left'
    ctx.fillText(pillText, PAD + 9, 40)

    y = 86
  } else {
    y = PAD
  }

  // Main Header Info (for BORDER_TOP and MINIMAL)
  if (headerStyle !== 'SOLID_BANNER' && headerStyle !== 'SUBTLE_TINT') {
    const startY = y
    let textRightX = W - PAD

    // Store Logo on right (RTL)
    if (showLogo && logoImg) {
      const lSize = 46
      const lx = W - PAD - lSize
      ctx.save()
      drawRoundedRect(ctx, lx, startY, lSize, lSize, 6)
      ctx.clip()
      ctx.drawImage(logoImg, lx, startY, lSize, lSize)
      ctx.restore()
      ctx.strokeStyle = '#E4E4E7'
      ctx.lineWidth = 1
      drawRoundedRect(ctx, lx, startY, lSize, lSize, 6)
      ctx.stroke()
      textRightX = lx - 10
    }

    // Store Name + Branch + Tax (Right)
    ctx.direction = 'rtl'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = primaryColor
    ctx.font = `700 16px ${fontMain}`
    ctx.fillText(truncateText(ctx, businessName, contentW - 180), textRightX, startY + 18)

    let metaLineY = startY + 34
    if (showBranchInfo && branch) {
      ctx.fillStyle = '#71717A'
      ctx.font = `500 10.5px ${fontMain}`
      const branchLine = `${branch.name}${branch.address ? ` • ${branch.address}` : ''}`
      ctx.fillText(truncateText(ctx, branchLine, contentW - 180), textRightX, metaLineY)
      metaLineY += 15
    }
    if (taxNumber) {
      ctx.fillStyle = '#71717A'
      ctx.font = `500 10px ${fontMono}`
      ctx.fillText(`الرقم الضريبي: ${taxNumber}`, textRightX, metaLineY)
    }

    // Tax Invoice Badge + Invoice # + Date (Left)
    ctx.direction = 'rtl'
    const badgeLabel = 'فاتورة ضريبية'
    ctx.font = `700 10px ${fontMain}`
    const badgeW = ctx.measureText(badgeLabel).width + 16
    ctx.fillStyle = primaryColor
    drawRoundedRect(ctx, PAD, startY, badgeW, 20, 4)
    ctx.fill()
    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'center'
    ctx.fillText(badgeLabel, PAD + badgeW / 2, startY + 13.5)

    ctx.direction = 'ltr'
    ctx.textAlign = 'left'
    ctx.fillStyle = '#18181B'
    ctx.font = `700 11.5px ${fontMono}`
    ctx.fillText(`#${invoice.invoiceNumber}`, PAD, startY + 36)

    ctx.fillStyle = '#A1A1AA'
    ctx.font = `500 9.5px ${fontMono}`
    const dateStr = `${invoiceDate.toLocaleDateString('ar-EG')} ${invoiceDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`
    ctx.fillText(dateStr, PAD, startY + 50)

    if (showQrCode && qrPosition === 'HEADER_RIGHT' && qrImg) {
      const qSize = 48
      ctx.fillStyle = '#FAFAFA'
      ctx.strokeStyle = '#E4E4E7'
      drawRoundedRect(ctx, PAD, startY + 56, qSize + 4, qSize + 4, 4)
      ctx.fill()
      ctx.stroke()
      ctx.drawImage(qrImg, PAD + 2, startY + 58, qSize, qSize)
    }

    y = startY + mainHeaderH - 8
    ctx.strokeStyle = '#E4E4E7'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(PAD, y)
    ctx.lineTo(W - PAD, y)
    ctx.stroke()
    y += 12
  }

  // ── 2. Header Notice ──
  if (headerNotice) {
    ctx.fillStyle = '#FAFAFA'
    drawRoundedRect(ctx, PAD, y, contentW, 24, 5)
    ctx.fill()
    ctx.direction = 'rtl'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#52525B'
    ctx.font = `500 10.5px ${fontMain}`
    ctx.fillText(truncateText(ctx, headerNotice, contentW - 16), W / 2, y + 12)
    y += 34
  }

  // ── 3. Billed To & Cashier Strip ──
  ctx.fillStyle = '#FAFAFA'
  ctx.strokeStyle = '#E4E4E7'
  ctx.lineWidth = 1
  drawRoundedRect(ctx, PAD, y, contentW, 32, 6)
  ctx.fill()
  ctx.stroke()

  ctx.textBaseline = 'middle'
  const stripMidY = y + 16

  ctx.direction = 'rtl'
  ctx.textAlign = 'right'
  ctx.fillStyle = '#27272A'
  ctx.font = `700 10.5px ${fontMain}`
  const custText = `العميل: ${invoice.customerName || 'عميل نقدي (Walk-in)'}`
  ctx.fillText(truncateText(ctx, custText, contentW * 0.52), W - PAD - 10, stripMidY)

  ctx.textAlign = 'left'
  ctx.fillStyle = '#71717A'
  ctx.font = `600 10px ${fontMain}`
  const cashierMeta = showCashierName
    ? `الكاشير: ${cashierName || 'الكاشير'} (${invoice.paymentMethod})`
    : `(${invoice.paymentMethod})`
  ctx.fillText(truncateText(ctx, cashierMeta, contentW * 0.45), PAD + 10, stripMidY)

  y += billedBoxH

  // ── 4. Items Table Header (Matches CustomizedInvoiceView RTL columns) ──
  const colTotalX = PAD + 8
  const colPriceX = PAD + (isThermal ? 98 : 135)
  const colQtyX = PAD + (isThermal ? 168 : 225)
  const colItemRightX = W - PAD - 8

  if (tableStyle === 'GRID') {
    ctx.fillStyle = '#F4F4F5'
    ctx.strokeStyle = '#D4D4D8'
    ctx.fillRect(PAD, y, contentW, tableHeaderH)
    ctx.strokeRect(PAD, y, contentW, tableHeaderH)
  } else {
    ctx.strokeStyle = '#D4D4D8'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(PAD, y + tableHeaderH)
    ctx.lineTo(W - PAD, y + tableHeaderH)
    ctx.stroke()
  }

  ctx.fillStyle = primaryColor
  ctx.font = `700 11px ${fontMain}`
  const thMidY = y + tableHeaderH / 2
  ctx.direction = 'rtl'
  ctx.textAlign = 'right'
  ctx.fillText('الصنف', colItemRightX, thMidY)
  ctx.textAlign = 'center'
  ctx.fillText('الكمية', colQtyX, thMidY)
  ctx.textAlign = 'left'
  ctx.fillText('السعر', colPriceX, thMidY)
  ctx.fillText('الإجمالي', colTotalX, thMidY)

  y += tableHeaderH

  // ── 5. Table Rows ──
  items.forEach((item, idx) => {
    if (tableStyle === 'STRIPED' && idx % 2 === 1) {
      ctx.fillStyle = 'rgba(250, 250, 250, 0.85)'
      ctx.fillRect(PAD, y, contentW, rowH)
    }
    if (tableStyle === 'GRID') {
      ctx.strokeStyle = '#E4E4E7'
      ctx.lineWidth = 1
      ctx.strokeRect(PAD, y, contentW, rowH)
    } else {
      ctx.strokeStyle = '#F4F4F5'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(PAD, y + rowH)
      ctx.lineTo(W - PAD, y + rowH)
      ctx.stroke()
    }

    const itemName = item.productName || (item as any).name || 'منتج'
    const unitPrice = Number(item.unitPrice ?? 0)
    const qty = Number(item.quantity ?? 1)
    const total = Number(item.totalPrice ?? (item as any).total ?? qty * unitPrice)
    const rowMidY = y + rowH / 2

    // Item name (+ barcode underneath if present)
    ctx.direction = 'rtl'
    ctx.textAlign = 'right'
    ctx.fillStyle = '#27272A'
    ctx.font = `600 11.5px ${fontMain}`
    const maxItemW = colItemRightX - colQtyX - 24
    if (item.barcode) {
      ctx.fillText(truncateText(ctx, itemName, maxItemW), colItemRightX, y + 14)
      ctx.direction = 'ltr'
      ctx.textAlign = 'right'
      ctx.fillStyle = '#A1A1AA'
      ctx.font = `500 8.5px ${fontMono}`
      ctx.fillText(String(item.barcode), colItemRightX, y + 28)
    } else {
      ctx.fillText(truncateText(ctx, itemName, maxItemW), colItemRightX, rowMidY)
    }

    // Qty
    ctx.direction = 'ltr'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#3F3F46'
    ctx.font = `600 11px ${fontMono}`
    ctx.fillText(String(qty), colQtyX, rowMidY)

    // Unit price
    ctx.textAlign = 'left'
    ctx.fillStyle = '#3F3F46'
    ctx.font = `500 10.5px ${fontMono}`
    ctx.fillText(formatPrice(unitPrice), colPriceX, rowMidY)

    // Line total
    ctx.fillStyle = '#18181B'
    ctx.font = `700 11px ${fontMono}`
    ctx.fillText(formatPrice(total), colTotalX, rowMidY)

    y += rowH
  })

  if (items.length === 0) {
    y += rowH
  }

  // ── 6. Summary / Totals (Exact CustomizedInvoiceView style) ──
  ctx.strokeStyle = '#E4E4E7'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(PAD, y + 4)
  ctx.lineTo(W - PAD, y + 4)
  ctx.stroke()
  y += 18

  const sumW = Math.min(280, contentW)
  const sumRightX = W - PAD
  const sumLeftX = sumRightX - sumW

  const drawTotalRow = (label: string, value: string, bold = false, color = '#52525B') => {
    ctx.direction = 'rtl'
    ctx.textAlign = 'right'
    ctx.fillStyle = color
    ctx.font = `${bold ? '700 12.5px' : '500 11px'} ${fontMain}`
    ctx.fillText(label, sumRightX, y)

    ctx.direction = 'ltr'
    ctx.textAlign = 'left'
    ctx.fillStyle = bold ? color : '#27272A'
    ctx.font = `${bold ? '800 13.5px' : '600 11px'} ${fontMono}`
    ctx.fillText(value, sumLeftX, y)
    y += bold ? 24 : 20
  }

  drawTotalRow('المجموع الفرعي:', formatPrice(invoice.subtotal))
  if (showTaxDetails) {
    drawTotalRow('ضريبة القيمة المضافة (14%):', formatPrice(invoice.taxTotal))
  }

  ctx.strokeStyle = '#D4D4D8'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(sumLeftX, y - 10)
  ctx.lineTo(sumRightX, y - 10)
  ctx.stroke()
  y += 4

  drawTotalRow('الإجمالي النهائي:', formatPrice(invoice.grandTotal), true, primaryColor)

  // ── 7. Dashed Footer + Notice + ZATCA QR ──
  y += 10
  ctx.save()
  ctx.strokeStyle = '#D4D4D8'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(PAD, y)
  ctx.lineTo(W - PAD, y)
  ctx.stroke()
  ctx.restore()
  y += 16

  if (showQrCode && qrPosition === 'FOOTER_CENTER') {
    if (footerNotice) {
      ctx.direction = 'rtl'
      ctx.textAlign = 'center'
      ctx.fillStyle = '#71717A'
      ctx.font = `500 10px ${fontMain}`
      ctx.fillText(truncateText(ctx, footerNotice, contentW), W / 2, y + 6)
      y += 22
    }
    if (qrImg) {
      const qSize = 58
      ctx.fillStyle = '#FAFAFA'
      ctx.strokeStyle = '#E4E4E7'
      drawRoundedRect(ctx, (W - qSize - 6) / 2, y, qSize + 6, qSize + 6, 6)
      ctx.fill()
      ctx.stroke()
      ctx.drawImage(qrImg, (W - qSize) / 2, y + 3, qSize, qSize)
      y += qSize + 14
    }
    ctx.direction = 'rtl'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#A1A1AA'
    ctx.font = `500 8.5px ${fontMain}`
    ctx.fillText('فاتورة إلكترونية معتمدة', W / 2, y + 4)
    y += 18
  } else {
    const rowStart = y
    if (footerNotice) {
      ctx.direction = 'rtl'
      ctx.textAlign = 'right'
      ctx.fillStyle = '#71717A'
      ctx.font = `500 10px ${fontMain}`
      ctx.fillText(truncateText(ctx, footerNotice, contentW - 86), W - PAD, rowStart + 26)
    }
    if (showQrCode && qrPosition !== 'HEADER_RIGHT' && qrImg) {
      const qSize = 56
      ctx.fillStyle = '#FAFAFA'
      ctx.strokeStyle = '#E4E4E7'
      drawRoundedRect(ctx, PAD, rowStart, qSize + 6, qSize + 6, 6)
      ctx.fill()
      ctx.stroke()
      ctx.drawImage(qrImg, PAD + 3, rowStart + 3, qSize, qSize)

      ctx.direction = 'rtl'
      ctx.textAlign = 'center'
      ctx.fillStyle = '#A1A1AA'
      ctx.font = `500 8px ${fontMain}`
      ctx.fillText('فاتورة إلكترونية معتمدة', PAD + (qSize + 6) / 2, rowStart + qSize + 14)
      y = rowStart + qSize + 24
    } else {
      y = rowStart + 34
    }
  }

  // ── 8. Printable Barcode at Bottom ──
  if (showBarcode) {
    ctx.strokeStyle = '#F4F4F5'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(PAD, y)
    ctx.lineTo(W - PAD, y)
    ctx.stroke()
    y += 10

    drawVectorBarcode(ctx, invoice.invoiceNumber || 'INVOICE', W / 2, y, 160, 26)
    y += 38
    ctx.direction = 'ltr'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#A1A1AA'
    ctx.font = `500 9px ${fontMono}`
    ctx.fillText(`*${invoice.invoiceNumber}*`, W / 2, y)
  }

  // Subtle outer frame border
  ctx.strokeStyle = '#E4E4E7'
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1)

  const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.94)
  const jpegBytes = dataUrlToUint8Array(jpegDataUrl)
  const pdfBytes = buildPdfFromJpeg(jpegBytes, canvas.width, canvas.height, isThermal ? 380 : 560)
  return uint8ToBase64(pdfBytes)
}
