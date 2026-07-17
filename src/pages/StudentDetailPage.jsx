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

  const { student, allocation, complaints, fees, feeDetails } = data
  const address = [student.addressLine, student.city, student.state, student.pincode]
    .filter(Boolean)
    .join(', ')

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
              { label: 'Aadhar', value: student.aadharNumber },
              { label: 'Address', value: address },
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
      </div>
    </div>
  )
}
