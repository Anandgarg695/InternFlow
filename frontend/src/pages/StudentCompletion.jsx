import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../services/api'
import TaskSummary from '../components/TaskSummary'
import EvaluationCard from '../components/EvaluationCard'
import CertificateBox from '../components/CertificateBox'

export default function StudentCompletion() {
  const { placementId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    api.get(`/student/placements/${placementId}/completion`)
      .then((res) => setData(res.data))
      .catch(() => setMissing(true))
      .finally(() => setLoading(false))
  }, [placementId])

  if (loading) return <p className="text-slate-600">Loading...</p>

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/student/placements" className="text-sm text-slate-600 hover:text-indigo-600">
        ← Back to my internship
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-indigo-600">Final evaluation and certificate</h1>

      {missing && (
        <p className="mt-6 rounded-xl bg-white p-6 text-slate-600 shadow">
          This is not available yet. It appears after the company completes your internship.
        </p>
      )}

      {data && (
        <div className="mt-6 space-y-4 rounded-xl bg-white p-6 shadow">
          {data.certificate && <CertificateBox certificate={data.certificate} />}

          <div>
            <h2 className="font-semibold">Your tasks</h2>
            <TaskSummary tasks={data.tasks} />
          </div>

          {data.evaluation && (
            <div>
              <h2 className="mb-2 font-semibold">Your mentor's evaluation</h2>
              <EvaluationCard evaluation={data.evaluation} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}