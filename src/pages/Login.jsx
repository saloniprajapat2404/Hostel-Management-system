import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import AuthBackground from '../components/AuthBackground'
import BrandHeader from '../components/BrandHeader'
import LoginForm from '../components/LoginForm'
import DarkModeToggle from '../components/DarkModeToggle'
import LanguageSelector from '../components/LanguageSelector'
import Toast from '../components/ui/Toast'
import { useHostelConfig } from '../context/HostelConfigContext'
import { useDarkMode } from '../hooks/useDarkMode'
import { useToast } from '../hooks/useToast'
import { isAuthenticated, getSession } from '../utils/auth'
import { t } from '../utils/translations'

export default function Login() {
  const { dark, toggle } = useDarkMode()
  const { toast, showToast, hideToast } = useToast()
  const { hostelName, systemName, refreshConfig } = useHostelConfig()
  const [lang, setLang] = useState(() => localStorage.getItem('hms_lang') || 'en')

  useEffect(() => {
    refreshConfig()
  }, [refreshConfig])

  if (isAuthenticated()) {
    const user = getSession()
    const target = user?.role === 'SUPER_ADMIN' ? '/superadmin' : '/app'
    return <Navigate to={target} replace />
  }

  const handleLangChange = (value) => {
    setLang(value)
    localStorage.setItem('hms_lang', value)
  }

  return (
    <div className="relative min-h-screen text-slate-900 dark:text-slate-100">
      <AuthBackground />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <header className="relative z-10 flex items-center justify-between px-5 py-5 md:px-10">
        <BrandHeader
          appName={hostelName}
          systemName={systemName}
        />
        <div className="flex items-center gap-2">
          <LanguageSelector lang={lang} onChange={handleLangChange} label={t(lang, 'language')} />
          <DarkModeToggle dark={dark} onToggle={toggle} label={t(lang, 'darkMode')} />
        </div>
      </header>

      <main className="relative z-10 flex flex-col items-center justify-center px-4 pb-10 md:min-h-[calc(100vh-88px)] md:px-6">
        <LoginForm
          lang={lang}
          hostelName={hostelName}
          onError={(msg) => showToast(msg, 'error')}
          onSuccessToast={(msg) => showToast(msg, 'success')}
        />

        <footer className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
          <p>{t(lang, 'footer', { hostelName })}</p>
          <p className="mt-2 flex items-center justify-center gap-3">
            <a
              href="#privacy"
              className="transition-colors hover:text-slate-700 focus:outline-none focus-visible:underline dark:hover:text-slate-200"
              onClick={(e) => e.preventDefault()}
            >
              {t(lang, 'privacy')}
            </a>
            <span aria-hidden="true">·</span>
            <a
              href="#terms"
              className="transition-colors hover:text-slate-700 focus:outline-none focus-visible:underline dark:hover:text-slate-200"
              onClick={(e) => e.preventDefault()}
            >
              {t(lang, 'terms')}
            </a>
          </p>
        </footer>
      </main>
    </div>
  )
}
