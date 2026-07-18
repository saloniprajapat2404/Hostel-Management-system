export function matchesSearch(query, values) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return values.some((value) => String(value ?? '').toLowerCase().includes(q))
}

export function compareValues(a, b) {
  if (a == null && b == null) return 0
  if (a == null) return -1
  if (b == null) return 1

  if (typeof a === 'number' && typeof b === 'number') {
    return a - b
  }

  const aDate = Date.parse(a)
  const bDate = Date.parse(b)
  if (!Number.isNaN(aDate) && !Number.isNaN(bDate)) {
    return aDate - bDate
  }

  return String(a).localeCompare(String(b), undefined, { sensitivity: 'base' })
}

export function sortRows(rows, sortKey, sortDir, getValue) {
  const accessor = getValue || ((row) => row[sortKey])
  const direction = sortDir === 'desc' ? -1 : 1

  return [...rows].sort((left, right) => {
    const result = compareValues(accessor(left), accessor(right))
    return result * direction
  })
}

export function toggleSort(currentKey, currentDir, nextKey) {
  if (currentKey === nextKey) {
    return { sortKey: nextKey, sortDir: currentDir === 'asc' ? 'desc' : 'asc' }
  }
  return { sortKey: nextKey, sortDir: 'asc' }
}
