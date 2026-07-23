import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { apiDelete, apiGet, apiPost, apiPut } from '../utils/api'
import Button from '../components/ui/Button'
import {
  ActionButton,
  Card,
  EmptyBlock,
  ErrorBlock,
  Field,
  LoadingBlock,
  PageHeader,
  StatusBadge,
  Table,
  fieldClass,
} from '../components/ui/Page'

const emptyForm = {
  name: '',
  code: '',
  slug: '',
  city: '',
  address: '',
  phone: '',
  email: '',
  status: 'ACTIVE',
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function BranchesPage() {
  const navigate = useNavigate()
  const { cityName } = useParams()
  const [searchParams] = useSearchParams()
  const cityFromRoute = cityName ? decodeURIComponent(cityName) : ''
  const cityFilter = cityFromRoute || searchParams.get('city') || ''

  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(() => ({ ...emptyForm, city: cityFilter }))
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadBranches = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const path = cityFilter
        ? `/api/branches?city=${encodeURIComponent(cityFilter)}`
        : '/api/branches'
      const list = await apiGet(path)
      setBranches(Array.isArray(list) ? list : [])
    } catch (err) {
      setError(err.message || 'Failed to load branches')
    } finally {
      setLoading(false)
    }
  }, [cityFilter])

  useEffect(() => {
    loadBranches()
  }, [loadBranches])

  useEffect(() => {
    if (!editingId) {
      setForm((prev) => ({ ...prev, city: cityFilter || prev.city }))
    }
  }, [cityFilter, editingId])

  const pageTitle = useMemo(
    () => (cityFilter ? `${cityFilter} — Locality Branches` : 'All Locality Branches'),
    [cityFilter],
  )

  const resetForm = () => {
    setForm({ ...emptyForm, city: cityFilter })
    setEditingId(null)
    setShowForm(false)
  }

  const startCreate = () => {
    setForm({ ...emptyForm, city: cityFilter })
    setEditingId(null)
    setShowForm(true)
  }

  const startEdit = (branch) => {
    setForm({
      name: branch.name || '',
      code: branch.code || '',
      slug: branch.slug || '',
      city: branch.city || cityFilter || '',
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      status: branch.status || 'ACTIVE',
    })
    setEditingId(branch.id)
    setShowForm(true)
  }

  const handleNameChange = (name) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: editingId ? prev.slug : slugify(name),
      code: editingId
        ? prev.code
        : name
            .replace(/[^a-zA-Z0-9]/g, '')
            .slice(0, 6)
            .toUpperCase() || prev.code,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        slug: form.slug.trim().toLowerCase(),
        city: form.city.trim(),
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        status: form.status,
      }
      if (editingId) {
        await apiPut(`/api/branches/${editingId}`, payload)
      } else {
        await apiPost('/api/branches', payload)
      }
      resetForm()
      await loadBranches()
      if (!cityFilter && payload.city) {
        navigate(`/superadmin/cities/${encodeURIComponent(payload.city)}`)
      }
    } catch (err) {
      setError(err.message || 'Failed to save branch')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (branch) => {
    if (!window.confirm(`Delete locality "${branch.name}" in ${branch.city}? This cannot be undone.`)) return
    setError('')
    try {
      await apiDelete(`/api/branches/${branch.id}`)
      if (editingId === branch.id) resetForm()
      await loadBranches()
    } catch (err) {
      setError(err.message || 'Failed to delete branch')
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to={cityFilter ? '/superadmin/cities' : '/superadmin'}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {cityFilter ? 'Back to cities' : 'Back to overview'}
        </Link>
      </div>

      <PageHeader
        title={pageTitle}
        subtitle={
          cityFilter
            ? `City: ${cityFilter}. Branch name = locality (e.g. Vijay Nagar). Address is shown for each campus.`
            : 'Browse all locality campuses. Prefer managing them under a city.'
        }
        showBack={false}
        actions={
          <Button type="button" className="w-auto" onClick={startCreate}>
            <Plus className="h-4 w-4" />
            Add Locality Branch
          </Button>
        }
      />

      {error && <ErrorBlock message={error} onRetry={loadBranches} />}

      {showForm && (
        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
            {editingId ? 'Edit Locality Branch' : 'New Locality Branch'}
          </h2>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <Field label="City" required>
              <input
                className={fieldClass}
                value={form.city}
                onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                required
                placeholder="Indore"
                readOnly={Boolean(cityFilter) && !editingId}
              />
            </Field>
            <Field label="Locality / Branch Name" required>
              <input
                className={fieldClass}
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                placeholder="Vijay Nagar"
              />
            </Field>
            <Field label="Code" required>
              <input
                className={fieldClass}
                value={form.code}
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                required
                maxLength={10}
                placeholder="VJN"
              />
            </Field>
            <Field label="URL Slug" required>
              <input
                className={fieldClass}
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
                required
                placeholder="vijay-nagar"
              />
            </Field>
            <Field label="Full Address" required>
              <input
                className={fieldClass}
                value={form.address}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                required
                placeholder="12, Scheme 78, Vijay Nagar, Indore"
              />
            </Field>
            <Field label="Phone">
              <input
                className={fieldClass}
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                className={fieldClass}
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </Field>
            <Field label="Status">
              <select
                className={fieldClass}
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </Field>
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <ActionButton type="submit" disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Update Branch' : 'Create Branch'}
              </ActionButton>
              <ActionButton type="button" variant="ghost" onClick={resetForm}>
                Cancel
              </ActionButton>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <LoadingBlock label="Loading locality branches…" />
      ) : branches.length === 0 ? (
        <EmptyBlock message="No locality branches found. Add the first campus for this city." />
      ) : (
        <Table headers={['Locality', 'City', 'Address', 'Code', 'Status', '']}>
          {branches.map((branch) => (
            <tr key={branch.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
              <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{branch.name}</td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{branch.city}</td>
              <td className="max-w-xs px-4 py-3 text-slate-600 dark:text-slate-300">
                {branch.address || '—'}
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{branch.code}</td>
              <td className="px-4 py-3">
                <StatusBadge tone={branch.status === 'ACTIVE' ? 'green' : 'slate'}>
                  {branch.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </StatusBadge>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <ActionButton type="button" variant="ghost" title="Edit" onClick={() => startEdit(branch)}>
                    <Pencil className="h-4 w-4" />
                  </ActionButton>
                  <ActionButton type="button" variant="danger" title="Delete" onClick={() => handleDelete(branch)}>
                    <Trash2 className="h-4 w-4" />
                  </ActionButton>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  )
}
