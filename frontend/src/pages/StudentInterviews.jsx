import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import {
  ACTIVE_STATUSES,
  INTERVIEW_MODES,
  INTERVIEW_STATUS,
  INTERVIEW_TYPES,
  formatWhen,
  safeHttps,
} from '../utils/interview'

export default function StudentInterviews() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [asking, setAsking] = useState(null)

  const load = () =>
    api.get('/student/interviews')
      .then((res) => setItems(res.data))
      .catch(() => setError('Could not load your interviews'))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [])

  const confirmInterview = async (id) => {
    setError('')
    try {
      await api.patch(`/student/interviews/${id}/confirm`)
      await load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not confirm the interview')
    }
  }

  const sendRequest = async () => {
    setError('')
    try {
      await api.patch(`/student/interviews/${asking.id}/reschedule-request`, { reason: asking.reason.trim() })
      setAsking(null)
      await load()
    } catch (err) {
      const data = err.response?.data
      setError(data?.fields?.reason || data?.error || 'Could not send your request')
    }
  }

  if (loading) return <p className="text-slate-600">Loading your interviews...</p>

  const upcoming = items.filter((i) => ACTIVE_STATUSES.includes(i.status))
  const past = items.filter((i) => !ACTIVE_STATUSES.includes(i.status))

  const card = (iv) => {
    const status = INTERVIEW_STATUS[iv.status]
    const link = safeHttps(iv.meetingLink)
    return (
      <div key={iv.id} className="rounded-xl bg-white p-6 shadow">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-semibold">{iv.internshipTitle}</p>
            <p className="text-sm text-indigo-600">{iv.companyName || 'Company'}</p>
            <p className="mt-1 text-sm text-slate-600">
              {INTERVIEW_TYPES[iv.type]} interview · round {iv.roundNumber}
            </p>
            <p className="text-sm text-slate-600">
              {formatWhen(iv.scheduledAt)} · {iv.durationMinutes} min · {INTERVIEW_MODES[iv.mode]}
            </p>
            {iv.mode === 'ONLINE' && link && (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-500"
              >
                Join meeting
              </a>
            )}
            {iv.mode === 'ONSITE' && iv.location && (
              <p className="mt-1 text-sm text-slate-600">Location: {iv.location}</p>
            )}
            {iv.notes && <p className="mt-2 whitespace-pre-line text-sm text-slate-500">{iv.notes}</p>}
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.style}`}>{status.label}</span>
        </div>

        {iv.status === 'RESCHEDULE_REQUESTED' && (
          <p className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            You asked for a new time ({iv.rescheduleReason}). The company will contact you.
          </p>
        )}

        {(iv.status === 'SCHEDULED' || iv.status === 'CONFIRMED') && (
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {iv.status === 'SCHEDULED' && (
              <button
                onClick={() => confirmInterview(iv.id)}
                className="rounded-md bg-green-600 px-3 py-1.5 text-white hover:bg-green-500"
              >
                Confirm
              </button>
            )}
            <button
              onClick={() => setAsking({ id: iv.id, reason: '' })}
              className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
            >
              Request a new time
            </button>
          </div>
        )}

        {asking?.id === iv.id && (
          <div className="mt-4 space-y-3 rounded-md border border-slate-200 p-4">
            <label className="block text-sm font-medium" htmlFor={`reason-${iv.id}`}>
              Why do you need a new time?
            </label>
            <textarea
              id={`reason-${iv.id}`}
              rows={3}
              value={asking.reason}
              onChange={(e) => setAsking({ ...asking, reason: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
            />
            <div className="flex gap-3 text-sm">
              <button
                onClick={sendRequest}
                disabled={asking.reason.trim() === ''}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-500 disabled:opacity-60"
              >
                Send request
              </button>
              <button onClick={() => setAsking(null)} className="text-slate-600 hover:text-indigo-600">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/student/dashboard" className="text-sm text-slate-600 hover:text-indigo-600">
        ← Back to dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-indigo-600">My interviews</h1>
      <p className="mt-1 text-sm text-slate-500">Times are shown in your computer's time zone.</p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {items.length === 0 && !error && (
        <p className="mt-6 rounded-xl bg-white p-6 text-slate-600 shadow">
          You have no interviews yet. Companies schedule them for shortlisted applicants.
        </p>
      )}

      {upcoming.length > 0 && (
        <>
          <h2 className="mt-6 text-lg font-semibold">Upcoming</h2>
          <div className="mt-3 space-y-4">{upcoming.map(card)}</div>
        </>
      )}
      {past.length > 0 && (
        <>
          <h2 className="mt-8 text-lg font-semibold">Past and cancelled</h2>
          <div className="mt-3 space-y-4">{past.map(card)}</div>
        </>
      )}
    </div>
  )
}