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
        Shortlisted students start in round 1. Rounds can be automated MCQ tests or written Theory rounds graded by your team.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {rounds.length === 0 && !error && (
        <p className="mt-6 rounded-xl bg-white p-6 text-slate-600 shadow">No rounds yet.</p>
      )}

      <div className="mt-6 space-y-3">
        {rounds.map((r) => (
          <div key={r.roundNumber} className="flex items-center justify-between rounded-xl bg-white p-5 shadow">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">Round {r.roundNumber}: {r.title}</p>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-semibold ${
                    r.roundType === 'THEORY' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {r.roundType === 'THEORY' ? 'Written Theory' : 'MCQ'}
                </span>
              </div>
              <p className="text-sm text-slate-600">
                {r.questionCount} questions · {r.durationMinutes} minutes
                {r.locked ? ' · locked (students have started)' : ''}
              </p>
            </div>
            <Link
              to={`/company/internships/${id}/rounds/${r.roundNumber}?type=${r.roundType || 'MCQ'}`}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              {r.locked ? 'View' : 'Edit'}
            </Link>
          </div>
        ))}
      </div>

      {nextRound <= MAX_ROUNDS && (
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={`/company/internships/${id}/rounds/${nextRound}?type=MCQ`}
            className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500"
          >
            + Add Round {nextRound} (MCQ Test)
          </Link>
          <Link
            to={`/company/internships/${id}/rounds/${nextRound}?type=THEORY`}
            className="rounded-md bg-purple-600 px-4 py-2 text-white hover:bg-purple-500"
          >
            + Add Round {nextRound} (Written Theory)
          </Link>
        </div>
      )}
    </div>
  )
}
