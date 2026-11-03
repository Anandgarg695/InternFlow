import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { formatDate } from '../utils/internship'
import { PHASE } from '../utils/placement'

export default function MentorInterns() {
  const [invitations, setInvitations] = useState([])
  const [interns, setInterns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () =>
    Promise.all([api.get('/mentor/invitations'), api.get('/mentor/interns')])
      .then(([inv, list]) => {
        setInvitations(inv.data)
        setInterns(list.data)
      })
      .catch(() => setError('Could not load your page'))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [])

  const respond = async (id, action) => {
    setError('')
    try {
      await api.patch(`/mentor/invitations/${id}/${action}`)
      await load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save your answer')
    }
  }

  if (loading) return <p className="text-slate-600">Loading...</p>

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/mentor/dashboard" className="text-sm text-slate-600 hover:text-indigo-600">
        ← Back to dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-indigo-600">My interns</h1>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {invitations.length > 0 && (
        <>
          <h2 className="mt-6 text-lg font-semibold">Invitations from companies</h2>
          <div className="mt-3 space-y-3">
            {invitations.map((i) => (
              <div key={i.linkId} className="flex items-center justify-between gap-4 rounded-xl bg-white p-5 shadow">
                <p>
                  <span className="font-semibold">{i.companyName || 'A company'}</span> invited you to join their
                  mentor team.
                </p>
                <div className="flex gap-2 text-sm">
                  <button
                    onClick={() => respond(i.linkId, 'accept')}
                    className="rounded-md bg-green-600 px-3 py-1.5 text-white hover:bg-green-500"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => respond(i.linkId, 'decline')}
                    className="rounded-md border border-red-300 px-3 py-1.5 text-red-600 hover:bg-red-50"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="mt-8 text-lg font-semibold">Interns assigned to you</h2>
      {interns.length === 0 && (
        <p className="mt-3 rounded-xl bg-white p-6 text-slate-600 shadow">
          No interns assigned yet. After you accept an invitation, the company can assign interns to you.
        </p>
      )}

      <div className="mt-3 space-y-4">
        {interns.map((p) => {
          const phase = PHASE[p.phase]
          return (
            <div key={p.id} className="rounded-xl bg-white p-6 shadow">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{p.studentName}</p>
                  <p className="text-sm text-slate-600">{p.studentEmail}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {p.internshipTitle} · {p.companyName || 'Company'}
                  </p>
                  <p className="text-sm text-slate-600">
                    {formatDate(p.startDate)} to {formatDate(p.endDate)}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${phase.style}`}>{phase.label}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}