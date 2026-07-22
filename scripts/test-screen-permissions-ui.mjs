/**
 * Frontend permission simulation for test users.
 * Run: node scripts/test-screen-permissions-ui.mjs
 */
import {
  canAccessPath,
  filterNavItems,
  firstAllowedAppPath,
  resolveModuleForPath,
} from '../src/constants/screenPermissions.js'

const ROLE_NAV = {
  ADMIN: [
    { to: '/app', label: 'Dashboard', end: true },
    { to: '/app/add-user', label: 'Add User' },
    {
      label: 'Management',
      children: [
        { to: '/app/users?role=ADMIN', label: 'Admins' },
        { to: '/app/users?role=WARDEN', label: 'Wardens' },
        { to: '/app/residents', label: 'Residents' },
        { to: '/app/rooms', label: 'Rooms' },
        { to: '/app/admissions', label: 'Admissions' },
        { to: '/app/allocations', label: 'Allocations' },
      ],
    },
    {
      label: 'Finance',
      children: [{ to: '/app/fees', label: 'Fees' }],
    },
    {
      label: 'Communication',
      children: [
        { to: '/app/notices', label: 'Notice' },
        { to: '/app/complaints', label: 'Complaints' },
      ],
    },
    { to: '/app/occupancy', label: 'Reports' },
    { to: '/app/attendance', label: 'Attendance' },
    { to: '/app/activity', label: 'Activity' },
  ],
  WARDEN: [
    { to: '/app', label: 'Dashboard', end: true },
    {
      label: 'Management',
      children: [
        { to: '/app/rooms', label: 'Rooms' },
        { to: '/app/occupancy', label: 'Occupancy' },
        { to: '/app/residents', label: 'Residents' },
        { to: '/app/users?role=STUDENT', label: 'Students' },
      ],
    },
    {
      label: 'Communication',
      children: [
        { to: '/app/complaints', label: 'Complaints' },
        { to: '/app/notices', label: 'Notice' },
      ],
    },
    { to: '/app/attendance', label: 'Attendance' },
    { to: '/app/activity', label: 'Activity' },
  ],
  STUDENT: [
    { to: '/app', label: 'Dashboard', end: true },
    {
      label: 'My Hostel',
      children: [
        { to: '/app/my-room', label: 'My Room' },
        { to: '/app/my-fees', label: 'Fees' },
      ],
    },
    {
      label: 'Communication',
      children: [
        { to: '/app/complaints', label: 'Complaints' },
        { to: '/app/notices', label: 'Notice' },
      ],
    },
    { to: '/app/activity', label: 'Activity' },
  ],
}

function flattenNav(items) {
  const labels = []
  for (const item of items) {
    if (item.children) labels.push(...item.children.map((c) => c.label))
    else labels.push(item.label)
  }
  return labels
}

const cases = [
  {
    role: 'STUDENT',
    user: {
      role: 'STUDENT',
      screenPermissions: { FEES: false, COMPLAINTS: false, NOTICES: false },
    },
    hiddenLabels: ['Fees', 'Complaints', 'Notice'],
    blockedPaths: ['/app/my-fees', '/app/complaints', '/app/notices'],
    allowedPaths: ['/app/my-room', '/app/activity'],
    dashboardHiddenKpis: ['Fee balance', 'Open complaints', 'Active notice'],
  },
  {
    role: 'ADMIN',
    user: {
      role: 'ADMIN',
      screenPermissions: { FEES: false, COMPLAINTS: false, NOTICES: false },
    },
    hiddenLabels: ['Fees', 'Complaints', 'Notice'],
    blockedPaths: ['/app/fees', '/app/complaints', '/app/notices'],
    allowedPaths: ['/app/rooms', '/app/residents'],
  },
  {
    role: 'WARDEN',
    user: {
      role: 'WARDEN',
      screenPermissions: { COMPLAINTS: false, NOTICES: false, HOSTEL: false },
    },
    hiddenLabels: ['Complaints', 'Notice'],
    blockedPaths: ['/app/complaints', '/app/notices', '/app/admissions'],
    allowedPaths: ['/app/rooms', '/app/attendance'],
  },
  {
    role: 'STUDENT',
    name: 'DASHBOARD=false',
    user: {
      role: 'STUDENT',
      screenPermissions: { DASHBOARD: false, FEES: true },
    },
    firstAllowed: '/app/my-fees',
    blockedPaths: ['/app'],
  },
]

for (const tc of cases) {
  console.log(`\n=== ${tc.role}${tc.name ? ` (${tc.name})` : ''} ===`)
  const nav = filterNavItems(ROLE_NAV[tc.role], tc.user)
  const labels = flattenNav(nav)
  console.log('Sidebar labels:', labels.join(', '))

  if (tc.hiddenLabels) {
    const leaks = tc.hiddenLabels.filter((l) => labels.includes(l))
    console.log('Sidebar hidden check:', leaks.length ? `FAIL leaked: ${leaks.join(', ')}` : 'PASS')
  }

  if (tc.blockedPaths) {
    for (const p of tc.blockedPaths) {
      const ok = !canAccessPath(tc.user, p)
      console.log(`Block ${p}:`, ok ? 'PASS' : 'FAIL')
    }
  }
  if (tc.allowedPaths) {
    for (const p of tc.allowedPaths) {
      const ok = canAccessPath(tc.user, p)
      console.log(`Allow ${p}:`, ok ? 'PASS' : 'FAIL')
    }
  }
  if (tc.firstAllowed) {
    const fb = firstAllowedAppPath(tc.user)
    console.log(`firstAllowedAppPath: ${fb} (expected ${tc.firstAllowed})`, fb === tc.firstAllowed ? 'PASS' : 'FAIL')
  }
}
