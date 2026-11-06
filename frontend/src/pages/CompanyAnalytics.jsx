import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function CompanyAnalytics() {
  const [data, setData] = useState(null)
  const [internships, setInternships] = useState([])
  const [selectedInternship, setSelectedInternship] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')

  const loadData = async (iid = selectedInternship) => {
    setLoading(true)
    setError('')
    try {
      const params = iid ? { internshipId: iid } : {}
      const res = await api.get('/company/analytics', { params })
      setData(res.data)
      if (internships.length === 0 && res.data.internships) {
        setInternships(res.data.internships)
      }
    } catch {
      setError('Could not load company recruitment analytics.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(selectedInternship)
  }, [selectedInternship])

  const handleExportCsv = async () => {
    setExporting(true)
    try {
      const params = selectedInternship ? { internshipId: selectedInternship } : {}
      const res = await api.get('/company/analytics/export', {
        params,
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `internflow-recruitment-report-${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Failed to export CSV report.')
    } finally {
      setExporting(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-slate-600">Loading recruitment analytics...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="/company/dashboard" className="text-sm text-slate-600 hover:text-indigo-600">
            ← Back to dashboard
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-indigo-600">Recruitment Analytics & Reporting</h1>
          <p className="text-sm text-slate-500">Track candidate pipeline, assessment scores, and internship outcomes.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedInternship}
            onChange={(e) => setSelectedInternship(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Internships</option>
            {internships.map((i) => (
              <option key={i.id} value={i.id}>
                {i.title}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 shadow-sm transition-colors"
          >
            📥 {exporting ? 'Exporting...' : 'Export CSV Report'}
          </button>
        </div>
      </div>

      {error && <p className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      {data && (
        <>
          {/* Key KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Applicants</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-800">{data.totalApplications}</p>
              <p className="mt-1 text-xs text-indigo-600 font-medium">
                {data.totalShortlisted} shortlisted ({data.totalApplications > 0 ? Math.round((data.totalShortlisted * 100) / data.totalApplications) : 0}%)
              </p>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Screening Avg</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-800">
                {data.averageTestScore != null ? `${data.averageTestScore}%` : 'N/A'}
              </p>
              <p className="mt-1 text-xs text-slate-500">{data.totalAssessed} candidates tested</p>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Interviews</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-800">{data.totalInterviews}</p>
              <p className="mt-1 text-xs text-emerald-600 font-medium">{data.totalOffers} offers extended</p>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Hires & Placed</p>
              <p className="mt-2 text-3xl font-extrabold text-emerald-600">{data.totalHires}</p>
              <p className="mt-1 text-xs text-slate-500">Acceptance: {data.offerAcceptanceRate}%</p>
            </div>
          </div>

          {/* Funnel & Placements Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Recruitment Funnel */}
            <div className="lg:col-span-2 rounded-xl bg-white p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-800">Hiring Pipeline Funnel</h2>
                <span className="text-xs text-slate-500">% of total applications</span>
              </div>

              <div className="space-y-4">
                {data.funnel.map((stage) => (
                  <div key={stage.stage}>
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                      <span>{stage.stage}</span>
                      <span className="text-slate-500">
                        <strong className="text-slate-800">{stage.count}</strong> ({stage.conversionRate}%)
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                        style={{ width: `${Math.max(stage.count > 0 ? 4 : 0, Math.min(100, stage.conversionRate))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Internship & Placement Progress Card */}
            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800 mb-4">Internship Execution</h2>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-slate-600">Active Interns:</span>
                    <span className="font-semibold text-slate-800">{data.activePlacements}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-slate-600">Completed Internships:</span>
                    <span className="font-semibold text-emerald-600">{data.completedPlacements}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-slate-600">Tasks Assigned:</span>
                    <span className="font-semibold text-slate-800">{data.totalTasks}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-slate-600">Tasks Reviewed:</span>
                    <span className="font-semibold text-indigo-600">{data.tasksReviewed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Task Completion Rate:</span>
                    <span className="font-semibold text-slate-800">{data.taskCompletionRate}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link
                  to="/company/internships"
                  className="block text-center rounded-lg bg-slate-50 py-2 text-xs font-semibold text-indigo-600 hover:bg-slate-100"
                >
                  Manage Interns & Placements →
                </Link>
              </div>
            </div>
          </div>

          {/* Breakdown by Internship Table */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
            <h2 className="text-base font-bold text-slate-800 mb-4">Performance by Internship Posting</h2>
            {data.internships.length === 0 ? (
              <p className="text-sm text-slate-500">No internship postings found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Internship Title</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Openings</th>
                      <th className="px-3 py-3">Applicants</th>
                      <th className="px-3 py-3">Shortlisted</th>
                      <th className="px-3 py-3">Interviews</th>
                      <th className="px-3 py-3">Offers</th>
                      <th className="px-3 py-3">Hires</th>
                      <th className="px-3 py-3">Avg Test Score</th>
                      <th className="px-3 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.internships.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-medium text-slate-800">{item.title}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              item.status === 'OPEN'
                                ? 'bg-green-100 text-green-700'
                                : item.status === 'DRAFT'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-3 py-3">{item.openings}</td>
                        <td className="px-3 py-3 font-semibold text-slate-800">{item.applicants}</td>
                        <td className="px-3 py-3">{item.shortlisted}</td>
                        <td className="px-3 py-3">{item.interviews}</td>
                        <td className="px-3 py-3">{item.offers}</td>
                        <td className="px-3 py-3 font-semibold text-emerald-600">{item.hires}</td>
                        <td className="px-3 py-3">{item.avgScore != null ? `${item.avgScore}%` : '—'}</td>
                        <td className="px-3 py-3">
                          <Link
                            to={`/company/internships/${item.id}/applicants`}
                            className="text-xs font-semibold text-indigo-600 hover:underline"
                          >
                            View Applicants
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
