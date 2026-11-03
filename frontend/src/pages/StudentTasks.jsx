import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../services/api'
import { formatDate } from '../utils/internship'
import { formatDateTime } from '../utils/application'
import { TASK_STATUS, safeHttps, stars } from '../utils/task'

const inputClass =
  'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none'

export default function StudentTasks() {
  const { placementId } = useParams()
  const [placement, setPlacement] = useState(null)
  const [tasks, setTasks] = useState([])
  const [draft, setDraft] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const load = () =>
    Promise.all([api.get('/student/placements'), api.get(`/student/placements/${placementId}/tasks`)])
      .then(([placements, list]) => {
        setPlacement(placements.data.find((p) => String(p.id) === String(placementId)) || null)
        setTasks(list.data)
        setError('')
      })
      .catch(() => setError('Could not load your tasks'))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [placementId])

  const submit = async () => {
    setError('')
    setFieldErrors({})
    setSaving(true)
    try {
      await api.post(`/student/tasks/${draft.id}/submission`, {
        text: draft.text.trim(),
        link: draft.link.trim() === '' ? null : draft.link.trim(),
      })
      setDraft(null)
      await load()
    } catch (err) {
      const data = err.response?.data
      setError(data?.error || 'Could not submit your work')
      setFieldErrors(data?.fields || {})
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-slate-600">Loading...</p>

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/student/placements" className="text-sm text-slate-600 hover:text-indigo-600">
        ← Back to my internship
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-indigo-600">My tasks</h1>
      {placement && (
        <p className="text-slate-600">
          {placement.internshipTitle} · {formatDate(placement.startDate)} to {formatDate(placement.endDate)}
        </p>
      )}

      {error && !draft && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {tasks.length === 0 && !error && (
        <p className="mt-6 rounded-xl bg-white p-6 text-slate-600 shadow">
          No tasks yet. Your mentor will assign them here.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {tasks.map((t) => {
          const status = TASK_STATUS[t.status]
          const link = safeHttps(t.submissionLink)
          const canSubmit = t.status === 'ASSIGNED' || t.status === 'CHANGES_REQUESTED'
          return (
            <div key={t.id} className="rounded-xl bg-white p-6 shadow">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold">{t.title}</p>
                  <p className="text-sm text-slate-600">Due {formatDate(t.dueDate)}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.style}`}>{status.label}</span>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{t.description}</p>

              {t.submissionText && (
                <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm">
                  <p className="font-medium text-slate-700">
                    Your submission · {formatDateTime(t.submittedAt)}
                    {t.late && <span className="ml-2 text-red-600">(late)</span>}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-slate-600">{t.submissionText}</p>
                  {link && (
                    <a href={link} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-indigo-600 hover:underline">
                      Open link
                    </a>
                  )}
                </div>
              )}

              {(t.status === 'REVIEWED' || t.status === 'CHANGES_REQUESTED') && (
                <div className="mt-3 rounded-md bg-indigo-50 p-3 text-sm">
                  <p className="font-medium text-slate-700">Feedback from your mentor</p>
                  {t.rating && <p className="mt-1 font-medium text-amber-600">{stars(t.rating)}</p>}
                  {t.feedback && <p className="mt-1 whitespace-pre-line text-slate-600">{t.feedback}</p>}
                </div>
              )}

              {canSubmit && draft?.id !== t.id && (
                <button
                  onClick={() => {
                    setError('')
                    setFieldErrors({})
                    setDraft({ id: t.id, text: '', link: '' })
                  }}
                  className="mt-4 rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-500"
                >
                  {t.status === 'CHANGES_REQUESTED' ? 'Resubmit work' : 'Submit work'}
                </button>
              )}

              {draft?.id === t.id && (
                <div className="mt-4 space-y-3 rounded-md border border-slate-200 p-4">
                  <div>
                    <label className="block text-sm font-medium" htmlFor={`text-${t.id}`}>Your work</label>
                    <textarea
                      id={`text-${t.id}`}
                      rows={5}
                      value={draft.text}
                      onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                      className={inputClass}
                    />
                    {fieldErrors.text && <p className="mt-1 text-sm text-red-600">{fieldErrors.text}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium" htmlFor={`link-${t.id}`}>
                      Link (optional, must start with https://)
                    </label>
                    <input
                      id={`link-${t.id}`}
                      value={draft.link}
                      onChange={(e) => setDraft({ ...draft, link: e.target.value })}
                      placeholder="https://github.com/..."
                      className={inputClass}
                    />
                    {fieldErrors.link && <p className="mt-1 text-sm text-red-600">{fieldErrors.link}</p>}
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <div className="flex gap-3 text-sm">
                    <button
                      onClick={submit}
                      disabled={saving || draft.text.trim() === ''}
                      className="rounded-md bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-500 disabled:opacity-60"
                    >
                      {saving ? 'Submitting...' : 'Submit'}
                    </button>
                    <button onClick={() => setDraft(null)} className="text-slate-600 hover:text-indigo-600">
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