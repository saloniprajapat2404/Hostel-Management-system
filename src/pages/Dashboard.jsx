import { useNavigate } from 'react-router-dom'
import HostelLogo from '../components/HostelLogo'
import { clearSession, getSession, isGuestMode } from '../utils/auth'

export default function Dashboard() {
  const navigate = useNavigate()
  const user = getSession()
  const guest = isGuestMode()

  const handleSignOut = () => {
    clearSession()
    navigate('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 dark:bg-slate-950">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-900">
        <div className="mb-4 flex justify-center">
          <HostelLogo size="lg" />
        </div>
        <h1 className="text-center text-2xl font-bold text-slate-900 dark:text-white">Takshak Hostel</h1>
        <p className="mt-1 text-center text-sm text-primary dark:text-primary-light">Dashboard</p>
        <p className="mt-4 text-center text-slate-600 dark:text-slate-300">
          {guest
            ? 'Browsing in guest mode — explore the Takshak Hostel portal with limited access.'
            : `Welcome, ${user?.identifier ?? 'User'}! You are signed in to Takshak Hostel.`}
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          className="mx-auto mt-6 block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
