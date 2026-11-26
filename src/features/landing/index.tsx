import * as React from 'react'
import { Link } from '@tanstack/react-router'
import {
  AlertCircle,
  ArrowRight,
  Check,
  Gift,
  Globe,
  Pause,
  Play,
  QrCode,
  RefreshCw,
  ScanLine,
  ShoppingCart,
  Smartphone,
  Smile,
  Sparkles,
  Tag,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useDirection } from '@/context/direction-provider'
import { setCookie } from '@/lib/cookies'

type Lang = 'en' | 'ar'
type BillingCycle = 'monthly' | 'yearly'

interface StoryScene {
  id: string
  image: string
  isSolution?: boolean
  badgeEn: string
  badgeAr: string
  chipEn: string
  chipAr: string
  calloutEn: string
  calloutAr: string
  titleEn: string
  titleAr: string
  descEn: string
  descAr: string
  priceTag?: string
}

const HERO_STORY_SCENES: StoryScene[] = [
  {
    id: 'missing-price',
    image: '/images/landing/scene-missing-price.jpg',
    badgeEn: 'The daily struggle',
    badgeAr: 'المعاناة اليومية',
    chipEn: 'Missing price',
    chipAr: 'السعر مش باين',
    calloutEn: 'Torn or missing shelf sticker',
    calloutAr: 'ستيكر مقطوع أو مش باين',
    titleEn: '“Wait… how much is this?”',
    titleAr: '«يا ترى المنتج ده بكام؟»',
    descEn:
      'Shoppers pick up an item and face faded, peeling, or missing price stickers on the shelf.',
    descAr:
      'العميل يمسك المنتج ويحتار قدام ستيكر مقطوع أو باهت أو واقع من على الرف.',
  },
  {
    id: 'sticker-hassle',
    image: '/images/landing/scene-sticker-hassle.jpg',
    badgeEn: 'Store team hassle',
    badgeAr: 'تعب تغيير الأسعار',
    chipEn: 'Re-stickering',
    chipAr: 'تغيير الاستيكرز',
    calloutEn: 'Hours lost on every price change',
    calloutAr: 'ساعات ضايعة مع كل تغيير سعر',
    titleEn: 'Endless printing & re-labeling.',
    titleAr: 'طباعة ولزق مبتخلصش.',
    descEn:
      'Every price update means peeling old labels and re-sticking hundreds of items by hand.',
    descAr:
      'مع كل تعديل سعر، فريق المتجر بيضيع ساعات في شيل ولزق مئات الاستيكرات الورقية.',
  },
  {
    id: 'green-scan-supermarket',
    image: '/images/landing/scene-green-scan.jpg',
    isSolution: true,
    badgeEn: 'Supermarkets',
    badgeAr: 'السوبر ماركت',
    chipEn: 'Supermarkets',
    chipAr: 'سوبر ماركت',
    calloutEn: '65.00 LE · Instant 0.1s scan',
    calloutAr: '65.00 LE · قراءة في 0.1 ثانية',
    titleEn: 'One scan. Zero shelf stickers.',
    titleAr: 'مسحة واحدة. ولا ستيكر على الرف.',
    descEn:
      'Clean sticker-free shelves and effortless, fun grocery shopping right from any phone.',
    descAr:
      'أرفف نظيفة بدون ستيكرز، وتسوق ممتع وسلس — السعر الحقيقي ظاهر فوراً على موبايل العميل.',
    priceTag: '65.00 LE',
  },
  {
    id: 'green-scan-cosmetics',
    image: '/images/landing/scene-cosmetics.jpg',
    isSolution: true,
    badgeEn: 'Cosmetics & Beauty',
    badgeAr: 'مستحضرات التجميل',
    chipEn: 'Cosmetics',
    chipAr: 'مستحضرات تجميل',
    calloutEn: '490.00 LE · Spotless packaging',
    calloutAr: '490.00 LE · عبوات بدون ستيكر',
    titleEn: 'Keep beauty packaging spotless.',
    titleAr: 'حافظ على شياكة عبوات التجميل.',
    descEn:
      'Never cover luxury serums or perfume bottles with sticky paper labels — just scan the barcode.',
    descAr:
      'مش محتاج تبوّظ شكل زجاجات العطور والسيروم بستيكرات ورقية — العميلة تمسح الباركود وتعرف السعر فوراً.',
    priceTag: '490.00 LE',
  },
  {
    id: 'green-scan-fashion',
    image: '/images/landing/scene-fashion.jpg',
    isSolution: true,
    badgeEn: 'Fashion & Apparel',
    badgeAr: 'متاجر الملابس',
    chipEn: 'Fashion',
    chipAr: 'متاجر الملابس',
    calloutEn: '850.00 LE · Live seasonal sales',
    calloutAr: '850.00 LE · خصومات وعروض لحظية',
    titleEn: 'Effortless pricing for fashion.',
    titleAr: 'تسعير عصري لمتاجر الملابس.',
    descEn:
      'Update sale prices across your boutique in one click without re-tagging hundreds of garments.',
    descAr:
      'اعملي خصومات الموسم بضغطة واحدة من غير ما تغيّري تكت مئات القطع — العميل يمسح الباركود ويعرف السعر فوراً.',
    priceTag: '850.00 LE',
  },
]

const SCENE_DURATION_MS = 4400

const APPLE_FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Arabic", "Plus Jakarta Sans", "Readex Pro", system-ui, sans-serif'

const copy = {
  en: {
    nav: {
      story: 'Why Green Scan',
      stores: 'For Stores',
      how: 'How it works',
      pricing: 'Pricing',
      login: 'Log in',
      signup: 'Sign up',
      dashboard: 'Dashboard',
    },
    hero: {
      pill: '30-day free trial · No credit card required',
      title1: 'Shopping, reimagined.',
      title2: 'Prices in a scan.',
      sub: 'Point a phone camera at any barcode to know the live price in 0.1s. Shopping becomes lighter and more fun — and stores never print, stick, or replace torn price tags again.',
      ctaTrial: 'Start 30-day free trial',
      ctaLogin: 'Log in',
      reelLabel: 'Real-life in-store experience',
      liveFeedTitle: 'Live store story',
      liveFeedSub: 'Tap any scene below to explore',
    },
    problem: {
      eyebrow: 'Goodbye paper stickers',
      title: 'Never stick, peel, or reprint a price tag again.',
      sub: 'Paper price stickers tear, fade, fall off products, and waste hours every time prices change. Green Scan replaces every shelf sticker with one clean store QR code.',
      points: [
        'Zero torn, faded, or missing price stickers on your shelves',
        'Change any price once — every shopper sees it live immediately',
        'No app downloads needed — opens natively in the phone browser',
      ],
      img1Label: 'Missing & torn shelf tags',
      img2Label: 'Hours lost re-labeling',
    },
    stores: {
      eyebrow: 'Designed for modern retail',
      title: 'Made for supermarkets, cosmetics, and fashion.',
      sub: 'Whether you display groceries, luxury skincare, or seasonal collections, Green Scan keeps your shelves spotless and your shoppers smiling.',
      cards: [
        {
          image: '/images/landing/scene-green-scan.jpg',
          pill: 'Supermarkets & Groceries',
          title: 'Instant prices across every aisle',
          desc: 'Shoppers scan items on the go and track their basket total in LE before reaching checkout.',
        },
        {
          image: '/images/landing/scene-cosmetics.jpg',
          pill: 'Cosmetics & Beauty',
          title: 'Spotless luxury packaging',
          desc: 'Keep perfume boxes and skincare bottles clean without sticky paper price tags ruining the look.',
        },
        {
          image: '/images/landing/scene-fashion.jpg',
          pill: 'Fashion & Apparel',
          title: 'Launch sales in one click',
          desc: 'Update seasonal discounts instantly without re-tagging hundreds of garments — shoppers scan the hangtag.',
        },
      ],
    },
    how: {
      eyebrow: 'Effortless by design',
      title: 'Three seconds from shelf to price.',
      steps: [
        {
          num: '01',
          title: 'Scan the store QR',
          desc: 'One quick scan at the entrance opens your branded scanner right in the browser — zero downloads.',
        },
        {
          num: '02',
          title: 'Point at any barcode',
          desc: 'Aim at any product barcode for a crisp beep and a clear green price card in LE.',
        },
        {
          num: '03',
          title: 'Know your cart live',
          desc: 'Add items with one tap so shoppers always know their exact basket total before checkout.',
        },
      ],
      trust: [
        { icon: Smile, text: 'No awkward asking for prices' },
        { icon: RefreshCw, text: 'Always synced with live catalog' },
        { icon: QrCode, text: 'Dedicated QR per store & branch' },
      ],
    },
    pricing: {
      eyebrow: 'Simple pricing',
      title: 'Start free for 30 days.',
      sub: 'Try Green Scan in your store risk-free. No credit card needed — upgrade whenever you’re ready.',
      trialPill: '30-day free trial on every plan',
      monthly: 'Monthly',
      yearly: 'Yearly',
      saveBadge: 'Save 20%',
      perMonth: '/ month',
      trialNote: 'Free for 30 days · Cancel anytime',
      cta: 'Start 30-day free trial',
      popularBadge: 'Most popular',
      plans: [
        {
          id: 'starter',
          name: 'Starter',
          desc: 'For single stores, boutiques & mini-markets.',
          monthlyPrice: 299,
          yearlyPrice: 239,
          popular: false,
          features: [
            '1 store branch + dedicated QR code',
            'Up to 1,000 products with live price updates',
            'Unlimited customer barcode scans',
            'Your store logo on the customer scanner',
            'Built-in customer basket calculator',
          ],
        },
        {
          id: 'growth',
          name: 'Growth',
          desc: 'For growing supermarkets, cosmetics & fashion brands.',
          monthlyPrice: 599,
          yearlyPrice: 479,
          popular: true,
          features: [
            'Up to 5 branches with separate QR codes',
            'Unlimited products & instant price sync',
            'Unlimited customer barcode scans',
            'Custom store branding & full-screen scanner',
            'Live scan insights & top scanned items',
            'Priority WhatsApp & phone support',
          ],
        },
        {
          id: 'chain',
          name: 'Retail Chain',
          desc: 'For hypermarkets & multi-city retail chains.',
          monthlyPrice: 1299,
          yearlyPrice: 1039,
          popular: false,
          features: [
            'Unlimited branches & QR endpoints',
            'Unlimited products & high-traffic scanning',
            'Dedicated onboarding & catalog setup help',
            'Multi-branch manager accounts',
            'Dedicated account support & SLA',
          ],
        },
      ],
    },
    finale: {
      pill: '30 days free · No credit card',
      title: 'Ready to ditch price stickers for good?',
      sub: 'Create your store account in under a minute, add your logo and branches, and get your live QR codes right inside your dashboard.',
      ctaSignUp: 'Start 30-day free trial',
      ctaLogin: 'Log in',
    },
    footer: {
      tagline: 'Making shopping lighter, more fun, and sticker-free.',
      pricing: 'Pricing',
      login: 'Log in',
      signup: 'Sign up',
      dashboard: 'Dashboard',
      rights: '© 2026 Green Scan. All rights reserved.',
    },
  },
  ar: {
    nav: {
      story: 'ليه Green Scan',
      stores: 'أنواع المتاجر',
      how: 'كيف يعمل',
      pricing: 'الأسعار',
      login: 'تسجيل الدخول',
      signup: 'إنشاء حساب',
      dashboard: 'لوحة التحكم',
    },
    hero: {
      pill: 'تجربة مجانية 30 يوم · بدون بطاقة بنكية',
      title1: 'التسوق بشكل جديد.',
      title2: 'اعرف السعر في لحظة.',
      sub: 'العميل يوجّه كاميرا موبايله على باركود أي منتج ويعرف السعر الحقيقي فوراً بمتعة وسهولة — ومتجرك مش محتاج يطبع أو يلزق أو يغيّر ستيكرات أسعار بتتلف تاني.',
      ctaTrial: 'ابدأ تجربة 30 يوم مجاناً',
      ctaLogin: 'تسجيل الدخول',
      reelLabel: 'تجربة واقعية داخل المتجر',
      liveFeedTitle: 'قصة التسوق الحقيقية',
      liveFeedSub: 'اضغط على أي مشهد للتنقل',
    },
    problem: {
      eyebrow: 'وداعاً للاستيكرز الورقية',
      title: 'مش محتاج تلزق ستيكر، ولا تغيّره، ولا يتلف تاني.',
      sub: 'ستيكرات الأسعار بتتقطع وتقع من على المنتجات، ومع كل تغيير سعر بتضيع ساعات في الطباعة والتبديل. Green Scan بيستبدل كل الاستيكرات بكود QR واحد شيك في متجرك.',
      points: [
        'لا مزيد من الاستيكرات المقطوعة أو الباهتة أو الواقعة من الأرفف',
        'عدّل السعر مرة واحدة وهيظهر محدث لحظياً على موبايل كل عميل',
        'بدون تحميل أي تطبيق — يشتغل مباشرة من متصفح الموبايل',
      ],
      img1Label: 'ستيكر مقطوع أو مش باين',
      img2Label: 'ساعات ضايعة في التغيير',
    },
    stores: {
      eyebrow: 'مصمم لكل المتاجر العصرية',
      title: 'مثالي للسوبر ماركت، مستحضرات التجميل، ومتاجر الملابس.',
      sub: 'سواء كنت بتبيع منتجات غذائية، عطور ومستحضرات تجميل فاخرة، أو ملابس وعروض موسمية — أرففك هتفضل شيك ونظيفة دايماً.',
      cards: [
        {
          image: '/images/landing/scene-green-scan.jpg',
          pill: 'السوبر ماركت والبقالة',
          title: 'أسعار فورية في كل ممر',
          desc: 'العميل يمسح المنتج ويحسب إجمالي سلتة بـ LE أول بأول قبل ما يوصل للكاشير.',
        },
        {
          image: '/images/landing/scene-cosmetics.jpg',
          pill: 'متاجر مستحضرات التجميل',
          title: 'شياكة العبوات بدون ستيكر سعر',
          desc: 'حافظي على شكل زجاجات العطور والسيروم الفاخرة بدون أي ستيكر لاصق يبوّظ مظهرها.',
        },
        {
          image: '/images/landing/scene-fashion.jpg',
          pill: 'متاجر الملابس والأزياء',
          title: 'خصومات الموسم بضغطة واحدة',
          desc: 'عدّل أسعار العروض والـ Sale فوراً من غير ما تغيّر تكت مئات القطع — العميل يمسح الباركود ويعرف السعر.',
        },
      ],
    },
    how: {
      eyebrow: 'سلاسة وبساطة تامة',
      title: 'في 3 ثواني من الرف للسعر.',
      steps: [
        {
          num: '01',
          title: 'امسح QR المتجر',
          desc: 'مسحة واحدة بكاميرا الموبايل بتفتح سكانر متجرك مباشرة على المتصفح — بدون تحميل تطبيقات.',
        },
        {
          num: '02',
          title: 'وجّه الكاميرا للباركود',
          desc: 'وجّه الموبايل لأي منتج وبصوت بيب لطيف تطلع بطاقة خضراء واضحة بالسعر بـ LE فوراً.',
        },
        {
          num: '03',
          title: 'احسب سلتك لحظة بلحظة',
          desc: 'ضيف المنتج لسلتك بضغطة واحدة عشان تبقى عارف إجمالي مشترياتك قبل الكاشير.',
        },
      ],
      trust: [
        { icon: Smile, text: 'تسوق بحرية بدون سؤال عن الأسعار' },
        { icon: RefreshCw, text: 'مربوط لحظياً بكتالوج متجرك' },
        { icon: QrCode, text: 'كود QR خاص لكل متجر وفرع' },
      ],
    },
    pricing: {
      eyebrow: 'باقات اشتراك بسيطة وواضحة',
      title: 'ابدأ مجاناً لمدة 30 يوم.',
      sub: 'جرّب Green Scan في متجرك بدون أي مخاطرة أو بطاقة بنكية — واختار الباقة المناسبة وقت ما تحب.',
      trialPill: 'تجربة مجانية 30 يوم على كل الباقات',
      monthly: 'شهري',
      yearly: 'سنوي',
      saveBadge: 'وفّر 20%',
      perMonth: '/ شهرياً',
      trialNote: 'مجاني لمدة 30 يوم · إلغاء في أي وقت',
      cta: 'ابدأ تجربة 30 يوم مجاناً',
      popularBadge: 'الأكثر اختياراً',
      plans: [
        {
          id: 'starter',
          name: 'البداية (Starter)',
          desc: 'للمتاجر الفردية، البوتيكات، والسوبر ماركت الصغير.',
          monthlyPrice: 299,
          yearlyPrice: 239,
          popular: false,
          features: [
            'فرع واحد + رمز QR خاص بمتجرك',
            'حتى 1,000 منتج مع تحديث لحظي للأسعار',
            'عمليات مسح باركود غير محدودة للعملاء',
            'ظهور لوجو متجرك على شاشة سكانر العميل',
            'سلة تسوق مدمجة لحساب الإجمالي قبل الكاشير',
          ],
        },
        {
          id: 'growth',
          name: 'النمو (Growth)',
          desc: 'لمتاجر السوبر ماركت، مستحضرات التجميل والملابس المتنامية.',
          monthlyPrice: 599,
          yearlyPrice: 479,
          popular: true,
          features: [
            'حتى 5 فروع مع رمز QR مستقل لكل فرع',
            'عدد منتجات غير محدود ومزامنة فورية للأسعار',
            'عمليات مسح باركود غير محدودة للعملاء',
            'تخصيص كامل بلوجو وهوية المتجر',
            'إحصائيات حية لعدد المسحات وأكثر المنتجات بحثاً',
            'دعم فني أولوية عبر واتساب والهاتف',
          ],
        },
        {
          id: 'chain',
          name: 'السلاسل الكبرى',
          desc: 'للهايبر ماركت وسلاسل التجزئة الكبيرة.',
          monthlyPrice: 1299,
          yearlyPrice: 1039,
          popular: false,
          features: [
            'عدد فروع ورموز QR غير محدود',
            'منتجات وعمليات مسح غير محدودة بأعلى سرعة',
            'مساعدة كاملة في رفع وتجهيز الكتالوج لأول مرة',
            'حسابات مستقلة لمديري الفروع',
            'مدير حساب خاص ودعم فني مخصص',
          ],
        },
      ],
    },
    finale: {
      pill: '30 يوم مجاناً · بدون بطاقة بنكية',
      title: 'جاهز تستغنى عن ستيكر الأسعار للأبد؟',
      sub: 'أنشئ حساب متجرك في أقل من دقيقة، ضيف لوجو وفروع متجرك، وهتلاقي رموز الـ QR جاهزة جوا لوحة التحكم فوراً.',
      ctaSignUp: 'ابدأ تجربة 30 يوم مجاناً',
      ctaLogin: 'تسجيل الدخول',
    },
    footer: {
      tagline: 'خلّينا التسوق أمتع وأخف، ومعرفة الأسعار أسهل بدون ستيكرز.',
      pricing: 'الأسعار',
      login: 'تسجيل الدخول',
      signup: 'إنشاء حساب',
      dashboard: 'لوحة التحكم',
      rights: '© 2026 Green Scan. جميع الحقوق محفوظة.',
    },
  },
} as const

export function GreenScanLandingPage() {
  const { auth } = useAuthStore()
  const { dir, setDir } = useDirection()
  const isAuthenticated = Boolean(auth.user && auth.accessToken)

  const lang: Lang = dir === 'rtl' ? 'ar' : 'en'
  const toggleLang = () => {
    const next: Lang = lang === 'en' ? 'ar' : 'en'
    setDir(next === 'ar' ? 'rtl' : 'ltr')
    setCookie('app_language', next, 60 * 60 * 24 * 365)
    document.documentElement.lang = next
  }

  const [activeSceneIdx, setActiveSceneIdx] = React.useState(0)
  const [isPlaying, setIsPlaying] = React.useState(true)
  const [sceneProgress, setSceneProgress] = React.useState(0)
  const [billing, setBilling] = React.useState<BillingCycle>('monthly')
  const [scrolled, setScrolled] = React.useState(false)

  const t = copy[lang]
  const isRtl = lang === 'ar'
  const currentScene = HERO_STORY_SCENES[activeSceneIdx]

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  React.useEffect(() => {
    if (!isPlaying) return
    const tickMs = 50
    const step = (tickMs / SCENE_DURATION_MS) * 100
    const interval = setInterval(() => {
      setSceneProgress((prev) => {
        if (prev + step >= 100) {
          setActiveSceneIdx((idx) => (idx + 1) % HERO_STORY_SCENES.length)
          return 0
        }
        return prev + step
      })
    }, tickMs)
    return () => clearInterval(interval)
  }, [isPlaying])

  const handleSelectScene = (idx: number) => {
    setActiveSceneIdx(idx)
    setSceneProgress(0)
  }

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        fontFamily: APPLE_FONT_STACK,
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      }}
      className='min-h-screen w-full bg-white text-[#111111] selection:bg-[#00D632]/25 selection:text-black overflow-x-hidden'
    >
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TELDA-STYLE ULTRA-CLEAN FLAT STICKY HEADER                             */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <header
        className={`sticky top-0 inset-x-0 z-50 transition-all duration-200 ${
          scrolled
            ? 'bg-white/85 backdrop-blur-xl border-b border-neutral-200/80'
            : 'bg-white border-b border-transparent'
        }`}
      >
        <div className='mx-auto max-w-[1200px] h-18 sm:h-20 px-5 sm:px-8 flex items-center justify-between gap-4'>
          {/* Telda-inspired Minimalist Brand Mark */}
          <a href='#top' className='flex items-center gap-2.5 group shrink-0'>
            <div className='relative size-9 rounded-[12px] bg-[#111111] flex items-center justify-center transition-transform duration-200 group-hover:scale-105'>
              <div className='relative size-4'>
                <span className='absolute top-0 left-0 w-1.5 h-1.5 border-t-[1.8px] border-l-[1.8px] border-[#00D632] rounded-tl-[2px]' />
                <span className='absolute top-0 right-0 w-1.5 h-1.5 border-t-[1.8px] border-r-[1.8px] border-[#00D632] rounded-tr-[2px]' />
                <span className='absolute bottom-0 left-0 w-1.5 h-1.5 border-b-[1.8px] border-l-[1.8px] border-[#00D632] rounded-bl-[2px]' />
                <span className='absolute bottom-0 right-0 w-1.5 h-1.5 border-b-[1.8px] border-r-[1.8px] border-[#00D632] rounded-br-[2px]' />
                <span className='absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1.8px] rounded-full bg-[#00D632]' />
              </div>
            </div>
            <span className='text-[19px] font-extrabold tracking-tight text-[#111111]'>
              green scan<span className='text-[#00D632]'>.</span>
            </span>
          </a>

          {/* Center Minimal Navigation */}
          <nav className='hidden md:flex items-center gap-8'>
            {[
              { href: '#problem', label: t.nav.story },
              { href: '#stores', label: t.nav.stores },
              { href: '#how', label: t.nav.how },
              { href: '#pricing', label: t.nav.pricing },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className='text-[14px] font-medium text-neutral-500 hover:text-[#111111] transition-colors'
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right Actions: Language + Log in + Sign up */}
          <div className='flex items-center gap-2 sm:gap-3 shrink-0'>
            <button
              type='button'
              onClick={toggleLang}
              className='inline-flex items-center gap-1.5 h-9 px-2.5 rounded-full text-xs font-semibold text-neutral-500 hover:text-[#111111] hover:bg-neutral-100 transition-colors cursor-pointer'
              title='Switch Language'
            >
              <Globe className='size-3.5' />
              <span>{lang === 'en' ? 'العربية' : 'EN'}</span>
            </button>

            {isAuthenticated && (
              <Link
                to='/dashboard'
                className='hidden sm:inline-flex items-center h-9 px-3 rounded-full text-xs font-semibold text-[#00a827] hover:bg-[#00D632]/10 transition-colors'
              >
                {t.nav.dashboard}
              </Link>
            )}

            <Link
              to='/sign-in'
              className='inline-flex items-center h-9 px-3.5 rounded-full text-[13px] font-semibold text-[#111111] hover:bg-neutral-100 transition-colors'
            >
              {t.nav.login}
            </Link>

            <Link
              to='/sign-up'
              className='inline-flex items-center justify-center h-10 px-5 rounded-full bg-[#111111] hover:bg-neutral-800 text-white text-[13px] font-semibold transition-all active:scale-95'
            >
              {t.nav.signup}
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: TELDA-STYLE CENTERED EDITORIAL HERO + WIDE CINEMATIC STAGE  */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section id='top' className='bg-white pt-10 pb-20 sm:pt-16 sm:pb-28'>
        <div className='mx-auto max-w-[1200px] px-5 sm:px-8'>
          {/* Centered Telda-Style Copy Stack */}
          <div className='max-w-3xl mx-auto text-center space-y-6'>
            <div className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F5F5F7] text-xs font-semibold text-neutral-700'>
              <span className='size-2 rounded-full bg-[#00D632]' />
              <span>{t.hero.pill}</span>
            </div>

            <h1
              className={`font-extrabold text-[#111111] ${
                isRtl
                  ? 'text-5xl sm:text-6xl lg:text-[72px] leading-[1.15] tracking-[-0.02em]'
                  : 'text-5xl sm:text-7xl lg:text-[78px] leading-[1.02] tracking-[-0.045em]'
              }`}
            >
              <span className='block'>{t.hero.title1}</span>
              <span className='block text-neutral-400'>{t.hero.title2}</span>
            </h1>

            <p className='text-base sm:text-[19px] font-normal text-neutral-500 max-w-2xl mx-auto leading-relaxed'>
              {t.hero.sub}
            </p>

            {/* Clean Centered Telda Pills */}
            <div className='flex flex-wrap items-center justify-center gap-3 pt-2'>
              <Link
                to='/sign-up'
                className='inline-flex items-center justify-center gap-2 h-13 px-8 rounded-full bg-[#111111] hover:bg-neutral-800 text-white text-[15px] font-semibold transition-all hover:scale-[1.02] active:scale-95'
              >
                <span>{t.hero.ctaTrial}</span>
                <ArrowRight className={`size-4 text-[#00D632] ${isRtl ? 'rotate-180' : ''}`} />
              </Link>

              <Link
                to='/sign-in'
                className='inline-flex items-center justify-center h-13 px-8 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111111] text-[15px] font-semibold transition-colors'
              >
                {t.hero.ctaLogin}
              </Link>
            </div>
          </div>

          {/* ── Wide Telda-Style Rounded Visual Showcase Stage (All 5 Real-Life Scenes!) ── */}
          <div className='mt-12 sm:mt-16 rounded-[36px] bg-[#F5F5F7] p-3 sm:p-4 border border-neutral-200/70'>
            <div className='grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch'>
              {/* Wide Real-Life Cinematic Story Reel (8 cols — huge commanding hero stage!) */}
              <div className='lg:col-span-8 relative h-[440px] sm:h-[540px] lg:h-[580px] rounded-[28px] overflow-hidden bg-[#111111] select-none'>
                {HERO_STORY_SCENES.map((scene, idx) => {
                  const isActive = idx === activeSceneIdx
                  return (
                    <img
                      key={scene.id}
                      src={scene.image}
                      alt={isRtl ? scene.titleAr : scene.titleEn}
                      className={`absolute inset-0 size-full object-cover object-center transition-opacity duration-700 ease-out ${
                        isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
                      }`}
                      style={{
                        transform: isActive ? 'scale(1.06)' : 'scale(1.0)',
                        transitionProperty: 'opacity, transform',
                        transitionDuration: isActive ? '700ms, 5200ms' : '700ms, 700ms',
                        transitionTimingFunction: 'ease-out, linear',
                      }}
                    />
                  )
                })}

                {/* Soft Editorial Gradients */}
                <div className='pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/65 via-black/25 to-transparent z-10' />
                <div className='pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/88 via-black/45 to-transparent z-10' />

                {/* Top 5-Segment Progress Bar */}
                <div dir='ltr' className='absolute top-4 inset-x-5 z-20 flex items-center gap-1.5'>
                  {HERO_STORY_SCENES.map((scene, idx) => {
                    const width =
                      idx < activeSceneIdx
                        ? 100
                        : idx === activeSceneIdx
                          ? sceneProgress
                          : 0
                    return (
                      <button
                        key={scene.id}
                        type='button'
                        onClick={() => handleSelectScene(idx)}
                        aria-label={scene.chipEn}
                        className='flex-1 h-1 rounded-full bg-white/30 overflow-hidden cursor-pointer hover:h-1.5 transition-all'
                      >
                        <div
                          className={`h-full rounded-full transition-[width] duration-75 ease-linear ${
                            scene.isSolution ? 'bg-[#00D632]' : 'bg-white'
                          }`}
                          style={{ width: `${width}%` }}
                        />
                      </button>
                    )
                  })}
                </div>

                {/* Top Scene Pill + Play/Pause */}
                <div className='absolute top-9 inset-x-5 z-20 flex items-center justify-between gap-2'>
                  <span
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md ${
                      currentScene.isSolution
                        ? 'bg-[#00D632] text-[#061006]'
                        : 'bg-black/50 text-white border border-white/15'
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        currentScene.isSolution ? 'bg-[#061006]' : 'bg-amber-400 animate-pulse'
                      }`}
                    />
                    <span>{isRtl ? currentScene.badgeAr : currentScene.badgeEn}</span>
                  </span>

                  <button
                    type='button'
                    onClick={() => setIsPlaying((p) => !p)}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    className='size-9 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/15 text-white flex items-center justify-center transition-all cursor-pointer'
                  >
                    {isPlaying ? <Pause className='size-3.5' /> : <Play className='size-3.5 ms-0.5' />}
                  </button>
                </div>

                {/* Bottom Caption */}
                <div className='absolute bottom-6 inset-x-6 z-20 space-y-2.5'>
                  <div
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold backdrop-blur-md ${
                      currentScene.isSolution
                        ? 'bg-[#00D632] text-[#061006]'
                        : 'bg-white/15 text-white border border-white/20'
                    }`}
                  >
                    {currentScene.isSolution ? (
                      <ScanLine className='size-3.5 shrink-0' />
                    ) : activeSceneIdx === 0 ? (
                      <AlertCircle className='size-3.5 text-amber-300 shrink-0' />
                    ) : (
                      <Tag className='size-3.5 text-amber-300 shrink-0' />
                    )}
                    <span>{isRtl ? currentScene.calloutAr : currentScene.calloutEn}</span>
                  </div>

                  <h2 className='text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight'>
                    {isRtl ? currentScene.titleAr : currentScene.titleEn}
                  </h2>
                  <p className='text-xs sm:text-sm text-white/85 max-w-lg leading-relaxed'>
                    {isRtl ? currentScene.descAr : currentScene.descEn}
                  </p>
                </div>
              </div>

              {/* Right Telda-Style Interactive Story Feed Sidebar (4 cols) */}
              <div className='lg:col-span-4 rounded-[28px] bg-white p-5 sm:p-6 flex flex-col justify-between gap-4 border border-neutral-200/70'>
                <div className='space-y-1'>
                  <p className='text-xs font-semibold text-[#00a827]'>{t.hero.reelLabel}</p>
                  <h3 className='text-lg font-bold text-[#111111]'>{t.hero.liveFeedTitle}</h3>
                  <p className='text-xs text-neutral-500'>{t.hero.liveFeedSub}</p>
                </div>

                {/* 5 Clean Clickable Story Cards (Telda transaction-feed style!) */}
                <div className='space-y-2 flex-1 flex flex-col justify-center'>
                  {HERO_STORY_SCENES.map((scene, idx) => {
                    const isActive = idx === activeSceneIdx
                    return (
                      <button
                        key={scene.id}
                        type='button'
                        onClick={() => handleSelectScene(idx)}
                        className={`w-full p-2.5 rounded-2xl flex items-center gap-3 text-start transition-all cursor-pointer border ${
                          isActive
                            ? 'bg-[#111111] text-white border-[#111111] shadow-md'
                            : 'bg-[#F8F9FA] text-[#111111] border-transparent hover:bg-neutral-100'
                        }`}
                      >
                        <img
                          src={scene.image}
                          alt={isRtl ? scene.chipAr : scene.chipEn}
                          className='size-11 rounded-xl object-cover shrink-0'
                        />
                        <div className='min-w-0 flex-1'>
                          <p className='text-xs font-bold truncate'>
                            {isRtl ? scene.chipAr : scene.chipEn}
                          </p>
                          <p
                            className={`text-[11px] truncate ${
                              isActive ? 'text-neutral-300' : 'text-neutral-500'
                            }`}
                          >
                            {isRtl ? scene.calloutAr : scene.calloutEn}
                          </p>
                        </div>
                        {scene.priceTag ? (
                          <span
                            dir='ltr'
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              isActive
                                ? 'bg-[#00D632] text-[#061006]'
                                : 'bg-[#00D632]/15 text-[#008f20]'
                            }`}
                          >
                            {scene.priceTag}
                          </span>
                        ) : (
                          <span
                            className={`size-2 rounded-full shrink-0 ${
                              isActive ? 'bg-amber-400' : 'bg-neutral-300'
                            }`}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: TELDA Z-PATTERN — GOODBYE PAPER PRICE STICKERS              */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section id='problem' className='bg-[#F7F7F8] py-24 sm:py-32'>
        <div className='mx-auto max-w-[1200px] px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center'>
          {/* Copy Column */}
          <div className='lg:col-span-6 space-y-6'>
            <span className='inline-block text-xs font-bold uppercase tracking-[0.14em] text-[#00a827]'>
              {t.problem.eyebrow}
            </span>
            <h2
              className={`font-extrabold text-[#111111] ${
                isRtl
                  ? 'text-4xl sm:text-5xl leading-[1.18]'
                  : 'text-4xl sm:text-5xl leading-[1.06] tracking-[-0.035em]'
              }`}
            >
              {t.problem.title}
            </h2>
            <p className='text-base sm:text-lg text-neutral-500 leading-relaxed'>
              {t.problem.sub}
            </p>

            <ul className='space-y-3.5 pt-2'>
              {t.problem.points.map((pt, idx) => (
                <li
                  key={idx}
                  className='flex items-start gap-3 text-sm sm:text-[15px] font-medium text-[#111111]'
                >
                  <span className='mt-0.5 size-5 rounded-full bg-[#00D632]/15 text-[#009924] flex items-center justify-center shrink-0'>
                    <Check className='size-3 stroke-[3]' />
                  </span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 2-Photo Editorial Collage Using Our Real-Life Struggle Photos */}
          <div className='lg:col-span-6 grid grid-cols-2 gap-4'>
            <div className='relative rounded-[28px] overflow-hidden h-[340px] sm:h-[400px] shadow-md group'>
              <img
                src='/images/landing/scene-missing-price.jpg'
                alt={t.problem.img1Label}
                className='size-full object-cover transition-transform duration-700 group-hover:scale-105'
              />
              <div className='absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent' />
              <div className='absolute bottom-4 inset-x-4'>
                <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 text-[#111111] text-[11px] font-bold shadow-sm'>
                  <AlertCircle className='size-3 text-amber-500 shrink-0' />
                  <span className='truncate'>{t.problem.img1Label}</span>
                </span>
              </div>
            </div>

            <div className='relative rounded-[28px] overflow-hidden h-[340px] sm:h-[400px] shadow-md sm:mt-8 group'>
              <img
                src='/images/landing/scene-sticker-hassle.jpg'
                alt={t.problem.img2Label}
                className='size-full object-cover transition-transform duration-700 group-hover:scale-105'
              />
              <div className='absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent' />
              <div className='absolute bottom-4 inset-x-4'>
                <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 text-[#111111] text-[11px] font-bold shadow-sm'>
                  <Tag className='size-3 text-amber-500 shrink-0' />
                  <span className='truncate'>{t.problem.img2Label}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: TELDA-STYLE LIFESTYLE CARDS (Supermarkets, Cosmetics, Fashion) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section id='stores' className='bg-white py-24 sm:py-32'>
        <div className='mx-auto max-w-[1200px] px-5 sm:px-8'>
          <div className='max-w-2xl mb-14 space-y-3'>
            <span className='text-xs font-bold uppercase tracking-[0.14em] text-[#00a827]'>
              {t.stores.eyebrow}
            </span>
            <h2
              className={`font-extrabold text-[#111111] ${
                isRtl
                  ? 'text-4xl sm:text-5xl leading-[1.18]'
                  : 'text-4xl sm:text-5xl leading-[1.05] tracking-[-0.035em]'
              }`}
            >
              {t.stores.title}
            </h2>
            <p className='text-base sm:text-lg text-neutral-500'>{t.stores.sub}</p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {t.stores.cards.map((card, idx) => (
              <div
                key={idx}
                className='group rounded-[32px] bg-[#F7F7F8] border border-neutral-200/70 overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300'
              >
                <div className='relative h-[310px] overflow-hidden'>
                  <img
                    src={card.image}
                    alt={card.pill}
                    className='size-full object-cover transition-transform duration-700 group-hover:scale-105'
                  />
                  <div className='absolute top-4 start-4'>
                    <span className='inline-flex items-center px-3 py-1 rounded-full bg-white/92 backdrop-blur-md text-[#111111] text-[11px] font-bold shadow-sm'>
                      {card.pill}
                    </span>
                  </div>
                </div>
                <div className='p-6 space-y-2 flex-1 flex flex-col justify-between'>
                  <div className='space-y-1.5'>
                    <h3 className='text-xl font-bold text-[#111111] tracking-tight'>
                      {card.title}
                    </h3>
                    <p className='text-sm text-neutral-500 leading-relaxed'>{card.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 4: HOW IT WORKS (Clean Telda Modular Container)                */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section id='how' className='bg-white pb-24 sm:pb-32'>
        <div className='mx-auto max-w-[1200px] px-5 sm:px-8'>
          <div className='rounded-[40px] bg-[#F5F5F7] p-7 sm:p-12 lg:p-14 space-y-12'>
            <div className='max-w-xl space-y-2.5'>
              <span className='text-xs font-bold uppercase tracking-[0.14em] text-[#00a827]'>
                {t.how.eyebrow}
              </span>
              <h2
                className={`font-extrabold text-[#111111] ${
                  isRtl
                    ? 'text-3xl sm:text-5xl leading-[1.18]'
                    : 'text-3xl sm:text-5xl leading-[1.06] tracking-[-0.035em]'
                }`}
              >
                {t.how.title}
              </h2>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
              {t.how.steps.map((step, idx) => {
                const Icon = idx === 0 ? QrCode : idx === 1 ? Smartphone : ShoppingCart
                return (
                  <div
                    key={step.num}
                    className='rounded-[28px] bg-white p-6 sm:p-7 border border-neutral-200/70 space-y-4'
                  >
                    <div className='flex items-center justify-between'>
                      <div className='size-11 rounded-2xl bg-[#111111] text-[#00D632] flex items-center justify-center'>
                        <Icon className='size-5' />
                      </div>
                      <span className='text-2xl font-extrabold text-neutral-200 tabular-nums'>
                        {step.num}
                      </span>
                    </div>
                    <h3 className='text-lg font-bold text-[#111111]'>{step.title}</h3>
                    <p className='text-sm text-neutral-500 leading-relaxed'>{step.desc}</p>
                  </div>
                )
              })}
            </div>

            <div className='flex flex-wrap items-center gap-4 pt-2 border-t border-neutral-200/80'>
              {t.how.trust.map((item, idx) => {
                const Icon = item.icon
                return (
                  <div
                    key={idx}
                    className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-neutral-200/70 text-xs font-semibold text-[#111111]'
                  >
                    <Icon className='size-3.5 text-[#00a827]' />
                    <span>{item.text}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 5: CLEAN TELDA-STYLE PRICING + 30-DAY FREE TRIAL               */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section id='pricing' className='bg-[#F7F7F8] py-24 sm:py-32 border-t border-neutral-200/70'>
        <div className='mx-auto max-w-[1200px] px-5 sm:px-8'>
          <div className='max-w-2xl mx-auto text-center space-y-4 mb-12'>
            <div className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00D632]/15 text-[#061006] text-xs font-bold'>
              <Sparkles className='size-3.5 text-[#00a827]' />
              <span>{t.pricing.trialPill}</span>
            </div>

            <h2
              className={`font-extrabold text-[#111111] ${
                isRtl
                  ? 'text-4xl sm:text-5xl leading-[1.15]'
                  : 'text-4xl sm:text-5xl leading-[1.04] tracking-[-0.035em]'
              }`}
            >
              {t.pricing.title}
            </h2>
            <p className='text-base sm:text-lg text-neutral-500'>{t.pricing.sub}</p>

            {/* Monthly / Yearly Toggle */}
            <div className='pt-3 flex justify-center'>
              <div className='inline-flex items-center p-1 rounded-full bg-white border border-neutral-200'>
                <button
                  type='button'
                  onClick={() => setBilling('monthly')}
                  className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    billing === 'monthly'
                      ? 'bg-[#111111] text-white'
                      : 'text-neutral-500 hover:text-[#111111]'
                  }`}
                >
                  {t.pricing.monthly}
                </button>
                <button
                  type='button'
                  onClick={() => setBilling('yearly')}
                  className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    billing === 'yearly'
                      ? 'bg-[#111111] text-white'
                      : 'text-neutral-500 hover:text-[#111111]'
                  }`}
                >
                  <span>{t.pricing.yearly}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      billing === 'yearly'
                        ? 'bg-[#00D632] text-[#061006]'
                        : 'bg-[#00D632]/15 text-[#008f20]'
                    }`}
                  >
                    {t.pricing.saveBadge}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* 3 Clean Subscription Cards */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch'>
            {t.pricing.plans.map((plan) => {
              const price = billing === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
              const isPopular = plan.popular

              return (
                <div
                  key={plan.id}
                  className={`rounded-[32px] p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                    isPopular
                      ? 'bg-[#111111] text-white shadow-[0_24px_60px_rgba(0,0,0,0.2)]'
                      : 'bg-white text-[#111111] border border-neutral-200/80 hover:shadow-lg'
                  }`}
                >
                  <div className='space-y-6'>
                    <div className='space-y-1.5'>
                      <div className='flex items-center justify-between gap-2'>
                        <h3 className='text-xl font-bold'>{plan.name}</h3>
                        {isPopular && (
                          <span className='px-3 py-1 rounded-full bg-[#00D632] text-[#061006] text-[10px] font-extrabold uppercase tracking-wider'>
                            {t.pricing.popularBadge}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs leading-relaxed ${
                          isPopular ? 'text-neutral-400' : 'text-neutral-500'
                        }`}
                      >
                        {plan.desc}
                      </p>
                    </div>

                    <div className='pb-5 border-b border-current/10'>
                      <div className='flex items-baseline gap-1.5' dir='ltr'>
                        <span className='text-4xl sm:text-5xl font-extrabold tracking-tight tabular-nums'>
                          {price.toLocaleString()}
                        </span>
                        <span
                          className={`text-lg font-bold ${
                            isPopular ? 'text-[#00D632]' : 'text-[#111111]'
                          }`}
                        >
                          LE
                        </span>
                        <span
                          className={`text-xs font-medium ${
                            isPopular ? 'text-neutral-400' : 'text-neutral-500'
                          }`}
                        >
                          {t.pricing.perMonth}
                        </span>
                      </div>

                      <div className='mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold'>
                        <Gift className='size-3.5 text-[#00D632]' />
                        <span className={isPopular ? 'text-[#00D632]' : 'text-[#009924]'}>
                          {t.pricing.trialNote}
                        </span>
                      </div>
                    </div>

                    <ul className='space-y-3'>
                      {plan.features.map((feat, i) => (
                        <li
                          key={i}
                          className={`flex items-start gap-2.5 text-xs sm:text-[13px] leading-relaxed ${
                            isPopular ? 'text-neutral-200' : 'text-neutral-600'
                          }`}
                        >
                          <span
                            className={`mt-0.5 size-4 rounded-full flex items-center justify-center shrink-0 ${
                              isPopular
                                ? 'bg-[#00D632] text-[#061006]'
                                : 'bg-[#00D632]/15 text-[#009924]'
                            }`}
                          >
                            <Check className='size-2.5 stroke-[3]' />
                          </span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className='pt-8'>
                    <Link
                      to='/sign-up'
                      className={`w-full h-12 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                        isPopular
                          ? 'bg-[#00D632] hover:bg-[#19e848] text-[#061006]'
                          : 'bg-[#111111] hover:bg-neutral-800 text-white'
                      }`}
                    >
                      <span>{t.pricing.cta}</span>
                      <ArrowRight className={`size-4 ${isRtl ? 'rotate-180' : ''}`} />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 6: TELDA-STYLE MINIMALIST CLOSING BANNER                       */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className='bg-white py-20 sm:py-24 px-5 sm:px-8'>
        <div className='mx-auto max-w-[1200px] rounded-[40px] bg-[#111111] text-white px-6 py-16 sm:px-14 sm:py-20 text-center space-y-6'>
          <span className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-[#00D632] text-xs font-semibold'>
            <Gift className='size-3.5' />
            <span>{t.finale.pill}</span>
          </span>

          <h2
            className={`font-extrabold text-white max-w-3xl mx-auto ${
              isRtl
                ? 'text-4xl sm:text-5xl leading-[1.18]'
                : 'text-4xl sm:text-6xl leading-[1.04] tracking-[-0.035em]'
            }`}
          >
            {t.finale.title}
          </h2>

          <p className='text-base sm:text-lg text-neutral-400 max-w-xl mx-auto leading-relaxed'>
            {t.finale.sub}
          </p>

          <div className='flex flex-wrap items-center justify-center gap-3 pt-2'>
            <Link
              to='/sign-up'
              className='inline-flex items-center gap-2 h-13 px-8 rounded-full bg-[#00D632] hover:bg-[#19e848] text-[#061006] text-[15px] font-bold transition-all active:scale-95'
            >
              <span>{t.finale.ctaSignUp}</span>
              <ArrowRight className={`size-4 ${isRtl ? 'rotate-180' : ''}`} />
            </Link>

            <Link
              to='/sign-in'
              className='inline-flex items-center justify-center h-13 px-8 rounded-full bg-white/10 hover:bg-white/15 text-white text-[15px] font-semibold transition-colors'
            >
              {t.finale.ctaLogin}
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TELDA-STYLE CRISP MINIMALIST WHITE FOOTER                              */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <footer className='bg-white border-t border-neutral-200/80 py-12'>
        <div className='mx-auto max-w-[1200px] px-5 sm:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6'>
          <div className='space-y-1.5'>
            <span className='text-lg font-extrabold tracking-tight text-[#111111]'>
              green scan<span className='text-[#00D632]'>.</span>
            </span>
            <p className='text-xs text-neutral-500 max-w-sm'>{t.footer.tagline}</p>
          </div>

          <div className='flex flex-wrap items-center gap-6 text-xs font-semibold text-neutral-600'>
            <a href='#pricing' className='hover:text-[#111111] transition-colors'>
              {t.footer.pricing}
            </a>
            <Link to='/sign-in' className='hover:text-[#111111] transition-colors'>
              {t.footer.login}
            </Link>
            <Link to='/sign-up' className='hover:text-[#111111] transition-colors'>
              {t.footer.signup}
            </Link>
            {isAuthenticated && (
              <Link to='/dashboard' className='hover:text-[#111111] transition-colors'>
                {t.footer.dashboard}
              </Link>
            )}
          </div>
        </div>

        <div className='mx-auto max-w-[1200px] px-5 sm:px-8 mt-8 pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-400 font-medium'>
          <span>{t.footer.rights}</span>
          <button
            type='button'
            onClick={toggleLang}
            className='inline-flex items-center gap-1.5 text-neutral-600 hover:text-[#111111] transition-colors cursor-pointer font-semibold'
          >
            <Globe className='size-3.5' />
            <span>{lang === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}</span>
          </button>
        </div>
      </footer>
    </div>
  )
}
