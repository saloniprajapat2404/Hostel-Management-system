import { useHostelConfig } from '../../../context/HostelConfigContext'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function todayLabel() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function DashboardHero({ user }) {
  const { hostelName } = useHostelConfig()
  const name = user?.fullName || user?.email || 'there'

  return (
    <section className="mb-0 max-h-[88px]">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <p className="text-[11px] font-medium leading-none text-[var(--dash-muted)]">{greeting()}</p>
          <h2 className="mt-1.5 truncate text-[18px] font-semibold leading-tight tracking-tight text-[var(--dash-text)] sm:text-[20px]">
            Welcome back, {name}
          </h2>
          <p className="mt-1 truncate text-[12px] text-[var(--dash-muted)]">{hostelName}</p>
        </div>
        <p className="shrink-0 text-[11px] leading-none text-[var(--dash-muted)] sm:text-[12px]">
          {todayLabel()}
        </p>
      </div>
    </section>
  )
}
