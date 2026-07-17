import HostelLogo from './HostelLogo'

export default function BrandHeader({ appName, systemName }) {
  return (
    <div className="flex items-center gap-3">
      <HostelLogo size="md" alt={appName} />
      <div>
        <p className="text-base font-bold tracking-tight text-slate-900 dark:text-white">{appName}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{systemName}</p>
      </div>
    </div>
  )
}
