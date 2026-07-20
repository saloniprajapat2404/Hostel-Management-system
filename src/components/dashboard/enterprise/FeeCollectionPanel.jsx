import { memo, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const TABS = [
  { key: 'expected', label: 'Expected' },
  { key: 'collected', label: 'Collected' },
  { key: 'due', label: 'Due' },
]

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`
}

function statusTone(status) {
  if (status === 'PAID' || status === 'FULLY_PAID') return 'text-emerald-600'
  if (status === 'PARTIAL') return 'text-amber-600'
  return 'text-red-600'
}

function filterStudents(students, tab) {
  if (tab === 'due') return students.filter((s) => Number(s.balance || 0) > 0)
  if (tab === 'collected') return students.filter((s) => Number(s.totalPaid || 0) > 0)
  return students
}

function FeeCollectionPanel({ students = [], loading = false }) {
  const [tab, setTab] = useState('due')

  const expectedTotal = useMemo(
    () => students.reduce((sum, s) => sum + Number(s.totalFees || 0), 0),
    [students],
  )
  const collectedTotal = useMemo(
    () => students.reduce((sum, s) => sum + Number(s.totalPaid || 0), 0),
    [students],
  )
  const dueTotal = useMemo(
    () => students.reduce((sum, s) => sum + Number(s.balance || 0), 0),
    [students],
  )

  const filtered = useMemo(() => filterStudents(students, tab), [students, tab])

  if (loading) {
    return (
      <section>
        <h3 className="dashboard-section-label">Fee collection</h3>
        <div className="dashboard-surface-card h-64 animate-pulse" />
      </section>
    )
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="dashboard-section-label mb-0">Fee collection</h3>
        <Link to="/app/fees" className="text-[12px] font-medium text-[#3B82F6] hover:underline">
          Open fees →
        </Link>
      </div>
      <div className="dashboard-surface-card overflow-hidden">
        <div className="grid grid-cols-3 gap-2 border-b px-3 py-3" style={{ borderColor: 'var(--dash-border-subtle)' }}>
          <div>
            <p className="text-[11px] text-[var(--dash-muted)]">Expected fees</p>
            <p className="text-[14px] font-semibold tabular-nums">{formatCurrency(expectedTotal)}</p>
            <p className="text-[11px] text-[var(--dash-muted)]">{students.length} students</p>
          </div>
          <div>
            <p className="text-[11px] text-[var(--dash-muted)]">Collected fees</p>
            <p className="text-[14px] font-semibold tabular-nums text-emerald-600">
              {formatCurrency(collectedTotal)}
            </p>
            <p className="text-[11px] text-[var(--dash-muted)]">
              {filterStudents(students, 'collected').length} paid
            </p>
          </div>
          <div>
            <p className="text-[11px] text-[var(--dash-muted)]">Due fees</p>
            <p className="text-[14px] font-semibold tabular-nums text-red-600">{formatCurrency(dueTotal)}</p>
            <p className="text-[11px] text-[var(--dash-muted)]">{filterStudents(students, 'due').length} pending</p>
          </div>
        </div>

        <div className="flex gap-1 border-b px-2 py-2" style={{ borderColor: 'var(--dash-border-subtle)' }}>
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={[
                'rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors',
                tab === key
                  ? 'bg-[var(--dash-hover)] text-[var(--dash-text)]'
                  : 'text-[var(--dash-muted)] hover:text-[var(--dash-text)]',
              ].join(' ')}
            >
              {label} ({filterStudents(students, key).length})
            </button>
          ))}
        </div>

        <div className="max-h-[280px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-[13px] text-[var(--dash-muted)]">
              No students in this category.
            </p>
          ) : (
            <ul className="divide-y divide-[color:var(--dash-border-subtle)]">
              {filtered.map((s) => (
                <li key={s.studentId}>
                  <Link
                    to={`/app/fees?student=${s.studentId}`}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 transition-colors hover:bg-[var(--dash-hover)]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-[var(--dash-text)]">{s.fullName}</p>
                      <p className="truncate text-[11px] text-[var(--dash-muted)]">
                        {s.studentCode || s.email}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`text-[12px] font-semibold tabular-nums ${statusTone(s.overallStatus)}`}>
                        {tab === 'expected' && `Expected ${formatCurrency(s.totalFees)}`}
                        {tab === 'collected' && `Paid ${formatCurrency(s.totalPaid)}`}
                        {tab === 'due' && `Due ${formatCurrency(s.balance)}`}
                      </p>
                      <p className="text-[11px] text-[var(--dash-muted)]">
                        Balance {formatCurrency(s.balance)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}

export default memo(FeeCollectionPanel)
