import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { APPLICATION_STATUS, formatDateTime } from '../utils/application'

export default function StudentApplications() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () =>
    api.get('/student/applications')
      .then((res) => setItems(res.data))
      .catch(() => setError('Could not load your applications'))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [])

  const withdraw = async (id) => {
    if (!window.confirm('Withdraw this application? You will not be able to apply again.')) return
    setError('')
    try {
      await api.patch(`/student/applications/${id}/withdraw`)
      await load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not withdraw the application')
    }
  }

  if (loading) return <p className="text-slate-600">Loading your applications...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-indigo-600">My applications</h1>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {items.length === 0 && !error && (
        <p className="mt-6 rounded-xl bg-white p-6 text-slate-600 shadow">
          You have not applied to any internship yet.{' '}
          <Link to="/student/internships" className="text-indigo-600 hover:underline">Browse internships</Link>
        </p>
      )}

      <div className="mt-6 space-y-4">
        {items.map((a) => {
          const status = APPLICATION_STATUS[a.status]
          const canWithdraw = a.status === 'APPLIED' || a.status === 'SHORTLISTED'
          return (
            <div key={a.id} className="rounded-xl bg-white p-6 shadow">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link
                    to={`/student/internships/${a.internshipId}`}
                    className="text-lg font-semibold hover:text-indigo-600"
                  >
                    {a.internshipTitle}
                  </Link>
                  <p className="text-sm text-indigo-600">{a.companyName || 'Company'}</p>
                  <p className="mt-1 text-xs text-slate-500">Applied on {formatDateTime(a.appliedAt)}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.style}`}>
                  {status.label}
                </span>
              </div>

              {a.coverNote && <p className="mt-3 whitespace-pre-line text-sm text-slate-600">{a.coverNote}</p>}
                            {a.status === 'SHORTLISTED' && (
                <Link
                  to={`/student/applications/${a.id}/test`}
                  className="mr-2 mt-4 inline-block rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-500"
                >
                      Round {Math.max(a.currentRound, 1)} test
                </Link>
              )}

              {canWithdraw && (
                <button
                  onClick={() => withdraw(a.id)}
                  className="mt-4 rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                >
                  Withdraw
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}