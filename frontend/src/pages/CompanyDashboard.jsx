import { Link } from 'react-router-dom'
import DashboardShell from '../components/DashboardShell'

export default function CompanyDashboard() {
  return (
    <DashboardShell
      title="Company dashboard"
      description="Coming soon: post internships, review applicants and manage interviews."
      pingPath="/company/ping"
    >
      <Link
        to="/company/profile"
        className="inline-block rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500"
      >
        Edit company profile
      </Link>
    </DashboardShell>
  )
}