import { Building2 } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartCard from './ChartCard'
import { ChartMiniStats } from './ChartMiniStats'
import { CHART_COLORS, CHART_HEIGHT, useChartTheme } from './chartTheme'

function FloorTooltip({ active, payload, label }) {
  const theme = useChartTheme()
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-[10px] border px-2.5 py-1.5 text-[11px] shadow-lg"
      style={{ background: theme.tooltipBg, borderColor: theme.tooltipBorder, color: theme.textStrong }}
    >
      <p className="mb-0.5 font-semibold">{label?.replace(/^F/, 'Floor ')}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-[var(--dash-muted)]">
          {entry.name}: {entry.value} beds
        </p>
      ))}
    </div>
  )
}

export default function FloorOccupancyChart({ floorData = [], loading = false }) {
  const theme = useChartTheme()
  const data = floorData.map((f) => ({
    floor: `F${f.floor}`,
    Occupied: f.occupied ?? 0,
    Vacant: f.vacant ?? 0,
  }))
  const hasData = data.some((d) => d.Occupied + d.Vacant > 0)
  const totalOccupied = data.reduce((sum, d) => sum + d.Occupied, 0)
  const totalVacant = data.reduce((sum, d) => sum + d.Vacant, 0)

  return (
    <ChartCard
      title="Floor occupancy"
      subtitle="Beds by floor"
      accent={CHART_COLORS.teal}
      icon={Building2}
      badge={{ label: 'Floors', value: data.length }}
      loading={loading}
      empty={!loading && !hasData}
      emptyMessage="No floor data."
    >
      <div className="w-full" style={{ height: CHART_HEIGHT }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
            <XAxis
              dataKey="floor"
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
            <Tooltip content={<FloorTooltip />} cursor={{ fill: theme.grid }} />
            <Bar dataKey="Occupied" stackId="floor" fill={CHART_COLORS.teal} />
            <Bar dataKey="Vacant" stackId="floor" fill={CHART_COLORS.success} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ChartMiniStats
        items={[
          { label: 'Occupied', value: totalOccupied, color: CHART_COLORS.teal },
          { label: 'Vacant', value: totalVacant, color: CHART_COLORS.success },
        ]}
      />
    </ChartCard>
  )
}
