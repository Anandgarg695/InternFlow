import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardShell from '../components/DashboardShell'
import api from '../services/api'

const linkClass = 'inline-block rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500 font-medium text-sm'
const outlineLinkClass = 'inline-block rounded-md border border-indigo-600 bg-white px-4 py-2 text-indigo-600 hover:bg-indigo-50 font-medium text-sm'

export default function CompanyDashboard() {
  const [approved, setApproved] = useState(true)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => setApproved(res.data.approved !== false))
      .catch(() => {})

    api.get('/company/analytics')
      .then((res) => setStats(res.data))
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

      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-white p-4 shadow-sm border border-slate-100">
            <p className="text-2xl font-bold text-slate-800">{stats.totalInternships}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Internship Postings</p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm border border-slate-100">
            <p className="text-2xl font-bold text-indigo-600">{stats.totalApplications}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Total Applicants</p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm border border-slate-100">
            <p className="text-2xl font-bold text-slate-800">{stats.activePlacements}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Active Interns</p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm border border-slate-100">
            <p className="text-2xl font-bold text-emerald-600">{stats.totalHires}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Candidates Hired</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link to="/company/internships" className={linkClass}>My internships</Link>
        <Link to="/company/analytics" className={linkClass}>📊 Analytics & Reports</Link>
        <Link to="/company/profile" className={outlineLinkClass}>Edit company profile</Link>
        <Link to="/company/mentors" className={outlineLinkClass}>Mentors</Link>
      </div>
    </DashboardShell>
  )
}
