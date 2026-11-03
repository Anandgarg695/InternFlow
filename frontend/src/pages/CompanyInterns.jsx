import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../services/api'
import { formatDate } from '../utils/internship'
import { PHASE } from '../utils/placement'

export default function CompanyInterns() {
  const { id } = useParams()
  const [title, setTitle] = useState('')
  const [interns, setInterns] = useState([])
  const [mentors, setMentors] = useState([])
  const [choice, setChoice] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savedId, setSavedId] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get(`/company/internships/${id}`),
      api.get(`/company/internships/${id}/interns`),
      api.get('/company/mentors'),
    ])
      .then(([internship, list, team]) => {
        setTitle(internship.data.title)
        setInterns(list.data)
        setMentors(team.data.filter((m) => m.status === 'ACTIVE'))
      })
      .catch(() => setError('Could not load the interns'))
      .finally(() => setLoading(false))
  }, [id])

  const current = (p) => (choice[p.id] !== undefined ? choice[p.id] : p.mentorId ?? '')

  const save = async (p) => {
    setError('')
    setSavedId(null)
    const value = current(p)
    try {
      const res = await api.patch(`/company/placements/${p.id}/mentor`, {
        mentorId: value === '' ? null : Number(value),
      })
      setInterns((list) => list.map((x) => (x.id === p.id ? res.data : x)))
      setChoice((c) => {
        const next = { ...c }
        delete next[p.id]
        return next
      })
      setSavedId(p.id)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not assign the mentor')
    }
  }

  if (loading) return <p className="text-slate-600">Loading...</p>

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/company/internships" className="text-sm text-slate-600 hover:text-indigo-600">
        ← Back to my internships
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-indigo-600">Interns</h1>
      {title && <p className="text-slate-600">{title}</p>}

      {mentors.length === 0 && (
        <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          You have no accepted mentors yet.{' '}
          <Link to="/company/mentors" className="underline">Invite a mentor</Link> first.
        </p>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {interns.length === 0 && !error && (
        <p className="mt-6 rounded-xl bg-white p-6 text-slate-600 shadow">
          No interns yet. A student appears here after accepting an offer.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {interns.map((p) => {
          const phase = PHASE[p.phase]
          const changed = current(p) !== (p.mentorId ?? '')
          return (
            <div key={p.id} className="rounded-xl bg-white p-6 shadow">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{p.studentName}</p>
                  <p className="text-sm text-slate-600">{p.studentEmail}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatDate(p.startDate)} to {formatDate(p.endDate)}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${phase.style}`}>{phase.label}</span>
              </div>

              <div className="mt-4 flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-sm font-medium" htmlFor={`mentor-${p.id}`}>Mentor</label>
                  <select
                    id={`mentor-${p.id}`}
                    value={current(p)}
                    onChange={(e) => setChoice({ ...choice, [p.id]: e.target.value })}
                    className="mt-1 rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">No mentor</option>
                    {mentors.map((m) => (
                      <option key={m.mentorId} value={m.mentorId}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => save(p)}
                  disabled={!changed}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  Save
                </button>
                {savedId === p.id && <span className="text-sm text-green-600">Saved.</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}