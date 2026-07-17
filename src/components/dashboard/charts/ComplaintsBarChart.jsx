import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartCard from './ChartCard'
import { CHART_COLORS, CHART_HEIGHT, useChartTheme } from './chartTheme'

function BarTooltip({ active, payload, label }) {
  const theme = useChartTheme()
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-[10px] border px-2.5 py-1.5 text-[11px] shadow-sm"
      style={{ background: theme.tooltipBg, borderColor: theme.tooltipBorder, color: theme.textStrong }}
    >
      <p className="font-medium">{label}</p>
    </div>
  )
}

export default function ComplaintsBarChart({
  open = 0,
  inProgress = 0,
  resolved = 0,
  loading = false,
  title = 'Complaint status',
}) {
  const theme = useChartTheme()
  const data = [
    { status: 'Open', count: open, fill: CHART_COLORS.danger },
    { status: 'Active', count: inProgress, fill: CHART_COLORS.warning },
    { status: 'Done', count: resolved, fill: CHART_COLORS.success },
  ]
  const total = open + inProgress + resolved

  return (
    <ChartCard
      title={title}
      loading={loading}
      empty={!loading && total === 0}
      emptyMessage="No complaints yet."
    >
      <div className="w-full" style={{ height: CHART_HEIGHT }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
            <XAxis
              dataKey="status"
              tick={{ fill: theme.text, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: theme.text, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={22}
            />
            <Tooltip content={<BarTooltip />} cursor={{ fill: theme.grid }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={32}>
              {data.map((entry) => (
                <Cell key={entry.status} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
