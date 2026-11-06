import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { register } from '../store/authActions'
import { dashboardPath } from '../utils/roles'

export default function Register() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const currentUser = useSelector((state) => state.auth.user)
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'STUDENT' })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)

  if (currentUser) return <Navigate to={dashboardPath(currentUser.role)} replace />

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const setRole = (role) => setForm({ ...form, role })

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setLoading(true)
    try {
      const user = await dispatch(register(form))
      navigate(dashboardPath(user.role), { replace: true })
    } catch (err) {
      const data = err.response?.data
      setError(data?.error || 'Could not reach the server')
      setFieldErrors(data?.fields || {})
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* Left Side: Solid Slate Info Panel */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between bg-slate-900 p-10 text-white">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 font-bold text-sm text-white">
                IF
              </div>
              <span className="text-lg font-bold tracking-tight text-white">InternFlow</span>
            </div>

            <div className="mt-12">
              <h2 className="text-2xl font-bold tracking-tight text-white leading-snug">
                Join the verified early-career recruitment network.
              </h2>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                Whether you're a student building a technical track record, an employer evaluating engineering talent, or an academic mentor guiding placements.
              </p>
            </div>

            <div className="mt-8 space-y-3.5 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-indigo-400 font-bold text-[10px]">
                  ✓
                </span>
                <span>Students: AI skill-gap matching & online tests</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-indigo-400 font-bold text-[10px]">
                  ✓
                </span>
                <span>Companies: Multi-round hiring & video rooms</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-indigo-400 font-bold text-[10px]">
                  ✓
                </span>
                <span>Mentors: Task reviews & performance ratings</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 text-[11px] text-slate-400">
            Compliant with institutional certification & data privacy guidelines.
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="lg:col-span-7 flex flex-col justify-center p-8 sm:p-12">
          <div className="w-full max-w-md mx-auto">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create your account</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Choose your role and register to access the platform.
              </p>
            </div>

            {/* Segmented Role Selector */}
            <div className="mt-6">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Account Type
              </label>
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setRole('STUDENT')}
                  className={`rounded-md py-1.5 text-xs font-semibold transition-all ${
                    form.role === 'STUDENT'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('COMPANY')}
                  className={`rounded-md py-1.5 text-xs font-semibold transition-all ${
                    form.role === 'COMPANY'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Company
                </button>
                <button
                  type="button"
                  onClick={() => setRole('MENTOR')}
                  className={`rounded-md py-1.5 text-xs font-semibold transition-all ${
                    form.role === 'MENTOR'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Mentor
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700" htmlFor="fullName">
                  Full Name / Organization Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  required
                  placeholder="e.g. John Doe or Acme Corp"
                  value={form.fullName}
                  onChange={onChange}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-colors"
                />
                {fieldErrors.fullName && <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="name@organization.com"
                  value={form.email}
                  onChange={onChange}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-colors"
                />
                {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700" htmlFor="password">
                  Password (8+ characters)
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={onChange}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-colors"
                />
                {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-lg bg-slate-900 py-2.5 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {loading ? 'Registering...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-200 pt-4 text-center text-xs text-slate-500">
              Already registered?{' '}
              <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
                Sign in here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
