import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../services/api'
import { APPLICATION_STATUS, safeUrl } from '../utils/application'

export default function CompanyApplicants() {
  const { id } = useParams()
  const [title, setTitle] = useState('')
  const [skillsRequired, setSkillsRequired] = useState('')
  const [applicants, setApplicants] = useState([])
  const [testInfo, setTestInfo] = useState({ testExists: false, totalRounds: 0, results: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // AI Shortlisting state
  const [aiRankings, setAiRankings] = useState([])
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [loadingAi, setLoadingAi] = useState(false)
  const [minScoreThreshold, setMinScoreThreshold] = useState(70)
  const [batchShortlisting, setBatchShortlisting] = useState(false)
  const [batchMessage, setBatchMessage] = useState('')
  const [filterTab, setFilterTab] = useState('ALL')

  const loadAll = () => {
    return Promise.all([
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
  }

  useEffect(() => {
    loadAll()
  }, [id])

  const loadAiRankings = async () => {
    setLoadingAi(true)
    setBatchMessage('')
    try {
      const res = await api.get(`/company/internships/${id}/ai-shortlist/rankings`)
      setAiRankings(res.data)
    } catch {
      setError('Could not load AI candidate rankings.')
    } finally {
      setLoadingAi(false)
    }
  }

  const toggleAi = () => {
    const next = !showAiPanel
    setShowAiPanel(next)
    if (next && aiRankings.length === 0) {
      loadAiRankings()
    }
  }

  const handleBatchShortlist = async () => {
    if (!window.confirm(`Shortlist all pending applicants with AI match score >= ${minScoreThreshold}%?`)) return
    setBatchShortlisting(true)
    setBatchMessage('')
    setError('')
    try {
      const res = await api.post(`/company/internships/${id}/ai-shortlist/batch`, {
        minScore: minScoreThreshold,
      })
      setBatchMessage(res.data.message)
      await Promise.all([loadAll(), loadAiRankings()])
    } catch (err) {
      setError(err.response?.data?.error || 'Batch shortlisting failed.')
    } finally {
      setBatchShortlisting(false)
    }
  }

  const decide = async (applicationId, status) => {
    setError('')
    try {
      const res = await api.patch(`/company/applications/${applicationId}/status`, { status })
      setApplicants((current) => current.map((a) => (a.id === applicationId ? res.data : a)))
      if (showAiPanel) {
        setAiRankings((current) =>
          current.map((r) => (r.applicationId === applicationId ? { ...r, status: res.data.status } : r)),
        )
      }
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
      if (r.state === 'SUBMITTED') {
        if (r.roundType === 'THEORY' && r.score === null) return `Round ${r.roundNumber} (Theory): submitted (needs grading)`
        return `Round ${r.roundNumber} (${r.roundType || 'MCQ'}): ${r.score} / ${r.total}`
      }
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

  // Map AI scores by applicationId
  const aiScoreMap = new Map(aiRankings.map((r) => [r.applicationId, r]))

  // Filter applicants
  const filteredApplicants = applicants.filter((a) => {
    if (filterTab === 'STRONG') {
      const rank = aiScoreMap.get(a.id)
      return rank ? rank.aiScore >= 75 : false
    }
    if (filterTab === 'PENDING') {
      return a.status === 'APPLIED'
    }
    return true
  })

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
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={toggleAi}
            className={`rounded-md px-3.5 py-1.5 text-sm font-semibold transition-all ${
              showAiPanel
                ? 'bg-purple-600 text-white shadow'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            🤖 {showAiPanel ? 'Hide AI Screening' : 'AI-Assisted Shortlist'}
          </button>
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
      {batchMessage && <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{batchMessage}</p>}

      {/* AI Candidate Shortlisting Drawer / Panel */}
      {showAiPanel && (
        <div className="mt-6 rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50/50 to-indigo-50/40 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <h2 className="text-lg font-bold text-slate-800">AI-Powered Shortlist Assistant</h2>
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                  Multidimensional Fit
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Calculates fit based on required skills (50%), academic standing (25%), and cover letter/portfolio (25%).
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-700">
                <span>Threshold:</span>
                <select
                  value={minScoreThreshold}
                  onChange={(e) => setMinScoreThreshold(Number(e.target.value))}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                >
                  <option value={60}>60% & up</option>
                  <option value={70}>70% & up (Recommended)</option>
                  <option value={80}>80% & up (Strict)</option>
                  <option value={90}>90% & up (Top matches)</option>
                </select>
              </div>

              <button
                onClick={handleBatchShortlist}
                disabled={batchShortlisting || loadingAi}
                className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50 shadow-sm transition-all"
              >
                {batchShortlisting ? 'Shortlisting...' : `Batch Shortlist (≥ ${minScoreThreshold}%)`}
              </button>
            </div>
          </div>

          {loadingAi ? (
            <p className="mt-4 text-xs text-slate-500">Analyzing applicant profiles and ranking candidates...</p>
          ) : aiRankings.length === 0 ? (
            <p className="mt-4 text-xs text-slate-500">No applicants available to analyze yet.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {aiRankings.slice(0, 3).map((r, idx) => (
                <div key={r.applicationId} className="rounded-lg bg-white p-3.5 shadow-sm border border-purple-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">#{idx + 1} {r.studentName}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        r.aiScore >= 75
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.aiScore >= 50
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {r.aiScore}% Match
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{r.studentEmail}</p>
                  <ul className="mt-2 space-y-1 text-[11px] text-slate-600">
                    {r.keyStrengths.slice(0, 2).map((s, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span className="line-clamp-1">{s}</span>
                      </li>
                    ))}
                  </ul>
                  {r.status === 'APPLIED' && (
                    <button
                      onClick={() => decide(r.applicationId, 'SHORTLISTED')}
                      className="mt-3 w-full rounded bg-indigo-50 py-1 font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      Shortlist Now
                    </button>
                  )}
                  {r.status !== 'APPLIED' && (
                    <p className="mt-3 text-center text-[10px] font-medium text-slate-400">
                      Status: {r.status}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mt-6 flex border-b border-slate-200 gap-4 text-sm font-medium">
        <button
          onClick={() => setFilterTab('ALL')}
          className={`pb-2 transition-colors ${
            filterTab === 'ALL'
              ? 'border-b-2 border-indigo-600 text-indigo-600 font-semibold'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          All Applicants ({applicants.length})
        </button>
        {aiRankings.length > 0 && (
          <button
            onClick={() => setFilterTab('STRONG')}
            className={`pb-2 transition-colors ${
              filterTab === 'STRONG'
                ? 'border-b-2 border-indigo-600 text-indigo-600 font-semibold'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Strong Matches (75%+) ({aiRankings.filter((r) => r.aiScore >= 75).length})
          </button>
        )}
        <button
          onClick={() => setFilterTab('PENDING')}
          className={`pb-2 transition-colors ${
            filterTab === 'PENDING'
              ? 'border-b-2 border-indigo-600 text-indigo-600 font-semibold'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Pending Review ({applicants.filter((a) => a.status === 'APPLIED').length})
        </button>
      </div>

      {filteredApplicants.length === 0 && !error && (
        <p className="mt-6 rounded-xl bg-white p-6 text-slate-600 shadow">
          No applicants match the selected filter.
        </p>
      )}

      <div className="mt-4 space-y-4">
        {filteredApplicants.map((a) => {
          const status = APPLICATION_STATUS[a.status]
          const shortlisted = a.status === 'SHORTLISTED'
          const withdrawn = a.status === 'WITHDRAWN'
          const hasOffer = a.status === 'OFFERED' || a.status === 'SELECTED'
          const linkedin = safeUrl(a.linkedinUrl)
          const github = safeUrl(a.githubUrl)
          const lines = roundLines(a)
          const aiRanking = aiScoreMap.get(a.id)

          return (
            <div key={a.id} className="rounded-xl bg-white p-6 shadow">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-800">{a.fullName || 'Student'}</h2>
                    {aiRanking && (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          aiRanking.aiScore >= 75
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : aiRanking.aiScore >= 50
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        🤖 AI Fit: {aiRanking.aiScore}%
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{a.email}</p>
                  {a.phone && <p className="text-sm text-slate-500">{a.phone}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.style}`}>
                    {status.label}
                  </span>
                </div>
              </div>

              {aiRanking && aiRanking.keyStrengths && aiRanking.keyStrengths.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {aiRanking.keyStrengths.map((str, idx) => (
                    <span key={idx} className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      ✓ {str}
                    </span>
                  ))}
                </div>
              )}

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
                    {shortlisted && testInfo.testExists && (
                      testInfo.results.some((r) => r.applicationId === a.id && r.roundType === 'THEORY' && r.state === 'SUBMITTED') && (
                        <Link
                          to={`/company/internships/${id}/rounds/${a.currentRound}/grade/${a.id}`}
                          className="rounded-md bg-purple-600 px-3 py-1.5 text-white hover:bg-purple-500 text-sm font-medium"
                        >
                          Grade Written Theory
                        </Link>
                      )
                    )}
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
