import { useCallback, useEffect, useState } from 'react'
import { apiGet } from '../utils/api'
import { getSession } from '../utils/auth'
import ListToolbar, { useListControls } from '../components/ListToolbar'
import {
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  Table,
} from '../components/ui/Page'

async function loadActivity(role) {
  const items = []
  const canSeeAdmissions = role === 'ADMIN' || role === 'SUPER_ADMIN'

  const [admissions, complaints, notices, fees] = await Promise.all([
    canSeeAdmissions ? apiGet('/api/admissions').catch(() => []) : Promise.resolve([]),
    apiGet('/api/complaints').catch(() => []),
    apiGet('/api/notices').catch(() => []),
    role === 'STUDENT' ? apiGet('/api/users/me/fees').catch(() => []) : Promise.resolve([]),
  ])

  ;(admissions || []).forEach((a) => {
    items.push({
      id: `adm-${a.id}`,
      type: 'Admission',
      title: a.status === 'APPROVED' ? 'Admission approved' : 'Admission request',
      detail: a.studentName || a.email,
      at: a.reviewedAt || a.createdAt,
    })
  })

  ;(complaints || []).forEach((c) => {
    items.push({
      id: `cmp-${c.id}`,
      type: 'Complaint',
      title: c.title,
      detail: c.status,
      at: c.createdAt,
    })
  })

  ;(notices || []).forEach((n) => {
    items.push({
      id: `ntc-${n.id}`,
      type: 'Notice',
      title: n.title,
      detail: n.createdByName || 'Staff',
      at: n.createdAt,
    })
  })

  ;(fees || []).forEach((fee) => {
    ;(fee.payments || []).forEach((p) => {
      items.push({
        id: `pay-${p.id}`,
        type: 'Fee',
        title: `Payment ₹${Number(p.amount || 0).toLocaleString('en-IN')}`,
        detail: p.feeType || fee.feeType,
        at: p.paidAt,
      })
    })
  })

  return items.sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0))
}

export default function ActivityPage() {
  const role = getSession()?.role || 'STUDENT'
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setItems(await loadActivity(role))
    } catch (err) {
      setError(err.message || 'Failed to load activity')
    } finally {
      setLoading(false)
    }
  }, [role])

  useEffect(() => {
    load()
  }, [load])

  const { search, setSearch, sortKey, setSortKey, sortDir, setSortDir, filtered } = useListControls(items, {
    searchKeys: ['title', 'detail', 'type'],
    initialSortKey: 'at',
    getSortValue: (item, key) => (key === 'at' ? new Date(item.at || 0).getTime() : item[key]),
  })

  return (
    <div>
      <PageHeader title="Activity" subtitle="Hostel-wide recent events and updates." />
      {error && (
        <div className="mb-4">
          <ErrorBlock message={error} onRetry={load} />
        </div>
      )}
      {loading && <LoadingBlock />}
      {!loading && (
        <>
          <ListToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search activity…"
            sortOptions={[
              { value: 'at', label: 'Sort by date' },
              { value: 'type', label: 'Sort by type' },
              { value: 'title', label: 'Sort by title' },
            ]}
            sortKey={sortKey}
            sortDir={sortDir}
            onSortKeyChange={setSortKey}
            onSortDirChange={setSortDir}
          />
          {filtered.length === 0 ? (
            <EmptyBlock message="No activity found." />
          ) : (
            <Table headers={['Type', 'Title', 'Detail', 'When']}>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-medium">{item.type}</td>
                  <td className="px-4 py-3 text-slate-900 dark:text-white">{item.title}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.detail || '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {item.at ? new Date(item.at).toLocaleString('en-IN') : '—'}
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
