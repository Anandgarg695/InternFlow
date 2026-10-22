import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../services/api'

const LETTERS = ['A', 'B', 'C', 'D']
const MAX_QUESTIONS = 50

const blankQuestion = () => ({ text: '', options: ['', '', '', ''], correctOption: 0 })

const inputClass =
  'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none'

export default function CompanyTest() {
  const { id } = useParams()
  const [internshipTitle, setInternshipTitle] = useState('')
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState('30')
  const [questions, setQuestions] = useState([blankQuestion()])
  const [exists, setExists] = useState(false)
  const [locked, setLocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.get(`/company/internships/${id}`)
      .then((res) => setInternshipTitle(res.data.title))
      .catch(() => {})

    api.get(`/company/internships/${id}/test`)
      .then((res) => {
        setTitle(res.data.title)
        setDuration(String(res.data.durationMinutes))
        setQuestions(
          res.data.questions.map((q) => ({
            text: q.text,
            options: [...q.options],
            correctOption: q.correctOption,
          })),
        )
        setExists(true)
        setLocked(res.data.locked)
      })
      .catch((err) => {
        if (err.response?.status !== 404) setError('Could not load the test')
      })
      .finally(() => setLoading(false))
  }, [id])

  const touch = () => setSaved(false)

  const updateQuestion = (index, patch) => {
    touch()
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)))
  }

  const updateOption = (qIndex, oIndex, value) => {
    touch()
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qIndex ? { ...q, options: q.options.map((o, j) => (j === oIndex ? value : o)) } : q,
      ),
    )
  }

  const addQuestion = () => {
    touch()
    setQuestions((qs) => [...qs, blankQuestion()])
  }

  const removeQuestion = (index) => {
    touch()
    setQuestions((qs) => qs.filter((_, i) => i !== index))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaved(false)
    setSaving(true)
    try {
      const res = await api.put(`/company/internships/${id}/test`, {
        title: title.trim(),
        durationMinutes: duration === '' ? null : Number(duration),
        questions: questions.map((q) => ({
          text: q.text.trim(),
          options: q.options.map((o) => o.trim()),
          correctOption: q.correctOption,
        })),
      })
      setExists(true)
      setLocked(res.data.locked)
      setSaved(true)
    } catch (err) {
      const data = err.response?.data
      const firstField = data?.fields ? Object.values(data.fields)[0] : null
      setError(firstField ? `${data.error}: ${firstField}` : data?.error || 'Could not save the test')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!window.confirm('Delete this test? This cannot be undone.')) return
    setError('')
    try {
      await api.delete(`/company/internships/${id}/test`)
      setTitle('')
      setDuration('30')
      setQuestions([blankQuestion()])
      setExists(false)
      setSaved(false)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete the test')
    }
  }

  if (loading) return <p className="text-slate-600">Loading...</p>

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/company/internships" className="text-sm text-slate-600 hover:text-indigo-600">
        ← Back to my internships
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-indigo-600">Screening test</h1>
      {internshipTitle && <p className="text-slate-600">{internshipTitle}</p>}
      <p className="mt-1 text-sm text-slate-500">
        Only shortlisted students can take this test. Each student gets one attempt, and the timer starts
        when they click Start.
      </p>

      {locked && (
        <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          Students have already started this test, so it can no longer be edited or deleted.
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        <fieldset disabled={locked} className="space-y-6">
          <div className="grid gap-4 rounded-xl bg-white p-6 shadow sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium" htmlFor="title">Test title</label>
              <input
                id="title"
                value={title}
                required
                onChange={(e) => {
                  touch()
                  setTitle(e.target.value)
                }}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="duration">Time limit (5 to 180 min)</label>
              <input
                id="duration"
                type="number"
                min="5"
                max="180"
                required
                value={duration}
                onChange={(e) => {
                  touch()
                  setDuration(e.target.value)
                }}
                className={inputClass}
              />
            </div>
          </div>

          {questions.map((q, qi) => (
            <div key={qi} className="rounded-xl bg-white p-6 shadow">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Question {qi + 1}</h2>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(qi)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>

              <textarea
                rows={2}
                required
                value={q.text}
                onChange={(e) => updateQuestion(qi, { text: e.target.value })}
                placeholder="Write the question"
                className={inputClass}
              />

              <p className="mt-3 text-xs text-slate-500">Select the radio button next to the correct answer.</p>
              <div className="mt-2 space-y-2">
                {q.options.map((option, oi) => (
                  <div key={oi} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name={`correct-${qi}`}
                      checked={q.correctOption === oi}
                      onChange={() => updateQuestion(qi, { correctOption: oi })}
                      aria-label={`Option ${LETTERS[oi]} is correct`}
                    />
                    <span className="w-5 text-sm font-medium text-slate-500">{LETTERS[oi]}</span>
                    <input
                      required
                      value={option}
                      onChange={(e) => updateOption(qi, oi, e.target.value)}
                      placeholder={`Option ${LETTERS[oi]}`}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addQuestion}
            disabled={questions.length >= MAX_QUESTIONS}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            Add question
          </button>
        </fieldset>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-green-600">Test saved.</p>}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving || locked}
            className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {saving ? 'Saving...' : exists ? 'Save changes' : 'Create test'}
          </button>
          {exists && !locked && (
            <button
              type="button"
              onClick={remove}
              className="rounded-md border border-red-300 px-4 py-2 text-red-600 hover:bg-red-50"
            >
              Delete test
            </button>
          )}
        </div>
      </form>
    </div>
  )
}