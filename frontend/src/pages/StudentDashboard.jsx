import { Link } from 'react-router-dom'
import DashboardShell from '../components/DashboardShell'

export default function StudentDashboard() {
  return (
    <DashboardShell
      title="Student dashboard"
      description="Coming soon: browse internships, apply, take tests and track your applications."
      pingPath="/student/ping"
    >
      <Link
        to="/student/profile"
        className="inline-block rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500"
      >
        Edit my profile
      </Link>
    </DashboardShell>
  )
}