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

const CATEGORIES = ['Maintenance', 'Utilities', 'Supplies', 'Staff', 'Mess', 'Other']

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0))
}

export default function ExpensesPage() {
  const canManage = getSession()?.role === 'SUPER_ADMIN'
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    category: 'Maintenance',
    amount: '',
    expenseDate: new Date().toISOString().slice(0, 10),
    notes: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setItems((await apiGet('/api/expenses')) || [])
    } catch (err) {
      setError(err.message || 'Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const { search, setSearch, sortKey, setSortKey, sortDir, setSortDir, filtered } = useListControls(items, {
    searchKeys: ['title', 'category', 'notes', 'createdByName'],
    initialSortKey: 'expenseDate',
    getSortValue: (item, key) => {
      if (key === 'amount') return Number(item.amount || 0)
      return item[key]
    },
  })

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await apiPost('/api/expenses', {
        title: form.title.trim(),
        category: form.category,
        amount: Number(form.amount),
        expenseDate: form.expenseDate,
        notes: form.notes.trim() || null,
      })
      setShowForm(false)
      setForm({
        title: '',
        category: 'Maintenance',
        amount: '',
        expenseDate: new Date().toISOString().slice(0, 10),
        notes: '',
      })
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
    <div>
      <PageHeader
        title="Expenses"
        subtitle="Hostel expense tracking for finance."
        actions={
          canManage ? (
            <ActionButton onClick={() => setShowForm(true)}>Add expense</ActionButton>
          ) : null
        }
      />

      {error && (
        <div className="mb-4">
          <ErrorBlock message={error} onRetry={load} />
        </div>
      )}
      {loading && <LoadingBlock />}

      {showForm && canManage && (
        <Card className="mb-6">
          <h2 className="mb-4 text-lg font-semibold">New expense</h2>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
            <Field label="Title">
              <input
                className={fieldClass}
                required
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
            </Field>
            <Field label="Category">
              <select
                className={fieldClass}
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Amount (₹)">
              <input
                className={fieldClass}
                type="number"
                min="1"
                step="1"
                required
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              />
            </Field>
            <Field label="Date">
              <input
                className={fieldClass}
                type="date"
                required
                value={form.expenseDate}
                onChange={(e) => setForm((p) => ({ ...p, expenseDate: e.target.value }))}
              />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <textarea
                className={`${fieldClass} min-h-20`}
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              />
            </Field>
            <div className="flex gap-2 sm:col-span-2">
              <ActionButton type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save expense'}
              </ActionButton>
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-700"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      {!loading && (
        <>
          <ListToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search expenses…"
            sortOptions={[
              { value: 'expenseDate', label: 'Sort by date' },
              { value: 'amount', label: 'Sort by amount' },
              { value: 'title', label: 'Sort by title' },
              { value: 'category', label: 'Sort by category' },
            ]}
            sortKey={sortKey}
            sortDir={sortDir}
            onSortKeyChange={setSortKey}
            onSortDirChange={setSortDir}
          />

          {filtered.length === 0 ? (
            <EmptyBlock message="No expenses found." />
          ) : (
            <Table headers={['Title', 'Category', 'Amount', 'Date', 'Added by', '']}>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{item.title}</td>
                  <td className="px-4 py-3">{item.category}</td>
                  <td className="px-4 py-3">{formatCurrency(item.amount)}</td>
                  <td className="px-4 py-3">{item.expenseDate}</td>
                  <td className="px-4 py-3">{item.createdByName || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {canManage && (
                      <button
                        type="button"
                        className="text-sm font-medium text-red-600 hover:underline"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </button>
                    )}
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
