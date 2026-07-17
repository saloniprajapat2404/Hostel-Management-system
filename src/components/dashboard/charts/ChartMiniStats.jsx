export function ChartMiniStats({ items = [] }) {
  if (!items.length) return null
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item.label}
          className="inline-flex items-center gap-1.5 rounded-[8px] border px-2 py-1 text-[10px] font-medium"
          style={{ borderColor: 'var(--dash-border-subtle)', background: 'var(--dash-hover)' }}
        >
          {item.color && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: item.color }} aria-hidden="true" />
          )}
          <span className="text-[var(--dash-muted)]">{item.label}</span>
          <span className="font-bold tabular-nums text-[var(--dash-text)]">{item.value}</span>
        </span>
      ))}
    </div>
  )
}

export function ChartStatPills({ items = [] }) {
  if (!items.length) return null
  return (
    <div className="mb-2 grid grid-cols-3 gap-1.5">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[10px] border px-2 py-1.5 text-center"
          style={{
            borderColor: `${item.color}30`,
            background: `${item.color}10`,
          }}
        >
          <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: item.color }}>
            {item.label}
          </p>
          <p className="mt-0.5 truncate text-[11px] font-bold tabular-nums text-[var(--dash-text)]">{item.value}</p>
        </div>
      ))}
    </div>
  )
}
