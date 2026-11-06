import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import api from '../services/api'
import { dashboardPath } from '../utils/roles'

export default function Home() {
  const user = useSelector((state) => state.auth.user)
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    api.get('/health')
      .then((res) => setHealth(res.data))
      .catch(() => setError(true))
  }, [])

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-12 shadow-xs text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Production-Ready Architecture
        </div>

        <h1 className="mt-6 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 max-w-3xl mx-auto leading-tight">
          Unified Platform for University Internships and Assessments
        </h1>

        <p className="mt-4 text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          From multi-round skill screening and company-graded written answers to built-in WebRTC interviews and verified digital certification.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {user ? (
            <Link
              to={dashboardPath(user.role)}
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              Go to Your Dashboard →
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 shadow-xs transition-colors"
              >
                Create Account
              </Link>
              <Link
                to="/login"
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Sign In
              </Link>
            </>
          )}
          <Link
            to="/verify"
            className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Verify a Certificate
          </Link>
        </div>

        {/* System Status Pill */}
        <div className="mt-8 pt-6 border-t border-slate-100 inline-flex items-center gap-3 text-xs text-slate-500">
          {error && <span className="text-red-600 font-medium">● Backend connection offline</span>}
          {!error && !health && <span>Checking platform connectivity...</span>}
          {health && (
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-medium text-slate-700">Platform Services:</span>
              <span>API ({health.status})</span>
              <span>·</span>
              <span>PostgreSQL ({health.database})</span>
              {health.uptimeSeconds && (
                <>
                  <span>·</span>
                  <span>Uptime: {Math.floor(health.uptimeSeconds / 60)}m</span>
                </>
              )}
            </span>
          )}
        </div>
      </section>

      {/* Core Platform Capabilities (4 Columns) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">01 / Screening</p>
          <h3 className="mt-2 text-base font-bold text-slate-900">Multi-Round Testing</h3>
          <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
            Timed MCQs with auto-grading and open-ended theory rounds with recruiter evaluation and custom rubrics.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">02 / Collaboration</p>
          <h3 className="mt-2 text-base font-bold text-slate-900">WebRTC Video Calls</h3>
          <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
            Encrypted browser-native video interview rooms with real-time signaling, screen sharing, and in-call chat.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">03 / Intelligence</p>
          <h3 className="mt-2 text-base font-bold text-slate-900">AI Shortlist & Skills</h3>
          <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
            Multi-factor candidate fit ranking based on skill overlap, academic standing, and targeted learning recommendations.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">04 / Credentialing</p>
          <h3 className="mt-2 text-base font-bold text-slate-900">Digital Certificates</h3>
          <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
            Verified internship completion certificates with public verification codes, tamper-resistant snapshots, and QR-ready URLs.
          </p>
        </div>
      </section>

      {/* Role Gateways (2 Balanced Cards) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800">
              For University Candidates
            </span>
            <h3 className="mt-3 text-lg font-bold text-slate-900">Advance Your Early Career</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Explore verified internship postings, analyze your skill match gaps before applying, complete screening assessments, and participate in online interviews.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <Link
              to="/student/internships"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Browse Open Positions →
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800">
              For Companies & Employers
            </span>
            <h3 className="mt-3 text-lg font-bold text-slate-900">Scale Technical Hiring & Mentorship</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Publish structured internships, evaluate applicants with customizable round sequences, schedule interviews, track mentor evaluations, and issue credentials.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <Link
              to="/company/internships"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Access Employer Portal →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
