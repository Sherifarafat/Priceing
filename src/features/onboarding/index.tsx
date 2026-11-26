import * as React from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowRight,
  Building2,
  Camera,
  Check,
  Coffee,
  GitBranch,
  Home,
  Laptop,
  Loader2,
  MapPin,
  Minus,
  Phone,
  Pill,
  Plus,
  QrCode,
  ScanLine,
  Shirt,
  ShoppingBasket,
  Sparkles,
  Store,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeSwitch } from '@/components/theme-switch'
import { LanguageSwitch } from '@/components/language-switch'
import { GreenScanLogo } from '@/components/green-scan-logo'
import { useDirection } from '@/context/direction-provider'
import { useAuthStore } from '@/stores/auth-store'
import { useSaaSStore } from '@/lib/saas-store'
import { api } from '@/lib/api-client'

const APPLE_FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Arabic", "Plus Jakarta Sans", "Readex Pro", system-ui, sans-serif'

const BUSINESS_TYPES = [
  { id: 'Supermarket & Groceries', labelEn: 'Supermarket & Groceries', labelAr: 'سوبر ماركت وبقالة', icon: ShoppingBasket },
  { id: 'Fashion & Apparel', labelEn: 'Fashion & Apparel', labelAr: 'ملابس وأزياء', icon: Shirt },
  { id: 'Electronics & Tech', labelEn: 'Electronics & Tech', labelAr: 'إلكترونيات وموبايلات', icon: Laptop },
  { id: 'Health & Pharmacy', labelEn: 'Health & Pharmacy', labelAr: 'صيدلية وعناية صحية', icon: Pill },
  { id: 'Cosmetics & Beauty', labelEn: 'Cosmetics & Beauty', labelAr: 'تجميل وعطور', icon: Sparkles },
  { id: 'Home & Furniture', labelEn: 'Home & Furniture', labelAr: 'أدوات منزلية', icon: Home },
  { id: 'Cafe & Bakery', labelEn: 'Café & Bakery', labelAr: 'كافيه ومخبوزات', icon: Coffee },
  { id: 'Other Retail', labelEn: 'Other Retail', labelAr: 'نشاط تجاري آخر', icon: Building2 },
] as const

const BRANCH_PRESETS = [1, 2, 3, 5, 10]

const copy = {
  en: {
    stepPill: 'STEP 2 OF 2 • STORE SETUP',
    title: 'Set up your store',
    sub: 'Add your brand identity, contact details, business type, and branch count. We’ll prepare your portal & live QR codes automatically.',
    logoLabel: 'Store Logo',
    logoHint: 'Click to upload PNG/JPG or paste an image URL',
    logoPlaceholder: 'Or paste logo image URL...',
    upload: 'Upload',
    remove: 'Remove',
    nameLabel: 'Store Name',
    namePlaceholder: 'e.g. Metro Market',
    typeLabel: 'Business Type',
    contactLabel: 'Contact Details',
    phonePlaceholder: '+20 100 000 0000',
    addressPlaceholder: 'City, Street, Area (e.g. Dokki, Cairo)',
    branchesLabel: 'Number of Branches',
    branchesHint: 'We’ll automatically create a ready-to-scan QR code for each branch.',
    submit: 'Launch My Store',
    submitting: 'Setting up your store...',
    previewTitle: 'Live Store Preview',
    previewTrial: '30-Day Free Trial Active',
    previewPortal: 'Store Portal',
    previewScannerHeader: 'Customer Phone Scanner',
    previewBranches: (n: number) => `${n} ${n === 1 ? 'Branch QR' : 'Branch QRs'} Ready`,
    previewNoPhone: 'Phone number not added yet',
    previewNoAddress: 'Location not added yet',
    previewDefaultName: 'Your Store Name',
    errNameRequired: 'Please enter your store name.',
    successToast: (name: string) => `${name} is ready! Welcome to Green Scan.`,
    errGeneric: 'Could not complete store setup. Please try again.',
  },
  ar: {
    stepPill: 'الخطوة 2 من 2 • إعداد المتجر',
    title: 'جهّز بيانات متجرك',
    sub: 'أضف لوجو واسم متجرك، بيانات التواصل، نوع النشاط، وعدد الفروع — وهنجهّزلك لوحة التحكم ورموز الـ QR تلقائياً.',
    logoLabel: 'لوجو المتجر',
    logoHint: 'اضغط لرفع صورة اللوجو أو الصق رابط صورة',
    logoPlaceholder: 'أو الصق رابط صورة اللوجو...',
    upload: 'رفع صورة',
    remove: 'حذف',
    nameLabel: 'اسم المتجر / النشاط',
    namePlaceholder: 'مثال: مترو ماركت',
    typeLabel: 'نوع النشاط',
    contactLabel: 'بيانات التواصل',
    phonePlaceholder: 'رقم الهاتف أو الواتساب (+20 10...)',
    addressPlaceholder: 'العنوان / المدينة (مثال: الدقي، الجيزة)',
    branchesLabel: 'عدد الفروع',
    branchesHint: 'هننشئلك رمز QR جاهز للمسح لكل فرع تلقائياً.',
    submit: 'تجهيز المتجر والدخول للوحة التحكم',
    submitting: 'جاري تجهيز متجرك...',
    previewTitle: 'معاينة حية لمتجرك',
    previewTrial: 'التجربة المجانية (30 يوم) مفعّلة',
    previewPortal: 'بوابة المتجر',
    previewScannerHeader: 'شكل السكانر على موبايل العميل',
    previewBranches: (n: number) =>
      n === 1 ? 'فرع واحد جاهز برمز QR' : `${n} فروع جاهزة برموز QR`,
    previewNoPhone: 'لم يتم إضافة رقم هاتف بعد',
    previewNoAddress: 'لم يتم إضافة العنوان بعد',
    previewDefaultName: 'اسم متجرك هنا',
    errNameRequired: 'يرجى إدخال اسم المتجر.',
    successToast: (name: string) => `تم تجهيز متجر ${name} بنجاح! أهلاً بك في Green Scan.`,
    errGeneric: 'تعذّر حفظ بيانات المتجر، حاول مرة أخرى.',
  },
} as const

export function MerchantOnboarding() {
  const navigate = useNavigate()
  const { dir } = useDirection()
  const { auth } = useAuthStore()
  const isAr = dir === 'rtl'
  const t = copy[isAr ? 'ar' : 'en']

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const [storeName, setStoreName] = React.useState('')
  const [logo, setLogo] = React.useState('')
  const [businessType, setBusinessType] = React.useState<string>(BUSINESS_TYPES[0].id)
  const [phone, setPhone] = React.useState('')
  const [address, setAddress] = React.useState('')
  const [branchesCount, setBranchesCount] = React.useState<number>(1)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogo(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const activeTypeObj =
    BUSINESS_TYPES.find((bt) => bt.id === businessType) || BUSINESS_TYPES[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!storeName.trim()) {
      setError(t.errNameRequired)
      return
    }

    setIsSubmitting(true)
    try {
      const res = await api.merchants.onboarding({
        name: storeName.trim(),
        logo: logo.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        businessType,
        branchesCount,
        email: auth.user?.email,
      })

      if (res?.user) {
        auth.setUser({
          accountNo: res.user.id,
          email: res.user.email,
          role: [res.user.role],
          exp: Date.now() + 24 * 60 * 60 * 1000,
        })
      }

      await useSaaSStore.getState().fetchFromBackend()
      if (res?.user?.id) {
        useSaaSStore.getState().switchUser(res.user.id)
      }

      toast.success(t.successToast(storeName.trim()))
      navigate({ to: '/dashboard', replace: true })
    } catch (err: any) {
      const msg = err?.message || t.errGeneric
      setError(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      dir={dir}
      style={{
        fontFamily: APPLE_FONT_STACK,
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      }}
      className='relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#F5F6F7] dark:bg-[#061006] overflow-x-hidden'
    >
      {/* Top Bar */}
      <div className='absolute top-5 inset-x-5 sm:inset-x-8 flex items-center justify-between z-20'>
        <Link to='/' className='transition-transform hover:scale-105'>
          <GreenScanLogo size='sm' />
        </Link>
        <div className='flex items-center gap-2'>
          <LanguageSwitch />
          <ThemeSwitch />
        </div>
      </div>

      {/* Main Split Onboarding Card */}
      <div className='w-full max-w-5xl bg-card border border-border/70 rounded-[2.25rem] shadow-[0_24px_70px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.5)] p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative z-10 mt-14 mb-6'>
        {/* ── LEFT COLUMN: Setup Form (7 cols) ── */}
        <form onSubmit={handleSubmit} className='lg:col-span-7 flex flex-col justify-between space-y-6'>
          <div className='space-y-5'>
            {/* Header */}
            <div className='space-y-2'>
              <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D632]/15 border border-[#00D632]/30 text-[10px] font-bold tracking-wider uppercase text-foreground'>
                <span className='size-1.5 rounded-full bg-[#00D632]' />
                <span>{t.stepPill}</span>
              </div>
              <h1 className='text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground'>
                {t.title}
              </h1>
              <p className='text-xs sm:text-[13px] text-muted-foreground leading-relaxed'>
                {t.sub}
              </p>
            </div>

            {/* 1. Store Logo */}
            <div className='space-y-2'>
              <Label className='text-xs font-semibold text-foreground'>{t.logoLabel}</Label>
              <div className='flex items-center gap-3.5'>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className='relative group size-16 rounded-2xl border-2 border-dashed border-border hover:border-[#00D632] bg-muted/40 flex items-center justify-center overflow-hidden cursor-pointer shrink-0 transition-colors'
                >
                  {logo ? (
                    <img src={logo} alt='Store Logo' className='size-full object-cover' />
                  ) : (
                    <Camera className='size-5 text-muted-foreground group-hover:text-foreground transition-colors' />
                  )}
                  <div className='absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold'>
                    {t.upload}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={handleLogoUpload}
                />
                <div className='flex-1 min-w-0 space-y-1.5'>
                  <div className='flex items-center gap-1.5'>
                    <Input
                      placeholder={t.logoPlaceholder}
                      value={logo}
                      onChange={(e) => setLogo(e.target.value)}
                      className='h-10 rounded-xl text-xs bg-muted/40 dark:bg-muted/20 border-border/80'
                    />
                    {logo && (
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        onClick={() => setLogo('')}
                        className='size-10 rounded-xl text-destructive hover:bg-destructive/10 shrink-0'
                        title={t.remove}
                      >
                        <X className='size-4' />
                      </Button>
                    )}
                  </div>
                  <p className='text-[11px] text-muted-foreground'>{t.logoHint}</p>
                </div>
              </div>
            </div>

            {/* 2. Store Name */}
            <div className='space-y-2'>
              <Label htmlFor='store-name' className='text-xs font-semibold text-foreground'>
                {t.nameLabel} *
              </Label>
              <div className='relative'>
                <Store className='size-4 text-muted-foreground absolute start-3.5 top-1/2 -translate-y-1/2' />
                <Input
                  id='store-name'
                  required
                  placeholder={t.namePlaceholder}
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className='ps-10 h-11 rounded-2xl text-xs bg-muted/40 dark:bg-muted/20 border-border/80 focus-visible:border-[#00D632] focus-visible:ring-[#00D632]/30'
                />
              </div>
            </div>

            {/* 3. Business Type */}
            <div className='space-y-2'>
              <Label className='text-xs font-semibold text-foreground'>{t.typeLabel}</Label>
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
                {BUSINESS_TYPES.map((bt) => {
                  const Icon = bt.icon
                  const selected = businessType === bt.id
                  return (
                    <button
                      key={bt.id}
                      type='button'
                      onClick={() => setBusinessType(bt.id)}
                      className={`p-2.5 rounded-2xl border text-start transition-all flex flex-col gap-1.5 cursor-pointer ${
                        selected
                          ? 'bg-[#061006] text-white border-[#061006] dark:bg-[#00D632] dark:text-[#061006] dark:border-[#00D632] shadow-sm'
                          : 'bg-muted/30 text-foreground border-border/70 hover:border-border hover:bg-muted/60'
                      }`}
                    >
                      <Icon
                        className={`size-4 ${
                          selected
                            ? 'text-[#00D632] dark:text-[#061006]'
                            : 'text-muted-foreground'
                        }`}
                      />
                      <span className='text-[11px] font-semibold leading-snug line-clamp-2'>
                        {isAr ? bt.labelAr : bt.labelEn}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 4. Contact Details (Phone + Address) */}
            <div className='space-y-2'>
              <Label className='text-xs font-semibold text-foreground'>{t.contactLabel}</Label>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <div className='relative'>
                  <Phone className='size-4 text-muted-foreground absolute start-3.5 top-1/2 -translate-y-1/2' />
                  <Input
                    type='tel'
                    placeholder={t.phonePlaceholder}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className='ps-10 h-11 rounded-2xl text-xs bg-muted/40 dark:bg-muted/20 border-border/80'
                  />
                </div>
                <div className='relative'>
                  <MapPin className='size-4 text-muted-foreground absolute start-3.5 top-1/2 -translate-y-1/2' />
                  <Input
                    placeholder={t.addressPlaceholder}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className='ps-10 h-11 rounded-2xl text-xs bg-muted/40 dark:bg-muted/20 border-border/80'
                  />
                </div>
              </div>
            </div>

            {/* 5. Number of Branches */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label className='text-xs font-semibold text-foreground'>{t.branchesLabel}</Label>
                <span className='text-[11px] text-muted-foreground font-mono font-semibold'>
                  {branchesCount}
                </span>
              </div>

              <div className='flex flex-wrap items-center gap-2'>
                {/* Stepper */}
                <div className='inline-flex items-center rounded-2xl border border-border/80 bg-muted/30 p-1'>
                  <button
                    type='button'
                    onClick={() => setBranchesCount((c) => Math.max(1, c - 1))}
                    className='size-8 rounded-xl hover:bg-background flex items-center justify-center text-foreground transition-colors cursor-pointer'
                  >
                    <Minus className='size-3.5' />
                  </button>
                  <span className='w-10 text-center text-sm font-bold font-mono text-foreground'>
                    {branchesCount}
                  </span>
                  <button
                    type='button'
                    onClick={() => setBranchesCount((c) => Math.min(25, c + 1))}
                    className='size-8 rounded-xl hover:bg-background flex items-center justify-center text-foreground transition-colors cursor-pointer'
                  >
                    <Plus className='size-3.5' />
                  </button>
                </div>

                {/* Preset Chips */}
                <div className='flex items-center gap-1.5 flex-wrap'>
                  {BRANCH_PRESETS.map((num) => (
                    <button
                      key={num}
                      type='button'
                      onClick={() => setBranchesCount(num)}
                      className={`h-9 min-w-10 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        branchesCount === num
                          ? 'bg-[#061006] text-white border-[#061006] dark:bg-[#00D632] dark:text-[#061006] dark:border-[#00D632]'
                          : 'bg-background text-muted-foreground border-border/80 hover:text-foreground'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
              <p className='text-[11px] text-muted-foreground'>{t.branchesHint}</p>
            </div>

            {error && (
              <div className='rounded-xl bg-destructive/10 border border-destructive/20 px-3.5 py-2.5 text-xs text-destructive font-medium'>
                {error}
              </div>
            )}
          </div>

          <Button
            type='submit'
            disabled={isSubmitting}
            className='w-full h-12 rounded-full font-bold text-sm bg-[#061006] hover:bg-black text-white dark:bg-[#00D632] dark:hover:bg-[#19e848] dark:text-[#061006] shadow-lg active:scale-[0.99] transition-all gap-2 cursor-pointer'
          >
            {isSubmitting ? (
              <>
                <Loader2 className='size-4 animate-spin' />
                <span>{t.submitting}</span>
              </>
            ) : (
              <>
                <span>{t.submit}</span>
                <ArrowRight className={`size-4 ${isAr ? 'rotate-180' : ''}`} />
              </>
            )}
          </Button>
        </form>

        {/* ── RIGHT COLUMN: Live Store & Scanner Identity Preview (5 cols) ── */}
        <div className='lg:col-span-5 relative rounded-[1.75rem] bg-[#061006] text-white p-6 sm:p-7 flex flex-col justify-between overflow-hidden'>
          <div className='pointer-events-none absolute -top-20 -end-20 size-64 rounded-full bg-[#00D632]/25 blur-3xl' />
          <div className='pointer-events-none absolute -bottom-24 -start-16 size-64 rounded-full bg-[#00D632]/15 blur-3xl' />

          {/* Top Status */}
          <div className='relative z-10 flex items-center justify-between gap-2'>
            <span className='text-[11px] font-bold uppercase tracking-wider text-neutral-400'>
              {t.previewTitle}
            </span>
            <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00D632]/15 text-[#00D632] text-[10px] font-bold'>
              <Check className='size-3 stroke-[3]' /> {t.previewTrial}
            </span>
          </div>

          {/* Center Live Identity Cards */}
          <div className='relative z-10 my-6 space-y-4'>
            {/* Store Portal Card */}
            <div className='rounded-2xl bg-white/[0.06] border border-white/10 p-4 space-y-3.5 backdrop-blur-xs'>
              <div className='flex items-center gap-3'>
                {logo ? (
                  <img
                    src={logo}
                    alt={storeName || 'Logo'}
                    className='size-12 rounded-2xl object-cover border border-white/20 shrink-0'
                  />
                ) : (
                  <div className='size-12 rounded-2xl bg-[#00D632] text-[#061006] flex items-center justify-center font-extrabold text-lg shrink-0'>
                    {(storeName.trim()[0] || 'G').toUpperCase()}
                  </div>
                )}
                <div className='min-w-0'>
                  <h3 className='text-base font-bold text-white truncate'>
                    {storeName.trim() || t.previewDefaultName}
                  </h3>
                  <p className='text-[11px] text-neutral-400 truncate'>
                    {isAr ? activeTypeObj.labelAr : activeTypeObj.labelEn}
                  </p>
                </div>
              </div>

              <div className='pt-3 border-t border-white/10 space-y-1.5 text-[11px] text-neutral-300'>
                <div className='flex items-center gap-2'>
                  <Phone className='size-3.5 text-[#00D632] shrink-0' />
                  <span className='truncate font-mono' dir='ltr'>
                    {phone.trim() || t.previewNoPhone}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <MapPin className='size-3.5 text-[#00D632] shrink-0' />
                  <span className='truncate'>{address.trim() || t.previewNoAddress}</span>
                </div>
              </div>
            </div>

            {/* Customer Phone Scanner Mini Preview */}
            <div className='rounded-2xl bg-neutral-950 border border-white/10 p-4 space-y-3'>
              <div className='flex items-center justify-between text-[10px] font-semibold text-neutral-400'>
                <span>{t.previewScannerHeader}</span>
                <ScanLine className='size-3.5 text-[#00D632]' />
              </div>

              <div className='rounded-2xl bg-[#00D632] text-[#061006] p-3.5 flex items-center justify-between gap-3'>
                <div className='flex items-center gap-2.5 min-w-0'>
                  {logo ? (
                    <img
                      src={logo}
                      alt='Scanner Avatar'
                      className='size-9 rounded-full object-cover border border-[#061006]/20 shrink-0'
                    />
                  ) : (
                    <div className='size-9 rounded-full bg-[#061006] text-[#00D632] flex items-center justify-center font-extrabold text-xs shrink-0'>
                      {(storeName.trim()[0] || 'G').toUpperCase()}
                    </div>
                  )}
                  <div className='min-w-0'>
                    <p className='text-xs font-extrabold truncate'>
                      {storeName.trim() || t.previewDefaultName}
                    </p>
                    <p className='text-[10px] font-semibold opacity-75'>Green Scan Live</p>
                  </div>
                </div>
                <div className='size-8 rounded-xl bg-[#061006] text-[#00D632] flex items-center justify-center shrink-0'>
                  <QrCode className='size-4' />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Branch Summary */}
          <div className='relative z-10 rounded-2xl bg-white/[0.06] border border-white/10 px-4 py-3 flex items-center justify-between text-xs'>
            <span className='inline-flex items-center gap-2 font-semibold text-white'>
              <GitBranch className='size-4 text-[#00D632]' />
              <span>{t.previewBranches(branchesCount)}</span>
            </span>
            <span className='font-mono text-[#00D632] font-bold'>QR ✓</span>
          </div>
        </div>
      </div>
    </div>
  )
}
