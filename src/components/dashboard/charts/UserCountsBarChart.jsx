import { Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartCard from './ChartCard'
import { ChartMiniStats } from './ChartMiniStats'
import { CHART_COLORS, CHART_HEIGHT, useChartTheme } from './chartTheme'

function HBarTooltip({ active, payload, label }) {
  const theme = useChartTheme()
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-[10px] border px-2.5 py-1.5 text-[11px] shadow-lg"
      style={{ background: theme.tooltipBg, borderColor: theme.tooltipBorder, color: theme.textStrong }}
    >
      <p className="font-semibold">{label}</p>
      <p className="text-[var(--dash-muted)]">{payload[0].value} users</p>
    </div>
  )
}

export default function UserCountsBarChart({ students = 0, wardens = 0, admins = 0, loading = false }) {
  const theme = useChartTheme()
  const data = [
    { role: 'Students', count: students, fill: CHART_COLORS.primary },
    { role: 'Wardens', count: wardens, fill: CHART_COLORS.teal },
    { role: 'Admins', count: admins, fill: CHART_COLORS.violet },
  ]
  const total = students + wardens + admins

  return (
    <ChartCard
      title="User distribution"
      subtitle="By role"
      accent={CHART_COLORS.primary}
      icon={Users}
      badge={{ label: 'Total', value: total }}
      loading={loading}
      empty={!loading && total === 0}
      emptyMessage="No user data."
    >
      <div className="w-full" style={{ height: CHART_HEIGHT }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={data} margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} horizontal={false} />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fill: theme.text, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="role"
              width={58}
              tick={{ fill: theme.text, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<HBarTooltip />} cursor={{ fill: theme.grid }} />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={18}>
              {data.map((entry) => (
                <Cell key={entry.role} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ChartMiniStats
        items={data.map((d) => ({ label: d.role, value: d.count, color: d.fill }))}
      />
    </ChartCard>
  )
}
