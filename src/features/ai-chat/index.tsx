import * as React from 'react'
import {
  Sparkles,
  ArrowUp,
  ImageIcon,
  Mic,
  Plus,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  RotateCcw,
  Share2,
  User,
  Compass,
  Lightbulb,
  Zap,
  QrCode,
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSaaSStore } from '@/lib/saas-store'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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
          <ul className='my-2.5 space-y-1.5 ps-5 list-disc marker:text-[#4F46E5] dark:marker:text-indigo-400 text-sm'>
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
          <blockquote className='border-s-4 border-[#4F46E5] bg-indigo-50/70 dark:bg-indigo-950/25 px-3.5 py-2.5 my-3 rounded-e-xl text-sm text-neutral-800 dark:text-neutral-200 shadow-2xs [&>p]:mb-0'>
            {children}
          </blockquote>
        ),
        code: ({ children, className }) => {
          const isInline = !className
          return isInline ? (
            <code className='px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800/80 font-mono text-xs text-[#4F46E5] dark:text-indigo-300 border border-neutral-200/80 dark:border-neutral-700/60 font-semibold'>
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
  suggestions?: string[]
}

export function AIChatView() {
  const {
    merchants,
    branches,
    products,
    auditLogs,
    customerScanCount,
    serviceCategories,
    productAddons,
    currentUser,
  } = useSaaSStore()

  const [input, setInput] = React.useState('')
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [isThinking, setIsThinking] = React.useState(false)
  const [selectedModel, setSelectedModel] = React.useState('Maya 2.0 Flash')
  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const [reactions, setReactions] = React.useState<Record<string, 'like' | 'dislike'>>({})
  const [isListening, setIsListening] = React.useState(false)

  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Scroll smoothly to bottom
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  // Get user's first name for greeting (matching "Hello, Julio." in screenshot)
  const userFirstName = currentUser.name.split(' ')[0] || 'Sherif'

  // 4 Suggestion Cards matching the screenshot layout
  const suggestionCards = [
    {
      id: 'card-1',
      title: 'Audit store footfall & peak scanning hours',
      prompt: 'Analyze customer footfall, QR scanner traffic, and peak shopping hours across branches.',
      icon: QrCode,
    },
    {
      id: 'card-2',
      title: 'Help me draft a dynamic pricing strategy for branches',
      prompt: 'Draft an actionable dynamic pricing and markdown strategy for our active branch inventory.',
      icon: Lightbulb,
    },
    {
      id: 'card-3',
      title: 'Analyze product catalog margin & discount leaks',
      prompt: 'Review product catalog prices and detect margin vulnerabilities or pricing anomalies.',
      icon: Compass,
    },
    {
      id: 'card-4',
      title: 'Compare competitor price benchmarks in operational zones',
      prompt: 'Give me a competitive benchmark report for supermarket & retail items in Cairo and Giza.',
      icon: Zap,
    },
  ]

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('Response copied to clipboard')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleReaction = (id: string, type: 'like' | 'dislike') => {
    setReactions((prev) => ({
      ...prev,
      [id]: prev[id] === type ? undefined! : type,
    }))
    toast.success(type === 'like' ? 'Good response logged' : 'Feedback logged')
  }

  const handleNewChat = () => {
    setMessages([])
    setInput('')
    setIsThinking(false)
    toast.info('Started a new conversation')
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

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsThinking(true)

    // Simulate intelligent synthesis with live store data
    setTimeout(() => {
      const q = query.toLowerCase()
      let reply = ''
      let nextSuggestions: string[] = []

      if (q.includes('footfall') || q.includes('scan') || q.includes('peak') || q.includes('qr')) {
        const totalScans = (customerScanCount * 18 + 1420).toLocaleString()
        reply = `### 📱 Store Footfall & QR Scanning Velocity\n\nReal-time telemetry synthesized across all registered branch scanner points:\n\n| Operational Metric | Live Value | Status |\n| :--- | :--- | :--- |\n| **Total Customer Scans** | **${totalScans}** scans | 🟢 High Activity |\n| **Peak Traffic Window** | **01:00 PM – 04:00 PM** & **07:30 PM – 10:00 PM** | 🕒 Lunch & Evening Rush |\n| **Top Performing Branch** | **Dokki Supercenter** (42% volume) | 🏆 Lead Branch |\n| **Scan-to-Purchase Ratio** | **71.2%** tag verification rate | 📈 +5.4% vs last week |\n\n> 💡 **Recommendation:** Place laminated counter-top QR standees at high-margin checkout aisles to increase repeat scans during the evening traffic peak.`
        nextSuggestions = [
          'Help me draft a dynamic pricing strategy for branches',
          'Analyze product catalog margin & discount leaks',
          'Export Footfall PDF Summary',
        ]
      } else if (q.includes('price') || q.includes('pricing') || q.includes('strategy') || q.includes('markdown')) {
        reply = `### 💡 Dynamic Pricing & Markdown Optimization\n\nBased on your active catalog of **${products.length} products**, here is an actionable 3-tier strategy:\n\n1. **Off-Peak Perishable Markdowns:** Apply automated **5–8%** price adjustments on perishables between \`08:30 PM\` and \`11:00 PM\` to minimize waste.\n2. **Bundle Pricing with Add-ons:** Pair bestsellers with high-margin items like *${productAddons?.[0]?.name || 'Gift Packaging'}* to increase average basket size by **18%**.\n3. **Margin Floor Protection:** Set a minimum margin floor of \`15%\` on dairy and bakery items to protect store profit against wholesale inflation.\n\n> 🛡️ **Audit Logs:** All automated rule overrides are captured in real-time in the compliance ledger.`
        nextSuggestions = [
          'Audit store footfall & peak scanning hours',
          'Compare competitor price benchmarks',
          'Analyze product catalog margin & discount leaks',
        ]
      } else if (q.includes('margin') || q.includes('leak') || q.includes('catalog') || q.includes('product')) {
        reply = `### 🔍 Catalog Margin & Audit Trail Analysis\n\nTelemetry inspection across active inventory:\n\n- **Indexed Products:** **${products.length} items** across **${serviceCategories?.length || 3} categories**.\n- **Audit Trail Compliance:** **${auditLogs.length} events** logged with zero unauthorized overrides.\n- **Healthy Margin Items:** Packaged pantry goods and specialized imported beverages lead with **+32% margin**.\n- **Identified Margin Leaks:** Bulk staples without associated add-ons show a **3.4% margin compression** during weekend promotional events.\n\n> ⚡ **System Status:** Healthy. 100% Barcode uniqueness verified with zero SKU duplication.`
        nextSuggestions = [
          'Help me draft a dynamic pricing strategy for branches',
          'Audit store footfall & peak scanning hours',
          'View Registered Merchants',
        ]
      } else if (q.includes('competitor') || q.includes('benchmark') || q.includes('dokki') || q.includes('zayed')) {
        reply = `### 🏬 Competitor Price Benchmark (Dokki & Sheikh Zayed)\n\nBenchmark analysis based on real-time retail scans:\n\n| Category | Our Price Index | Regional Competitors | Market Status |\n| :--- | :--- | :--- | :--- |\n| **Beverages & Dairy** | EGP 28.50 | EGP 29.20 | 🟢 2.4% More Competitive |\n| **Bakery & Fresh Produce** | EGP 45.00 | EGP 45.00 | 🟡 Balanced Parity |\n| **Specialty Add-ons** | Exclusive Catalog | N/A | 🟣 Zero Local Competition |\n\n> 📊 **Competitive Index:** Rated **94 / 100** (Strong regional advantage in high-density branches).`
        nextSuggestions = [
          'Audit store footfall & peak scanning hours',
          'Help me draft a dynamic pricing strategy for branches',
        ]
      } else {
        const hasData = merchants.length > 0 || products.length > 0
        reply = `### ⚡ Retail Intelligence Hub: "${query}"\n\nI processed your request using **${selectedModel}** and cross-referenced with your active cloud database:\n\n| Live Operational Entity | Synchronized Status | Current Volume |\n| :--- | :--- | :--- |\n| **Registered Merchants** | ${merchants.length > 0 ? '🟢 Active & Online' : '🟡 0 Configured (Pending)'} | **${merchants.length}** merchants |\n| **Physical Branches** | ${branches.length > 0 ? '🟢 POS Telemetry Live' : '🟡 0 Active Locations'} | **${branches.length}** branches |\n| **Catalog SKU Inventory** | ${products.length > 0 ? '🟢 Monitored & Tagged' : '🟡 0 Products Indexed'} | **${products.length}** items |\n| **Dynamic QR Terminals** | 🟢 Scanner Service Ready | **${branches.length || 1}** endpoint |\n\n${
          !hasData
            ? `> 💡 **Notice:** Your database was recently cleared and is currently clean. You can add branches, merchants, or upload your product catalog via **Excel Import** in the sidebar.`
            : `> 💡 **Retail Insight:** All QR scanning endpoints, price audit trails, and multi-tenant telemetry are currently synchronized.`
        }\n\n**Quick actions you can ask me to run:**\n- **"Analyze store footfall"** — inspect peak scanner traffic and shopper conversion.\n- **"Suggest pricing strategy"** — calculate markdown velocity and off-peak promotions.\n- **"Check margin leaks"** — detect margin compression and SKU anomalies.`
        nextSuggestions = [
          'Audit store footfall & peak scanning hours',
          'Help me draft a dynamic pricing strategy for branches',
          'Analyze product catalog margin & discount leaks',
        ]
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: nextSuggestions,
      }

      setMessages((prev) => [...prev, aiMsg])
      setIsThinking(false)
    }, 600)
  }

  const handleMicClick = () => {
    setIsListening((prev) => !prev)
    if (!isListening) {
      toast.info('Voice input listening... (Speak now)')
      setTimeout(() => {
        setIsListening(false)
        setInput('Analyze store footfall and customer scan volume')
        toast.success('Voice transcription complete')
      }, 2500)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      toast.success(`Attached "${file.name}" for visual barcode & shelf inspection.`)
      setInput((prev) => `${prev} [Attached: ${file.name}]`)
    }
  }

  return (
    <div
      data-layout='fixed'
      className='flex flex-col flex-1 h-full min-h-0 overflow-hidden bg-slate-50/70 dark:bg-[#131314] text-foreground dark:text-[#E3E3E3] font-sans antialiased'
    >
      {/* 1. TOP NAV BAR (Gemini Style) */}
      <header className='shrink-0 h-14 px-3 sm:px-6 flex items-center justify-between border-b border-border/60 dark:border-white/5 bg-background/80 dark:bg-[#131314]/80 backdrop-blur-md z-10'>
        {/* Left: Sidebar Toggle, Model Selector & New Chat */}
        <div className='flex items-center gap-1.5 sm:gap-3'>
          <SidebarTrigger variant='ghost' className='size-8 text-neutral-600 dark:text-neutral-300 hover:text-foreground dark:hover:text-white' />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type='button'
                className='flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-[#1E1F20] text-sm font-semibold text-neutral-900 dark:text-white transition-colors cursor-pointer group'
              >
                <span>{selectedModel}</span>
                <ChevronDown className='size-3.5 text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-white transition-transform' />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start' className='w-60 bg-white dark:bg-[#1E1F20] border-border dark:border-neutral-800 text-neutral-900 dark:text-white p-1 rounded-xl shadow-xl'>
              <DropdownMenuLabel className='text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-2 py-1'>
                Select Maya Intelligence Model
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setSelectedModel('Maya 2.0 Flash')}
                className='text-xs font-medium cursor-pointer rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:bg-neutral-100 dark:focus:bg-neutral-800 flex items-center justify-between'
              >
                <span>Maya 2.0 Flash</span>
                <span className='text-[10px] text-indigo-500 dark:text-indigo-400 font-mono font-semibold'>Fast & Agile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSelectedModel('Maya 2.0 Pro')}
                className='text-xs font-medium cursor-pointer rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:bg-neutral-100 dark:focus:bg-neutral-800 flex items-center justify-between'
              >
                <span>Maya 2.0 Pro</span>
                <span className='text-[10px] text-rose-500 dark:text-rose-400 font-mono font-semibold'>Deep Audit</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSelectedModel('Maya RetailIQ')}
                className='text-xs font-medium cursor-pointer rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:bg-neutral-100 dark:focus:bg-neutral-800 flex items-center justify-between'
              >
                <span>Maya RetailIQ</span>
                <span className='text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold'>Live DB</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* New Chat Button */}
          <button
            type='button'
            onClick={handleNewChat}
            className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-medium text-neutral-700 hover:text-black dark:text-neutral-300 dark:hover:text-white border border-border/40 dark:border-transparent transition-colors cursor-pointer'
            title='Start a new chat'
          >
            <Plus className='size-3.5' />
            <span className='hidden sm:inline'>New chat</span>
          </button>
        </div>

        {/* Right: Actions & User Avatar */}
        <div className='flex items-center gap-2 sm:gap-3'>
          <LanguageSwitch />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </header>

      {/* 2. MIDDLE SCROLLABLE WORKSPACE (Only this area scrolls) */}
      <div className='flex-1 min-h-0 overflow-y-auto px-4 sm:px-6'>
        {messages.length === 0 ? (
          /* ========================================================
             EMPTY STATE: GOOGLE GEMINI HERO (EXACT SCREENSHOT MATCH)
             ======================================================== */
          <div className='flex flex-col items-center justify-center max-w-5xl mx-auto w-full min-h-full py-8 sm:py-12'>
            {/* Hero Greeting */}
            <div className='text-center space-y-3 mb-8 sm:mb-10'>
              <h1 className='text-4xl sm:text-5xl md:text-6xl font-black tracking-tight pb-1'>
                <span className='text-neutral-900 dark:text-white'>Hello, </span>
                <span className='bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#818CF8] bg-clip-text text-transparent'>
                  {userFirstName}
                </span>
                <span className='text-[#4F46E5]'>.</span>
              </h1>

              {/* Maya Assistant Message */}
              <div className='flex flex-col items-center space-y-2 max-w-xl mx-auto'>
                <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-[#4F46E5] dark:text-indigo-400 text-xs font-bold border border-indigo-500/20 shadow-2xs'>
                  <Sparkles className='size-3.5 animate-pulse text-[#4F46E5]' />
                  <span>I'm Maya — your Retail & Pricing Assistant</span>
                </div>
                <h2 className='text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-800 dark:text-neutral-100 select-none'>
                  How can I assist your operations today?
                </h2>
                <p className='text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto leading-relaxed'>
                  I can analyze live store footfall, detect margin leaks across your product catalog, draft dynamic markdown pricing, or audit branches.
                </p>
              </div>
            </div>

            {/* 4 Suggestion Cards Row */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full'>
              {suggestionCards.map((card) => {
                const Icon = card.icon
                return (
                  <div
                    key={card.id}
                    onClick={() => handleSend(card.prompt)}
                    className='h-44 rounded-2xl bg-white dark:bg-[#1E1F20] hover:bg-neutral-50/90 dark:hover:bg-[#282A2C] transition-all duration-200 p-4.5 cursor-pointer flex flex-col justify-between border border-border/80 dark:border-transparent hover:border-indigo-300 dark:hover:border-neutral-700/60 shadow-xs hover:shadow-md relative group select-none active:scale-[0.98]'
                  >
                    {/* Card Text */}
                    <p className='text-sm text-neutral-700 dark:text-[#E3E3E3] font-normal leading-relaxed line-clamp-3 group-hover:text-black dark:group-hover:text-white transition-colors'>
                      {card.title}
                    </p>

                    {/* Bottom-right Circle Icon */}
                    <div className='self-end size-8 rounded-full bg-neutral-100 dark:bg-[#131314] flex items-center justify-center text-neutral-500 dark:text-neutral-400 group-hover:bg-indigo-50 dark:group-hover:bg-[#4F46E5]/20 group-hover:text-[#4F46E5] dark:group-hover:text-indigo-400 transition-all'>
                      <Icon className='size-4' />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* ========================================================
             ACTIVE CONVERSATION STREAM
             ======================================================== */
          <div className='max-w-4xl mx-auto w-full py-6 space-y-8'>
            {messages.map((msg) => {
              const isAI = msg.sender === 'ai'

              return (
                <div key={msg.id} className='space-y-3 group'>
                  {/* Message Header */}
                  <div className='flex items-center gap-3'>
                    {isAI ? (
                      <div className='size-8 rounded-xl bg-gradient-to-tr from-[#4F46E5] to-[#6366F1] dark:from-[#1E1F20] dark:to-[#4F46E5] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm border border-indigo-500/20'>
                        <Sparkles className='size-4' />
                      </div>
                    ) : (
                      <div className='size-8 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-white flex items-center justify-center font-bold text-xs shrink-0 border border-neutral-300 dark:border-neutral-700'>
                        <User className='size-4' />
                      </div>
                    )}
                    <div className='flex items-center gap-2'>
                      <span className='font-semibold text-xs text-neutral-900 dark:text-white'>
                        {isAI ? selectedModel : currentUser.name}
                      </span>
                      <span className='text-[10px] text-neutral-400 dark:text-neutral-500'>{msg.timestamp}</span>
                    </div>
                  </div>

                  {/* Message Body with Markdown Renderer */}
                  <div className='ps-11 text-sm leading-relaxed'>
                    {isAI ? (
                      <ChatMarkdown content={msg.text} />
                    ) : (
                      <p className='text-neutral-900 dark:text-[#E3E3E3] whitespace-pre-line font-medium leading-relaxed'>
                        {msg.text}
                      </p>
                    )}
                  </div>

                  {/* AI Suggestion Chips */}
                  {isAI && msg.suggestions && msg.suggestions.length > 0 && (
                    <div className='ps-11 flex flex-wrap gap-2 pt-2'>
                      {msg.suggestions.map((sug) => (
                        <button
                          key={sug}
                          type='button'
                          onClick={() => handleSend(sug)}
                          className='text-xs px-3 py-1.5 rounded-full bg-white dark:bg-[#1E1F20] hover:bg-neutral-100 dark:hover:bg-[#282A2C] text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white border border-border dark:border-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs'
                        >
                          <Sparkles className='size-3 text-[#4F46E5] dark:text-indigo-400' />
                          <span>{sug}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* AI Response Action Toolbar */}
                  {isAI && (
                    <div className='ps-11 flex items-center gap-1 pt-1 opacity-60 group-hover:opacity-100 transition-opacity'>
                      <button
                        type='button'
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className='p-1.5 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition-colors cursor-pointer'
                        title='Copy response'
                      >
                        {copiedId === msg.id ? (
                          <Check className='size-3.5 text-emerald-500' />
                        ) : (
                          <Copy className='size-3.5' />
                        )}
                      </button>
                      <button
                        type='button'
                        onClick={() => handleReaction(msg.id, 'like')}
                        className={`p-1.5 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer ${
                          reactions[msg.id] === 'like' ? 'text-[#4F46E5] bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-500/10' : 'text-neutral-400 hover:text-neutral-800 dark:hover:text-white'
                        }`}
                        title='Good response'
                      >
                        <ThumbsUp className='size-3.5' />
                      </button>
                      <button
                        type='button'
                        onClick={() => handleReaction(msg.id, 'dislike')}
                        className={`p-1.5 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer ${
                          reactions[msg.id] === 'dislike' ? 'text-rose-500 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10' : 'text-neutral-400 hover:text-neutral-800 dark:hover:text-white'
                        }`}
                        title='Bad response'
                      >
                        <ThumbsDown className='size-3.5' />
                      </button>
                      <button
                        type='button'
                        onClick={() => handleSend(messages[messages.length - 2]?.text || 'Regenerate')}
                        className='p-1.5 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition-colors cursor-pointer'
                        title='Regenerate response'
                      >
                        <RotateCcw className='size-3.5' />
                      </button>
                      <button
                        type='button'
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href)
                          toast.success('Conversation link copied!')
                        }}
                        className='p-1.5 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition-colors cursor-pointer'
                        title='Share'
                      >
                        <Share2 className='size-3.5' />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Thinking / Streaming Indicator */}
            {isThinking && (
              <div className='space-y-3 ps-1'>
                <div className='flex items-center gap-3'>
                  <div className='size-8 rounded-xl bg-gradient-to-tr from-[#4F46E5] to-[#6366F1] dark:from-[#1E1F20] dark:to-[#4F46E5] text-white flex items-center justify-center font-bold text-xs shrink-0 animate-pulse'>
                    <Sparkles className='size-4' />
                  </div>
                  <span className='text-xs font-semibold text-neutral-900 dark:text-white'>{selectedModel}</span>
                </div>
                <div className='ps-11 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400'>
                  <div className='size-2 rounded-full bg-[#4F46E5] dark:bg-indigo-400 animate-ping' />
                  <span>Thinking & synthesizing retail telemetry...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 3. PINNED BOTTOM INPUT BAR (Stays permanently fixed while chat scrolls) */}
      <div className='shrink-0 z-10 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent dark:from-[#131314] dark:via-[#131314]/95 pt-2 pb-3 px-4'>
        <div className='max-w-4xl mx-auto w-full'>
          {/* Pill Container */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className='relative rounded-full bg-white dark:bg-[#1E1F20] border border-border/90 dark:border-neutral-700/60 hover:border-neutral-400 dark:hover:border-neutral-600 focus-within:border-[#4F46E5] focus-within:ring-2 focus-within:ring-[#4F46E5]/20 dark:focus-within:border-neutral-500 px-4 sm:px-6 py-3 flex items-center gap-3 shadow-lg dark:shadow-2xl transition-all'
          >
            {/* Text Input */}
            <input
              type='text'
              placeholder='Ask Maya about footfall, pricing, or catalog...'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isThinking}
              className='bg-transparent text-sm text-neutral-900 dark:text-[#E3E3E3] placeholder:text-neutral-400 dark:placeholder:text-[#8E918F] outline-none flex-1 border-none focus:ring-0 min-w-0'
            />

            {/* Right Action Icons */}
            <div className='flex items-center gap-1.5 shrink-0'>
              {/* Hidden File Input for Image/Barcode Upload */}
              <input
                type='file'
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept='image/*'
                className='hidden'
              />

              {/* Image Upload Button */}
              <button
                type='button'
                onClick={() => fileInputRef.current?.click()}
                className='size-9 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer'
                title='Upload barcode image or document'
              >
                <ImageIcon className='size-4.5' />
              </button>

              {/* Voice / Mic Button */}
              <button
                type='button'
                onClick={handleMicClick}
                className={`size-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isListening
                    ? 'bg-rose-500/20 text-rose-500 animate-pulse'
                    : 'text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/10'
                }`}
                title='Use voice prompt'
              >
                <Mic className='size-4.5' />
              </button>

              {/* Send Button */}
              <button
                type='submit'
                disabled={!input.trim() || isThinking}
                className={`size-9 rounded-full flex items-center justify-center transition-all ${
                  input.trim() && !isThinking
                    ? 'bg-[#4F46E5] text-white hover:bg-indigo-700 dark:bg-white dark:text-black dark:hover:bg-neutral-200 cursor-pointer shadow-md'
                    : 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed'
                }`}
                title='Send message'
              >
                <ArrowUp className='size-4.5 font-bold' />
              </button>
            </div>
          </form>

          {/* Bottom Disclaimer (Maya Style) */}
          <p className='text-center text-[11px] text-neutral-400 dark:text-[#8E918F] mt-2 px-4'>
            Maya may display inaccurate info, including about products or people. Double-check responses.{' '}
            <span className='underline hover:text-neutral-700 dark:hover:text-neutral-300 cursor-pointer'>
              Maya AI Guidelines
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
