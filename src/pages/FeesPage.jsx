import { useCallback, useEffect, useMemo, useState } from 'react'
import { IndianRupee, Search, UserRound, Wallet } from 'lucide-react'
import { apiGet, apiPost } from '../utils/api'
import { getSession } from '../utils/auth'
import {
  ActionButton,
  Card,
  EmptyBlock,
  ErrorBlock,
  Field,
  fieldClass,
  LoadingBlock,
  PageHeader,
  StatusBadge,
  Table,
} from '../components/ui/Page'

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'CARD', label: 'Card' },
  { value: 'ONLINE', label: 'Online gateway' },
]

const FEE_TYPES = ['Hostel Fee', 'Mess Fee', 'Security Deposit', 'Late Fine', 'Other']

const emptyFeeForm = {
  feeType: 'Hostel Fee',
  academicYear: '2025-26',
  totalAmount: '',
  dueDate: '',
}

const emptyPaymentForm = {
  amount: '',
  method: 'UPI',
  referenceNote: '',
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0))
}

function feeTone(status) {
  if (status === 'PAID') return 'green'
  if (status === 'PARTIAL') return 'amber'
  return 'red'
}

function methodLabel(method) {
  return PAYMENT_METHODS.find((m) => m.value === method)?.label || method || '—'
}

function StatCard({ label, value, tone = 'slate', hint }) {
  const tones = {
    slate: 'border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/50',
    green: 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/40 dark:bg-emerald-950/30',
    amber: 'border-amber-200 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/30',
    red: 'border-red-200 bg-red-50/80 dark:border-red-900/40 dark:bg-red-950/30',
    teal: 'border-teal-200 bg-teal-50/80 dark:border-teal-900/40 dark:bg-teal-950/30',
  }
  return (
    <div className={`rounded-xl border p-4 ${tones[tone] || tones.slate}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  )
}

export default function FeesPage() {
  const role = getSession()?.role
  const canManage = role === 'SUPER_ADMIN' || role === 'ADMIN'

  const [overview, setOverview] = useState(null)
  const [students, setStudents] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [studentFees, setStudentFees] = useState([])
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showFeeForm, setShowFeeForm] = useState(false)
  const [feeForm, setFeeForm] = useState(emptyFeeForm)
  const [paymentFeeId, setPaymentFeeId] = useState(null)
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm)
  const [saving, setSaving] = useState(false)

  const refreshOverview = useCallback(async () => {
    const [overviewData, studentData] = await Promise.all([
      apiGet('/api/fees/overview'),
      apiGet('/api/fees/students'),
    ])
    setOverview(overviewData)
    setStudents(studentData || [])
  }, [])

  const refreshStudentFees = useCallback(async (studentId) => {
    if (!studentId) return
    setDetailLoading(true)
    try {
      setStudentFees((await apiGet(`/api/fees/students/${studentId}`)) || [])
    } catch (err) {
      setError(err.message || 'Failed to load student fees')
    } finally {
      setDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!canManage) {
      setLoading(false)
      return undefined
    }

    let alive = true
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        await refreshOverview()
      } catch (err) {
        if (alive) {
          setError(err.message || 'Failed to load fees data')
        }
      } finally {
        if (alive) setLoading(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [canManage, refreshOverview])

  useEffect(() => {
    if (!canManage || !selectedId) return undefined

    let alive = true
    ;(async () => {
      setDetailLoading(true)
      setError('')
      try {
        const data = await apiGet(`/api/fees/students/${selectedId}`)
        if (alive) setStudentFees(data || [])
      } catch (err) {
        if (alive) setError(err.message || 'Failed to load student fees')
      } finally {
        if (alive) setDetailLoading(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [canManage, selectedId])

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase()
    return students.filter((s) => {
      const matchesQuery =
        !q ||
        s.fullName?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.studentCode?.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'ALL' || s.overallStatus === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [students, query, statusFilter])

  const selectedStudent = useMemo(
    () => students.find((s) => s.studentId === selectedId) || null,
    [students, selectedId],
  )

  const handleCreateFee = async (e) => {
    e.preventDefault()
    if (!selectedId) return
    setSaving(true)
    setError('')
    try {
      await apiPost(`/api/fees/students/${selectedId}`, {
        feeType: feeForm.feeType,
        academicYear: feeForm.academicYear,
        totalAmount: Number(feeForm.totalAmount),
        dueDate: feeForm.dueDate || null,
      })
      setFeeForm(emptyFeeForm)
      setShowFeeForm(false)
      await refreshOverview()
      await refreshStudentFees(selectedId)
    } catch (err) {
      setError(err.message || 'Failed to create fee')
    } finally {
      setSaving(false)
    }
  }

  const handleRecordPayment = async (e) => {
    e.preventDefault()
    if (!paymentFeeId) return
    setSaving(true)
    setError('')
    try {
      await apiPost(`/api/fees/${paymentFeeId}/payments`, {
        amount: Number(paymentForm.amount),
        method: paymentForm.method,
        referenceNote: paymentForm.referenceNote || null,
      })
      setPaymentFeeId(null)
      setPaymentForm(emptyPaymentForm)
      await refreshOverview()
      await refreshStudentFees(selectedId)
    } catch (err) {
      setError(err.message || 'Failed to record payment')
    } finally {
      setSaving(false)
    }
  }

  if (!canManage) {
    return (
      <div>
        <PageHeader title="Fees" subtitle="Fee management is available to administrators only." />
        <EmptyBlock message="You do not have permission to view this page." />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Fees management"
        subtitle="Track student fee structure, payments, deposits, and outstanding balances."
      />

      {error && (
        <div className="mb-4">
          <ErrorBlock
            message={error}
            onRetry={() => {
              if (canManage) {
                refreshOverview().catch((err) => setError(err.message || 'Failed to load fees data'))
              }
            }}
          />
        </div>
      )}

      {loading && <LoadingBlock label="Loading fee overview…" />}

      {!loading && overview && (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total students"
              value={overview.totalStudents}
              tone="slate"
              hint={`${overview.fullyPaidStudents} fully paid`}
            />
            <StatCard
              label="Collected"
              value={formatCurrency(overview.totalCollected)}
              tone="green"
              hint={`Expected ${formatCurrency(overview.totalExpected)}`}
            />
            <StatCard
              label="Outstanding"
              value={formatCurrency(overview.totalOutstanding)}
              tone="amber"
              hint={`${overview.partialStudents} partial · ${overview.pendingStudents} pending`}
            />
            <StatCard
              label="Payment status"
              value={`${overview.fullyPaidStudents}/${overview.totalStudents}`}
              tone="teal"
              hint="Students fully paid"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="p-0 overflow-hidden">
              <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                <div className="mb-3 flex items-center gap-2">
                  <UserRound className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Students</h2>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      className={`${fieldClass} pl-9`}
                      placeholder="Search name, email, or student ID"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  <select
                    className={fieldClass}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All statuses</option>
                    <option value="PAID">Fully paid</option>
                    <option value="PARTIAL">Partial</option>
                    <option value="PENDING">Pending</option>
                  </select>
                </div>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="p-4">
                  <EmptyBlock message="No students match your filters." />
                </div>
              ) : (
                <Table headers={['Student', 'Total', 'Paid', 'Balance', 'Status', 'Last method']}>
                  {filteredStudents.map((student) => {
                    const active = selectedId === student.studentId
                    return (
                      <tr
                        key={student.studentId}
                        className={[
                          'cursor-pointer transition-colors',
                          active
                            ? 'bg-primary/5 dark:bg-primary/10'
                            : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40',
                        ].join(' ')}
                        onClick={() => setSelectedId(student.studentId)}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900 dark:text-white">{student.fullName}</p>
                          <p className="text-xs text-slate-500">{student.studentCode || student.email}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {formatCurrency(student.totalFees)}
                        </td>
                        <td className="px-4 py-3 text-emerald-700 dark:text-emerald-300">
                          {formatCurrency(student.totalPaid)}
                        </td>
                        <td className="px-4 py-3 text-amber-700 dark:text-amber-300">
                          {formatCurrency(student.balance)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge tone={feeTone(student.overallStatus)}>{student.overallStatus}</StatusBadge>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {methodLabel(student.lastPaymentMethod)}
                        </td>
                      </tr>
                    )
                  })}
                </Table>
              )}
            </Card>

            <Card>
              {!selectedStudent ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                  <Wallet className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Select a student to view fee structure, deposits, and payment history.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {selectedStudent.fullName}
                      </h2>
                      <p className="text-sm text-slate-500">{selectedStudent.email}</p>
                    </div>
                    <ActionButton onClick={() => setShowFeeForm(true)}>Add fee</ActionButton>
                  </div>

                  <div className="mb-4 grid gap-3 sm:grid-cols-3">
                    <StatCard label="Total fees" value={formatCurrency(selectedStudent.totalFees)} />
                    <StatCard label="Paid" value={formatCurrency(selectedStudent.totalPaid)} tone="green" />
                    <StatCard label="Balance" value={formatCurrency(selectedStudent.balance)} tone="amber" />
                  </div>

                  {showFeeForm && (
                    <form onSubmit={handleCreateFee} className="mb-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                      <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">New fee record</h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Fee type">
                          <select
                            className={fieldClass}
                            value={feeForm.feeType}
                            onChange={(e) => setFeeForm({ ...feeForm, feeType: e.target.value })}
                          >
                            {FEE_TYPES.map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Academic year">
                          <input
                            className={fieldClass}
                            required
                            value={feeForm.academicYear}
                            onChange={(e) => setFeeForm({ ...feeForm, academicYear: e.target.value })}
                          />
                        </Field>
                        <Field label="Total amount (₹)">
                          <input
                            type="number"
                            min="1"
                            className={fieldClass}
                            required
                            value={feeForm.totalAmount}
                            onChange={(e) => setFeeForm({ ...feeForm, totalAmount: e.target.value })}
                          />
                        </Field>
                        <Field label="Due date">
                          <input
                            type="date"
                            className={fieldClass}
                            value={feeForm.dueDate}
                            onChange={(e) => setFeeForm({ ...feeForm, dueDate: e.target.value })}
                          />
                        </Field>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <ActionButton type="submit" disabled={saving}>
                          {saving ? 'Saving…' : 'Create fee'}
                        </ActionButton>
                        <ActionButton variant="ghost" onClick={() => setShowFeeForm(false)}>Cancel</ActionButton>
                      </div>
                    </form>
                  )}

                  {detailLoading && <LoadingBlock label="Loading fee details…" />}

                  {!detailLoading && studentFees.length === 0 && (
                    <EmptyBlock message="No fee records for this student yet." />
                  )}

                  {!detailLoading && studentFees.length > 0 && (
                    <div className="space-y-4">
                      {studentFees.map((fee) => (
                        <div
                          key={fee.id}
                          className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                        >
                          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <IndianRupee className="h-4 w-4 text-primary" />
                                <p className="font-semibold text-slate-900 dark:text-white">{fee.feeType}</p>
                                <StatusBadge tone={feeTone(fee.status)}>{fee.status}</StatusBadge>
                              </div>
                              <p className="mt-1 text-xs text-slate-500">
                                {fee.academicYear}
                                {fee.dueDate ? ` · Due ${new Date(fee.dueDate).toLocaleDateString('en-IN')}` : ''}
                              </p>
                            </div>
                            <div className="text-right text-sm">
                              <p className="text-slate-500">Total {formatCurrency(fee.totalAmount)}</p>
                              <p className="text-emerald-700 dark:text-emerald-300">Paid {formatCurrency(fee.paidAmount)}</p>
                              <p className="font-medium text-amber-700 dark:text-amber-300">
                                Balance {formatCurrency(fee.balanceAmount)}
                              </p>
                            </div>
                          </div>

                          {fee.balanceAmount > 0 && (
                            <div className="mb-3">
                              {paymentFeeId === fee.id ? (
                                <form onSubmit={handleRecordPayment} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Record payment
                                  </p>
                                  <div className="grid gap-2 sm:grid-cols-3">
                                    <input
                                      type="number"
                                      min="1"
                                      max={fee.balanceAmount}
                                      className={fieldClass}
                                      placeholder="Amount"
                                      required
                                      value={paymentForm.amount}
                                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                    />
                                    <select
                                      className={fieldClass}
                                      value={paymentForm.method}
                                      onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                                    >
                                      {PAYMENT_METHODS.map((m) => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                      ))}
                                    </select>
                                    <input
                                      className={fieldClass}
                                      placeholder="Reference / note"
                                      value={paymentForm.referenceNote}
                                      onChange={(e) => setPaymentForm({ ...paymentForm, referenceNote: e.target.value })}
                                    />
                                  </div>
                                  <div className="mt-2 flex gap-2">
                                    <ActionButton type="submit" disabled={saving}>
                                      {saving ? 'Saving…' : 'Save payment'}
                                    </ActionButton>
                                    <ActionButton
                                      variant="ghost"
                                      onClick={() => {
                                        setPaymentFeeId(null)
                                        setPaymentForm(emptyPaymentForm)
                                      }}
                                    >
                                      Cancel
                                    </ActionButton>
                                  </div>
                                </form>
                              ) : (
                                <ActionButton variant="success" onClick={() => setPaymentFeeId(fee.id)}>
                                  Record payment
                                </ActionButton>
                              )}
                            </div>
                          )}

                          {(fee.payments?.length ?? 0) > 0 ? (
                            <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800">
                              <table className="min-w-full text-left text-xs">
                                <thead className="bg-slate-50 dark:bg-slate-800/60">
                                  <tr>
                                    <th className="px-3 py-2 font-semibold text-slate-500">Date</th>
                                    <th className="px-3 py-2 font-semibold text-slate-500">Amount</th>
                                    <th className="px-3 py-2 font-semibold text-slate-500">Method</th>
                                    <th className="px-3 py-2 font-semibold text-slate-500">Reference</th>
                                    <th className="px-3 py-2 font-semibold text-slate-500">Recorded by</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {fee.payments.map((payment) => (
                                    <tr key={payment.id}>
                                      <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                                        {payment.paidAt
                                          ? new Date(payment.paidAt).toLocaleString('en-IN')
                                          : '—'}
                                      </td>
                                      <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">
                                        {formatCurrency(payment.amount)}
                                      </td>
                                      <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                                        {methodLabel(payment.method)}
                                      </td>
                                      <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                                        {payment.referenceNote || '—'}
                                      </td>
                                      <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                                        {payment.recordedByName || '—'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500">No payments recorded yet.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
