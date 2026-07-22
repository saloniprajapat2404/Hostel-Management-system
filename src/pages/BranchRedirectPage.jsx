import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useBranch } from '../context/BranchContext'
import { LoadingBlock, ErrorBlock } from '../components/ui/Page'

export default function BranchRedirectPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { setBranchBySlug } = useBranch()
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await setBranchBySlug(slug)
        if (!cancelled) navigate('/app', { replace: true })
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to open branch')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [slug, setBranchBySlug, navigate])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <ErrorBlock message={error} />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <LoadingBlock label="Opening branch…" />
    </div>
  )
}
