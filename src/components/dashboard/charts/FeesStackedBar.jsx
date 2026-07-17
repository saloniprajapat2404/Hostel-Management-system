import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartCard from './ChartCard'
import { CHART_COLORS, CHART_HEIGHT, formatCompactCurrency, formatCurrency, useChartTheme } from './chartTheme'

function FeesTooltip({ active, payload }) {
  const theme = useChartTheme()
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  return (
    <div
      className="rounded-[10px] border px-2.5 py-1.5 text-[11px] shadow-sm"
      style={{ background: theme.tooltipBg, borderColor: theme.tooltipBorder, color: theme.textStrong }}
    >
      <p className="font-medium">{row?.name}</p>
      <p className="text-[var(--dash-muted)]">{formatCurrency(row?.amount)}</p>
    </div>
  )
}

export default function FeesStackedBar({ overview, loading = false }) {
  const theme = useChartTheme()
  const expected = Number(overview?.totalExpected || 0)
  const collected = Number(overview?.totalCollected || 0)
  const outstanding = Number(overview?.totalOutstanding || 0)
  const isEmpty = expected === 0 && collected === 0

  const data = [
    { name: 'Expected', amount: expected, fill: CHART_COLORS.primary },
    { name: 'Collected', amount: collected, fill: CHART_COLORS.success },
    { name: 'Due', amount: outstanding, fill: CHART_COLORS.warning },
  ]

  return (
    <ChartCard
      title="Fee collection"
      loading={loading}
      empty={!loading && isEmpty}
      emptyMessage="No fee records."
    >
      <div className="w-full" style={{ height: CHART_HEIGHT }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: theme.text, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatCompactCurrency(v)}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={52}
              tick={{ fill: theme.text, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<FeesTooltip />} cursor={{ fill: theme.grid }} />
            <Bar dataKey="amount" radius={[0, 4, 4, 0]} maxBarSize={12}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
