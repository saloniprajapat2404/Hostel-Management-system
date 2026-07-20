import { memo, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BedDouble,
  Bell,
  Building2,
  IndianRupee,
  MessageSquarePlus,
  Receipt,
  UserPlus,
  Users,
} from 'lucide-react'

const ACTIONS = {
  rooms: {
    label: 'Rooms',
    hint: 'View occupancy and room status',
    to: '/app/occupancy',
    icon: Building2,
    roles: ['ADMIN', 'SUPER_ADMIN', 'WARDEN'],
  },
  residents: {
    label: 'Residents',
    hint: 'Browse hostel residents',
    to: '/app/residents',
    icon: Users,
    roles: ['ADMIN', 'SUPER_ADMIN', 'WARDEN'],
  },
  allocateRoom: {
    label: 'Allocate Room',
    hint: 'Assign beds to students',
    to: '/app/allocations',
    icon: BedDouble,
    roles: ['ADMIN', 'SUPER_ADMIN'],
  },
  collectFee: {
    label: 'Collect Fee',
    hint: 'Manage student fees and payments',
    to: '/app/fees',
    icon: IndianRupee,
    roles: ['ADMIN', 'SUPER_ADMIN'],
  },
  myFees: {
    label: 'My Fees',
    hint: 'View your fee balance and payments',
    to: '/app/my-fees',
    icon: IndianRupee,
    roles: ['STUDENT'],
  },
  addNotice: {
    label: 'Add Notice',
    hint: 'Publish hostel notices and alerts',
    to: '/app/notices',
    icon: Bell,
    roles: ['ADMIN', 'SUPER_ADMIN', 'WARDEN'],
  },
  registerComplaint: {
    label: 'Register Complaint',
    hint: 'Log a new complaint',
    to: '/app/complaints',
    icon: MessageSquarePlus,
    roles: ['ADMIN', 'SUPER_ADMIN', 'WARDEN', 'STUDENT'],
  },
  expenses: {
    label: 'Expenses',
    hint: 'Record and view hostel operating expenses',
    to: '/app/expenses',
    icon: Receipt,
    roles: ['ADMIN', 'SUPER_ADMIN'],
  },
  addUser: {
    label: 'Add User',
    hint: 'Register admin, warden, or student accounts',
    to: '/app/add-user',
    icon: UserPlus,
    roles: ['ADMIN', 'SUPER_ADMIN'],
  },
}

/** Display order for quick access links (Expenses after Register Complaint). */
const ACTION_ORDER = [
  'rooms',
  'residents',
  'allocateRoom',
  'collectFee',
  'myFees',
  'addNotice',
  'registerComplaint',
  'expenses',
  'addUser',
]

const iconClass =
  'h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:text-[#3B82F6] motion-reduce:transform-none'

function QuickActionsBar({ role }) {
  const items = useMemo(
    () =>
      ACTION_ORDER.map((key) => ACTIONS[key])
        .filter(Boolean)
        .filter((action) => action.roles.includes(role)),
    [role],
  )

  if (!items.length) return null

  return (
    <section aria-label="Quick access">
      <h3 className="dashboard-section-label">Quick access</h3>
      <div className="flex flex-wrap items-center gap-2">
        {items.map(({ label, hint, to, icon: Icon }) => (
          <Link
            key={to + label}
            to={to}
            title={hint || label}
            className="dashboard-quick-action group"
          >
            <Icon className={iconClass} strokeWidth={2} />
            <span className="whitespace-nowrap">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default memo(QuickActionsBar)
