import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../services/api'
import { formatDate } from '../utils/internship'
import { stars } from '../utils/task'
import TaskSummary from '../components/TaskSummary'
import EvaluationCard from '../components/EvaluationCard'

const inputClass =
  'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none'

export default function MentorEvaluation() {
  const { placementId } = useParams()
  const [intern, setIntern] = useState(null)
  const [view, setView] = useState(null)
  const [form, setForm] = useState({ overallRating: '4', strengths: '', improvements: '', comments: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [saved, setSaved] = useState(false)

  const load = () =>
    Promise.all([api.get('/mentor/interns'), api.get(`/mentor/interns/${placementId}/evaluation`)])
      .then(([interns, res]) => {
        setIntern(interns.data.find((i) => String(i.id) === String(placementId)) || null)
        setView(res.data)
        if (res.data.evaluation) {
          const e = res.data.evaluation
          setForm({
            overallRating: String(e.overallRating),
            strengths: e.strengths,
            improvements: e.improvements ?? '',
            comments: e.comments ?? '',
          })
        }
        setError('')
      })
      .catch(() => setError('Could not load this intern. It may not be assigned to you.'))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [placementId])

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setSaved(false)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setSaved(false)
    setSaving(true)
    try {
      await api.put(`/mentor/interns/${placementId}/evaluation`, {
        overallRating: Number(form.overallRating),
        strengths: form.strengths.trim(),
        improvements: form.improvements.trim() === '' ? null : form.improvements.trim(),
        comments: form.comments.trim() === '' ? null : form.comments.trim(),
      })
      setSaved(true)
      await load()
    } catch (err) {
      const data = err.response?.data
      setError(data?.error || 'Could not save the evaluation')
      setFieldErrors(data?.fields || {})
    } finally {
      setSaving(false)
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
      <h1 className="mt-2 text-2xl font-bold text-indigo-600">Final evaluation</h1>
      {intern && (
        <p className="text-slate-600">
          {intern.studentName} · {intern.internshipTitle} · {formatDate(intern.startDate)} to{' '}
          {formatDate(intern.endDate)}
        </p>
      )}

      {!view && error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {view && (
        <>
          <div className="mt-4 rounded-xl bg-white p-6 shadow">
            <h2 className="font-semibold">Task summary</h2>
            <div className="mt-1">
              <TaskSummary tasks={view.tasks} />
            </div>
          </div>

          {view.completed ? (
            <div className="mt-6 rounded-xl bg-white p-6 shadow">
              <p className="mb-3 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                The company has completed this internship, so the evaluation is locked.
              </p>
              {view.evaluation && <EvaluationCard evaluation={view.evaluation} />}
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-xl bg-white p-6 shadow">
              {!view.ended && (
                <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                  The final evaluation can be written after the internship ends on {formatDate(view.endDate)}.
                </p>
              )}

              <fieldset disabled={!view.ended} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium" htmlFor="overallRating">Overall rating</label>
                  <select
                    id="overallRating"
                    name="overallRating"
                    value={form.overallRating}
                    onChange={onChange}
                    className={inputClass}
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>{n} - {stars(n)}</option>
                    ))}
                  </select>
                  {fieldError('overallRating')}
                </div>

                <div>
                  <label className="block text-sm font-medium" htmlFor="strengths">Strengths</label>
                  <textarea
                    id="strengths"
                    name="strengths"
                    rows={3}
                    required
                    value={form.strengths}
                    onChange={onChange}
                    className={inputClass}
                  />
                  {fieldError('strengths')}
                </div>

                <div>
                  <label className="block text-sm font-medium" htmlFor="improvements">Areas to improve (optional)</label>
                  <textarea
                    id="improvements"
                    name="improvements"
                    rows={3}
                    value={form.improvements}
                    onChange={onChange}
                    className={inputClass}
                  />
                  {fieldError('improvements')}
                </div>

                <div>
                  <label className="block text-sm font-medium" htmlFor="comments">Comments (optional)</label>
                  <textarea
                    id="comments"
                    name="comments"
                    rows={3}
                    value={form.comments}
                    onChange={onChange}
                    className={inputClass}
                  />
                  {fieldError('comments')}
                </div>
              </fieldset>

              {error && <p className="text-sm text-red-600">{error}</p>}
              {saved && <p className="text-sm text-green-600">Evaluation saved. You can edit it until the company completes the internship.</p>}

              <button
                type="submit"
                disabled={saving || !view.ended}
                className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500 disabled:opacity-60"
              >
                {saving ? 'Saving...' : view.evaluation ? 'Update evaluation' : 'Save evaluation'}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  )
}