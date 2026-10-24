import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../services/api'
import {
  ACTIVE_STATUSES,
  INTERVIEW_MODES,
  INTERVIEW_STATUS,
  INTERVIEW_TYPES,
  formatWhen,
  safeHttps,
  toLocalInput,
} from '../utils/interview'

const inputClass =
  'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none'

const EMPTY = {
  applicationId: '',
  type: 'TECHNICAL',
  mode: 'ONLINE',
  scheduledAt: '',
  durationMinutes: '45',
  meetingLink: '',
  location: '',
  notes: '',
}

const blankToNull = (value) => (value.trim() === '' ? null : value.trim())

export default function CompanyInterviews() {
  const { id } = useParams()
  const [title, setTitle] = useState('')
  const [shortlisted, setShortlisted] = useState([])
  const [interviews, setInterviews] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [completing, setCompleting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const load = () =>
    Promise.all([
      api.get(`/company/internships/${id}`),
      api.get(`/company/internships/${id}/applications`),
      api.get(`/company/internships/${id}/interviews`),
    ])
      .then(([internship, applicants, list]) => {
        setTitle(internship.data.title)
        setShortlisted(applicants.data.filter((a) => a.status === 'SHORTLISTED'))
        setInterviews(list.data)
      })
      .catch(() => setError('Could not load the interviews'))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [id])

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const startEdit = (iv) => {
    setEditingId(iv.id)
    setForm({
      applicationId: String(iv.applicationId),
      type: iv.type,
      mode: iv.mode,
      scheduledAt: toLocalInput(iv.scheduledAt),
      durationMinutes: String(iv.durationMinutes),
      meetingLink: iv.meetingLink ?? '',
      location: iv.location ?? '',
      notes: iv.notes ?? '',
    })
    setError('')
    setFieldErrors({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const stopEdit = () => {
    setEditingId(null)
    setForm(EMPTY)
    setError('')
    setFieldErrors({})
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setSaving(true)
    const payload = {
      type: form.type,
      mode: form.mode,
      scheduledAt: form.scheduledAt === '' ? null : new Date(form.scheduledAt).toISOString(),
      durationMinutes: form.durationMinutes === '' ? null : Number(form.durationMinutes),
      meetingLink: form.mode === 'ONLINE' ? blankToNull(form.meetingLink) : null,
      location: form.mode === 'ONSITE' ? blankToNull(form.location) : null,
      notes: blankToNull(form.notes),
    }
    try {
      if (editingId) {
        await api.put(`/company/interviews/${editingId}`, payload)
      } else {
        await api.post(`/company/applications/${form.applicationId}/interviews`, payload)
      }
      setEditingId(null)
      setForm(EMPTY)
      await load()
    } catch (err) {
      const data = err.response?.data
      setError(data?.error || 'Could not save the interview')
      setFieldErrors(data?.fields || {})
    } finally {
      setSaving(false)
    }
  }

  const cancel = async (interviewId) => {
    if (!window.confirm('Cancel this interview?')) return
    setError('')
    try {
      await api.patch(`/company/interviews/${interviewId}/cancel`)
      await load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not cancel the interview')
    }
  }

  const complete = async () => {
    setError('')
    try {
      await api.patch(`/company/interviews/${completing.id}/complete`, {
        outcome: completing.outcome,
        feedback: blankToNull(completing.feedback),
      })
      setCompleting(null)
      await load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save the result')
    }
  }

  if (loading) return <p className="text-slate-600">Loading...</p>

  const fieldError = (name) =>
    fieldErrors[name] && <p className="mt-1 text-sm text-red-600">{fieldErrors[name]}</p>

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/company/internships" className="text-sm text-slate-600 hover:text-indigo-600">
        ← Back to my internships
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-indigo-600">Interviews</h1>
      {title && <p className="text-slate-600">{title}</p>}
      <p className="mt-1 text-sm text-slate-500">
        Only shortlisted applicants can be interviewed. Times use your computer's time zone.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-xl bg-white p-6 shadow">
        <h2 className="font-semibold">{editingId ? 'Reschedule interview' : 'Schedule an interview'}</h2>

        <div>
          <label className="block text-sm font-medium" htmlFor="applicationId">Applicant</label>
          <select
            id="applicationId"
            name="applicationId"
            required
            disabled={Boolean(editingId)}
            value={form.applicationId}
            onChange={onChange}
            className={inputClass}
          >
            <option value="">Select a shortlisted applicant</option>
            {shortlisted.map((a) => (
              <option key={a.id} value={a.id}>
                {a.studentName} (round {a.currentRound})
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium" htmlFor="type">Interview type</label>
            <select id="type" name="type" value={form.type} onChange={onChange} className={inputClass}>
              {Object.entries(INTERVIEW_TYPES).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="mode">Mode</label>
            <select id="mode" name="mode" value={form.mode} onChange={onChange} className={inputClass}>
              {Object.entries(INTERVIEW_MODES).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="scheduledAt">Date and time</label>
            <input
              id="scheduledAt"
              name="scheduledAt"
              type="datetime-local"
              required
              min={toLocalInput(new Date().toISOString())}
              value={form.scheduledAt}
              onChange={onChange}
              className={inputClass}
            />
            {fieldError('scheduledAt')}
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="durationMinutes">Duration (15 to 180 minutes)</label>
            <input
              id="durationMinutes"
              name="durationMinutes"
              type="number"
              min="15"
              max="180"
              required
              value={form.durationMinutes}
              onChange={onChange}
              className={inputClass}
            />
            {fieldError('durationMinutes')}
          </div>
        </div>

        {form.mode === 'ONLINE' ? (
          <div>
            <label className="block text-sm font-medium" htmlFor="meetingLink">
              Meeting link (Google Meet, Zoom...), must start with https://
            </label>
            <input
              id="meetingLink"
              name="meetingLink"
              required
              value={form.meetingLink}
              onChange={onChange}
              placeholder="https://meet.google.com/..."
              className={inputClass}
            />
            {fieldError('meetingLink')}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium" htmlFor="location">Location</label>
            <input
              id="location"
              name="location"
              required
              value={form.location}
              onChange={onChange}
              placeholder="Office address, floor, room"
              className={inputClass}
            />
            {fieldError('location')}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium" htmlFor="notes">Notes for the student (optional)</label>
          <textarea id="notes" name="notes" rows={2} value={form.notes} onChange={onChange} className={inputClass} />
          {fieldError('notes')}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {saving ? 'Saving...' : editingId ? 'Save new time' : 'Schedule interview'}
          </button>
          {editingId && (
            <button type="button" onClick={stopEdit} className="text-sm text-slate-600 hover:text-indigo-600">
              Cancel changes
            </button>
          )}
        </div>
      </form>

      <h2 className="mt-8 text-lg font-semibold">Scheduled interviews</h2>
      {interviews.length === 0 && (
        <p className="mt-3 rounded-xl bg-white p-6 text-slate-600 shadow">No interviews yet.</p>
      )}

      <div className="mt-3 space-y-4">
        {interviews.map((iv) => {
          const status = INTERVIEW_STATUS[iv.status]
          const active = ACTIVE_STATUSES.includes(iv.status)
          const link = safeHttps(iv.meetingLink)
          return (
            <div key={iv.id} className="rounded-xl bg-white p-6 shadow">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{iv.studentName}</p>
                  <p className="text-sm text-slate-600">
                    {INTERVIEW_TYPES[iv.type]} interview · round {iv.roundNumber}
                  </p>
                  <p className="text-sm text-slate-600">
                    {formatWhen(iv.scheduledAt)} · {iv.durationMinutes} min · {INTERVIEW_MODES[iv.mode]}
                  </p>
                  {iv.mode === 'ONLINE' && link && (
                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">
                      Meeting link
                    </a>
                  )}
                  {iv.mode === 'ONSITE' && iv.location && <p className="text-sm text-slate-600">{iv.location}</p>}
                  {iv.notes && <p className="mt-1 whitespace-pre-line text-sm text-slate-500">{iv.notes}</p>}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.style}`}>{status.label}</span>
              </div>

              {iv.status === 'RESCHEDULE_REQUESTED' && (
                <p className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                  The student asked for a new time: {iv.rescheduleReason}
                </p>
              )}

              {iv.status === 'COMPLETED' && (
                <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm">
                  <p className="font-medium">Result: {iv.outcome === 'PASSED' ? 'Passed' : 'Failed'}</p>
                  {iv.feedback && <p className="mt-1 whitespace-pre-line text-slate-600">{iv.feedback}</p>}
                  <p className="mt-1 text-xs text-slate-500">Only you can see this.</p>
                </div>
              )}

              {active && (
                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                  <button
                    onClick={() => startEdit(iv)}
                    className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={() => setCompleting({ id: iv.id, outcome: 'PASSED', feedback: '' })}
                    className="rounded-md bg-slate-800 px-3 py-1.5 text-white hover:bg-slate-700"
                  >
                    Mark completed
                  </button>
                  <button
                    onClick={() => cancel(iv.id)}
                    className="rounded-md border border-red-300 px-3 py-1.5 text-red-600 hover:bg-red-50"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {completing?.id === iv.id && (
                <div className="mt-4 space-y-3 rounded-md border border-slate-200 p-4">
                  <div>
                    <label className="block text-sm font-medium" htmlFor={`outcome-${iv.id}`}>Result</label>
                    <select
                      id={`outcome-${iv.id}`}
                      value={completing.outcome}
                      onChange={(e) => setCompleting({ ...completing, outcome: e.target.value })}
                      className={inputClass}
                    >
                      <option value="PASSED">Passed</option>
                      <option value="FAILED">Failed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium" htmlFor={`feedback-${iv.id}`}>
                      Private feedback (optional)
                    </label>
                    <textarea
                      id={`feedback-${iv.id}`}
                      rows={3}
                      value={completing.feedback}
                      onChange={(e) => setCompleting({ ...completing, feedback: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex gap-3 text-sm">
                    <button
                      onClick={complete}
                      className="rounded-md bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-500"
                    >
                      Save result
                    </button>
                    <button onClick={() => setCompleting(null)} className="text-slate-600 hover:text-indigo-600">
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}