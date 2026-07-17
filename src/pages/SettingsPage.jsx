import { useCallback, useEffect, useState } from 'react'
import { apiGet, apiPut } from '../utils/api'
import {
  BRANDING_KEYS,
  pickBrandingValues,
  useHostelConfig,
} from '../context/HostelConfigContext'
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

const SETTING_LABELS = {
  hostelName: 'Hostel name',
  systemName: 'System name',
  totalRooms: 'Total rooms (reference)',
  bedsPerRoom: 'Beds per room (reference)',
}

function settingLabel(key) {
  return SETTING_LABELS[key] ?? key
}

function BrandingPreview({ hostelName, systemName }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Live preview
      </p>
      <p className="mt-2 text-base font-bold text-slate-900 dark:text-white">{hostelName || '—'}</p>
      <p className="text-sm text-primary dark:text-primary-light">{systemName || '—'}</p>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        Updates sidebar, login page, browser tab, and footer after save.
      </p>
    </div>
  )
}

export default function SettingsPage() {
  const { refreshConfig, applyConfig, hostelName, systemName } = useHostelConfig()
  const [settings, setSettings] = useState([])
  const [values, setValues] = useState({})
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')

  const mergeBrandingDefaults = useCallback(
    (map) => ({
      ...map,
      hostelName: map.hostelName ?? hostelName,
      systemName: map.systemName ?? systemName,
    }),
    [hostelName, systemName],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = (await apiGet('/api/settings')) || []
      const map = {}
      for (const s of data) map[s.key] = s.value
      const merged = mergeBrandingDefaults(map)
      setSettings(data)
      setValues(merged)
    } catch (err) {
      setError(err.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [mergeBrandingDefaults])

  useEffect(() => {
    load()
  }, [load])

  const persistBranding = (nextValues) => {
    applyConfig(pickBrandingValues(nextValues))
  }

  const handleSaveAll = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = mergeBrandingDefaults(values)
      await apiPut('/api/settings', payload)
      persistBranding(payload)
      setSuccess('Settings saved. Hostel name updated everywhere in the app.')
      await refreshConfig()
      await load()
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBranding = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const branding = pickBrandingValues(values)
      await apiPut('/api/settings', branding)
      persistBranding(branding)
      setSuccess('Branding saved. Hostel name updated everywhere in the app.')
      await refreshConfig()
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
      if (BRANDING_KEYS.includes(newKey.trim())) {
        persistBranding({ ...values, [newKey.trim()]: newValue })
      }
      setNewKey('')
      setNewValue('')
      setSuccess('Setting added.')
      await refreshConfig()
      await load()
    } catch (err) {
      setError(err.message || 'Add failed')
    } finally {
      setSaving(false)
    }
  }

  const otherSettings = settings.filter((s) => !BRANDING_KEYS.includes(s.key))
  const previewHostelName = values.hostelName ?? hostelName
  const previewSystemName = values.systemName ?? systemName

  return (
    <div>
      <PageHeader title="Settings" subtitle="System configuration and branding." />

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
            <h2 className="mb-4 text-lg font-semibold">Branding</h2>
            <form onSubmit={handleSaveBranding} className="space-y-4">
              {BRANDING_KEYS.map((key) => (
                <Field key={key} label={settingLabel(key)}>
                  <input
                    className={fieldClass}
                    value={values[key] ?? ''}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                </Field>
              ))}
              <BrandingPreview hostelName={previewHostelName} systemName={previewSystemName} />
              <ActionButton type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save branding'}
              </ActionButton>
            </form>
          </Card>

          <div className="space-y-6">
            <Card>
              <h2 className="mb-4 text-lg font-semibold">Other settings</h2>
              {otherSettings.length === 0 ? (
                <EmptyBlock message="No other settings yet." />
              ) : (
                <form onSubmit={handleSaveAll} className="space-y-4">
                  {otherSettings.map((s) => (
                    <Field key={s.key} label={settingLabel(s.key)}>
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
        </div>
      )}
    </div>
  )
}
