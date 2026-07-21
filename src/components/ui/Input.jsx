import { forwardRef, useId, useState } from 'react'

const EyeIcon = ({ open }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`h-5 w-5 transition-transform duration-200 ${open ? 'scale-100' : 'scale-95'}`}
    aria-hidden="true"
  >
    {open ? (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
        <line x1="2" x2="22" y1="2" y2="22" />
      </>
    )}
  </svg>
)

const Input = forwardRef(function Input(
  {
    label,
    type = 'text',
    error,
    showToggle = false,
    toggleLabels = { show: 'Show', hide: 'Hide' },
    className = '',
    id: externalId,
    ...props
  },
  ref,
) {
  const generatedId = useId()
  const id = externalId || generatedId
  const errorId = `${id}-error`
  const [visible, setVisible] = useState(false)
  const [focused, setFocused] = useState(false)
  const hasValue = props.value !== undefined && String(props.value).length > 0
  const floated = focused || hasValue
  const inputType = showToggle ? (visible ? 'text' : 'password') : type

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={inputType}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : undefined}
          onFocus={(e) => {
            setFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            props.onBlur?.(e)
          }}
          className={[
            'peer w-full rounded-xl border bg-slate-50/80 px-4 pb-2.5 pt-6 text-sm text-slate-900 outline-none transition-all duration-200',
            'border-slate-200/80 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15',
            'dark:border-slate-600/80 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:border-primary-light dark:focus:bg-slate-800 dark:focus:ring-primary-light/15',
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : '',
            showToggle ? 'pr-12' : '',
          ].join(' ')}
          placeholder=" "
          {...props}
        />
        <label
          htmlFor={id}
          className={[
            'pointer-events-none absolute left-4 text-slate-500 transition-all duration-200 dark:text-slate-400',
            floated
              ? 'top-2 text-xs font-medium text-primary dark:text-primary-light'
              : 'top-1/2 -translate-y-1/2 text-sm',
          ].join(' ')}
        >
          {label}
          {props.required ? <span className="text-red-500 dark:text-red-400"> *</span> : null}
        </label>
        {showToggle && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:hover:bg-slate-700 dark:hover:text-slate-200"
            aria-label={visible ? toggleLabels.hide : toggleLabels.show}
          >
            <EyeIcon open={visible} />
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
})

export default Input
