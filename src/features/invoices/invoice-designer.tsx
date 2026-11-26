import * as React from 'react'
import {
  Palette,
  Eye,
  Save,
  Building2,
  Check,
  RotateCcw,
  Sparkles,
  Sliders,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Stamp,
  FileText,
  Receipt,
  Printer,
  Loader2,
  Image as ImageIcon,
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
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { LanguageSwitch } from '@/components/language-switch'
import { PosShortcutButton } from '@/components/pos-shortcut-button'
import { CustomizedInvoiceView } from '@/features/invoices/components/customized-invoice-view'
import { useSaaSStore } from '@/lib/saas-store'
import { useLang } from '@/lib/i18n'
import type {
  Invoice,
  InvoiceLayoutStyle,
  InvoicePaperSize,
  InvoiceTemplate,
} from '@/types/saas'
import { toast } from 'sonner'

const COLOR_PRESETS = [
  { name: 'Carbon Black', value: '#09090B' },
  { name: 'Green Scan', value: '#00A828' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Slate', value: '#1E293B' },
  { name: 'Ocean', value: '#0284C7' },
  { name: 'Indigo', value: '#4F46E5' },
  { name: 'Amber', value: '#D97706' },
  { name: 'Rose', value: '#E11D48' },
]

interface DesignPreset {
  id: string
  nameAr: string
  nameEn: string
  descAr: string
  descEn: string
  primaryColor: string
  layoutStyle: InvoiceLayoutStyle
  paperSize: InvoicePaperSize
  headerStyle: string
  tableStyle: string
  borderRadius: string
  fontFamily: string
}

const DESIGN_PRESETS: DesignPreset[] = [
  {
    id: 'pos-thermal',
    nameAr: 'إيصال كاشير 80mm',
    nameEn: 'Thermal POS 80mm',
    descAr: 'مثالي لنقطة البيع والطابعات الحرارية',
    descEn: 'Crisp thermal cashier receipt',
    primaryColor: '#09090B',
    layoutStyle: 'THERMAL_POS',
    paperSize: '80MM',
    headerStyle: 'BORDER_TOP',
    tableStyle: 'STRIPED',
    borderRadius: 'ROUNDED_MD',
    fontFamily: 'cairo',
  },
  {
    id: 'carbon-modern',
    nameAr: 'مودرن احترافي A4',
    nameEn: 'Modern Carbon A4',
    descAr: 'تصميم عصري نظيف للفواتير الضريبية',
    descEn: 'Clean modern tax invoice',
    primaryColor: '#09090B',
    layoutStyle: 'MODERN',
    paperSize: 'A4',
    headerStyle: 'SOLID_BANNER',
    tableStyle: 'STRIPED',
    borderRadius: 'ROUNDED_LG',
    fontFamily: 'cairo',
  },
  {
    id: 'emerald-soft',
    nameAr: 'أخضر هادئ',
    nameEn: 'Soft Emerald',
    descAr: 'ترويسة ناعمة متناسقة مع Green Scan',
    descEn: 'Subtle tint with emerald accent',
    primaryColor: '#059669',
    layoutStyle: 'MODERN',
    paperSize: 'A4',
    headerStyle: 'SUBTLE_TINT',
    tableStyle: 'MINIMAL',
    borderRadius: 'ROUNDED_LG',
    fontFamily: 'sans',
  },
  {
    id: 'classic-grid',
    nameAr: 'كلاسيك رسمي',
    nameEn: 'Classic Corporate',
    descAr: 'جدول رسمي بحدود كاملة وحواف حادة',
    descEn: 'Formal bordered corporate table',
    primaryColor: '#1E293B',
    layoutStyle: 'CLASSIC',
    paperSize: 'A4',
    headerStyle: 'SOLID_BANNER',
    tableStyle: 'GRID',
    borderRadius: 'ROUNDED_NONE',
    fontFamily: 'serif',
  },
]

type DesignerTab = 'style' | 'brand' | 'elements'

export function InvoiceDesigner() {
  const { isAr, dir, t } = useLang()
  const {
    currentUser,
    merchants,
    branches,
    fetchInvoiceTemplate,
    updateInvoiceTemplate,
  } = useSaaSStore()

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN'
  const defaultMerchantId = currentUser.merchantId || merchants[0]?.id || ''
  const [selectedMerchantId, setSelectedMerchantId] = React.useState(defaultMerchantId)

  React.useEffect(() => {
    if (!selectedMerchantId && merchants.length > 0) {
      setSelectedMerchantId(currentUser.merchantId || merchants[0].id)
    }
  }, [selectedMerchantId, merchants, currentUser.merchantId])

  const currentMerchant = merchants.find((m) => m.id === selectedMerchantId) || merchants[0]
  const currentBranch = branches.find((b) => b.merchantId === selectedMerchantId) || branches[0]

  // Active tab
  const [activeTab, setActiveTab] = React.useState<DesignerTab>('style')

  // Template state
  const [templateName, setTemplateName] = React.useState('Standard Invoice')
  const [layoutStyle, setLayoutStyle] = React.useState<InvoiceLayoutStyle>('THERMAL_POS')
  const [paperSize, setPaperSize] = React.useState<InvoicePaperSize>('80MM')
  const [primaryColor, setPrimaryColor] = React.useState('#09090B')
  const [accentColor, setAccentColor] = React.useState('#00A828')
  const [fontFamily, setFontFamily] = React.useState('cairo')
  const [headerStyle, setHeaderStyle] = React.useState('BORDER_TOP')
  const [tableStyle, setTableStyle] = React.useState('STRIPED')
  const [borderRadius, setBorderRadius] = React.useState('ROUNDED_MD')
  const [currencyPosition, setCurrencyPosition] = React.useState('AFTER')

  // Identity
  const [businessName, setBusinessName] = React.useState('')
  const [logoUrl, setLogoUrl] = React.useState('')
  const [showLogo, setShowLogo] = React.useState(true)
  const [taxNumber, setTaxNumber] = React.useState('300012345678901')
  const [commercialReg, setCommercialReg] = React.useState('1010203040')
  const [headerNotice, setHeaderNotice] = React.useState('')
  const [footerNotice, setFooterNotice] = React.useState(
    'شكراً لتسوقكم معنا • يمكن الاسترجاع خلال 14 يوماً بالفاتورة الأصلية.'
  )

  // Visibility toggles
  const [showQrCode, setShowQrCode] = React.useState(true)
  const [qrPosition, setQrPosition] = React.useState('FOOTER_RIGHT')
  const [showTaxDetails, setShowTaxDetails] = React.useState(true)
  const [showBranchInfo, setShowBranchInfo] = React.useState(true)
  const [showCashierName, setShowCashierName] = React.useState(true)
  const [showBarcode, setShowBarcode] = React.useState(true)
  const [showWatermark, setShowWatermark] = React.useState(false)
  const [watermarkText, setWatermarkText] = React.useState('PAID')

  // Preview controls
  const [previewScale, setPreviewScale] = React.useState<number>(1)
  const [isSaving, setIsSaving] = React.useState(false)
  const [hasUnsaved, setHasUnsaved] = React.useState(false)

  // Load saved template from backend
  React.useEffect(() => {
    if (!selectedMerchantId) return
    fetchInvoiceTemplate(selectedMerchantId).then((tpl) => {
      if (tpl) {
        setTemplateName(tpl.templateName || 'Standard Invoice')
        setLayoutStyle(tpl.layoutStyle || 'MODERN')
        setPaperSize(tpl.paperSize || 'A4')
        setPrimaryColor(tpl.primaryColor || '#09090B')
        setAccentColor(tpl.accentColor || '#00A828')
        setFontFamily(tpl.fontFamily || 'cairo')
        setHeaderStyle(tpl.headerStyle || 'BORDER_TOP')
        setTableStyle(tpl.tableStyle || 'STRIPED')
        setBorderRadius(tpl.borderRadius || 'ROUNDED_MD')
        setCurrencyPosition(tpl.currencyPosition || 'AFTER')
        setBusinessName(tpl.businessName || currentMerchant?.name || '')
        setLogoUrl(tpl.logoUrl || currentMerchant?.logo || '')
        setShowLogo(tpl.showLogo !== undefined ? tpl.showLogo : true)
        setTaxNumber(tpl.taxNumber || '300012345678901')
        setCommercialReg(tpl.commercialReg || '1010203040')
        setHeaderNotice(tpl.headerNotice || '')
        setFooterNotice(
          tpl.footerNotice ||
            'شكراً لتسوقكم معنا • يمكن الاسترجاع خلال 14 يوماً بالفاتورة الأصلية.'
        )
        setShowQrCode(tpl.showQrCode !== undefined ? tpl.showQrCode : true)
        setQrPosition(tpl.qrPosition || 'FOOTER_RIGHT')
        setShowTaxDetails(tpl.showTaxDetails !== undefined ? tpl.showTaxDetails : true)
        setShowBranchInfo(tpl.showBranchInfo !== undefined ? tpl.showBranchInfo : true)
        setShowCashierName(tpl.showCashierName !== undefined ? tpl.showCashierName : true)
        setShowBarcode(tpl.showBarcode !== undefined ? tpl.showBarcode : true)
        setShowWatermark(tpl.showWatermark !== undefined ? tpl.showWatermark : false)
        setWatermarkText(tpl.watermarkText || 'PAID')
        setHasUnsaved(false)
      } else if (currentMerchant) {
        setBusinessName(currentMerchant.name)
        setLogoUrl(currentMerchant.logo || '')
        setHasUnsaved(false)
      }
    })
  }, [selectedMerchantId, fetchInvoiceTemplate, currentMerchant])

  const markDirty = <T,>(setter: React.Dispatch<React.SetStateAction<T>>) => (val: T) => {
    setter(val)
    setHasUnsaved(true)
  }

  const handleApplyPreset = (preset: DesignPreset) => {
    setPrimaryColor(preset.primaryColor)
    setLayoutStyle(preset.layoutStyle)
    setPaperSize(preset.paperSize)
    setHeaderStyle(preset.headerStyle)
    setTableStyle(preset.tableStyle)
    setBorderRadius(preset.borderRadius)
    setFontFamily(preset.fontFamily)
    setHasUnsaved(true)
    toast.success(t(`تم تطبيق قالب "${preset.nameAr}"`, `Applied "${preset.nameEn}" preset`))
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
      setHasUnsaved(false)
      toast.success(t('تم حفظ تصميم الفاتورة بنجاح ✓', 'Invoice template saved successfully ✓'))
    } catch (err: any) {
      toast.error(err?.message || t('فشل حفظ التصميم', 'Failed to save template'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetDefaults = () => {
    const def = DESIGN_PRESETS[0]
    setPrimaryColor(def.primaryColor)
    setLayoutStyle(def.layoutStyle)
    setPaperSize(def.paperSize)
    setHeaderStyle(def.headerStyle)
    setTableStyle(def.tableStyle)
    setBorderRadius(def.borderRadius)
    setFontFamily(def.fontFamily)
    setCurrencyPosition('AFTER')
    setBusinessName(currentMerchant?.name || 'BIM')
    setLogoUrl(currentMerchant?.logo || '')
    setShowLogo(true)
    setTaxNumber('300012345678901')
    setCommercialReg('1010203040')
    setHeaderNotice('')
    setFooterNotice('شكراً لتسوقكم معنا • يمكن الاسترجاع خلال 14 يوماً بالفاتورة الأصلية.')
    setShowQrCode(true)
    setQrPosition('FOOTER_RIGHT')
    setShowTaxDetails(true)
    setShowBranchInfo(true)
    setShowCashierName(true)
    setShowBarcode(true)
    setShowWatermark(false)
    setWatermarkText('PAID')
    setHasUnsaved(true)
    toast.info(t('تمت استعادة الإعدادات الافتراضية', 'Reset to default design'))
  }

  // Build live InvoiceTemplate object fed directly into the REAL <CustomizedInvoiceView />
  const liveTemplate: InvoiceTemplate = React.useMemo(
    () => ({
      id: 'preview-template',
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
      businessName: businessName || currentMerchant?.name || 'GREEN STORE',
      logoUrl,
      showLogo,
      taxNumber,
      commercialReg,
      headerNotice,
      footerNotice,
      showQrCode,
      qrPosition,
      showTaxDetails,
      showBranchInfo,
      showCashierName,
      showBarcode,
      showWatermark,
      watermarkText,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    [
      selectedMerchantId,
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
      businessName,
      currentMerchant?.name,
      logoUrl,
      showLogo,
      taxNumber,
      commercialReg,
      headerNotice,
      footerNotice,
      showQrCode,
      qrPosition,
      showTaxDetails,
      showBranchInfo,
      showCashierName,
      showBarcode,
      showWatermark,
      watermarkText,
    ]
  )

  // Realistic sample invoice so preview is 100% WYSIWYG with POS & PDF
  const sampleInvoice: Invoice = React.useMemo(() => {
    const subtotal = 315.0
    const taxTotal = showTaxDetails ? Math.round(subtotal * 0.14 * 100) / 100 : 0
    return {
      id: 'preview-inv',
      invoiceNumber: 'INV-2026-0042',
      merchantId: selectedMerchantId,
      branchId: currentBranch?.id || null,
      customerName: 'عميل نقدي (Walk-in)',
      paymentMethod: 'INSTAPAY',
      status: 'PAID',
      subtotal,
      taxTotal,
      feesTotal: 0,
      discountTotal: 0,
      grandTotal: subtotal + taxTotal,
      issuedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [
        {
          id: 'item-1',
          invoiceId: 'preview-inv',
          productName: 'نسكافيه جولد 100 جم',
          barcode: '6221000123456',
          quantity: 1,
          unitPrice: 185.0,
          totalPrice: 185.0,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-2',
          invoiceId: 'preview-inv',
          productName: 'لبن جهينة كامل الدسم 1 لتر',
          barcode: '6221000678901',
          quantity: 2,
          unitPrice: 45.0,
          totalPrice: 90.0,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-3',
          invoiceId: 'preview-inv',
          productName: 'شيبسي عائلي جبنة متبلة',
          barcode: '6221000345678',
          quantity: 2,
          unitPrice: 20.0,
          totalPrice: 40.0,
          createdAt: new Date().toISOString(),
        },
      ],
    }
  }, [selectedMerchantId, currentBranch?.id, showTaxDetails])

  return (
    <>
      <Header fixed>
        <div className='ms-auto flex items-center gap-2'>
          <PosShortcutButton />
          <LanguageSwitch />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 p-4 sm:p-5'>
        {/* Top Studio Bar */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
          <div>
            <div className='flex items-center gap-2'>
              <h1 className='text-xl sm:text-2xl font-bold tracking-tight text-foreground'>
                {t('مصمم الفاتورة', 'Invoice Designer')}
              </h1>
              {hasUnsaved && (
                <Badge
                  variant='outline'
                  className='text-[10px] font-bold border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                >
                  {t('تعديلات غير محفوظة', 'Unsaved changes')}
                </Badge>
              )}
            </div>
            <p className='text-xs text-muted-foreground mt-0.5'>
              {t(
                'صمّم شكل فاتورة متجرك مع معاينة مطابقة 100% للـ POS وملف الـ PDF المرسل للعملاء.',
                'Design your invoice template with a 100% live WYSIWYG preview matching POS and WhatsApp PDFs.'
              )}
            </p>
          </div>

          <div className='flex items-center gap-2 flex-wrap shrink-0'>
            {isSuperAdmin && merchants.length > 0 && (
              <Select value={selectedMerchantId} onValueChange={setSelectedMerchantId}>
                <SelectTrigger className='h-9 text-xs w-44 rounded-lg bg-card'>
                  <SelectValue placeholder={t('اختر المتجر', 'Select Merchant')} />
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
              type='button'
              variant='outline'
              size='sm'
              onClick={handleResetDefaults}
              className='h-9 px-3 rounded-lg gap-1.5 text-xs font-semibold cursor-pointer'
            >
              <RotateCcw className='size-3.5' />
              <span className='hidden sm:inline'>{t('افتراضي', 'Reset')}</span>
            </Button>

            <Button
              type='button'
              size='sm'
              onClick={handleSave}
              disabled={isSaving}
              className='h-9 px-4 rounded-lg gap-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs'
            >
              {isSaving ? <Loader2 className='size-3.5 animate-spin' /> : <Save className='size-3.5' />}
              <span>{isSaving ? t('جاري الحفظ...', 'Saving...') : t('حفظ التصميم', 'Save Template')}</span>
            </Button>
          </div>
        </div>

        {/* 2-Column Clean Studio Workspace */}
        <div className='grid grid-cols-1 lg:grid-cols-[390px_minmax(0,1fr)] gap-4 items-stretch flex-1 min-h-[640px] lg:h-[calc(100vh-12rem)]'>
          {/* ── CONTROLS PANEL ── */}
          <div className='flex flex-col rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden min-h-0'>
            {/* Segmented Tab Switcher */}
            <div className='p-2 border-b border-border/70 bg-muted/30 shrink-0'>
              <div className='grid grid-cols-3 gap-1 p-1 rounded-xl bg-muted/60'>
                {(
                  [
                    { id: 'style', icon: Palette, label: t('التصميم', 'Style') },
                    { id: 'brand', icon: Building2, label: t('الهوية', 'Brand') },
                    { id: 'elements', icon: Sliders, label: t('العناصر', 'Elements') },
                  ] as const
                ).map((tab) => {
                  const Icon = tab.icon
                  const active = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type='button'
                      onClick={() => setActiveTab(tab.id)}
                      className={`h-8 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        active
                          ? 'bg-background text-foreground shadow-2xs border border-border/60'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className='size-3.5' />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Scrollable Tab Body */}
            <div className='flex-1 overflow-y-auto p-4 space-y-5 text-xs'>
              {/* TAB 1: STYLE & LAYOUT */}
              {activeTab === 'style' && (
                <>
                  {/* Ready Presets */}
                  <div className='space-y-2'>
                    <Label className='text-xs font-bold flex items-center gap-1.5 text-foreground'>
                      <Sparkles className='size-3.5 text-emerald-600 dark:text-[#3EEA85]' />
                      <span>{t('قوالب جاهزة بضغطة واحدة', 'Quick Presets')}</span>
                    </Label>
                    <div className='grid grid-cols-2 gap-2'>
                      {DESIGN_PRESETS.map((preset) => {
                        const isMatch =
                          primaryColor.toLowerCase() === preset.primaryColor.toLowerCase() &&
                          paperSize === preset.paperSize &&
                          headerStyle === preset.headerStyle &&
                          tableStyle === preset.tableStyle
                        return (
                          <button
                            key={preset.id}
                            type='button'
                            onClick={() => handleApplyPreset(preset)}
                            className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer space-y-1.5 ${
                              isMatch
                                ? 'border-foreground bg-muted/60 shadow-2xs'
                                : 'border-border/80 hover:border-foreground/40 hover:bg-muted/30'
                            }`}
                          >
                            <div className='flex items-center justify-between gap-2'>
                              <span
                                className='h-2 w-8 rounded-full'
                                style={{ backgroundColor: preset.primaryColor }}
                              />
                              <span className='text-[9.5px] font-mono text-muted-foreground font-bold'>
                                {preset.paperSize}
                              </span>
                            </div>
                            <p className='font-bold text-xs text-foreground leading-tight'>
                              {isAr ? preset.nameAr : preset.nameEn}
                            </p>
                            <p className='text-[10px] text-muted-foreground leading-snug line-clamp-1'>
                              {isAr ? preset.descAr : preset.descEn}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Paper Size Visual Cards */}
                  <div className='space-y-2 pt-3 border-t border-border/70'>
                    <Label className='text-xs font-bold text-foreground'>
                      {t('مقاس الفاتورة', 'Paper Format')}
                    </Label>
                    <div className='grid grid-cols-2 gap-2'>
                      <button
                        type='button'
                        onClick={() => {
                          setPaperSize('80MM')
                          setLayoutStyle('THERMAL_POS')
                          setHasUnsaved(true)
                        }}
                        className={`p-3 rounded-xl border flex items-center gap-2.5 text-start transition-all cursor-pointer ${
                          paperSize === '80MM'
                            ? 'border-foreground bg-muted/60'
                            : 'border-border/80 hover:bg-muted/30'
                        }`}
                      >
                        <div className='size-8 rounded-lg bg-muted border border-border/70 flex items-center justify-center shrink-0'>
                          <Receipt className='size-4' />
                        </div>
                        <div className='min-w-0'>
                          <p className='font-bold text-xs'>{t('كاشير 80mm', '80mm Thermal')}</p>
                          <p className='text-[10px] text-muted-foreground'>{t('إيصال حراري', 'POS roll')}</p>
                        </div>
                      </button>

                      <button
                        type='button'
                        onClick={() => {
                          setPaperSize('A4')
                          setLayoutStyle(layoutStyle === 'THERMAL_POS' ? 'MODERN' : layoutStyle)
                          setHasUnsaved(true)
                        }}
                        className={`p-3 rounded-xl border flex items-center gap-2.5 text-start transition-all cursor-pointer ${
                          paperSize === 'A4'
                            ? 'border-foreground bg-muted/60'
                            : 'border-border/80 hover:bg-muted/30'
                        }`}
                      >
                        <div className='size-8 rounded-lg bg-muted border border-border/70 flex items-center justify-center shrink-0'>
                          <FileText className='size-4' />
                        </div>
                        <div className='min-w-0'>
                          <p className='font-bold text-xs'>{t('ورق A4', 'A4 Sheet')}</p>
                          <p className='text-[10px] text-muted-foreground'>{t('فاتورة كاملة', 'Full page')}</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Brand Primary Color */}
                  <div className='space-y-2 pt-3 border-t border-border/70'>
                    <div className='flex items-center justify-between'>
                      <Label className='text-xs font-bold text-foreground'>
                        {t('اللون الأساسي للفاتورة', 'Primary Accent Color')}
                      </Label>
                      <label className='inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-border bg-muted/40 cursor-pointer'>
                        <input
                          type='color'
                          value={primaryColor}
                          onChange={(e) => markDirty(setPrimaryColor)(e.target.value)}
                          className='size-4 rounded cursor-pointer border-0 bg-transparent p-0'
                        />
                        <span className='font-mono text-[10px] uppercase font-bold text-muted-foreground'>
                          {primaryColor}
                        </span>
                      </label>
                    </div>

                    <div className='flex items-center gap-2 flex-wrap pt-0.5'>
                      {COLOR_PRESETS.map((c) => {
                        const active = primaryColor.toLowerCase() === c.value.toLowerCase()
                        return (
                          <button
                            key={c.value}
                            type='button'
                            onClick={() => markDirty(setPrimaryColor)(c.value)}
                            style={{ backgroundColor: c.value }}
                            className={`size-7 rounded-full flex items-center justify-center transition-transform cursor-pointer border border-black/15 dark:border-white/15 ${
                              active ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card scale-110' : 'hover:scale-105'
                            }`}
                            title={c.name}
                          >
                            {active && <Check className='size-3.5 text-white' />}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Header Style Visual Wireframes */}
                  <div className='space-y-2 pt-3 border-t border-border/70'>
                    <Label className='text-xs font-bold text-foreground'>
                      {t('ستايل الهيدر العلوي', 'Header Style')}
                    </Label>
                    <div className='grid grid-cols-2 gap-2'>
                      {[
                        { id: 'BORDER_TOP', label: t('شريط علوي رفيع', 'Top Accent Bar') },
                        { id: 'SOLID_BANNER', label: t('بانر ممتلئ', 'Solid Banner') },
                        { id: 'SUBTLE_TINT', label: t('خلفية ناعمة', 'Subtle Tint') },
                        { id: 'MINIMAL', label: t('بسيط ونظيف', 'Minimal') },
                      ].map((item) => {
                        const active = headerStyle === item.id
                        return (
                          <button
                            key={item.id}
                            type='button'
                            onClick={() => markDirty(setHeaderStyle)(item.id)}
                            className={`p-2 rounded-xl border text-start transition-all cursor-pointer space-y-1.5 ${
                              active
                                ? 'border-foreground bg-muted/60'
                                : 'border-border/80 hover:bg-muted/30'
                            }`}
                          >
                            {/* Mini wireframe preview */}
                            <div className='h-6 rounded-md border border-border/70 bg-background overflow-hidden flex flex-col'>
                              {item.id === 'BORDER_TOP' && (
                                <div className='h-1.5 w-full' style={{ backgroundColor: primaryColor }} />
                              )}
                              {item.id === 'SOLID_BANNER' && (
                                <div className='h-full w-full' style={{ backgroundColor: primaryColor }} />
                              )}
                              {item.id === 'SUBTLE_TINT' && (
                                <div
                                  className='h-full w-full'
                                  style={{ backgroundColor: `${primaryColor}22` }}
                                />
                              )}
                            </div>
                            <span className='block text-[11px] font-bold text-foreground'>
                              {item.label}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Table Style & Corner Radius */}
                  <div className='grid grid-cols-1 gap-3.5 pt-3 border-t border-border/70'>
                    <div className='space-y-1.5'>
                      <Label className='text-xs font-bold text-foreground'>
                        {t('ستايل جدول الأصناف', 'Table Style')}
                      </Label>
                      <div className='grid grid-cols-3 gap-1.5'>
                        {[
                          { id: 'STRIPED', label: t('مخطط', 'Striped') },
                          { id: 'GRID', label: t('شبكة كاملة', 'Grid') },
                          { id: 'MINIMAL', label: t('خطوط بسيطة', 'Minimal') },
                        ].map((st) => (
                          <button
                            key={st.id}
                            type='button'
                            onClick={() => markDirty(setTableStyle)(st.id)}
                            className={`h-8 rounded-lg border text-[11px] font-bold transition-colors cursor-pointer ${
                              tableStyle === st.id
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background hover:bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className='space-y-1.5'>
                      <Label className='text-xs font-bold text-foreground'>
                        {t('انحناء الزوايا', 'Corner Radius')}
                      </Label>
                      <div className='grid grid-cols-3 gap-1.5'>
                        {[
                          { id: 'ROUNDED_NONE', label: t('حاد', 'Sharp') },
                          { id: 'ROUNDED_MD', label: t('متوسط', 'Medium') },
                          { id: 'ROUNDED_LG', label: t('دائري ناعم', 'Soft') },
                        ].map((rad) => (
                          <button
                            key={rad.id}
                            type='button'
                            onClick={() => markDirty(setBorderRadius)(rad.id)}
                            className={`h-8 rounded-lg border text-[11px] font-bold transition-colors cursor-pointer ${
                              borderRadius === rad.id
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background hover:bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {rad.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className='grid grid-cols-2 gap-2.5'>
                      <div className='space-y-1.5'>
                        <Label className='text-xs font-bold text-foreground'>
                          {t('الخط', 'Font')}
                        </Label>
                        <Select value={fontFamily} onValueChange={markDirty(setFontFamily)}>
                          <SelectTrigger className='h-8 text-xs rounded-lg'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='cairo'>{t('عربي حديث (Cairo)', 'Modern Arabic')}</SelectItem>
                            <SelectItem value='sans'>{t('نظيف (Sans)', 'Clean Sans')}</SelectItem>
                            <SelectItem value='serif'>{t('كلاسيك (Serif)', 'Classic Serif')}</SelectItem>
                            <SelectItem value='mono'>{t('أرقام (Mono)', 'Monospace')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className='space-y-1.5'>
                        <Label className='text-xs font-bold text-foreground'>
                          {t('موضع العملة', 'Currency')}
                        </Label>
                        <Select value={currencyPosition} onValueChange={markDirty(setCurrencyPosition)}>
                          <SelectTrigger className='h-8 text-xs rounded-lg'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='AFTER'>120.00 EGP</SelectItem>
                            <SelectItem value='BEFORE'>EGP 120.00</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2: BRAND & IDENTITY */}
              {activeTab === 'brand' && (
                <div className='space-y-4'>
                  <div className='space-y-1.5'>
                    <Label className='text-xs font-bold'>{t('اسم المتجر / النشاط', 'Store / Business Name')}</Label>
                    <Input
                      className='h-9 text-xs rounded-lg'
                      placeholder={t('اسم المتجر على الفاتورة', 'Store name on invoice')}
                      value={businessName}
                      onChange={(e) => markDirty(setBusinessName)(e.target.value)}
                    />
                  </div>

                  <div className='space-y-1.5'>
                    <Label className='text-xs font-bold'>{t('رابط لوجو المتجر (Logo URL)', 'Store Logo URL')}</Label>
                    <div className='flex items-center gap-2'>
                      <div className='size-9 rounded-lg border border-border bg-muted/40 flex items-center justify-center overflow-hidden shrink-0'>
                        {logoUrl ? (
                          <img src={logoUrl} alt='Logo' className='size-full object-contain p-0.5' />
                        ) : (
                          <ImageIcon className='size-4 text-muted-foreground' />
                        )}
                      </div>
                      <Input
                        dir='ltr'
                        className='h-9 text-xs rounded-lg flex-1 font-mono'
                        placeholder='https://...'
                        value={logoUrl}
                        onChange={(e) => markDirty(setLogoUrl)(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-2.5'>
                    <div className='space-y-1.5'>
                      <Label className='text-xs font-bold'>{t('الرقم الضريبي', 'Tax Number')}</Label>
                      <Input
                        dir='ltr'
                        className='h-9 text-xs rounded-lg font-mono'
                        placeholder='300012345678901'
                        value={taxNumber}
                        onChange={(e) => markDirty(setTaxNumber)(e.target.value)}
                      />
                    </div>
                    <div className='space-y-1.5'>
                      <Label className='text-xs font-bold'>{t('السجل التجاري', 'Commercial Reg')}</Label>
                      <Input
                        dir='ltr'
                        className='h-9 text-xs rounded-lg font-mono'
                        placeholder='1010203040'
                        value={commercialReg}
                        onChange={(e) => markDirty(setCommercialReg)(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className='space-y-1.5'>
                    <Label className='text-xs font-bold'>{t('رسالة ترحيب أعلى الفاتورة', 'Header Notice / Slogan')}</Label>
                    <Input
                      className='h-9 text-xs rounded-lg'
                      placeholder={t('مثال: أهلاً بكم في فروعنا...', 'e.g., Welcome to our store!')}
                      value={headerNotice}
                      onChange={(e) => markDirty(setHeaderNotice)(e.target.value)}
                    />
                  </div>

                  <div className='space-y-1.5'>
                    <Label className='text-xs font-bold'>
                      {t('تذييل الفاتورة وشروط الاسترجاع', 'Footer Notice & Return Terms')}
                    </Label>
                    <Textarea
                      rows={3}
                      className='text-xs rounded-lg'
                      placeholder={t('شكراً لزيارتكم • الاسترجاع خلال 14 يوماً...', 'Thank you for visiting...')}
                      value={footerNotice}
                      onChange={(e) => markDirty(setFooterNotice)(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: VISIBILITY ELEMENTS */}
              {activeTab === 'elements' && (
                <div className='space-y-3'>
                  <div className='rounded-xl border border-border/80 bg-muted/20 divide-y divide-border/60'>
                    {[
                      {
                        id: 'tog-logo',
                        label: t('عرض لوجو المتجر', 'Show Store Logo'),
                        checked: showLogo,
                        onChange: markDirty(setShowLogo),
                      },
                      {
                        id: 'tog-branch',
                        label: t('عرض اسم الفرع والعنوان', 'Show Branch & Address'),
                        checked: showBranchInfo,
                        onChange: markDirty(setShowBranchInfo),
                      },
                      {
                        id: 'tog-cashier',
                        label: t('عرض اسم الكاشير وطريقة الدفع', 'Show Cashier & Payment'),
                        checked: showCashierName,
                        onChange: markDirty(setShowCashierName),
                      },
                      {
                        id: 'tog-tax',
                        label: t('عرض تفاصيل ضريبة القيمة المضافة', 'Show Tax / VAT Breakdown'),
                        checked: showTaxDetails,
                        onChange: markDirty(setShowTaxDetails),
                      },
                      {
                        id: 'tog-barcode',
                        label: t('عرض باركود الفاتورة بالأسفل', 'Show Footer Barcode'),
                        checked: showBarcode,
                        onChange: markDirty(setShowBarcode),
                      },
                    ].map((row) => (
                      <div key={row.id} className='px-3.5 py-2.5 flex items-center justify-between gap-2'>
                        <Label htmlFor={row.id} className='text-xs font-semibold cursor-pointer'>
                          {row.label}
                        </Label>
                        <Switch id={row.id} checked={row.checked} onCheckedChange={row.onChange} />
                      </div>
                    ))}
                  </div>

                  {/* QR Code Card */}
                  <div className='rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-2.5'>
                    <div className='flex items-center justify-between'>
                      <Label htmlFor='tog-qr' className='text-xs font-bold cursor-pointer'>
                        {t('كود التحقق الإلكتروني (QR Code)', 'Electronic QR Code')}
                      </Label>
                      <Switch id='tog-qr' checked={showQrCode} onCheckedChange={markDirty(setShowQrCode)} />
                    </div>
                    {showQrCode && (
                      <div className='grid grid-cols-3 gap-1.5 pt-1'>
                        {[
                          { id: 'FOOTER_RIGHT', label: t('أسفل جانب', 'Footer Side') },
                          { id: 'FOOTER_CENTER', label: t('أسفل وسط', 'Footer Center') },
                          { id: 'HEADER_RIGHT', label: t('أعلى الهيدر', 'Top Header') },
                        ].map((pos) => (
                          <button
                            key={pos.id}
                            type='button'
                            onClick={() => markDirty(setQrPosition)(pos.id)}
                            className={`h-7 rounded-lg border text-[10.5px] font-bold transition-colors cursor-pointer ${
                              qrPosition === pos.id
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background hover:bg-muted/40 border-border text-muted-foreground'
                            }`}
                          >
                            {pos.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Watermark Card */}
                  <div className='rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-2.5'>
                    <div className='flex items-center justify-between'>
                      <Label htmlFor='tog-wm' className='text-xs font-bold cursor-pointer flex items-center gap-1.5'>
                        <Stamp className='size-3.5' />
                        <span>{t('علامة مائية خلفية (Watermark)', 'Background Watermark')}</span>
                      </Label>
                      <Switch
                        id='tog-wm'
                        checked={showWatermark}
                        onCheckedChange={markDirty(setShowWatermark)}
                      />
                    </div>
                    {showWatermark && (
                      <Input
                        className='h-8 text-xs font-bold uppercase rounded-lg bg-background'
                        placeholder='PAID / مدفوعة'
                        value={watermarkText}
                        onChange={(e) => markDirty(setWatermarkText)(e.target.value)}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── LIVE WYSIWYG PREVIEW CANVAS ── */}
          <div className='flex flex-col rounded-2xl border border-border/80 bg-muted/30 dark:bg-[#131314] shadow-xs overflow-hidden min-h-0'>
            {/* Canvas Top Toolbar */}
            <div className='px-4 py-2.5 border-b border-border/70 bg-card flex items-center justify-between gap-2 flex-wrap shrink-0'>
              <div className='flex items-center gap-2'>
                <span className='size-2 rounded-full bg-[#00d632]' />
                <Eye className='size-3.5 text-muted-foreground' />
                <span className='font-bold text-xs text-foreground'>
                  {t('معاينة حية مطابقة للـ POS والـ PDF', 'Live WYSIWYG Preview')}
                </span>
              </div>

              {/* Quick Paper Toggle + Zoom + Print */}
              <div className='flex items-center gap-2'>
                <div className='hidden sm:flex items-center rounded-lg border border-border/80 p-0.5 bg-muted/40'>
                  <button
                    type='button'
                    onClick={() => {
                      setPaperSize('80MM')
                      setLayoutStyle('THERMAL_POS')
                      setHasUnsaved(true)
                    }}
                    className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold cursor-pointer transition-colors ${
                      paperSize === '80MM'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    80mm
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      setPaperSize('A4')
                      setLayoutStyle(layoutStyle === 'THERMAL_POS' ? 'MODERN' : layoutStyle)
                      setHasUnsaved(true)
                    }}
                    className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold cursor-pointer transition-colors ${
                      paperSize === 'A4'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    A4
                  </button>
                </div>

                <div className='flex items-center gap-0.5 rounded-lg border border-border/80 bg-background px-1 py-0.5'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='size-6'
                    onClick={() => setPreviewScale((s) => Math.max(0.7, Math.round((s - 0.1) * 10) / 10))}
                    title={t('تصغير', 'Zoom Out')}
                  >
                    <ZoomOut className='size-3.5' />
                  </Button>
                  <span className='text-[11px] font-mono w-10 text-center font-bold text-muted-foreground'>
                    {Math.round(previewScale * 100)}%
                  </span>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='size-6'
                    onClick={() => setPreviewScale((s) => Math.min(1.2, Math.round((s + 0.1) * 10) / 10))}
                    title={t('تكبير', 'Zoom In')}
                  >
                    <ZoomIn className='size-3.5' />
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='size-6'
                    onClick={() => setPreviewScale(1)}
                    title={t('الحجم الطبيعي', 'Reset Zoom')}
                  >
                    <Maximize2 className='size-3' />
                  </Button>
                </div>

                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => window.print()}
                  className='h-7 px-2.5 text-[11px] font-bold gap-1 rounded-lg cursor-pointer'
                >
                  <Printer className='size-3.5' />
                  <span className='hidden sm:inline'>{t('تجربة طباعة', 'Test Print')}</span>
                </Button>
              </div>
            </div>

            {/* Subtle Dot-Grid Stage with Real <CustomizedInvoiceView /> */}
            <div
              dir={dir}
              className='flex-1 overflow-auto p-6 flex items-start justify-center'
              style={{
                backgroundImage:
                  'radial-gradient(circle, rgba(128,128,128,0.18) 1px, transparent 1px)',
                backgroundSize: '18px 18px',
              }}
            >
              <div
                style={{
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease',
                }}
                className='flex justify-center'
              >
                <CustomizedInvoiceView
                  invoice={sampleInvoice}
                  template={liveTemplate}
                  merchant={currentMerchant}
                  branch={currentBranch}
                  cashierName={currentUser.name}
                  className='shadow-xl overflow-hidden'
                />
              </div>
            </div>
          </div>
        </div>
      </Main>
    </>
  )
}
