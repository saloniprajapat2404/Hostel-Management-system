import { BarChart3 } from 'lucide-react'

export default function ChartEmpty({ message = 'No data available.', compact = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-[12px] border border-dashed px-3 text-center ${
        compact ? 'min-h-[88px] py-4' : 'min-h-[120px] py-6'
      }`}
      style={{ borderColor: 'var(--dash-border)' }}
    >
      <BarChart3
        className={`mb-2 text-[var(--dash-muted)] ${compact ? 'h-6 w-6' : 'h-8 w-8'}`}
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <p className="text-[11px] text-[var(--dash-muted)]">{message}</p>
    </div>
  )
}
