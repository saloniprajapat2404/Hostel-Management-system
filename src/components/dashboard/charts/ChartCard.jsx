import ChartEmpty from './ChartEmpty'
import ChartSkeleton from './ChartSkeleton'

export default function ChartCard({
  title,
  loading = false,
  empty = false,
  emptyMessage = 'No data available.',
  children,
  className = '',
}) {
  return (
    <div className={`dashboard-surface-card flex min-h-[168px] flex-col ${className}`}>
      <div
        className="shrink-0 border-b px-3 py-2.5"
        style={{ borderColor: 'var(--dash-border-subtle)' }}
      >
        <h3 className="text-[13px] font-semibold text-[var(--dash-text)]">{title}</h3>
      </div>
      <div className="flex flex-1 items-center px-2 py-2">
        {loading ? (
          <ChartSkeleton compact />
        ) : empty ? (
          <ChartEmpty compact message={emptyMessage} />
        ) : (
          <div className="w-full">{children}</div>
        )}
      </div>
    </div>
  )
}
