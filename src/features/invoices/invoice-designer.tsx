import * as React from 'react'
import {
  Palette,
  Eye,
  Save,
  Building2,
  QrCode,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { LanguageSwitch } from '@/components/language-switch'
import { useSaaSStore } from '@/lib/saas-store'
import {
  InvoiceLayoutStyle,
  InvoicePaperSize,
} from '@/types/saas'
import { toast } from 'sonner'

const COLOR_PRESETS = [
  { name: 'Indigo', value: '#4F46E5', class: 'bg-[#4F46E5]' },
  { name: 'Emerald', value: '#059669', class: 'bg-[#059669]' },
  { name: 'Sky Blue', value: '#0284C7', class: 'bg-[#0284C7]' },
  { name: 'Rose', value: '#E11D48', class: 'bg-[#E11D48]' },
  { name: 'Amber', value: '#D97706', class: 'bg-[#D97706]' },
  { name: 'Dark Slate', value: '#1E293B', class: 'bg-[#1E293B]' },
]

export function InvoiceDesigner() {
  const {
    currentUser,
    merchants,
    branches,
    fetchInvoiceTemplate,
    updateInvoiceTemplate,
  } = useSaaSStore()

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN'
  const merchantId = currentUser.merchantId || merchants[0]?.id || ''
  const [selectedMerchantId, setSelectedMerchantId] = React.useState(merchantId)

  const currentMerchant = merchants.find((m) => m.id === selectedMerchantId)
  const currentBranch = branches.find((b) => b.merchantId === selectedMerchantId) || branches[0]

  // Form State
  const [templateName, setTemplateName] = React.useState('Standard Invoice')
  const [layoutStyle, setLayoutStyle] = React.useState<InvoiceLayoutStyle>('MODERN')
  const [paperSize, setPaperSize] = React.useState<InvoicePaperSize>('A4')
  const [primaryColor, setPrimaryColor] = React.useState('#4F46E5')
  const [businessName, setBusinessName] = React.useState('')
  const [logoUrl, setLogoUrl] = React.useState('')
  const [showLogo, setShowLogo] = React.useState(true)
  const [taxNumber, setTaxNumber] = React.useState('')
  const [commercialReg, setCommercialReg] = React.useState('')
  const [headerNotice, setHeaderNotice] = React.useState('')
  const [footerNotice, setFooterNotice] = React.useState('')
  const [showQrCode, setShowQrCode] = React.useState(true)
  const [showTaxDetails, setShowTaxDetails] = React.useState(true)
  const [showBranchInfo, setShowBranchInfo] = React.useState(true)
  const [showCashierName, setShowCashierName] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)

  // Load template on mount or merchant change
  React.useEffect(() => {
    fetchInvoiceTemplate(selectedMerchantId).then((tpl) => {
      if (tpl) {
        setTemplateName(tpl.templateName || 'Standard Invoice')
        setLayoutStyle(tpl.layoutStyle || 'MODERN')
        setPaperSize(tpl.paperSize || 'A4')
        setPrimaryColor(tpl.primaryColor || '#4F46E5')
        setBusinessName(tpl.businessName || currentMerchant?.name || '')
        setLogoUrl(tpl.logoUrl || currentMerchant?.logo || '')
        setShowLogo(tpl.showLogo !== undefined ? tpl.showLogo : true)
        setTaxNumber(tpl.taxNumber || '300012345678901')
        setCommercialReg(tpl.commercialReg || '1010203040')
        setHeaderNotice(tpl.headerNotice || 'Thank you for your business!')
        setFooterNotice(
          tpl.footerNotice ||
            'Goods can be exchanged or returned within 14 days with the original receipt.'
        )
        setShowQrCode(tpl.showQrCode !== undefined ? tpl.showQrCode : true)
        setShowTaxDetails(tpl.showTaxDetails !== undefined ? tpl.showTaxDetails : true)
        setShowBranchInfo(tpl.showBranchInfo !== undefined ? tpl.showBranchInfo : true)
        setShowCashierName(tpl.showCashierName !== undefined ? tpl.showCashierName : true)
      } else if (currentMerchant) {
        setBusinessName(currentMerchant.name)
        setLogoUrl(currentMerchant.logo || '')
      }
    })
  }, [selectedMerchantId, fetchInvoiceTemplate, currentMerchant])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateInvoiceTemplate({
        merchantId: selectedMerchantId,
        templateName,
        layoutStyle,
        paperSize,
        primaryColor,
        businessName: businessName.trim(),
        logoUrl: logoUrl.trim(),
        showLogo,
        taxNumber: taxNumber.trim(),
        commercialReg: commercialReg.trim(),
        headerNotice: headerNotice.trim(),
        footerNotice: footerNotice.trim(),
        showQrCode,
        showTaxDetails,
        showBranchInfo,
        showCashierName,
      })
      toast.success('Invoice template saved successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save template')
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetDefaults = () => {
    setLayoutStyle('MODERN')
    setPaperSize('A4')
    setPrimaryColor('#4F46E5')
    setBusinessName(currentMerchant?.name || 'My Store')
    setLogoUrl(currentMerchant?.logo || '')
    setShowLogo(true)
    setTaxNumber('300012345678901')
    setCommercialReg('1010203040')
    setHeaderNotice('Thank you for your business!')
    setFooterNotice('Goods can be exchanged or returned within 14 days with the original receipt.')
    setShowQrCode(true)
    setShowTaxDetails(true)
    setShowBranchInfo(true)
    setShowCashierName(true)
    toast.info('Template reset to default settings')
  }

  // Sample items for preview
  const sampleItems = [
    { name: 'Wireless Bluetooth Earbuds Pro', qty: 1, price: 850.0, total: 850.0 },
    { name: 'Organic Colombian Coffee 500g', qty: 2, price: 125.0, total: 250.0 },
    { name: 'Fast Charging USB-C Cable 2M', qty: 1, price: 95.0, total: 95.0 },
  ]
  const sampleSubtotal = 1195.0
  const sampleTax = showTaxDetails ? sampleSubtotal * 0.14 : 0
  const sampleGrandTotal = sampleSubtotal + sampleTax

  return (
    <>
      <Header fixed>
        <div className='flex items-center gap-2'>
          <h1 className='font-semibold text-sm'>
            {isSuperAdmin ? 'Platform Super Admin' : 'Store Management'}
          </h1>
          <Badge
            variant='outline'
            className='text-xs bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 border-indigo-200/50'
          >
            Invoice Designer
          </Badge>
        </div>
        <div className='ms-auto flex items-center gap-2'>
          <LanguageSwitch />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='space-y-6'>
        {/* Top Control Bar */}
        <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3'>
          <div>
            <h2 className='text-xl font-bold tracking-tight'>Invoice Template Designer</h2>
            <p className='text-xs text-muted-foreground mt-0.5'>
              Customize your store invoice layout, branding, tax numbers, and footer notices with live preview.
            </p>
          </div>
          <div className='flex items-center gap-2 shrink-0'>
            <Button variant='outline' size='sm' onClick={handleResetDefaults} className='gap-1.5'>
              <RotateCcw className='size-3.5' />
              Reset Defaults
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className='gap-2'>
              <Save className='size-4' />
              {isSaving ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </div>

        {/* Merchant Scope Selector for Super Admin */}
        {isSuperAdmin && merchants.length > 0 && (
          <Card className='p-3.5 border-border/60 bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'>
            <div className='flex items-center gap-2 text-sm'>
              <Building2 className='size-4 text-primary' />
              <span className='font-semibold'>Customizing invoice for merchant:</span>
            </div>
            <div className='w-full sm:w-72'>
              <Select
                value={selectedMerchantId}
                onValueChange={(val) => setSelectedMerchantId(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select Merchant' />
                </SelectTrigger>
                <SelectContent>
                  {merchants.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>
        )}

        {/* Editor Grid: Left Controls (5 cols) / Right Preview (7 cols) */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
          {/* Controls Column */}
          <div className='lg:col-span-5 space-y-5'>
            {/* Design & Layout */}
            <Card className='p-4 border-border/60 space-y-4'>
              <div className='flex items-center gap-2 text-sm font-bold border-b pb-2 text-foreground'>
                <Palette className='size-4 text-primary' />
                <span>Layout & Visual Style</span>
              </div>

              {/* Layout Mode */}
              <div className='space-y-1.5'>
                <Label className='text-xs font-semibold'>Layout Style</Label>
                <div className='grid grid-cols-3 gap-2'>
                  <Button
                    type='button'
                    variant={layoutStyle === 'MODERN' ? 'default' : 'outline'}
                    size='sm'
                    className='text-xs font-semibold h-9'
                    onClick={() => setLayoutStyle('MODERN')}
                  >
                    Modern
                  </Button>
                  <Button
                    type='button'
                    variant={layoutStyle === 'CLASSIC' ? 'default' : 'outline'}
                    size='sm'
                    className='text-xs font-semibold h-9'
                    onClick={() => setLayoutStyle('CLASSIC')}
                  >
                    Classic
                  </Button>
                  <Button
                    type='button'
                    variant={layoutStyle === 'THERMAL_POS' ? 'default' : 'outline'}
                    size='sm'
                    className='text-xs font-semibold h-9'
                    onClick={() => {
                      setLayoutStyle('THERMAL_POS')
                      setPaperSize('80MM')
                    }}
                  >
                    POS 80mm
                  </Button>
                </div>
              </div>

              {/* Paper Size */}
              <div className='space-y-1.5'>
                <Label className='text-xs font-semibold'>Paper Format</Label>
                <Select
                  value={paperSize}
                  onValueChange={(val) => setPaperSize(val as InvoicePaperSize)}
                >
                  <SelectTrigger className='h-9 text-xs'>
                    <SelectValue placeholder='Select paper size' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='A4'>Standard A4 Sheet (Office / Laser)</SelectItem>
                    <SelectItem value='80MM'>80mm Receipt Roll (Thermal POS)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Primary Color Palette */}
              <div className='space-y-1.5'>
                <Label className='text-xs font-semibold'>Brand Primary Color</Label>
                <div className='flex items-center gap-2'>
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color.value}
                      type='button'
                      onClick={() => setPrimaryColor(color.value)}
                      className={`size-7 rounded-full transition-transform flex items-center justify-center ${
                        color.class
                      } ${
                        primaryColor === color.value
                          ? 'ring-2 ring-primary ring-offset-2 scale-110'
                          : 'hover:scale-105'
                      }`}
                      title={color.name}
                    >
                      {primaryColor === color.value && (
                        <Check className='size-3.5 text-white' />
                      )}
                    </button>
                  ))}
                  <div className='relative ml-auto flex items-center gap-1.5'>
                    <input
                      type='color'
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className='size-7 rounded-md cursor-pointer border'
                    />
                    <span className='text-[11px] font-mono text-muted-foreground uppercase'>
                      {primaryColor}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Merchant / Business Info */}
            <Card className='p-4 border-border/60 space-y-3.5'>
              <div className='flex items-center gap-2 text-sm font-bold border-b pb-2 text-foreground'>
                <Building2 className='size-4 text-primary' />
                <span>Store & Tax Identity</span>
              </div>

              <div>
                <Label className='text-xs'>Store / Brand Name</Label>
                <Input
                  className='h-8.5 text-xs mt-1'
                  placeholder='e.g., Al-Baraka Supermarket'
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>

              <div>
                <Label className='text-xs'>Logo URL</Label>
                <Input
                  className='h-8.5 text-xs mt-1'
                  placeholder='https://...'
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                />
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <Label className='text-xs'>Tax ID (الرقم الضريبي)</Label>
                  <Input
                    className='h-8.5 text-xs mt-1 font-mono'
                    placeholder='300012345678901'
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                  />
                </div>
                <div>
                  <Label className='text-xs'>Commercial Reg (السجل)</Label>
                  <Input
                    className='h-8.5 text-xs mt-1 font-mono'
                    placeholder='1010203040'
                    value={commercialReg}
                    onChange={(e) => setCommercialReg(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label className='text-xs'>Header Notice / Slogan</Label>
                <Input
                  className='h-8.5 text-xs mt-1'
                  placeholder='e.g., Welcome to our store!'
                  value={headerNotice}
                  onChange={(e) => setHeaderNotice(e.target.value)}
                />
              </div>

              <div>
                <Label className='text-xs'>Terms, Conditions & Return Policy</Label>
                <Textarea
                  rows={2}
                  className='text-xs mt-1'
                  placeholder='Return & exchange policy details...'
                  value={footerNotice}
                  onChange={(e) => setFooterNotice(e.target.value)}
                />
              </div>
            </Card>

            {/* Display Toggles */}
            <Card className='p-4 border-border/60 space-y-3'>
              <div className='flex items-center gap-2 text-sm font-bold border-b pb-2 text-foreground'>
                <Eye className='size-4 text-primary' />
                <span>Invoice Elements Visibility</span>
              </div>

              <div className='flex items-center justify-between text-xs py-1'>
                <Label htmlFor='toggle-logo' className='cursor-pointer'>
                  Show Store Logo
                </Label>
                <Switch
                  id='toggle-logo'
                  checked={showLogo}
                  onCheckedChange={setShowLogo}
                />
              </div>

              <div className='flex items-center justify-between text-xs py-1'>
                <Label htmlFor='toggle-qr' className='cursor-pointer'>
                  Show QR Verification Code (ZATCA compliant)
                </Label>
                <Switch
                  id='toggle-qr'
                  checked={showQrCode}
                  onCheckedChange={setShowQrCode}
                />
              </div>

              <div className='flex items-center justify-between text-xs py-1'>
                <Label htmlFor='toggle-tax' className='cursor-pointer'>
                  Show Tax & Fee Breakdown Table
                </Label>
                <Switch
                  id='toggle-tax'
                  checked={showTaxDetails}
                  onCheckedChange={setShowTaxDetails}
                />
              </div>

              <div className='flex items-center justify-between text-xs py-1'>
                <Label htmlFor='toggle-branch' className='cursor-pointer'>
                  Show Branch Address & Contact
                </Label>
                <Switch
                  id='toggle-branch'
                  checked={showBranchInfo}
                  onCheckedChange={setShowBranchInfo}
                />
              </div>

              <div className='flex items-center justify-between text-xs py-1'>
                <Label htmlFor='toggle-cashier' className='cursor-pointer'>
                  Show Cashier / Staff Operator Name
                </Label>
                <Switch
                  id='toggle-cashier'
                  checked={showCashierName}
                  onCheckedChange={setShowCashierName}
                />
              </div>
            </Card>
          </div>

          {/* Live Preview Column */}
          <div className='lg:col-span-7 sticky top-20'>
            <div className='flex items-center justify-between mb-2'>
              <div className='flex items-center gap-2 text-xs font-semibold text-muted-foreground'>
                <Sparkles className='size-4 text-primary' />
                <span>Real-Time Invoice Preview ({layoutStyle} - {paperSize})</span>
              </div>
              <Badge variant='secondary' className='text-[10px]'>
                Interactive Sample
              </Badge>
            </div>

            {/* Paper Preview Container */}
            <div className='rounded-2xl border border-border/80 bg-muted/40 p-4 sm:p-6 shadow-xs flex justify-center overflow-x-auto'>
              <div
                className={`bg-white text-zinc-900 rounded-xl shadow-lg p-6 sm:p-8 transition-all font-sans ${
                  paperSize === '80MM' || layoutStyle === 'THERMAL_POS'
                    ? 'w-full max-w-[360px] text-xs leading-relaxed'
                    : 'w-full max-w-[620px] text-xs'
                }`}
                style={{
                  borderTop: `6px solid ${primaryColor}`,
                }}
              >
                {/* Header */}
                <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 border-zinc-200'>
                  <div className='flex items-center gap-3'>
                    {showLogo && logoUrl && (
                      <img
                        src={logoUrl}
                        alt='Store Logo'
                        className='size-12 object-contain rounded-md border border-zinc-200'
                        onError={(e) => {
                          ;(e.target as HTMLElement).style.display = 'none'
                        }}
                      />
                    )}
                    <div>
                      <h3
                        className='text-base font-bold tracking-tight'
                        style={{ color: primaryColor }}
                      >
                        {businessName || currentMerchant?.name || 'My Store Name'}
                      </h3>
                      {showBranchInfo && currentBranch && (
                        <p className='text-[11px] text-zinc-500'>
                          {currentBranch.name} • {currentBranch.address || 'Cairo, Egypt'}
                        </p>
                      )}
                      {taxNumber && (
                        <p className='text-[10px] text-zinc-500 font-mono'>
                          Tax ID: {taxNumber}
                        </p>
                      )}
                      {commercialReg && (
                        <p className='text-[10px] text-zinc-500 font-mono'>
                          CR: {commercialReg}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Invoice Meta */}
                  <div className='text-left sm:text-right'>
                    <div
                      className='inline-block px-2.5 py-0.5 rounded font-mono font-bold text-xs text-white'
                      style={{ backgroundColor: primaryColor }}
                    >
                      TAX INVOICE
                    </div>
                    <p className='font-mono font-bold text-xs text-zinc-800 mt-1'>
                      #INV-2026-0089
                    </p>
                    <p className='text-[10px] text-zinc-500'>
                      Date: {new Date().toLocaleDateString('en-GB')}
                    </p>
                    {showCashierName && (
                      <p className='text-[10px] text-zinc-500'>Cashier: Sherif A.</p>
                    )}
                  </div>
                </div>

                {/* Header Slogan/Notice */}
                {headerNotice && (
                  <div className='py-2 text-center text-[11px] font-medium text-zinc-600 bg-zinc-50 border-b border-zinc-100'>
                    {headerNotice}
                  </div>
                )}

                {/* Customer Details Box */}
                <div className='my-3 p-2.5 bg-zinc-50 rounded-lg border border-zinc-200/80 flex justify-between items-center text-[11px]'>
                  <div>
                    <span className='text-zinc-500'>Billed To: </span>
                    <span className='font-bold text-zinc-800'>Ahmed Hassan</span>
                    <span className='text-zinc-500 ml-2'>• 01012345678</span>
                  </div>
                  <Badge variant='outline' className='text-[9px] bg-emerald-50 text-emerald-700 border-emerald-300'>
                    PAID (CASH)
                  </Badge>
                </div>

                {/* Items Table */}
                <table className='w-full my-3 border-collapse text-left'>
                  <thead>
                    <tr
                      className='text-[11px] font-bold border-b border-zinc-300'
                      style={{ color: primaryColor }}
                    >
                      <th className='py-1.5'>Item</th>
                      <th className='py-1.5 text-center'>Qty</th>
                      <th className='py-1.5 text-right'>Price</th>
                      <th className='py-1.5 text-right'>Total</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-zinc-100 text-[11px] text-zinc-700'>
                    {sampleItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className='py-1.5 font-medium'>{item.name}</td>
                        <td className='py-1.5 text-center font-mono'>{item.qty}</td>
                        <td className='py-1.5 text-right font-mono'>{item.price.toFixed(2)}</td>
                        <td className='py-1.5 text-right font-mono font-bold'>{item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals Section */}
                <div className='border-t border-zinc-200 pt-3 flex flex-col items-end space-y-1 text-[11px]'>
                  <div className='flex justify-between w-48 text-zinc-600'>
                    <span>Subtotal:</span>
                    <span className='font-mono font-semibold'>{sampleSubtotal.toFixed(2)} EGP</span>
                  </div>
                  {showTaxDetails && (
                    <div className='flex justify-between w-48 text-zinc-600'>
                      <span>VAT (14%):</span>
                      <span className='font-mono font-semibold'>{sampleTax.toFixed(2)} EGP</span>
                    </div>
                  )}
                  <div
                    className='flex justify-between w-48 pt-1.5 border-t border-zinc-300 font-bold text-xs text-zinc-900'
                    style={{ color: primaryColor }}
                  >
                    <span>Grand Total:</span>
                    <span className='font-mono text-sm'>{sampleGrandTotal.toFixed(2)} EGP</span>
                  </div>
                </div>

                {/* Footer with QR Code & Terms */}
                <div className='mt-6 pt-3 border-t border-dashed border-zinc-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left'>
                  {footerNotice && (
                    <p className='text-[10px] text-zinc-500 max-w-xs leading-relaxed'>
                      {footerNotice}
                    </p>
                  )}
                  {showQrCode && (
                    <div className='flex flex-col items-center shrink-0'>
                      <div className='size-14 bg-zinc-100 border border-zinc-300 rounded p-1 flex items-center justify-center'>
                        <QrCode className='size-12 text-zinc-800' />
                      </div>
                      <span className='text-[8px] text-zinc-400 mt-0.5 font-mono'>Verify E-Invoice</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Main>
    </>
  )
}
