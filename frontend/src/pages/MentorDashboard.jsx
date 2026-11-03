import { Link } from 'react-router-dom'
import DashboardShell from '../components/DashboardShell'

const linkClass = 'inline-block rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500'

export default function MentorDashboard() {
  return (
    <DashboardShell
      title="Mentor dashboard"
      description="Accept invitations from companies and guide your interns."
      pingPath="/mentor/ping"
    >
      <Link to="/mentor/interns" className={linkClass}>My interns and invitations</Link>
    </DashboardShell>
  )
}