import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import api from '../services/api'
import { formatDate } from '../utils/internship'
import TaskSummary from '../components/TaskSummary'
import EvaluationCard from '../components/EvaluationCard'
import CertificateBox from '../components/CertificateBox'

export default function CompanyInternProgress() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/company/placements/${id}/progress`)
      .then((res) => setData(res.data))
      .catch(() => setError('Could not load this intern'))
      .finally(() => setLoading(false))
  }, [id])

  const complete = async () => {
    if (!window.confirm('Complete this internship and issue the certificate? This cannot be undone.')) return
    setError('')
    setBusy(true)
    try {
      const res = await api.post(`/company/placements/${id}/complete`)
      setData(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not complete the internship')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p className="text-slate-600">Loading...</p>

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl">
        <Link to="/company/internships" className="text-sm text-slate-600 hover:text-indigo-600">
          ← Back to my internships
        </Link>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    )
  }

  const completed = data.status === 'COMPLETED'

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/company/internships" className="text-sm text-slate-600 hover:text-indigo-600">
        ← Back to my internships
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-indigo-600">Intern progress</h1>
      <p className="text-slate-600">
        {data.studentName} · {data.internshipTitle}
      </p>
      <p className="text-sm text-slate-600">
        {formatDate(data.startDate)} to {formatDate(data.endDate)} · Mentor: {data.mentorName || 'not assigned'}
      </p>

      <div className="mt-6 space-y-4 rounded-xl bg-white p-6 shadow">
        <div>
          <h2 className="font-semibold">Tasks</h2>
          <TaskSummary tasks={data.tasks} />
        </div>

        <div>
          <h2 className="mb-2 font-semibold">Final evaluation</h2>
          {data.evaluation ? (
            <EvaluationCard evaluation={data.evaluation} />
          ) : (
            <p className="text-sm text-slate-500">The mentor has not written it yet.</p>
          )}
        </div>

        {completed && data.certificate && <CertificateBox certificate={data.certificate} />}

        {!completed && (
          <div>
            {!data.canComplete && data.blockReason && (
              <p className="mb-3 rounded-md bg-amber-50 p-3 text-sm text-amber-800">{data.blockReason}</p>
            )}
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
            <button
              onClick={complete}
              disabled={!data.canComplete || busy}
              className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {busy ? 'Completing...' : 'Complete internship and issue certificate'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}