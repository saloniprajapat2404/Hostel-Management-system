import { useEffect, useState } from 'react'

export const CHART_HEIGHT = 96

export const CHART_COLORS = {
  primary: '#3B82F6',
  teal: '#06B6D4',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  slate: '#64748B',
  violet: '#8B5CF6',
}

export function useChartTheme() {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false,
  )

  useEffect(() => {
    const root = document.documentElement
    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains('dark'))
    })
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return {
    isDark,
    text: isDark ? '#94A3B8' : '#64748B',
    textStrong: isDark ? '#F1F5F9' : '#0F172A',
    grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
    tooltipBg: isDark ? '#1E293B' : '#FFFFFF',
    tooltipBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)',
    surface: isDark ? '#111827' : '#FFFFFF',
  }
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0))
}

export function formatCompactCurrency(amount) {
  const n = Number(amount || 0)
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`
  return `₹${n}`
}
