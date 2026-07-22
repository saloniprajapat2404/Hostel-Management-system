const BASE = 'http://127.0.0.1:8080'
const BRANCH = 'vijay-nagar'
const PASS = 'demo123'
const ts = Date.now()

const ROUTE_MODULE = [
  ['/app/my-fees', 'FEES'],
  ['/app/fees', 'FEES'],
  ['/app/notices', 'NOTICES'],
  ['/app/complaints', 'COMPLAINTS'],
  ['/app/my-room', 'HOSTEL'],
  ['/app/rooms', 'ROOMS'],
  ['/app/attendance', 'ATTENDANCE'],
  ['/app/activity', 'REPORTS'],
]

function usesCustom(user) {
  return Boolean(user?.screenPermissions && Object.keys(user.screenPermissions).length > 0)
}

function isModuleEnabled(user, key) {
  if (!usesCustom(user)) return true
  return user.screenPermissions[key] !== false
}

function canAccessPath(user, path) {
  const rule = ROUTE_MODULE.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`))
  if (!rule) return true
  return isModuleEnabled(user, rule[1])
}

const STUDENT_NAV = [
  { to: '/app/my-fees', label: 'Fees' },
  { to: '/app/complaints', label: 'Complaints' },
  { to: '/app/notices', label: 'Notice' },
  { to: '/app/my-room', label: 'My Room' },
  { to: '/app/activity', label: 'Activity' },
]

const ADMIN_NAV = [
  { to: '/app/fees', label: 'Fees' },
  { to: '/app/notices', label: 'Notice' },
  { to: '/app/complaints', label: 'Complaints' },
  { to: '/app/rooms', label: 'Rooms' },
  { to: '/app/attendance', label: 'Attendance' },
]

const WARDEN_NAV = [
  { to: '/app/complaints', label: 'Complaints' },
  { to: '/app/notices', label: 'Notice' },
  { to: '/app/rooms', label: 'Rooms' },
  { to: '/app/attendance', label: 'Attendance' },
]

async function api(method, path, { token, body, branch } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  if (branch) headers['X-Branch-Id'] = branch
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  return { status: res.status, data }
}

function disabledPerms() {
  const p = Object.fromEntries(
    ['DASHBOARD', 'STUDENTS', 'HOSTEL', 'ROOMS', 'NOTICES', 'COMPLAINTS', 'ATTENDANCE', 'FEES', 'REPORTS', 'SETTINGS'].map((k) => [k, true]),
  )
  p.FEES = false
  p.COMPLAINTS = false
  p.NOTICES = false
  return p
}

function profile(i) {
  return {
    phone: `98765${String(i).padStart(5, '0')}`.slice(0, 10),
    parentPhone: `98764${String(i).padStart(5, '0')}`.slice(0, 10),
    aadharNumber: `${String(100000000000 + i).slice(0, 12)}`,
    addressLine: 'Test Address Line',
    city: 'Indore',
    state: 'MP',
    pincode: '452001',
  }
}

async function login(identifier) {
  const { status, data } = await api('POST', '/api/auth/login', {
    body: { identifier, password: PASS },
  })
  if (status !== 200) throw new Error(`Login failed for ${identifier}: ${status} ${JSON.stringify(data)}`)
  return data
}

async function createUser(adminToken, role, i) {
  const body = {
    email: `permtest.${role.toLowerCase()}.${ts}.${i}@takshak.edu`,
    password: PASS,
    fullName: `Perm Test ${role} ${i}`,
    role,
    active: true,
    screenPermissions: disabledPerms(),
    accessGrant: false,
    ...profile(i),
  }
  if (role === 'STUDENT') body.studentId = `PT${ts}${i}`.slice(0, 16)
  const { status, data } = await api('POST', '/api/users', { token: adminToken, branch: BRANCH, body })
  if (status !== 200) throw new Error(`Create ${role} failed: ${status} ${JSON.stringify(data)}`)
  return data
}

function navVisible(nav, user) {
  return nav.filter((item) => canAccessPath(user, item.to))
}

function navHidden(nav, user) {
  return nav.filter((item) => !canAccessPath(user, item.to))
}

async function testRole(role, nav, apiChecks) {
  const created = await createUser(adminToken, role, role.length)
  const loginRes = await login(created.email)
  const user = loginRes.user
  const me = await api('GET', '/api/auth/me', { token: loginRes.token })
  const results = []

  const checks = [
    ['login has screenPermissions', usesCustom(user)],
    ['FEES disabled in login', user.screenPermissions?.FEES === false],
    ['COMPLAINTS disabled in login', user.screenPermissions?.COMPLAINTS === false],
    ['/api/auth/me has permissions', usesCustom(me.data)],
    ['Fees hidden from nav', !navVisible(nav, user).some((n) => n.label === 'Fees')],
    ['Notice hidden from nav', !navVisible(nav, user).some((n) => n.label === 'Notice')],
    ['Complaints hidden from nav', !navVisible(nav, user).some((n) => n.label === 'Complaints')],
  ]

  for (const [name, ok] of checks) results.push({ name, ok })

  for (const [path, expectStatus, label] of apiChecks) {
    const { status } = await api('GET', path, { token: loginRes.token, branch: BRANCH })
    const ok = status === expectStatus
    results.push({ name: `${label} API → ${expectStatus}`, ok, got: status })
  }

  const failed = results.filter((r) => !r.ok)
  return { role, email: created.email, passed: failed.length === 0, results, failed }
}

let adminToken
try {
  const adminLogin = await login('superadmin@takshak.edu')
  adminToken = adminLogin.token

  const reports = []
  reports.push(
    await testRole('STUDENT', STUDENT_NAV, [
      ['/api/users/me/fees', 403, 'Student fees'],
      ['/api/notices', 403, 'Notices'],
      ['/api/complaints', 403, 'Complaints'],
      ['/api/dashboard/stats', 200, 'Dashboard stats'],
    ]),
  )
  reports.push(
    await testRole('ADMIN', ADMIN_NAV, [
      ['/api/fees/overview', 403, 'Fees overview'],
      ['/api/notices', 403, 'Notices'],
      ['/api/complaints', 403, 'Complaints'],
      ['/api/rooms', 200, 'Rooms'],
    ]),
  )
  reports.push(
    await testRole('WARDEN', WARDEN_NAV, [
      ['/api/notices', 403, 'Notices'],
      ['/api/complaints', 403, 'Complaints'],
      ['/api/rooms', 200, 'Rooms'],
      ['/api/attendance', 200, 'Attendance'],
    ]),
  )

  console.log(JSON.stringify({ ok: reports.every((r) => r.passed), reports }, null, 2))
  process.exit(reports.every((r) => r.passed) ? 0 : 1)
} catch (err) {
  console.error('TEST ERROR:', err.message)
  process.exit(2)
}
