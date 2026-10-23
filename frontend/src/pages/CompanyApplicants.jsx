import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../services/api'
import { APPLICATION_STATUS, formatDateTime, safeUrl } from '../utils/application'

export default function CompanyApplicants() {
  const { id } = useParams()
  const [title, setTitle] = useState('')
  const [applicants, setApplicants] = useState([])
  const [testInfo, setTestInfo] = useState({ testExists: false, totalRounds: 0, results: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get(`/company/internships/${id}`),
      api.get(`/company/internships/${id}/applications`),
      api.get(`/company/internships/${id}/test/results`),
    ])
      .then(([internship, list, results]) => {
        setTitle(internship.data.title)
        setApplicants(list.data)
        setTestInfo(results.data)
      })
      .catch(() => setError('Could not load the applicants for this internship'))
      .finally(() => setLoading(false))
  }, [id])

  const decide = async (applicationId, status) => {
    setError('')
    try {
      const res = await api.patch(`/company/applications/${applicationId}/status`, { status })
      setApplicants((current) => current.map((a) => (a.id === applicationId ? res.data : a)))
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update the application')
    }
  }

  const advance = async (applicationId) => {
    setError('')
    try {
      const res = await api.post(`/company/applications/${applicationId}/advance`)
      setApplicants((current) =>
        current.map((a) => (a.id === applicationId ? { ...a, currentRound: res.data.currentRound } : a)),
      )
    } catch (err) {
      setError(err.response?.data?.error || 'Could not move the applicant to the next round')
    }
  }

  const roundLines = (applicant) => {
    if (!testInfo.testExists) return []
    const results = testInfo.results
      .filter((r) => r.applicationId === applicant.id)
      .sort((x, y) => x.roundNumber - y.roundNumber)
    const lines = results.map((r) => {
      if (r.state === 'SUBMITTED') return `Round ${r.roundNumber}: ${r.score} / ${r.total}`
      if (r.state === 'EXPIRED') return `Round ${r.roundNumber}: time ran out, no score`
      return `Round ${r.roundNumber}: in progress`
    })
    const current = applicant.currentRound
    const hasCurrent = results.some((r) => r.roundNumber === current)
    if (applicant.status === 'SHORTLISTED' && current >= 1 && current <= testInfo.totalRounds && !hasCurrent) {
      lines.push(`Round ${current}: not started`)
    }
    return lines
  }

  if (loading) return <p className="text-slate-600">Loading applicants...</p>

  return (
    <div>
      <Link to="/company/internships" className="text-sm text-slate-600 hover:text-indigo-600">
        ← Back to my internships
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-indigo-600">Applicants</h1>
      {title && <p className="text-slate-600">{title}</p>}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {applicants.length === 0 && !error && (
        <p className="mt-6 rounded-xl bg-white p-6 text-slate-600 shadow">No applications yet.</p>
      )}

      <div className="mt-6 space-y-4">
        {applicants.map((a) => {
          const status = APPLICATION_STATUS[a.status]
          const linkedin = safeUrl(a.linkedinUrl)
          const github = safeUrl(a.githubUrl)
          const withdrawn = a.status === 'WITHDRAWN'
          const lines = roundLines(a)
          const shortlisted = a.status === 'SHORTLISTED'
          return (
            <div key={a.id} className="rounded-xl bg-white p-6 shadow">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{a.studentName}</h2>
                  <p className="text-sm text-slate-600">
                    {a.studentEmail}
                    {a.phone ? ` · ${a.phone}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Applied on {formatDateTime(a.appliedAt)}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.style}`}>
                  {status.label}
                </span>
              </div>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">Education</dt>
                  <dd className="font-medium">
                    {[a.degree, a.branch].filter(Boolean).join(', ')}
                    {a.university ? ` · ${a.university}` : ''}
                    {a.graduationYear ? ` (${a.graduationYear})` : ''}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">CGPA</dt>
                  <dd className="font-medium">{a.cgpa ?? '-'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-slate-500">Skills</dt>
                  <dd className="font-medium">{a.skills || '-'}</dd>
                </div>
              </dl>

              {a.bio && <p className="mt-3 whitespace-pre-line text-sm text-slate-600">{a.bio}</p>}

              {a.coverNote && (
                <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm">
                  <p className="font-medium text-slate-700">Cover note</p>
                  <p className="mt-1 whitespace-pre-line text-slate-600">{a.coverNote}</p>
                </div>
              )}

              {shortlisted && (
                <div className="mt-3 text-sm font-medium text-indigo-700">
                  <p>Current round: {a.currentRound}</p>
                  {lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              )}
              {!shortlisted && lines.length > 0 && (
                <div className="mt-3 text-sm text-slate-600">
                  {lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                {linkedin && (
                  <a href={linkedin} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                    LinkedIn
                  </a>
                )}
                {github && (
                  <a href={github} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                    GitHub
                  </a>
                )}
                <span className="flex-1" />
                {withdrawn ? (
                  <span className="text-slate-500">The student withdrew this application.</span>
                ) : (
                  <>
                    {shortlisted && testInfo.testExists && (
                      <button
                        onClick={() => advance(a.id)}
                        className="rounded-md bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-500"
                      >
                        Move to round {a.currentRound + 1}
                      </button>
                    )}
                    {a.status !== 'SHORTLISTED' && (
                      <button
                        onClick={() => decide(a.id, 'SHORTLISTED')}
                        className="rounded-md bg-green-600 px-3 py-1.5 text-white hover:bg-green-500"
                      >
                        Shortlist
                      </button>
                    )}
                    {a.status !== 'REJECTED' && (
                      <button
                        onClick={() => decide(a.id, 'REJECTED')}
                        className="rounded-md border border-red-300 px-3 py-1.5 text-red-600 hover:bg-red-50"
                      >
                        Reject
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}