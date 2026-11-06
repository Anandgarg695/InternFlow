import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../services/api'
import { WORK_MODES, formatDate, formatStipend } from '../utils/internship'
import { APPLICATION_STATUS, formatDateTime } from '../utils/application'

export default function InternshipDetail() {
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [application, setApplication] = useState(null)
  const [skillGap, setSkillGap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [note, setNote] = useState('')
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/internships/${id}`)
      .then((res) => setItem(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))

    api.get('/student/applications')
      .then((res) => setApplication(res.data.find((a) => String(a.internshipId) === String(id)) || null))
      .catch(() => setApplication(null))

    api.get(`/student/skillgap/internship/${id}`)
      .then((res) => setSkillGap(res.data))
      .catch(() => setSkillGap(null))
  }, [id])

  const apply = async (e) => {
    e.preventDefault()
    setError('')
    setApplying(true)
    try {
      const res = await api.post('/student/applications', {
        internshipId: Number(id),
        coverNote: note.trim() === '' ? null : note.trim(),
      })
      setApplication(res.data)
    } catch (err) {
      const data = err.response?.data
      setError(data?.fields?.coverNote || data?.error || 'Could not submit your application')
    } finally {
      setApplying(false)
    }
  }

  if (loading) return <p className="text-slate-600">Loading...</p>

  if (notFound) {
    return (
      <div className="rounded-xl bg-white p-8 shadow">
        <p className="text-slate-700">This internship is no longer available.</p>
        <Link to="/student/applications" className="mt-4 inline-block text-indigo-600 hover:underline">
          See my applications
        </Link>
        <span className="mx-2 text-slate-400">·</span>
        <Link to="/student/internships" className="inline-block text-indigo-600 hover:underline">
          Back to internships
        </Link>
      </div>
    )
  }

  const status = application ? APPLICATION_STATUS[application.status] : null

  return (
    <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow">
      <Link to="/student/internships" className="text-sm text-slate-600 hover:text-indigo-600">
        ← Back to internships
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-indigo-600">{item.title}</h1>
          <p className="mt-1 text-slate-700">{item.companyName || 'Company'}</p>
        </div>
        {skillGap && (
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              skillGap.matchScore >= 75
                ? 'bg-emerald-100 text-emerald-800'
                : skillGap.matchScore >= 50
                ? 'bg-amber-100 text-amber-800'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {skillGap.matchScore}% Skill Match
          </span>
        )}
      </div>

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

      {/* Skill Gap Analysis Box */}
      {skillGap && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
            <span>Skill Match & Gap Analysis</span>
            <span>{skillGap.matchScore}%</span>
          </div>

          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full transition-all duration-300 ${
                skillGap.matchScore >= 75 ? 'bg-emerald-500' : skillGap.matchScore >= 50 ? 'bg-amber-500' : 'bg-slate-500'
              }`}
              style={{ width: `${skillGap.matchScore}%` }}
            />
          </div>

          {skillGap.matchedSkills.length > 0 && (
            <div className="mt-3">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">Skills you have:</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {skillGap.matchedSkills.map((s) => (
                  <span key={s} className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                    ✓ {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {skillGap.missingSkills.length > 0 && (
            <div className="mt-3">
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Skills to brush up:</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {skillGap.recommendations.map((r) => (
                  <a
                    key={r.skill}
                    href={r.resourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs text-amber-900 transition hover:bg-amber-100"
                    title={r.suggestion}
                  >
                    <span>+ {r.skill}</span>
                    <span className="text-[10px] text-amber-600">↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <h2 className="mt-6 font-semibold">About this internship</h2>
      <p className="mt-2 whitespace-pre-line text-slate-700">{item.description}</p>

      <div className="mt-8 border-t pt-6">
        {application ? (
          <div>
            <p className="text-sm text-slate-600">
              You applied on {formatDateTime(application.appliedAt)}.
            </p>
            <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${status.style}`}>
              {status.label}
            </span>
            <p className="mt-3 text-sm">
              <Link to="/student/applications" className="text-indigo-600 hover:underline">
                See all my applications
              </Link>
            </p>
          </div>
        ) : item.acceptingApplications ? (
          <form onSubmit={apply} className="space-y-3">
            <label className="block text-sm font-medium" htmlFor="coverNote">
              Cover note (optional)
            </label>
            <textarea
              id="coverNote"
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tell the company why you are a good fit."
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
            />
            {error && (
              <p className="text-sm text-red-600">
                {error}{' '}
                {error.toLowerCase().includes('profile') && (
                  <Link to="/student/profile" className="underline">Go to my profile</Link>
                )}
              </p>
            )}
            <button
              type="submit"
              disabled={applying}
              className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {applying ? 'Submitting...' : 'Apply now'}
            </button>
          </form>
        ) : (
          <p className="text-sm text-slate-600">Applications for this internship are closed.</p>
        )}
      </div>
    </div>
  )
}
