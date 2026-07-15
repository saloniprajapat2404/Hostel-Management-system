import { useCallback, useEffect, useState } from 'react'

export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('hms_theme')
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('hms_theme', dark ? 'dark' : 'light')
  }, [dark])

  const toggle = useCallback(() => setDark((prev) => !prev), [])

  return { dark, toggle }
}
