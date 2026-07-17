import { Receipt } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartCard from './ChartCard'
import { CHART_COLORS, CHART_HEIGHT, formatCompactCurrency, useChartTheme } from './chartTheme'

function BreakdownTooltip({ active, payload }) {
  const theme = useChartTheme()
  if (!active || !payload?.length) return null
  const label = payload[0]?.payload?.fullType || payload[0]?.payload?.type
  return (
    <div
      className="rounded-[10px] border px-2.5 py-1.5 text-[11px] shadow-lg"
      style={{ background: theme.tooltipBg, borderColor: theme.tooltipBorder, color: theme.textStrong }}
    >
      <p className="mb-0.5 font-semibold">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-[var(--dash-muted)]">
          {entry.name}: {formatCompactCurrency(entry.value)}
        </p>
      ))}
    </div>
  )
}

export default function StudentFeeBreakdownBar({ fees = [], loading = false }) {
  const theme = useChartTheme()
  const data = fees.map((fee) => ({
    type: fee.feeType?.length > 10 ? `${fee.feeType.slice(0, 8)}…` : fee.feeType,
    fullType: fee.feeType,
    Paid: Number(fee.paidAmount || 0),
    Due: Number(fee.balanceAmount || 0),
  }))
  const hasData = data.some((d) => d.Paid + d.Due > 0)
  const totalDue = data.reduce((sum, d) => sum + d.Due, 0)

  return (
    <ChartCard
      title="Fee breakdown"
      subtitle="By fee type"
      accent={CHART_COLORS.warning}
      icon={Receipt}
      badge={{ label: 'Due', value: formatCompactCurrency(totalDue) }}
      loading={loading}
      empty={!loading && !hasData}
      emptyMessage="No breakdown data."
    >
      <div className="w-full" style={{ height: CHART_HEIGHT + 12 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
            <XAxis
              dataKey="type"
              tick={{ fill: theme.text, fontSize: 9 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: theme.text, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={32}
              tickFormatter={(v) => formatCompactCurrency(v)}
            />
            <Tooltip content={<BreakdownTooltip />} cursor={{ fill: theme.grid }} />
            <Bar dataKey="Paid" stackId="fee" fill={CHART_COLORS.success} />
            <Bar dataKey="Due" stackId="fee" fill={CHART_COLORS.warning} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex justify-center gap-3 text-[10px] font-medium text-[var(--dash-muted)]">
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" /> Paid
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" /> Due
        </span>
      </div>
    </ChartCard>
  )
}
