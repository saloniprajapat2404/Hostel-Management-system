import { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import HostelLogo from '../HostelLogo'
import DarkModeToggle from '../DarkModeToggle'
import { useDarkMode } from '../../hooks/useDarkMode'
import { clearSession, getSession } from '../../utils/auth'

const ROLE_NAV = {
  SUPER_ADMIN: [
    { to: '/app', label: 'Dashboard', end: true },
    { to: '/app/users?role=ADMIN', label: 'Admins' },
    { to: '/app/rooms', label: 'Rooms' },
    { to: '/app/users?role=STUDENT', label: 'Students' },
    { to: '/app/admissions', label: 'Admissions' },
    { to: '/app/allocations', label: 'Allocations' },
    { to: '/app/occupancy', label: 'Reports' },
    { to: '/app/notices', label: 'Notices' },
    { to: '/app/settings', label: 'Settings' },
  ],
  ADMIN: [
    { to: '/app', label: 'Dashboard', end: true },
    { to: '/app/users?role=WARDEN', label: 'Wardens' },
    { to: '/app/rooms', label: 'Rooms' },
    { to: '/app/users?role=STUDENT', label: 'Students' },
    { to: '/app/admissions', label: 'Admissions' },
    { to: '/app/allocations', label: 'Allocations' },
    { to: '/app/occupancy', label: 'Occupancy' },
    { to: '/app/notices', label: 'Notices' },
    { to: '/app/complaints', label: 'Complaints' },
  ],
  WARDEN: [
    { to: '/app', label: 'Dashboard', end: true },
    { to: '/app/rooms', label: 'Rooms' },
    { to: '/app/occupancy', label: 'Occupancy' },
    { to: '/app/users?role=STUDENT', label: 'Students' },
    { to: '/app/complaints', label: 'Complaints' },
    { to: '/app/attendance', label: 'Attendance' },
    { to: '/app/notices', label: 'Notices' },
  ],
  STUDENT: [
    { to: '/app', label: 'Dashboard', end: true },
    { to: '/app/my-room', label: 'My Room' },
    { to: '/app/complaints', label: 'Complaints' },
    { to: '/app/notices', label: 'Notices' },
    { to: '/app/profile', label: 'Profile' },
  ],
}

const ROLE_BADGE = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  WARDEN: 'Warden',
  STUDENT: 'Student',
}

function isNavActive(item, pathname, search) {
  const [path, qs] = item.to.split('?')
  if (item.end) return pathname === path
  if (qs) return pathname === path && search.includes(qs)
  return pathname === path || pathname.startsWith(`${path}/`)
}

export default function AppShell() {
  const user = getSession()
  const navigate = useNavigate()
  const location = useLocation()
  const { dark, toggle } = useDarkMode()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const items = useMemo(() => ROLE_NAV[user?.role] || ROLE_NAV.STUDENT, [user?.role])

  const handleSignOut = () => {
    clearSession()
    navigate('/')
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
          <HostelLogo size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">Takshak Hostel</p>
            <p className="truncate text-xs text-primary dark:text-primary-light">Management System</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => {
            const active = isNavActive(item, location.pathname, location.search)
            return (
              <NavLink
                key={item.to + item.label}
                to={item.to}
                end={item.end}
                className={[
                  'block rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-white shadow-sm shadow-primary/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
                ].join(' ')}
                onClick={() => setSidebarOpen(false)}
              >
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-slate-200/80 p-3 dark:border-slate-800">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>
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
                <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
              </svg>
            </button>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {user?.fullName || user?.email || 'User'}
              </p>
              <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary dark:bg-primary/20 dark:text-primary-light">
                {ROLE_BADGE[user?.role] || user?.role}
              </span>
            </div>
          </div>
          <DarkModeToggle dark={dark} onToggle={toggle} label="Dark mode" />
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
