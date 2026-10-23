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
  const [deadline, setDeadline] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const answersRef = useRef([])
  const submittingRef = useRef(false)

  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  const loadInfo = useCallback(
    () =>
      api.get(`/student/applications/${id}/test`)
        .then((res) => setInfo(res.data))
        .catch(() => setError('Could not load the test'))
        .finally(() => setLoading(false)),
    [id],
  )

  useEffect(() => {
    loadInfo()
  }, [loadInfo])

  const submit = useCallback(async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    setBusy(true)
    setError('')
    try {
      const res = await api.post(`/student/applications/${id}/test/submit`, { answers: answersRef.current })
      setResult(res.data)
      setTest(null)
    } catch (err) {
      if (err.response?.status === 409) {
        // Time ran out or already submitted: stop the timer and show the real state
        setTest(null)
        setError(err.response.data?.error || 'The test is closed')
        loadInfo()
      } else {
        submittingRef.current = false
        setError(err.response?.data?.error || 'Could not submit the test. Try again.')
      }
    } finally {
      setBusy(false)
    }
  }, [id, loadInfo])

  // Countdown. The server decides the real deadline; this only shows it.
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
      const res = await api.post(`/student/applications/${id}/test/start`, {})
      // Correct for a wrong clock on this computer using the server's time
      const offset = new Date(res.data.serverNow).getTime() - Date.now()
      const deadlineOnThisClock = new Date(res.data.deadlineAt).getTime() - offset
      submittingRef.current = false
      setAnswers(Array(res.data.questions.length).fill(null))
      setDeadline(deadlineOnThisClock)
      setRemaining(deadlineOnThisClock - Date.now())
      setTest(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not start the test')
    } finally {
      setBusy(false)
    }
  }

  const choose = (questionIndex, optionIndex) =>
    setAnswers((current) => current.map((a, i) => (i === questionIndex ? optionIndex : a)))

  if (loading) return <p className="text-slate-600">Loading...</p>

  const backLink = (
    <Link to="/student/applications" className="text-sm text-slate-600 hover:text-indigo-600">
      ← Back to my applications
    </Link>
  )

  // ---- taking the test
  if (test) {
    const answered = answers.filter((a) => a !== null).length
    return (
      <div className="mx-auto max-w-3xl">
        <div className="sticky top-0 z-10 -mx-4 mb-4 flex items-center justify-between bg-slate-100 px-4 py-3">
          <div>
            <h1 className="text-xl font-bold text-indigo-600">{test.title}</h1>
            <p className="text-sm text-slate-600">{answered} of {test.questions.length} answered</p>
          </div>
          <div className={`text-2xl font-mono font-bold ${remaining < 60000 ? 'text-red-600' : 'text-slate-700'}`}>
            {formatRemaining(remaining)}
          </div>
        </div>

        <div className="space-y-4">
          {test.questions.map((q, qi) => (
            <div key={qi} className="rounded-xl bg-white p-6 shadow">
              <p className="font-medium">{qi + 1}. {q.text}</p>
              <div className="mt-3 space-y-2">
                {q.options.map((option, oi) => (
                  <label key={oi} className="flex cursor-pointer items-center gap-3 text-sm">
                    <input
                      type="radio"
                      name={`q${qi}`}
                      checked={answers[qi] === oi}
                      onChange={() => choose(qi, oi)}
                    />
                    <span className="font-medium text-slate-500">{LETTERS[oi]}</span>
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <button
          onClick={() => {
            if (window.confirm('Submit your answers now? You cannot change them afterwards.')) submit()
          }}
          disabled={busy}
          className="mt-6 rounded-md bg-indigo-600 px-5 py-2 text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {busy ? 'Submitting...' : 'Submit test'}
        </button>
        <p className="mt-2 text-xs text-slate-500">
          Your answers are sent when you submit or when the time ends. Do not refresh this page: the timer
          keeps running, and answers you have not submitted are lost.
        </p>
      </div>
    )
  }

  // ---- just submitted
  if (result) {
    return (
      <div className="mx-auto max-w-xl rounded-xl bg-white p-8 shadow">
        {backLink}
        <h1 className="mt-3 text-2xl font-bold text-indigo-600">Test submitted</h1>
        <p className="mt-3 text-lg">You scored {result.score} out of {result.total}.</p>
        <p className="mt-2 text-sm text-slate-600">The company will see your score next to your application.</p>
      </div>
    )
  }

  // ---- everything else
  return (
    <div className="mx-auto max-w-xl rounded-xl bg-white p-8 shadow">
      {backLink}
        <h1 className="mt-3 text-2xl font-bold text-indigo-600">
           {info ? `Round ${info.roundNumber} of your hiring process` : 'Test'}
        </h1>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {info?.state === 'NO_TEST' && (
        <p className="mt-4 text-slate-700">
          There is no test for this round yet. The company will contact you if there is a next step.
        </p>
      )}

      {(info?.state === 'NOT_STARTED' || info?.state === 'IN_PROGRESS') && (
        <div className="mt-4">
          <p className="font-medium">{info.title}</p>
          <p className="mt-1 text-sm text-slate-600">
            {info.questionCount} questions · {info.durationMinutes} minutes
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>You get one attempt.</li>
            <li>The timer starts when you click the button and keeps running if you close the page.</li>
            <li>When time runs out, your answers are submitted automatically.</li>
          </ul>
          {info.state === 'IN_PROGRESS' && (
            <p className="mt-3 text-sm text-amber-700">
              You already started this test and the timer is still running. Continue now.
            </p>
          )}
          <button
            onClick={start}
            disabled={busy}
            className="mt-5 rounded-md bg-indigo-600 px-5 py-2 text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {busy ? 'Please wait...' : info.state === 'IN_PROGRESS' ? 'Continue test' : 'Start test'}
          </button>
        </div>
      )}

      {info?.state === 'SUBMITTED' && (
          <div className="mt-4">
             <p className="text-lg">You scored {info.score} out of {info.total}.</p>
             <p className="mt-2 text-sm text-slate-600">
               The company will let you know if you move to the next round.
             </p>
          </div>
      )}

      {info?.state === 'EXPIRED' && (
        <p className="mt-4 text-slate-700">
          The time for this test ran out before it was submitted, so no score was recorded.
        </p>
      )}
    </div>
  )
}