import { apiGet } from './api'

export function formatActivityWhen(iso) {
  if (!iso) return 'Recently'
  try {
    const then = new Date(iso)
    const diff = Date.now() - then.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins} min ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return hrs === 1 ? '1 hour ago' : `${hrs} hours ago`
    const days = Math.floor(hrs / 24)
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return then.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  } catch {
    return 'Recently'
  }
}

function toItem(id, title, subtitle, at, meta = {}) {
  return { id, title, subtitle, at, ...meta }
}

function sliceLimit(items, limit) {
  if (!limit || limit <= 0) return items
  return items.slice(0, limit)
}

/** Build activity feed from data already fetched on the dashboard (no extra API calls). */
export function buildRecentActivityFromData(
  { admissions = [], complaints = [], notices = [], studentFees = [] },
  role,
  { limit = 30 } = {},
) {
  const canSeeAdmissions = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const items = []

  if (canSeeAdmissions) {
    admissions.forEach((a) => {
      items.push(
        toItem(
          `adm-${a.id}`,
          a.status === 'APPROVED' ? 'Admission approved' : 'New admission request',
          a.studentName || a.email,
          a.reviewedAt || a.createdAt,
          { type: 'admission' },
        ),
      )
    })
  }

  complaints.forEach((c) => {
    items.push(
      toItem(
        `cmp-${c.id}`,
        c.status === 'RESOLVED'
          ? 'Complaint resolved'
          : c.status === 'IN_PROGRESS'
            ? 'Complaint in progress'
            : 'Complaint registered',
        c.title,
        c.createdAt,
        { type: 'complaint' },
      ),
    )
  })

  notices.forEach((n) => {
    items.push(
      toItem('ntc-' + n.id, 'Notice published', n.title, n.createdAt, { type: 'notice' }),
    )
  })

  if (role === 'STUDENT') {
    studentFees.forEach((fee) => {
      ;(fee.payments || []).forEach((p) => {
        items.push(
          toItem(
            `pay-${p.id}`,
            'Fee collected',
            `₹${Number(p.amount || 0).toLocaleString('en-IN')} · ${p.feeType || fee.feeType}`,
            p.paidAt,
            { type: 'fee' },
          ),
        )
      })
    })
  }

  return items
    .filter((i) => i.title)
    .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0))
    .slice(0, limit)
}

/** Build student history panels from prefetched dashboard data (no extra API calls). */
export function buildStudentHistoryFromData(
  role,
  {
    limitPerCategory = 6,
    userId,
    userEmail,
    studentFees = [],
    feeSummaries = [],
    admissions = [],
    complaints = [],
    notices = [],
    allocations = [],
    attendance = [],
  } = {},
) {
  const history = {
    admissions: [],
    feePayments: [],
    roomChanges: [],
    complaints: [],
    leaveRequests: [],
    notices: [],
  }

  const canSeeAll = role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'WARDEN'

  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    history.admissions = sliceLimit(
      admissions.map((a) =>
        toItem(
          a.id,
          a.studentName || a.email,
          a.status === 'APPROVED' ? 'Approved' : a.status || 'Pending',
          a.reviewedAt || a.createdAt,
        ),
      ),
      limitPerCategory,
    )
  }

  if (role === 'STUDENT') {
    studentFees.forEach((fee) => {
      ;(fee.payments || []).forEach((p) => {
        history.feePayments.push(
          toItem(
            p.id,
            `₹${Number(p.amount || 0).toLocaleString('en-IN')} · ${fee.feeType}`,
            p.method || 'Payment',
            p.paidAt,
          ),
        )
      })
    })
  } else if (canSeeAll) {
    feeSummaries.forEach((s) => {
      ;(s.payments || []).forEach((p) => {
        history.feePayments.push(
          toItem(
            p.id,
            `${s.fullName}: ₹${Number(p.amount || 0).toLocaleString('en-IN')}`,
            p.feeType || s.feeType || 'Fee',
            p.paidAt,
          ),
        )
      })
    })
  }

  history.feePayments = sliceLimit(
    history.feePayments.sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0)),
    limitPerCategory,
  )

  if (canSeeAll || role === 'STUDENT') {
    history.roomChanges = sliceLimit(
      (Array.isArray(allocations) ? allocations : [allocations])
        .filter(Boolean)
        .map((a) =>
          toItem(
            a.id,
            a.active ? `Room ${a.roomNumber} · ${a.bedLabel}` : `Vacated ${a.roomNumber}`,
            a.studentName || 'Allocation',
            a.allocatedAt,
          ),
        )
        .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0)),
      limitPerCategory,
    )
  }

  const filteredComplaints =
    role === 'STUDENT'
      ? complaints.filter((c) => c.studentId === userId || c.studentEmail === userEmail)
      : complaints
  history.complaints = sliceLimit(
    filteredComplaints.map((c) => toItem(c.id, c.title, c.status, c.createdAt)),
    limitPerCategory,
  )

  if (canSeeAll) {
    history.leaveRequests = sliceLimit(
      attendance
        .filter((a) => a.type === 'CHECK_OUT' || a.status === 'CHECK_OUT')
        .map((a) =>
          toItem(a.id, a.studentName || 'Leave request', a.notes || 'Check-out recorded', a.timestamp || a.createdAt),
        )
        .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0)),
      limitPerCategory,
    )
  }

  history.notices = sliceLimit(
    notices.map((n) => toItem(n.id, n.title, n.createdByName || 'Staff', n.createdAt)),
    limitPerCategory,
  )

  return history
}

export async function loadRecentActivity(role, { limit = 30 } = {}) {
  const canSeeAdmissions = role === 'ADMIN' || role === 'SUPER_ADMIN'

  const requests = []
  if (canSeeAdmissions) requests.push(apiGet('/api/admissions').catch(() => []))
  requests.push(apiGet('/api/complaints').catch(() => []))
  requests.push(apiGet('/api/notices').catch(() => []))
  if (role === 'STUDENT') requests.push(apiGet('/api/users/me/fees').catch(() => []))

  const results = await Promise.all(requests)

  let index = 0
  const admissions = canSeeAdmissions ? results[index++] || [] : []
  const complaints = results[index++] || []
  const notices = results[index++] || []
  const studentFees = role === 'STUDENT' ? results[index++] || [] : []

  return buildRecentActivityFromData({ admissions, complaints, notices, studentFees }, role, { limit })
}

export async function loadStudentHistory(role, options = {}) {
  const { limitPerCategory = 6, userId, userEmail, studentFees = [], feeSummaries = [] } = options
  const canSeeAll = role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'WARDEN'

  let admissions = []
  let complaints = []
  let notices = []
  let allocations = []
  let attendance = []
  let fees = studentFees

  const needsFetch = []
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') needsFetch.push(apiGet('/api/admissions').catch(() => []))
  needsFetch.push(apiGet('/api/complaints').catch(() => []))
  needsFetch.push(apiGet('/api/notices').catch(() => []))
  if (canSeeAll || role === 'STUDENT') {
    needsFetch.push(
      role === 'STUDENT'
        ? apiGet('/api/allocations/me').then((a) => (a ? [a] : [])).catch(() => [])
        : apiGet('/api/allocations').catch(() => []),
    )
  }
  if (canSeeAll) needsFetch.push(apiGet('/api/attendance').catch(() => []))
  if (role === 'STUDENT' && !fees.length) needsFetch.push(apiGet('/api/users/me/fees').catch(() => []))

  const results = await Promise.all(needsFetch)
  let idx = 0
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') admissions = results[idx++] || []
  complaints = results[idx++] || []
  notices = results[idx++] || []
  if (canSeeAll || role === 'STUDENT') allocations = results[idx++] || []
  if (canSeeAll) attendance = results[idx++] || []
  if (role === 'STUDENT' && !fees.length) fees = results[idx++] || []

  return buildStudentHistoryFromData(role, {
    limitPerCategory,
    userId,
    userEmail,
    studentFees: fees,
    feeSummaries,
    admissions,
    complaints,
    notices,
    allocations,
    attendance,
  })
}
