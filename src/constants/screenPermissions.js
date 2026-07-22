import {
  LayoutDashboard,
  GraduationCap,
  Building2,
  DoorOpen,
  Bell,
  MessageSquareWarning,
  ClipboardCheck,
  IndianRupee,
  BarChart3,
  Settings,
  KeyRound,
} from 'lucide-react'

/** Module keys stored on the user record. */
export const SCREEN_MODULE_KEYS = [
  'DASHBOARD',
  'STUDENTS',
  'HOSTEL',
  'ROOMS',
  'NOTICES',
  'COMPLAINTS',
  'ATTENDANCE',
  'FEES',
  'REPORTS',
  'SETTINGS',
]

export const SCREEN_MODULES = [
  {
    key: 'DASHBOARD',
    label: 'Dashboard',
    description: 'Overview, KPIs, and quick actions for daily operations.',
    icon: LayoutDashboard,
  },
  {
    key: 'STUDENTS',
    label: 'Students',
    description: 'Student lists, profiles, residents, and user management.',
    icon: GraduationCap,
  },
  {
    key: 'HOSTEL',
    label: 'Hostel',
    description: 'Admissions, allocations, and hostel occupancy workflows.',
    icon: Building2,
  },
  {
    key: 'ROOMS',
    label: 'Rooms',
    description: 'Room inventory, beds, and maintenance status.',
    icon: DoorOpen,
  },
  {
    key: 'NOTICES',
    label: 'Notice',
    description: 'Hostel notices, announcements, and alerts.',
    icon: Bell,
  },
  {
    key: 'COMPLAINTS',
    label: 'Complaints',
    description: 'Complaint tickets and resolution workflows.',
    icon: MessageSquareWarning,
  },
  {
    key: 'ATTENDANCE',
    label: 'Attendance',
    description: 'Check-in/out records and attendance monitoring.',
    icon: ClipboardCheck,
  },
  {
    key: 'FEES',
    label: 'Fees',
    description: 'Fee collection, balances, and payment history.',
    icon: IndianRupee,
  },
  {
    key: 'REPORTS',
    label: 'Reports',
    description: 'Occupancy, activity logs, and operational reports.',
    icon: BarChart3,
  },
  {
    key: 'SETTINGS',
    label: 'Settings',
    description: 'Profile, preferences, and personal account settings.',
    icon: Settings,
  },
]

export const ACCESS_GRANT_MODULE = {
  key: 'ACCESS_GRANT',
  label: 'Access Grant',
  description: 'Enable to let this user grant screen access; disable to restrict that ability.',
  icon: KeyRound,
}

/** Default: all modules enabled when creating a user. */
export function createDefaultScreenPermissions() {
  return Object.fromEntries(SCREEN_MODULE_KEYS.map((key) => [key, true]))
}

/** Merge stored user permissions with defaults for edit forms. */
export function permissionsFromUser(user) {
  const defaults = createDefaultScreenPermissions()
  if (!user?.screenPermissions || !Object.keys(user.screenPermissions).length) {
    return defaults
  }
  const stored = { ...user.screenPermissions }
  if (stored.VISITORS !== undefined && stored.NOTICES === undefined) {
    stored.NOTICES = stored.VISITORS
  }
  if (stored.NOTICES === undefined && stored.COMPLAINTS !== undefined) {
    stored.NOTICES = stored.COMPLAINTS
  }
  delete stored.VISITORS
  return { ...defaults, ...stored }
}

export function accessGrantFromUser(user) {
  return Boolean(user?.accessGrant)
}

/** Map app routes to permission module keys. Longest match wins. */
const ROUTE_MODULE_RULES = [
  { prefix: '/app/add-user', module: 'ACCESS_GRANT' },
  { prefix: '/app/users', module: 'STUDENTS' },
  { prefix: '/app/students', module: 'STUDENTS' },
  { prefix: '/app/residents', module: 'STUDENTS' },
  { prefix: '/app/admissions', module: 'HOSTEL' },
  { prefix: '/app/allocations', module: 'HOSTEL' },
  { prefix: '/app/rooms', module: 'ROOMS' },
  { prefix: '/app/complaints', module: 'COMPLAINTS' },
  { prefix: '/app/notices', module: 'NOTICES' },
  { prefix: '/app/attendance', module: 'ATTENDANCE' },
  { prefix: '/app/fees', module: 'FEES' },
  { prefix: '/app/my-fees', module: 'FEES' },
  { prefix: '/app/expenses', module: 'FEES' },
  { prefix: '/app/occupancy', module: 'REPORTS' },
  { prefix: '/app/activity', module: 'REPORTS' },
  { prefix: '/app/profile', module: 'SETTINGS' },
  { prefix: '/app/my-room', module: 'HOSTEL' },
  { prefix: '/app', module: 'DASHBOARD', exact: true },
]

export function resolveModuleForPath(pathname) {
  const path = pathname.split('?')[0]
  for (const rule of ROUTE_MODULE_RULES) {
    if (rule.exact) {
      if (path === rule.prefix || path === `${rule.prefix}/`) return rule.module
      continue
    }
    if (path === rule.prefix || path.startsWith(`${rule.prefix}/`)) {
      return rule.module
    }
  }
  return null
}

export function usesCustomScreenPermissions(user) {
  return Boolean(user?.screenPermissions && Object.keys(user.screenPermissions).length > 0)
}

export function isModuleEnabled(user, moduleKey) {
  if (!usesCustomScreenPermissions(user)) return true
  return user.screenPermissions[moduleKey] !== false
}

export function hasAccessGrant(user) {
  if (!usesCustomScreenPermissions(user)) return user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'
  return Boolean(user.accessGrant)
}

export function canAccessPath(user, pathname) {
  if (!user) return false
  if (user.role === 'SUPER_ADMIN' && pathname.startsWith('/superadmin')) return true

  const moduleKey = resolveModuleForPath(pathname)
  if (!moduleKey) return true

  if (moduleKey === 'ACCESS_GRANT') {
    return hasAccessGrant(user)
  }

  return isModuleEnabled(user, moduleKey)
}

const FALLBACK_ROUTE_CANDIDATES = [
  '/app',
  '/app/my-room',
  '/app/my-fees',
  '/app/complaints',
  '/app/notices',
  '/app/rooms',
  '/app/residents',
  '/app/users',
  '/app/admissions',
  '/app/attendance',
  '/app/fees',
  '/app/occupancy',
  '/app/activity',
  '/app/profile',
]

export function firstAllowedAppPath(user) {
  if (!user) return '/'
  const match = FALLBACK_ROUTE_CANDIDATES.find((path) => canAccessPath(user, path))
  return match || '/app/profile'
}

function navPathAllowed(user, to) {
  const path = to.split('?')[0]
  return canAccessPath(user, path)
}

export function filterNavItems(items, user) {
  if (!usesCustomScreenPermissions(user)) return items

  return items
    .map((item) => {
      if (item.children) {
        const children = item.children.filter((child) => navPathAllowed(user, child.to))
        if (!children.length) return null
        return { ...item, children }
      }
      if (!navPathAllowed(user, item.to)) return null
      return item
    })
    .filter(Boolean)
}

/** Filter dashboard quick-action links by module permissions. */
export function filterQuickActions(actions, user) {
  if (!user) return []
  return actions.filter((action) => {
    if (!action.roles?.includes(user.role)) return false
    return canAccessPath(user, action.to)
  })
}
