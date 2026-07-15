export default function AuthBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-teal-50/40 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/30" />

      <div className="animate-float absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20" />
      <div className="animate-float-delayed absolute top-1/3 -right-32 h-80 w-80 rounded-full bg-teal-400/10 blur-3xl dark:bg-teal-500/10" />
      <div className="animate-float absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-slate-300/30 blur-3xl dark:bg-slate-700/20" />

      <svg
        className="absolute bottom-0 left-0 w-full opacity-[0.04] dark:opacity-[0.06]"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        fill="currentColor"
      >
        <path d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
      </svg>

      <div className="absolute top-[12%] right-[8%] hidden opacity-[0.07] lg:block dark:opacity-[0.05]">
        <svg width="280" height="280" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="60" y="40" width="80" height="140" rx="4" stroke="currentColor" strokeWidth="2" className="text-primary" />
          <rect x="72" y="55" width="14" height="14" rx="1" fill="currentColor" className="text-primary" />
          <rect x="92" y="55" width="14" height="14" rx="1" fill="currentColor" className="text-primary" />
          <rect x="112" y="55" width="14" height="14" rx="1" fill="currentColor" className="text-primary" />
          <rect x="72" y="78" width="14" height="14" rx="1" fill="currentColor" className="text-primary" />
          <rect x="92" y="78" width="14" height="14" rx="1" fill="currentColor" className="text-primary" />
          <rect x="112" y="78" width="14" height="14" rx="1" fill="currentColor" className="text-primary" />
          <rect x="72" y="101" width="14" height="14" rx="1" fill="currentColor" className="text-primary" />
          <rect x="92" y="101" width="14" height="14" rx="1" fill="currentColor" className="text-primary" />
          <rect x="112" y="101" width="14" height="14" rx="1" fill="currentColor" className="text-primary" />
          <path d="M50 180 H150" stroke="currentColor" strokeWidth="2" className="text-primary" />
        </svg>
      </div>
    </div>
  )
}
