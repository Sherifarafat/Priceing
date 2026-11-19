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
  Type,
  LayoutGrid,
  Sliders,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Stamp,
  Barcode as BarcodeIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  { name: 'Electric Mint', value: '#3EEA85', class: 'bg-[#3EEA85]' },
  { name: 'Carbon Black', value: '#09090B', class: 'bg-[#09090B]' },
  { name: 'Indigo Corporate', value: '#4F46E5', class: 'bg-[#4F46E5]' },
  { name: 'Emerald Fresh', value: '#059669', class: 'bg-[#059669]' },
  { name: 'Sky Electric', value: '#0284C7', class: 'bg-[#0284C7]' },
  { name: 'Rose Luxury', value: '#E11D48', class: 'bg-[#E11D48]' },
  { name: 'Amber Bakery', value: '#D97706', class: 'bg-[#D97706]' },
  { name: 'Slate Minimal', value: '#1E293B', class: 'bg-[#1E293B]' },
  { name: 'Violet Tech', value: '#7C3AED', class: 'bg-[#7C3AED]' },
  { name: 'Teal Modern', value: '#0D9488', class: 'bg-[#0D9488]' },
]

const DESIGN_PRESETS = [
  {
    name: 'Electric Mint & Carbon (70:30)',
    primaryColor: '#09090B',
    layoutStyle: 'MODERN' as InvoiceLayoutStyle,
    headerStyle: 'BORDER_TOP',
    tableStyle: 'STRIPED',
    borderRadius: 'ROUNDED_MD',
    fontFamily: 'sans',
  },
  {
    name: 'Modern Indigo',
    primaryColor: '#4F46E5',
    layoutStyle: 'MODERN' as InvoiceLayoutStyle,
    headerStyle: 'BORDER_TOP',
    tableStyle: 'STRIPED',
    borderRadius: 'ROUNDED_MD',
    fontFamily: 'sans',
  },
  {
    name: 'Classic Corporate',
    primaryColor: '#1E293B',
    layoutStyle: 'CLASSIC' as InvoiceLayoutStyle,
    headerStyle: 'SOLID_BANNER',
    tableStyle: 'GRID',
    borderRadius: 'ROUNDED_NONE',
    fontFamily: 'serif',
  },
  {
    name: 'Emerald Minimal',
    primaryColor: '#059669',
    layoutStyle: 'MODERN' as InvoiceLayoutStyle,
    headerStyle: 'SUBTLE_TINT',
    tableStyle: 'MINIMAL',
    borderRadius: 'ROUNDED_LG',
    fontFamily: 'cairo',
  },
  {
    name: 'Thermal Receipt 80mm',
    primaryColor: '#18181B',
    layoutStyle: 'THERMAL_POS' as InvoiceLayoutStyle,
    headerStyle: 'MINIMAL',
    tableStyle: 'MINIMAL',
    borderRadius: 'ROUNDED_NONE',
    fontFamily: 'mono',
  },
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
  const [accentColor, setAccentColor] = React.useState('#10B981')
  const [fontFamily, setFontFamily] = React.useState('sans')
  const [headerStyle, setHeaderStyle] = React.useState('BORDER_TOP')
  const [tableStyle, setTableStyle] = React.useState('STRIPED')
  const [borderRadius, setBorderRadius] = React.useState('ROUNDED_MD')
  const [currencyPosition, setCurrencyPosition] = React.useState('AFTER')

  // Business Info
  const [businessName, setBusinessName] = React.useState('')
  const [logoUrl, setLogoUrl] = React.useState('')
  const [showLogo, setShowLogo] = React.useState(true)
  const [taxNumber, setTaxNumber] = React.useState('')
  const [commercialReg, setCommercialReg] = React.useState('')
  const [headerNotice, setHeaderNotice] = React.useState('')
  const [footerNotice, setFooterNotice] = React.useState('')

  // Toggles & Details
  const [showQrCode, setShowQrCode] = React.useState(true)
  const [qrPosition, setQrPosition] = React.useState('FOOTER_RIGHT')
  const [showTaxDetails, setShowTaxDetails] = React.useState(true)
  const [showBranchInfo, setShowBranchInfo] = React.useState(true)
  const [showCashierName, setShowCashierName] = React.useState(true)
  const [showBarcode, setShowBarcode] = React.useState(true)
  const [showWatermark, setShowWatermark] = React.useState(false)
  const [watermarkText, setWatermarkText] = React.useState('PAID')

  // Preview zoom scale
  const [previewScale, setPreviewScale] = React.useState<number>(0.85)
  const [isSaving, setIsSaving] = React.useState(false)

  // Load template on mount or merchant change
  React.useEffect(() => {
    fetchInvoiceTemplate(selectedMerchantId).then((tpl) => {
      if (tpl) {
        setTemplateName(tpl.templateName || 'Standard Invoice')
        setLayoutStyle(tpl.layoutStyle || 'MODERN')
        setPaperSize(tpl.paperSize || 'A4')
        setPrimaryColor(tpl.primaryColor || '#4F46E5')
        setAccentColor(tpl.accentColor || '#10B981')
        setFontFamily(tpl.fontFamily || 'sans')
        setHeaderStyle(tpl.headerStyle || 'BORDER_TOP')
        setTableStyle(tpl.tableStyle || 'STRIPED')
        setBorderRadius(tpl.borderRadius || 'ROUNDED_MD')
        setCurrencyPosition(tpl.currencyPosition || 'AFTER')
        setBusinessName(tpl.businessName || currentMerchant?.name || '')
        setLogoUrl(tpl.logoUrl || currentMerchant?.logo || '')
        setShowLogo(tpl.showLogo !== undefined ? tpl.showLogo : true)
        setTaxNumber(tpl.taxNumber || '300012345678901')
        setCommercialReg(tpl.commercialReg || '1010203040')
        setHeaderNotice(tpl.headerNotice || 'Thank you for your business!')
        setFooterNotice(
          tpl.footerNotice ||
            'Goods can be exchanged or returned within 14 days with original receipt.'
        )
        setShowQrCode(tpl.showQrCode !== undefined ? tpl.showQrCode : true)
        setQrPosition(tpl.qrPosition || 'FOOTER_RIGHT')
        setShowTaxDetails(tpl.showTaxDetails !== undefined ? tpl.showTaxDetails : true)
        setShowBranchInfo(tpl.showBranchInfo !== undefined ? tpl.showBranchInfo : true)
        setShowCashierName(tpl.showCashierName !== undefined ? tpl.showCashierName : true)
        setShowBarcode(tpl.showBarcode !== undefined ? tpl.showBarcode : true)
        setShowWatermark(tpl.showWatermark !== undefined ? tpl.showWatermark : false)
        setWatermarkText(tpl.watermarkText || 'PAID')
      } else if (currentMerchant) {
        setBusinessName(currentMerchant.name)
        setLogoUrl(currentMerchant.logo || '')
      }
    })
  }, [selectedMerchantId, fetchInvoiceTemplate, currentMerchant])

  const handleApplyPreset = (preset: typeof DESIGN_PRESETS[0]) => {
    setPrimaryColor(preset.primaryColor)
    setLayoutStyle(preset.layoutStyle)
    setHeaderStyle(preset.headerStyle)
    setTableStyle(preset.tableStyle)
    setBorderRadius(preset.borderRadius)
    setFontFamily(preset.fontFamily)
    if (preset.layoutStyle === 'THERMAL_POS') {
      setPaperSize('80MM')
    }
    toast.success(`Preset "${preset.name}" applied`)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateInvoiceTemplate({
        merchantId: selectedMerchantId,
        templateName,
        layoutStyle,
        paperSize,
        primaryColor,
        accentColor,
        fontFamily,
        headerStyle,
        tableStyle,
        borderRadius,
        currencyPosition,
        businessName: businessName.trim(),
        logoUrl: logoUrl.trim(),
        showLogo,
        taxNumber: taxNumber.trim(),
        commercialReg: commercialReg.trim(),
        headerNotice: headerNotice.trim(),
        footerNotice: footerNotice.trim(),
        showQrCode,
        qrPosition,
        showTaxDetails,
        showBranchInfo,
        showCashierName,
        showBarcode,
        showWatermark,
        watermarkText: watermarkText.trim(),
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
    setAccentColor('#10B981')
    setFontFamily('sans')
    setHeaderStyle('BORDER_TOP')
    setTableStyle('STRIPED')
    setBorderRadius('ROUNDED_MD')
    setCurrencyPosition('AFTER')
    setBusinessName(currentMerchant?.name || 'My Store')
    setLogoUrl(currentMerchant?.logo || '')
    setShowLogo(true)
    setTaxNumber('300012345678901')
    setCommercialReg('1010203040')
    setHeaderNotice('Thank you for your business!')
    setFooterNotice('Goods can be exchanged or returned within 14 days with original receipt.')
    setShowQrCode(true)
    setQrPosition('FOOTER_RIGHT')
    setShowTaxDetails(true)
    setShowBranchInfo(true)
    setShowCashierName(true)
    setShowBarcode(true)
    setShowWatermark(false)
    setWatermarkText('PAID')
    toast.info('Template reset to default settings')
  }

  // Sample data for preview
  const sampleItems = [
    { name: 'Wireless Bluetooth Earbuds Pro', qty: 1, price: 850.0, total: 850.0, barcode: '622100012345' },
    { name: 'Organic Colombian Coffee 500g', qty: 2, price: 125.0, total: 250.0, barcode: '622100067890' },
    { name: 'Fast Charging USB-C Cable 2M', qty: 1, price: 95.0, total: 95.0, barcode: '622100034567' },
  ]
  const sampleSubtotal = 1195.0
  const sampleTax = showTaxDetails ? sampleSubtotal * 0.14 : 0
  const sampleGrandTotal = sampleSubtotal + sampleTax

  const formatPrice = (val: number) => {
    const formatted = val.toFixed(2)
    return currencyPosition === 'BEFORE' ? `EGP ${formatted}` : `${formatted} EGP`
  }

  // Font family class
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

  // Border radius style
  const getBorderRadiusClass = () => {
    switch (borderRadius) {
      case 'ROUNDED_NONE':
        return 'rounded-none'
      case 'ROUNDED_LG':
        return 'rounded-2xl'
      default:
        return 'rounded-xl'
    }
  }

  return (
    <div className='flex flex-col h-screen overflow-hidden bg-background'>
      <Header fixed>
        <div className='flex items-center gap-2'>
          <h1 className='font-semibold text-sm'>
            {isSuperAdmin ? 'Platform Super Admin' : 'Store Management'}
          </h1>
          <Badge
            variant='outline'
            className='text-xs bg-emerald-500/10 text-emerald-600 dark:text-[#3EEA85] border-emerald-500/20'
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

      {/* Main Single-View Studio Container */}
      <Main className='flex-1 flex flex-col p-4 md:p-6 overflow-hidden'>
        {/* Top Control Bar */}
        <div className='flex items-center justify-between gap-3 pb-3 border-b border-border/60 shrink-0'>
          <div className='flex items-center gap-2'>
            <h2 className='text-lg font-bold tracking-tight'>Live Invoice Studio</h2>
            <Badge variant='outline' className='text-[10px] hidden sm:inline-flex'>
              Single-View Editor
            </Badge>
          </div>

          <div className='flex items-center gap-2'>
            {isSuperAdmin && merchants.length > 0 && (
              <Select
                value={selectedMerchantId}
                onValueChange={(val) => setSelectedMerchantId(val)}
              >
                <SelectTrigger className='h-8 text-xs w-44'>
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
            )}

            <Button
              variant='outline'
              size='sm'
              onClick={handleResetDefaults}
              className='gap-1.5 h-8 text-xs'
            >
              <RotateCcw className='size-3.5' />
              <span className='hidden sm:inline'>Reset Defaults</span>
            </Button>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              size='sm'
              className='gap-1.5 h-8 text-xs font-semibold'
            >
              <Save className='size-3.5' />
              {isSaving ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </div>

        {/* 2-Column Split Workspace (Fixed Height, No Page Scroll) */}
        <div className='flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 pt-3 overflow-hidden'>
          {/* LEFT: Controls Panel with Tabs (Scrolls internally) */}
          <div className='lg:col-span-5 flex flex-col h-full overflow-hidden border border-border/60 rounded-xl bg-card shadow-2xs'>
            <Tabs defaultValue='style' className='flex flex-col h-full'>
              {/* Tab Header Bar */}
              <TabsList className='grid grid-cols-4 p-1 bg-muted/60 rounded-none border-b border-border/60 shrink-0'>
                <TabsTrigger value='style' className='text-xs gap-1 py-1.5'>
                  <Palette className='size-3.5' />
                  <span>Style</span>
                </TabsTrigger>
                <TabsTrigger value='layout' className='text-xs gap-1 py-1.5'>
                  <LayoutGrid className='size-3.5' />
                  <span>Layout</span>
                </TabsTrigger>
                <TabsTrigger value='identity' className='text-xs gap-1 py-1.5'>
                  <Building2 className='size-3.5' />
                  <span>Identity</span>
                </TabsTrigger>
                <TabsTrigger value='toggles' className='text-xs gap-1 py-1.5'>
                  <Sliders className='size-3.5' />
                  <span>Toggles</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab Contents: Scrollable Inside This Container */}
              <div className='flex-1 overflow-y-auto p-4 space-y-4 text-xs'>
                {/* 1. Style & Presets */}
                <TabsContent value='style' className='mt-0 space-y-4'>
                  {/* Quick Theme Presets */}
                  <div className='space-y-1.5'>
                    <Label className='text-xs font-bold flex items-center gap-1.5'>
                      <Sparkles className='size-3.5 text-primary' /> One-Click Theme Presets
                    </Label>
                    <div className='grid grid-cols-2 gap-2'>
                      {DESIGN_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type='button'
                          onClick={() => handleApplyPreset(preset)}
                          className='p-2 rounded-lg border border-border/80 hover:border-primary text-start transition-all hover:bg-muted/40 flex items-center gap-2 group'
                        >
                          <span
                            className='size-3 rounded-full shrink-0'
                            style={{ backgroundColor: preset.primaryColor }}
                          />
                          <span className='font-semibold truncate text-[11px]'>{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Primary Color Palette */}
                  <div className='space-y-1.5 border-t pt-3'>
                    <Label className='text-xs font-semibold'>Primary Brand Color</Label>
                    <div className='flex items-center gap-2 flex-wrap'>
                      {COLOR_PRESETS.map((color) => (
                        <button
                          key={color.value}
                          type='button'
                          onClick={() => setPrimaryColor(color.value)}
                          className={`size-6 rounded-full transition-transform flex items-center justify-center ${
                            color.class
                          } ${
                            primaryColor === color.value
                              ? 'ring-2 ring-primary ring-offset-2 scale-110'
                              : 'hover:scale-105'
                          }`}
                          title={color.name}
                        >
                          {primaryColor === color.value && (
                            <Check className='size-3 text-white' />
                          )}
                        </button>
                      ))}
                      <div className='flex items-center gap-1 ml-auto'>
                        <input
                          type='color'
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className='size-6 rounded cursor-pointer border'
                        />
                        <span className='font-mono text-[10px] uppercase text-muted-foreground'>
                          {primaryColor}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Header Banner Style */}
                  <div className='space-y-1.5 border-t pt-3'>
                    <Label className='text-xs font-semibold'>Header Banner Styling</Label>
                    <div className='grid grid-cols-2 gap-2'>
                      {[
                        { id: 'BORDER_TOP', label: 'Top Colored Stripe' },
                        { id: 'SOLID_BANNER', label: 'Solid Colored Banner' },
                        { id: 'SUBTLE_TINT', label: 'Light Pastel Tint' },
                        { id: 'MINIMAL', label: 'Clean Minimalist' },
                      ].map((item) => (
                        <Button
                          key={item.id}
                          type='button'
                          size='sm'
                          variant={headerStyle === item.id ? 'default' : 'outline'}
                          className='h-8 text-[11px] justify-start px-2 font-medium'
                          onClick={() => setHeaderStyle(item.id)}
                        >
                          {item.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Table Styling */}
                  <div className='space-y-1.5 border-t pt-3'>
                    <Label className='text-xs font-semibold'>Items Table Styling</Label>
                    <div className='grid grid-cols-3 gap-2'>
                      {[
                        { id: 'STRIPED', label: 'Zebra Striped' },
                        { id: 'GRID', label: 'Full Grid' },
                        { id: 'MINIMAL', label: 'Minimal Lines' },
                      ].map((item) => (
                        <Button
                          key={item.id}
                          type='button'
                          size='sm'
                          variant={tableStyle === item.id ? 'default' : 'outline'}
                          className='h-8 text-[11px]'
                          onClick={() => setTableStyle(item.id)}
                        >
                          {item.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Corner Roundness */}
                  <div className='space-y-1.5 border-t pt-3'>
                    <Label className='text-xs font-semibold'>Corners & Roundness</Label>
                    <div className='grid grid-cols-3 gap-2'>
                      {[
                        { id: 'ROUNDED_NONE', label: 'Sharp 0px' },
                        { id: 'ROUNDED_MD', label: 'Medium 8px' },
                        { id: 'ROUNDED_LG', label: 'Soft 16px' },
                      ].map((item) => (
                        <Button
                          key={item.id}
                          type='button'
                          size='sm'
                          variant={borderRadius === item.id ? 'default' : 'outline'}
                          className='h-8 text-[11px]'
                          onClick={() => setBorderRadius(item.id)}
                        >
                          {item.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* 2. Layout & Typography */}
                <TabsContent value='layout' className='mt-0 space-y-4'>
                  {/* Layout Style */}
                  <div className='space-y-1.5'>
                    <Label className='text-xs font-semibold'>Invoice Layout Architecture</Label>
                    <div className='grid grid-cols-3 gap-2'>
                      <Button
                        type='button'
                        size='sm'
                        variant={layoutStyle === 'MODERN' ? 'default' : 'outline'}
                        className='h-8 text-xs'
                        onClick={() => setLayoutStyle('MODERN')}
                      >
                        Modern A4
                      </Button>
                      <Button
                        type='button'
                        size='sm'
                        variant={layoutStyle === 'CLASSIC' ? 'default' : 'outline'}
                        className='h-8 text-xs'
                        onClick={() => setLayoutStyle('CLASSIC')}
                      >
                        Classic A4
                      </Button>
                      <Button
                        type='button'
                        size='sm'
                        variant={layoutStyle === 'THERMAL_POS' ? 'default' : 'outline'}
                        className='h-8 text-xs'
                        onClick={() => {
                          setLayoutStyle('THERMAL_POS')
                          setPaperSize('80MM')
                        }}
                      >
                        POS 80mm
                      </Button>
                    </div>
                  </div>

                  {/* Paper Format */}
                  <div className='space-y-1.5 border-t pt-3'>
                    <Label className='text-xs font-semibold'>Print Paper Format</Label>
                    <Select
                      value={paperSize}
                      onValueChange={(val) => setPaperSize(val as InvoicePaperSize)}
                    >
                      <SelectTrigger className='h-8 text-xs'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='A4'>A4 Standard Document Sheet</SelectItem>
                        <SelectItem value='80MM'>80mm Thermal Cashier Roll</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Typography Font */}
                  <div className='space-y-1.5 border-t pt-3'>
                    <Label className='text-xs font-semibold flex items-center gap-1.5'>
                      <Type className='size-3.5 text-primary' /> Typography & Font Family
                    </Label>
                    <div className='grid grid-cols-2 gap-2'>
                      {[
                        { id: 'sans', label: 'Clean Sans-Serif' },
                        { id: 'cairo', label: 'Modern Cairo / Arabic' },
                        { id: 'serif', label: 'Classic Serif' },
                        { id: 'mono', label: 'Monospace Code' },
                      ].map((font) => (
                        <Button
                          key={font.id}
                          type='button'
                          size='sm'
                          variant={fontFamily === font.id ? 'default' : 'outline'}
                          className='h-8 text-[11px]'
                          onClick={() => setFontFamily(font.id)}
                        >
                          {font.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Currency Symbol Position */}
                  <div className='space-y-1.5 border-t pt-3'>
                    <Label className='text-xs font-semibold'>Currency Position</Label>
                    <div className='grid grid-cols-2 gap-2'>
                      <Button
                        type='button'
                        size='sm'
                        variant={currencyPosition === 'AFTER' ? 'default' : 'outline'}
                        className='h-8 text-[11px]'
                        onClick={() => setCurrencyPosition('AFTER')}
                      >
                        120.00 EGP (After)
                      </Button>
                      <Button
                        type='button'
                        size='sm'
                        variant={currencyPosition === 'BEFORE' ? 'default' : 'outline'}
                        className='h-8 text-[11px]'
                        onClick={() => setCurrencyPosition('BEFORE')}
                      >
                        EGP 120.00 (Before)
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* 3. Store Identity & Content */}
                <TabsContent value='identity' className='mt-0 space-y-3.5'>
                  <div>
                    <Label className='text-xs font-semibold'>Store / Brand Name</Label>
                    <Input
                      className='h-8 text-xs mt-1'
                      placeholder='Store Name'
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className='text-xs font-semibold'>Store Logo URL</Label>
                    <Input
                      className='h-8 text-xs mt-1'
                      placeholder='https://...'
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                    />
                  </div>

                  <div className='grid grid-cols-2 gap-2.5'>
                    <div>
                      <Label className='text-xs font-semibold'>Tax ID (الرقم الضريبي)</Label>
                      <Input
                        className='h-8 text-xs mt-1 font-mono'
                        placeholder='300012345678901'
                        value={taxNumber}
                        onChange={(e) => setTaxNumber(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className='text-xs font-semibold'>Commercial Reg (السجل)</Label>
                      <Input
                        className='h-8 text-xs mt-1 font-mono'
                        placeholder='1010203040'
                        value={commercialReg}
                        onChange={(e) => setCommercialReg(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className='text-xs font-semibold'>Header Notice / Slogan</Label>
                    <Input
                      className='h-8 text-xs mt-1'
                      placeholder='e.g., Thank you for shopping with us!'
                      value={headerNotice}
                      onChange={(e) => setHeaderNotice(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className='text-xs font-semibold'>Terms, Notes & Return Policy</Label>
                    <Textarea
                      rows={2}
                      className='text-xs mt-1'
                      placeholder='Return within 14 days with original receipt...'
                      value={footerNotice}
                      onChange={(e) => setFooterNotice(e.target.value)}
                    />
                  </div>
                </TabsContent>

                {/* 4. Toggles & Visibility */}
                <TabsContent value='toggles' className='mt-0 space-y-3'>
                  <div className='flex items-center justify-between py-1'>
                    <Label htmlFor='tog-logo' className='cursor-pointer text-xs font-medium'>
                      Display Store Logo
                    </Label>
                    <Switch id='tog-logo' checked={showLogo} onCheckedChange={setShowLogo} />
                  </div>

                  <div className='flex items-center justify-between py-1 border-t pt-2'>
                    <Label htmlFor='tog-qr' className='cursor-pointer text-xs font-medium'>
                      Display QR Verification Code
                    </Label>
                    <Switch id='tog-qr' checked={showQrCode} onCheckedChange={setShowQrCode} />
                  </div>

                  {showQrCode && (
                    <div className='space-y-1.5 pl-4 border-l-2 border-primary/30'>
                      <Label className='text-[11px] text-muted-foreground'>QR Code Position</Label>
                      <Select value={qrPosition} onValueChange={setQrPosition}>
                        <SelectTrigger className='h-7 text-xs'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='FOOTER_RIGHT'>Footer Right</SelectItem>
                          <SelectItem value='FOOTER_CENTER'>Footer Center</SelectItem>
                          <SelectItem value='HEADER_RIGHT'>Header Top Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className='flex items-center justify-between py-1 border-t pt-2'>
                    <Label htmlFor='tog-tax' className='cursor-pointer text-xs font-medium'>
                      Display Tax Breakdown & VAT
                    </Label>
                    <Switch
                      id='tog-tax'
                      checked={showTaxDetails}
                      onCheckedChange={setShowTaxDetails}
                    />
                  </div>

                  <div className='flex items-center justify-between py-1 border-t pt-2'>
                    <Label htmlFor='tog-branch' className='cursor-pointer text-xs font-medium'>
                      Display Branch Location & Address
                    </Label>
                    <Switch
                      id='tog-branch'
                      checked={showBranchInfo}
                      onCheckedChange={setShowBranchInfo}
                    />
                  </div>

                  <div className='flex items-center justify-between py-1 border-t pt-2'>
                    <Label htmlFor='tog-cashier' className='cursor-pointer text-xs font-medium'>
                      Display Cashier Name
                    </Label>
                    <Switch
                      id='tog-cashier'
                      checked={showCashierName}
                      onCheckedChange={setShowCashierName}
                    />
                  </div>

                  <div className='flex items-center justify-between py-1 border-t pt-2'>
                    <Label htmlFor='tog-barcode' className='cursor-pointer text-xs font-medium'>
                      Display Invoice Barcode
                    </Label>
                    <Switch
                      id='tog-barcode'
                      checked={showBarcode}
                      onCheckedChange={setShowBarcode}
                    />
                  </div>

                  <div className='flex items-center justify-between py-1 border-t pt-2'>
                    <Label htmlFor='tog-watermark' className='cursor-pointer text-xs font-medium flex items-center gap-1.5'>
                      <Stamp className='size-3.5 text-primary' /> Diagonal Watermark Stamp
                    </Label>
                    <Switch
                      id='tog-watermark'
                      checked={showWatermark}
                      onCheckedChange={setShowWatermark}
                    />
                  </div>

                  {showWatermark && (
                    <div className='space-y-1.5 pl-4 border-l-2 border-primary/30'>
                      <Label className='text-[11px] text-muted-foreground'>Watermark Text</Label>
                      <Input
                        className='h-7 text-xs font-bold uppercase'
                        placeholder='PAID / مدفوع'
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                      />
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* RIGHT: Live Preview Panel (Pinned & Perfectly Centered in Viewport) */}
          <div className='lg:col-span-7 flex flex-col h-full overflow-hidden border border-border/60 rounded-xl bg-muted/30 shadow-2xs'>
            {/* Preview Toolbar */}
            <div className='p-2.5 px-4 border-b border-border/60 bg-muted/60 flex items-center justify-between shrink-0'>
              <div className='flex items-center gap-2'>
                <Eye className='size-3.5 text-primary' />
                <span className='font-bold text-xs'>Live Invoice Preview</span>
                <Badge variant='outline' className='text-[10px] py-0 px-1 font-mono uppercase'>
                  {layoutStyle} • {paperSize}
                </Badge>
              </div>

              {/* Zoom Controls */}
              <div className='flex items-center gap-1.5'>
                <Button
                  variant='ghost'
                  size='icon'
                  className='size-7'
                  onClick={() => setPreviewScale((s) => Math.max(0.6, s - 0.05))}
                  title='Zoom Out'
                >
                  <ZoomOut className='size-3.5' />
                </Button>
                <span className='text-[11px] font-mono w-10 text-center font-semibold text-muted-foreground'>
                  {Math.round(previewScale * 100)}%
                </span>
                <Button
                  variant='ghost'
                  size='icon'
                  className='size-7'
                  onClick={() => setPreviewScale((s) => Math.min(1.2, s + 0.05))}
                  title='Zoom In'
                >
                  <ZoomIn className='size-3.5' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='size-7'
                  onClick={() => setPreviewScale(0.85)}
                  title='Fit View'
                >
                  <Maximize2 className='size-3.5' />
                </Button>
              </div>
            </div>

            {/* Scrollable / Centered Preview Canvas */}
            <div className='flex-1 overflow-auto p-4 flex items-start justify-center'>
              <div
                style={{
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease',
                }}
                className={`relative bg-white text-zinc-900 shadow-xl border border-zinc-200 p-6 sm:p-7 shrink-0 ${getFontFamilyClass()} ${getBorderRadiusClass()} ${
                  paperSize === '80MM' || layoutStyle === 'THERMAL_POS'
                    ? 'w-[360px] text-xs'
                    : 'w-[580px] text-xs'
                }`}
              >
                {/* Optional Watermark */}
                {showWatermark && (
                  <div className='absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden'>
                    <span className='text-zinc-200/70 font-black text-6xl tracking-widest -rotate-45 uppercase border-4 border-dashed border-zinc-200/60 p-4 rounded-xl'>
                      {watermarkText || 'PAID'}
                    </span>
                  </div>
                )}

                {/* Header Banner according to headerStyle */}
                {headerStyle === 'BORDER_TOP' && (
                  <div
                    className='h-1.5 -mx-6 -mt-6 sm:-mx-7 sm:-mt-7 mb-4'
                    style={{ backgroundColor: primaryColor }}
                  />
                )}

                {headerStyle === 'SOLID_BANNER' && (
                  <div
                    className='-mx-6 -mt-6 sm:-mx-7 sm:-mt-7 p-4 mb-4 text-white flex items-center justify-between'
                    style={{ backgroundColor: primaryColor }}
                  >
                    <div>
                      <h3 className='font-bold text-base'>
                        {businessName || currentMerchant?.name || 'My Store'}
                      </h3>
                      <p className='text-[10px] text-white/80'>Official Sales Receipt</p>
                    </div>
                    <span className='font-mono font-bold text-xs bg-white/20 px-2 py-0.5 rounded'>
                      #INV-2026-001
                    </span>
                  </div>
                )}

                {headerStyle === 'SUBTLE_TINT' && (
                  <div
                    className='-mx-6 -mt-6 sm:-mx-7 sm:-mt-7 p-4 mb-4 border-b flex items-center justify-between'
                    style={{ backgroundColor: `${primaryColor}12` }}
                  >
                    <div>
                      <h3 className='font-bold text-base' style={{ color: primaryColor }}>
                        {businessName || currentMerchant?.name || 'My Store'}
                      </h3>
                      <p className='text-[10px] text-zinc-500'>Tax Sales Invoice</p>
                    </div>
                    <span
                      className='font-mono font-bold text-xs px-2 py-0.5 rounded'
                      style={{ color: primaryColor, backgroundColor: `${primaryColor}25` }}
                    >
                      #INV-2026-001
                    </span>
                  </div>
                )}

                {/* Main Header Info (if not solid banner) */}
                {headerStyle !== 'SOLID_BANNER' && headerStyle !== 'SUBTLE_TINT' && (
                  <div className='flex items-start justify-between border-b pb-3.5 border-zinc-200'>
                    <div className='flex items-center gap-3'>
                      {showLogo && logoUrl && (
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
                          {businessName || currentMerchant?.name || 'My Store'}
                        </h3>
                        {showBranchInfo && currentBranch && (
                          <p className='text-[10px] text-zinc-500'>
                            {currentBranch.name} • {currentBranch.address || 'Cairo, Egypt'}
                          </p>
                        )}
                        {taxNumber && (
                          <p className='text-[9px] text-zinc-500 font-mono'>Tax ID: {taxNumber}</p>
                        )}
                      </div>
                    </div>

                    <div className='text-right'>
                      <div
                        className='inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white'
                        style={{ backgroundColor: primaryColor }}
                      >
                        TAX INVOICE
                      </div>
                      <p className='font-mono font-bold text-xs mt-1'>#INV-2026-001</p>
                      <p className='text-[9px] text-zinc-400'>
                        Date: {new Date().toLocaleDateString('en-GB')}
                      </p>
                      {showQrCode && qrPosition === 'HEADER_RIGHT' && (
                        <div className='size-10 bg-zinc-100 border p-0.5 mt-1 ml-auto flex items-center justify-center rounded'>
                          <QrCode className='size-9 text-zinc-800' />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Slogan / Notice */}
                {headerNotice && (
                  <div className='py-1.5 text-center text-[10px] font-medium text-zinc-600 bg-zinc-50 border-b border-zinc-100 my-2 rounded'>
                    {headerNotice}
                  </div>
                )}

                {/* Customer Details Box */}
                <div className='my-2.5 p-2 bg-zinc-50 rounded border border-zinc-200 text-[10px] flex justify-between items-center'>
                  <div>
                    <span className='text-zinc-400'>Billed To: </span>
                    <span className='font-bold text-zinc-800'>Hassan Ibrahim</span>
                    <span className='text-zinc-400 ml-1.5'>• 01099887766</span>
                  </div>
                  {showCashierName && (
                    <span className='text-zinc-500 font-medium'>Cashier: Omar K.</span>
                  )}
                </div>

                {/* Items Table with Selected Table Style */}
                <table className='w-full my-2.5 border-collapse text-left text-[11px]'>
                  <thead>
                    <tr
                      className={`text-[10px] font-bold ${
                        tableStyle === 'GRID'
                          ? 'border border-zinc-300 bg-zinc-100'
                          : 'border-b border-zinc-300'
                      }`}
                      style={{ color: primaryColor }}
                    >
                      <th className='py-1.5 px-2'>Item Name</th>
                      <th className='py-1.5 px-2 text-center'>Qty</th>
                      <th className='py-1.5 px-2 text-right'>Price</th>
                      <th className='py-1.5 px-2 text-right'>Total</th>
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
                    {sampleItems.map((item, idx) => (
                      <tr
                        key={idx}
                        className={
                          tableStyle === 'STRIPED' && idx % 2 === 1 ? 'bg-zinc-50/70' : ''
                        }
                      >
                        <td className='py-1 px-2 font-medium'>
                          <div>{item.name}</div>
                          <div className='text-[8px] text-zinc-400 font-mono'>{item.barcode}</div>
                        </td>
                        <td className='py-1 px-2 text-center font-mono'>{item.qty}</td>
                        <td className='py-1 px-2 text-right font-mono'>{formatPrice(item.price)}</td>
                        <td className='py-1 px-2 text-right font-mono font-bold'>
                          {formatPrice(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Summary / Totals */}
                <div className='border-t border-zinc-200 pt-2 flex flex-col items-end space-y-1 text-[10px]'>
                  <div className='flex justify-between w-44 text-zinc-600'>
                    <span>Subtotal:</span>
                    <span className='font-mono font-semibold'>{formatPrice(sampleSubtotal)}</span>
                  </div>
                  {showTaxDetails && (
                    <div className='flex justify-between w-44 text-zinc-600'>
                      <span>VAT (14%):</span>
                      <span className='font-mono font-semibold'>{formatPrice(sampleTax)}</span>
                    </div>
                  )}
                  <div
                    className='flex justify-between w-44 pt-1 border-t border-zinc-300 font-bold text-xs text-zinc-900'
                    style={{ color: primaryColor }}
                  >
                    <span>Grand Total:</span>
                    <span className='font-mono text-sm'>{formatPrice(sampleGrandTotal)}</span>
                  </div>
                </div>

                {/* Footer Notes & QR & Barcode */}
                <div className='mt-4 pt-3 border-t border-dashed border-zinc-300 flex flex-col gap-2'>
                  <div
                    className={`flex items-center justify-between text-[9px] text-zinc-500 ${
                      qrPosition === 'FOOTER_CENTER' ? 'flex-col text-center gap-2' : ''
                    }`}
                  >
                    {footerNotice && (
                      <p className='max-w-[280px] leading-relaxed'>{footerNotice}</p>
                    )}
                    {showQrCode && qrPosition !== 'HEADER_RIGHT' && (
                      <div className='flex flex-col items-center shrink-0'>
                        <div className='size-12 bg-zinc-50 border p-0.5 rounded flex items-center justify-center'>
                          <QrCode className='size-10 text-zinc-800' />
                        </div>
                        <span className='text-[7px] text-zinc-400 mt-0.5 font-mono'>
                          ZATCA E-Invoice
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
                        *INV-2026-001*
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Main>
    </div>
  )
}
