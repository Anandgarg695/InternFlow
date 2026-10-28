import { Link } from 'react-router-dom'
import DashboardShell from '../components/DashboardShell'

const linkClass = 'inline-block rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500'

export default function StudentDashboard() {
  return (
    <DashboardShell
      title="Student dashboard"
      description="Browse internships, apply, take tests and track your applications."
      pingPath="/student/ping"
    >
      <div className="flex flex-wrap gap-3">
        <Link to="/student/profile" className={linkClass}>Edit my profile</Link>
        <Link to="/student/internships" className={linkClass}>Browse internships</Link>
        <Link to="/student/applications" className={linkClass}>My applications</Link>
        <Link to="/student/interviews" className={linkClass}>My interviews</Link>
        <Link to="/student/offers" className={linkClass}>My offers</Link>
      </div>
    </DashboardShell>
  )
}