import { apiGet } from './api'

/** Maps dashboard stat keys to detail fetchers */
export const STAT_DETAIL_KEYS = {
  totalRooms: 'rooms-all',
  totalBeds: 'beds-all',
  occupiedBeds: 'beds-occupied',
  vacantBeds: 'beds-vacant',
  students: 'students',
  wardens: 'wardens',
  admins: 'admins',
  activeNotices: 'notices-active',
  openComplaints: 'complaints-open',
  inProgressComplaints: 'complaints-in-progress',
  myOpenComplaints: 'complaints-mine-open',
  activeAllocations: 'allocations-active',
  pendingAdmissions: 'admissions-pending',
}

export function hasDetailList(statKey, role) {
  if (!STAT_DETAIL_KEYS[statKey]) return false
  if (role === 'STUDENT') {
    return ['myOpenComplaints', 'activeNotices'].includes(statKey)
  }
  if (role === 'WARDEN') {
    return statKey !== 'admins' && statKey !== 'pendingAdmissions'
  }
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    return true
  }
  return false
}

function flattenBeds(rooms) {
  const beds = []
  for (const room of rooms || []) {
    for (const bed of room.beds || []) {
      beds.push({ ...bed, roomNumber: room.roomNumber, floor: room.floor })
    }
  }
  return beds
}

export async function fetchDashboardDetail(detailKey) {
  switch (detailKey) {
    case 'rooms-all': {
      const rooms = (await apiGet('/api/rooms')) || []
      return rooms.map((r) => ({
        id: r.id,
        primary: `Room ${r.roomNumber}`,
        secondary: `Floor ${r.floor} · Capacity ${r.capacity}`,
        meta: `${r.occupiedCount}/${r.capacity} occupied`,
        tone: r.active ? 'teal' : 'slate',
      }))
    }
    case 'beds-all':
    case 'beds-occupied':
    case 'beds-vacant': {
      const rooms = (await apiGet('/api/rooms')) || []
      let beds = flattenBeds(rooms)
      if (detailKey === 'beds-occupied') beds = beds.filter((b) => b.occupied)
      if (detailKey === 'beds-vacant') beds = beds.filter((b) => !b.occupied)
      return beds.map((b) => ({
        id: `${b.roomNumber}-${b.bedLabel}`,
        primary: `${b.roomNumber} · Bed ${b.bedLabel}`,
        secondary: `Floor ${b.floor}`,
        meta: b.occupied ? 'Occupied' : 'Vacant',
        tone: b.occupied ? 'teal' : 'green',
      }))
    }
    case 'students': {
      const users = (await apiGet('/api/users?role=STUDENT')) || []
      return users.map((u) => ({
        id: u.id,
        primary: u.fullName,
        secondary: u.email,
        meta: u.studentId || (u.active ? 'Active' : 'Inactive'),
        tone: u.active ? 'default' : 'amber',
      }))
    }
    case 'wardens': {
      const users = (await apiGet('/api/users?role=WARDEN')) || []
      return users.map((u) => ({
        id: u.id,
        primary: u.fullName,
        secondary: u.email,
        meta: u.phone || 'Warden',
        tone: 'teal',
      }))
    }
    case 'admins': {
      const users = (await apiGet('/api/users?role=ADMIN')) || []
      return users.map((u) => ({
        id: u.id,
        primary: u.fullName,
        secondary: u.email,
        meta: 'Admin',
        tone: 'teal',
      }))
    }
    case 'notices-active': {
      const notices = (await apiGet('/api/notices')) || []
      return notices
        .filter((n) => n.active)
        .map((n) => ({
          id: n.id,
          primary: n.title,
          secondary: n.description?.slice(0, 80) + (n.description?.length > 80 ? '…' : ''),
          meta: n.createdByName || 'Notice',
          tone: 'teal',
        }))
    }
    case 'complaints-open':
    case 'complaints-in-progress': {
      const complaints = (await apiGet('/api/complaints')) || []
      const filtered =
        detailKey === 'complaints-open'
          ? complaints.filter((c) => c.status === 'OPEN')
          : complaints.filter((c) => c.status === 'IN_PROGRESS')
      return filtered.map((c) => ({
        id: c.id,
        primary: c.title,
        secondary: c.studentName ? `By ${c.studentName}` : c.description?.slice(0, 60),
        meta: c.status.replace('_', ' '),
        tone: c.status === 'OPEN' ? 'red' : c.status === 'IN_PROGRESS' ? 'amber' : 'green',
      }))
    }
    case 'complaints-mine-open': {
      const complaints = (await apiGet('/api/complaints')) || []
      return complaints
        .filter((c) => c.status !== 'RESOLVED')
        .map((c) => ({
          id: c.id,
          primary: c.title,
          secondary: c.description?.slice(0, 60),
          meta: c.status.replace('_', ' '),
          tone: c.status === 'OPEN' ? 'red' : c.status === 'IN_PROGRESS' ? 'amber' : 'green',
        }))
    }
    case 'allocations-active': {
      const allocations = (await apiGet('/api/allocations')) || []
      return allocations
        .filter((a) => a.active)
        .map((a) => ({
          id: a.id,
          primary: a.studentName,
          secondary: `${a.roomNumber} · Bed ${a.bedLabel}`,
          meta: a.studentCode || a.studentEmail,
          tone: 'teal',
        }))
    }
    case 'admissions-pending': {
      const admissions = (await apiGet('/api/admissions')) || []
      return admissions
        .filter((a) => a.status === 'PENDING')
        .map((a) => ({
          id: a.id,
          primary: a.studentName,
          secondary: a.email,
          meta: a.studentId || 'Pending',
          tone: 'amber',
        }))
    }
    default:
      return []
  }
}
