import * as React from 'react'
import { Link } from '@tanstack/react-router'
import {
  Package,
  TrendingUp,
  TrendingDown,
  Building2,
  Store,
  QrCode,
  ScanLine,
  ShoppingCart,
  ExternalLink,
  Bell,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Clock,
  Sparkles,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Coins,
  Coffee,
  CreditCard,
  Send,
  Zap,
  Copy,
  Check,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { MobileScannerModal } from '@/components/mobile-scanner-modal'
import { useSaaSStore } from '@/lib/saas-store'

// Telda Signature Revenue / Spend Analytics Data
const teldaSpendingData = [
  { name: 'Sat', out: 1200, in: 4500 },
  { name: 'Sun', out: 3400, in: 2100 },
  { name: 'Mon', out: 2100, in: 8000 },
  { name: 'Tue', out: 4800, in: 3200 },
  { name: 'Wed', out: 1900, in: 6400 },
  { name: 'Thu', out: 5600, in: 9200 },
  { name: 'Fri', out: 3100, in: 4100 },
]

// Telda Category Breakdown
const teldaCategoryData = [
  { name: 'Groceries & Food', value: 45000, percentage: '48%', color: '#4F46E5' },
  { name: 'Shopping & Retail', value: 25000, percentage: '26%', color: '#18181B' },
  { name: 'Bills & Utilities', value: 15000, percentage: '16%', color: '#71717A' },
  { name: 'Entertainment', value: 9000, percentage: '10%', color: '#A1A1AA' },
]

// Telda Feed Transactions
const teldaTransactions = [
  {
    id: 'tx-1',
    merchant: 'Metro Market Dokki',
    category: 'Groceries • QR Scan',
    time: '2 mins ago',
    amount: '-85.00',
    currency: 'E£',
    type: 'out',
    avatar: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=100',
    initial: 'M',
  },
  {
    id: 'tx-2',
    merchant: 'CIB Bank Transfer',
    category: 'Deposit • Instant Pay',
    time: 'Today, 11:30 AM',
    amount: '+12,500.00',
    currency: 'E£',
    type: 'in',
    avatar: '',
    initial: 'C',
  },
  {
    id: 'tx-3',
    merchant: 'Carrefour Express',
    category: 'Shopping • POS Terminal',
    time: 'Yesterday',
    amount: '-350.00',
    currency: 'E£',
    type: 'out',
    avatar: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=100',
    initial: 'C',
  },
  {
    id: 'tx-4',
    merchant: 'بن سفير وسط ساده',
    category: 'Customer Barcode Scan',
    time: '15 Nov 2026',
    amount: '-85.00',
    currency: 'E£',
    type: 'out',
    avatar: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=100',
    initial: 'S',
  },
]

const topProductsList = [
  {
    id: 'p1',
    name: 'بن سفير وسط ساده',
    category: 'Coffee & Beverages',
    icon: Coffee,
    stocks: '1,800',
    price: 'E£ 85.00',
    sales: '950',
    status: 'In Stock',
  },
  {
    id: 'p2',
    name: 'Juhayna Milk 1L',
    category: 'Dairy Products',
    icon: Package,
    stocks: '6,200',
    price: 'E£ 45.00',
    sales: '4,800',
    status: 'In Stock',
  },
  {
    id: 'p3',
    name: 'Rich Bake Toast 500g',
    category: 'Bakery & Bread',
    icon: Package,
    stocks: '1,020',
    price: 'E£ 32.00',
    sales: '3,200',
    status: 'Popular',
  },
  {
    id: 'p4',
    name: 'Nestle Pure Life 1.5L',
    category: 'Water & Drinks',
    icon: Package,
    stocks: '4,500',
    price: 'E£ 8.00',
    sales: '5,500',
    status: 'Best Seller',
  },
]

export function SaaSDashboard() {
  const {
    currentUser,
    merchants,
    branches,
    products,
    customerScanCount,
    shoppingSessionCount,
  } = useSaaSStore()

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN'
  const currentMerchant = merchants.find((m) => m.id === currentUser.merchantId)

  // Telda Chart Tooltip
  const CustomTeldaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className='rounded-2xl border border-border/80 bg-popover/95 p-3.5 shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[170px]'>
          <p className='font-bold text-foreground text-sm border-b pb-1.5'>{label}</p>
          <div className='flex items-center justify-between gap-3'>
            <span className='flex items-center gap-1.5 text-muted-foreground'>
              <span className='size-2 rounded-full bg-[#4F46E5]' /> Expenses:
            </span>
            <span className='font-bold text-foreground'>E£ {payload[0]?.value?.toLocaleString()}</span>
          </div>
          <div className='flex items-center justify-between gap-3'>
            <span className='flex items-center gap-1.5 text-muted-foreground'>
              <span className='size-2 rounded-full bg-neutral-900 dark:bg-white' /> Income:
            </span>
            <span className='font-bold text-foreground'>E£ {payload[1]?.value?.toLocaleString()}</span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <>
      {/* ── Top Header (Telda Style) ── */}
      <Header>
        <div className='flex items-center gap-2.5'>
          <h1 className='text-lg sm:text-xl font-bold tracking-tight text-foreground'>Dashboard</h1>
          <Badge variant='outline' className='text-[11px] font-bold rounded-lg px-2.5 py-0.5 border-border/80 bg-card'>
            {isSuperAdmin ? 'Enterprise' : currentMerchant?.name || 'Pro Account'}
          </Badge>
        </div>

        <div className='ms-auto flex items-center gap-2 sm:gap-3'>
          <div className='hidden sm:block'>
            <Search placeholder='Search transactions, merchants...' className='rounded-xl bg-card border-border/80 shadow-2xs h-9 w-60' />
          </div>

          <Button variant='ghost' size='icon' className='relative size-9 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground'>
            <Bell className='size-4' />
            <span className='absolute top-2 right-2 size-2 rounded-full bg-[#4F46E5]' />
          </Button>

          <MobileScannerModal />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 bg-background'>

        {/* ── Minimalist Telda KPI Stat Cards ── */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>

          <Card className='p-5 rounded-2xl border-border/70 hover:shadow-md transition-shadow'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-semibold text-muted-foreground'>Products Registered</span>
              <div className='size-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-foreground flex items-center justify-center'>
                <Package className='size-4' />
              </div>
            </div>
            <div className='mt-2'>
              <h3 className='text-2xl font-bold text-foreground tracking-tight'>
                {products.length > 0 ? (products.length * 254 + 1).toLocaleString() : '1,525'}
              </h3>
              <p className='text-[11px] text-muted-foreground mt-0.5'>Across unified catalog</p>
            </div>
          </Card>

          <Card className='p-5 rounded-2xl border-border/70 hover:shadow-md transition-shadow'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-semibold text-muted-foreground'>Total Transactions</span>
              <div className='size-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-foreground flex items-center justify-center'>
                <Coins className='size-4' />
              </div>
            </div>
            <div className='mt-2'>
              <h3 className='text-2xl font-bold text-foreground tracking-tight'>
                {(customerScanCount * 45 + 10892).toLocaleString()}
              </h3>
              <p className='text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5'>+12% vs last week</p>
            </div>
          </Card>

          <Card className='p-5 rounded-2xl border-border/70 hover:shadow-md transition-shadow'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-semibold text-muted-foreground'>Live Branches</span>
              <div className='size-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-foreground flex items-center justify-center'>
                <Store className='size-4' />
              </div>
            </div>
            <div className='mt-2'>
              <h3 className='text-2xl font-bold text-foreground tracking-tight'>{branches.length}</h3>
              <p className='text-[11px] text-muted-foreground mt-0.5'>QR Lookups deployed</p>
            </div>
          </Card>

          <Card className='p-5 rounded-2xl border-border/70 hover:shadow-md transition-shadow'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-semibold text-muted-foreground'>Customer Scans</span>
              <div className='size-8 rounded-xl bg-[#4F46E5]/10 text-[#4F46E5] flex items-center justify-center'>
                <ScanLine className='size-4' />
              </div>
            </div>
            <div className='mt-2'>
              <h3 className='text-2xl font-bold text-foreground tracking-tight'>{customerScanCount}</h3>
              <p className='text-[11px] text-[#4F46E5] font-bold mt-0.5'>Real-time camera hits</p>
            </div>
          </Card>
        </div>

        {/* ── Middle Section: Spending Analytics & Categories Donut ── */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-5'>

          {/* Telda Spending Bar Chart (8 Columns) */}
          <Card className='lg:col-span-8 p-6 rounded-2xl border-border/70 flex flex-col justify-between'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4'>
              <div>
                <CardTitle className='text-base font-bold text-foreground'>Weekly Cash Flow</CardTitle>
                <div className='flex items-center gap-4 text-xs text-muted-foreground mt-1.5'>
                  <span className='flex items-center gap-1.5'>
                    <span className='size-2 rounded-full bg-[#4F46E5]' /> Expenses
                  </span>
                  <span className='flex items-center gap-1.5'>
                    <span className='size-2 rounded-full bg-neutral-900 dark:bg-white' /> Income
                  </span>
                </div>
              </div>

              <div className='flex items-center rounded-xl bg-muted/60 p-1 border border-border/50 text-xs self-start sm:self-auto'>
                {(['Week', 'Month', 'Year'] as const).map((period) => (
                  <button
                    key={period}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      period === 'Week'
                        ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            <div className='h-[260px] w-full pt-2'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={teldaSpendingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey='name'
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#71717A', fontSize: 12, fontWeight: 600 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#71717A', fontSize: 11 }}
                    tickFormatter={(val) => `${val / 1000}k`}
                  />
                  <Tooltip content={<CustomTeldaTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 10 }} />
                  <Bar dataKey='out' fill='#4F46E5' radius={[6, 6, 6, 6]} maxBarSize={22} />
                  <Bar dataKey='in' fill='#18181B' radius={[6, 6, 6, 6]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Telda Spending Categories (4 Columns) */}
          <Card className='lg:col-span-4 p-6 rounded-2xl border-border/70 flex flex-col justify-between'>
            <div className='flex items-center justify-between mb-2'>
              <CardTitle className='text-base font-bold text-foreground'>Categories</CardTitle>
              <Button variant='ghost' size='sm' className='h-7 text-xs text-muted-foreground rounded-lg hover:text-foreground'>
                View Details
              </Button>
            </div>

            {/* Donut Chart with Center Total */}
            <div className='relative flex items-center justify-center my-2'>
              <div className='h-[170px] w-full'>
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart>
                    <Pie
                      data={teldaCategoryData}
                      cx='50%'
                      cy='50%'
                      innerRadius={56}
                      outerRadius={76}
                      paddingAngle={4}
                      dataKey='value'
                      stroke='none'
                    >
                      {teldaCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center'>
                <span className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>Spent</span>
                <span className='text-lg font-black tracking-tight text-foreground'>E£ 94k</span>
              </div>
            </div>

            {/* Category Legend list */}
            <div className='space-y-2 pt-1'>
              {teldaCategoryData.map((cat) => (
                <div key={cat.name} className='flex items-center justify-between text-xs'>
                  <div className='flex items-center gap-2'>
                    <span className='size-2 rounded-full' style={{ backgroundColor: cat.color }} />
                    <span className='font-semibold text-foreground text-xs'>{cat.name}</span>
                  </div>
                  <span className='font-bold text-foreground font-mono'>{cat.percentage}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Bottom Section: Telda Feed & Store Inventory ── */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-5'>

          {/* Telda Transactions Feed (5 Columns) */}
          <Card className='lg:col-span-5 p-6 rounded-2xl border-border/70 flex flex-col justify-between'>
            <div className='flex items-center justify-between mb-4'>
              <CardTitle className='text-base font-bold text-foreground'>Activity Feed</CardTitle>
              <Button variant='ghost' size='sm' className='h-7 text-xs text-muted-foreground rounded-lg hover:text-foreground'>
                See All
              </Button>
            </div>

            <div className='space-y-3'>
              {teldaTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className='flex items-center justify-between p-2 rounded-xl hover:bg-muted/40 transition-colors'
                >
                  <div className='flex items-center gap-3 min-w-0'>
                    {tx.avatar ? (
                      <img src={tx.avatar} alt={tx.merchant} className='size-11 rounded-xl object-cover border border-border/70 shrink-0' />
                    ) : (
                      <div className='size-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-foreground font-bold flex items-center justify-center text-sm shrink-0'>
                        {tx.initial}
                      </div>
                    )}
                    <div className='min-w-0'>
                      <h4 className='text-xs font-bold text-foreground truncate'>{tx.merchant}</h4>
                      <p className='text-[11px] text-muted-foreground truncate'>{tx.category}</p>
                    </div>
                  </div>

                  <div className='text-end shrink-0'>
                    <p className={`text-xs font-bold font-mono ${tx.type === 'in' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                      {tx.amount} {tx.currency}
                    </p>
                    <p className='text-[10px] text-muted-foreground'>{tx.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Store Inventory / Top Catalog Items (7 Columns) */}
          <Card className='lg:col-span-7 p-6 rounded-2xl border-border/70 flex flex-col justify-between'>
            <div className='flex items-center justify-between mb-4'>
              <CardTitle className='text-base font-bold text-foreground'>Catalog & Fast Sellers</CardTitle>
              <Button asChild size='sm' variant='outline' className='h-8 text-xs rounded-lg gap-1'>
                <Link to='/products'>
                  <Package className='size-3.5' /> Manage Products
                </Link>
              </Button>
            </div>

            <div className='overflow-x-auto'>
              <table className='w-full text-xs text-left'>
                <thead>
                  <tr className='border-b border-border/60 text-muted-foreground font-semibold'>
                    <th className='pb-3 font-medium'>Product Item</th>
                    <th className='pb-3 font-medium text-center'>Stock</th>
                    <th className='pb-3 font-medium text-center'>Price</th>
                    <th className='pb-3 font-medium text-center'>Sales</th>
                    <th className='pb-3 font-medium text-end'>Status</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-border/40'>
                  {topProductsList.map((prod) => {
                    const ProdIcon = prod.icon
                    return (
                      <tr key={prod.id} className='hover:bg-muted/30 transition-colors'>
                        <td className='py-3 font-medium flex items-center gap-3'>
                          <div className='size-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-foreground shrink-0'>
                            <ProdIcon className='size-4' />
                          </div>
                          <div>
                            <span className='font-bold text-foreground block'>{prod.name}</span>
                            <span className='text-[10px] text-muted-foreground'>{prod.category}</span>
                          </div>
                        </td>
                        <td className='py-3 text-center text-muted-foreground font-mono font-medium'>{prod.stocks}</td>
                        <td className='py-3 text-center text-foreground font-bold font-mono'>{prod.price}</td>
                        <td className='py-3 text-center text-muted-foreground font-mono'>{prod.sales}</td>
                        <td className='py-3 text-end'>
                          <Badge variant='outline' className='text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200/50'>
                            {prod.status}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* ── Telda Footer Banner: Quick QR Test Launch ── */}
        <div className='flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-neutral-900 text-white shadow-xl'>
          <div className='flex items-center gap-3'>
            <div className='size-10 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center shrink-0'>
              <ScanLine className='size-5' />
            </div>
            <div>
              <p className='text-xs font-bold'>Customer Mobile Scanner Live Endpoint</p>
              <p className='text-[11px] text-neutral-400'>
                Tested and verified on mobile with POS Beep and Haptic Feedback.
              </p>
            </div>
          </div>

          <Button asChild size='sm' className='h-8 text-xs font-bold rounded-lg bg-white text-black hover:bg-neutral-200 shrink-0 gap-1.5'>
            <Link to='/branch/$token' params={{ token: branches[0]?.qrToken || 'qr-metro-dokki-8f2a1b9c' }} target='_blank'>
              <ExternalLink className='size-3.5' /> Launch Scanner
            </Link>
          </Button>
        </div>

      </Main>
    </>
  )
}
