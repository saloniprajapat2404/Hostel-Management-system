import AnimatedNumber from '../AnimatedNumber'

const TONE = {
  blue: { icon: 'text-[#3B82F6] bg-[#3B82F6]/10' },
  emerald: { icon: 'text-[#10B981] bg-[#10B981]/10' },
  amber: { icon: 'text-[#F59E0B] bg-[#F59E0B]/10' },
  red: { icon: 'text-[#EF4444] bg-[#EF4444]/10' },
  slate: { icon: 'text-[var(--dash-muted)] bg-[var(--dash-hover)]' },
  default: { icon: 'text-[#3B82F6] bg-[#3B82F6]/10' },
}

function KpiCard({ label, value, tone = 'default', icon: Icon }) {
  const styles = TONE[tone] || TONE.default
  const numeric = typeof value === 'number'

  return (
    <div className="dashboard-surface-card p-3 transition-colors hover:bg-[var(--dash-hover)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-[var(--dash-muted)]">{label}</p>
          <p className="dashboard-metric mt-1.5 tabular-nums text-[var(--dash-text)]">
            {numeric ? <AnimatedNumber value={value} /> : value}
          </p>
        </div>
        {Icon && (
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] ${styles.icon}`}>
            <Icon className="h-4 w-4" strokeWidth={2} />
          </span>
        )}
      </div>
    </div>
  )
}

export default function CompactKpiGrid({ pills }) {
  if (!pills?.length) return null

  return (
    <section>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
        {pills.slice(0, 4).map((pill) => (
          <KpiCard key={pill.label} {...pill} />
        ))}
      </div>
    </section>
  )
}
