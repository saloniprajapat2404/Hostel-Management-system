import { Building2 } from 'lucide-react'

export default function HostelLogo({ size = 'md', className = '', alt = 'Hostel logo' }) {
  const sizes = {
    sm: 'h-10 w-10',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-20 w-20',
  }

  return (
    <div
      className={`${sizes[size] ?? sizes.md} flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-700 to-teal-500 text-white shadow-md shadow-primary/20 ${className}`}
      role="img"
      aria-label={alt}
    >
      <Building2 className="h-[52%] w-[52%]" strokeWidth={2.1} aria-hidden="true" />
    </div>
  )
}
