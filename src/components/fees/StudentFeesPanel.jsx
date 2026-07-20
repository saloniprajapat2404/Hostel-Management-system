import { useCallback, useEffect, useMemo, useState } from 'react'
import { IndianRupee } from 'lucide-react'
import { apiGet } from '../../utils/api'
import { Card, ErrorBlock, LoadingBlock, StatusBadge } from '../ui/Page'

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
  if (method === 'CASH') return 'Cash'
  if (method === 'ONLINE' || method === 'UPI' || method === 'BANK_TRANSFER' || method === 'CARD') return 'Online'
  return method || '—'
}

export default function StudentFeesPanel({ title = 'Fees details', showHeading = true }) {
  const [fees, setFees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setFees((await apiGet('/api/users/me/fees')) || [])
    } catch (err) {
      setError(err.message || 'Failed to load fees')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const feeSummary = useMemo(() => {
    const total = fees.reduce((sum, f) => sum + Number(f.totalAmount || 0), 0)
    const paid = fees.reduce((sum, f) => sum + Number(f.paidAmount || 0), 0)
    return { total, paid, balance: Math.max(0, total - paid) }
  }, [fees])

  if (loading) return <LoadingBlock label="Loading fees…" />

  return (
    <Card>
      {error && (
        <div className="mb-4">
          <ErrorBlock message={error} onRetry={load} />
        </div>
      )}

      {showHeading && (
        <div className="mb-4 flex items-center gap-2">
          <IndianRupee className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
        </div>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total fees</p>
          <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(feeSummary.total)}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Paid</p>
          <p className="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(feeSummary.paid)}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">Balance</p>
          <p className="mt-1 text-xl font-bold text-amber-700 dark:text-amber-300">{formatCurrency(feeSummary.balance)}</p>
        </div>
      </div>

      {fees.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No fee records found.</p>
      ) : (
        <div className="space-y-4">
          {fees.map((fee) => (
            <div
              key={fee.id}
              className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"
            >
              <div className="grid gap-2 bg-slate-50/80 px-4 py-3 text-sm dark:bg-slate-800/40 sm:grid-cols-6 sm:items-center">
                <div className="sm:col-span-2">
                  <p className="font-medium text-slate-900 dark:text-white">{fee.feeType}</p>
                  <p className="text-xs text-slate-500">{fee.academicYear}</p>
                </div>
                <p className="text-slate-600 dark:text-slate-300">{formatCurrency(fee.totalAmount)}</p>
                <p className="text-emerald-700 dark:text-emerald-300">{formatCurrency(fee.paidAmount)}</p>
                <p className="text-amber-700 dark:text-amber-300">{formatCurrency(fee.balanceAmount)}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={feeTone(fee.status)}>{fee.status}</StatusBadge>
                  {fee.dueDate && (
                    <span className="text-xs text-slate-500">
                      Due {new Date(fee.dueDate).toLocaleDateString('en-IN')}
                    </span>
                  )}
                </div>
              </div>

              {(fee.payments?.length ?? 0) > 0 ? (
                <div className="overflow-x-auto border-t border-slate-200 dark:border-slate-700">
                  <table className="min-w-full text-left text-xs">
                    <thead className="bg-white dark:bg-slate-900">
                      <tr>
                        <th className="px-4 py-2 font-semibold text-slate-500">Payment date</th>
                        <th className="px-4 py-2 font-semibold text-slate-500">Amount</th>
                        <th className="px-4 py-2 font-semibold text-slate-500">Method</th>
                        <th className="px-4 py-2 font-semibold text-slate-500">Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {fee.payments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                            {payment.paidAt
                              ? new Date(payment.paidAt).toLocaleString('en-IN')
                              : '—'}
                          </td>
                          <td className="px-4 py-2 font-medium text-slate-900 dark:text-white">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                            {methodLabel(payment.method)}
                          </td>
                          <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                            {payment.referenceNote || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="border-t border-slate-200 px-4 py-2 text-xs text-slate-500 dark:border-slate-700">
                  No payments recorded yet for this fee.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
