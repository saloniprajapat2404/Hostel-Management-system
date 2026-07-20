import { Link } from 'react-router-dom'
import {
  BedDouble,
  Bell,
  Building2,
  IndianRupee,
  MessageSquarePlus,
  UserPlus,
  Users,
} from 'lucide-react'

const ACTIONS = {
  rooms: {
    label: 'Rooms',
    to: '/app/occupancy',
    icon: Building2,
    roles: ['ADMIN', 'SUPER_ADMIN', 'WARDEN'],
  },
  residents: {
    label: 'Residents',
    to: '/app/residents',
    icon: Users,
    roles: ['ADMIN', 'SUPER_ADMIN', 'WARDEN'],
  },
  addStudent: { label: 'Add User', to: '/app/add-user', icon: UserPlus, roles: ['ADMIN', 'SUPER_ADMIN'] },
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

export default function QuickActionsBar({ role }) {
  const items = Object.values(ACTIONS).filter((a) => a.roles.includes(role))

  if (!items.length) return null

  return (
    <section>
      <h3 className="dashboard-section-label">Quick access</h3>
      <div className="flex flex-wrap items-center gap-2">
        {items.map(({ label, to, icon: Icon }) => (
          <Link
            key={to + label}
            to={to}
            aria-label={label}
            className="group flex h-10 items-center gap-2 overflow-hidden rounded-[10px] border px-2.5 text-[var(--dash-muted)] transition-all duration-200 hover:border-[#3B82F6]/40 hover:bg-[var(--dash-hover)] hover:text-[var(--dash-text)] hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/40"
            style={{ borderColor: 'var(--dash-border-subtle)', background: 'var(--dash-surface)' }}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
            <span className="max-w-0 overflow-hidden whitespace-nowrap text-[12px] font-medium opacity-0 transition-all duration-200 group-hover:max-w-[140px] group-hover:opacity-100">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
