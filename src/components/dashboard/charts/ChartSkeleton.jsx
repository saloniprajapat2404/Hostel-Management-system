export default function ChartSkeleton({ compact = false }) {
  const size = compact ? 'h-[88px] w-[88px]' : 'h-[120px] w-[120px]'
  return (
    <div className="space-y-3 py-1" aria-hidden="true">
      <div
        className={`mx-auto ${size} animate-pulse rounded-full`}
        style={{ background: 'var(--dash-hover)' }}
      />
      <div className="flex justify-center gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-2.5 w-12 animate-pulse rounded-full"
            style={{ background: 'var(--dash-hover)' }}
          />
        ))}
      </div>
    </div>
  )
}
