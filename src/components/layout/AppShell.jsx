import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import HostelLogo from '../HostelLogo'
import DarkModeToggle from '../DarkModeToggle'
import NotificationBell from '../notifications/NotificationBell'
import { useDarkMode } from '../../hooks/useDarkMode'
import { useHostelConfig } from '../../context/HostelConfigContext'
import { clearSession, getSession } from '../../utils/auth'

const ROLE_NAV = {
  SUPER_ADMIN: [
    { to: '/app', label: 'Dashboard', end: true },
    {
      label: 'Management',
      children: [
        { to: '/app/users?role=ADMIN', label: 'Admins' },
        { to: '/app/users?role=STUDENT', label: 'Students' },
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
      children: [{ to: '/app/notices', label: 'Notices' }],
    },
    { to: '/app/occupancy', label: 'Reports' },
    { to: '/app/settings', label: 'Settings' },
  ],
  ADMIN: [
    { to: '/app', label: 'Dashboard', end: true },
    { to: '/app/add-user', label: 'Add User' },
    {
      label: 'Management',
      children: [
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
        { to: '/app/notices', label: 'Notices' },
        { to: '/app/complaints', label: 'Complaints' },
      ],
    },
    { to: '/app/occupancy', label: 'Reports' },
    { to: '/app/attendance', label: 'Attendance' },
    { to: '/app/settings', label: 'Settings' },
  ],
  WARDEN: [
    { to: '/app', label: 'Dashboard', end: true },
    {
      label: 'Management',
      children: [
        { to: '/app/rooms', label: 'Rooms' },
        { to: '/app/occupancy', label: 'Occupancy' },
        { to: '/app/users?role=STUDENT', label: 'Students' },
      ],
    },
    {
      label: 'Communication',
      children: [
        { to: '/app/complaints', label: 'Complaints' },
        { to: '/app/notices', label: 'Notices' },
      ],
    },
    { to: '/app/attendance', label: 'Attendance' },
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
        { to: '/app/notices', label: 'Notices' },
      ],
    },
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
        <div
          className="ml-3 space-y-1 border-l border-slate-200 pl-2 dark:border-slate-700 motion-safe:animate-[fade-in-up_0.2s_ease-out]"
        >
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
  const user = getSession()
  const navigate = useNavigate()
  const location = useLocation()
  const { dark, toggle } = useDarkMode()
  const { hostelName, systemName } = useHostelConfig()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const items = useMemo(() => ROLE_NAV[user?.role] || ROLE_NAV.STUDENT, [user?.role])
  const isDashboard = location.pathname === '/app' || location.pathname === '/app/'

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
          <div className="flex items-center gap-2">
            {!isDashboard && <NotificationBell variant="shell" />}
            <DarkModeToggle dark={dark} onToggle={toggle} label="Dark mode" />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
