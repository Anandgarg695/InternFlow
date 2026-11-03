import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { formatDate } from '../utils/internship'
import { PHASE } from '../utils/placement'

export default function StudentPlacements() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/student/placements')
      .then((res) => setItems(res.data))
      .catch(() => setError('Could not load your internships'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-slate-600">Loading...</p>

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/student/dashboard" className="text-sm text-slate-600 hover:text-indigo-600">
        ← Back to dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-indigo-600">My internship</h1>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {items.length === 0 && !error && (
        <p className="mt-6 rounded-xl bg-white p-6 text-slate-600 shadow">
          You do not have an internship yet. It appears here after you accept an offer.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {items.map((p) => {
          const phase = PHASE[p.phase]
          return (
            <div key={p.id} className="rounded-xl bg-white p-6 shadow">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold">{p.internshipTitle}</p>
                  <p className="text-sm text-indigo-600">{p.companyName || 'Company'}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {formatDate(p.startDate)} to {formatDate(p.endDate)}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${phase.style}`}>{phase.label}</span>
              </div>

              <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm">
                <p className="font-medium text-slate-700">Your mentor</p>
                {p.mentorName ? (
                  <p className="mt-1 text-slate-600">
                    {p.mentorName} · {p.mentorEmail}
                  </p>
                ) : (
                  <p className="mt-1 text-slate-500">A mentor has not been assigned yet.</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}