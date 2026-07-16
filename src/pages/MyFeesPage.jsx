import StudentFeesPanel from '../components/fees/StudentFeesPanel'
import { EmptyBlock, PageHeader } from '../components/ui/Page'
import { getSession } from '../utils/auth'

export default function MyFeesPage() {
  const isStudent = getSession()?.role === 'STUDENT'

  if (!isStudent) {
    return (
      <div>
        <PageHeader title="Fees" subtitle="Your hostel fee records." />
        <EmptyBlock message="Fee records are available to students only." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My fees"
        subtitle="View your fee structure, payments, and outstanding balance."
      />
      <StudentFeesPanel title="Fee structure & payments" />
    </div>
  )
}
