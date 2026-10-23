import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../services/api'

const MAX_ROUNDS = 10

export default function CompanyRounds() {
  const { id } = useParams()
  const [title, setTitle] = useState('')
  const [rounds, setRounds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.get(`/company/internships/${id}`), api.get(`/company/internships/${id}/rounds`)])
      .then(([internship, list]) => {
        setTitle(internship.data.title)
        setRounds(list.data)
      })
      .catch(() => setError('Could not load the rounds for this internship'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-slate-600">Loading...</p>

  const nextRound = rounds.length + 1

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/company/internships" className="text-sm text-slate-600 hover:text-indigo-600">
        ← Back to my internships
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-indigo-600">Hiring rounds</h1>
      {title && <p className="text-slate-600">{title}</p>}
      <p className="mt-1 text-sm text-slate-500">
        Shortlisted students start in round 1. After a student finishes a round, open the Applicants page
        and move them to the next one.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {rounds.length === 0 && !error && (
        <p className="mt-6 rounded-xl bg-white p-6 text-slate-600 shadow">No rounds yet.</p>
      )}

      <div className="mt-6 space-y-3">
        {rounds.map((r) => (
          <div key={r.roundNumber} className="flex items-center justify-between rounded-xl bg-white p-5 shadow">
            <div>
              <p className="font-semibold">Round {r.roundNumber}: {r.title}</p>
              <p className="text-sm text-slate-600">
                {r.questionCount} questions · {r.durationMinutes} minutes
                {r.locked ? ' · locked (students have started)' : ''}
              </p>
            </div>
            <Link
              to={`/company/internships/${id}/rounds/${r.roundNumber}`}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              {r.locked ? 'View' : 'Edit'}
            </Link>
          </div>
        ))}
      </div>

      {nextRound <= MAX_ROUNDS && (
        <Link
          to={`/company/internships/${id}/rounds/${nextRound}`}
          className="mt-6 inline-block rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500"
        >
          Add round {nextRound}
        </Link>
      )}
    </div>
  )
}