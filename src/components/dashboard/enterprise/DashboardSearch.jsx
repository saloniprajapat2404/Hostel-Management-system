import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { filterStudents, loadStudentDirectory } from '../../../utils/studentSearch'

export default function DashboardSearch({ role }) {
  const navigate = useNavigate()
  const canSearch = role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'WARDEN'

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [students, setStudents] = useState([])
  const [allocationByStudent, setAllocationByStudent] = useState(new Map())
  const [loaded, setLoaded] = useState(false)
  const rootRef = useRef(null)

  const ensureDirectory = useCallback(async () => {
    if (!canSearch || loaded) return
    setLoading(true)
    try {
      const data = await loadStudentDirectory(role)
      setStudents(data.students)
      setAllocationByStudent(data.allocationByStudent)
      setLoaded(true)
    } catch {
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [canSearch, loaded, role])

  useEffect(() => {
    if (open) ensureDirectory()
  }, [open, ensureDirectory])

  useEffect(() => {
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const results = useMemo(() => filterStudents(students, query), [students, query])

  const goToStudent = (student) => {
    if (!student?.id) return
    setOpen(false)
    setQuery('')
    navigate(`/app/students/${student.id}`)
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (query.trim().length < 2) return
    if (results.length > 0) {
      goToStudent(results[0])
    }
  }

  if (!canSearch) return null

  return (
    <div ref={rootRef} className="relative w-full max-w-[240px] sm:max-w-[280px]">
      <form onSubmit={onSubmit}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dash-muted)]" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            setOpen(true)
            ensureDirectory()
          }}
          placeholder="Find student by name…"
          className="w-full rounded-[12px] border bg-transparent py-2 pl-9 pr-3 text-[13px] text-[var(--dash-text)] outline-none transition focus:border-[#3B82F6]/50"
          style={{ borderColor: 'var(--dash-border)' }}
          aria-label="Search students"
          aria-expanded={open}
          aria-autocomplete="list"
        />
      </form>

      {open && query.trim().length >= 2 && (
        <ul
          className="absolute right-0 top-full z-40 mt-2 max-h-[240px] w-[min(100vw-2rem,320px)] overflow-y-auto rounded-[14px] border py-1 shadow-lg"
          style={{ borderColor: 'var(--dash-border)', background: 'var(--dash-surface)' }}
          role="listbox"
        >
          {loading && (
            <li className="px-3 py-2 text-[12px] text-[var(--dash-muted)]">Loading students…</li>
          )}
          {!loading && results.length === 0 && (
            <li className="px-3 py-2 text-[12px] text-[var(--dash-muted)]">No students found.</li>
          )}
          {!loading &&
            results.slice(0, 6).map((student) => {
              const alloc = allocationByStudent.get(String(student.id))
              return (
                <li key={student.id} role="option">
                  <button
                    type="button"
                    onClick={() => goToStudent(student)}
                    className="flex w-full flex-col px-3 py-2 text-left transition-colors hover:bg-[var(--dash-hover)]"
                  >
                    <span className="text-[13px] font-medium text-[var(--dash-text)]">{student.fullName}</span>
                    <span className="text-[11px] text-[var(--dash-muted)]">
                      {[student.studentId, student.email, alloc ? `Room ${alloc.roomNumber}` : 'Unallocated']
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </button>
                </li>
              )
            })}
          {!loading && results.length > 6 && (
            <li className="px-3 py-2 text-[11px] text-[var(--dash-muted)]">
              {results.length - 6} more — type a longer name to narrow results
            </li>
          )}
        </ul>
      )}

      {open && query.trim().length > 0 && query.trim().length < 2 && (
        <p
          className="absolute right-0 top-full z-40 mt-2 w-[min(100vw-2rem,280px)] rounded-[12px] border px-3 py-2 text-[12px] text-[var(--dash-muted)] shadow-lg"
          style={{ borderColor: 'var(--dash-border)', background: 'var(--dash-surface)' }}
        >
          Type at least 2 letters to find a student
        </p>
      )}
    </div>
  )
}
