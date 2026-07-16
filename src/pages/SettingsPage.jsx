import { useCallback, useEffect, useState } from 'react'
import { apiGet, apiPut } from '../utils/api'
import {
  ActionButton,
  Card,
  EmptyBlock,
  ErrorBlock,
  Field,
  fieldClass,
  LoadingBlock,
  PageHeader,
} from '../components/ui/Page'

export default function SettingsPage() {
  const [settings, setSettings] = useState([])
  const [values, setValues] = useState({})
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = (await apiGet('/api/settings')) || []
      setSettings(data)
      const map = {}
      for (const s of data) map[s.key] = s.value
      setValues(map)
    } catch (err) {
      setError(err.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSaveAll = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await apiPut('/api/settings', values)
      setSuccess('Settings saved.')
      await load()
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newKey.trim()) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await apiPut('/api/settings', { key: newKey.trim(), value: newValue })
      setNewKey('')
      setNewValue('')
      setSuccess('Setting added.')
      await load()
    } catch (err) {
      setError(err.message || 'Add failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="System configuration." />

      {error && <div className="mb-4"><ErrorBlock message={error} onRetry={load} /></div>}
      {success && (
        <Card className="mb-4 border-emerald-200 dark:border-emerald-900/40">
          <p className="text-sm text-emerald-700 dark:text-emerald-300">{success}</p>
        </Card>
      )}
      {loading && <LoadingBlock />}

      {!loading && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="mb-4 text-lg font-semibold">Current settings</h2>
            {settings.length === 0 ? (
              <EmptyBlock message="No settings yet." />
            ) : (
              <form onSubmit={handleSaveAll} className="space-y-4">
                {settings.map((s) => (
                  <Field key={s.key} label={s.key}>
                    <input
                      className={fieldClass}
                      value={values[s.key] ?? ''}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [s.key]: e.target.value }))
                      }
                    />
                  </Field>
                ))}
                <ActionButton type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save all'}
                </ActionButton>
              </form>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold">Add setting</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <Field label="Key">
                <input
                  className={fieldClass}
                  required
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                />
              </Field>
              <Field label="Value">
                <input
                  className={fieldClass}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                />
              </Field>
              <ActionButton type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Add setting'}
              </ActionButton>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
