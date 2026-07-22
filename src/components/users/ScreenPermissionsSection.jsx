import { LayoutGrid } from 'lucide-react'
import OnOffToggle from '../ui/OnOffToggle'
import {
  ACCESS_GRANT_MODULE,
  SCREEN_MODULES,
} from '../../constants/screenPermissions'

function PermissionBlock({ module, enabled, onChange, idPrefix = 'perm', showEnableDisableText = false }) {
  const Icon = module.icon

  return (
    <div className="screen-perm-block flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700/80 dark:bg-slate-900/60 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light">
          <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
        </span>
        {showEnableDisableText ? (
          <p
            className={[
              'text-sm font-semibold',
              enabled
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400',
            ].join(' ')}
          >
            {enabled ? 'Enable' : 'Disable'}
          </p>
        ) : (
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{module.label}</h4>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {module.description}
            </p>
          </div>
        )}
      </div>
      <div className="flex shrink-0 sm:pl-2">
        <OnOffToggle
          id={`${idPrefix}-${module.key}`}
          label=""
          ariaLabel={showEnableDisableText ? `Access Grant: ${enabled ? 'Enable' : 'Disable'}` : undefined}
          checked={enabled}
          canToggle
          onChange={onChange}
          className="items-end"
        />
      </div>
    </div>
  )
}

export default function ScreenPermissionsSection({
  permissions,
  accessGrant,
  onPermissionChange,
  onAccessGrantChange,
}) {
  return (
    <section className="add-user-section add-user-screen-permissions">
      <div className="add-user-section-head">
        <span className="add-user-section-icon" aria-hidden="true">
          <LayoutGrid className="h-4 w-4" strokeWidth={2} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Screen Permissions</h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Choose which modules this user can view and access after sign-in.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {SCREEN_MODULES.map((module) => (
          <PermissionBlock
            key={module.key}
            module={module}
            enabled={permissions[module.key] !== false}
            onChange={(next) => onPermissionChange(module.key, next)}
            idPrefix="screen-perm"
          />
        ))}
      </div>

      <div className="mt-4 border-t border-slate-200/80 pt-4 dark:border-slate-700/80">
        <PermissionBlock
          module={ACCESS_GRANT_MODULE}
          enabled={Boolean(accessGrant)}
          onChange={onAccessGrantChange}
          idPrefix="access-grant"
          showEnableDisableText
        />
      </div>
    </section>
  )
}
