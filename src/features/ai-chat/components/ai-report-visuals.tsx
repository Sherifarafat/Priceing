import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { Download, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import type { AiChartSpecDto, AiKpiCardDto } from '@/lib/api-client'

const CHART_COLORS = ['#00d632', '#101410', '#4F46E5', '#F59E0B', '#06B6D4', '#EC4899']

function exportChartToCsv(chart: AiChartSpecDto) {
  const header = ['Label', 'Value', ...(chart.data.some((d) => d.secondary !== undefined) ? ['Count'] : [])]
  const rows = chart.data.map((d) => [
    `"${String(d.name).replace(/"/g, '""')}"`,
    String(d.value),
    ...(d.secondary !== undefined ? [String(d.secondary)] : []),
  ])
  const csv = '\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${chart.id || 'report'}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('تم تصدير بيانات التقرير CSV ✓')
}

export function AiReportVisuals({
  kpis,
  charts,
}: {
  kpis?: AiKpiCardDto[]
  charts?: AiChartSpecDto[]
}) {
  const hasKpis = Array.isArray(kpis) && kpis.length > 0
  const hasCharts = Array.isArray(charts) && charts.length > 0
  if (!hasKpis && !hasCharts) return null

  return (
    <div className='mt-3.5 space-y-3'>
      {/* Live KPI Cards */}
      {hasKpis && (
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-2.5'>
          {kpis.map((kpi, idx) => (
            <div
              key={`${kpi.label}-${idx}`}
              className='rounded-xl border border-border/80 dark:border-neutral-800 bg-white dark:bg-[#1E1F20] p-3 shadow-2xs'
            >
              <p className='text-[11px] font-medium text-neutral-500 dark:text-neutral-400 truncate'>
                {kpi.label}
              </p>
              <p
                dir='ltr'
                className='text-sm sm:text-base font-black text-neutral-900 dark:text-white mt-1 font-mono truncate text-start'
              >
                {kpi.value}
              </p>
              {kpi.hint && (
                <p className='text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 truncate'>
                  {kpi.hint}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Interactive Live Charts */}
      {hasCharts && (
        <div className={`grid grid-cols-1 ${charts.length > 1 ? 'md:grid-cols-2' : ''} gap-3`}>
          {charts.map((chart) => (
            <div
              key={chart.id}
              className='rounded-2xl border border-border/80 dark:border-neutral-800 bg-white dark:bg-[#1E1F20] p-3.5 shadow-2xs'
            >
              <div className='flex items-center justify-between gap-2 mb-3'>
                <div className='flex items-center gap-1.5 min-w-0'>
                  <BarChart3 className='size-4 text-[#00d632] shrink-0' />
                  <h4 className='text-xs font-bold text-neutral-900 dark:text-white truncate'>
                    {chart.title}
                  </h4>
                </div>
                <button
                  type='button'
                  onClick={() => exportChartToCsv(chart)}
                  className='inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition-colors cursor-pointer shrink-0'
                  title='تصدير CSV'
                >
                  <Download className='size-3' />
                  <span>CSV</span>
                </button>
              </div>

              <div className='h-52 w-full' dir='ltr'>
                <ResponsiveContainer width='100%' height='100%'>
                  {chart.type === 'area' ? (
                    <AreaChart data={chart.data} margin={{ top: 6, right: 8, left: -12, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`grad-${chart.id}`} x1='0' y1='0' x2='0' y2='1'>
                          <stop offset='5%' stopColor='#00d632' stopOpacity={0.35} />
                          <stop offset='95%' stopColor='#00d632' stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray='3 3' opacity={0.18} />
                      <XAxis dataKey='name' tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(val: any) => [`${Number(val).toFixed(2)}${chart.valueSuffix || ''}`, chart.title]}
                        contentStyle={{
                          borderRadius: '10px',
                          fontSize: '11px',
                          border: '1px solid rgba(128,128,128,0.2)',
                        }}
                      />
                      <Area
                        type='monotone'
                        dataKey='value'
                        stroke='#00d632'
                        strokeWidth={2.2}
                        fill={`url(#grad-${chart.id})`}
                      />
                    </AreaChart>
                  ) : chart.type === 'pie' ? (
                    <PieChart>
                      <Pie
                        data={chart.data}
                        dataKey='value'
                        nameKey='name'
                        cx='50%'
                        cy='50%'
                        innerRadius={42}
                        outerRadius={72}
                        paddingAngle={3}
                        label={({ name, percent }) => `${name} (${Math.round((percent || 0) * 100)}%)`}
                      >
                        {chart.data.map((_, index) => (
                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [`${Number(val).toFixed(2)}${chart.valueSuffix || ''}`, '']}
                        contentStyle={{
                          borderRadius: '10px',
                          fontSize: '11px',
                          border: '1px solid rgba(128,128,128,0.2)',
                        }}
                      />
                    </PieChart>
                  ) : (
                    <BarChart data={chart.data} margin={{ top: 6, right: 8, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray='3 3' opacity={0.18} />
                      <XAxis dataKey='name' tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(val: any) => [`${Number(val).toLocaleString()}${chart.valueSuffix || ''}`, chart.title]}
                        contentStyle={{
                          borderRadius: '10px',
                          fontSize: '11px',
                          border: '1px solid rgba(128,128,128,0.2)',
                        }}
                      />
                      <Bar dataKey='value' fill='#00d632' radius={[6, 6, 0, 0]} maxBarSize={38} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
