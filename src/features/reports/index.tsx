import * as React from 'react'
import {
  BarChart3,
  TrendingUp,
  FileText,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  Eye,
  FileSpreadsheet,
  Store,
  QrCode,
  Package,
  Search,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { LanguageSwitch } from '@/components/language-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSaaSStore } from '@/lib/saas-store'
import { toast } from 'sonner'

interface ReportMeta {
  id: string
  code: string
  title: string
  category: 'Revenue' | 'Scanning' | 'Pricing' | 'Operations' | 'Security'
  description: string
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Real-time'
  lastGenerated: string
  format: 'PDF / CSV' | 'Excel' | 'PDF'
  status: 'Ready' | 'Processing'
}

const defaultReports: ReportMeta[] = [
  {
    id: 'rpt-1',
    code: 'RPT-REV-01',
    title: 'Platform Revenue & GMV Audit',
    category: 'Revenue',
    description: 'Comprehensive gross transaction value across all active merchants and branches.',
    frequency: 'Monthly',
    lastGenerated: '2026-03-31',
    format: 'PDF / CSV',
    status: 'Ready',
  },
  {
    id: 'rpt-2',
    code: 'RPT-SCN-02',
    title: 'Customer In-Store QR Scanning Activity',
    category: 'Scanning',
    description: 'Aisle scan velocity, peak shopping hours, and unique shopper scan frequency.',
    frequency: 'Daily',
    lastGenerated: 'Today, 02:00 AM',
    format: 'Excel',
    status: 'Ready',
  },
  {
    id: 'rpt-3',
    code: 'RPT-PRC-03',
    title: 'Product Price Volatility & Update History',
    category: 'Pricing',
    description: 'Detailed trail of price modifications, bulk spreadsheet uploads, and markup shifts.',
    frequency: 'Weekly',
    lastGenerated: '2026-04-01',
    format: 'PDF / CSV',
    status: 'Ready',
  },
  {
    id: 'rpt-4',
    code: 'RPT-OPS-04',
    title: 'Merchant Onboarding & Branch Footfall',
    category: 'Operations',
    description: 'New store activations, active QR tokens, and regional store performance breakdown.',
    frequency: 'Weekly',
    lastGenerated: '2026-03-28',
    format: 'Excel',
    status: 'Ready',
  },
  {
    id: 'rpt-5',
    code: 'RPT-SEC-05',
    title: 'Staff Permissions & Security Audit Log',
    category: 'Security',
    description: 'Full traceability of user role assignments, admin log-ins, and permission overrides.',
    frequency: 'Real-time',
    lastGenerated: 'Just now',
    format: 'PDF',
    status: 'Ready',
  },
  {
    id: 'rpt-6',
    code: 'RPT-CAT-06',
    title: 'Catalog Health & Out-of-Stock Discrepancies',
    category: 'Operations',
    description: 'Scanned barcodes with missing catalog entries or zero-inventory alerts.',
    frequency: 'Daily',
    lastGenerated: 'Yesterday',
    format: 'Excel',
    status: 'Ready',
  },
]

// Mock timeseries chart data
const scanTrendsData = [
  { day: 'Mon', scans: 3420, priceUpdates: 28 },
  { day: 'Tue', scans: 4180, priceUpdates: 45 },
  { day: 'Wed', scans: 3950, priceUpdates: 19 },
  { day: 'Thu', scans: 5120, priceUpdates: 62 },
  { day: 'Fri', scans: 6840, priceUpdates: 88 },
  { day: 'Sat', scans: 8900, priceUpdates: 104 },
  { day: 'Sun', scans: 7420, priceUpdates: 54 },
]

export function ReportsView() {
  const { merchants, branches, products, auditLogs, customerScanCount } = useSaaSStore()

  const [search, setSearch] = React.useState('')
  const [categoryFilter, setCategoryFilter] = React.useState<string>('ALL')
  const [dateRange, setDateRange] = React.useState<'30D' | '7D' | 'YTD'>('30D')

  // Preview dialog state
  const [selectedReport, setSelectedReport] = React.useState<ReportMeta | null>(null)
  const [isGenerateOpen, setIsGenerateOpen] = React.useState(false)

  // Custom Report Form state
  const [customTitle, setCustomTitle] = React.useState('')
  const [customCategory, setCustomCategory] = React.useState('Revenue')
  const [customFormat, setCustomFormat] = React.useState('PDF / CSV')

  const handleDownload = (report: ReportMeta, format: 'PDF' | 'CSV' | 'Excel') => {
    toast.success(`Preparing ${report.code} (${format})... Download started!`)
  }

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customTitle.trim()) {
      toast.error('Report title is required')
      return
    }
    toast.success(`Report "${customTitle}" generated successfully!`)
    setIsGenerateOpen(false)
    setCustomTitle('')
  }

  const filteredReports = defaultReports.filter((rpt) => {
    const matchesSearch =
      rpt.title.toLowerCase().includes(search.toLowerCase()) ||
      rpt.code.toLowerCase().includes(search.toLowerCase()) ||
      rpt.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'ALL' || rpt.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Dynamic Merchant comparison data for bar chart
  const merchantChartData = (merchants || []).slice(0, 5).map((m) => {
    const bCount = (branches || []).filter((b) => b.merchantId === m.id).length
    const pCount = (products || []).filter((p) => p.merchantId === m.id).length
    return {
      name: m.name.split(' ')[0],
      branches: bCount,
      products: pCount,
    }
  })

  return (
    <>
      <Header fixed>
        <div className='ms-auto flex items-center gap-2'>
          <LanguageSwitch />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-6 p-4 sm:p-6'>
        {/* Title Bar */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <div className='flex items-center gap-2.5'>
              <div className='size-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 flex items-center justify-center font-bold border border-indigo-100 dark:border-indigo-900/40'>
                <BarChart3 className='size-5' />
              </div>
              <div>
                <h1 className='text-2xl font-bold tracking-tight text-foreground'>
                  Reports & Analytics
                </h1>
                <p className='text-xs text-muted-foreground mt-0.5'>
                  Comprehensive system audits, merchant footfall metrics, and price volatility analytics.
                </p>
              </div>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <div className='inline-flex items-center p-1 rounded-xl bg-card border border-border/80 shadow-2xs'>
              {(['7D', '30D', 'YTD'] as const).map((range) => (
                <button
                  key={range}
                  type='button'
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    dateRange === range
                      ? 'bg-primary text-primary-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {range === '7D' ? '7 Days' : range === '30D' ? 'Last 30 Days' : 'This Year'}
                </button>
              ))}
            </div>

            <Button
              onClick={() => setIsGenerateOpen(true)}
              className='gap-2 bg-primary text-primary-foreground font-semibold shadow-xs hover:bg-primary/90 h-9 px-4 rounded-lg'
            >
              <FileSpreadsheet className='size-4' />
              New Report
            </Button>
          </div>
        </div>

        {/* Metric KPI Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {/* Card 1: Total Scans */}
          <Card className='border-border/80 shadow-xs bg-white dark:bg-card p-4.5 rounded-2xl'>
            <div className='flex items-center justify-between text-muted-foreground mb-2'>
              <span className='text-xs font-semibold'>Total Customer Scans</span>
              <div className='size-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center'>
                <QrCode className='size-4' />
              </div>
            </div>
            <div className='text-2xl font-extrabold text-foreground tracking-tight'>
              {(customerScanCount * 18 + 1420).toLocaleString()}
            </div>
            <div className='flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium'>
              <ArrowUpRight className='size-3.5' />
              <span>+24.8% vs last month</span>
            </div>
          </Card>

          {/* Card 2: Active Stores */}
          <Card className='border-border/80 shadow-xs bg-white dark:bg-card p-4.5 rounded-2xl'>
            <div className='flex items-center justify-between text-muted-foreground mb-2'>
              <span className='text-xs font-semibold'>Merchant Network</span>
              <div className='size-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center'>
                <Store className='size-4' />
              </div>
            </div>
            <div className='text-2xl font-extrabold text-foreground tracking-tight'>
              {merchants.length} <span className='text-xs font-normal text-muted-foreground'>({branches.length} branches)</span>
            </div>
            <div className='flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground'>
              <span>Across all operational regions</span>
            </div>
          </Card>

          {/* Card 3: Catalog Volatility */}
          <Card className='border-border/80 shadow-xs bg-white dark:bg-card p-4.5 rounded-2xl'>
            <div className='flex items-center justify-between text-muted-foreground mb-2'>
              <span className='text-xs font-semibold'>Catalog Products</span>
              <div className='size-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center'>
                <Package className='size-4' />
              </div>
            </div>
            <div className='text-2xl font-extrabold text-foreground tracking-tight'>
              {products.length} <span className='text-xs font-normal text-muted-foreground'>items</span>
            </div>
            <div className='flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground'>
              <span>Active in real-time pricing index</span>
            </div>
          </Card>

          {/* Card 4: Audit Logs */}
          <Card className='border-border/80 shadow-xs bg-white dark:bg-card p-4.5 rounded-2xl'>
            <div className='flex items-center justify-between text-muted-foreground mb-2'>
              <span className='text-xs font-semibold'>Audit Trail Entries</span>
              <div className='size-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center'>
                <ShieldAlert className='size-4' />
              </div>
            </div>
            <div className='text-2xl font-extrabold text-foreground tracking-tight'>
              {auditLogs.length}
            </div>
            <div className='flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium'>
              <CheckCircle2 className='size-3.5' />
              <span>Full compliance logging active</span>
            </div>
          </Card>
        </div>

        {/* Visual Charts Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Chart 1: Scan Velocity Over Time (2 cols) */}
          <Card className='lg:col-span-2 border-border/80 shadow-xs bg-white dark:bg-card rounded-2xl p-5'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <h3 className='text-sm font-bold text-foreground'>Weekly Footfall & QR Scanning Velocity</h3>
                <p className='text-xs text-muted-foreground'>In-store shopper interactions across daily operating hours</p>
              </div>
              <Badge variant='outline' className='text-xs font-mono bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-200/50'>
                Live Stream
              </Badge>
            </div>
            <div className='h-[260px] w-full'>
              <ResponsiveContainer width='100%' height='100%'>
                <AreaChart data={scanTrendsData}>
                  <defs>
                    <linearGradient id='colorScans' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='#4F46E5' stopOpacity={0.4} />
                      <stop offset='95%' stopColor='#4F46E5' stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='rgba(150, 150, 150, 0.15)' />
                  <XAxis dataKey='day' stroke='#888888' fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke='#888888' fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(23, 23, 23, 0.95)',
                      borderRadius: '0.75rem',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type='monotone'
                    dataKey='scans'
                    stroke='#4F46E5'
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill='url(#colorScans)'
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Chart 2: Merchant Inventory & Branch Scale */}
          <Card className='border-border/80 shadow-xs bg-white dark:bg-card rounded-2xl p-5 flex flex-col justify-between'>
            <div>
              <div className='flex items-center justify-between mb-4'>
                <div>
                  <h3 className='text-sm font-bold text-foreground'>Top Stores Scale</h3>
                  <p className='text-xs text-muted-foreground'>Branch count by merchant</p>
                </div>
                <Store className='size-4 text-muted-foreground' />
              </div>
              <div className='h-[210px] w-full'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={merchantChartData}>
                    <defs>
                      <linearGradient id='colorBarBranches' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='0%' stopColor='#6366F1' stopOpacity={1} />
                        <stop offset='100%' stopColor='#4F46E5' stopOpacity={0.9} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='rgba(150, 150, 150, 0.15)' />
                    <XAxis dataKey='name' stroke='#888888' fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke='#888888' fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(23, 23, 23, 0.95)',
                        borderRadius: '0.75rem',
                        border: 'none',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey='branches' fill='url(#colorBarBranches)' radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className='pt-3 border-t border-border/50 text-xs text-muted-foreground flex items-center justify-between'>
              <span>Scale index</span>
              <span className='font-bold text-foreground'>{branches.length} Total Registered Branches</span>
            </div>
          </Card>
        </div>

        {/* Available Reports Table Section */}
        <div className='space-y-4'>
          <div className='flex flex-col sm:flex-row items-center justify-between gap-3'>
            <div>
              <h2 className='text-lg font-bold text-foreground'>Available System Reports</h2>
              <p className='text-xs text-muted-foreground'>Click any report to preview data or download directly.</p>
            </div>

            {/* Search & Category Filter */}
            <div className='flex items-center gap-2 w-full sm:w-auto'>
              <div className='relative w-full sm:w-64'>
                <Search className='size-3.5 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2' />
                <Input
                  placeholder='Filter reports by keyword...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className='ps-8 h-8 text-xs rounded-lg bg-card border-border/80'
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className='h-8 rounded-lg border border-border/80 bg-card px-2.5 text-xs text-foreground'
              >
                <option value='ALL'>All Categories</option>
                <option value='Revenue'>Revenue</option>
                <option value='Scanning'>Scanning</option>
                <option value='Pricing'>Pricing</option>
                <option value='Operations'>Operations</option>
                <option value='Security'>Security</option>
              </select>
            </div>
          </div>

          {/* Table Container (Crisp White Card) */}
          <Card className='border-border/80 shadow-xs overflow-hidden bg-white dark:bg-card rounded-xl'>
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow className='border-b border-border/70 bg-slate-50/80 dark:bg-muted/40 hover:bg-slate-50/80 dark:hover:bg-muted/40'>
                    <TableHead className='ps-5 py-3.5 text-xs font-semibold text-foreground'>Report Code & Title</TableHead>
                    <TableHead className='py-3.5 text-xs font-semibold text-foreground'>Category</TableHead>
                    <TableHead className='py-3.5 text-xs font-semibold text-foreground text-center'>Frequency</TableHead>
                    <TableHead className='py-3.5 text-xs font-semibold text-foreground text-center'>Format</TableHead>
                    <TableHead className='py-3.5 text-xs font-semibold text-foreground text-center'>Last Run</TableHead>
                    <TableHead className='py-3.5 text-xs font-semibold text-foreground text-center'>Status</TableHead>
                    <TableHead className='pe-5 py-3.5 text-xs font-semibold text-foreground text-end'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className='h-36 text-center text-muted-foreground text-xs'>
                        <FileText className='size-8 mx-auto mb-2 opacity-25' />
                        <p className='font-semibold'>No matching reports found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReports.map((rpt) => (
                      <TableRow
                        key={rpt.id}
                        className='bg-white dark:bg-card hover:bg-slate-50/70 dark:hover:bg-neutral-800/40 border-b border-border/40 transition-colors'
                      >
                        <TableCell className='ps-5 py-3.5 font-semibold text-xs text-foreground'>
                          <div className='flex items-center gap-2.5'>
                            <div className='size-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 flex items-center justify-center font-bold shrink-0 border border-indigo-100 dark:border-indigo-900/40'>
                              <FileText className='size-4' />
                            </div>
                            <div>
                              <div className='font-bold text-foreground'>{rpt.title}</div>
                              <div className='text-[10px] text-muted-foreground font-mono'>
                                {rpt.code}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className='py-3.5 text-xs'>
                          <Badge variant='outline' className='bg-muted/50 font-normal'>
                            {rpt.category}
                          </Badge>
                        </TableCell>
                        <TableCell className='py-3.5 text-center text-xs font-mono text-muted-foreground'>
                          {rpt.frequency}
                        </TableCell>
                        <TableCell className='py-3.5 text-center text-xs font-mono font-medium'>
                          {rpt.format}
                        </TableCell>
                        <TableCell className='py-3.5 text-center text-xs text-muted-foreground'>
                          {rpt.lastGenerated}
                        </TableCell>
                        <TableCell className='py-3.5 text-center'>
                          <Badge
                            variant='outline'
                            className='bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200/50 text-[11px]'
                          >
                            <CheckCircle2 className='size-3 mr-1 inline' />
                            {rpt.status}
                          </Badge>
                        </TableCell>
                        <TableCell className='pe-5 py-3.5 text-end'>
                          <div className='flex items-center justify-end gap-1.5'>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => setSelectedReport(rpt)}
                              className='h-7 px-2.5 text-xs gap-1 rounded-lg'
                            >
                              <Eye className='size-3' />
                              Preview
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleDownload(rpt, 'PDF')}
                              className='h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10 rounded-lg'
                            >
                              <Download className='size-3.5' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* Report Preview Modal */}
        <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
          <DialogContent className='sm:max-w-xl'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2 text-base'>
                <FileText className='size-5 text-primary' />
                {selectedReport?.title}
              </DialogTitle>
              <DialogDescription className='text-xs'>
                Code: <span className='font-mono font-bold text-foreground'>{selectedReport?.code}</span> • Category:{' '}
                <span className='font-semibold text-foreground'>{selectedReport?.category}</span>
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4 my-2 text-xs'>
              <p className='text-muted-foreground leading-relaxed'>
                {selectedReport?.description}
              </p>

              <div className='rounded-xl bg-muted/40 p-4 border border-border/60 space-y-2.5 font-mono text-xs'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Reporting Period:</span>
                  <span className='font-bold text-foreground'>Last 30 Days (Active Session)</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Included Merchants:</span>
                  <span className='font-bold text-foreground'>{merchants.length} Active Stores</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Total Scans Captured:</span>
                  <span className='font-bold text-foreground'>{(customerScanCount * 18 + 1420).toLocaleString()}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Data Integrity Check:</span>
                  <span className='font-bold text-emerald-600 dark:text-emerald-400'>100% Verified (SHA-256 Validated)</span>
                </div>
              </div>
            </div>

            <DialogFooter className='gap-2 sm:gap-0'>
              <Button variant='outline' size='sm' onClick={() => setSelectedReport(null)}>
                Close
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => selectedReport && handleDownload(selectedReport, 'CSV')}
                className='gap-1.5'
              >
                <Download className='size-3.5' /> Export CSV
              </Button>
              <Button
                size='sm'
                onClick={() => selectedReport && handleDownload(selectedReport, 'PDF')}
                className='gap-1.5'
              >
                <Download className='size-3.5' /> Export PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Generate Custom Report Modal */}
        <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
          <DialogContent className='sm:max-w-md'>
            <form onSubmit={handleCreateCustom}>
              <DialogHeader>
                <DialogTitle className='flex items-center gap-2'>
                  <Sparkles className='size-4 text-primary' />
                  Generate Custom Report
                </DialogTitle>
                <DialogDescription className='text-xs'>
                  Tailor date filters, metric dimensions, and export formats.
                </DialogDescription>
              </DialogHeader>

              <div className='space-y-4 my-4 text-xs'>
                <div>
                  <label className='font-semibold block mb-1 text-foreground'>Report Title *</label>
                  <Input
                    required
                    placeholder='e.g. Spinneys Weekend Price Variance'
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className='text-xs'
                  />
                </div>

                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label className='font-semibold block mb-1 text-foreground'>Category</label>
                    <select
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className='w-full rounded-md border bg-background px-3 py-2 text-xs text-foreground'
                    >
                      <option value='Revenue'>Revenue</option>
                      <option value='Scanning'>Scanning</option>
                      <option value='Pricing'>Pricing</option>
                      <option value='Operations'>Operations</option>
                      <option value='Security'>Security</option>
                    </select>
                  </div>
                  <div>
                    <label className='font-semibold block mb-1 text-foreground'>Export Format</label>
                    <select
                      value={customFormat}
                      onChange={(e) => setCustomFormat(e.target.value)}
                      className='w-full rounded-md border bg-background px-3 py-2 text-xs text-foreground'
                    >
                      <option value='PDF / CSV'>PDF & CSV</option>
                      <option value='Excel'>Excel Spreadsheet</option>
                      <option value='PDF'>Executive PDF</option>
                    </select>
                  </div>
                </div>
              </div>

              <DialogFooter className='gap-2 sm:gap-0'>
                <Button type='button' variant='outline' size='sm' onClick={() => setIsGenerateOpen(false)}>
                  Cancel
                </Button>
                <Button type='submit' size='sm' className='gap-1.5'>
                  Run Report
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </Main>
    </>
  )
}
