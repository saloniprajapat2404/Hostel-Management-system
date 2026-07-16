import { useEffect, useRef, useState } from 'react'

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3
}

export default function AnimatedNumber({ value, className = '', duration = 900 }) {
  const isNumeric = typeof value === 'number' && Number.isFinite(value)
  const [display, setDisplay] = useState(isNumeric ? 0 : value)
  const frameRef = useRef(null)
  const prevRef = useRef(isNumeric ? 0 : value)

  useEffect(() => {
    if (!isNumeric) {
      setDisplay(value)
      return
    }

    const start = prevRef.current
    const end = value
    const startTime = performance.now()

    const tick = (now) => {
      const progress = Math.min(1, (now - startTime) / duration)
      const next = Math.round(start + (end - start) * easeOutCubic(progress))
      setDisplay(next)
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        prevRef.current = end
      }
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [value, isNumeric, duration])

  return (
    <span className={`tabular-nums ${className}`}>
      {isNumeric ? display : value}
    </span>
  )
}
