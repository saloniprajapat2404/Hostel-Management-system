import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Building2, MapPin } from 'lucide-react'
import { apiGet } from '../utils/api'
import {
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
} from '../components/ui/Page'

export default function CitiesPage() {
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const list = await apiGet('/api/branches/cities')
      setCities(Array.isArray(list) ? list : [])
    } catch (err) {
      setError(err.message || 'Failed to load cities')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/superadmin"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to overview
        </Link>
      </div>

      <PageHeader
        title="Cities"
        subtitle="Open a city to view locality branches and add new campuses"
        showBack={false}
      />

      {error && <ErrorBlock message={error} onRetry={load} />}

      {loading ? (
        <LoadingBlock label="Loading cities…" />
      ) : cities.length === 0 ? (
        <EmptyBlock message="No cities yet. Add a locality branch to create the first city." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((city) => (
            <Link
              key={city.citySlug}
              to={`/superadmin/cities/${encodeURIComponent(city.city)}`}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-slate-900 group-hover:text-primary dark:text-white">
                    {city.city}
                  </h2>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                    <Building2 className="h-3.5 w-3.5" />
                    {city.branchCount} localit{city.branchCount === 1 ? 'y' : 'ies'}
                    {city.activeBranchCount != null && (
                      <span className="text-slate-400">· {city.activeBranchCount} active</span>
                    )}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
