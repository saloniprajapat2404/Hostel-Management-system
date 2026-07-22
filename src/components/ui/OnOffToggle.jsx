/**
 * ON/OFF toggle switch (no inner label text).
 */
export default function OnOffToggle({
  checked = true,
  onChange,
  canToggle = false,
  label = 'Account status',
  ariaLabel,
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
        aria-label={ariaLabel || label || (checked ? 'Enabled' : 'Disabled')}
        disabled={!enabled}
        onClick={() => {
          if (!enabled || typeof onChange !== 'function') return
          onChange(!checked)
        }}
        className={[
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200 ease-out select-none',
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
            'pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-sm',
            'transition-[left] duration-200 ease-out',
            checked ? 'left-[calc(100%-1.25rem-2px)]' : 'left-[2px]',
          ].join(' ')}
        />
      </button>
    </div>
  )
}
