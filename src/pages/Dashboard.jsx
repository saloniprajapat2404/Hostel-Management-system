import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BedDouble,
  Bell,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock,
  DoorOpen,
  GraduationCap,
  Home,
  MessageSquare,
  MessageSquareWarning,
  Shield,
  UserCheck,
  UserCog,
  Users,
} from 'lucide-react'
import { apiGet } from '../utils/api'
import { getSession } from '../utils/auth'
import {
  fetchDashboardDetail,
  hasDetailList,
  STAT_DETAIL_KEYS,
} from '../utils/dashboardDetails'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import {
  DashboardSkeleton,
  DetailList,
  ProgressBar,
  QuickStatPill,
  StatDetailToggle,
  ToggleSection,
} from '../components/ui/DashboardUi'

const LABELS = {
  totalRooms: 'Total rooms',
  totalBeds: 'Total beds',
  occupiedBeds: 'Occupied beds',
  vacantBeds: 'Vacant beds',
  activeAllocations: 'Active allocations',
  activeNotices: 'Active notices',
  students: 'Students',
  wardens: 'Wardens',
  admins: 'Admins',
  pendingAdmissions: 'Pending admissions',
  openComplaints: 'Open complaints',
  inProgressComplaints: 'In progress',
  myOpenComplaints: 'My open complaints',
  hasAllocation: 'Room allocated',
  myRoomNumber: 'Room number',
  myBedLabel: 'Bed',
  myFloor: 'Floor',
}

const LIST_LABELS = {
  totalRooms: 'All rooms',
  totalBeds: 'All beds',
  occupiedBeds: 'Occupied beds',
  vacantBeds: 'Vacant beds',
  students: 'All students',
  wardens: 'All wardens',
  admins: 'All admins',
  activeNotices: 'All active notices',
  openComplaints: 'All open complaints',
  inProgressComplaints: 'All in-progress complaints',
  myOpenComplaints: 'My complaints',
  activeAllocations: 'All active allocations',
  pendingAdmissions: 'All pending admissions',
}

const STAT_TONES = {
  openComplaints: 'red',
  inProgressComplaints: 'amber',
  myOpenComplaints: 'red',
  occupiedBeds: 'teal',
  vacantBeds: 'green',
  hasAllocation: 'green',
  pendingAdmissions: 'amber',
}

const STAT_ICONS = {
  totalRooms: Building2,
  totalBeds: BedDouble,
  occupiedBeds: Users,
  vacantBeds: DoorOpen,
  activeAllocations: UserCheck,
  activeNotices: Bell,
  students: GraduationCap,
  wardens: Shield,
  admins: UserCog,
  pendingAdmissions: ClipboardList,
  openComplaints: MessageSquareWarning,
  inProgressComplaints: Clock,
  myOpenComplaints: MessageSquare,
  hasAllocation: CheckCircle2,
  myRoomNumber: Building2,
  myBedLabel: BedDouble,
  myFloor: Home,
}

const STUDENT_SECTIONS = [
  {
    id: 'my-stay',
    title: 'My Stay',
    subtitle: 'Your room allocation details',
    keys: ['hasAllocation', 'myRoomNumber', 'myBedLabel', 'myFloor'],
    icon: <Home className="h-5 w-5" strokeWidth={2} aria-hidden="true" />,
  },
  {
    id: 'notices',
    title: 'Notices',
    subtitle: 'Hostel announcements for you',
    keys: ['activeNotices'],
    icon: <Bell className="h-5 w-5" strokeWidth={2} aria-hidden="true" />,
  },
  {
    id: 'complaints',
    title: 'My Complaints',
    subtitle: 'Your open support requests',
    keys: ['myOpenComplaints'],
    icon: <MessageSquareWarning className="h-5 w-5" strokeWidth={2} aria-hidden="true" />,
  },
]

const SECTIONS = [
  {
    id: 'rooms',
    title: 'Room & Bed Overview',
    subtitle: 'Capacity and occupancy',
    keys: ['totalRooms', 'totalBeds', 'occupiedBeds', 'vacantBeds'],
    showOccupancy: true,
    icon: <Home className="h-5 w-5" strokeWidth={2} aria-hidden="true" />,
  },
  {
    id: 'allocations',
    title: 'Allocations & Admissions',
    subtitle: 'Bed assignments and pending requests',
    keys: ['activeAllocations', 'pendingAdmissions', 'hasAllocation'],
    icon: <UserCheck className="h-5 w-5" strokeWidth={2} aria-hidden="true" />,
  },
  {
    id: 'people',
    title: 'People',
    subtitle: 'Residents and staff counts',
    keys: ['students', 'wardens', 'admins'],
    icon: <Users className="h-5 w-5" strokeWidth={2} aria-hidden="true" />,
  },
  {
    id: 'notices',
    title: 'Notices',
    subtitle: 'Active hostel announcements',
    keys: ['activeNotices'],
    icon: <Bell className="h-5 w-5" strokeWidth={2} aria-hidden="true" />,
  },
  {
    id: 'complaints',
    title: 'Complaints',
    subtitle: 'Open and pending issues',
    keys: ['openComplaints', 'inProgressComplaints', 'myOpenComplaints'],
    icon: <MessageSquareWarning className="h-5 w-5" strokeWidth={2} aria-hidden="true" />,
  },
]

const STORAGE_KEY = 'hms_dashboard_sections'
const DETAIL_STORAGE_KEY = 'hms_dashboard_details'

function formatValue(key, value) {
  if (key === 'hasAllocation') return value ? 'Yes' : 'No'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return value ?? '—'
}

function sectionSummary(section, stats) {
  const items = section.keys.filter((k) => stats[k] !== undefined)
  if (items.length === 0) return null
  const total = items.reduce((sum, k) => {
    const v = stats[k]
    return typeof v === 'number' ? sum + v : sum
  }, 0)
  return `${items.length} metric${items.length > 1 ? 's' : ''}${typeof total === 'number' && total > 0 ? ` · ${total} total` : ''}`
}

function loadExpanded(ids, storageKey) {
  try {
    const raw = sessionStorage.getItem(storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return new Set(parsed.filter((id) => ids.includes(id)))
  } catch {
    /* ignore */
  }
  return null
}

export default function Dashboard() {
  const user = getSession()
  const role = user?.role || 'STUDENT'
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(new Set())
  const [expandedDetails, setExpandedDetails] = useState(new Set())
  const [detailCache, setDetailCache] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    setDetailCache({})
    try {
      const data = await apiGet('/api/dashboard/stats')
      setStats(data?.stats || {})
    } catch (err) {
      setError(err.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const visibleSections = useMemo(() => {
    if (!stats) return []
    const config = role === 'STUDENT' ? STUDENT_SECTIONS : SECTIONS
    return config
      .map((section) => ({
        ...section,
        items: section.keys.filter((key) => stats[key] !== undefined),
      }))
      .filter((section) => section.items.length > 0)
  }, [stats, role])

  useEffect(() => {
    if (visibleSections.length === 0) return
    const ids = visibleSections.map((s) => s.id)
    const stored = loadExpanded(ids, STORAGE_KEY)
    setExpanded(stored ?? new Set())

    const detailIds = visibleSections.flatMap((s) => s.items).filter((k) => hasDetailList(k, role))
    const storedDetails = loadExpanded(detailIds, DETAIL_STORAGE_KEY)
    if (storedDetails?.size) setExpandedDetails(storedDetails)
  }, [visibleSections, role])

  const persistExpanded = (next, storageKey) => {
    sessionStorage.setItem(storageKey, JSON.stringify([...next]))
  }

  const toggleSection = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      persistExpanded(next, STORAGE_KEY)
      return next
    })
  }

  const loadDetail = useCallback(async (statKey) => {
    const detailKey = STAT_DETAIL_KEYS[statKey]
    if (!detailKey) return

    setDetailCache((prev) => ({
      ...prev,
      [statKey]: { ...(prev[statKey] || {}), loading: true, error: '' },
    }))

    try {
      const items = await fetchDashboardDetail(detailKey)
      setDetailCache((prev) => ({
        ...prev,
        [statKey]: { items, loading: false, error: '' },
      }))
    } catch (err) {
      setDetailCache((prev) => ({
        ...prev,
        [statKey]: {
          items: [],
          loading: false,
          error: err.message || 'Failed to load list',
        },
      }))
    }
  }, [])

  const toggleDetail = (statKey) => {
    setExpandedDetails((prev) => {
      const next = new Set(prev)
      const opening = !next.has(statKey)
      if (opening) {
        next.add(statKey)
        if (!detailCache[statKey]?.items) loadDetail(statKey)
      } else {
        next.delete(statKey)
      }
      persistExpanded(next, DETAIL_STORAGE_KEY)
      return next
    })
  }

  const quickStats = useMemo(() => {
    if (!stats) return []
    const pills = []

    if (role === 'STUDENT') {
      if (stats.hasAllocation !== undefined) {
        pills.push({
          label: 'Room allocated',
          value: stats.hasAllocation ? 'Yes' : 'No',
          tone: stats.hasAllocation ? 'green' : 'amber',
          icon: CheckCircle2,
        })
      }
      if (stats.myRoomNumber) {
        pills.push({
          label: 'My room',
          value: stats.myRoomNumber,
          tone: 'teal',
          icon: Building2,
        })
      }
      if (stats.myOpenComplaints !== undefined) {
        pills.push({
          label: 'My complaints',
          value: stats.myOpenComplaints,
          tone: 'red',
          icon: MessageSquare,
        })
      }
      if (stats.activeNotices !== undefined) {
        pills.push({
          label: 'Active notices',
          value: stats.activeNotices,
          tone: 'slate',
          icon: Bell,
        })
      }
      return pills.slice(0, 4)
    }

    if (stats.totalRooms !== undefined) {
      pills.push({ label: 'Total rooms', value: stats.totalRooms, tone: 'teal', icon: Building2 })
    }
    if (stats.occupiedBeds !== undefined) {
      pills.push({ label: 'Occupied beds', value: stats.occupiedBeds, tone: 'teal', icon: Users })
    }
    if (stats.students !== undefined) {
      pills.push({ label: 'Students', value: stats.students, tone: 'slate', icon: GraduationCap })
    }
    if (stats.openComplaints !== undefined) {
      pills.push({ label: 'Open complaints', value: stats.openComplaints, tone: 'red', icon: MessageSquareWarning })
    } else if (stats.myOpenComplaints !== undefined) {
      pills.push({ label: 'My complaints', value: stats.myOpenComplaints, tone: 'red', icon: MessageSquare })
    } else if (stats.activeAllocations !== undefined) {
      pills.push({ label: 'Active allocations', value: stats.activeAllocations, tone: 'amber', icon: UserCheck })
    }
    return pills.slice(0, 4)
  }, [stats, role])

  const renderStat = (key) => {
    const showList = hasDetailList(key, role)
    const listOpen = expandedDetails.has(key)
    const cache = detailCache[key]
    const tone =
      key === 'hasAllocation'
        ? stats[key]
          ? 'green'
          : 'amber'
        : STAT_TONES[key] || 'default'
    const Icon = STAT_ICONS[key]

    if (!showList) {
      return (
        <StatDetailToggle
          key={key}
          label={LABELS[key] || key}
          value={formatValue(key, stats[key])}
          tone={tone}
          icon={Icon}
          hint={
            key === 'vacantBeds' && stats.totalBeds
              ? `${Math.round((Number(stats[key]) / Number(stats.totalBeds)) * 100)}% available`
              : undefined
          }
          showListToggle={false}
        />
      )
    }

    return (
      <StatDetailToggle
        key={key}
        label={LABELS[key] || key}
        value={formatValue(key, stats[key])}
        tone={tone}
        icon={Icon}
        hint={
          key === 'vacantBeds' && stats.totalBeds
            ? `${Math.round((Number(stats[key]) / Number(stats.totalBeds)) * 100)}% available`
            : `Click "View all" to see full list`
        }
        showListToggle
        listOpen={listOpen}
        onListToggle={() => toggleDetail(key)}
        listLabel={LIST_LABELS[key]}
      >
        <DetailList
          items={cache?.items}
          loading={cache?.loading}
          error={cache?.error}
          emptyLabel={`No ${(LIST_LABELS[key] || key).toLowerCase()} yet.`}
        />
      </StatDetailToggle>
    )
  }

  return (
    <div className="dashboard-premium -mx-4 -mt-2 min-h-[calc(100vh-5rem)] rounded-t-[24px] bg-[#0B1220] px-4 pb-10 md:-mx-6 md:px-6">
      <DashboardHeader user={user} />

      {loading && <DashboardSkeleton />}
      {error && (
        <div className="dashboard-error" role="alert">
          <p className="text-[15px] text-[#FCA5A5]">{error}</p>
          <button type="button" onClick={load} className="dashboard-error-btn">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && stats && (
        <>
          {quickStats.length > 0 && (
            <div className="mb-8 grid grid-cols-12 gap-4">
              {quickStats.map((pill) => (
                <div key={pill.label} className="col-span-12 sm:col-span-6 xl:col-span-3">
                  <QuickStatPill {...pill} />
                </div>
              ))}
            </div>
          )}

          <div className="space-y-4">
            {visibleSections.map((section) => (
              <ToggleSection
                key={section.id}
                id={section.id}
                title={section.title}
                subtitle={section.subtitle}
                icon={section.icon}
                badge={sectionSummary(section, stats)}
                open={expanded.has(section.id)}
                onToggle={() => toggleSection(section.id)}
              >
                <div className="space-y-5">
                  {section.showOccupancy && stats.totalBeds != null && stats.occupiedBeds != null && (
                    <ProgressBar
                      label="Bed occupancy"
                      value={Number(stats.occupiedBeds)}
                      max={Number(stats.totalBeds)}
                    />
                  )}
                  <div className="grid grid-cols-12 gap-4">
                    {section.items.map((key) => (
                      <div key={key} className="col-span-12 lg:col-span-6">
                        {renderStat(key)}
                      </div>
                    ))}
                  </div>
                </div>
              </ToggleSection>
            ))}

            {visibleSections.length === 0 && (
              <p className="rounded-[20px] border border-dashed border-white/[0.12] px-6 py-10 text-center text-[15px] text-[#64748B]">
                No dashboard stats available for your role.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
