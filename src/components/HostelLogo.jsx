export default function HostelLogo({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-10 w-10',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-20 w-20',
  }

  return (
    <img
      src="/takshak-logo.svg"
      alt="Takshak Hostel logo"
      className={`${sizes[size] ?? sizes.md} shrink-0 rounded-2xl object-cover shadow-md shadow-primary/20 ${className}`}
    />
  )
}
