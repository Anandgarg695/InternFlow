import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardShell from '../components/DashboardShell'
import api from '../services/api'

const linkClass = 'inline-block rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500'

export default function CompanyDashboard() {
  const [approved, setApproved] = useState(true)

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => setApproved(res.data.approved !== false))
      .catch(() => {})
  }, [])

  return (
    <DashboardShell
      title="Company dashboard"
      description="Post internships, review applicants, manage interviews and offers, and guide your interns."
      pingPath="/company/ping"
    >
      {!approved && (
        <p className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          Your company account is waiting for admin approval. You can set up your profile and prepare
          internships now, but you can publish them only after approval.
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Link to="/company/profile" className={linkClass}>Edit company profile</Link>
        <Link to="/company/internships" className={linkClass}>My internships</Link>
        <Link to="/company/mentors" className={linkClass}>Mentors</Link>
      </div>
    </DashboardShell>
  )
}