import { memo, useMemo, useState } from 'react'
import {
  BedDouble,
  Bell,
  ClipboardList,
  IndianRupee,
  LogOut,
  MessageSquare,
} from 'lucide-react'
import { ToggleSection, DetailList } from '../../ui/DashboardUi'
import { formatActivityWhen } from '../../../utils/dashboardActivity'
import { canAccessPath } from '../../../constants/screenPermissions'

const SECTION_TONE = {
  admissions: 'teal',
  feePayments: 'green',
  roomChanges: 'default',
  complaints: 'amber',
  leaveRequests: 'red',
  notices: 'slate',
}

const SECTIONS = [
  { key: 'admissions', label: 'Admissions', icon: ClipboardList, roles: ['ADMIN', 'SUPER_ADMIN', 'STUDENT'], tone: 'teal', path: '/app/admissions' },
  {
    key: 'feePayments',
    label: 'Fee payments',
    icon: IndianRupee,
    roles: ['ADMIN', 'SUPER_ADMIN', 'WARDEN', 'STUDENT'],
    tone: 'green',
    pathByRole: { STUDENT: '/app/my-fees', default: '/app/fees' },
  },
  {
    key: 'roomChanges',
    label: 'Room changes',
    icon: BedDouble,
    roles: ['ADMIN', 'SUPER_ADMIN', 'WARDEN', 'STUDENT'],
    tone: 'default',
    pathByRole: { STUDENT: '/app/my-room', default: '/app/rooms' },
  },
  { key: 'complaints', label: 'Complaints', icon: MessageSquare, roles: ['ADMIN', 'SUPER_ADMIN', 'WARDEN', 'STUDENT'], tone: 'amber', path: '/app/complaints' },
  { key: 'leaveRequests', label: 'Leave requests', icon: LogOut, roles: ['ADMIN', 'SUPER_ADMIN', 'WARDEN', 'STUDENT'], tone: 'red' },
  { key: 'notices', label: 'Notice', icon: Bell, roles: ['ADMIN', 'SUPER_ADMIN', 'WARDEN', 'STUDENT'], tone: 'slate', path: '/app/notices' },
]

function sectionAccessPath(section, role) {
  if (section.pathByRole) {
    return section.pathByRole[role] || section.pathByRole.default
  }
  return section.path
}

function toDetailItems(items, sectionKey) {
  const tone = SECTION_TONE[sectionKey] || 'default'
  return (items || []).map((item) => ({
    id: item.id,
    primary: item.title,
    secondary: item.subtitle,
    meta: formatActivityWhen(item.at),
    tone,
  }))
}

function HistorySkeleton() {
  return (
    <section>
      <div className="mb-2 h-4 w-40 animate-pulse rounded" style={{ background: 'var(--dash-hover)' }} />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-[14px]" style={{ background: 'var(--dash-hover)' }} />
        ))}
      </div>
    </section>
  )
}

function StudentHistoryPanel({ role, history, loading = false, user }) {
  const sections = useMemo(
    () =>
      SECTIONS.filter((section) => {
        if (!section.roles.includes(role)) return false
        const path = sectionAccessPath(section, role)
        return !path || canAccessPath(user, path)
      }),
    [role, user],
  )
  const [openKey, setOpenKey] = useState(null)

  const totalEvents = useMemo(
    () => sections.reduce((sum, { key }) => sum + (history?.[key]?.length || 0), 0),
    [sections, history],
  )

  if (loading) return <HistorySkeleton />
  if (!sections.length) return null

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="dashboard-section-label mb-0">Overall student history</h3>
          <p className="mt-1 text-[12px] text-[var(--dash-muted)]">
            Recent activity across admissions, fees, rooms, and more
          </p>
        </div>
        <span className="dashboard-history-summary-badge">{totalEvents} total events</span>
      </div>
      <div className="space-y-2">
        {sections.map(({ key, label, icon: Icon, tone }) => {
          const items = toDetailItems(history?.[key], key)
          return (
            <ToggleSection
              key={key}
              id={`history-${key}`}
              title={label}
              subtitle={`${items.length} recent`}
              icon={<Icon strokeWidth={2} />}
              badge={items.length}
              tone={tone}
              enhanced
              open={openKey === key}
              onToggle={() => setOpenKey((prev) => (prev === key ? null : key))}
            >
              <DetailList items={items} emptyLabel={`No ${label.toLowerCase()} yet.`} interactive />
            </ToggleSection>
          )
        })}
      </div>
    </section>
  )
}

export default memo(StudentHistoryPanel)
