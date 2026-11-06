import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../services/api'

const LETTERS = ['A', 'B', 'C', 'D']

const formatRemaining = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export default function StudentTest() {
  const { id } = useParams()
  const [info, setInfo] = useState(null)
  const [test, setTest] = useState(null)
  const [answers, setAnswers] = useState([])
  const [theoryAnswers, setTheoryAnswers] = useState({})
  const [deadline, setDeadline] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [result, setResult] = useState(null)
  const [review, setReview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const answersRef = useRef([])
  const theoryAnswersRef = useRef({})
  const submittingRef = useRef(false)

  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  useEffect(() => {
    theoryAnswersRef.current = theoryAnswers
  }, [theoryAnswers])

  const loadInfo = useCallback(() => {
    return api.get(`/student/applications/${id}/test`)
      .then((res) => {
        setInfo(res.data)
        if (res.data.state === 'SUBMITTED' && res.data.roundType === 'THEORY') {
          api.get(`/student/applications/${id}/test/theory/review`)
            .then((r) => setReview(r.data))
            .catch(() => {})
        }
      })
      .catch(() => setError('Could not load the test'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    loadInfo()
  }, [loadInfo])

  const submit = useCallback(async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    setBusy(true)
    setError('')
    try {
      if (info?.roundType === 'THEORY') {
        const payload = Object.entries(theoryAnswersRef.current).map(([qId, txt]) => ({
          questionId: Number(qId),
          answerText: txt || '',
        }))
        const res = await api.post(`/student/applications/${id}/test/theory/submit`, { answers: payload })
        setResult(res.data)
      } else {
        const res = await api.post(`/student/applications/${id}/test/submit`, { answers: answersRef.current })
        setResult(res.data)
      }
      setTest(null)
      loadInfo()
    } catch (err) {
      if (err.response?.status === 409) {
        setTest(null)
        setError(err.response.data?.error || 'The round is closed')
        loadInfo()
      } else {
        submittingRef.current = false
        setError(err.response?.data?.error || 'Could not submit. Try again.')
      }
    } finally {
      setBusy(false)
    }
  }, [id, info?.roundType, loadInfo])

  useEffect(() => {
    if (!test) return undefined
    const timer = setInterval(() => {
      const left = deadline - Date.now()
      setRemaining(left)
      if (left <= 0) submit()
    }, 1000)
    return () => clearInterval(timer)
  }, [test, deadline, submit])

  const start = async () => {
    setError('')
    setBusy(true)
    try {
      const endpoint = info?.roundType === 'THEORY'
        ? `/student/applications/${id}/test/theory/start`
        : `/student/applications/${id}/test/start`
      const res = await api.post(endpoint, {})
      const offset = new Date(res.data.serverNow).getTime() - Date.now()
      const deadlineOnThisClock = new Date(res.data.deadlineAt).getTime() - offset
      submittingRef.current = false
      if (info?.roundType === 'THEORY') {
        const initial = {}
        res.data.questions.forEach((q) => { initial[q.id] = '' })
        setTheoryAnswers(initial)
      } else {
        setAnswers(Array(res.data.questions.length).fill(null))
      }
      setDeadline(deadlineOnThisClock)
      setRemaining(deadlineOnThisClock - Date.now())
      setTest(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not start the test')
    } finally {
      setBusy(false)
    }
  }

  const chooseMcq = (questionIndex, optionIndex) =>
    setAnswers((current) => current.map((a, i) => (i === questionIndex ? optionIndex : a)))

  const updateTheory = (questionId, text) =>
    setTheoryAnswers((prev) => ({ ...prev, [questionId]: text }))

  if (loading) return <p className="text-slate-600">Loading...</p>

  const backLink = (
    <Link to="/student/applications" className="text-sm text-slate-600 hover:text-indigo-600">
      ← Back to my applications
    </Link>
  )

  // Taking the test
  if (test) {
    const isTheory = info?.roundType === 'THEORY'
    const answeredCount = isTheory
      ? Object.values(theoryAnswers).filter((t) => t.trim().length > 0).length
      : answers.filter((a) => a !== null).length

    return (
      <div className="mx-auto max-w-3xl">
        <div className="sticky top-0 z-10 -mx-4 mb-4 flex items-center justify-between bg-slate-100 px-4 py-3">
          <div>
            <h1 className="text-xl font-bold text-indigo-600">{test.title}</h1>
            <p className="text-sm text-slate-600">
              {answeredCount} of {test.questions.length} answered · {isTheory ? 'Written Theory' : 'MCQ'}
            </p>
          </div>
          <div className={`text-2xl font-mono font-bold ${remaining < 60000 ? 'text-red-600' : 'text-slate-700'}`}>
            {formatRemaining(remaining)}
          </div>
        </div>

        <div className="space-y-4">
          {test.questions.map((q, idx) => (
            <div key={q.id || idx} className="rounded-xl bg-white p-6 shadow">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-slate-800">{idx + 1}. {q.text}</p>
                {isTheory && (
                  <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {q.maxScore} pts
                  </span>
                )}
              </div>

              {isTheory ? (
                <div className="mt-3">
                  <textarea
                    rows={4}
                    value={theoryAnswers[q.id] || ''}
                    onChange={(e) => updateTheory(q.id, e.target.value)}
                    placeholder="Type your explanation or response here..."
                    className="w-full rounded-md border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {q.options.map((option, oi) => (
                    <label key={oi} className="flex cursor-pointer items-center gap-3 text-sm">
                      <input
                        type="radio"
                        name={`q${idx}`}
                        checked={answers[idx] === oi}
                        onChange={() => chooseMcq(idx, oi)}
                      />
                      <span className="font-medium text-slate-500">{LETTERS[oi]}</span>
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <button
          onClick={() => {
            if (window.confirm('Submit your answers now? You cannot change them afterwards.')) submit()
          }}
          disabled={busy}
          className="mt-6 rounded-md bg-indigo-600 px-6 py-2.5 font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {busy ? 'Submitting...' : 'Submit round'}
        </button>
        <p className="mt-2 text-xs text-slate-500">
          Answers are submitted automatically when the countdown ends.
        </p>
      </div>
    )
  }

  // Result right after submit
  if (result) {
    return (
      <div className="mx-auto max-w-xl rounded-xl bg-white p-8 shadow">
        {backLink}
        <h1 className="mt-3 text-2xl font-bold text-indigo-600">Round submitted</h1>
        {result.score !== null ? (
          <p className="mt-3 text-lg">You scored {result.score} out of {result.total}.</p>
        ) : (
          <div className="mt-3 rounded-md bg-purple-50 p-4 text-purple-900">
            <p className="font-semibold">Written answers submitted for grading</p>
            <p className="mt-1 text-sm text-purple-800">
              Your submission will be reviewed and graded by the recruiting team. You will be notified once scores are published.
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl rounded-xl bg-white p-8 shadow">
      {backLink}
      <h1 className="mt-3 text-2xl font-bold text-indigo-600">
        {info ? `Round ${info.roundNumber}: ${info.roundType === 'THEORY' ? 'Written Theory' : 'MCQ Test'}` : 'Test'}
      </h1>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {info?.state === 'NO_TEST' && (
        <p className="mt-4 text-slate-700">
          There is no test for this round yet. The company will contact you if there is a next step.
        </p>
      )}

      {(info?.state === 'NOT_STARTED' || info?.state === 'IN_PROGRESS') && (
        <div className="mt-4">
          <p className="font-medium text-slate-800">{info.title}</p>
          <p className="mt-1 text-sm text-slate-600">
            {info.questionCount} {info.roundType === 'THEORY' ? 'written questions' : 'multiple-choice questions'} · {info.durationMinutes} minutes
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>You get one attempt.</li>
            <li>The timer starts when you click the button and continues even if you close the page.</li>
            <li>When time runs out, your answers are submitted automatically.</li>
          </ul>
          {info.state === 'IN_PROGRESS' && (
            <p className="mt-3 text-sm text-amber-700">
              You already started this round and the timer is running. Continue now.
            </p>
          )}
          <button
            onClick={start}
            disabled={busy}
            className="mt-5 rounded-md bg-indigo-600 px-5 py-2 text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {busy ? 'Please wait...' : info.state === 'IN_PROGRESS' ? 'Continue round' : 'Start round'}
          </button>
        </div>
      )}

      {info?.state === 'SUBMITTED' && (
        <div className="mt-4">
          {info.roundType === 'THEORY' ? (
            info.score === null ? (
              <div className="rounded-md bg-purple-50 p-4 text-purple-900">
                <p className="font-semibold">Awaiting Company Review</p>
                <p className="mt-1 text-sm text-purple-800">
                  Your written answers have been submitted and are waiting to be graded by the company.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-semibold text-emerald-800">
                  Graded: You scored {info.score} out of {info.total} points.
                </p>
                {review && review.answers && (
                  <div className="mt-4 space-y-3">
                    <h3 className="font-semibold text-sm text-slate-700">Review & Feedback:</h3>
                    {review.answers.map((a, i) => (
                      <div key={i} className="rounded-lg border border-slate-200 p-3 text-sm">
                        <div className="flex justify-between font-medium">
                          <span>Q{i + 1}: {a.questionText}</span>
                          <span className="text-indigo-600">{a.score} / {a.maxScore} pts</span>
                        </div>
                        <p className="mt-2 text-slate-600 text-xs italic bg-slate-50 p-2 rounded">
                          Your answer: {a.answerText}
                        </p>
                        {a.feedback && (
                          <p className="mt-1 text-xs text-emerald-700 font-medium">
                            Feedback: {a.feedback}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          ) : (
            <div>
              <p className="text-lg">You scored {info.score} out of {info.total}.</p>
              <p className="mt-2 text-sm text-slate-600">The company will let you know if you move to the next round.</p>
            </div>
          )}
        </div>
      )}

      {info?.state === 'EXPIRED' && (
        <p className="mt-4 text-slate-700">
          The time for this round ran out before it was submitted.
        </p>
      )}
    </div>
  )
}
