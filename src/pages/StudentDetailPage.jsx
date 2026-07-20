import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getSession } from '../utils/auth'
import { fetchStudentFullProfile, formatCurrency } from '../utils/studentSearch'
import {
  Card,
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  StatusBadge,
  Table,
} from '../components/ui/Page'

function formatAadhar(value) {
  const digits = (value || '').replace(/\D/g, '')
  if (!digits) return '—'
  if (digits.length !== 12) return digits
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

function formatAddress(student) {
  const parts = [student.addressLine, student.city, student.state, student.pincode].filter(Boolean)
  return parts.length ? parts.join(', ') : '—'
}

function InfoGrid({ items }) {
  const visible = items.filter((i) => i.value != null && i.value !== '')
  if (!visible.length) return null
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {visible.map(({ label, value }) => (
        <div key={label}>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </dt>
          <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-white">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function complaintTone(status) {
  if (status === 'RESOLVED') return 'green'
  if (status === 'IN_PROGRESS') return 'amber'
  return 'red'
}

function feeTone(status) {
  if (status === 'PAID') return 'green'
  if (status === 'PARTIAL') return 'amber'
  return 'red'
}

export default function StudentDetailPage() {
  const { studentId } = useParams()
  const role = getSession()?.role
  const canSeeFees = role === 'ADMIN' || role === 'SUPER_ADMIN'

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await fetchStudentFullProfile(studentId, role))
    } catch (err) {
      setError(err.message || 'Failed to load student')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [studentId, role])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <LoadingBlock label="Loading student profile…" />
  if (error) return <ErrorBlock message={error} onRetry={load} />
  if (!data?.student) return <EmptyBlock message="Student not found." />

  const { student, allocation, allocations = [], complaints, fees, feeDetails, attendance = [] } = data

  const history = [
    ...allocations.map((a) => ({
      id: `alloc-${a.id}`,
      type: 'Allocation',
      title: a.active ? `Allocated to room ${a.roomNumber}` : `Vacated room ${a.roomNumber}`,
      at: a.allocatedAt,
    })),
    ...complaints.map((c) => ({
      id: `cmp-${c.id}`,
      type: 'Complaint',
      title: `${c.title} (${c.status})`,
      at: c.createdAt,
    })),
    ...(feeDetails || []).flatMap((fee) =>
      (fee.payments || []).map((p) => ({
        id: `pay-${p.id}`,
        type: 'Fee payment',
        title: `₹${Number(p.amount || 0).toLocaleString('en-IN')} · ${fee.feeType}`,
        at: p.paidAt,
      })),
    ),
    ...attendance.map((a) => ({
      id: `att-${a.id}`,
      type: 'Attendance',
      title: a.type || a.status || 'Check-in/out',
      at: a.timestamp || a.createdAt,
    })),
  ].sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0))

  return (
    <div>
      <PageHeader
        title={student.fullName}
        subtitle={student.email}
        backTo="/app"
        actions={
          <>
            <StatusBadge tone={student.active ? 'green' : 'amber'}>
              {student.active ? 'Active' : 'Inactive'}
            </StatusBadge>
            {canSeeFees && (
              <Link
                to="/app/fees"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Manage fees
              </Link>
            )}
          </>
        }
      />

      <div className="space-y-6">
        <Card>
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Profile</h2>
          <InfoGrid
            items={[
              { label: 'Student ID', value: student.studentId },
              { label: 'Email', value: student.email },
              { label: 'Phone', value: student.phone },
              {
                label: 'Joined',
                value: student.createdAt
                  ? new Date(student.createdAt).toLocaleDateString('en-IN')
                  : undefined,
              },
            ]}
          />
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
            Contact &amp; Identity
          </h2>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Aadhar no
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                {formatAadhar(student.aadharNumber)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Parent mobile no
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                {student.parentPhone || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                WhatsApp number
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                {student.whatsappNumber || student.phone || '—'}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Address
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                {formatAddress(student)}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Room allocation</h2>
          {allocation ? (
            <InfoGrid
              items={[
                { label: 'Room', value: allocation.roomNumber },
                { label: 'Bed', value: allocation.bedLabel },
                {
                  label: 'Status',
                  value: allocation.active ? 'Active' : 'Inactive',
                },
                {
                  label: 'Allocated on',
                  value: allocation.allocatedAt
                    ? new Date(allocation.allocatedAt).toLocaleDateString('en-IN')
                    : undefined,
                },
                { label: 'Allocated by', value: allocation.allocatedByName },
              ]}
            />
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No room allocated yet.</p>
          )}
        </Card>

        {canSeeFees && (
          <Card>
            <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Fee summary</h2>
            {fees ? (
              <>
                <InfoGrid
                  items={[
                    { label: 'Total fees', value: formatCurrency(fees.totalFees) },
                    { label: 'Paid', value: formatCurrency(fees.totalPaid) },
                    { label: 'Balance', value: formatCurrency(fees.balance) },
                    { label: 'Status', value: fees.overallStatus?.replace('_', ' ') },
                  ]}
                />
                {feeDetails.length > 0 && (
                  <div className="mt-6">
                    <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Fee records</h3>
                    <Table headers={['Type', 'Year', 'Total', 'Paid', 'Balance', 'Status']}>
                      {feeDetails.map((fee) => (
                        <tr key={fee.id} className="border-t border-slate-100 dark:border-slate-800">
                          <td className="px-4 py-3 text-slate-900 dark:text-white">{fee.feeType}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{fee.academicYear}</td>
                          <td className="px-4 py-3">{formatCurrency(fee.totalAmount)}</td>
                          <td className="px-4 py-3">{formatCurrency(fee.paidAmount)}</td>
                          <td className="px-4 py-3">{formatCurrency(fee.balanceAmount)}</td>
                          <td className="px-4 py-3">
                            <StatusBadge tone={feeTone(fee.status)}>{fee.status}</StatusBadge>
                          </td>
                        </tr>
                      ))}
                    </Table>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No fee records found.</p>
            )}
          </Card>
        )}

        <Card>
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Complaints</h2>
          {complaints.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No complaints registered.</p>
          ) : (
            <Table headers={['Title', 'Status', 'Date']}>
              {complaints.map((c) => (
                <tr key={c.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 text-slate-900 dark:text-white">{c.title}</td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={complaintTone(c.status)}>
                      {c.status?.replace('_', ' ')}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : '—'}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
            Overall student history
          </h2>
          {history.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No history recorded yet.</p>
          ) : (
            <Table headers={['Type', 'Event', 'When']}>
              {history.map((h) => (
                <tr key={h.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-medium">{h.type}</td>
                  <td className="px-4 py-3 text-slate-900 dark:text-white">{h.title}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {h.at ? new Date(h.at).toLocaleString('en-IN') : '—'}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </div>
  )
}
