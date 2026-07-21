import { useCallback, useEffect, useState } from 'react'
import { Receipt } from 'lucide-react'
import { apiDelete, apiGet, apiPost } from '../../../utils/api'
import { fieldClass } from '../../ui/Page'

const EXPENSE_CATEGORIES = ['Maintenance', 'Utilities', 'Staff', 'Supplies', 'Other']

const emptyForm = {
  category: 'Maintenance',
  description: '',
  amount: '',
  expenseDate: new Date().toISOString().slice(0, 10),
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0))
}

function formatDate(dateStr) {
  return dateStr ? new Date(dateStr).toLocaleDateString('en-IN') : '—'
}

export default function ExpensesDashboardPanel({ open, onClose }) {
  const [items, setItems] = useState([])
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [expenses, total] = await Promise.all([
        apiGet('/api/expenses'),
        apiGet('/api/expenses/total'),
      ])
      setItems(expenses || [])
      setTotalExpenses(Number(total?.totalExpenses || 0))
    } catch (err) {
      setError(err.message || 'Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) load()
  }, [open, load])

  if (!open) return null

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await apiPost('/api/expenses', {
        category: form.category,
        description: form.description.trim() || null,
        amount: Number(form.amount),
        expenseDate: form.expenseDate,
      })
      setForm(emptyForm)
      await load()
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return
    try {
      await apiDelete(`/api/expenses/${id}`)
      await load()
    } catch (err) {
      setError(err.message || 'Delete failed')
    }
  }

  return (
    <section id="dashboard-expenses" className="dashboard-surface-card overflow-hidden p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-[10px]"
            style={{ background: 'color-mix(in srgb, #EF4444 15%, transparent)', color: '#EF4444' }}
          >
            <Receipt className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-[15px] font-semibold text-[var(--dash-text)]">Expenses</h3>
            <p className="text-[12px] text-[var(--dash-muted)]">
              Total {formatCurrency(totalExpenses)} · {items.length} recorded
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-[12px] font-medium text-[var(--dash-muted)] transition-colors hover:bg-[var(--dash-hover)] hover:text-[var(--dash-text)]"
        >
          Close
        </button>
      </div>

      {error && (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      )}

      <form onSubmit={handleCreate} className="mb-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-[12px] font-medium text-[var(--dash-muted)]">
          Category <span className="text-red-500">*</span>
          <select
            className={`${fieldClass} mt-1`}
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[12px] font-medium text-[var(--dash-muted)]">
          Date <span className="text-red-500">*</span>
          <input
            type="date"
            className={`${fieldClass} mt-1`}
            required
            value={form.expenseDate}
            onChange={(e) => setForm((p) => ({ ...p, expenseDate: e.target.value }))}
          />
        </label>
        <label className="block text-[12px] font-medium text-[var(--dash-muted)]">
          Amount (₹) <span className="text-red-500">*</span>
          <input
            type="number"
            min="1"
            step="1"
            className={`${fieldClass} mt-1`}
            required
            value={form.amount}
            onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
          />
        </label>
        <label className="block text-[12px] font-medium text-[var(--dash-muted)]">
          Description
          <input
            className={`${fieldClass} mt-1`}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Optional details"
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-[10px] bg-[#3B82F6] px-4 py-2 text-[12px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Add expense'}
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-[12px] text-[var(--dash-muted)]">Loading expenses…</p>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-[12px] text-[var(--dash-muted)]" style={{ borderColor: 'var(--dash-border-subtle)' }}>
          No expenses recorded yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[10px] border" style={{ borderColor: 'var(--dash-border-subtle)' }}>
          <table className="min-w-full text-left text-[12px]">
            <thead className="bg-[var(--dash-hover)]">
              <tr>
                <th className="px-3 py-2 font-semibold text-[var(--dash-muted)]">Date</th>
                <th className="px-3 py-2 font-semibold text-[var(--dash-muted)]">Category</th>
                <th className="px-3 py-2 font-semibold text-[var(--dash-muted)]">Description</th>
                <th className="px-3 py-2 font-semibold text-[var(--dash-muted)]">Amount</th>
                <th className="px-3 py-2 font-semibold text-[var(--dash-muted)]">By</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t" style={{ borderColor: 'var(--dash-border-subtle)' }}>
                  <td className="px-3 py-2 text-[var(--dash-muted)]">{formatDate(item.expenseDate)}</td>
                  <td className="px-3 py-2 font-medium text-[var(--dash-text)]">{item.category}</td>
                  <td className="px-3 py-2 text-[var(--dash-muted)]">{item.description || '—'}</td>
                  <td className="px-3 py-2 font-medium text-red-600 dark:text-red-400">
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="px-3 py-2 text-[var(--dash-muted)]">{item.recordedByName || '—'}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="text-[11px] font-medium text-red-600 hover:underline dark:text-red-400"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
