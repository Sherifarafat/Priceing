import { Barcode as BarcodeIcon } from 'lucide-react'
import type { Invoice, InvoiceTemplate, Merchant, Branch } from '@/types/saas'

interface CustomizedInvoiceViewProps {
  invoice: Invoice
  template?: InvoiceTemplate | null
  merchant?: Merchant | null
  branch?: Branch | null
  cashierName?: string
  className?: string
  isPrinting?: boolean
}

export function CustomizedInvoiceView({
  invoice,
  template,
  merchant,
  branch,
  cashierName,
  className = '',
  isPrinting: _isPrinting = false,
}: CustomizedInvoiceViewProps) {
  // Extract custom template options or sensible defaults
  const primaryColor = template?.primaryColor || '#09090B'
  const layoutStyle = template?.layoutStyle || 'THERMAL_POS'
  const paperSize = template?.paperSize || '80MM'
  const headerStyle = template?.headerStyle || 'BORDER_TOP'
  const tableStyle = template?.tableStyle || 'STRIPED'
  const borderRadius = template?.borderRadius || 'ROUNDED_MD'
  const fontFamily = template?.fontFamily || 'sans'
  const currencyPosition = template?.currencyPosition || 'AFTER'

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
    const num = val ?? 0
    const formatted = num.toFixed(2)
    return currencyPosition === 'BEFORE' ? `EGP ${formatted}` : `${formatted} EGP`
  }

  const getFontFamilyClass = () => {
    switch (fontFamily) {
      case 'serif':
        return 'font-serif'
      case 'mono':
        return 'font-mono'
      case 'cairo':
        return 'font-sans tracking-wide'
      default:
        return 'font-sans'
    }
  }

  const getBorderRadiusClass = () => {
    switch (borderRadius) {
      case 'ROUNDED_NONE':
        return 'rounded-none'
      case 'ROUNDED_SM':
        return 'rounded-sm'
      case 'ROUNDED_LG':
        return 'rounded-2xl'
      case 'ROUNDED_FULL':
        return 'rounded-3xl'
      case 'ROUNDED_MD':
      default:
        return 'rounded-xl'
    }
  }

  const isThermal = paperSize === '80MM' || layoutStyle === 'THERMAL_POS'
  const invoiceDate = new Date(invoice.issuedAt || invoice.createdAt || Date.now())

  // QR Code data: ZATCA/TLV format or direct link
  const qrPayload = encodeURIComponent(
    `Seller: ${businessName} | Tax: ${taxNumber} | Invoice: ${invoice.invoiceNumber} | Total: ${invoice.grandTotal} | Date: ${invoiceDate.toISOString()}`
  )

  return (
    <div
      className={`relative bg-white text-zinc-900 border border-zinc-200 p-5 sm:p-6 select-none shrink-0 transition-all ${getFontFamilyClass()} ${getBorderRadiusClass()} ${
        isThermal ? 'w-full max-w-[380px] text-xs' : 'w-full max-w-[620px] text-xs'
      } ${className}`}
    >
      {/* Optional Watermark */}
      {showWatermark && (
        <div className='absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden'>
          <span className='text-zinc-200/70 font-black text-6xl tracking-widest -rotate-45 uppercase border-4 border-dashed border-zinc-200/60 p-4 rounded-xl'>
            {watermarkText}
          </span>
        </div>
      )}

      {/* Header Banner according to headerStyle */}
      {headerStyle === 'BORDER_TOP' && (
        <div
          className='h-1.5 -mx-5 -mt-5 sm:-mx-6 sm:-mt-6 mb-4'
          style={{ backgroundColor: primaryColor }}
        />
      )}

      {headerStyle === 'SOLID_BANNER' && (
        <div
          className='-mx-5 -mt-5 sm:-mx-6 sm:-mt-6 p-4 mb-4 text-white flex items-center justify-between'
          style={{ backgroundColor: primaryColor }}
        >
          <div>
            <h3 className='font-bold text-base leading-tight'>{businessName}</h3>
            <p className='text-[10px] text-white/80'>فاتورة ضريبية مبسطة</p>
          </div>
          <span className='font-mono font-bold text-xs bg-white/20 px-2 py-0.5 rounded'>
            #{invoice.invoiceNumber}
          </span>
        </div>
      )}

      {headerStyle === 'SUBTLE_TINT' && (
        <div
          className='-mx-5 -mt-5 sm:-mx-6 sm:-mt-6 p-4 mb-4 border-b flex items-center justify-between'
          style={{ backgroundColor: `${primaryColor}12` }}
        >
          <div>
            <h3 className='font-bold text-base' style={{ color: primaryColor }}>
              {businessName}
            </h3>
            <p className='text-[10px] text-zinc-500'>فاتورة مبيعات إلكترونية</p>
          </div>
          <span
            className='font-mono font-bold text-xs px-2 py-0.5 rounded'
            style={{ color: primaryColor, backgroundColor: `${primaryColor}25` }}
          >
            #{invoice.invoiceNumber}
          </span>
        </div>
      )}

      {/* Main Header Info (if not solid banner or subtle tint) */}
      {headerStyle !== 'SOLID_BANNER' && headerStyle !== 'SUBTLE_TINT' && (
        <div className='flex items-start justify-between border-b pb-3.5 border-zinc-200 gap-3'>
          <div className='flex items-center gap-3'>
            {showLogo && (
              <img
                src={logoUrl}
                alt='Logo'
                className='size-11 object-contain rounded border border-zinc-200'
                onError={(e) => {
                  ;(e.target as HTMLElement).style.display = 'none'
                }}
              />
            )}
            <div>
              <h3 className='text-base font-bold' style={{ color: primaryColor }}>
                {businessName}
              </h3>
              {showBranchInfo && branch && (
                <p className='text-[10px] text-zinc-500'>
                  {branch.name} {branch.address ? `• ${branch.address}` : ''}
                </p>
              )}
              {taxNumber && (
                <p className='text-[9px] text-zinc-500 font-mono'>الرقم الضريبي: {taxNumber}</p>
              )}
            </div>
          </div>

          <div className='text-right shrink-0'>
            <div
              className='inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white'
              style={{ backgroundColor: primaryColor }}
            >
              فاتورة ضريبية
            </div>
            <p className='font-mono font-bold text-xs mt-1'>#{invoice.invoiceNumber}</p>
            <p className='text-[9px] text-zinc-400 font-mono'>
              {invoiceDate.toLocaleDateString('ar-EG')} {invoiceDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
            </p>
            {showQrCode && qrPosition === 'HEADER_RIGHT' && (
              <div className='size-12 bg-zinc-50 border p-0.5 mt-1 ml-auto flex items-center justify-center rounded'>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrPayload}`}
                  alt='ZATCA QR'
                  className='size-10'
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header Notice / Welcome */}
      {headerNotice && (
        <div className='py-1.5 text-center text-[10px] font-medium text-zinc-600 bg-zinc-50 border-b border-zinc-100 my-2 rounded'>
          {headerNotice}
        </div>
      )}

      {/* Billed To & Cashier Details */}
      <div className='my-2.5 p-2 bg-zinc-50 rounded border border-zinc-200 text-[10px] flex justify-between items-center'>
        <div>
          <span className='text-zinc-400'>العميل: </span>
          <span className='font-bold text-zinc-800'>
            {invoice.customerName || 'عميل نقدي (Walk-in)'}
          </span>
          {invoice.customerPhone && (
            <span className='text-zinc-400 ml-1.5 font-mono'>• {invoice.customerPhone}</span>
          )}
        </div>
        <div className='flex items-center gap-2'>
          {showCashierName && (
            <span className='text-zinc-500 font-medium'>
              الكاشير: {cashierName || 'محمد أحمد'}
            </span>
          )}
          <span className='text-zinc-400 font-mono'>({invoice.paymentMethod})</span>
        </div>
      </div>

      {/* Items Table */}
      <div className='w-full overflow-x-auto'>
        <table className='w-full my-2.5 border-collapse text-right text-[11px]'>
          <thead>
            <tr
              className={`text-[10px] font-bold ${
                tableStyle === 'GRID'
                  ? 'border border-zinc-300 bg-zinc-100'
                  : 'border-b border-zinc-300'
              }`}
              style={{ color: primaryColor }}
            >
              <th className='py-1.5 px-2 text-right'>الصنف</th>
              <th className='py-1.5 px-2 text-center'>الكمية</th>
              <th className='py-1.5 px-2 text-left'>السعر</th>
              <th className='py-1.5 px-2 text-left'>الإجمالي</th>
            </tr>
          </thead>
          <tbody
            className={
              tableStyle === 'STRIPED'
                ? 'divide-y divide-zinc-100 text-zinc-700'
                : tableStyle === 'GRID'
                ? 'border border-zinc-300 divide-y divide-zinc-200 text-zinc-700'
                : 'divide-y divide-zinc-100 text-zinc-700'
            }
          >
            {(invoice.items || []).map((item, idx) => {
              const itemName = item.productName || (item as any).name || 'منتج'
              const unitPrice = item.unitPrice ?? 0
              const qty = item.quantity ?? 1
              const total = item.totalPrice ?? (item as any).total ?? qty * unitPrice
              return (
                <tr
                  key={idx}
                  className={
                    tableStyle === 'STRIPED' && idx % 2 === 1 ? 'bg-zinc-50/70' : ''
                  }
                >
                  <td className='py-1 px-2 font-medium'>
                    <div className='truncate max-w-[150px]'>{itemName}</div>
                    {item.barcode && (
                      <div className='text-[8px] text-zinc-400 font-mono'>{item.barcode}</div>
                    )}
                  </td>
                  <td className='py-1 px-2 text-center font-mono'>{qty}</td>
                  <td className='py-1 px-2 text-left font-mono'>{formatPrice(unitPrice)}</td>
                  <td className='py-1 px-2 text-left font-mono font-bold'>
                    {formatPrice(total)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Summary / Totals */}
      <div className='border-t border-zinc-200 pt-2 flex flex-col items-start space-y-1 text-[10px]'>
        <div className='flex justify-between w-full sm:w-48 text-zinc-600'>
          <span>المجموع الفرعي:</span>
          <span className='font-mono font-semibold'>{formatPrice(invoice.subtotal)}</span>
        </div>
        {showTaxDetails && (
          <div className='flex justify-between w-full sm:w-48 text-zinc-600'>
            <span>ضريبة القيمة المضافة (14%):</span>
            <span className='font-mono font-semibold'>{formatPrice(invoice.taxTotal)}</span>
          </div>
        )}
        <div
          className='flex justify-between w-full sm:w-48 pt-1 border-t border-zinc-300 font-bold text-xs'
          style={{ color: primaryColor }}
        >
          <span>الإجمالي النهائي:</span>
          <span className='font-mono text-sm font-black'>{formatPrice(invoice.grandTotal)}</span>
        </div>
      </div>

      {/* Footer Notes & QR & Barcode */}
      <div className='mt-4 pt-3 border-t border-dashed border-zinc-300 flex flex-col gap-2'>
        <div
          className={`flex items-center justify-between text-[9px] text-zinc-500 gap-2 ${
            qrPosition === 'FOOTER_CENTER' ? 'flex-col text-center' : ''
          }`}
        >
          {footerNotice && (
            <p className='max-w-[260px] leading-relaxed'>{footerNotice}</p>
          )}
          {showQrCode && qrPosition !== 'HEADER_RIGHT' && (
            <div className='flex flex-col items-center shrink-0'>
              <div className='size-14 bg-zinc-50 border p-0.5 rounded flex items-center justify-center'>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${qrPayload}`}
                  alt='ZATCA QR'
                  className='size-12'
                />
              </div>
              <span className='text-[7px] text-zinc-400 mt-0.5 font-mono'>
                فاتورة إلكترونية معتمدة
              </span>
            </div>
          )}
        </div>

        {/* Printable Barcode */}
        {showBarcode && (
          <div className='pt-2 flex flex-col items-center justify-center border-t border-zinc-100'>
            <div className='flex items-center gap-1 text-zinc-700 opacity-80'>
              <BarcodeIcon className='h-6 w-36' />
            </div>
            <span className='text-[8px] font-mono text-zinc-400 tracking-widest'>
              *{invoice.invoiceNumber}*
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
