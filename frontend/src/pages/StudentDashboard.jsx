import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardShell from '../components/DashboardShell'
import api from '../services/api'

export default function StudentDashboard() {
  const [stats, setStats] = useState({
    applications: 0,
    interviews: 0,
    offers: 0,
    placements: 0,
    loading: true,
  })

  useEffect(() => {
    Promise.allSettled([
      api.get('/student/applications'),
      api.get('/student/interviews'),
      api.get('/student/offers'),
      api.get('/student/placements'),
    ]).then(([appsRes, ivsRes, offersRes, placeRes]) => {
      setStats({
        applications: appsRes.status === 'fulfilled' ? appsRes.value.data.length : 0,
        interviews: ivsRes.status === 'fulfilled' ? ivsRes.value.data.filter((i) => ['SCHEDULED', 'CONFIRMED'].includes(i.status)).length : 0,
        offers: offersRes.status === 'fulfilled' ? offersRes.value.data.filter((o) => o.status === 'OFFERED').length : 0,
        placements: placeRes.status === 'fulfilled' ? placeRes.value.data.length : 0,
        loading: false,
      })
    })
  }, [])

  return (
    <DashboardShell
      title="Student Workspace"
      description="Track applications, upcoming interviews, mentor tasks, and placement progress."
    >
      <div className="space-y-6">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Applications</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stats.loading ? '—' : stats.applications}</p>
            <Link to="/student/applications" className="mt-2 block text-xs font-semibold text-indigo-600 hover:underline">
              View all applications →
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Interviews</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stats.loading ? '—' : stats.interviews}</p>
            <Link to="/student/interviews" className="mt-2 block text-xs font-semibold text-indigo-600 hover:underline">
              Open interview room →
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Offers</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stats.loading ? '—' : stats.offers}</p>
            <Link to="/student/offers" className="mt-2 block text-xs font-semibold text-indigo-600 hover:underline">
              Review offers →
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Placements</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stats.loading ? '—' : stats.placements}</p>
            <Link to="/student/placements" className="mt-2 block text-xs font-semibold text-indigo-600 hover:underline">
              View tasks & mentors →
            </Link>
          </div>
        </div>

        {/* Primary Action Hub (3 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/student/internships"
            className="group rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 hover:shadow-xs transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Discover</span>
              <span className="text-slate-400 group-hover:text-slate-600 transition-colors">→</span>
            </div>
            <h3 className="mt-2 text-base font-bold text-slate-900">Explore Internships</h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              Find positions matching your skills with AI gap analysis and instant match score percentages.
            </p>
          </Link>

          <Link
            to="/student/profile"
            className="group rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 hover:shadow-xs transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Profile</span>
              <span className="text-slate-400 group-hover:text-slate-600 transition-colors">→</span>
            </div>
            <h3 className="mt-2 text-base font-bold text-slate-900">Academic & Skills Profile</h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              Keep your CGPA, degree, GitHub, and technical skills updated for recruiters to evaluate.
            </p>
          </Link>

          <Link
            to="/verify"
            className="group rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 hover:shadow-xs transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Credentials</span>
              <span className="text-slate-400 group-hover:text-slate-600 transition-colors">→</span>
            </div>
            <h3 className="mt-2 text-base font-bold text-slate-900">Verify a Certificate</h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              Validate institutional certificates issued by partner companies and academic institutions.
            </p>
          </Link>
        </div>
      </div>
    </DashboardShell>
  )
}
