import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../services/api'
import { WORK_MODES, formatDate, formatStipend } from '../utils/internship'

export default function InternshipDetail() {
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    api.get(`/internships/${id}`)
      .then((res) => setItem(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-slate-600">Loading...</p>

  if (notFound) {
    return (
      <div className="rounded-xl bg-white p-8 shadow">
        <p className="text-slate-700">This internship is no longer available.</p>
        <Link to="/student/internships" className="mt-4 inline-block text-indigo-600 hover:underline">
          Back to internships
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow">
      <Link to="/student/internships" className="text-sm text-slate-600 hover:text-indigo-600">
        ← Back to internships
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-indigo-600">{item.title}</h1>
      <p className="mt-1 text-slate-700">{item.companyName || 'Company'}</p>

      <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Work mode</dt>
          <dd className="font-medium">
            {WORK_MODES[item.workMode]}
            {item.location ? ` · ${item.location}` : ''}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Duration</dt>
          <dd className="font-medium">{item.durationWeeks} weeks</dd>
        </div>
        <div>
          <dt className="text-slate-500">Stipend</dt>
          <dd className="font-medium">{formatStipend(item.stipendPerMonth)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Openings</dt>
          <dd className="font-medium">{item.openings}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Apply by</dt>
          <dd className="font-medium">{formatDate(item.applicationDeadline)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Skills required</dt>
          <dd className="font-medium">{item.skillsRequired}</dd>
        </div>
      </dl>

      <h2 className="mt-6 font-semibold">About this internship</h2>
      <p className="mt-2 whitespace-pre-line text-slate-700">{item.description}</p>

      <button
        disabled
        className="mt-8 rounded-md bg-indigo-600 px-4 py-2 text-white opacity-50"
        title="Applications are coming in the next step"
      >
        Apply (coming soon)
      </button>
    </div>
  )
}