import { Link } from 'react-router-dom'
import DashboardShell from '../components/DashboardShell'

const linkClass = 'inline-block rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500'

export default function CompanyDashboard() {
  return (
    <DashboardShell
      title="Company dashboard"
      description="Post internships, review applicants and manage interviews."
      pingPath="/company/ping"
    >
      <div className="flex flex-wrap gap-3">
        <Link to="/company/profile" className={linkClass}>Edit company profile</Link>
        <Link to="/company/internships" className={linkClass}>My internships</Link>
      </div>
    </DashboardShell>
  )
}