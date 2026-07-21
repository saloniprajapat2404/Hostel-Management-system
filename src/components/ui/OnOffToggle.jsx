/**
 * ON/OFF account status toggle for Admin / Super Admin.
 */
export default function OnOffToggle({
  checked = true,
  onChange,
  canToggle = false,
  label = 'Account status',
  id = 'on-off-toggle',
  className = '',
}) {
  const enabled = Boolean(canToggle)

  return (
    <div className={`flex flex-col gap-1.5 ${className}`.trim()}>
      {label ? (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>
      ) : null}

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label || 'Toggle'}
        disabled={!enabled}
        onClick={() => {
          if (!enabled || typeof onChange !== 'function') return
          onChange(!checked)
        }}
        className={[
          'relative inline-flex h-10 w-[92px] shrink-0 items-center rounded-full border',
          'transition-colors duration-200 ease-out select-none',
          checked
            ? 'border-emerald-600/30 bg-emerald-600'
            : 'border-red-600/30 bg-red-600',
          enabled
            ? 'cursor-pointer hover:brightness-110'
            : 'cursor-not-allowed opacity-60',
        ].join(' ')}
      >
        <span
          className={[
            'pointer-events-none absolute text-[11px] font-bold tracking-wide text-white',
            checked ? 'left-3' : 'right-3',
          ].join(' ')}
        >
          {checked ? 'ON' : 'OFF'}
        </span>
        <span
          className={[
            'pointer-events-none absolute top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-white shadow-sm',
            'transition-[left] duration-200 ease-out',
            checked ? 'left-[calc(100%-2rem-3px)]' : 'left-[3px]',
          ].join(' ')}
        />
      </button>
    </div>
  )
}
