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

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm font-medium text-slate-500">Loading your scheduled interviews...</p>
      </div>
    )
  }

  const upcoming = items.filter((i) => ACTIVE_STATUSES.includes(i.status))
  const past = items.filter((i) => !ACTIVE_STATUSES.includes(i.status))

  const card = (iv) => {
    const status = INTERVIEW_STATUS[iv.status]
    const link = safeHttps(iv.meetingLink)
    return (
      <div key={iv.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                {INTERVIEW_TYPES[iv.type]} Interview
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500">Round {iv.roundNumber}</span>
            </div>
            <h3 className="mt-1 text-lg font-bold text-slate-900">{iv.internshipTitle}</h3>
            <p className="text-sm font-medium text-slate-600">{iv.companyName || 'Company'}</p>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <span className="flex items-center gap-1 font-medium text-slate-800">
                {formatWhen(iv.scheduledAt)}
              </span>
              <span>·</span>
              <span>{iv.durationMinutes} minutes</span>
              <span>·</span>
              <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                {INTERVIEW_MODES[iv.mode]}
              </span>
            </div>

            {iv.mode === 'ONLINE' && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {iv.roomCode && (
                  <Link
                    to={`/interview-room/${iv.roomCode}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 shadow-2xs transition-colors"
                  >
                    Enter Video Room →
                  </Link>
                )}
                {link && !link.includes('/interview-room/') && (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    External Link ↗
                  </a>
                )}
              </div>
            )}

            {iv.mode === 'ONSITE' && iv.location && (
              <p className="mt-2 text-xs text-slate-600">Location: {iv.location}</p>
            )}
            {iv.notes && <p className="mt-2 whitespace-pre-line text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">{iv.notes}</p>}
          </div>

          <span className={`self-start rounded-full px-2.5 py-0.5 text-xs font-medium ${status.style}`}>
            {status.label}
          </span>
        </div>

        {iv.status === 'RESCHEDULE_REQUESTED' && (
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
            You requested a new time: "{iv.rescheduleReason}". The company has been notified.
          </p>
        )}

        {(iv.status === 'SCHEDULED' || iv.status === 'CONFIRMED') && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
            {iv.status === 'SCHEDULED' && (
              <button
                onClick={() => confirmInterview(iv.id)}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-500 transition-colors"
              >
                Confirm Attendance
              </button>
            )}
            <button
              onClick={() => setAsking({ id: iv.id, reason: '' })}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Request New Time
            </button>
          </div>
        )}

        {asking?.id === iv.id && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
            <label className="block text-xs font-semibold text-slate-700" htmlFor={`reason-${iv.id}`}>
              Reason for rescheduling
            </label>
            <textarea
              id={`reason-${iv.id}`}
              rows={2}
              value={asking.reason}
              onChange={(e) => setAsking({ ...asking, reason: e.target.value })}
              placeholder="Please explain why you need to reschedule and suggest alternate times..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
            <div className="flex gap-2 text-xs">
              <button
                onClick={sendRequest}
                disabled={asking.reason.trim() === ''}
                className="rounded-lg bg-slate-900 px-3 py-1.5 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Send Request
              </button>
              <button onClick={() => setAsking(null)} className="px-2 py-1.5 font-medium text-slate-600 hover:text-slate-900">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/student/dashboard" className="hover:text-indigo-600">
              Dashboard
            </Link>
            <span>/</span>
            <span>Interviews</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Interviews</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Times are automatically adjusted to your local time zone.
          </p>
        </div>

        <div>
          <Link
            to="/student/internships"
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors inline-block"
          >
            Explore Open Internships
          </Link>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-4 text-xs font-medium text-red-700 border border-red-200">{error}</p>}

      {/* Clean Structured Empty State */}
      {items.length === 0 && !error && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 font-bold">
            <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900">No Interviews Scheduled Yet</h3>
          <p className="mt-1.5 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            When recruiters review your applications and shortlist your profile, your technical and HR rounds will appear here with built-in video calling.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/student/internships"
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              Browse Open Internships
            </Link>
            <Link
              to="/student/applications"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Check Application Status
            </Link>
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Upcoming Interviews ({upcoming.length})
          </h2>
          <div className="grid grid-cols-1 gap-4">{upcoming.map(card)}</div>
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-slate-200">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Past & Completed Rounds ({past.length})
          </h2>
          <div className="grid grid-cols-1 gap-4 opacity-85">{past.map(card)}</div>
        </div>
      )}
    </div>
  )
}
