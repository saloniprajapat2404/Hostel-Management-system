import { Link } from 'react-router-dom'
import {
  BedDouble,
  Bell,
  Building2,
  IndianRupee,
  MessageSquarePlus,
  UserPlus,
} from 'lucide-react'

const ACTIONS = {
  rooms: {
    label: 'Rooms',
    to: '/app/occupancy',
    icon: Building2,
    roles: ['ADMIN', 'SUPER_ADMIN', 'WARDEN'],
  },
  addStudent: { label: 'Add Student', to: '/app/users?role=STUDENT', icon: UserPlus, roles: ['ADMIN', 'SUPER_ADMIN'] },
  allocateRoom: { label: 'Allocate Room', to: '/app/allocations', icon: BedDouble, roles: ['ADMIN', 'SUPER_ADMIN'] },
  collectFee: { label: 'Collect Fee', to: '/app/fees', icon: IndianRupee, roles: ['ADMIN', 'SUPER_ADMIN'] },
  myFees: { label: 'My Fees', to: '/app/my-fees', icon: IndianRupee, roles: ['STUDENT'] },
  addNotice: { label: 'Add Notice', to: '/app/notices', icon: Bell, roles: ['ADMIN', 'SUPER_ADMIN', 'WARDEN'] },
  registerComplaint: {
    label: 'Register Complaint',
    to: '/app/complaints',
    icon: MessageSquarePlus,
    roles: ['ADMIN', 'SUPER_ADMIN', 'WARDEN', 'STUDENT'],
  },
}

const linkClass =
  'flex h-9 w-9 items-center justify-center rounded-[10px] border text-[var(--dash-muted)] transition-colors hover:border-[var(--dash-border)] hover:bg-[var(--dash-hover)] hover:text-[var(--dash-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/40'

export default function QuickActionsBar({ role }) {
  const items = Object.values(ACTIONS).filter((a) => a.roles.includes(role))

  if (!items.length) return null

  return (
    <section>
      <h3 className="dashboard-section-label">Quick actions</h3>
      <div className="flex flex-wrap items-center gap-2">
        {items.map(({ label, to, icon: Icon }) => (
          <Link
            key={to + label}
            to={to}
            title={label}
            aria-label={label}
            className={linkClass}
            style={{ borderColor: 'var(--dash-border-subtle)', background: 'var(--dash-surface)' }}
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
          </Link>
        ))}
      </div>
    </section>
  )
}
