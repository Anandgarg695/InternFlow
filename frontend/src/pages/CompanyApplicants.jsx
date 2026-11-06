import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../services/api'
import { APPLICATION_STATUS, formatDateTime, safeUrl } from '../utils/application'

function parseSkills(s) {
  return (s || '').split(/[,;/\n]+/).map((x) => x.trim()).filter(Boolean)
}

function matchPercent(studentSkills, reqSkills) {
  const req = parseSkills(reqSkills)
  if (!req.length) return 100
  const stu = new Set(parseSkills(studentSkills).map((x) => x.toLowerCase().replace(/[^a-z0-9]/g, '')))
  const matched = req.filter((r) => {
    const norm = r.toLowerCase().replace(/[^a-z0-9]/g, '')
    return stu.has(norm) || Array.from(stu).some((s) => s.includes(norm) || norm.includes(s))
  })
  return Math.round((matched.length / req.length) * 100)
}

export default function CompanyApplicants() {
  const { id } = useParams()
  const [title, setTitle] = useState('')
  const [skillsRequired, setSkillsRequired] = useState('')
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
        setSkillsRequired(internship.data.skillsRequired || '')
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
    for (let r = 1; r <= applicant.currentRound && r <= testInfo.totalRounds; r++) {
      if (!results.some((x) => x.roundNumber === r)) {
        lines.push(`Round ${r}: not started yet`)
      }
    }
    return lines
  }

  if (loading) return <p className="text-slate-600">Loading applicants...</p>

  return (
    <div>
      <Link to="/company/internships" className="text-sm text-slate-600 hover:text-indigo-600">
        ← Back to my internships
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-indigo-600">Applicants</h1>
          <p className="mt-1 text-slate-700">{title}</p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/company/internships/${id}/rounds`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Manage test rounds
          </Link>
          <Link
            to={`/company/internships/${id}/interviews`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Interviews
          </Link>
          <Link
            to={`/company/internships/${id}/offers`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Offers
          </Link>
          <Link
            to={`/company/internships/${id}/interns`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Interns
          </Link>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {applicants.length === 0 && !error && (
        <p className="mt-6 rounded-xl bg-white p-6 text-slate-600 shadow">
          No students have applied to this internship yet.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {applicants.map((a) => {
          const status = APPLICATION_STATUS[a.status]
          const shortlisted = a.status === 'SHORTLISTED'
          const withdrawn = a.status === 'WITHDRAWN'
          const hasOffer = a.status === 'OFFERED' || a.status === 'SELECTED'
          const linkedin = safeUrl(a.linkedinUrl)
          const github = safeUrl(a.githubUrl)
          const lines = roundLines(a)
          const match = skillsRequired ? matchPercent(a.skills, skillsRequired) : null

          return (
            <div key={a.id} className="rounded-xl bg-white p-6 shadow">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">{a.fullName || 'Student'}</h2>
                  <p className="text-sm text-slate-500">{a.email}</p>
                  {a.phone && <p className="text-sm text-slate-500">{a.phone}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {match !== null && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        match >= 75
                          ? 'bg-emerald-100 text-emerald-800'
                          : match >= 50
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {match}% match
                    </span>
                  )}
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.style}`}>
                    {status.label}
                  </span>
                </div>
              </div>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">University</dt>
                  <dd className="font-medium">{a.university || '-'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Degree & branch</dt>
                  <dd className="font-medium">
                    {[a.degree, a.branch].filter(Boolean).join(' · ') || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Graduation year</dt>
                  <dd className="font-medium">{a.graduationYear ?? '-'}</dd>
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
                  <p>
                    Current round: {a.currentRound}
                    {testInfo.testExists ? ` of ${testInfo.totalRounds}` : ''}
                    {testInfo.testExists && a.currentRound >= testInfo.totalRounds ? ' (last round)' : ''}
                  </p>
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
                {withdrawn || hasOffer ? (
                  <span className="text-slate-500">
                    {withdrawn
                      ? 'The student withdrew this application.'
                      : 'This applicant has an offer. Manage it on the Offers page.'}
                  </span>
                ) : (
                  <>
                    {shortlisted && testInfo.testExists && a.currentRound < testInfo.totalRounds && (
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
                        className="rounded-md bg-red-600 px-3 py-1.5 text-white hover:bg-red-500"
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
