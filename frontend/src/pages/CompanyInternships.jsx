import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { WORK_MODES, formatDate, formatStipend } from '../utils/internship'

const STATUS_STYLES = {
  DRAFT: 'bg-slate-100 text-slate-700',
  OPEN: 'bg-green-100 text-green-700',
  CLOSED: 'bg-red-100 text-red-700',
}

export default function CompanyInternships() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () =>
    api.get('/company/internships')
      .then((res) => setItems(res.data))
      .catch(() => setError('Could not load your internships'))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [])

  const changeStatus = async (id, status) => {
    setError('')
    try {
      await api.patch(`/company/internships/${id}/status`, { status })
      await load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not change the status')
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this draft? This cannot be undone.')) return
    setError('')
    try {
      await api.delete(`/company/internships/${id}`)
      await load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete the internship')
    }
  }

  if (loading) return <p className="text-slate-600">Loading your internships...</p>

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-indigo-600">My internships</h1>
        <Link
          to="/company/internships/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500"
        >
          New internship
        </Link>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {items.length === 0 && !error && (
        <p className="mt-6 rounded-xl bg-white p-6 text-slate-600 shadow">
          You have not created any internships yet.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl bg-white p-6 shadow">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{item.title}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {WORK_MODES[item.workMode]}
                  {item.location ? ` · ${item.location}` : ''} · {item.durationWeeks} weeks ·{' '}
                  {formatStipend(item.stipendPerMonth)} · {item.openings} opening(s)
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Apply by {formatDate(item.applicationDeadline)}
                  {item.status === 'OPEN' && !item.acceptingApplications && ' (deadline passed)'}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[item.status]}`}>
                {item.status}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <Link
                to={`/company/internships/${item.id}/edit`}
                className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
              >
                Edit
              </Link>
              <Link
                to={`/company/internships/${item.id}/applicants`}
                className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
              >
                Applicants
              </Link>
                            <Link
                to={`/company/internships/${item.id}/test`}
                className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
              >
                Screening test
              </Link>
              {item.status === 'DRAFT' && (
                <>
                  <button
                    onClick={() => changeStatus(item.id, 'OPEN')}
                    className="rounded-md bg-green-600 px-3 py-1.5 text-white hover:bg-green-500"
                  >
                    Publish
                  </button>
                  <button
                    onClick={() => remove(item.id)}
                    className="rounded-md border border-red-300 px-3 py-1.5 text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </>
              )}
              {item.status === 'OPEN' && (
                <button
                  onClick={() => changeStatus(item.id, 'CLOSED')}
                  className="rounded-md bg-slate-800 px-3 py-1.5 text-white hover:bg-slate-700"
                >
                  Close
                </button>
              )}
              {item.status === 'CLOSED' && (
                <button
                  onClick={() => changeStatus(item.id, 'OPEN')}
                  className="rounded-md bg-green-600 px-3 py-1.5 text-white hover:bg-green-500"
                >
                  Reopen
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}