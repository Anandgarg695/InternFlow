import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'

export default function CompanyGradeTheory() {
  const { id, round, applicationId } = useParams()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [grades, setGrades] = useState({})
  const [feedbacks, setFeedbacks] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.get(`/company/internships/${id}/rounds/${round}/submissions/${applicationId}`)
      .then((res) => {
        setData(res.data)
        const initGrades = {}
        const initFeedback = {}
        res.data.answers.forEach((a) => {
          initGrades[a.questionId] = a.score !== null ? a.score : 0
          initFeedback[a.questionId] = a.feedback || ''
        })
        setGrades(initGrades)
        setFeedbacks(initFeedback)
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Could not load student submission')
      })
      .finally(() => setLoading(false))
  }, [id, round, applicationId])

  const submitGrades = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = data.answers.map((a) => ({
        questionId: a.questionId,
        score: Number(grades[a.questionId]) || 0,
        feedback: feedbacks[a.questionId] || null,
      }))
      const res = await api.post(
        `/company/internships/${id}/rounds/${round}/submissions/${applicationId}/grade`,
        { grades: payload }
      )
      setData(res.data)
      setSaved(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not submit grades')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-slate-600">Loading student submission...</p>

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow">
        <p className="text-red-600">{error || 'Submission not found'}</p>
        <Link to={`/company/internships/${id}/applicants`} className="mt-4 inline-block text-indigo-600 hover:underline">
          ← Back to applicants
        </Link>
      </div>
    )
  }

  const currentTotal = Object.values(grades).reduce((sum, val) => sum + (Number(val) || 0), 0)

  return (
    <div className="mx-auto max-w-3xl">
      <Link to={`/company/internships/${id}/applicants`} className="text-sm text-slate-600 hover:text-indigo-600">
        ← Back to applicants
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-indigo-600">Grade Written Theory</h1>
          <p className="mt-1 text-slate-700">
            Student: <span className="font-semibold">{data.studentName}</span> · Round {round}
          </p>
        </div>
        <div className="rounded-lg bg-indigo-50 px-4 py-2 text-right">
          <p className="text-xs text-indigo-700 font-medium">Calculated Score</p>
          <p className="text-lg font-bold text-indigo-900">{currentTotal} / {data.maxScore}</p>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {saved && (
        <div className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
          Grades saved and candidate notified! Total: {data.totalScore} / {data.maxScore}.
        </div>
      )}

      <form onSubmit={submitGrades} className="mt-6 space-y-6">
        {data.answers.map((a, idx) => (
          <div key={a.questionId} className="rounded-xl bg-white p-6 shadow space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-slate-800">Question {idx + 1}</h3>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                Max: {a.maxScore} pts
              </span>
            </div>

            <p className="text-sm text-slate-700 whitespace-pre-line bg-slate-50 p-3 rounded-md border border-slate-200">
              {a.questionText}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Candidate's Answer
              </label>
              <div className="mt-1 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-800 whitespace-pre-line">
                {a.answerText || <span className="italic text-slate-400">No response provided</span>}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-600">Awarded Score (0 to {a.maxScore})</label>
                <input
                  type="number"
                  min="0"
                  max={a.maxScore}
                  value={grades[a.questionId] ?? ''}
                  onChange={(e) => {
                    setSaved(false)
                    setGrades({ ...grades, [a.questionId]: e.target.value })
                  }}
                  required
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600">Feedback / Comments (optional)</label>
                <input
                  type="text"
                  value={feedbacks[a.questionId] || ''}
                  onChange={(e) => {
                    setSaved(false)
                    setFeedbacks({ ...feedbacks, [a.questionId]: e.target.value })
                  }}
                  placeholder="e.g. Good architecture choice, but missed cache invalidation."
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-purple-600 px-6 py-2.5 font-medium text-white hover:bg-purple-500 disabled:opacity-60"
          >
            {saving ? 'Saving grades...' : data.graded ? 'Update grades' : 'Submit & publish grades'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/company/internships/${id}/applicants`)}
            className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Back to applicants
          </button>
        </div>
      </form>
    </div>
  )
}
