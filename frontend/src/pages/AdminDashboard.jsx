import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardShell from '../components/DashboardShell'
import api from '../services/api'

function Stat({ label, value, highlight }) {
  return (
    <div className={`rounded-lg p-4 ${highlight ? 'bg-amber-50' : 'bg-slate-50'}`}>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-600">{label}</p>
    </div>
  )
}

export default function AdminDashboard() {
  const [o, setO] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/admin/overview')
      .then((res) => setO(res.data))
      .catch(() => setError('Could not load the overview'))
  }, [])

  return (
    <DashboardShell
      title="Admin dashboard"
      description="A quick look at the whole platform."
      pingPath="/admin/ping"
    >
      {error && <p className="text-sm text-red-600">{error}</p>}
      {o && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Students" value={o.usersByRole.STUDENT} />
            <Stat label="Companies" value={o.usersByRole.COMPANY} />
            <Stat label="Mentors" value={o.usersByRole.MENTOR} />
            <Stat label="Admins" value={o.usersByRole.ADMIN} />
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Internships" value={o.internships} />
            <Stat label="Open internships" value={o.openInternships} />
            <Stat label="Applications" value={o.applications} />
            <Stat label="Students selected" value={o.selected} />
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Placements" value={o.placements} />
            <Stat label="Completed" value={o.completedPlacements} />
            <Stat label="Certificates" value={o.certificates} />
            <Stat label="Disabled accounts" value={o.disabledUsers} />
          </div>
          {o.pendingCompanies > 0 && (
            <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              {o.pendingCompanies} company account(s) are waiting for approval.{' '}
              <Link to="/admin/users?pending=true" className="underline">Review them</Link>
            </p>
          )}
        </div>
      )}
      <div className="mt-6">
        <Link
          to="/admin/users"
          className="inline-block rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500"
        >
          Manage users
        </Link>
      </div>
    </DashboardShell>
  )
}