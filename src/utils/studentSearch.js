import { apiGet } from './api'

export async function loadStudentDirectory(role) {
  const canSeeFees = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const canSearch = role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'WARDEN'

  if (!canSearch) {
    return { students: [], allocationByStudent: new Map(), feesByStudent: new Map() }
  }

  const [students, allocations, feeSummaries] = await Promise.all([
    apiGet('/api/users?role=STUDENT').catch(() => []),
    apiGet('/api/allocations').catch(() => []),
    canSeeFees ? apiGet('/api/fees/students').catch(() => []) : Promise.resolve([]),
  ])

  const allocationByStudent = new Map()
  ;(allocations || [])
    .filter((a) => a.active)
    .forEach((a) => allocationByStudent.set(String(a.studentId), a))

  const feesByStudent = new Map()
  ;(feeSummaries || []).forEach((f) => feesByStudent.set(String(f.studentId), f))

  return {
    students: students || [],
    allocationByStudent,
    feesByStudent,
  }
}

export function filterStudents(students, query, limit = 8) {
  const q = query.trim().toLowerCase()
  if (!q) return []

  return (students || [])
    .filter((s) => {
      const haystack = [s.fullName, s.email, s.studentId, s.phone]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
    .slice(0, limit)
}

export function buildStudentProfile(student, allocationByStudent, feesByStudent) {
  if (!student) return null

  const allocation = allocationByStudent.get(String(student.id))
  const fees = feesByStudent.get(String(student.id))

  return {
    ...student,
    allocation,
    fees,
  }
}

export async function fetchStudentFullProfile(studentId, role) {
  const canSeeFees = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const id = String(studentId)

  const students = (await apiGet('/api/users?role=STUDENT')) || []
  const student = students.find((s) => String(s.id) === id)
  if (!student) {
    throw new Error('Student not found')
  }

  const [allocations, complaints, feeSummaries, feeDetails] = await Promise.all([
    apiGet('/api/allocations').catch(() => []),
    apiGet('/api/complaints').catch(() => []),
    canSeeFees ? apiGet('/api/fees/students').catch(() => []) : Promise.resolve([]),
    canSeeFees ? apiGet(`/api/fees/students/${id}`).catch(() => []) : Promise.resolve([]),
  ])

  const studentAllocations = (allocations || []).filter((a) => String(a.studentId) === id)
  const allocation = studentAllocations.find((a) => a.active) || studentAllocations[0] || null
  const studentComplaints = (complaints || []).filter((c) => String(c.studentId) === id)
  const fees = (feeSummaries || []).find((f) => String(f.studentId) === id) || null

  return {
    student,
    allocation,
    complaints: studentComplaints,
    fees,
    feeDetails: feeDetails || [],
  }
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0))
}
