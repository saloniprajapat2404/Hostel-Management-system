import { ClipboardList } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import ChartCard from './ChartCard'
import { ChartMiniStats } from './ChartMiniStats'
import { CHART_COLORS, CHART_HEIGHT, useChartTheme } from './chartTheme'

function TrendTooltip({ active, payload, label }) {
  const theme = useChartTheme()
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-[10px] border px-2.5 py-1.5 text-[11px] shadow-lg"
      style={{ background: theme.tooltipBg, borderColor: theme.tooltipBorder, color: theme.textStrong }}
    >
      <p className="font-semibold">{label}</p>
      <p className="text-[var(--dash-muted)]">{payload[0].value} request{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  )
}

export default function AdmissionsChart({ trend = [], pendingAdmissions = 0, loading = false }) {
  const theme = useChartTheme()
  const hasTrend = Array.isArray(trend) && trend.length > 0
  const trendTotal = hasTrend ? trend.reduce((sum, t) => sum + Number(t.count || 0), 0) : pendingAdmissions

  if (!hasTrend) {
    const data = [{ label: 'Pending', count: pendingAdmissions }]
    return (
      <ChartCard
        title="Admissions"
        subtitle="Pending requests"
        accent={CHART_COLORS.warning}
        icon={ClipboardList}
        badge={{ label: 'Pending', value: pendingAdmissions }}
        loading={loading}
        empty={!loading && pendingAdmissions === 0}
        emptyMessage="No pending admissions."
      >
        <div className="w-full" style={{ height: CHART_HEIGHT }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: theme.text, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: theme.text, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={24}
              />
              <Tooltip content={<TrendTooltip />} cursor={{ fill: theme.grid }} />
              <Bar dataKey="count" fill={CHART_COLORS.warning} radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    )
  }

  const latest = trend[trend.length - 1]

  return (
    <ChartCard
      title="Admissions trend"
      subtitle="Monthly requests"
      accent={CHART_COLORS.primary}
      icon={ClipboardList}
      badge={{ label: latest?.month || 'Latest', value: latest?.count ?? 0 }}
      loading={loading}
      empty={false}
    >
      <div className="w-full" style={{ height: CHART_HEIGHT }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="admissionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.35} />
                <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: theme.text, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: theme.text, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={24}
            />
            <Tooltip content={<TrendTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke={CHART_COLORS.primary}
              strokeWidth={2}
              fill="url(#admissionGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <ChartMiniStats items={[{ label: 'Total', value: trendTotal, color: CHART_COLORS.primary }]} />
    </ChartCard>
  )
}
