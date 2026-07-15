export default function Button({
  children,
  loading = false,
  variant = 'primary',
  success = false,
  className = '',
  disabled,
  type = 'button',
  ...props
}) {
  const base =
    'inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'

  const variants = {
    primary:
      'bg-primary text-white hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/25 focus-visible:ring-primary dark:focus-visible:ring-offset-slate-900',
    ghost:
      'border border-slate-200/80 bg-white/50 text-slate-700 hover:border-slate-300 hover:bg-white focus-visible:ring-primary dark:border-slate-600/80 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-900',
    success:
      'bg-emerald-600 text-white focus-visible:ring-emerald-500 dark:focus-visible:ring-offset-slate-900',
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={[
        base,
        success ? variants.success : variants[variant],
        success ? 'animate-success-pulse' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
