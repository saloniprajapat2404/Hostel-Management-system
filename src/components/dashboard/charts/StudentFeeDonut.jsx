import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import ChartCard from './ChartCard'
import { CHART_COLORS, CHART_HEIGHT, useChartTheme } from './chartTheme'

function FeeDonutTooltip({ active, payload }) {
  const theme = useChartTheme()
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-[10px] border px-2.5 py-1.5 text-[11px] shadow-sm"
      style={{ background: theme.tooltipBg, borderColor: theme.tooltipBorder, color: theme.textStrong }}
    >
      <p className="font-medium">{payload[0].name}</p>
    </div>
  )
}

export default function StudentFeeDonut({ paid = 0, balance = 0, loading = false }) {
  const theme = useChartTheme()
  const total = paid + balance
  const data = [
    { name: 'Paid', value: paid, color: CHART_COLORS.success },
    { name: 'Due', value: balance, color: CHART_COLORS.warning },
  ].filter((d) => d.value > 0)

  return (
    <ChartCard
      title="My fees"
      loading={loading}
      empty={!loading && total === 0}
      emptyMessage="No fee records."
    >
      <div className="mx-auto w-full max-w-[180px]" style={{ height: CHART_HEIGHT }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.length ? data : [{ name: 'Empty', value: 1, color: theme.grid }]}
              cx="50%"
              cy="50%"
              innerRadius={32}
              outerRadius={44}
              paddingAngle={data.length > 1 ? 3 : 0}
              dataKey="value"
              stroke="none"
            >
              {(data.length ? data : [{ color: theme.grid }]).map((entry, index) => (
                <Cell key={entry.name || index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<FeeDonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
