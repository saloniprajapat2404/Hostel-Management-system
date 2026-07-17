import { UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardSearch from './DashboardSearch'
import NotificationBell from '../../notifications/NotificationBell'
export default function DashboardStickyHeader({ role }) {
  return (
    <header
      className="sticky top-0 z-30 -mx-4 mb-3 border-b px-4 py-2 backdrop-blur-md md:-mx-6 md:px-6"
      style={{
        borderColor: 'var(--dash-border-subtle)',
        background: 'color-mix(in srgb, var(--dash-bg) 92%, transparent)',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <h1 className="shrink-0 text-[15px] font-semibold text-[var(--dash-text)]">Dashboard</h1>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <DashboardSearch role={role} />

          <NotificationBell variant="dashboard" />
          <Link to="/app/profile" className="dashboard-icon-btn shrink-0" aria-label="Profile">
            <UserRound className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  )
}
