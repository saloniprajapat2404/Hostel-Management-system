import { Link } from 'react-router-dom'

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`
}

function statusTone(status) {
  if (status === 'PAID' || status === 'FULLY_PAID') return 'text-emerald-600'
  if (status === 'PARTIAL') return 'text-amber-600'
  return 'text-red-600'
}

export default function FeeCollectionPanel({ students = [], loading = false }) {
  if (loading) {
    return (
      <section>
        <h3 className="dashboard-section-label">Fee collection</h3>
        <div className="dashboard-surface-card h-64 animate-pulse" />
      </section>
    )
  }

  const due = students.filter((s) => Number(s.balance || 0) > 0)
  const collected = students.filter((s) => Number(s.totalPaid || 0) > 0)
  const expectedTotal = students.reduce((sum, s) => sum + Number(s.totalFees || 0), 0)
  const collectedTotal = students.reduce((sum, s) => sum + Number(s.totalPaid || 0), 0)
  const dueTotal = students.reduce((sum, s) => sum + Number(s.balance || 0), 0)

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
            <p className="text-[11px] text-[var(--dash-muted)]">Expected</p>
            <p className="text-[14px] font-semibold tabular-nums">{formatCurrency(expectedTotal)}</p>
            <p className="text-[11px] text-[var(--dash-muted)]">{students.length} students</p>
          </div>
          <div>
            <p className="text-[11px] text-[var(--dash-muted)]">Collected</p>
            <p className="text-[14px] font-semibold tabular-nums text-emerald-600">
              {formatCurrency(collectedTotal)}
            </p>
            <p className="text-[11px] text-[var(--dash-muted)]">{collected.length} paid</p>
          </div>
          <div>
            <p className="text-[11px] text-[var(--dash-muted)]">Due</p>
            <p className="text-[14px] font-semibold tabular-nums text-red-600">{formatCurrency(dueTotal)}</p>
            <p className="text-[11px] text-[var(--dash-muted)]">{due.length} pending</p>
          </div>
        </div>

        <div className="max-h-[280px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {students.length === 0 ? (
            <p className="px-3 py-8 text-center text-[13px] text-[var(--dash-muted)]">No fee records yet.</p>
          ) : (
            <ul className="divide-y divide-[color:var(--dash-border-subtle)]">
              {students.map((s) => (
                <li key={s.studentId}>
                  <Link
                    to={`/app/students/${s.studentId}`}
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
                        Due {formatCurrency(s.balance)}
                      </p>
                      <p className="text-[11px] text-[var(--dash-muted)]">
                        Paid {formatCurrency(s.totalPaid)}
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
