import { motion } from 'framer-motion'

export default function DashboardHeader({ user }) {
  const displayName = user?.fullName || user?.email || 'User'

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="mb-6"
    >
      <h1 className="text-lg font-semibold leading-snug tracking-tight text-white">
        Dashboard
      </h1>
      <p className="mt-0.5 text-xs text-[#94A3B8] sm:text-sm">
        Welcome back, <span className="font-medium text-white/90">{displayName}</span>
      </p>
    </motion.header>
  )
}
