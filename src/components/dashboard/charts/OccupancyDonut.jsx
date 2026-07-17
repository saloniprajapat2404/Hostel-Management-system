import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import ChartCard from './ChartCard'
import { CHART_COLORS, CHART_HEIGHT, useChartTheme } from './chartTheme'

function DonutTooltip({ active, payload }) {
  const theme = useChartTheme()
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div
      className="rounded-[10px] border px-2.5 py-1.5 text-[11px] shadow-sm"
      style={{ background: theme.tooltipBg, borderColor: theme.tooltipBorder, color: theme.textStrong }}
    >
      <p className="font-medium">{item.name}</p>
    </div>
  )
}

export default function OccupancyDonut({ occupied = 0, vacant = 0, loading = false }) {
  const theme = useChartTheme()
  const total = occupied + vacant
  const data = [
    { name: 'Occupied', value: occupied, color: CHART_COLORS.teal },
    { name: 'Vacant', value: vacant, color: CHART_COLORS.success },
  ].filter((d) => d.value > 0)

  return (
    <ChartCard
      title="Bed occupancy"
      loading={loading}
      empty={!loading && total === 0}
      emptyMessage="No bed data."
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
            <Tooltip content={<DonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
