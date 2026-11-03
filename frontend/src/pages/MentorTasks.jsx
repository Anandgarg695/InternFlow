import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../services/api'
import { formatDate } from '../utils/internship'
import { formatDateTime } from '../utils/application'
import { dateInput } from '../utils/offer'
import { TASK_STATUS, safeHttps, stars } from '../utils/task'

const inputClass =
  'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none'

const EMPTY = { title: '', description: '', dueDate: '' }

export default function MentorTasks() {
  const { placementId } = useParams()
  const [intern, setIntern] = useState(null)
  const [tasks, setTasks] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [reviewing, setReviewing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const load = () =>
    Promise.all([api.get('/mentor/interns'), api.get(`/mentor/interns/${placementId}/tasks`)])
      .then(([interns, list]) => {
        setIntern(interns.data.find((i) => String(i.id) === String(placementId)) || null)
        setTasks(list.data)
        setError('')
      })
      .catch(() => setError('Could not load this intern. It may not be assigned to you.'))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [placementId])

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const startEdit = (task) => {
    setEditingId(task.id)
    setForm({ title: task.title, description: task.description, dueDate: task.dueDate })
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
      title: form.title.trim(),
      description: form.description.trim(),
      dueDate: form.dueDate === '' ? null : form.dueDate,
    }
    try {
      if (editingId) {
        await api.put(`/mentor/tasks/${editingId}`, payload)
      } else {
        await api.post(`/mentor/interns/${placementId}/tasks`, payload)
      }
      setEditingId(null)
      setForm(EMPTY)
      await load()
    } catch (err) {
      const data = err.response?.data
      setError(data?.error || 'Could not save the task')
      setFieldErrors(data?.fields || {})
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this task?')) return
    setError('')
    try {
      await api.delete(`/mentor/tasks/${id}`)
      await load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete the task')
    }
  }

  const sendReview = async () => {
    setError('')
    const approve = reviewing.decision === 'APPROVE'
    try {
      await api.patch(`/mentor/tasks/${reviewing.id}/review`, {
        decision: reviewing.decision,
        rating: approve ? Number(reviewing.rating) : null,
        feedback: reviewing.feedback.trim() === '' ? null : reviewing.feedback.trim(),
      })
      setReviewing(null)
      await load()
    } catch (err) {
      const data = err.response?.data
      setError(data?.error || 'Could not save the review')
    }
  }

  if (loading) return <p className="text-slate-600">Loading...</p>

  const fieldError = (name) =>
    fieldErrors[name] && <p className="mt-1 text-sm text-red-600">{fieldErrors[name]}</p>

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/mentor/interns" className="text-sm text-slate-600 hover:text-indigo-600">
        ← Back to my interns
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-indigo-600">Tasks</h1>
      {intern && (
        <p className="text-slate-600">
          {intern.studentName} · {intern.internshipTitle} · {formatDate(intern.startDate)} to{' '}
          {formatDate(intern.endDate)}
        </p>
      )}

      {intern && (
        <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-xl bg-white p-6 shadow">
          <h2 className="font-semibold">{editingId ? 'Edit task' : 'Assign a task'}</h2>

          <div>
            <label className="block text-sm font-medium" htmlFor="title">Title</label>
            <input id="title" name="title" required value={form.title} onChange={onChange} className={inputClass} />
            {fieldError('title')}
          </div>

          <div>
            <label className="block text-sm font-medium" htmlFor="description">What should the intern do?</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              required
              value={form.description}
              onChange={onChange}
              className={inputClass}
            />
            {fieldError('description')}
          </div>

          <div>
            <label className="block text-sm font-medium" htmlFor="dueDate">Due date</label>
            <input
              id="dueDate"
              name="dueDate"
              type="date"
              required
              min={dateInput(0)}
              max={intern.endDate}
              value={form.dueDate}
              onChange={onChange}
              className={inputClass}
            />
            {fieldError('dueDate')}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving ? 'Saving...' : editingId ? 'Save changes' : 'Assign task'}
            </button>
            {editingId && (
              <button type="button" onClick={stopEdit} className="text-sm text-slate-600 hover:text-indigo-600">
                Cancel changes
              </button>
            )}
          </div>
        </form>
      )}

      {!intern && error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {intern && tasks.length === 0 && (
        <p className="mt-6 rounded-xl bg-white p-6 text-slate-600 shadow">No tasks yet.</p>
      )}

      <div className="mt-6 space-y-4">
        {tasks.map((t) => {
          const status = TASK_STATUS[t.status]
          const link = safeHttps(t.submissionLink)
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
                    Submitted {formatDateTime(t.submittedAt)}
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
                <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm">
                  {t.rating && <p className="font-medium text-amber-600">{stars(t.rating)}</p>}
                  {t.feedback && <p className="mt-1 whitespace-pre-line text-slate-600">{t.feedback}</p>}
                </div>
              )}

              {t.status === 'ASSIGNED' && (
                <div className="mt-4 flex gap-2 text-sm">
                  <button
                    onClick={() => startEdit(t)}
                    className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(t.id)}
                    className="rounded-md border border-red-300 px-3 py-1.5 text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              )}

              {t.status === 'SUBMITTED' && reviewing?.id !== t.id && (
                <button
                  onClick={() => setReviewing({ id: t.id, decision: 'APPROVE', rating: '4', feedback: '' })}
                  className="mt-4 rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-500"
                >
                  Review
                </button>
              )}

              {reviewing?.id === t.id && (
                <div className="mt-4 space-y-3 rounded-md border border-slate-200 p-4">
                  <div>
                    <label className="block text-sm font-medium" htmlFor={`decision-${t.id}`}>Decision</label>
                    <select
                      id={`decision-${t.id}`}
                      value={reviewing.decision}
                      onChange={(e) => setReviewing({ ...reviewing, decision: e.target.value })}
                      className={inputClass}
                    >
                      <option value="APPROVE">Approve</option>
                      <option value="REQUEST_CHANGES">Request changes</option>
                    </select>
                  </div>

                  {reviewing.decision === 'APPROVE' && (
                    <div>
                      <label className="block text-sm font-medium" htmlFor={`rating-${t.id}`}>Rating</label>
                      <select
                        id={`rating-${t.id}`}
                        value={reviewing.rating}
                        onChange={(e) => setReviewing({ ...reviewing, rating: e.target.value })}
                        className={inputClass}
                      >
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>{n} - {stars(n)}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium" htmlFor={`feedback-${t.id}`}>
                      {reviewing.decision === 'APPROVE' ? 'Comments (optional)' : 'What needs to change?'}
                    </label>
                    <textarea
                      id={`feedback-${t.id}`}
                      rows={3}
                      value={reviewing.feedback}
                      onChange={(e) => setReviewing({ ...reviewing, feedback: e.target.value })}
                      className={inputClass}
                    />
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <div className="flex gap-3 text-sm">
                    <button
                      onClick={sendReview}
                      className="rounded-md bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-500"
                    >
                      Save review
                    </button>
                    <button onClick={() => setReviewing(null)} className="text-slate-600 hover:text-indigo-600">
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