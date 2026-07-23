import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, UserRound } from 'lucide-react'
import HostelLogo from '../HostelLogo'
import DarkModeToggle from '../DarkModeToggle'
import NotificationBell from '../notifications/NotificationBell'
import BranchSelector from './BranchSelector'
import { useBranch } from '../../context/BranchContext'
import { useDarkMode } from '../../hooks/useDarkMode'
import { useHostelConfig } from '../../context/HostelConfigContext'
import { filterNavItems } from '../../constants/screenPermissions'
import { apiGet } from '../../utils/api'
import { clearSession, getSession, getToken, saveSession } from '../../utils/auth'

const ADMIN_NAV = [
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
]

const SUPER_ADMIN_NAV = [
  { to: '/superadmin', label: 'All Branches', end: true },
  { to: '/superadmin/cities', label: 'Manage Cities' },
  { to: '/superadmin/branches', label: 'All Localities' },
  { to: '/app', label: 'Branch Dashboard' },
  { to: '/app/add-user', label: 'Add User' },
  {
    label: 'Management',
    children: [
      { to: '/app/users?role=ADMIN', label: 'Admins' },
      { to: '/app/users?role=WARDEN', label: 'Wardens' },
      { to: '/app/users?role=STUDENT', label: 'Students' },
      { to: '/app/residents', label: 'Residents' },
      { to: '/app/rooms', label: 'Rooms' },
      { to: '/app/admissions', label: 'Admissions' },
      { to: '/app/allocations', label: 'Allocations' },
    ],
  },
  {
    label: 'Finance',
    children: [
      { to: '/app/fees', label: 'Fees' },
      { to: '/app/expenses', label: 'Expenses' },
    ],
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
]

const ROLE_NAV = {
  SUPER_ADMIN: SUPER_ADMIN_NAV,
  ADMIN: ADMIN_NAV,
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

const ROLE_BADGE = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Branch Admin',
  WARDEN: 'Warden',
  STUDENT: 'Student',
}

function isNavActive(item, pathname, search) {
  const [path, qs] = item.to.split('?')
  if (item.end) return pathname === path
  if (qs) return pathname === path && search.includes(qs)
  return pathname === path || pathname.startsWith(`${path}/`)
}

function isGroupActive(group, pathname, search) {
  return group.children.some((child) => isNavActive(child, pathname, search))
}

function NavLinkItem({ item, pathname, search, onNavigate }) {
  const active = isNavActive(item, pathname, search)
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={[
        'block rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'bg-primary text-white shadow-sm shadow-primary/20'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
      ].join(' ')}
      onClick={onNavigate}
    >
      {item.label}
    </NavLink>
  )
}

function NavGroup({ group, pathname, search, onNavigate }) {
  const groupActive = isGroupActive(group, pathname, search)
  const [open, setOpen] = useState(groupActive)

  useEffect(() => {
    if (groupActive) setOpen(true)
  }, [groupActive])

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className={[
          'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
          groupActive
            ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
        ].join(' ')}
      >
        <span>{group.label}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && (
        <div className="ml-3 space-y-1 border-l border-slate-200 pl-2 dark:border-slate-700 motion-safe:animate-[fade-in-up_0.2s_ease-out]">
          {group.children.map((child) => {
            const active = isNavActive(child, pathname, search)
            return (
              <NavLink
                key={child.to + child.label}
                to={child.to}
                className={[
                  'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-white shadow-sm shadow-primary/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
                ].join(' ')}
                onClick={onNavigate}
              >
                {child.label}
              </NavLink>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function AppShell() {
  const [user, setUser] = useState(() => getSession())
  const { currentBranch } = useBranch()
  const navigate = useNavigate()
  const location = useLocation()
  const { dark, toggle } = useDarkMode()
  const { hostelName, systemName } = useHostelConfig()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const items = useMemo(() => {
    const base = ROLE_NAV[user?.role] || ROLE_NAV.STUDENT
    return filterNavItems(base, user)
  }, [user])
  const isDashboard = location.pathname === '/app' || location.pathname === '/app/'

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const me = await apiGet('/api/auth/me')
        if (cancelled || !me) return
        const remember = Boolean(localStorage.getItem('hms_token'))
        saveSession({ token: getToken(), user: me }, remember)
        setUser(me)
      } catch {
        /* keep cached session */
      }
    })()

    const onSessionUpdated = (event) => {
      setUser(event.detail || getSession())
    }
    window.addEventListener('hms:session-updated', onSessionUpdated)

    return () => {
      cancelled = true
      window.removeEventListener('hms:session-updated', onSessionUpdated)
    }
  }, [])

  const handleSignOut = () => {
    clearSession()
    navigate('/')
  }

  if (user?.role === 'SUPER_ADMIN' && !currentBranch) {
    return <Navigate to="/superadmin" replace />
  }

  return (
    <div className="flex min-h-screen bg-surface text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200/80 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-center gap-3 border-b border-slate-200/80 px-4 py-4 dark:border-slate-800">
          <HostelLogo size="sm" alt={hostelName} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{hostelName}</p>
            <p className="truncate text-xs text-primary dark:text-primary-light">{systemName}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) =>
            item.children ? (
              <NavGroup
                key={item.label}
                group={item}
                pathname={location.pathname}
                search={location.search}
                onNavigate={() => setSidebarOpen(false)}
              />
            ) : (
              <NavLinkItem
                key={item.to + item.label}
                item={item}
                pathname={location.pathname}
                search={location.search}
                onNavigate={() => setSidebarOpen(false)}
              />
            ),
          )}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path
                  fillRule="evenodd"
                  d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserRound className="h-4 w-4" />
                </span>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {user?.fullName || user?.email || 'User'}
                </p>
                {user?.role && user.role !== 'SUPER_ADMIN' && (
                  <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary dark:bg-primary/20 dark:text-primary-light">
                    {ROLE_BADGE[user.role] || user.role}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {user?.role === 'SUPER_ADMIN' && <BranchSelector />}
            {!isDashboard && <NotificationBell variant="shell" />}
            <DarkModeToggle dark={dark} onToggle={toggle} label="Dark mode" />
            <Link
              to="/app/profile"
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              title="Profile"
            >
              <UserRound className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
