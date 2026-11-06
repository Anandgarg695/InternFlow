import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api from '../services/api'

const LETTERS = ['A', 'B', 'C', 'D']
const MAX_QUESTIONS = 50

const blankMcq = () => ({ text: '', options: ['', '', '', ''], correctOption: 0 })
const blankTheory = () => ({ text: '', maxScore: 10 })

const inputClass =
  'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none'

export default function CompanyTest() {
  const { id, round } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [internshipTitle, setInternshipTitle] = useState('')
  const [roundType, setRoundType] = useState(searchParams.get('type') || 'MCQ')
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState('30')
  const [questions, setQuestions] = useState([blankMcq()])
  const [theoryQuestions, setTheoryQuestions] = useState([blankTheory()])
  const [exists, setExists] = useState(false)
  const [locked, setLocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const isTheory = roundType === 'THEORY'

  useEffect(() => {
    api.get(`/company/internships/${id}`)
      .then((res) => setInternshipTitle(res.data.title))
      .catch(() => {})

    const endpoint = isTheory
      ? `/company/internships/${id}/rounds/${round}/theory`
      : `/company/internships/${id}/rounds/${round}/test`

    api.get(endpoint)
      .then((res) => {
        setTitle(res.data.title)
        setDuration(String(res.data.durationMinutes))
        setExists(true)
        setLocked(res.data.locked)
        if (isTheory) {
          setTheoryQuestions(res.data.questions.map((q) => ({ text: q.text, maxScore: q.maxScore })))
        } else {
          setQuestions(
            res.data.questions.map((q) => ({
              text: q.text,
              options: [...q.options],
              correctOption: q.correctOption,
            })),
          )
        }
      })
      .catch((err) => {
        if (err.response?.status !== 404) setError('Could not load the test')
      })
      .finally(() => setLoading(false))
  }, [id, round, isTheory])

  const touch = () => setSaved(false)

  const updateMcqQuestion = (index, patch) => {
    touch()
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)))
  }

  const updateMcqOption = (qIndex, oIndex, value) => {
    touch()
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qIndex
          ? { ...q, options: q.options.map((opt, j) => (j === oIndex ? value : opt)) }
          : q,
      ),
    )
  }

  const updateTheoryQuestion = (index, patch) => {
    touch()
    setTheoryQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)))
  }

  const save = async (e) => {
    e.preventDefault()
    setError('')
    setSaved(false)

    const dur = parseInt(duration, 10)
    if (Number.isNaN(dur) || dur < 5 || dur > 180) {
      setError('Duration must be between 5 and 180 minutes')
      return
    }

    setSaving(true)
    try {
      if (isTheory) {
        await api.put(`/company/internships/${id}/rounds/${round}/theory`, {
          title: title.trim(),
          durationMinutes: dur,
          questions: theoryQuestions.map((q) => ({ text: q.text.trim(), maxScore: Number(q.maxScore) || 10 })),
        })
      } else {
        await api.put(`/company/internships/${id}/rounds/${round}/test`, {
          title: title.trim(),
          durationMinutes: dur,
          questions: questions.map((q) => ({
            text: q.text.trim(),
            options: q.options.map((o) => o.trim()),
            correctOption: q.correctOption,
          })),
        })
      }
      setExists(true)
      setSaved(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save the round')
    } finally {
      setSaving(false)
    }
  }

  const deleteRound = async () => {
    if (!window.confirm('Delete this round? You can only delete the latest round if no students have started.')) return
    try {
      await api.delete(`/company/internships/${id}/rounds/${round}/test`)
      navigate(`/company/internships/${id}/rounds`)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete the round')
    }
  }

  if (loading) return <p className="text-slate-600">Loading...</p>

  return (
    <div className="mx-auto max-w-3xl">
      <Link to={`/company/internships/${id}/rounds`} className="text-sm text-slate-600 hover:text-indigo-600">
        ← Back to rounds
      </Link>

      <div className="mt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-indigo-600">
            Round {round}: {isTheory ? 'Written Theory Round' : 'Screening MCQ Test'}
          </h1>
          {internshipTitle && <p className="text-slate-600">{internshipTitle}</p>}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isTheory ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
          }`}
        >
          {isTheory ? 'Theory (Manual Grading)' : 'MCQ (Auto Grading)'}
        </span>
      </div>

      {locked && (
        <div className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          Students have already started taking this round. It is locked and can no longer be modified.
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {saved && <p className="mt-4 text-sm text-green-600">Saved successfully!</p>}

      <form onSubmit={save} className="mt-6 space-y-6">
        <div className="rounded-xl bg-white p-6 shadow space-y-4">
          <div>
            <label className="block text-sm font-medium">Round title</label>
            <input
              disabled={locked}
              value={title}
              onChange={(e) => { touch(); setTitle(e.target.value) }}
              placeholder={isTheory ? 'e.g. System Design & Architectural Theory' : 'e.g. Core Fundamentals Test'}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Duration (minutes, 5 to 180)</label>
            <input
              type="number"
              disabled={locked}
              value={duration}
              onChange={(e) => { touch(); setDuration(e.target.value) }}
              min="5"
              max="180"
              required
              className={inputClass}
            />
          </div>
        </div>

        {/* Questions list */}
        {isTheory ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Theory Questions ({theoryQuestions.length})</h2>
            {theoryQuestions.map((q, idx) => (
              <div key={idx} className="rounded-xl bg-white p-6 shadow">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Question {idx + 1}</span>
                  {!locked && theoryQuestions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => { touch(); setTheoryQuestions((qs) => qs.filter((_, i) => i !== idx)) }}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="mt-3">
                  <label className="block text-xs text-slate-500">Question prompt</label>
                  <textarea
                    rows={3}
                    disabled={locked}
                    value={q.text}
                    onChange={(e) => updateTheoryQuestion(idx, { text: e.target.value })}
                    placeholder="Enter the question or problem scenario for students to explain..."
                    required
                    className={inputClass}
                  />
                </div>
                <div className="mt-3 w-40">
                  <label className="block text-xs text-slate-500">Max score points</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    disabled={locked}
                    value={q.maxScore}
                    onChange={(e) => updateTheoryQuestion(idx, { maxScore: e.target.value })}
                    required
                    className={inputClass}
                  />
                </div>
              </div>
            ))}

            {!locked && theoryQuestions.length < 30 && (
              <button
                type="button"
                onClick={() => { touch(); setTheoryQuestions((qs) => [...qs, blankTheory()]) }}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                + Add Question
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Multiple-Choice Questions ({questions.length})</h2>
            {questions.map((q, idx) => (
              <div key={idx} className="rounded-xl bg-white p-6 shadow">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Question {idx + 1}</span>
                  {!locked && questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => { touch(); setQuestions((qs) => qs.filter((_, i) => i !== idx)) }}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="mt-3">
                  <label className="block text-xs text-slate-500">Question text</label>
                  <input
                    disabled={locked}
                    value={q.text}
                    onChange={(e) => updateMcqQuestion(idx, { text: e.target.value })}
                    required
                    className={inputClass}
                  />
                </div>
                <div className="mt-3 space-y-2">
                  <label className="block text-xs text-slate-500">Options (select the correct radio button)</label>
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        disabled={locked}
                        name={`correct-${idx}`}
                        checked={q.correctOption === optIdx}
                        onChange={() => updateMcqQuestion(idx, { correctOption: optIdx })}
                      />
                      <span className="w-5 text-sm font-medium">{LETTERS[optIdx]}</span>
                      <input
                        disabled={locked}
                        value={opt}
                        onChange={(e) => updateMcqOption(idx, optIdx, e.target.value)}
                        required
                        className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {!locked && questions.length < MAX_QUESTIONS && (
              <button
                type="button"
                onClick={() => { touch(); setQuestions((qs) => [...qs, blankMcq()]) }}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                + Add Question
              </button>
            )}
          </div>
        )}

        {!locked && (
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-indigo-600 px-6 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save round'}
            </button>
            {exists && (
              <button
                type="button"
                onClick={deleteRound}
                className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Delete round
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  )
}
