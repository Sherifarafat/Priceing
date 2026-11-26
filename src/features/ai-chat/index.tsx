import * as React from 'react'
import {
  Sparkles,
  ArrowUp,
  Mic,
  Plus,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  RotateCcw,
  Printer,
  User,
  BarChart3,
  Package,
  CreditCard,
  QrCode,
  Settings2,
  Database,
  Loader2,
  Save,
} from 'lucide-react'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { LanguageSwitch } from '@/components/language-switch'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSaaSStore } from '@/lib/saas-store'
import { useDirection } from '@/context/direction-provider'
import {
  api,
  type AiChartSpecDto,
  type AiKpiCardDto,
  type AiProviderType,
  type AiSystemSummaryDto,
} from '@/lib/api-client'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AiReportVisuals } from './components/ai-report-visuals'

interface ModelPreset {
  id: string
  label: string
  badge: string
  provider: AiProviderType
  model: string
  needsKey: boolean
  hint: string
}

const FREE_MODEL_PRESETS: ModelPreset[] = [
  {
    id: 'free-openai',
    label: 'Free AI (Auto — Zero Key)',
    badge: 'مجاني فوراً',
    provider: 'FREE_POLLINATIONS',
    model: 'openai',
    needsKey: false,
    hint: 'يعمل فوراً مجاناً بدون API Key عبر Pollinations + قراءة مباشرة لقاعدة بيانات السيستم',
  },
  {
    id: 'free-mistral',
    label: 'Free Mistral (Zero Key)',
    badge: 'مجاني فوراً',
    provider: 'FREE_POLLINATIONS',
    model: 'mistral',
    needsKey: false,
    hint: 'موديل Mistral مجاني بدون API Key سريع للتقارير',
  },
  {
    id: 'groq-llama',
    label: 'Groq Llama 3.3 70B',
    badge: 'Free Key',
    provider: 'GROQ',
    model: 'llama-3.3-70b-versatile',
    needsKey: true,
    hint: 'أسرع موديل مجاني (احصل على مفتاح مجاني من console.groq.com)',
  },
  {
    id: 'gemini-flash',
    label: 'Google Gemini 2.0 Flash',
    badge: 'Free Key',
    provider: 'GEMINI',
    model: 'gemini-2.0-flash',
    needsKey: true,
    hint: 'ممتاز في العربي والتحليل (احصل على مفتاح مجاني من aistudio.google.com)',
  },
  {
    id: 'openrouter-free',
    label: 'OpenRouter Llama 3.3 (:free)',
    badge: 'Free Key',
    provider: 'OPENROUTER',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    needsKey: true,
    hint: 'موديلات مجانية من OpenRouter (احصل على مفتاح من openrouter.ai)',
  },
  {
    id: 'ollama-local',
    label: 'Ollama Local (Offline)',
    badge: 'محلي 100%',
    provider: 'OLLAMA',
    model: 'llama3.2',
    needsKey: false,
    hint: 'موديل محلي على جهازك عبر http://localhost:11434 بدون إنترنت',
  },
]

function ChatMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className='text-lg font-bold tracking-tight text-neutral-900 dark:text-white mt-4 mb-2 first:mt-0 flex items-center gap-2'>
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className='text-base font-bold tracking-tight text-neutral-900 dark:text-white mt-3.5 mb-1.5 first:mt-0 flex items-center gap-2'>
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className='text-sm font-bold text-neutral-900 dark:text-white mt-3 mb-1.5 first:mt-0 flex items-center gap-1.5'>
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className='text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-3 mb-1'>
            {children}
          </h4>
        ),
        p: ({ children }) => (
          <p className='text-sm leading-relaxed text-neutral-800 dark:text-[#E3E3E3] mb-2.5 last:mb-0'>
            {children}
          </p>
        ),
        strong: ({ children }) => (
          <strong className='font-semibold text-neutral-900 dark:text-white'>
            {children}
          </strong>
        ),
        em: ({ children }) => (
          <em className='italic text-neutral-600 dark:text-neutral-400'>
            {children}
          </em>
        ),
        ul: ({ children }) => (
          <ul className='my-2.5 space-y-1.5 ps-5 list-disc marker:text-[#00d632] text-sm'>
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className='my-2.5 space-y-1.5 ps-5 list-decimal marker:text-neutral-500 font-normal text-sm'>
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className='leading-relaxed text-neutral-800 dark:text-[#E3E3E3]'>
            {children}
          </li>
        ),
        blockquote: ({ children }) => (
          <blockquote className='border-s-4 border-[#00d632] bg-emerald-50/60 dark:bg-white/5 px-3.5 py-2.5 my-3 rounded-e-xl text-sm text-neutral-800 dark:text-neutral-200 shadow-2xs [&>p]:mb-0'>
            {children}
          </blockquote>
        ),
        code: ({ children, className }) => {
          const isInline = !className
          return isInline ? (
            <code className='px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800/80 font-mono text-xs text-neutral-900 dark:text-emerald-300 border border-neutral-200/80 dark:border-neutral-700/60 font-semibold'>
              {children}
            </code>
          ) : (
            <code className={className}>{children}</code>
          )
        },
        pre: ({ children }) => (
          <pre className='my-3 p-3.5 rounded-xl bg-neutral-900 text-neutral-100 dark:bg-black/60 dark:border dark:border-neutral-800 text-xs overflow-x-auto font-mono'>
            {children}
          </pre>
        ),
        table: ({ children }) => (
          <div className='my-3 overflow-x-auto rounded-xl border border-border/80 dark:border-neutral-800 shadow-2xs'>
            <table className='w-full text-xs text-start border-collapse'>
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className='bg-neutral-100/90 dark:bg-neutral-800/90 border-b border-border dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold'>
            {children}
          </thead>
        ),
        tbody: ({ children }) => (
          <tbody className='divide-y divide-border/60 dark:divide-neutral-800/60 bg-white/50 dark:bg-[#1E1F20]/30'>
            {children}
          </tbody>
        ),
        tr: ({ children }) => (
          <tr className='hover:bg-neutral-50/80 dark:hover:bg-white/5 transition-colors'>
            {children}
          </tr>
        ),
        th: ({ children }) => (
          <th className='px-3.5 py-2.5 text-start font-semibold text-neutral-900 dark:text-white'>
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className='px-3.5 py-2 text-neutral-800 dark:text-neutral-300'>
            {children}
          </td>
        ),
        hr: () => <hr className='my-4 border-border/60 dark:border-neutral-800' />,
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

interface ChatMessage {
  id: string
  sender: 'ai' | 'user'
  text: string
  timestamp: string
  modelLabel?: string
  fallbackUsed?: boolean
  kpis?: AiKpiCardDto[]
  charts?: AiChartSpecDto[]
  suggestions?: string[]
}

export function AIChatView() {
  const { merchants, currentUser } = useSaaSStore()
  const { dir } = useDirection()
  const isAr = dir === 'rtl'
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN'

  const [scopeMerchantId, setScopeMerchantId] = React.useState<string>(
    isSuperAdmin ? 'all' : currentUser.merchantId || merchants[0]?.id || ''
  )

  const [input, setInput] = React.useState('')
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [isThinking, setIsThinking] = React.useState(false)
  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const [reactions, setReactions] = React.useState<Record<string, 'like' | 'dislike'>>({})
  const [isListening, setIsListening] = React.useState(false)

  // Live AI Model & Config State
  const [provider, setProvider] = React.useState<AiProviderType>('FREE_POLLINATIONS')
  const [model, setModel] = React.useState<string>('openai')
  const [apiKeyInput, setApiKeyInput] = React.useState<string>('')
  const [hasSavedApiKey, setHasSavedApiKey] = React.useState<boolean>(false)
  const [ollamaUrl, setOllamaUrl] = React.useState<string>('http://localhost:11434')
  const [isSettingsOpen, setIsSettingsOpen] = React.useState<boolean>(false)
  const [isSavingConfig, setIsSavingConfig] = React.useState<boolean>(false)

  // Live DB Summary for Hero Banner
  const [summary, setSummary] = React.useState<AiSystemSummaryDto | null>(null)

  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const activeMerchantParam =
    isSuperAdmin && scopeMerchantId === 'all' ? undefined : scopeMerchantId || currentUser.merchantId

  // Fetch AI config + live DB summary whenever scope changes
  React.useEffect(() => {
    let cancelled = false
    api.ai
      .getConfig(activeMerchantParam)
      .then((cfg) => {
        if (cancelled) return
        setProvider(cfg.provider || 'FREE_POLLINATIONS')
        setModel(cfg.model || 'openai')
        setOllamaUrl(cfg.ollamaUrl || 'http://localhost:11434')
        setHasSavedApiKey(Boolean(cfg.hasApiKey))
      })
      .catch(() => {})

    api.ai
      .getSummary(activeMerchantParam)
      .then((sum) => {
        if (!cancelled) setSummary(sum)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [activeMerchantParam])

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  const activePreset =
    FREE_MODEL_PRESETS.find((p) => p.provider === provider && p.model === model) ||
    FREE_MODEL_PRESETS.find((p) => p.provider === provider) ||
    FREE_MODEL_PRESETS[0]

  const userFirstName = currentUser.name.split(' ')[0] || 'Admin'

  const suggestionCards = [
    {
      id: 'card-1',
      title: isAr
        ? 'اعمل تقرير مبيعات وإحصائيات شاملة للمتجر'
        : 'Generate a full live sales & revenue report',
      prompt: isAr
        ? 'اعمل تقرير مبيعات وإحصائيات شاملة للسيستم عندي (اليوم وآخر 7 أيام والإجمالي ومتوسط الفاتورة وطرق الدفع)'
        : 'Generate a comprehensive live sales and revenue report (today, last 7 days, totals, AOV, and payment methods).',
      icon: BarChart3,
    },
    {
      id: 'card-2',
      title: isAr
        ? 'تحليل المخزون والنواقص وأغلى المنتجات'
        : 'Audit inventory stock, low-stock alerts & prices',
      prompt: isAr
        ? 'حلل المخزون والمنتجات عندي: إيه النواقص أو المنتجات القليلة؟ وإجمالي قيمة المخزون وتوزيع الأقسام؟'
        : 'Analyze my live inventory: which products are out of stock or low stock, total inventory value, and category breakdown?',
      icon: Package,
    },
    {
      id: 'card-3',
      title: isAr
        ? 'أعلى المنتجات مبيعاً وتوزيع طرق الدفع'
        : 'Top best-selling products & payment breakdown',
      prompt: isAr
        ? 'إيه أعلى المنتجات مبيعاً عندي في الفواتير؟ وإيه أكتر طريقة دفع العملاء بيستخدموها (كاش / انستا باي / كارت)؟'
        : 'What are my top best-selling products from real invoices and which payment methods generate the most revenue?',
      icon: CreditCard,
    },
    {
      id: 'card-4',
      title: isAr
        ? 'إحصائيات مسح الباركود والفروع والعروض'
        : 'QR scanner traffic, branches & active offers report',
      prompt: isAr
        ? 'اعمل إحصائية كاملة لمسح الباركود وساعات الذروة وأداء الفروع والعروض الفعالة حالياً'
        : 'Give me a full report on customer QR scans, peak scanning hour, branch performance, and active offers.',
      icon: QrCode,
    },
  ]

  const handleSelectPreset = async (preset: ModelPreset) => {
    setProvider(preset.provider)
    setModel(preset.model)
    if (preset.needsKey && !hasSavedApiKey) {
      setIsSettingsOpen(true)
      return
    }
    try {
      await api.ai.saveConfig({
        merchantId: activeMerchantParam,
        provider: preset.provider,
        model: preset.model,
        apiKey: '__KEEP__',
      })
      toast.success(
        isAr ? `تم التبديل إلى ${preset.label}` : `Switched to ${preset.label}`
      )
    } catch (err: any) {
      toast.error(err?.message || 'فشل تغيير الموديل')
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingConfig(true)
    try {
      const saved = await api.ai.saveConfig({
        merchantId: activeMerchantParam,
        provider,
        model,
        apiKey: apiKeyInput.trim() ? apiKeyInput.trim() : '__KEEP__',
        ollamaUrl: ollamaUrl.trim() || 'http://localhost:11434',
      })
      setHasSavedApiKey(Boolean(saved.hasApiKey))
      setApiKeyInput('')
      setIsSettingsOpen(false)
      toast.success(isAr ? 'تم حفظ إعدادات موديل الذكاء الاصطناعي ✓' : 'AI model settings saved ✓')
    } catch (err: any) {
      toast.error(err?.message || 'فشل حفظ الإعدادات')
    } finally {
      setIsSavingConfig(false)
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success(isAr ? 'تم نسخ التقرير ✓' : 'Report copied to clipboard')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleReaction = (id: string, type: 'like' | 'dislike') => {
    setReactions((prev) => ({
      ...prev,
      [id]: prev[id] === type ? undefined! : type,
    }))
    toast.success(type === 'like' ? 'تم تسجيل التقييم ✓' : 'تم تسجيل الملاحظة')
  }

  const handleNewChat = () => {
    setMessages([])
    setInput('')
    setIsThinking(false)
    toast.info(isAr ? 'تم بدء محادثة جديدة' : 'Started a new conversation')
  }

  const handleSend = async (messageText?: string) => {
    const query = (messageText || input).trim()
    if (!query || isThinking) return

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    const historyPayload = messages.slice(-8).map((m) => ({
      role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
      content: m.text,
    }))

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsThinking(true)

    try {
      const res = await api.ai.chat({
        merchantId: activeMerchantParam,
        message: query,
        history: historyPayload,
        provider,
        model,
      })

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelLabel: res.fallbackUsed ? 'Live DB Analytics' : `${activePreset.label}`,
        fallbackUsed: res.fallbackUsed,
        kpis: res.kpis,
        charts: res.charts,
        suggestions: res.suggestions,
      }

      setMessages((prev) => [...prev, aiMsg])
    } catch (err: any) {
      toast.error(err?.message || (isAr ? 'تعذر الاتصال بخدمة الذكاء الاصطناعي' : 'AI request failed'))
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: isAr
            ? `⚠️ حدث خطأ أثناء جلب البيانات: ${err?.message || 'تأكد من تشغيل السيرفر.'}`
            : `⚠️ Error fetching live AI response: ${err?.message || 'Check backend server.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setIsThinking(false)
    }
  }

  const handleMicClick = () => {
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRec) {
      toast.error(isAr ? 'متصفحك لا يدعم الإدخال الصوتي' : 'Voice recognition not supported in this browser')
      return
    }
    if (isListening) return

    try {
      const recognition = new SpeechRec()
      recognition.lang = isAr ? 'ar-EG' : 'en-US'
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      setIsListening(true)
      toast.info(isAr ? 'تحدث الآن...' : 'Listening... speak now')

      recognition.onresult = (event: any) => {
        const transcript = event?.results?.[0]?.[0]?.transcript || ''
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript))
        }
      }
      recognition.onerror = () => {
        setIsListening(false)
      }
      recognition.onend = () => {
        setIsListening(false)
      }
      recognition.start()
    } catch {
      setIsListening(false)
    }
  }

  return (
    <div
      data-layout='fixed'
      className='flex flex-col flex-1 h-full min-h-0 overflow-hidden bg-slate-50/70 dark:bg-[#131314] text-foreground dark:text-[#E3E3E3] font-sans antialiased'
    >
      {/* 1. TOP NAV BAR */}
      <header className='shrink-0 h-14 px-3 sm:px-6 flex items-center justify-between border-b border-border/60 dark:border-white/5 bg-background/80 dark:bg-[#131314]/80 backdrop-blur-md z-10 print:hidden'>
        <div className='flex items-center gap-1.5 sm:gap-2.5 min-w-0'>
          <SidebarTrigger variant='ghost' className='size-8 text-neutral-600 dark:text-neutral-300 hover:text-foreground dark:hover:text-white' />

          {/* Model Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type='button'
                className='flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-[#1E1F20] text-xs sm:text-sm font-bold text-neutral-900 dark:text-white transition-colors cursor-pointer group'
              >
                <span className='size-2 rounded-full bg-[#00d632] shrink-0' />
                <span className='truncate max-w-[170px] sm:max-w-[230px]'>{activePreset.label}</span>
                <ChevronDown className='size-3.5 text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-white transition-transform shrink-0' />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='start'
              className='w-72 bg-white dark:bg-[#1E1F20] border-border dark:border-neutral-800 text-neutral-900 dark:text-white p-1.5 rounded-xl shadow-xl'
            >
              <DropdownMenuLabel className='text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-2 py-1'>
                {isAr ? 'اختر موديل ذكاء اصطناعي مجاني (متصل بقاعدة البيانات)' : 'Select Free Live-DB AI Model'}
              </DropdownMenuLabel>
              {FREE_MODEL_PRESETS.map((preset) => {
                const isSelected = preset.provider === provider && preset.model === model
                return (
                  <DropdownMenuItem
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`text-xs font-medium cursor-pointer rounded-lg flex items-center justify-between gap-2 py-2 ${
                      isSelected ? 'bg-neutral-100 dark:bg-neutral-800 font-bold' : ''
                    }`}
                  >
                    <span className='truncate'>{preset.label}</span>
                    <span className='text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-mono font-bold shrink-0'>
                      {preset.badge}
                    </span>
                  </DropdownMenuItem>
                )
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setIsSettingsOpen(true)}
                className='text-xs font-bold cursor-pointer rounded-lg flex items-center gap-2 py-2'
              >
                <Settings2 className='size-3.5' />
                <span>{isAr ? 'إعدادات الموديل / مفتاح API المجاني' : 'Model & Free API Key Settings'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Super Admin Merchant Scope Selector */}
          {isSuperAdmin && merchants.length > 0 && (
            <select
              value={scopeMerchantId}
              onChange={(e) => setScopeMerchantId(e.target.value)}
              className='hidden md:block h-8 rounded-xl border border-border/70 dark:border-neutral-800 bg-white dark:bg-[#1E1F20] px-2.5 text-xs font-bold text-neutral-800 dark:text-neutral-200 cursor-pointer'
              title={isAr ? 'نطاق البيانات' : 'Data Scope'}
            >
              <option value='all'>{isAr ? 'كل المتاجر (النظام بالكامل)' : 'All Merchants'}</option>
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          )}

          {/* New Chat Button */}
          <button
            type='button'
            onClick={handleNewChat}
            className='inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-medium text-neutral-700 hover:text-black dark:text-neutral-300 dark:hover:text-white border border-border/40 dark:border-transparent transition-colors cursor-pointer'
            title={isAr ? 'محادثة جديدة' : 'New chat'}
          >
            <Plus className='size-3.5' />
            <span className='hidden sm:inline'>{isAr ? 'محادثة جديدة' : 'New chat'}</span>
          </button>

          {/* Quick Settings Trigger */}
          <button
            type='button'
            onClick={() => setIsSettingsOpen(true)}
            className='size-8 rounded-xl flex items-center justify-center text-neutral-500 hover:text-foreground hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer'
            title={isAr ? 'إعدادات الموديل' : 'AI Settings'}
          >
            <Settings2 className='size-4' />
          </button>
        </div>

        <div className='flex items-center gap-2 sm:gap-3'>
          <LanguageSwitch />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </header>

      {/* 2. MIDDLE SCROLLABLE WORKSPACE */}
      <div className='flex-1 min-h-0 overflow-y-auto px-4 sm:px-6'>
        {messages.length === 0 ? (
          <div className='flex flex-col items-center justify-center max-w-5xl mx-auto w-full min-h-full py-8 sm:py-10'>
            {/* Hero Greeting */}
            <div className='text-center space-y-3 mb-6 sm:mb-8'>
              <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00d632]/15 text-[#147d2b] dark:text-[#3EEA85] text-xs font-bold border border-[#00d632]/30'>
                <Database className='size-3.5' />
                <span>
                  {isAr
                    ? `متصل مباشرة بقاعدة بيانات: ${summary?.scope || 'السيستم'}`
                    : `Connected Live to: ${summary?.scope || 'System Database'}`}
                </span>
              </div>

              <h1 className='text-3xl sm:text-5xl font-black tracking-tight pb-1'>
                <span className='text-neutral-900 dark:text-white'>
                  {isAr ? `أهلاً، ${userFirstName}` : `Hello, ${userFirstName}`}
                </span>
                <span className='text-[#00d632]'>.</span>
              </h1>

              <p className='text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto leading-relaxed'>
                {isAr
                  ? 'اسألني أي سؤال عن السيستم بتاعك بالعربي أو الإنجليزي — بقرأ الفواتير، المبيعات، المنتجات، المخزون، العروض، ومسح الـ QR لحظياً وأقدر أعملك تقارير وإحصائيات بالرسوم البيانية.'
                  : 'Ask me anything about your live store data — I read real invoices, revenue, inventory, offers, and QR scans to build instant reports & interactive charts.'}
              </p>

              {/* Live DB Telemetry Pills */}
              {summary && (
                <div className='flex flex-wrap items-center justify-center gap-2 pt-2'>
                  <span className='text-[11px] font-bold px-3 py-1 rounded-full bg-white dark:bg-[#1E1F20] border border-border/80 dark:border-neutral-800 shadow-2xs'>
                    {isAr ? 'المبيعات:' : 'Revenue:'}{' '}
                    <span className='font-mono text-[#16782a] dark:text-[#3EEA85]' dir='ltr'>
                      {summary.totalRevenue.toFixed(2)} EGP
                    </span>
                  </span>
                  <span className='text-[11px] font-bold px-3 py-1 rounded-full bg-white dark:bg-[#1E1F20] border border-border/80 dark:border-neutral-800 shadow-2xs'>
                    {isAr ? 'الفواتير:' : 'Invoices:'}{' '}
                    <span className='font-mono'>{summary.invoiceCount}</span>
                  </span>
                  <span className='text-[11px] font-bold px-3 py-1 rounded-full bg-white dark:bg-[#1E1F20] border border-border/80 dark:border-neutral-800 shadow-2xs'>
                    {isAr ? 'المنتجات:' : 'Products:'}{' '}
                    <span className='font-mono'>{summary.productsCount}</span>
                  </span>
                  <span className='text-[11px] font-bold px-3 py-1 rounded-full bg-white dark:bg-[#1E1F20] border border-border/80 dark:border-neutral-800 shadow-2xs'>
                    {isAr ? 'العروض النشطة:' : 'Active Offers:'}{' '}
                    <span className='font-mono'>{summary.activeOffersCount}</span>
                  </span>
                  <span className='text-[11px] font-bold px-3 py-1 rounded-full bg-white dark:bg-[#1E1F20] border border-border/80 dark:border-neutral-800 shadow-2xs'>
                    {isAr ? 'مسح QR:' : 'QR Scans:'}{' '}
                    <span className='font-mono'>{summary.totalScans}</span>
                  </span>
                </div>
              )}
            </div>

            {/* 4 Quick Report & Analytics Cards */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full'>
              {suggestionCards.map((card) => {
                const Icon = card.icon
                return (
                  <div
                    key={card.id}
                    onClick={() => handleSend(card.prompt)}
                    className='h-40 rounded-2xl bg-white dark:bg-[#1E1F20] hover:bg-neutral-50/90 dark:hover:bg-[#282A2C] transition-all duration-200 p-4 cursor-pointer flex flex-col justify-between border border-border/80 dark:border-neutral-800 hover:border-[#00d632]/70 shadow-xs hover:shadow-md relative group select-none active:scale-[0.98]'
                  >
                    <p className='text-sm text-neutral-800 dark:text-[#E3E3E3] font-bold leading-relaxed line-clamp-3 group-hover:text-black dark:group-hover:text-white transition-colors'>
                      {card.title}
                    </p>
                    <div className='self-end size-9 rounded-full bg-neutral-100 dark:bg-[#131314] flex items-center justify-center text-neutral-600 dark:text-neutral-300 group-hover:bg-[#00d632]/20 group-hover:text-[#16782a] dark:group-hover:text-[#3EEA85] transition-all'>
                      <Icon className='size-4' />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* ACTIVE CONVERSATION STREAM */
          <div className='max-w-4xl mx-auto w-full py-6 space-y-6'>
            {messages.map((msg) => {
              const isAI = msg.sender === 'ai'

              if (!isAI) {
                /* ── USER MESSAGE: Always aligned on the RIGHT side ── */
                return (
                  <div key={msg.id} dir='ltr' className='flex justify-end items-end gap-2.5'>
                    <div className='flex flex-col items-end max-w-[82%] sm:max-w-[74%]'>
                      <div className='flex items-center gap-2 mb-1 px-1'>
                        <span className='text-[10px] text-neutral-400 dark:text-neutral-500'>
                          {msg.timestamp}
                        </span>
                        <span className='font-bold text-[11px] text-neutral-700 dark:text-neutral-300'>
                          {currentUser.name}
                        </span>
                      </div>
                      <div
                        dir='auto'
                        className='rounded-2xl rounded-br-sm bg-[#09090B] text-white dark:bg-white dark:text-black px-4 py-2.5 text-sm font-medium leading-relaxed shadow-sm whitespace-pre-line break-words'
                      >
                        {msg.text}
                      </div>
                    </div>
                    <div className='size-8 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-white flex items-center justify-center font-bold text-xs shrink-0 border border-neutral-300 dark:border-neutral-700 mb-0.5'>
                      <User className='size-4' />
                    </div>
                  </div>
                )
              }

              /* ── AI MESSAGE: Always aligned on the OPPOSITE (LEFT) side ── */
              return (
                <div key={msg.id} dir='ltr' className='flex justify-start items-start gap-2.5 group'>
                  <div className='size-8 rounded-xl bg-[#09090B] dark:bg-white text-[#3EEA85] dark:text-black flex items-center justify-center font-bold text-xs shrink-0 shadow-sm mt-5'>
                    <Sparkles className='size-4' />
                  </div>

                  <div className='flex flex-col items-start min-w-0 max-w-[90%] sm:max-w-[84%]'>
                    <div className='flex items-center gap-2 mb-1 px-1 flex-wrap'>
                      <span className='font-bold text-[11px] text-neutral-900 dark:text-white'>
                        Maya AI • {msg.modelLabel || activePreset.label}
                      </span>
                      <span className='text-[10px] text-neutral-400 dark:text-neutral-500'>
                        {msg.timestamp}
                      </span>
                    </div>

                    {/* AI Card Bubble */}
                    <div
                      dir={isAr ? 'rtl' : 'ltr'}
                      className='w-full rounded-2xl rounded-tl-sm bg-white dark:bg-[#1E1F20] border border-border/80 dark:border-neutral-800 px-4 py-3.5 text-sm leading-relaxed shadow-xs overflow-hidden'
                    >
                      <ChatMarkdown content={msg.text} />
                      <AiReportVisuals kpis={msg.kpis} charts={msg.charts} />
                    </div>

                    {/* Follow-up Suggestion Chips */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div dir={isAr ? 'rtl' : 'ltr'} className='flex flex-wrap gap-1.5 pt-2 print:hidden'>
                        {msg.suggestions.map((sug) => (
                          <button
                            key={sug}
                            type='button'
                            onClick={() => handleSend(sug)}
                            className='text-[11px] px-2.5 py-1 rounded-full bg-white dark:bg-[#1E1F20] hover:bg-neutral-100 dark:hover:bg-[#282A2C] text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white border border-border dark:border-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs'
                          >
                            <Sparkles className='size-3 text-[#00d632] shrink-0' />
                            <span>{sug}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* AI Response Action Toolbar */}
                    <div className='flex items-center gap-1 pt-1 opacity-75 group-hover:opacity-100 transition-opacity print:hidden'>
                      <button
                        type='button'
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className='p-1.5 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-white/10 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer'
                        title={isAr ? 'نسخ' : 'Copy'}
                      >
                        {copiedId === msg.id ? (
                          <Check className='size-3.5 text-emerald-500' />
                        ) : (
                          <Copy className='size-3.5' />
                        )}
                      </button>
                      <button
                        type='button'
                        onClick={() => window.print()}
                        className='p-1.5 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-white/10 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer'
                        title={isAr ? 'طباعة / حفظ PDF' : 'Print / Save PDF'}
                      >
                        <Printer className='size-3.5' />
                      </button>
                      <button
                        type='button'
                        onClick={() => handleReaction(msg.id, 'like')}
                        className={`p-1.5 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer ${
                          reactions[msg.id] === 'like'
                            ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10'
                            : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                        title='Like'
                      >
                        <ThumbsUp className='size-3.5' />
                      </button>
                      <button
                        type='button'
                        onClick={() => handleReaction(msg.id, 'dislike')}
                        className={`p-1.5 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer ${
                          reactions[msg.id] === 'dislike'
                            ? 'text-rose-500 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10'
                            : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                        title='Dislike'
                      >
                        <ThumbsDown className='size-3.5' />
                      </button>
                      <button
                        type='button'
                        onClick={() => {
                          const lastUser = [...messages].reverse().find((m) => m.sender === 'user')
                          if (lastUser) handleSend(lastUser.text)
                        }}
                        className='p-1.5 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-white/10 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer'
                        title={isAr ? 'إعادة التوليد' : 'Regenerate'}
                      >
                        <RotateCcw className='size-3.5' />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {isThinking && (
              <div dir='ltr' className='flex justify-start items-start gap-2.5'>
                <div className='size-8 rounded-xl bg-[#09090B] dark:bg-white text-[#3EEA85] dark:text-black flex items-center justify-center font-bold text-xs shrink-0 animate-pulse'>
                  <Sparkles className='size-4' />
                </div>
                <div
                  dir={isAr ? 'rtl' : 'ltr'}
                  className='rounded-2xl rounded-tl-sm bg-white dark:bg-[#1E1F20] border border-border/80 dark:border-neutral-800 px-4 py-3 flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300 shadow-xs'
                >
                  <Loader2 className='size-3.5 animate-spin text-[#00d632] shrink-0' />
                  <span>
                    {isAr
                      ? 'جاري قراءة بيانات السيستم والرد على سؤالك...'
                      : 'Reading live store data & replying...'}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 3. PINNED BOTTOM INPUT BAR */}
      <div className='shrink-0 z-10 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent dark:from-[#131314] dark:via-[#131314]/95 pt-2 pb-3 px-4 print:hidden'>
        <div className='max-w-4xl mx-auto w-full'>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className='relative rounded-full bg-white dark:bg-[#1E1F20] border border-border/90 dark:border-neutral-700/60 hover:border-neutral-400 dark:hover:border-neutral-600 focus-within:border-[#00d632] focus-within:ring-2 focus-within:ring-[#00d632]/20 px-4 sm:px-5 py-2.5 flex items-center gap-2.5 shadow-lg dark:shadow-2xl transition-all'
          >
            <input
              type='text'
              placeholder={
                isAr
                  ? 'اسأل Maya عن مبيعاتك، مخزونك، نواقص المنتجات، أو اطلب تقرير وإحصائيات...'
                  : 'Ask Maya about sales, stock, invoices, offers, or request a report...'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isThinking}
              className='bg-transparent text-sm text-neutral-900 dark:text-[#E3E3E3] placeholder:text-neutral-400 dark:placeholder:text-[#8E918F] outline-none flex-1 border-none focus:ring-0 min-w-0'
            />

            <div className='flex items-center gap-1.5 shrink-0'>
              <button
                type='button'
                onClick={handleMicClick}
                className={`size-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isListening
                    ? 'bg-rose-500/20 text-rose-500 animate-pulse'
                    : 'text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/10'
                }`}
                title={isAr ? 'إدخال صوتي' : 'Voice prompt'}
              >
                <Mic className='size-4.5' />
              </button>

              <button
                type='submit'
                disabled={!input.trim() || isThinking}
                className={`size-9 rounded-full flex items-center justify-center transition-all ${
                  input.trim() && !isThinking
                    ? 'bg-[#09090B] text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-neutral-200 cursor-pointer shadow-md'
                    : 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed'
                }`}
                title={isAr ? 'إرسال' : 'Send'}
              >
                <ArrowUp className='size-4.5 font-bold' />
              </button>
            </div>
          </form>

          <p className='text-center text-[11px] text-neutral-400 dark:text-[#8E918F] mt-2 px-4'>
            {isAr
              ? 'جميع الأرقام والرسوم البيانية تُقرأ مباشرة من قاعدة بيانات السيستم الحالية في الوقت الفعلي.'
              : 'All figures and charts are queried directly from your live store database in real time.'}
          </p>
        </div>
      </div>

      {/* 4. FREE AI MODEL SETTINGS DIALOG */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent dir='rtl' className='sm:max-w-lg rounded-2xl'>
          <DialogHeader className='text-start'>
            <DialogTitle className='text-base font-black flex items-center gap-2'>
              <Settings2 className='size-4 text-[#00d632]' />
              <span>إعدادات موديل الذكاء الاصطناعي المجاني</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveSettings} className='space-y-4 text-xs mt-1'>
            <div className='space-y-1.5'>
              <label className='font-bold block'>مزود الموديل المجاني (Provider)</label>
              <select
                value={provider}
                onChange={(e) => {
                  const next = e.target.value as AiProviderType
                  setProvider(next)
                  const match = FREE_MODEL_PRESETS.find((p) => p.provider === next)
                  if (match) setModel(match.model)
                }}
                className='h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold'
              >
                <option value='FREE_POLLINATIONS'>Free AI — بدون API Key (يعمل فوراً مجاناً)</option>
                <option value='GROQ'>Groq Free Tier (Llama 3.3 70B — سريع جداً)</option>
                <option value='GEMINI'>Google Gemini Free Tier (Gemini 2.0 Flash)</option>
                <option value='OPENROUTER'>OpenRouter Free Models (:free)</option>
                <option value='OLLAMA'>Ollama Local (محلي على جهازك 100% بدون نت)</option>
              </select>
              <p className='text-[11px] text-muted-foreground'>{activePreset.hint}</p>
            </div>

            <div className='space-y-1.5'>
              <label className='font-bold block'>اسم الموديل (Model ID)</label>
              <Input
                dir='ltr'
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder='openai / llama-3.3-70b-versatile / gemini-2.0-flash'
                className='rounded-xl font-mono text-xs'
              />
            </div>

            {(provider === 'GROQ' || provider === 'GEMINI' || provider === 'OPENROUTER') && (
              <div className='space-y-1.5'>
                <label className='font-bold flex items-center justify-between'>
                  <span>مفتاح API المجاني (API Key)</span>
                  {hasSavedApiKey && (
                    <span className='text-[10px] text-emerald-600 dark:text-emerald-400 font-bold'>
                      ✓ محفوظ مسبقاً
                    </span>
                  )}
                </label>
                <Input
                  type='password'
                  dir='ltr'
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={hasSavedApiKey ? 'اتركه فارغاً للإبقاء على المفتاح المحفوظ' : 'الصق مفتاحك المجاني هنا...'}
                  className='rounded-xl font-mono text-xs'
                />
                <p className='text-[11px] text-muted-foreground'>
                  {provider === 'GROQ' ? (
                    <>
                      احصل على مفتاح مجاني فوري (14,400 رسالة/يوم) من:{' '}
                      <a
                        href='https://console.groq.com/keys'
                        target='_blank'
                        rel='noreferrer'
                        className='underline font-bold text-foreground'
                      >
                        console.groq.com/keys
                      </a>
                    </>
                  ) : provider === 'GEMINI' ? (
                    <>
                      احصل على مفتاح Google Gemini مجاني من:{' '}
                      <a
                        href='https://aistudio.google.com/apikey'
                        target='_blank'
                        rel='noreferrer'
                        className='underline font-bold text-foreground'
                      >
                        aistudio.google.com/apikey
                      </a>
                    </>
                  ) : (
                    <>
                      احصل على مفتاح OpenRouter مجاني من:{' '}
                      <a
                        href='https://openrouter.ai/keys'
                        target='_blank'
                        rel='noreferrer'
                        className='underline font-bold text-foreground'
                      >
                        openrouter.ai/keys
                      </a>
                    </>
                  )}
                </p>
              </div>
            )}

            {provider === 'OLLAMA' && (
              <div className='space-y-1.5'>
                <label className='font-bold block'>رابط Ollama المحلي</label>
                <Input
                  dir='ltr'
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  placeholder='http://localhost:11434'
                  className='rounded-xl font-mono text-xs'
                />
              </div>
            )}

            <div className='flex items-center justify-end gap-2 pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsSettingsOpen(false)}
                className='rounded-xl cursor-pointer'
              >
                إلغاء
              </Button>
              <Button
                type='submit'
                disabled={isSavingConfig}
                className='rounded-xl bg-foreground text-background hover:opacity-90 font-bold gap-1.5 cursor-pointer'
              >
                {isSavingConfig ? <Loader2 className='size-3.5 animate-spin' /> : <Save className='size-3.5' />}
                <span>حفظ الإعدادات</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
