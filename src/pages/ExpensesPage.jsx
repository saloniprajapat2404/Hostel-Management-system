import { useCallback, useEffect, useState } from 'react'
import { apiDelete, apiGet, apiPost } from '../utils/api'
import { getSession } from '../utils/auth'
import ListToolbar, { useListControls } from '../components/ListToolbar'
import {
  ActionButton,
  Card,
  EmptyBlock,
  ErrorBlock,
  Field,
  fieldClass,
  LoadingBlock,
  PageHeader,
  Table,
} from '../components/ui/Page'

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

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50/80 p-4 dark:border-red-900/40 dark:bg-red-950/30">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  )
}

export default function ExpensesPage() {
  const role = getSession()?.role
  const canManage = role === 'SUPER_ADMIN'

  const [items, setItems] = useState([])
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const load = useCallback(async () => {
    if (!canManage) {
      setLoading(false)
      return
    }
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
  }, [canManage])

  useEffect(() => {
    load()
  }, [load])

  const { search, setSearch, sortKey, setSortKey, sortDir, setSortDir, filtered } = useListControls(items, {
    searchKeys: ['category', 'description', 'recordedByName', 'amount', 'expenseDate'],
    initialSortKey: 'expenseDate',
    getSortValue: (item, key) => {
      if (key === 'amount') return Number(item.amount || 0)
      if (key === 'expenseDate') return item.expenseDate || ''
      return item[key]
    },
  })

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
      setShowForm(false)
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

  if (!canManage) {
    return (
      <div>
        <PageHeader
          title="Expenses"
          subtitle="Expense tracking is available to Super Admin only."
        />
        <EmptyBlock message="You do not have permission to view this page." />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle="Hostel expense tracking for finance."
        actions={
          <ActionButton onClick={() => setShowForm(true)}>Add expense</ActionButton>
        }
      />

      {error && (
        <div className="mb-4">
          <ErrorBlock message={error} onRetry={load} />
        </div>
      )}
      {loading && <LoadingBlock label="Loading expenses…" />}

      {!loading && (
        <div className="mb-6 max-w-sm">
          <StatCard
            label="Total expenses"
            value={formatCurrency(totalExpenses)}
            hint={`${items.length} recorded expense${items.length === 1 ? '' : 's'}`}
          />
        </div>
      )}

      {showForm && (
        <Card className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">New expense</h2>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" required>
              <select
                className={fieldClass}
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date" required>
              <input
                className={fieldClass}
                type="date"
                required
                value={form.expenseDate}
                onChange={(e) => setForm((p) => ({ ...p, expenseDate: e.target.value }))}
              />
            </Field>
            <Field label="Amount (₹)" required>
              <input
                className={`${fieldClass} input-no-spinner`}
                type="number"
                min="1"
                step="1"
                inputMode="decimal"
                required
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                placeholder="Enter amount"
              />
            </Field>
            <Field label="Description">
              <input
                className={fieldClass}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Optional details"
              />
            </Field>
            <div className="flex gap-2 sm:col-span-2">
              <ActionButton type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save expense'}
              </ActionButton>
              <ActionButton variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </ActionButton>
            </div>
          </form>
        </Card>
      )}

      {!loading && (
        <>
          <ListToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search category, description…"
            sortOptions={[
              { value: 'expenseDate', label: 'Sort by date' },
              { value: 'amount', label: 'Sort by amount' },
              { value: 'category', label: 'Sort by category' },
              { value: 'description', label: 'Sort by description' },
              { value: 'recordedByName', label: 'Sort by recorded by' },
            ]}
            sortKey={sortKey}
            sortDir={sortDir}
            onSortKeyChange={setSortKey}
            onSortDirChange={setSortDir}
          />

          {filtered.length === 0 ? (
            <EmptyBlock
              message={
                items.length === 0
                  ? 'No expenses recorded yet.'
                  : 'No expenses match your search.'
              }
            />
          ) : (
            <Table headers={['Date', 'Category', 'Description', 'Amount', 'Recorded by', '']}>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {formatDate(item.expenseDate)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {item.category}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {item.description || '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-red-700 dark:text-red-300">
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {item.recordedByName || '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ActionButton variant="danger" onClick={() => handleDelete(item.id)}>
                      Delete
                    </ActionButton>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </>
      )}
    </div>
  )
}
